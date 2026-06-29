/*!
 * Proyecto Huellitas - Creado por Carlos Alexis Lira Alcala - 2026.
 * Todos los derechos reservados.
 *
 * La clave administrativa se valida en el servidor. Nunca se guarda en el navegador.
 */
(function () {
    "use strict";

    const adminAccessKey = "huellitasAdminActivo";
    const adminTokenKey = "huellitasAdminToken";
    const adminPaths = [
        "/api/backup",
        "/api/team-data",
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

    function getAdminToken() {
        return sessionStorage.getItem(adminTokenKey) || "";
    }

    function setAdminToken(token) {
        if (token) {
            sessionStorage.setItem(adminTokenKey, token);
        }
    }

    function clearAdminSession() {
        sessionStorage.removeItem(adminTokenKey);
        sessionStorage.removeItem(adminAccessKey);
    }

    function isAdminPath(path) {
        const cleanPath = String(path || "").replace(/^https?:\/\/[^/]+/i, "");
        return adminPaths.some(function (adminPath) {
            return cleanPath.indexOf(adminPath) === 0;
        });
    }

    function applyAdminAccess() {
        if (typeof window.aplicarAccesoAdmin === "function") {
            window.aplicarAccesoAdmin();
            return;
        }

        const active = sessionStorage.getItem(adminAccessKey) === "true" && Boolean(getAdminToken());
        const gate = document.getElementById("adminGate");

        document.querySelectorAll(".admin-protected").forEach(function (section) {
            section.hidden = !active;
        });

        if (gate) {
            gate.hidden = active;
        }
    }

    function expireAdminSession() {
        clearAdminSession();
        applyAdminAccess();
    }

    function wrapApiRequest() {
        if (!window.huellitasApi || typeof window.huellitasApi.request !== "function" || window.huellitasApi.adminSecureWrapped) {
            return;
        }

        const originalRequest = window.huellitasApi.request;
        window.huellitasApi.request = function (path, options) {
            const token = getAdminToken();
            let requestPath = path;
            const requestOptions = Object.assign({}, options || {});
            const headers = Object.assign({}, requestOptions.headers || {});

            if (String(path).indexOf("/api/team-data") === 0 && !token) {
                requestPath = String(path).replace("/api/team-data", "/api/public-data");
            }

            if (token && isAdminPath(path)) {
                headers["X-Huellitas-Admin-Token"] = token;
            }

            return originalRequest(requestPath, Object.assign({}, requestOptions, { headers })).catch(function (error) {
                const message = String(error && error.message || "");
                if (token && isAdminPath(path) && /(sesion de administrador|401|no autorizado)/i.test(message)) {
                    expireAdminSession();
                }
                throw error;
            });
        };
        window.huellitasApi.adminSecureWrapped = true;
    }

    async function loginWithBackend(password) {
        if (!window.huellitasApi || !window.huellitasApi.enabled || typeof window.huellitasApi.request !== "function") {
            throw new Error("El servidor seguro no esta disponible.");
        }

        const data = await window.huellitasApi.request("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({ password: String(password || "") })
        });

        if (!data || !data.token) {
            throw new Error("El servidor no entrego una sesion valida.");
        }

        setAdminToken(data.token);
        sessionStorage.setItem(adminAccessKey, "true");
        wrapApiRequest();
        return true;
    }

    function showAdminMessage(title, message) {
        if (typeof window.mostrarAdminToast === "function") {
            window.mostrarAdminToast(title, message);
        }
    }

    function removeDangerButtons() {
        document.querySelectorAll("[onclick]").forEach(function (button) {
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

    function secureAdminForm() {
        const form = document.getElementById("adminAccessForm");
        const passwordInput = document.getElementById("adminPassword");
        const feedback = document.getElementById("adminAccessFeedback");

        if (!form || form.dataset.secureAdminReady === "true") {
            return;
        }

        form.dataset.secureAdminReady = "true";
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }

            const submit = form.querySelector('button[type="submit"]');
            if (submit) {
                submit.disabled = true;
                submit.textContent = "Verificando...";
            }
            if (feedback) {
                feedback.textContent = "Validando acceso seguro...";
            }

            try {
                await loginWithBackend(passwordInput && passwordInput.value);
                if (feedback) {
                    feedback.textContent = "Acceso concedido.";
                }
                applyAdminAccess();
                removeDangerButtons();

                if (typeof window.cargarTodo === "function") {
                    window.cargarTodo();
                }
            } catch (error) {
                clearAdminSession();
                if (feedback) {
                    feedback.textContent = error.message || "No fue posible validar la clave.";
                }
            } finally {
                if (passwordInput) {
                    passwordInput.value = "";
                }
                if (submit) {
                    submit.disabled = false;
                    submit.textContent = "Entrar al panel";
                }
            }
        }, true);
    }

    function wrapLogout() {
        if (typeof window.salirAdmin !== "function" || window.salirAdmin.adminSecureWrapped) {
            return;
        }

        const originalLogout = window.salirAdmin;
        window.salirAdmin = function () {
            const token = getAdminToken();
            if (token && window.huellitasApi && typeof window.huellitasApi.request === "function") {
                window.huellitasApi.request("/api/admin/logout", {
                    method: "POST",
                    headers: { "X-Huellitas-Admin-Token": token },
                    body: "{}"
                }).catch(function () {});
            }
            clearAdminSession();
            return originalLogout.apply(this, arguments);
        };
        window.salirAdmin.adminSecureWrapped = true;
    }

    onReady(function () {
        if (sessionStorage.getItem(adminAccessKey) === "true" && !getAdminToken()) {
            sessionStorage.removeItem(adminAccessKey);
        }

        wrapApiRequest();
        wrapLogout();
        secureAdminForm();
        removeDangerButtons();
        disableDangerActions();
        applyAdminAccess();

        if (document.body && window.MutationObserver) {
            new MutationObserver(function () {
                wrapApiRequest();
                wrapLogout();
                secureAdminForm();
                removeDangerButtons();
                disableDangerActions();
            }).observe(document.body, { childList: true, subtree: true });
        }
    });
})();