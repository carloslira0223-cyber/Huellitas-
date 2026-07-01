/*!
 * Proyecto Huellitas - Carlos Alexis Lira Alcala - 2026.
 * Service worker para uso instalable y respaldo sin conexion.
 */
const CACHE_NAME = "huellitas-pwa-20260630-v6";
const APP_SHELL = [
    "./",
    "./app.html",
    "./pagina.html",
    "./huellitas.css",
    "./huellitas.js",
    "./huellitas-authorship-pwa.css",
    "./huellitas-authorship-pwa.js",
    "./jueguitos.html",
    "./huellitas-catch-challenge.js",
    "./huellitas-catch-challenge.css",
    "./huellitas-bath-challenge.js",
    "./huellitas-bath-challenge.css",
    "./huellitas-simon-challenge.js",
    "./huellitas-simon-challenge.css",
    "./huellitas-guardians-challenge.js",
    "./huellitas-guardians-challenge.css",
    "./huellitas-detective-challenge.js",
    "./huellitas-detective-challenge.css",
    "./huellitas-light-polish.js",
    "./huellitas-light-polish.css",
    "./pwa-icon.svg",
    "./offline.html"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return Promise.allSettled(APP_SHELL.map(function (url) {
                    return cache.add(url);
                }));
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(keys.filter(function (key) {
                    return key !== CACHE_NAME && key.indexOf("huellitas-pwa-") === 0;
                }).map(function (key) {
                    return caches.delete(key);
                }));
            })
            .then(function () {
                return self.clients.claim();
            })
    );
});

function offlineResponse() {
    return caches.match("./offline.html");
}

self.addEventListener("fetch", function (event) {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin || url.pathname.indexOf("/api/") >= 0) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(function (response) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, copy);
                    });
                    return response;
                })
                .catch(function () {
                    return caches.match(request).then(function (cached) {
                        return cached || offlineResponse();
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(function (cached) {
            const network = fetch(request).then(function (response) {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, copy);
                    });
                }
                return response;
            }).catch(function () {
                return cached;
            });
            return cached || network;
        })
    );
});