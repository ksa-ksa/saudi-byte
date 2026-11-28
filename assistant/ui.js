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
function stop() {
  worker?.terminate();
  worker = null;
  byId("start").hidden = false;
  byId("stop").hidden = true;
  byId("send").disabled = false;
  form.hidden = true;
}
function failed() {
  stop();
  statusText("تعذّر تشغيل النموذج. جرّب اتصالًا ثابتًا أو جهازًا بذاكرة أكبر. الأدلة أعلاه متاحة.", "Could not run the model. Try a stable connection or a device with more memory. The guides above are available.");
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
    worker.onerror = failed;
    worker.onmessage = ({data}) => {
      if (data.type === "error") return failed();
      if (data.type === "progress") statusText("تنزيل النموذج: " + data.percent + "٪", "Downloading model: " + data.percent + "%");
      if (data.type === "ready") {
        form.hidden = false;
        statusText("جاهز لسؤالك.", "Ready for your question.");
        byId("question").focus();
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
form.onsubmit = event => {
  event.preventDefault();
  const question = byId("question").value.trim();
  if (!worker || !question || byId("send").disabled) return;
  byId("send").disabled = true;
  byId("answer").textContent = "";
  statusText("جارٍ كتابة الإجابة…", "Writing an answer…");
  worker.postMessage({type:"ask", question, en});
};
