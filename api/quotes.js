// GET /api/quotes
// Baca daftar ticker dari Supabase, tarik harga terkini dari Yahoo Finance
// (ticker IDX pakai akhiran .JK), lalu balikin array ringkas untuk running
// ticker di header. Harga di-cache di EDGE Vercel (~3 menit), jadi berapapun
// jumlah visitor cuma memicu SATU fetch ke Yahoo per interval -> aman dari
// rate-limit IP serverless.
//
// Data Yahoo itu UNOFFICIAL & DELAYED (~15 menit). Frontend wajib kasih label.

const { serviceClient } = require('./_lib/auth');

// Endpoint chart v8 lebih andal daripada v7/quote (yang sekarang butuh crumb/cookie).
// Kita cuma perlu meta: regularMarketPrice + chartPreviousClose.
async function fetchOne(symbol) {
  const sym = `${symbol}.JK`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TII-ticker/1.0)' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;

    const price = meta.regularMarketPrice;
    const prev = (typeof meta.chartPreviousClose === 'number')
      ? meta.chartPreviousClose
      : meta.previousClose;
    const change = (typeof prev === 'number') ? price - prev : 0;
    const changePct = (typeof prev === 'number' && prev !== 0) ? (change / prev) * 100 : 0;

    return {
      symbol,                                   // BBCA (tanpa .JK)
      price,
      change: Number(change.toFixed(2)),
      changePct: Number(changePct.toFixed(2)),
    };
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server belum dikonfigurasi.' });
  }

  let symbols = [];
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from('tickers')
      .select('symbol')
      .order('display_order', { ascending: true });
    if (error) throw error;
    symbols = (data || []).map((r) => String(r.symbol).toUpperCase().trim()).filter(Boolean);
  } catch (err) {
    return res.status(500).json({ error: 'Gagal baca daftar ticker: ' + err.message });
  }

  if (!symbols.length) {
    // Nggak ada ticker terdaftar -> array kosong (frontend sembunyiin bar-nya).
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ quotes: [], asOf: Date.now() });
  }

  const results = await Promise.all(symbols.map(fetchOne));
  const quotes = results.filter(Boolean);

  // Cache di edge 3 menit; sajikan versi lama sambil refresh 5 menit berikutnya.
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300');
  return res.status(200).json({ quotes, asOf: Date.now(), delayed: true });
};
