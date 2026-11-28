const published = "https://fsctbkyzgckbuxejiaxe.supabase.co/rest/v1/games?select=name&status=eq.published&order=created_at.desc&limit=8";
const steam = "https://store.steampowered.com/search/results/?category1=998&start=0&count=8&infinite=1&ignore_preferences=1&cc=sa&l=english&json=1";

async function getJson(url, headers) {
  const response = await fetch(url, {headers, signal: AbortSignal.timeout(6500)});
  if (!response.ok) throw new Error("Catalog unavailable");
  return response.json();
}

function titles(html) {
  return Array.from(html.matchAll(/<span\b[^>]*class=["']title["'][^>]*>([^<]+)<\/span>/gi), match =>
    match[1].replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim());
}
module.exports = async function(req,res) {
  if (req.method !== "GET") return res.status(405).end();
  const [curated, store] = await Promise.allSettled([
    getJson(published, {apikey:"sb_publishable_XpTnggE5lZfaG334Il-eIg_utGn32dI"}).then(rows => rows.map(row => row.name)),
    getJson(steam).then(data => {
      const html = data.results_html || "";
      const entries = Array.from(html.matchAll(/<a\b([^>]*\bdata-ds-appid=["'](\d+)["'][^>]*)>([\s\S]*?)<\/a>/gi),
        match => ({id:Number(match[2]),name:titles(match[3])[0]})).filter(item => item.name);
      return {names:titles(html),entries};
    })
  ]);
  const names = item => item.status === "fulfilled" ? [...new Set(item.value.filter(Boolean))].slice(0,8) : [];
  const games = {curated:names(curated), steam:store.status === "fulfilled" ? store.value.names.slice(0,8) : [], entries:store.status === "fulfilled" ? store.value.entries.slice(0,8) : []};
  if (!games.curated.length && !games.steam.length) return res.status(503).json({error:"catalog_unavailable"});
  res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=600");
  return res.json(games);
};
