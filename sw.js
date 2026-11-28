"use strict";
const CACHE="saudi-byte-pwa-93-offline-v1";
const OFFLINE="/offline.html";
self.addEventListener("install",event=>{event.waitUntil((async()=>{const r=await fetch(OFFLINE,{cache:"reload",credentials:"omit",redirect:"error"});if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw new Error("Offline page unavailable");await(await caches.open(CACHE)).put(OFFLINE,r);await self.skipWaiting()})())});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith("saudi-byte-pwa-")&&key!==CACHE)await caches.delete(key)}await self.clients.claim()})())});
self.addEventListener("fetch",event=>{const req=event.request,u=new URL(req.url);if(req.method!=="GET"||u.origin!==self.location.origin||req.mode!=="navigate"||!["/","/index.html"].includes(u.pathname))return;event.respondWith(fetch(req).catch(async()=>{const offline=await caches.match(OFFLINE,{cacheName:CACHE});return offline||new Response("SAUDI BYTE - Internet connection required",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})}))});
