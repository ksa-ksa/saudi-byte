const TMDB_BASE = "https://api.themoviedb.org/3";

const ROUTES = {
  trending_movies: "/trending/movie/week",
  trending_tv: "/trending/tv/week",
  now_playing: "/movie/now_playing",
  upcoming: "/movie/upcoming",
  popular_tv: "/tv/popular",
  search: "/search/multi"
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: "Cinema API is not configured yet. Add TMDB_READ_TOKEN in Vercel environment variables."
    });
  }

  const type = String(req.query.type || "trending_movies");
  const route = ROUTES[type];
  if (!route) return res.status(400).json({ error: "Unsupported cinema feed." });

  const page = Math.min(20, Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1));
  const params = new URLSearchParams({
    language: "ar-SA",
    page: String(page),
    region: "SA"
  });

  if (type === "search") {
    const query = String(req.query.query || "").trim().slice(0, 100);
    if (!query) return res.status(400).json({ error: "Enter a title to search." });
    params.set("query", query);
    params.set("include_adult", "false");
  }

  try {
    const response = await fetch(`${TMDB_BASE}${route}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: payload.status_message || "TMDB request failed."
      });
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({
      page: payload.page || page,
      total_pages: payload.total_pages || 1,
      total_results: payload.total_results || 0,
      results: payload.results || []
    });
  } catch (error) {
    return res.status(502).json({ error: "Could not reach the movie database." });
  }
};
