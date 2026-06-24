/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const adminAccessKey = "huellitasAdminActivo";
    const passwordHash = "7571e4e75ae70141d773cbd36bfdac3e92f10c9eeb3e56f5cc03bf7126121a8c";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalizePassword(value) {
        return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
    }

    async function sha256(value) {
        if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
            return "";
        }

        const data = new TextEncoder().encode(value);
        const hash = await window.crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    async function isValidPassword(value) {
        const normalized = normalizePassword(value);

        if (!normalized) {
            return false;
        }

        return await sha256(normalized) === passwordHash;
    }

    function showAdminMessage(title, message) {
        if (typeof window.mostrarAdminToast === "function") {
            window.mostrarAdminToast(title, message);
        }
    }

    function removeDangerButtons() {
        document.querySelectorAll("[onclick]").forEach((button) => {
            const action = button.getAttribute("onclick") || "";

            if (action.includes("restaurarDatosBase") || action.includes("reiniciarSitioCompleto")) {
                button.remove();
            }
        });
    }

    function disableDangerActions() {
        window.restaurarDatosBase = async function () {
            showAdminMessage("Accion desactivada", "La restauracion base se quito del panel por seguridad.");
        };

        window.reiniciarSitioCompleto = async function () {
            showAdminMessage("Accion desactivada", "El reinicio total se quito del panel por seguridad.");
        };
    }

    function applyAdminAccess() {
        if (typeof window.aplicarAccesoAdmin === "function") {
            window.aplicarAccesoAdmin();
            return;
        }

        const active = sessionStorage.getItem(adminAccessKey) === "true";
        const gate = document.getElementById("adminGate");

        document.querySelectorAll(".admin-protected").forEach((section) => {
            section.hidden = !active;
        });

        if (gate) {
            gate.hidden = active;
        }
    }

    function secureAdminForm() {
        const form = document.getElementById("adminAccessForm");
        const passwordInput = document.getElementById("adminPassword");
        const feedback = document.getElementById("adminAccessFeedback");

        if (!form || form.dataset.secureAdminReady === "true") {
            return;
        }

        form.dataset.secureAdminReady = "true";
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }

            const valid = await isValidPassword(passwordInput && passwordInput.value);

            if (passwordInput) {
                passwordInput.value = "";
            }

            if (valid) {
                sessionStorage.setItem(adminAccessKey, "true");

                if (feedback) {
                    feedback.textContent = "Acceso concedido.";
                }

                applyAdminAccess();
                removeDangerButtons();
            } else if (feedback) {
                feedback.textContent = "Clave incorrecta. Intenta de nuevo.";
            }
        }, true);
    }

    onReady(() => {
        secureAdminForm();
        removeDangerButtons();
        disableDangerActions();

        if (document.body && window.MutationObserver) {
            new MutationObserver(() => {
                removeDangerButtons();
                disableDangerActions();
            }).observe(document.body, { childList: true, subtree: true });
        }
    });
})();