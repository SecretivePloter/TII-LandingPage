// POST /api/admin-upload
// body JSON: { category, caption, filename, contentType, dataBase64 }
// Validasi token dulu → upload file ke Supabase Storage (service role) → insert
// row metadata ke table `assets`. File dikirim sebagai base64 di dalam JSON biar
// nggak perlu parser multipart (screenshot bukti kecil, ini cukup).
//
// Batas praktis: body serverless Vercel ~4.5MB, jadi file efektif < ~3MB setelah
// base64. Client sudah kasih peringatan kalau file kegedean.

const { isAuthed, serviceClient, readJsonBody, BUCKET } = require('./_lib/auth');

const VALID_CATEGORIES = ['testimoni', 'hasil-tp', 'winrate', 'analyst'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function safeName(name) {
  return String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(-60);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Login ulang.' });
  }

  const { category, caption = '', filename, contentType, dataBase64 } = await readJsonBody(req);

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Kategori tidak valid.' });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: 'Format file harus JPG, PNG, WEBP, atau GIF.' });
  }
  if (!dataBase64) {
    return res.status(400).json({ error: 'File kosong.' });
  }

  let buffer;
  try {
    buffer = Buffer.from(dataBase64, 'base64');
  } catch {
    return res.status(400).json({ error: 'Data file rusak.' });
  }
  if (!buffer.length) {
    return res.status(400).json({ error: 'File kosong.' });
  }

  const supabase = serviceClient();
  const ext = (safeName(filename).match(/\.[a-z0-9]+$/) || [''])[0] || '.png';
  const path = `${category}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (uploadErr) {
    return res.status(500).json({ error: `Gagal upload ke storage: ${uploadErr.message}` });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = pub.publicUrl;

  // Taruh item baru di urutan paling belakang kategorinya.
  const { data: last } = await supabase
    .from('assets')
    .select('display_order')
    .eq('category', category)
    .order('display_order', { ascending: false })
    .limit(1);
  const nextOrder = last && last.length ? (last[0].display_order + 1) : 0;

  const { data: row, error: insertErr } = await supabase
    .from('assets')
    .insert({ category, file_url: fileUrl, caption: String(caption).slice(0, 500), display_order: nextOrder })
    .select()
    .single();

  if (insertErr) {
    // Rollback file yang tadi terlanjur ke-upload biar nggak jadi sampah.
    await supabase.storage.from(BUCKET).remove([path]);
    return res.status(500).json({ error: `Gagal simpan metadata: ${insertErr.message}` });
  }

  return res.status(200).json({ asset: row });
};
