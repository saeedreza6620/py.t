const CACHE = 'bw-static-v106';
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), navigation ? 12000 : 30000);
    try {
      const response = await fetch(request, {signal: controller.signal});
      if (response.ok) event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
      return response;
    } catch {
      if (cached) return cached;
      // Never combine JavaScript from different releases.
      if (navigation) return new Response('<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BeautyWallet</title><body style="font-family:Tahoma;background:#f2faff;padding:24px;line-height:2"><h1>BeautyWallet</h1><p>اتصال برقرار نشد؛ اینترنت را بررسی کن و دوباره تلاش کن</p><a href="/legacy/?v=106">تلاش دوباره</a></body></html>', {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      return Response.error();
    } finally { clearTimeout(timeout); }
  })());
});
