/*!
 * Proyecto Huellitas - Creado por Carlos Alexis Lira Alcala - 2026.
 * Todos los derechos reservados.
 *
 * Esta proteccion es visual y de autoria; no sustituye la seguridad del servidor.
 */
(function () {
    "use strict";

    const version = "20260628-pwa-v1";
    let deferredInstallPrompt = null;
    let noticeTimer = null;

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    }

    function ensureMeta(name, content) {
        let meta = document.querySelector('meta[name="' + name + '"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    function ensureHead() {
        ensureMeta("author", "Carlos Alexis Lira Alcala");
        ensureMeta("application-name", "Huellitas");
        ensureMeta("theme-color", "#5f9d63");
        ensureMeta("apple-mobile-web-app-capable", "yes");
        ensureMeta("apple-mobile-web-app-status-bar-style", "default");
        ensureMeta("apple-mobile-web-app-title", "Huellitas");

        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement("link");
            manifest.rel = "manifest";
            manifest.href = "manifest.webmanifest?v=" + version;
            document.head.appendChild(manifest);
        }

        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const icon = document.createElement("link");
            icon.rel = "apple-touch-icon";
            icon.href = "assets/imagenes/logo.png";
            document.head.appendChild(icon);
        }

        if (!document.getElementById("huellitasAuthorshipCss")) {
            const styles = document.createElement("link");
            styles.id = "huellitasAuthorshipCss";
            styles.rel = "stylesheet";
            styles.href = "huellitas-authorship-pwa.css?v=" + version;
            document.head.appendChild(styles);
        }
    }

    function showNotice(message) {
        let notice = document.getElementById("huellitasCopyrightToast");
        if (!notice) {
            notice = document.createElement("div");
            notice.id = "huellitasCopyrightToast";
            notice.className = "huellitas-copyright-toast";
            notice.setAttribute("role", "status");
            notice.setAttribute("aria-live", "polite");
            document.body.appendChild(notice);
        }

        notice.textContent = message;
        notice.classList.add("visible");
        window.clearTimeout(noticeTimer);
        noticeTimer = window.setTimeout(function () {
            notice.classList.remove("visible");
        }, 2600);
    }

    function createLegalFooter() {
        if (document.querySelector(".huellitas-legal-footer")) {
            return;
        }

        const footer = document.createElement("footer");
        footer.className = "huellitas-legal-footer";
        footer.setAttribute("data-authorship-protected", "true");

        const inner = document.createElement("div");
        inner.className = "huellitas-legal-inner";

        const brand = document.createElement("div");
        brand.className = "huellitas-legal-brand";
        brand.innerHTML = [
            '<strong>Huellitas</strong>',
            '<span>&copy; 2026 Carlos Alexis Lira Alcal&aacute; - Todos los derechos reservados.</span>',
            '<small>Proyecto educativo y social para promover el cuidado animal, la adopci&oacute;n responsable y el respeto por las &aacute;reas verdes.</small>'
        ].join("");

        const actions = document.createElement("div");
        actions.className = "huellitas-legal-actions";

        const rights = document.createElement("details");
        rights.className = "huellitas-rights-note";
        rights.innerHTML = [
            '<summary>Autor&iacute;a y derechos</summary>',
            '<p>Huellitas es un proyecto creado por Carlos Alexis Lira Alcal&aacute;. Su dise&ntilde;o, contenido, im&aacute;genes, estructura e ideas principales est&aacute;n protegidas. No est&aacute; permitido copiar, distribuir o modificar este proyecto sin autorizaci&oacute;n del autor.</p>'
        ].join("");
        actions.appendChild(rights);

        const install = document.createElement("button");
        install.type = "button";
        install.className = "huellitas-install-button";
        install.hidden = true;
        install.innerHTML = '<span aria-hidden="true">&#8681;</span> Instalar Huellitas';
        install.addEventListener("click", async function () {
            if (!deferredInstallPrompt) {
                return;
            }
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            install.hidden = true;
        });
        actions.appendChild(install);

        inner.appendChild(brand);
        inner.appendChild(actions);
        footer.appendChild(inner);

        const oldFooter = document.querySelector(".site-footer");
        if (oldFooter && oldFooter.parentNode) {
            oldFooter.insertAdjacentElement("afterend", footer);
        } else {
            document.body.appendChild(footer);
        }

        window.addEventListener("beforeinstallprompt", function (event) {
            event.preventDefault();
            deferredInstallPrompt = event;
            install.hidden = false;
        });

        window.addEventListener("appinstalled", function () {
            deferredInstallPrompt = null;
            install.hidden = true;
            showNotice("Huellitas ya esta instalada en tu dispositivo.");
        });
    }

    function protectMedia(root) {
        (root || document).querySelectorAll("img").forEach(function (image) {
            image.draggable = false;
            image.setAttribute("draggable", "false");
        });
    }

    function isEditable(target) {
        return Boolean(target && target.closest && target.closest("input, textarea, select, [contenteditable='true']"));
    }

    function bindLightProtection() {
        protectMedia(document);

        document.addEventListener("dragstart", function (event) {
            if (event.target && event.target.closest && event.target.closest("img, [data-authorship-protected]")) {
                event.preventDefault();
                showNotice("Contenido protegido de Huellitas.");
            }
        });

        document.addEventListener("contextmenu", function (event) {
            if (event.target && event.target.closest && event.target.closest("img, [data-authorship-protected], .hero, .hero-banner")) {
                event.preventDefault();
                showNotice("Huellitas es una obra protegida. Gracias por respetar la autoria.");
            }
        });

        document.addEventListener("copy", function (event) {
            if (isEditable(event.target)) {
                return;
            }
            const selection = String(window.getSelection ? window.getSelection() : "").trim();
            if (selection.length > 100) {
                showNotice("Recuerda citar a Carlos Alexis Lira Alcala como autor de Huellitas.");
            }
        });

        if (window.MutationObserver) {
            new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (node) {
                        if (node.nodeType === 1) {
                            if (node.matches && node.matches("img")) {
                                node.draggable = false;
                            }
                            protectMedia(node);
                        }
                    });
                });
            }).observe(document.body, { childList: true, subtree: true });
        }
    }

    function registerServiceWorker() {
        if (!("serviceWorker" in navigator) || !window.isSecureContext) {
            return;
        }

        window.addEventListener("load", function () {
            navigator.serviceWorker.register("sw.js?v=" + version, { scope: "./" }).catch(function (error) {
                console.warn("No se pudo activar el modo instalable:", error.message);
            });
        }, { once: true });
    }

    ensureHead();
    registerServiceWorker();
    onReady(function () {
        createLegalFooter();
        bindLightProtection();
    });
})();