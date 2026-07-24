self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
// No offline caching — connectivity is always assumed. This SW exists only
// to satisfy PWA installability ("Add to Home Screen") criteria.
self.addEventListener("fetch", () => {});
