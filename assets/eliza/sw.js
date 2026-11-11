/*
 * Service worker for Eliza. Made by _scripts/make-pwa.py, don't edit by hand.
 *
 * On install it saves every file the app needs in a cache. After that the app
 * loads from the cache, so it works without a connection. The cache name is a
 * hash of the files, so a new version of the app gets a new cache.
 */

const CACHE = "eliza-0e063f8115";

const FILES = [
    "/assets/eliza/app.html",
    "/assets/eliza/doctor-new.js",
    "/assets/eliza/doctor.js",
    "/assets/eliza/eliza-new.js",
    "/assets/eliza/eliza-page-new.js",
    "/assets/eliza/eliza-page.js",
    "/assets/eliza/eliza.css",
    "/assets/eliza/eliza.js",
    "/assets/eliza/images/apple-touch-icon.png",
    "/assets/eliza/images/icon-192.png",
    "/assets/eliza/images/icon-512.png",
    "/assets/eliza/images/icon-maskable-512.png",
    "/assets/eliza/manifest.webmanifest",
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
                    .filter(function (name) { return name.startsWith("eliza-") && name !== CACHE; })
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
