/*
 * Service worker for Memory. Made by _scripts/make-pwa.py, don't edit by hand.
 *
 * On install it saves every file the app needs in a cache. After that the app
 * loads from the cache, so it works without a connection. The cache name is a
 * hash of the files, so a new version of the app gets a new cache.
 */

const CACHE = "memory-a4403c6a95";

const FILES = [
    "/assets/memory/app.html",
    "/assets/memory/images/apple-touch-icon.png",
    "/assets/memory/images/blue-square.svg",
    "/assets/memory/images/blue-star.svg",
    "/assets/memory/images/blue-triangel.svg",
    "/assets/memory/images/card.svg",
    "/assets/memory/images/favicon.svg",
    "/assets/memory/images/green-square.svg",
    "/assets/memory/images/green-star.svg",
    "/assets/memory/images/green-triangel.svg",
    "/assets/memory/images/icon-192.png",
    "/assets/memory/images/icon-512.png",
    "/assets/memory/images/icon-maskable-512.png",
    "/assets/memory/images/purple-square.svg",
    "/assets/memory/images/purple-star.svg",
    "/assets/memory/images/purple-triangel.svg",
    "/assets/memory/images/star.svg",
    "/assets/memory/images/yellow-square.svg",
    "/assets/memory/images/yellow-star.svg",
    "/assets/memory/images/yellow-triangel.svg",
    "/assets/memory/manifest.webmanifest",
    "/assets/memory/memory.css",
    "/assets/memory/memory.js",
    "/css/style.css",
    "/assets/fonts/Ubuntu/Ubuntu-Regular.ttf",
    "/assets/fonts/Ubuntu/Ubuntu-Medium.ttf",
    "/assets/fonts/Ubuntu/Ubuntu-Bold.ttf",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
];

// Save all files when the worker is installed.
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE)
            .then(function (cache) { return cache.addAll(FILES); })
            .then(function () { return self.skipWaiting(); })
    );
});

// Delete the caches of older versions.
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (names) {
                return Promise.all(names
                    .filter(function (name) { return name.startsWith("memory-") && name !== CACHE; })
                    .map(function (name) { return caches.delete(name); }));
            })
            .then(function () { return self.clients.claim(); })
    );
});

// Answer from the cache first, and only go to the network for anything else.
// The address of the app may have ?values in it, so they are ignored.
self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
            return cached || fetch(event.request);
        })
    );
});
