// /api/admin-ticker  — kelola daftar saham di running ticker. Butuh token valid.
//
//   POST   body: { symbol }                         → tambah 1 ticker
//   DELETE body: { id }                             → hapus 1 ticker
//   PATCH  body: { items: [{ id, display_order }] } → simpan urutan
//
// Read (list ticker) TIDAK di sini — admin & landing page baca langsung
// (RLS public read). Endpoint ini khusus tulis pakai service_role.

const { isAuthed, serviceClient, readJsonBody } = require('./_lib/auth');

// Kode saham IDX: huruf/angka, 2-6 karakter. Normalisasi ke UPPERCASE.
function normSymbol(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z0-9]{2,6}$/.test(s) ? s : null;
}

module.exports = async (req, res) => {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Login ulang.' });
  }

  const supabase = serviceClient();

  // ---- TAMBAH ---------------------------------------------------------------
  if (req.method === 'POST') {
    const { symbol } = await readJsonBody(req);
    const sym = normSymbol(symbol);
    if (!sym) return res.status(400).json({ error: 'Kode saham tidak valid (2-6 huruf/angka).' });

    // Taruh di urutan paling belakang.
    const { data: last } = await supabase
      .from('tickers').select('display_order')
      .order('display_order', { ascending: false }).limit(1);
    const nextOrder = last && last.length ? (last[0].display_order + 1) : 0;

    const { data, error } = await supabase
      .from('tickers').insert({ symbol: sym, display_order: nextOrder }).select().single();

    if (error) {
      // 23505 = unique violation (kode sudah ada).
      if (error.code === '23505') return res.status(409).json({ error: `${sym} sudah ada di daftar.` });
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ticker: data });
  }

  // ---- URUTKAN (batch) ------------------------------------------------------
  if (req.method === 'PATCH') {
    const body = await readJsonBody(req);
    if (!Array.isArray(body.items)) return res.status(400).json({ error: 'items wajib array.' });
    for (const it of body.items) {
      if (!it || !it.id) continue;
      const { error } = await supabase
        .from('tickers').update({ display_order: Number(it.display_order) || 0 }).eq('id', it.id);
      if (error) return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true });
  }

  // ---- HAPUS ----------------------------------------------------------------
  if (req.method === 'DELETE') {
    const { id } = await readJsonBody(req);
    if (!id) return res.status(400).json({ error: 'id wajib diisi.' });
    const { error } = await supabase.from('tickers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'POST, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
