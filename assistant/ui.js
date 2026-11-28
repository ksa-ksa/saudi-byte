"use strict";
const byId = id => document.getElementById(id);
let en = false;
try { en = localStorage.getItem("directory_lang") === "en"; } catch {}
if (en) {
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  document.title = "Games & software assistant | SAUDI BYTE";
  document.querySelectorAll("[data-en]").forEach(el => el.textContent = el.dataset.en);
}
const form = document.querySelector("form");
const statusText = (ar, english) => byId("status").textContent = en ? english : ar;
let worker;
let ready = false;
function stop() {
  worker?.terminate();
  worker = null;
  byId("start").hidden = false;
  byId("stop").hidden = true;
  byId("send").disabled = false;
  ready = false;
}
function failed(detail) {
  stop();
  statusText("تعذّر تشغيل النموذج. تقدر تعيد المحاولة لاحقًا. تقدر تسأل الدليل السريع أدناه.", "Could not run the model. Try again later. You can still ask the quick guide below.");
  if (typeof detail === "string") byId("status").textContent += " (" + detail.slice(0,240) + ")";
}
let policy;
byId("start").onclick = () => {
  try {
    const path = "/assistant/engine.js";
    if (window.trustedTypes && !policy) {
      policy = trustedTypes.createPolicy("sb-script", {createScriptURL: url => {
        if (url !== path) throw new TypeError("Unexpected worker");
        return url;
      }});
    }
    worker = new Worker(policy ? policy.createScriptURL(path) : path, {type:"module"});
    byId("start").hidden = true;
    byId("stop").hidden = false;
    statusText("جارٍ تجهيز النموذج…", "Preparing the model…");
    worker.onerror = event => failed(event.message);
    worker.onmessage = ({data}) => {
      if (data.type === "error") return failed(data.detail);
      if (data.type === "progress") statusText("تنزيل النموذج: " + data.percent + "٪", "Downloading model: " + data.percent + "%");
      if (data.type === "ready") {
        ready = true;
        statusText("جاهز لسؤالك.", "Ready for your question.");
        showComposer();
      }
      if (data.type === "answer") {
        byId("answer").textContent = data.answer;
        byId("send").disabled = false;
        statusText("راجع التفاصيل المهمة مع ناشر اللعبة أو البرنامج.", "Verify important details with the game or software publisher.");
      }
    };
    worker.postMessage({type:"load"});
  } catch { failed(); }
};
byId("stop").onclick = () => {
  stop();
  statusText("توقف المساعد.", "Assistant stopped.");
};
const presets = Array.from(document.querySelectorAll("[data-preset]"));
function selectPreset(selected) {
  presets.forEach(button => button.setAttribute("aria-pressed", String(button === selected)));
}
function showComposer() {
  form.hidden = false;
  byId("write").setAttribute("aria-expanded", "true");
  byId("question").focus();
}
byId("write").onclick = () => { selectPreset(null); showComposer(); };
for (const button of presets) {
  button.onclick = () => {
    if (byId("send").disabled) return;
    selectPreset(button);
    ask(button.textContent.trim(), true);
  };
}
new MutationObserver(() => {
  presets.forEach(button => button.disabled = byId("send").disabled);
}).observe(byId("send"), {attributes:true, attributeFilter:["disabled"]});
form.onsubmit = event => {
  event.preventDefault();
  selectPreset(null);
  ask(byId("question").value.trim());
};
async function ask(question, preset = false) {
  if (!question || byId("send").disabled) return;
  if (window.sbSiteHelp?.(question, preset)) { statusText("",""); return; }
  const normalized = question.normalize("NFKC").toLowerCase().replace(/[أإآ]/g,"ا").replace(/[ً-ْ]/g,"");
  if (/(?:العاب|العبه|games)/.test(normalized) && /(?:الموقع|عندكم|موجود|المتوفر|قائمه|قائمة|اعرض|وشو|ايش|list|available|catalog|on (the |this )?site)/.test(normalized)) {
    byId("send").disabled = true;
    byId("answer").textContent = "";
    statusText("أراجع قسم الألعاب…","Checking the games catalog…");
    try {
      const response = await fetch("/api/assistant-games", {signal:AbortSignal.timeout(12000)});
      if (!response.ok) throw new Error("Catalog unavailable");
      const games = await response.json();
      const group = (label, items) => items.length ? label + "\n" + items.map(name => "• " + name).join("\n") : "";
      byId("answer").textContent = [group(en ? "SAUDI BYTE picks" : "من اختيارات سعودي بايت", games.curated), group(en ? "From the Steam catalog on the site" : "من مكتبة Steam في قسم الألعاب", games.steam)].filter(Boolean).join("\n\n");
      statusText("أمثلة من كتالوج الموقع الحالي","Examples from the current site catalog");
    } catch {
      statusText("تعذّر جلب أسماء الألعاب الآن. جرّب مرة ثانية.","Could not load the catalog. Please try again.");
    } finally { byId("send").disabled = false; }
    return;
  }
  if (!ready) {
    byId("answer").textContent = quickAnswer(question);
    statusText("إجابة من دليل الموقع", "Answer from the site guide");
    return;
  }
  byId("send").disabled = true;
  byId("answer").textContent = "";
  statusText("جارٍ كتابة الإجابة…", "Writing an answer…");
  worker.postMessage({type:"ask", question, en});
};


// Rank guide entries by their matching terms. Unknown questions get a scope hint.
const guide = [
  ["متطلبات مواصفات يشغل يشغلها توافق requirements specs compatible run", "من قسم الألعاب اختر اللعبة واضغط «افحص جهازك». ابدأ بالحد الأدنى الرسمي، وقارن المعالج وكرت الشاشة والرام. إذا كانت قطعة غير معروفة، يبقى الحكم عليها غير محسوم.", "In Games, open the game and choose the PC check. Compare CPU, GPU and RAM with the official minimums. Missing specs leave the result uncertain."],
  ["تقطيع فريمات فريم بطيء بطء يعلق fps stutter lag performance", "إذا تنخفض الفريمات، جرّب تقليل الظلال ودقة العرض خطوة واحدة ثم أعد الاختبار في نفس المشهد. إذا كانت الفريمات ثابتة والمشكلة في اللعب الجماعي فقط، راقب زمن الاتصال.", "For FPS drops, lower shadows and resolution one step and retest in the same scene. If FPS is stable and only multiplayer lags, check latency."],
  ["تصوير تسجيل بث record capture streaming obs", "لتسجيل اللعب جرّب OBS Studio. أضف مصدر «التقاط لعبة»، واختر نافذتها، ثم سجّل مقطعًا قصيرًا واختبر الصوت والأداء قبل تسجيل جلسة كاملة.", "For gameplay capture, try OBS Studio. Add a Game Capture source, select the game and make a short recording to test audio and performance."],
  ["ضغط مضغوط zip rar extract archive 7zip", "لفتح ملفات الألعاب المضغوطة على ويندوز، استخدم 7-Zip واختر استخراج إلى مجلد مستقل. إذا كان الأرشيف مقسّمًا، ضع كل أجزائه في مجلد واحد قبل الاستخراج.", "To open an archive on Windows, use 7-Zip and extract to a separate folder. For a multipart archive, put all parts in the same folder first."],
  ["خصم تخفيض عروض سعر deals sale discount price", "افتح قسم العروض وقارن السعر قبل الخصم وبعده بالريال. افتح صفحة اللعبة الرسمية في Steam للتأكد من السعر الحالي وموعد انتهاء العرض.", "Open Deals to compare prices in SAR before and after discounts. Check the Steam store page for the current price and end date."],
  ["مجاني مجانية free رعب سباقات ألغاز racing horror puzzle لعبة العاب games", "افتح قسم الألعاب وحدّد «مجانية» من فلتر السعر إذا تبي ألعاب بدون شراء. استخدم فلتر النوع مثل الرعب أو السباقات، أو اكتب اسم اللعبة في البحث.", "Open Games and select Free in the price filter for free-to-play titles. Choose a genre such as horror or racing, or search by game title."],
  ["برنامج برامج software windows tools ويندوز تطبيق", "افتح مركز البرامج وحدّد تصنيف المهمة. قبل اختيار برنامج قارن إصدار ويندوز المدعوم والترخيص واسم الناشر. للتسجيل أو فك الضغط، اكتب المهمة هنا.", "Open Software and filter by task. Compare supported Windows versions, license and publisher. For recording or archives, ask about that task here."]
];
function quickAnswer(question) {
  const norm = text => text.toLowerCase().normalize("NFKC").replace(/[أإآ]/g,"ا").replace(/[ً-ْ]/g,"").replace(/ة/g,"ه");
  const words = norm(question).match(/[\p{L}\p{N}]+/gu) || [];
  let best = null, score = 0;
  for (const entry of guide) {
    const terms = new Set(norm(entry[0]).split(" "));
    const hits = words.filter(word => terms.has(word) || terms.has(word.replace(/^ال/,""))).length;
    if (hits > score) { best = entry; score = hits; }
  }
  if (best) return best[en ? 2 : 1];
  return en ? "I can help with PC requirements, FPS drops, recording games, archives, game filters and deals. Which task are you working on?" : "أقدر أساعدك في متطلبات الألعاب، هبوط الفريمات، تسجيل اللعب، فك الضغط، فلاتر الألعاب والعروض. وش المهمة اللي تبيها؟";
}
