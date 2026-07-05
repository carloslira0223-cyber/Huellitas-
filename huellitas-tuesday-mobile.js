/*!
 * Proyecto Huellitas - Carlos Alexis Lira Alcala - 2026.
 * Martes: diseno movil y experiencia tipo app.
 */
(function () {
    "use strict";

    const STYLE_ID = "huellitas-tuesday-mobile-css";
    const STYLE_URL = "huellitas-tuesday-mobile.css?v=20260705-tuesday-v1";
    const LOCAL_ACCOUNTS_KEY = "huellitasLocalAccountsV2";
    const API_FALLBACK = "https://huellitas-vi7v.onrender.com";
    const MAIN_NAV = [
        { href: "pagina.html", label: "Inicio", symbol: "⌂" },
        { href: "adoptar.html", label: "Adoptar", symbol: "♡" },
        { href: "directorio.html", label: "Directorio", symbol: "⌖" },
        { href: "mascotas_perdidas.html", label: "Reportes", symbol: "!" },
        { href: "jueguitos.html", label: "Juegos", symbol: "✦" }
    ];

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    }

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = STYLE_URL;
        document.head.appendChild(link);
    }

    function fileName(value) {
        return String(value || "").split("#")[0].split("?")[0].split("/").pop().toLowerCase();
    }

    function currentFile() {
        return fileName(window.location.pathname) || "pagina.html";
    }

    function findSourceLink(nav, href) {
        return Array.from(nav.querySelectorAll("a.nav-link")).find(function (link) {
            return fileName(link.getAttribute("href")) === fileName(href);
        });
    }

    function createBottomItem(nav, meta) {
        const source = findSourceLink(nav, meta.href);
        const link = document.createElement("a");
        link.className = "tuesday-bottom-item";
        link.href = meta.href;
        link.setAttribute("aria-label", meta.label);
        if (fileName(meta.href) === currentFile()) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }

        const sourceIcon = source && source.querySelector(".huellitas-nav-icon");
        const icon = sourceIcon ? sourceIcon.cloneNode(true) : document.createElement("span");
        icon.classList.add("tuesday-bottom-icon");
        if (!sourceIcon) {
            icon.textContent = meta.symbol;
            icon.setAttribute("aria-hidden", "true");
        }

        const label = document.createElement("span");
        label.className = "tuesday-bottom-label";
        label.textContent = meta.label;
        link.append(icon, label);
        return link;
    }

    function openMoreMenu(nav) {
        nav.classList.add("nav-open");
        document.body.classList.add("mobile-nav-open");
        const toggle = nav.querySelector(".nav-menu-toggle");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "true");
        }
        const details = nav.querySelector(".huellitas-structure-more");
        if (details) {
            details.open = true;
            setTimeout(function () {
                details.scrollIntoView({ block: "center", behavior: "smooth" });
            }, 120);
        }
    }

    function buildBottomNavigation() {
        if (document.querySelector(".tuesday-bottom-nav")) {
            return;
        }
        const nav = document.querySelector(".site-nav");
        if (!nav) {
            return;
        }

        const bar = document.createElement("nav");
        bar.className = "tuesday-bottom-nav";
        bar.setAttribute("aria-label", "Navegacion rapida");
        MAIN_NAV.forEach(function (meta) {
            bar.appendChild(createBottomItem(nav, meta));
        });

        const more = document.createElement("button");
        more.type = "button";
        more.className = "tuesday-bottom-item tuesday-bottom-more";
        more.setAttribute("aria-label", "Abrir mas opciones");
        more.innerHTML = '<span class="tuesday-bottom-icon tuesday-more-symbol" aria-hidden="true">•••</span><span class="tuesday-bottom-label">Más</span>';
        more.addEventListener("click", function () {
            openMoreMenu(nav);
        });
        bar.appendChild(more);
        document.body.appendChild(bar);
        document.body.classList.add("tuesday-app-shell");
    }

    function manageVirtualKeyboard() {
        if (!window.visualViewport) {
            return;
        }
        function update() {
            const active = document.activeElement;
            const editing = active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
            const reduced = window.visualViewport.height < window.innerHeight * 0.72;
            document.body.classList.toggle("tuesday-keyboard-open", Boolean(editing && reduced));
        }
        window.visualViewport.addEventListener("resize", update);
        document.addEventListener("focusin", update);
        document.addEventListener("focusout", function () {
            setTimeout(update, 80);
        });
    }

    function apiBase() {
        if (window.huellitasApi && typeof window.huellitasApi.getBaseUrl === "function") {
            return window.huellitasApi.getBaseUrl() || API_FALLBACK;
        }
        return API_FALLBACK;
    }

    function timeoutController(milliseconds) {
        const controller = new AbortController();
        const timer = setTimeout(function () {
            controller.abort();
        }, milliseconds);
        return {
            signal: controller.signal,
            clear: function () { clearTimeout(timer); }
        };
    }

    function warmServer() {
        if (window.huellitasServerWarmPromise) {
            return window.huellitasServerWarmPromise;
        }
        const timeout = timeoutController(45000);
        window.huellitasServerWarmPromise = fetch(apiBase() + "/api/health", {
            method: "GET",
            cache: "no-store",
            signal: timeout.signal
        }).then(function (response) {
            return response.ok;
        }).catch(function () {
            return false;
        }).finally(timeout.clear);
        return window.huellitasServerWarmPromise;
    }

    async function fastApiRequest(path, options, milliseconds) {
        if (!window.huellitasApi || !window.huellitasApi.enabled) {
            throw new Error("El servidor de Huellitas no está disponible.");
        }
        const timeout = timeoutController(milliseconds || 18000);
        try {
            return await window.huellitasApi.request(path, Object.assign({}, options || {}, {
                signal: timeout.signal
            }));
        } catch (error) {
            if (error && error.name === "AbortError") {
                throw new Error("El servidor está despertando. Intenta nuevamente en unos segundos.");
            }
            throw error;
        } finally {
            timeout.clear();
        }
    }

    function readJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key)) || fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function bytesToHex(bytes) {
        return Array.from(new Uint8Array(bytes)).map(function (value) {
            return value.toString(16).padStart(2, "0");
        }).join("");
    }

    function randomSalt() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return bytesToHex(bytes);
    }

    async function passwordHash(password, salt) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("Este navegador no permite proteger la contraseña localmente.");
        }
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(String(password)),
            { name: "PBKDF2" },
            false,
            ["deriveBits"]
        );
        const bits = await crypto.subtle.deriveBits({
            name: "PBKDF2",
            hash: "SHA-256",
            salt: encoder.encode(String(salt)),
            iterations: 120000
        }, key, 256);
        return bytesToHex(bits);
    }

    function localAccounts() {
        return readJson(LOCAL_ACCOUNTS_KEY, []);
    }

    function publicLocalUser(account) {
        return {
            id: account.id || account.email,
            nombre: account.nombre,
            email: account.email,
            color: account.color || "#5f9d63",
            foto: account.foto || "",
            mascotaFavorita: account.mascotaFavorita || ""
        };
    }

    async function saveLocalAccount(user, password, pendingSync) {
        const accounts = localAccounts();
        const email = String(user.email || "").trim().toLowerCase();
        let account = accounts.find(function (item) { return item.email === email; });
        const salt = account && account.salt || randomSalt();
        const passHash = await passwordHash(password, salt);

        if (!account) {
            account = { id: user.id || email, email: email };
            accounts.push(account);
        }
        account.nombre = user.nombre;
        account.color = user.color || "#5f9d63";
        account.foto = user.foto || "";
        account.mascotaFavorita = user.mascotaFavorita || "";
        account.salt = salt;
        account.passHash = passHash;
        account.pendingSync = Boolean(pendingSync);
        account.updatedAt = new Date().toISOString();
        writeJson(LOCAL_ACCOUNTS_KEY, accounts);
        return account;
    }

    async function verifyLocalAccount(email, password) {
        const account = localAccounts().find(function (item) {
            return item.email === String(email || "").trim().toLowerCase();
        });
        if (!account || !account.salt || !account.passHash) {
            return null;
        }
        const actual = await passwordHash(password, account.salt);
        return actual === account.passHash ? account : null;
    }

    function showAuthMessage(message, type) {
        const element = document.getElementById("mensaje");
        if (!element) {
            return;
        }
        element.style.display = message ? "block" : "none";
        element.className = type || "";
        element.textContent = message || "";
    }

    function finishLogin(user, token, message) {
        if (token && window.huellitasApi) {
            window.huellitasApi.setToken(token);
        }
        localStorage.setItem("sesion", JSON.stringify(user));
        showAuthMessage(message || "Sesión iniciada correctamente.", "success");
        const panel = document.getElementById("panelLogin");
        if (panel) {
            panel.classList.remove("active");
        }
        if (typeof window.cargarUsuario === "function") {
            window.cargarUsuario();
        }
        if (window.huellitasMountProfile) {
            window.huellitasMountProfile();
        }
    }

    function setSubmitState(formId, busy, busyLabel, idleLabel) {
        const button = document.querySelector("#" + formId + ' button[type="submit"]');
        if (!button) {
            return;
        }
        button.disabled = busy;
        button.textContent = busy ? busyLabel : idleLabel;
    }

    function fileAsDataUrl(input) {
        return new Promise(function (resolve, reject) {
            const file = input && input.files && input.files[0];
            if (!file) {
                resolve("");
                return;
            }
            if (file.size > 1600000) {
                reject(new Error("La foto es muy pesada. Usa una imagen menor a 1.6 MB."));
                return;
            }
            const reader = new FileReader();
            reader.onload = function () { resolve(reader.result); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function syncRegistration(account, password) {
        try {
            const data = await fastApiRequest("/api/register", {
                method: "POST",
                body: JSON.stringify({
                    nombre: account.nombre,
                    email: account.email,
                    pass: password,
                    color: account.color,
                    foto: account.foto
                })
            }, 45000);
            const saved = await saveLocalAccount(data.user, password, false);
            if (data.token && window.huellitasApi) {
                window.huellitasApi.setToken(data.token);
            }
            localStorage.setItem("sesion", JSON.stringify(publicLocalUser(saved)));
        } catch (error) {
            if (/registrado/i.test(String(error && error.message || ""))) {
                try {
                    const data = await fastApiRequest("/api/login", {
                        method: "POST",
                        body: JSON.stringify({ email: account.email, pass: password })
                    }, 30000);
                    await saveLocalAccount(data.user, password, false);
                    if (data.token && window.huellitasApi) {
                        window.huellitasApi.setToken(data.token);
                    }
                } catch (ignored) {}
            }
        }
    }

    async function tuesdayRegister(event) {
        if (event) {
            event.preventDefault();
        }
        const nombre = String(document.getElementById("nombre") && document.getElementById("nombre").value || "").trim();
        const email = String(document.getElementById("email") && document.getElementById("email").value || "").trim().toLowerCase();
        const password = String(document.getElementById("newPass") && document.getElementById("newPass").value || "");
        const color = String(document.getElementById("color") && document.getElementById("color").value || "#5f9d63");

        if (!nombre || !email || password.length < 6) {
            showAuthMessage("Completa nombre, correo y una contraseña de al menos 6 caracteres.", "error");
            return;
        }

        setSubmitState("registerForm", true, "Creando...", "Crear cuenta");
        showAuthMessage("Protegiendo tu cuenta...", "");
        try {
            const foto = await fileAsDataUrl(document.getElementById("foto"));
            const existing = localAccounts().find(function (item) { return item.email === email; });
            if (existing) {
                throw new Error("Ese correo ya tiene una cuenta en este dispositivo.");
            }
            const account = await saveLocalAccount({
                nombre: nombre,
                email: email,
                color: color,
                foto: foto
            }, password, true);
            finishLogin(publicLocalUser(account), "", "Cuenta creada. Ya puedes usar Huellitas.");
            warmServer();
            syncRegistration(account, password);
        } catch (error) {
            showAuthMessage(error.message || "No fue posible crear la cuenta.", "error");
        } finally {
            setSubmitState("registerForm", false, "Creando...", "Crear cuenta");
        }
    }

    async function syncLogin(email, password) {
        try {
            const data = await fastApiRequest("/api/login", {
                method: "POST",
                body: JSON.stringify({ email: email, pass: password })
            }, 35000);
            await saveLocalAccount(data.user, password, false);
            if (data.token && window.huellitasApi) {
                window.huellitasApi.setToken(data.token);
            }
            localStorage.setItem("sesion", JSON.stringify(data.user));
        } catch (ignored) {}
    }

    async function tuesdayLogin(event) {
        if (event) {
            event.preventDefault();
        }
        const email = String(document.getElementById("loginUser") && document.getElementById("loginUser").value || "").trim().toLowerCase();
        const password = String(document.getElementById("loginPass") && document.getElementById("loginPass").value || "");
        if (!email || !password) {
            showAuthMessage("Escribe tu correo y contraseña.", "error");
            return;
        }

        setSubmitState("loginForm", true, "Ingresando...", "Ingresar");
        showAuthMessage("Verificando tu cuenta...", "");
        try {
            const local = await verifyLocalAccount(email, password);
            if (local) {
                finishLogin(publicLocalUser(local), "", "Bienvenido " + local.nombre + ".");
                warmServer();
                syncLogin(email, password);
                return;
            }

            warmServer();
            const data = await fastApiRequest("/api/login", {
                method: "POST",
                body: JSON.stringify({ email: email, pass: password })
            }, 18000);
            const account = await saveLocalAccount(data.user, password, false);
            finishLogin(publicLocalUser(account), data.token, "Bienvenido " + data.user.nombre + ".");
        } catch (error) {
            showAuthMessage(error.message || "No fue posible iniciar sesión.", "error");
        } finally {
            setSubmitState("loginForm", false, "Ingresando...", "Ingresar");
        }
    }

    async function migrateLegacyAccounts() {
        const legacy = readJson("usuarios", []);
        if (!legacy.length) {
            return;
        }
        for (const user of legacy) {
            if (user && user.email && user.pass) {
                try {
                    await saveLocalAccount(user, user.pass, true);
                } catch (ignored) {}
            }
        }
        const publicLegacy = legacy.map(function (user) {
            const clean = Object.assign({}, user);
            delete clean.pass;
            return clean;
        });
        writeJson("usuarios", publicLegacy);
    }

    function wireFastAuth() {
        if (!document.getElementById("panelLogin")) {
            return;
        }
        window.login = tuesdayLogin;
        window.registro = tuesdayRegister;
        migrateLegacyAccounts();
    }

    function markTouchReady() {
        document.querySelectorAll("button, .button-link, input, select, textarea").forEach(function (element) {
            element.classList.add("tuesday-touch-ready");
        });
    }

    function init() {
        ensureStyles();
        buildBottomNavigation();
        manageVirtualKeyboard();
        wireFastAuth();
        markTouchReady();
        warmServer();

        if (window.MutationObserver) {
            let scheduled = false;
            new MutationObserver(function () {
                if (scheduled) {
                    return;
                }
                scheduled = true;
                setTimeout(function () {
                    scheduled = false;
                    buildBottomNavigation();
                    markTouchReady();
                }, 80);
            }).observe(document.body, { childList: true, subtree: true });
        }
    }

    ensureStyles();
    onReady(init);
})();