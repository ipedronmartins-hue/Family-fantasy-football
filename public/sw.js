// Minimal service worker. This app is entirely live-data driven (scores,
// predictions, admin actions), so there's no meaningful "offline mode" to
// build — this file exists mainly so Chrome/Android recognize the app as
// installable. It passes every request straight through to the network.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
