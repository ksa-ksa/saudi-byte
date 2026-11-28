"use strict";
(() => {
  const input = document.getElementById("sb-local-report");
  if (!input) return;
  const el = id => document.getElementById(id);
  const labels = {
    hardware:["مواصفات الجهاز","Hardware"], defender:["فحص Defender السريع","Defender quick scan"],
    deviceIssues:["أجهزة عليها تنبيه","Device warnings"], driverUpdates:["تعريفات متاحة عبر Windows Update","Windows Update drivers"],
    appUpdates:["برامج لها تحديث عبر WinGet","WinGet updates"]
  };
  input.addEventListener("change",async () => {
    const output = el("sb-report-output"), en = document.documentElement.lang === "en";
    const file = input.files[0]; if (!file) return;
    output.replaceChildren();
    try {
      if (file.size > 2_000_000) throw Error();
      const report = JSON.parse((await file.text()).replace(/^\uFEFF/,""));
      if (report.format !== "saudi-byte-device-v1" || !Object.keys(labels).some(key=>Object.hasOwn(report,key))) throw Error();
      for (const [key,label] of Object.entries(labels)) {
        const check = report[key]; if (!check) continue;
        let message;
        if(check.status !== "ok") {
          message = (en?"Unavailable: ":"تعذّر الفحص: ")+String(check.reason||"");
        } else if(key === "hardware") {
          const h = check.data;
          const pairs = [["cpu",h.cpu],["gpu",h.gpu],["ram",h.ram],["space",h.space]];
          if (!pairs.every(([k,v])=> k==="ram"||k==="space"?typeof v==="number"&&Number.isFinite(v)&&v>=0:typeof v==="string")) throw Error();
          message = [h.cpu,h.gpu,h.os,"RAM: "+h.ram+" GB",String(h.drive||"")+" "+h.space+" GB "+(en?"free":"متاحة")].join("\n");
          if (el("p-cpu")) {
            for (const [k,v] of pairs) el("p-"+k).value=String(v).slice(0,240);
            el("p-os").value = /Windows 11/i.test(h.os)?"win11":/Windows 10/i.test(h.os)?"win10":"";
            el("p-vram").value=""; el("p-ssd").value="";
            message += en?"\nProfile ready. Select Compare below.":"\nتمت تعبئة ملف الجهاز. اختر المقارنة أدناه.";
          }
        } else if(key==="defender") {
          const threats = check.data.activeThreats || [];
          message = (en?"Scan completed: ":"اكتمل الفحص: ")+String(check.data.completed)+"\n"+(en?"Active threats reported: ":"التهديدات النشطة التي أبلغ عنها Defender: ")+(threats.length?threats.join(", "):"0");
        } else {
          const data=check.data;
          message=(Array.isArray(data)?data.join("\n"):String(data??"")).trim() || (en?"No entries reported.":"لم تظهر عناصر في هذا الفحص.");
        }
        const heading=document.createElement("h4"), body=document.createElement("p");
        heading.textContent=label[en?1:0];body.textContent=message;body.style.whiteSpace="pre-wrap";body.style.overflowWrap="anywhere";
        output.append(heading,body);
      }
    } catch {output.textContent=en?"Could not read a SAUDI BYTE report.":"تعذّرت قراءة تقرير SAUDI BYTE.";}
    finally {input.value="";}
  });
})();
