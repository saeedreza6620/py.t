const CACHE = 'bw-static-v147';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(name=>/^bw-(static|complete)-/.test(name)&&name!==CACHE).map(name=>caches.delete(name)));await self.clients.claim();})()));

// Public app files only. Never cache APIs, account records or POST requests.
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  const navigation = request.mode === 'navigate' &&
    ['/legacy/', '/legacy/index.html'].includes(url.pathname);
  const staticFile = /\.(html|css|js|woff2|webmanifest)$/.test(url.pathname);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.pathname.startsWith('/legacy/') || (!navigation && !staticFile)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = navigation ? new Request(url.origin + '/legacy/') : request;
    const cached = await cache.match(key);
    // Versioned app files are immutable for the lifetime of this release.
    if (!navigation && cached) return cached;
    // The app page of this release opens from the phone at once (no waiting on a slow or filtered network);
    // a fresh copy is fetched in the background for the next open. A new release brings a new cache, so the
    // page and its scripts always come from the same release.
    if (navigation && cached) {
      event.waitUntil(fetch(request).then(r => { if (r.ok) return cache.put(key, r); }).catch(() => {}));
      return cached;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), navigation ? 12000 : 30000);
    try {
      const response = await fetch(request, {signal: controller.signal});
      if (response.ok) event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
      return response;
    } catch {
      if (cached) return cached;
      // Never combine JavaScript from different releases.
      if (navigation) return new Response('<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BeautyWallet</title><body style="font-family:Tahoma;background:#f2faff;padding:24px;line-height:2"><h1>BeautyWallet</h1><p>اتصال برقرار نشد؛ اینترنت را بررسی کن و دوباره تلاش کن</p><a href="/legacy/?v=147">تلاش دوباره</a></body></html>', {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      return Response.error();
    } finally { clearTimeout(timeout); }
  })());
});

// ---- reminders outside the app (installed app on the phone) ----
// The server sends an empty "wake up" push at the shopper's chosen time; the message itself is
// written on the phone from her own routine (IndexedDB 'bw-followup'), so the server never sees it.
const FU_DB = 'bw-followup';
function fuRead(key){return new Promise(ok=>{try{const r=indexedDB.open(FU_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onerror=()=>ok(null);
  r.onsuccess=()=>{try{const g=r.result.transaction('kv').objectStore('kv').get(key);g.onsuccess=()=>ok(g.result||null);g.onerror=()=>ok(null)}catch{ok(null)}}}catch{ok(null)}})}
function fuWrite(key,val){return new Promise(ok=>{try{const r=indexedDB.open(FU_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onerror=()=>ok();
  r.onsuccess=()=>{try{const t=r.result.transaction('kv','readwrite');t.objectStore('kv').put(val,key);t.oncomplete=()=>ok();t.onerror=()=>ok()}catch{ok()}}}catch{ok()}})}
const tehranDay = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
// a morning notification always starts with «صبحت بخیر»
function morningTitle(title,h){title=String(title||'بیوتی‌ولت 💎');if(h>=12||/صبح/.test(title))return title;return 'صبحت بخیر 🌸 '+title.replace(/^بیوتی‌ولت\s*💎\s*/,'')}
function hourNow(){return Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',hourCycle:'h23'}).format(new Date()))}
async function showToday(force){
  // which reminder is this: morning or evening (Tehran time); the follow-up task of the day rides on the slot she chose
  const day=tehranDay(),h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  const plan=await fuRead('plan')||{},slot=h<15?'am':'pm',key='shown_'+slot,shown=await fuRead(key);
  if(!force&&shown===day)return;
  const item=Array.isArray(plan.days)?plan.days.find(x=>x.date===day):null,taskSlot=plan.taskSlot||'am';
  const msg=(item&&(slot===taskSlot||!plan[taskSlot]))?item:plan[slot]||item||{title:'بیوتی‌ولت 💎',body:'یه لحظه برای پوست قشنگت 🌸 روتین امروزت منتظرته.'};
  await fuWrite(key,day);
  return self.registration.showNotification(slot==='am'?morningTitle(msg.title,h):msg.title,{body:msg.body,tag:'bw-'+slot,renotify:false,icon:'/legacy/bw-gem-192.png',badge:'/legacy/bw-gem-192.png',lang:'fa',dir:'rtl',data:{url:'/legacy/?from=notif'}});
}
// a push can also mean "the BeautyWallet team wrote you a message" (panel → message studio): ask the server what
// it says (the push itself carries nothing); otherwise it is the routine reminder written on the phone
async function onPush(){try{const sub=await self.registration.pushManager.getSubscription();if(sub){const r=await fetch('/api/inbox/peek',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:sub.endpoint})});const j=await r.json();
  if(j&&j.body)return self.registration.showNotification(morningTitle(j.title||'بیوتی‌ولت 💎',hourNow()),{body:j.body,tag:'bw-msg-'+j.id,icon:'/legacy/bw-gem-192.png',badge:'/legacy/bw-gem-192.png',lang:'fa',dir:'rtl',data:{url:'/legacy/?from=msg'}})}}catch(e){}
  return showToday(true)}
self.addEventListener('push', event => event.waitUntil(onPush()));
// the browser can replace her push address at any time; without this the reminders would silently stop
self.addEventListener('pushsubscriptionchange', event => event.waitUntil((async()=>{try{
  const body=await fuRead('subBody')||{};const old=event.oldSubscription&&event.oldSubscription.endpoint;
  let sub=event.newSubscription;if(!sub){const k=await fetch('/api/push/key',{cache:'no-store'}).then(r=>r.json());const raw=atob(k.key.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((k.key.length+3)%4));const key=new Uint8Array([...raw].map(c=>c.charCodeAt(0)));sub=await self.registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key})}
  await fetch('/api/push/sub',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({},body,{sub:sub.toJSON(),old:old||''}))})}catch(e){}})()));
self.addEventListener('periodicsync', event => { if (event.tag === 'bw-daily') event.waitUntil((async()=>{const plan=await fuRead('plan')||{};const h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tehran',hour:'2-digit',hourCycle:'h23'}).format(new Date()));const am=Number(String(plan.amTime||plan.time||'09:00').slice(0,2)),pm=Number(String(plan.pmTime||'21:00').slice(0,2));if(h>=am&&h<15&&(plan.am||plan.taskSlot!=='pm'))return showToday(false);if(h>=pm&&plan.pm)return showToday(false)})()); });
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/legacy/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (const c of all) { if (new URL(c.url).pathname.startsWith('/legacy/')) { await c.focus(); try { c.postMessage({bw:'notif-open'}); } catch {} return; } }
    return self.clients.openWindow(url);
  })());
});
