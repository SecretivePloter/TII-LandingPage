// /api/admin-asset  — edit & hapus asset. Semua butuh token valid.
//
//   PATCH  body: { id, caption?, display_order? }
//          atau (batch reorder): { items: [{ id, display_order }, ...] }
//   DELETE body: { id }   → hapus file di Storage + row di table sekaligus
//
// Read (list asset) TIDAK di sini — admin panel baca langsung pakai anon key
// (RLS mengizinkan select), jadi endpoint ini khusus operasi tulis.

const { isAuthed, serviceClient, storagePathFromUrl, readJsonBody, BUCKET } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Login ulang.' });
  }

  const supabase = serviceClient();

  // ---- UPDATE caption / urutan --------------------------------------------
  if (req.method === 'PATCH') {
    const body = await readJsonBody(req);

    // Batch reorder: banyak row sekaligus.
    if (Array.isArray(body.items)) {
      for (const it of body.items) {
        if (!it || !it.id) continue;
        const { error } = await supabase
          .from('assets')
          .update({ display_order: Number(it.display_order) || 0 })
          .eq('id', it.id);
        if (error) return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ ok: true });
    }

    // Single update.
    const { id, caption, display_order } = body;
    if (!id) return res.status(400).json({ error: 'id wajib diisi.' });

    const patch = {};
    if (typeof caption === 'string') patch.caption = caption.slice(0, 500);
    if (display_order !== undefined) patch.display_order = Number(display_order) || 0;
    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Tidak ada yang diubah.' });
    }

    const { data, error } = await supabase
      .from('assets').update(patch).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ asset: data });
  }

  // ---- DELETE row + file ---------------------------------------------------
  if (req.method === 'DELETE') {
    const { id } = await readJsonBody(req);
    if (!id) return res.status(400).json({ error: 'id wajib diisi.' });

    const { data: row, error: findErr } = await supabase
      .from('assets').select('file_url').eq('id', id).single();
    if (findErr) return res.status(404).json({ error: 'Asset tidak ditemukan.' });

    const path = storagePathFromUrl(row.file_url);
    if (path) {
      // Best-effort: kalau file sudah nggak ada di storage, tetap lanjut hapus row.
      await supabase.storage.from(BUCKET).remove([path]);
    }

    const { error: delErr } = await supabase.from('assets').delete().eq('id', id);
    if (delErr) return res.status(500).json({ error: delErr.message });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
