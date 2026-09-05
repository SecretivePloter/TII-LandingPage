// POST /api/admin-login   body: { password: string }
// Membandingkan password dengan env var ADMIN_PASSWORD (server-side only).
// Kalau cocok → balikin session token (HMAC, expiry 8 jam). Password TIDAK
// pernah dikirim balik ke browser dan TIDAK di-hardcode di client.
//
// TODO: isi ADMIN_PASSWORD & SESSION_SECRET di environment variables Vercel.

const crypto = require('crypto');
const { issueToken, readJsonBody } = require('./_lib/auth');

// Constant-time string compare untuk mencegah timing attack pada password.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    // Tetap lakukan satu compare biar durasi mirip, lalu return false.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!adminPassword || !secret) {
    return res.status(500).json({
      error: 'Server belum dikonfigurasi. Set ADMIN_PASSWORD & SESSION_SECRET di Vercel.',
    });
  }

  const { password } = await readJsonBody(req);
  if (!password || !safeEqual(password, adminPassword)) {
    // Pesan sengaja generik — jangan kasih tahu apakah password "hampir benar".
    return res.status(401).json({ error: 'Password salah.' });
  }

  const token = issueToken(secret);
  return res.status(200).json({ token });
};
