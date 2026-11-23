/* Service worker Linh Thú Tam Địa.
   - Phiên bản lấy từ ?v= của chính URL sw.js (index.html đăng ký "sw.js?v=gpuNN") -> mỗi bản phát hành có cache riêng, bản cũ bị xoá khi kích hoạt.
   - Trang (index.html / điều hướng): ưu tiên mạng, rớt mạng thì dùng bản đã lưu.
   - Ảnh, phông, css, js, âm thanh: ưu tiên cache (cache-first).
   - Mọi URL đều tương đối so với vị trí sw.js nên chạy được trong thư mục con (ví dụ /linhthutamdia/gpu22/ có <base href="../">). */
const VER = new URL(self.location.href).searchParams.get("v") || "0";
const CACHE = "ltd-" + VER;
const STATIC = /\.(?:webp|png|jpe?g|gif|svg|ico|woff2?|ttf|css|js|mp3|ogg|wav|m4a|json)$/i;

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("ltd-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function put(req, res) {
  if (!res || !res.ok || res.status !== 200 || res.type === "opaque") return;
  try { const c = await caches.open(CACHE); await c.put(req, res); } catch (e) {}
}
async function networkFirst(req) {
  /* cache:"no-cache" = luôn hỏi lại máy chủ (ETag/304, rẻ) -> không dùng index.html cũ trong bộ nhớ đệm HTTP của trình duyệt */
  try { const res = await fetch(req.url, { cache: "no-cache", credentials: "same-origin", redirect: "manual" }); put(req, res.clone()); return res; }
  catch (e) {
    const c = await caches.open(CACHE);
    return (await c.match(req)) || (await c.match(req, { ignoreSearch: true })) || Response.error();
  }
}
async function cacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  put(req, res.clone());
  return res;
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin || !/^https?:$/.test(u.protocol)) return;
  if (u.searchParams.has("rt")) return;             /* ảnh thử lại có tham số chống cache: để trình duyệt tự xử lý */
  if (u.pathname.endsWith("/sw.js")) return;
  if (req.mode === "navigate") { e.respondWith(networkFirst(req)); return; }
  if (STATIC.test(u.pathname) || ["image", "font", "style", "script", "audio"].includes(req.destination)) e.respondWith(cacheFirst(req));
});
/* trang gửi danh sách URL đã tải (từ performance) để lưu sẵn vào cache, lấy từ cache HTTP nên gần như không tốn mạng */
self.addEventListener("message", e => {
  const d = e.data;
  if (!d || d.type !== "warm" || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const url of d.urls.slice(0, 400)) {
      try {
        const u = new URL(url);
        if (u.origin !== self.location.origin || u.searchParams.has("rt")) continue;
        if (await c.match(url)) continue;
        const res = await fetch(url);
        if (res.ok && res.status === 200) await c.put(url, res);
      } catch (err) {}
    }
  })());
});
