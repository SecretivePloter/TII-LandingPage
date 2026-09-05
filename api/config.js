// GET /api/config
// Returns the PUBLIC Supabase config (project URL + anon key) so the browser
// never has to hardcode them. These two values are safe to expose: the anon key
// can only SELECT (RLS blocks writes), and the URL is public anyway. The service
// role key is NEVER sent here.
//
// TODO: isi SUPABASE_URL & SUPABASE_ANON_KEY di environment variables Vercel.

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(500).json({
      error: 'Server belum dikonfigurasi. Set SUPABASE_URL & SUPABASE_ANON_KEY di Vercel.',
    });
  }

  // Cache di edge/browser sebentar — config ini jarang berubah.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return res.status(200).json({ url, anonKey });
};
