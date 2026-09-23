// POST /api/admin-import-journal
// Mengimpor CSV yang diekspor dari tab rekomendasi Google Sheets. Ini sengaja
// menjadi langkah awal yang aman: spreadsheet tetap privat dan admin cukup
// export CSV setelah update, tanpa akun Google pribadi atau service account.

const { isAuthed, serviceClient, readJsonBody } = require('./_lib/auth');

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]; const next = text[i + 1];
    if (ch === '"' && quote && next === '"') { cell += '"'; i += 1; }
    else if (ch === '"') quote = !quote;
    else if (ch === ',' && !quote) { row.push(cell.trim()); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quote) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell.trim()); cell = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function heading(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function parseDate(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) ? null : iso;
}

function parseNumber(value) {
  const cleaned = String(value || '').replace(/Rp|\./gi, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  // Sel kosong bukan harga Rp0. Ini krusial untuk HARGA EXIT REAL pada
  // sinyal OPEN: jika dibaca 0, P/L akan keliru menjadi -100%.
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseRange(value) {
  const values = String(value || '').split(/[-–—]/).map(parseNumber).filter((n) => n !== null);
  if (!values.length) return { low: null, high: null, average: null };
  const low = Math.min(...values); const high = Math.max(...values);
  return { low, high, average: (low + high) / 2 };
}

function monday(date) {
  const d = new Date(`${date}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

function friday(weekStart) {
  const d = new Date(`${weekStart}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 4);
  return d.toISOString().slice(0, 10);
}

// Return IHSG untuk pembanding periode yang SAMA. Yahoo adalah sumber harga
// referensi yang sudah dipakai ticker situs; kalau data indeks tidak tersedia
// (mis. pekan belum selesai), tampilkan kosong, jangan isi angka tebak-tebakan.
async function fetchIhsgReturns(weeks) {
  const values = new Map();
  if (!weeks.length) return values;
  const start = Math.floor(Date.parse(`${weeks[0].weekStart}T00:00:00Z`) / 1000);
  const end = Math.floor(Date.parse(`${weeks[weeks.length - 1].weekEnd}T23:59:59Z`) / 1000) + 1;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?period1=${start}&period2=${end}&interval=1d`;
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TII-track-record/1.0)' } });
    if (!response.ok) return values;
    const result = (await response.json())?.chart?.result?.[0];
    const dates = result?.timestamp || []; const prices = result?.indicators?.quote?.[0]?.close || [];
    const byDate = new Map();
    prices.forEach((price, i) => { if (typeof price === 'number' && price > 0) byDate.set(new Date(dates[i] * 1000).toISOString().slice(0, 10), price); });
    weeks.forEach(({ weekStart, weekEnd }) => {
      const closes = [...byDate.entries()].filter(([date]) => date >= weekStart && date <= weekEnd).map(([, price]) => price);
      if (closes.length >= 2) values.set(weekStart, Number((((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2)));
    });
  } catch {
    return values;
  }
  return values;
}

function mapStatus(raw) {
  const value = String(raw || '').toUpperCase();
  if (value.includes('REKOM BARU')) return 'PENDING';
  if (value.includes('DONE TP')) return 'WIN';
  if (value.includes('DONE SL')) return 'STOPPED';
  if (value.includes('FLOATING')) return 'OPEN';
  if (value.includes('CANCEL')) return 'CANCELLED';
  if (value.includes('LOSS')) return 'LOSS';
  return 'OPEN';
}

function columnIndex(headers, name) { return headers.findIndex((h) => h === name); }
function valueAt(row, index) { return index >= 0 ? row[index] : ''; }

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!isAuthed(req)) return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Login ulang.' });

  const { csv } = await readJsonBody(req);
  if (typeof csv !== 'string' || csv.length > 750000) return res.status(400).json({ error: 'CSV kosong atau terlalu besar.' });
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''));
  if (rows.length < 2) return res.status(400).json({ error: 'CSV tidak memiliki data.' });
  const headers = rows[0].map(heading);
  const required = ['TANGGAL REKOM', 'NAMA EMITEN', 'GAYA TRADE', 'ENTRY 1', 'TARGET', 'SL', 'STATUS', 'TANGGAL DONE'];
  const missing = required.filter((name) => !headers.includes(name));
  if (missing.length) return res.status(400).json({ error: `Kolom belum cocok: ${missing.join(', ')}.` });

  const ix = Object.fromEntries(headers.map((h, i) => [h, i]));
  const signals = [];
  const issues = [];
  for (const [rowNumber, row] of rows.slice(1).entries()) {
    // Google Sheets mengikutkan baris template kosong saat diunduh. Lewati tanpa
    // menandainya sebagai error agar ringkasan import tidak membingungkan admin.
    if (!valueAt(row, ix['TANGGAL REKOM']) && !valueAt(row, ix['NAMA EMITEN'])) continue;
    const recommendationDate = parseDate(valueAt(row, ix['TANGGAL REKOM']));
    const symbol = String(valueAt(row, ix['NAMA EMITEN'])).toUpperCase().replace(/\s*\([^)]*\)/g, '').replace(/[^A-Z0-9]/g, '');
    const entry = parseRange(valueAt(row, ix['AVG REKOM']) || valueAt(row, ix['ENTRY 1']));
    if (!recommendationDate || !/^[A-Z0-9]{2,16}$/.test(symbol) || entry.average === null) {
      issues.push(`Baris ${rowNumber + 2}: tanggal, emiten, atau entry tidak valid.`); continue;
    }
    const rawStatus = String(valueAt(row, ix.STATUS) || '').trim();
    const status = mapStatus(rawStatus);
    const target = parseNumber(valueAt(row, ix.TARGET));
    const stop = parseNumber(valueAt(row, ix.SL));
    const realExit = parseNumber(valueAt(row, ix['HARGA EXIT REAL']));
    const recordedPnl = parseNumber(valueAt(row, ix['GAIN/LOSS %']));
    let pnl = null;
    if (status !== 'OPEN' && status !== 'CANCELLED' && recordedPnl !== null) pnl = recordedPnl;
    else if (realExit !== null) pnl = ((realExit - entry.average) / entry.average) * 100;
    else if (status === 'WIN' && target !== null) pnl = ((target - entry.average) / entry.average) * 100;
    else if (status === 'STOPPED' && stop !== null) pnl = ((stop - entry.average) / entry.average) * 100;
    signals.push({
      week_start: monday(recommendationDate), recommendation_date: recommendationDate,
      done_date: parseDate(valueAt(row, ix['TANGGAL DONE'])), symbol,
      setup_type: String(valueAt(row, ix['GAYA TRADE']) || 'Trade').slice(0, 40),
      entry_low: entry.low, entry_high: entry.high, entry_price: entry.average,
      target_price: target, high_price: parseNumber(valueAt(row, ix.HIGH)), stop_loss_price: stop, exit_price: realExit,
      status, source_status: rawStatus.slice(0, 100), pnl_pct: pnl, note: String(valueAt(row, ix.KETERANGAN) || '').slice(0, 500),
    });
  }
  if (!signals.length) return res.status(400).json({ error: 'Tidak ada baris valid untuk diimpor.', issues });

  const supabase = serviceClient();
  const byWeek = new Map();
  signals.forEach((signal) => { if (!byWeek.has(signal.week_start)) byWeek.set(signal.week_start, []); byWeek.get(signal.week_start).push(signal); });
  const weekRanges = [...byWeek.keys()].sort().map((weekStart) => ({ weekStart, weekEnd: friday(weekStart) }));
  const ihsgReturns = await fetchIhsgReturns(weekRanges);
  for (const [weekStart, weekSignals] of byWeek) {
    const resolved = weekSignals.filter((s) => typeof s.pnl_pct === 'number');
    const tiiReturn = resolved.length ? resolved.reduce((sum, s) => sum + s.pnl_pct, 0) / resolved.length : null;
    const weekEnd = friday(weekStart);
    const ihsgReturn = ihsgReturns.get(weekStart) ?? null;
    const { error: weekError } = await supabase.from('weekly_track_records').upsert({
      week_start: weekStart, week_end: weekEnd, tii_return_pct: tiiReturn === null ? null : Number(tiiReturn.toFixed(2)),
      ihsg_return_pct: ihsgReturn,
      methodology: 'Rata-rata GAIN/LOSS % sinyal closed dari jurnal. Jika kolom itu kosong, WIN dihitung saat target kena dan STOPPED saat stop loss kena. IHSG memakai perubahan penutupan harian Yahoo Finance pada minggu yang sama.',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'week_start' });
    if (weekError) return res.status(500).json({ error: weekError.message });
  }

  // Hindari duplikasi jika CSV minggu yang sama diimpor ulang. Hanya ganti data
  // dalam minggu yang ada pada file ini; minggu lain tidak disentuh.
  for (const weekStart of byWeek.keys()) {
    const { error: delError } = await supabase.from('signal_journal').delete().eq('week_start', weekStart);
    if (delError) return res.status(500).json({ error: delError.message });
  }
  const { error: insertError } = await supabase.from('signal_journal').insert(signals);
  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json({ imported: signals.length, weeks: byWeek.size, issues });
};
