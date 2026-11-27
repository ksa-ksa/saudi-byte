const ALLOWED_PATHS = new Set([
  "/search/results/",
  "/api/storesearch/",
  "/api/featuredcategories/"
]);
const ALLOWED_PARAMS = new Set([
  "term", "query", "start", "count", "category1", "infinite",
  "ignore_preferences", "json", "cc", "l", "maxprice", "filter"
]);
const SITE_ORIGIN = "https://saudi-byte.vercel.app";

module.exports = async function handler(req, res) {
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Origin", SITE_ORIGIN);
  res.setHeader("Cache-Control", "public, s-maxage=180, stale-while-revalidate=300");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin;
  if (origin && origin !== SITE_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  try {
    const raw = typeof req.query.url === "string" ? req.query.url : "";
    if (!raw || raw.length > 4096) {
      return res.status(400).json({ error: "A valid Steam URL is required" });
    }

    const target = new URL(raw);
    if (target.protocol !== "https:" ||
        target.hostname !== "store.steampowered.com" ||
        (target.port && target.port !== "443") || target.username || target.password ||
        !ALLOWED_PATHS.has(target.pathname)) {
      return res.status(400).json({ error: "Steam endpoint is not allowed" });
    }

    for (const key of target.searchParams.keys()) {
      if (!ALLOWED_PARAMS.has(key)) {
        return res.status(400).json({ error: "Unsupported Steam query parameter" });
      }
    }

    const term = target.searchParams.get("term") || target.searchParams.get("query") || "";
    if (term.length > 120) {
      return res.status(400).json({ error: "Search term is too long" });
    }
    const count = Number(target.searchParams.get("count") || "36");
    if (!Number.isFinite(count) || count < 1 || count > 50) {
      return res.status(400).json({ error: "Invalid result count" });
    }
    const start = Number(target.searchParams.get("start") || "0");
    if (!Number.isFinite(start) || start < 0 || start > 10000) {
      return res.status(400).json({ error: "Invalid result offset" });
    }
    const country = target.searchParams.get("cc");
    if (country && !/^[a-z]{2}$/i.test(country)) {
      return res.status(400).json({ error: "Invalid country code" });
    }
    const language = target.searchParams.get("l");
    if (language && !/^(english|arabic)$/i.test(language)) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SAUDI-BYTE/1.0)",
        "Referer": "https://store.steampowered.com/"
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!upstream.ok) {
      return res.status(upstream.status === 429 ? 429 : 502).json({
        error: "Steam Store is temporarily unavailable",
        upstreamStatus: upstream.status
      });
    }

    const body = await upstream.json();
    return res.status(200).json(body);
  } catch (error) {
    return res.status(502).json({ error: "Unable to retrieve Steam Store data" });
  }
};
