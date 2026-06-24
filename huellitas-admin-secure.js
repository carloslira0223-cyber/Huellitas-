/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const adminAccessKey = "huellitasAdminActivo";
    const adminTokenKey = "huellitasAdminToken";
    const passwordHash = "7571e4e75ae70141d773cbd36bfdac3e92f10c9eeb3e56f5cc03bf7126121a8c";
    const adminPaths = [
        "/api/backup",
        "/api/adoptions/status",
        "/api/adoptions/appointment",
        "/api/reports/status",
        "/api/pets",
        "/api/pets/status",
        "/api/pets/delete",
        "/api/centers",
        "/api/centers/status",
        "/api/demo",
        "/api/demo/reset",
        "/api/restore",
        "/api/base",
        "/api/reset",
        "/api/mailbox"
    ];

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

    function getAdminToken() {
        return sessionStorage.getItem(adminTokenKey) || "";
    }

    function setAdminToken(token) {
        if (token) {
            sessionStorage.setItem(adminTokenKey, token);
        }
    }

    function clearAdminToken() {
        sessionStorage.removeItem(adminTokenKey);
    }

    function isAdminPath(path) {
        const cleanPath = String(path || "").replace(/^https?:\/\/[^/]+/i, "");
        return adminPaths.some((adminPath) => cleanPath.indexOf(adminPath) === 0);
    }

    function wrapApiRequest() {
        if (!window.huellitasApi || typeof window.huellitasApi.request !== "function" || window.huellitasApi.adminSecureWrapped) {
            return;
        }

        const originalRequest = window.huellitasApi.request;
        window.huellitasApi.request = function (path, options) {
            const requestOptions = Object.assign({}, options || {});
            const headers = Object.assign({}, requestOptions.headers || {});
            const token = getAdminToken();

            if (token && isAdminPath(path)) {
                headers["X-Huellitas-Admin-Token"] = token;
            }

            return originalRequest(path, Object.assign({}, requestOptions, { headers }));
        };
        window.huellitasApi.adminSecureWrapped = true;
    }

    async function loginWithBackend(password) {
        if (!window.huellitasApi || !window.huellitasApi.enabled || typeof window.huellitasApi.request !== "function") {
            return null;
        }

        try {
            const data = await window.huellitasApi.request("/api/admin/login", {
                method: "POST",
                body: JSON.stringify({ password: String(password || "") })
            });

            if (data && data.token) {
                setAdminToken(data.token);
                wrapApiRequest();
                return true;
            }
        } catch (error) {
            const message = String(error && error.message || "");

            if (message.indexOf("no configurado") >= 0 || message.indexOf("Servidor no activo") >= 0 || message.indexOf("no encontrada") >= 0 || message.indexOf("404") >= 0) {
                return null;
            }

            return false;
        }

        return false;
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

            const passwordValue = passwordInput && passwordInput.value;
            const backendLogin = await loginWithBackend(passwordValue);
            const valid = backendLogin === true || (backendLogin === null && await isValidPassword(passwordValue));

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
                clearAdminToken();
                feedback.textContent = "Clave incorrecta. Intenta de nuevo.";
            }
        }, true);
    }

    function wrapLogout() {
        if (typeof window.salirAdmin !== "function" || window.salirAdmin.adminSecureWrapped) {
            return;
        }

        const originalLogout = window.salirAdmin;
        window.salirAdmin = function () {
            clearAdminToken();
            return originalLogout.apply(this, arguments);
        };
        window.salirAdmin.adminSecureWrapped = true;
    }

    onReady(() => {
        wrapApiRequest();
        wrapLogout();
        secureAdminForm();
        removeDangerButtons();
        disableDangerActions();

        if (document.body && window.MutationObserver) {
            new MutationObserver(() => {
                wrapApiRequest();
                wrapLogout();
                removeDangerButtons();
                disableDangerActions();
            }).observe(document.body, { childList: true, subtree: true });
        }
    });
})();
