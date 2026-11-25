/* Service worker "tự huỷ" cho địa chỉ cũ: xoá cache, gỡ chính nó, tải lại các tab đang mở (sẽ gặp trang chuyển tiếp). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));
