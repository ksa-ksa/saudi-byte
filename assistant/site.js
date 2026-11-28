"use strict";
(() => {
  // Each destination maps to an existing public tab and, optionally, a lab tool.
  const sections = [
    ["home","الرئيسية","Home","الرئيسية|الرئيسه|home|overview","نظرة على الأقسام ومحتوى المنصة.","Browse the site's sections."],
    ["anime","الأنمي","Anime","انمي|انيمي|anime","أخبار الأنمي وبوسترات الأفلام والمسلسلات وفلاتر التصنيفات.","Anime news, posters and genre filters."],
    ["movies","السينما","Cinema","سينما|افلام|مسلسلات|movies|cinema","تصفّح بوسترات الأفلام والمسلسلات وتفاصيلها.","Browse movie and TV posters and details."],
    ["tv","التلفزيون المباشر","Live TV","تلفزيون|تلفاز|قنوات|قناه|البث المباشر|live tv|channels","اختر قناة من قائمة البث داخل الموقع.","Pick a channel from the site's live TV list."],
    ["trending","المودات الرائجة","Trending mods","مودات رائجه|المودات الرائجه|trending mods","استكشف المودات الرائجة.","Explore trending mods."],
    ["mods","ورشة المودات","Mod workshop","مود|مودات|mods|workshop","تصفّح إضافات الألعاب في ورشة المودات.","Browse game modifications in the workshop."],
    ["themes","ثيمات الكمبيوتر","PC themes","ثيم|ثيمات|خلفيات|تخصيص|themes|wallpapers","تصفّح خيارات تخصيص مظهر الكمبيوتر.","Find PC appearance and theme options."],
    ["free","الألعاب المجانية","Free games","العاب مجانيه|الالعاب المجانيه|لعبه مجانيه|free games","تصفّح قائمة الألعاب المجانية.","Browse free games."],
    ["deals","العروض","Steam deals","عروض|خصم|خصومات|تخفيضات|عروض ستيم|deals|discounts|sale","قارن أسعار عروض Steam ونِسب الخصم.","Compare Steam offer prices and discounts."],
    ["upcoming","الإصدارات القادمة","Upcoming games","قادمه|القادمه|اصدارات|upcoming|releases","تصفّح الألعاب القادمة ومواعيد الإصدار المتاحة.","Find upcoming games and available release dates."],
    ["guides","الأدلة والحلول","Guides","شروحات|ادله|حلول|guides|walkthrough","تصفّح أدلة الألعاب والحلول.","Browse game guides and walkthroughs."],
    ["apps","مركز البرامج","Software","برامج|برنامج|ادوات|software|apps|tools","ابحث باسم البرنامج أو اختر تصنيف مهمتك.","Search by software name or filter by task."],
    ["games","مكتبة الألعاب","Games","العاب|لعبه|games|game library","ابحث عن لعبة في Steam أو صفِّ الألعاب حسب النوع والسعر.","Search Steam games or filter by genre and price."],
    ["lab","مختبر الألعاب","Game lab","مختبر|فحص|جهازي|lab|diagnostics","افتح أدوات الجهاز والتوافق وتحليل الأداء.","Use device, compatibility and performance tools."],
    ["sb-builder","تجميعة الكمبيوتر","PC builder","تجميعه|تجميعات|تجميع|pc builder|pc build","تحقّق من توافق القطع والميزانية.","Check parts compatibility and budget."],
    ["sb-pc","ملف الجهاز","PC profile","مواصفات جهازي|ملف الجهاز|ملف جهازي|pc profile","أدخل مواصفات الكمبيوتر لاستخدامها في المقارنة.","Enter PC specs to use in comparisons."],
    ["sb-fix","حل مشاكل الألعاب","Troubleshooting","تقطيع|تهنيج|كراش|تنهار|ما تفتح|crash|stutter|troubleshoot","اختر المشكلة لتظهر خطوات التشخيص.","Select a symptom for troubleshooting steps."],
    ["sb-upgrade","تحليل الأداء","Performance","عنق الزجاجه|ترقيه|فريمات|bottleneck|upgrade|fps","حلّل استخدام القطع لتحديد أسباب ضعف الأداء.","Analyze component usage and FPS."],
    ["sb-compat","فحص توافق الألعاب","Game compatibility","توافق|تتوافق|متوافقه|تشغل|يشغل|تشغيل لعبه|متطلبات|تشتغل|تناسب جهازي|compatible|can i run|can my pc run|requirements|run on my","قارن مواصفات جهازك بالحد الأدنى المنشور من Steam.","Compare your PC profile with Steam's minimum requirements."]
  ];
  const normalize = s => s.toLowerCase().normalize("NFKC").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/[ً-ْ]/g,"").replace(/[^\p{L}\p{N} ]/gu," ").replace(/\s+/g," ").trim();
  function match(q) {
    const text = normalize(q);
    const scored = sections.map(item => {
      const score = Math.max(0,...item[3].split("|").map(term =>
        text.split(" ").some(w => [term,"ال"+term,"ل"+term,"لل"+term,"ب"+term,"و"+term].includes(w)) || (term.includes(" ") && text.includes(term)) ? term.length : 0));
      return {item,score};
    }).filter(x=>x.score).sort((a,b)=>b.score-a.score);
    return scored.map(x=>x.item);
  }
  const params = new URLSearchParams(location.search);
  const site = document.getElementById("tabs");
  if (site) {
    for (const page of document.querySelectorAll("section.page")) {
      let a = page.querySelector('a[href="/assistant/"]');
      if (!a) {
        a = document.createElement("a"); a.className = "btn btn-dark";
        a.dataset.ar = "اسأل مساعد الموقع"; a.dataset.en = "Ask the site assistant";
        a.textContent = document.documentElement.lang === "en" ? a.dataset.en : a.dataset.ar;
        (page.querySelector(".sb-sections-return") || page.firstElementChild)?.after(a);
      }
      a.href = "/assistant/?from=" + encodeURIComponent(page.id);
    }
    const dest = params.get("section");
    if (!sections.some(s=>s[0]===dest)) return;
    const tab = dest.startsWith("sb-") ? "lab" : dest;
    site.querySelector('[data-p="'+tab+'"]')?.click();
    if (dest.startsWith("sb-")) {
      window.sbChooseLabTool?.(dest);
      document.getElementById(dest)?.scrollIntoView();
      if (dest === "sb-compat" && params.get("game")) {
        const field = document.getElementById("g-name");
        field.value = params.get("game").slice(0,120);
        field.dispatchEvent(new Event("input"));
        document.getElementById("g-load").click();
      }
    }
    return;
  }

  const en = document.documentElement.lang === "en";
  const from = sections.find(s=>s[0]===params.get("from"));
  const actions = document.getElementById("actions");
  const answer = document.getElementById("answer");
  function url(item,title) {
    const p = new URLSearchParams({section:item[0]});
    if (title) p.set("game",title);
    return "/?"+p;
  }
  function link(item,title) {
    const a = document.createElement("a"); a.href = url(item,title);
    a.textContent = (en?"Open ":"افتح ")+item[en?2:1]; actions.append(a);
  }
  let pendingGame = false;
  const compat = sections.find(s=>s[0]==="sb-compat");
  window.sbSiteHelp = q => {
    actions.replaceChildren();
    const n = normalize(q), hits = match(q);
    const explicit = /^(?:لو سمحت |ممكن |تكفى )?(?:افتح|ودني|وديني|خذني|نقلني|روح|انتقل|open\b|go to\b|take me\b)/.test(n);
    const localized = (ar,english) => en ? english : ar;
    if (hits.includes(compat) || pendingGame && !explicit && !hits.length) {
      const title = (q.match(/["«“]([^"»”]+)["»”]/)?.[1] || q.match(/\b[A-Za-z][A-Za-z0-9: '’-]*(?:\s+\d+)?/)?.[0] || "").replace(/^(?:can (?:i|my pc) run|requirements for|check)\s+/i,"").replace(/\s+(?:requirements|run on my.*)$/i,"").trim();
      const game = pendingGame && !hits.length ? q : title;
      pendingGame = !game;
      if (explicit) { location.assign(url(compat,game)); return true; }
      answer.textContent = localized("افتح فحص التوافق لمقارنة ألعاب من المكتبة بجهازك. لفحص لعبة معيّنة، "+(game?"اختر النسخة المطابقة من نتائج Steam.":"اكتب اسمها هنا."),"Open compatibility to compare games with your PC. "+(game?"Select the matching Steam title.":"For a specific game, type its title here."));
      link(compat,game); return true;
    }
    pendingGame = false;
    const catalog = /(?:العاب|games)/.test(n) && /(?:الموقع|عندكم|موجود|المتوفر|قائمه|وشو|ايش|list|available|catalog)/.test(n);
    if (!explicit && catalog && hits[0]?.[0]==="games") {link(hits[0]);return false;}
    if (explicit && hits.length) { location.assign(url(hits[0])); return true; }
    const all = /(?:اقسام الموقع|كل الاقسام|جميع الاقسام|site sections|all sections)/.test(n);
    const choices = all ? sections.filter(s=>!s[0].startsWith("sb-")) : hits.length ? hits.slice(0,2) : from && /(?:هنا|القسم|this section|here)/.test(n) ? [from] : [];
    for (const item of choices) link(item);
    if (!choices.length || (!all && !/(?:وين|كيف اوصل|القسم|قسم|هنا|وش فيه|كيف استخدم|where|section|here)/.test(n) && !explicit)) return false;
    answer.textContent = choices.map(s=>s[en?2:1]+" — "+s[en?5:4]).join("\n");return true;
  };
})();
