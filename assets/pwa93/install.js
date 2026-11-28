(()=>{"use strict";
const panel=document.getElementById("sb-pwa-panel"),button=document.getElementById("sb-pwa-install"),help=document.getElementById("sb-pwa-help");
if(!panel||!button||!help)return;
let deferred=null,installed=false;
const standalone=()=>installed||matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const en=()=>document.documentElement.lang==="en";
const display=()=>{panel.hidden=standalone()||!window.isSecureContext};
const showHelp=()=>{help.hidden=false;help.textContent=en()?"iPhone/iPad: open in Safari, tap Share, then Add to Home Screen (enable Open as Web App if shown). Android: open Chrome, use its menu, then Install app or Add to Home screen.":"آيفون وآيباد: افتح في Safari، اضغط مشاركة ثم إضافة إلى الشاشة الرئيسية (وفعّل الفتح كتطبيق ويب إن ظهر). أندرويد: افتح Chrome، ثم من القائمة اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية."};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;display()});
window.addEventListener("appinstalled",()=>{installed=true;deferred=null;display()});
button.addEventListener("click",async()=>{if(!deferred){showHelp();return}const prompt=deferred;deferred=null;try{await prompt.prompt();const result=await prompt.userChoice;if(result?.outcome==="accepted"){installed=true;display()}else showHelp()}catch{showHelp()}});
new MutationObserver(()=>{if(!help.hidden)showHelp()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
display();
if("serviceWorker" in navigator&&window.isSecureContext){
 const path="/sw.js";
 try{const tt=window.trustedTypes;const policy=tt?tt.createPolicy("sb-pwa",{createScriptURL(value){const url=new URL(value,location.origin);if(url.origin!==location.origin||url.pathname!==path||url.search||url.hash)throw new TypeError("Unapproved service worker");return url.href}}):null;
 const register=()=>navigator.serviceWorker.register(policy?policy.createScriptURL(path):path,{scope:"/",updateViaCache:"none"}).catch(()=>{console.warn("SAUDI BYTE offline support unavailable")});
 if(document.readyState==="complete")register();else window.addEventListener("load",register,{once:true});
 }catch{console.warn("SAUDI BYTE offline support unavailable")}
}
})();