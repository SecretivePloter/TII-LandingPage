// POST /api/admin-logo   body: { filename, contentType, dataBase64 }
// Validasi token -> upload logo ke path TETAP `branding/logo` (upsert, jadi menimpa
// logo lama). Tidak menyentuh table `assets` sama sekali, jadi aman terhadap data
// gambar bukti yang sudah ada. Landing page & favicon otomatis ambil dari path ini.

const { isAuthed, serviceClient, BUCKET, readJsonBody } = require('./_lib/auth');

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const LOGO_PATH = 'branding/logo';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Login ulang.' });
  }

  const { contentType, dataBase64 } = await readJsonBody(req);
  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: 'Logo harus PNG, JPG, WEBP, GIF, atau SVG.' });
  }
  if (!dataBase64) return res.status(400).json({ error: 'File kosong.' });

  let buffer;
  try { buffer = Buffer.from(dataBase64, 'base64'); }
  catch { return res.status(400).json({ error: 'Data file rusak.' }); }
  if (!buffer.length) return res.status(400).json({ error: 'File kosong.' });

  const supabase = serviceClient();
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(LOGO_PATH, buffer, { contentType, upsert: true });

  if (uploadErr) {
    return res.status(500).json({ error: `Gagal upload logo: ${uploadErr.message}` });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(LOGO_PATH);
  // Tambah cache-buster supaya preview langsung ke-refresh.
  return res.status(200).json({ url: pub.publicUrl + '?t=' + Date.now() });
};
