/*!
 * Proyecto Huellitas - Creado por Carlos Alexis Lira Alcala - 2026.
 * Todos los derechos reservados.
 */
(function () {
    "use strict";

    const version = "20260630-simon-v14";
    const scripts = [
        "huellitas-original.js",
        "huellitas-fixes.js",
        "huellitas-pet-polish.js",
        "huellitas-profile-touch.js",
        "huellitas-profile-mobile.js",
        "huellitas-pet-color.js",
        "huellitas-lost-pets.js",
        "huellitas-admin-secure.js",
        "huellitas-admin-pro.js",
        "huellitas-final-polish.js",
        "huellitas-ux-guard.js",
        "huellitas-maze-keyguard.js",
        "huellitas-shop-icons.js",
        "huellitas-admin-mailbox-fix.js",
        "huellitas-admin-pet-sync.js",
        "huellitas-critical-fixes.js",
        "huellitas-navigation.js",
        "huellitas-treasure-ui.js",
        "huellitas-authorship-pwa.js",
        "huellitas-catch-challenge.js",
        "huellitas-bath-challenge.js",
        "huellitas-simon-challenge.js"
    ];

    function scriptUrl(src) {
        return src + "?v=" + version;
    }

    function writeScript(src) {
        document.write('<script src="' + scriptUrl(src) + '"><\/script>');
    }

    function appendScript(src) {
        return new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = scriptUrl(src);
            script.onload = resolve;
            script.onerror = function () {
                reject(new Error("No se pudo cargar " + src));
            };
            document.head.appendChild(script);
        });
    }

    if (document.readyState === "loading") {
        scripts.forEach(writeScript);
        return;
    }

    scripts.reduce(function (chain, src) {
        return chain.then(function () {
            return appendScript(src);
        });
    }, Promise.resolve()).catch(function (error) {
        console.error(error);
    });
})();