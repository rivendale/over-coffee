// Retire this old game's worker without touching other games on this origin.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("over-coffee-")).map((key) => caches.delete(key)));
    await self.clients.claim();
    const scope = new URL(self.registration.scope);
    const windows = await self.clients.matchAll({ type: "window" });
    await self.registration.unregister();
    await Promise.allSettled(windows.filter((client) => {
      const url = new URL(client.url);
      return url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
    }).map((client) => client.navigate("https://overcoffee.icf.games/")));
  })());
});
