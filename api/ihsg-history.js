// GET /api/ihsg-history?days=120
// Riwayat penutupan IHSG untuk pembanding return portofolio publik.

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestedDays = Number.parseInt(req.query?.days, 10);
  const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 7), 180) : 120;
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - ((days + 14) * 24 * 60 * 60);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&period1=${period1}&period2=${period2}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TII-track-record/1.0)' },
    });
    if (!response.ok) throw new Error(`Yahoo ${response.status}`);

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    const timestamps = result?.timestamp || [];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const points = timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    })).filter(point => typeof point.close === 'number' && Number.isFinite(point.close));

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({ points, symbol: '^JKSE', delayed: true });
  } catch (error) {
    return res.status(502).json({ error: 'Riwayat IHSG belum tersedia.', detail: error.message });
  }
};
