/*!
 * Proyecto Huellitas - Carlos Alexis Lira Alcala - 2026.
 * Refuerzo final de navegacion, cuenta, perfil y sincronizacion movil.
 */
(function () {
    "use strict";

    const STYLE_ID = "huellitas-mobile-final-fixes-css";
    const STYLE_URL = "huellitas-mobile-final-fixes.css?v=20260806-mobile-v3";
    const ACCOUNTS_KEY = "huellitasLocalAccountsV2";
    const API_FALLBACK = "https://huellitas-vi7v.onrender.com";
    const PENDING_API_KEY = "huellitasPendingApiWritesV1";
    let flushingPendingWrites = false;
    const IMAGE_KEYS = [
        "usuarios",
        "sesion",
        "huellitasLocalAccountsV2",
        "huellitasMascotasExtra",
        "huellitasMascotasPerdidas",
        "huellitasReportes",
        "huellitasCentrosRevision",
        "huellitasBuzon"
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

    function readJson(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function isDataImage(value) {
        return /^data:image\//i.test(String(value || ""));
    }

    function stripLargeImages(value, keepSmall) {
        if (typeof value === "string") {
            if (isDataImage(value) && (!keepSmall || value.length > 70000)) {
                return "";
            }
            return value;
        }
        if (Array.isArray(value)) {
            return value.map(function (item) { return stripLargeImages(item, keepSmall); });
        }
        if (value && typeof value === "object") {
            const clean = {};
            Object.keys(value).forEach(function (key) {
                clean[key] = stripLargeImages(value[key], keepSmall);
            });
            return clean;
        }
        return value;
    }

    function cleanupStorage(keepCurrentSessionPhoto) {
        const keys = [];
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key && keys.indexOf(key) < 0) {
                keys.push(key);
            }
        }
        IMAGE_KEYS.forEach(function (key) {
            if (keys.indexOf(key) < 0) {
                keys.push(key);
            }
        });

        keys.forEach(function (key) {
            try {
                const value = localStorage.getItem(key);
                if (!value || value.indexOf("data:image/") < 0) {
                    return;
                }
                const parsed = JSON.parse(value);
                const preserveSessionImage = key === "sesion" && keepCurrentSessionPhoto;
                const cleaned = stripLargeImages(parsed, preserveSessionImage);
                localStorage.setItem(key, JSON.stringify(cleaned));
            } catch (ignored) {
                try {
                    const raw = localStorage.getItem(key);
                    if (/^data:image\//i.test(String(raw || ""))) {
                        localStorage.removeItem(key);
                    }
                } catch (ignoredAgain) {}
            }
        });
    }

    function makeRoomForAccount() {
        cleanupStorage(false);
        [
            "huellitasNotificaciones",
            "huellitasBuzon",
            "huellitasFavoritos",
            "huellitasReportes",
            "huellitasSolicitudesAdopcion",
            "huellitasMascotasExtra",
            "huellitasMascotasPerdidas",
            "huellitasCentrosRevision"
        ].forEach(function (key) {
            try {
                const value = readJson(key, null);
                if (Array.isArray(value) && value.length > 30) {
                    localStorage.setItem(key, JSON.stringify(stripLargeImages(value.slice(0, 30), false)));
                } else if (value && typeof value === "object") {
                    localStorage.setItem(key, JSON.stringify(stripLargeImages(value, false)));
                }
            } catch (ignored) {}
        });
    }

    function safeSetJson(key, value, options) {
        const text = JSON.stringify(value);
        try {
            localStorage.setItem(key, text);
            return value;
        } catch (error) {
            cleanupStorage(Boolean(options && options.keepCurrentSessionPhoto));
            try {
                localStorage.setItem(key, text);
                return value;
            } catch (secondError) {
                makeRoomForAccount();
                const compact = stripLargeImages(value, false);
                try {
                    localStorage.setItem(key, JSON.stringify(compact));
                    return compact;
                } catch (lastError) {
                    try {
                        localStorage.removeItem(key);
                        localStorage.setItem(key, JSON.stringify(compact));
                        return compact;
                    } catch (finalError) {
                        throw new Error("No queda espacio para guardar este perfil. Quita fotos pesadas e intenta de nuevo.");
                    }
                }
            }
        }
    }

    function bytesToHex(bytes) {
        return Array.from(new Uint8Array(bytes)).map(function (value) {
            return value.toString(16).padStart(2, "0");
        }).join("");
    }

    function randomSalt() {
        const bytes = new Uint8Array(16);
        if (window.crypto && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
            return bytesToHex(bytes);
        }
        return String(Date.now()) + Math.random().toString(16).slice(2);
    }

    async function passwordHash(password, salt) {
        if (!window.crypto || !window.crypto.subtle) {
            return btoa(unescape(encodeURIComponent(String(salt) + ":" + String(password))));
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

    function publicUser(account) {
        return {
            id: account.id || account.email,
            nombre: account.nombre || "Perfil Huellitas",
            email: account.email || "",
            color: account.color || "#5f9d63",
            foto: account.foto || "",
            mascotaFavorita: account.mascotaFavorita || ""
        };
    }

    function localAccounts() {
        const accounts = readJson(ACCOUNTS_KEY, []);
        return Array.isArray(accounts) ? accounts : [];
    }

    async function saveLocalAccount(user, password, pendingSync) {
        const email = String(user.email || "").trim().toLowerCase();
        const accounts = localAccounts();
        let account = accounts.find(function (item) { return item.email === email; });
        if (!account) {
            account = { id: user.id || email, email: email };
            accounts.push(account);
        }
        const salt = account.salt || randomSalt();
        account.nombre = user.nombre || account.nombre || "Perfil Huellitas";
        account.color = user.color || account.color || "#5f9d63";
        account.foto = user.foto || account.foto || "";
        account.mascotaFavorita = user.mascotaFavorita || account.mascotaFavorita || "";
        account.salt = salt;
        if (password) {
            account.passHash = await passwordHash(password, salt);
        }
        account.pendingSync = Boolean(pendingSync);
        account.updatedAt = new Date().toISOString();
        safeSetJson(ACCOUNTS_KEY, accounts, { keepCurrentSessionPhoto: true });
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

    function setSubmitState(formId, busy, busyLabel, idleLabel) {
        const button = document.querySelector("#" + formId + ' button[type="submit"]');
        if (!button) {
            return;
        }
        button.disabled = busy;
        button.textContent = busy ? busyLabel : idleLabel;
    }

    function finishLogin(user, token, message) {
        if (token && window.huellitasApi && typeof window.huellitasApi.setToken === "function") {
            window.huellitasApi.setToken(token);
        }
        const stored = safeSetJson("sesion", user, { keepCurrentSessionPhoto: true });
        showAuthMessage(message || "Sesion iniciada correctamente.", "success");
        const panel = document.getElementById("panelLogin");
        if (panel) {
            panel.classList.remove("active");
        }
        document.body.classList.remove("mobile-modal-open");
        if (typeof window.cargarUsuario === "function") {
            window.cargarUsuario();
        }
        if (typeof window.huellitasMountProfile === "function") {
            window.huellitasMountProfile();
        }
        return stored;
    }

    function compressPhoto(input) {
        return new Promise(function (resolve, reject) {
            const file = input && input.files && input.files[0];
            if (!file) {
                resolve("");
                return;
            }
            if (!/^image\//i.test(file.type || "") || file.size > 9000000) {
                reject(new Error("Selecciona una imagen valida menor a 9 MB."));
                return;
            }
            const reader = new FileReader();
            reader.onerror = function () { reject(new Error("No se pudo leer la foto.")); };
            reader.onload = function () {
                const image = new Image();
                image.onerror = function () { reject(new Error("La foto no tiene un formato compatible.")); };
                image.onload = function () {
                    const maxSide = 112;
                    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
                    const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
                    const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    context.fillStyle = "#ffffff";
                    context.fillRect(0, 0, width, height);
                    context.drawImage(image, 0, 0, width, height);
                    let output = canvas.toDataURL("image/jpeg", 0.52);
                    if (output.length > 65000) {
                        output = canvas.toDataURL("image/jpeg", 0.4);
                    }
                    resolve(output.length > 52000 ? "" : output);
                };
                image.src = String(reader.result || "");
            };
            reader.readAsDataURL(file);
        });
    }

    function apiBase() {
        if (window.huellitasApi && typeof window.huellitasApi.getBaseUrl === "function") {
            return window.huellitasApi.getBaseUrl() || API_FALLBACK;
        }
        return API_FALLBACK;
    }

    function pendingServerWrites() {
        const pending = readJson(PENDING_API_KEY, []);
        return Array.isArray(pending) ? pending : [];
    }

    function canQueueServerWrite(path, options) {
        const method = String(options && options.method || "GET").toUpperCase();
        if (method !== "POST" || !/^\/api\//.test(String(path || ""))) {
            return false;
        }
        return !/^\/api\/(login|register|health|admin(?:\/|$))/.test(String(path || ""));
    }

    function queueServerWrite(path, options) {
        if (!canQueueServerWrite(path, options) || options && options.skipQueue) {
            return;
        }
        const body = String(options && options.body || "");
        if (!body || body.length > 180000) {
            return;
        }
        const key = String(path) + "|" + body;
        const pending = pendingServerWrites().filter(function (item) {
            return item && item.key !== key;
        });
        pending.push({
            key: key,
            path: String(path),
            method: String(options && options.method || "POST").toUpperCase(),
            body: body,
            savedAt: Date.now()
        });
        safeSetJson(PENDING_API_KEY, pending.slice(-24), { keepCurrentSessionPhoto: false });
    }

    function flushPendingServerWrites() {
        if (flushingPendingWrites || !window.huellitasApi || !window.huellitasApi.enabled) {
            return;
        }
        const pending = pendingServerWrites();
        if (!pending.length) {
            return;
        }
        flushingPendingWrites = true;
        let remaining = pending.slice();

        function nextWrite() {
            const entry = remaining.shift();
            if (!entry) {
                safeSetJson(PENDING_API_KEY, [], { keepCurrentSessionPhoto: false });
                flushingPendingWrites = false;
                return;
            }
            apiRequest(entry.path, {
                method: entry.method || "POST",
                body: entry.body || "",
                skipQueue: true
            }, 55000).then(function () {
                nextWrite();
            }).catch(function () {
                const untouched = [entry].concat(remaining);
                safeSetJson(PENDING_API_KEY, untouched.slice(-24), { keepCurrentSessionPhoto: false });
                flushingPendingWrites = false;
            });
        }

        nextWrite();
    }

    function apiRequest(path, options, milliseconds) {
        if (!window.huellitasApi || !window.huellitasApi.enabled) {
            return Promise.reject(new Error("El servidor no esta disponible ahora."));
        }

        const controller = window.AbortController ? new AbortController() : null;
        const timeout = Math.max(12000, Math.min(Number(milliseconds || 50000), 60000));
        const requestOptions = Object.assign({ method: "GET" }, options || {});
        const skipQueue = Boolean(requestOptions.skipQueue);
        delete requestOptions.skipQueue;
        const headers = Object.assign({ "Content-Type": "application/json" }, requestOptions.headers || {});
        const token = localStorage.getItem("huellitasToken") || "";
        const timer = controller ? setTimeout(function () { controller.abort(); }, timeout) : 0;

        if (token && !headers.Authorization) {
            headers.Authorization = "Bearer " + token;
        }

        return fetch(apiBase() + path, Object.assign({}, requestOptions, {
            headers: headers,
            cache: "no-store",
            signal: controller ? controller.signal : requestOptions.signal
        })).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (data) {
                if (!response.ok || data.ok === false) {
                    throw new Error(data.error || "No se pudo completar la accion.");
                }
                return data;
            });
        }).catch(function (error) {
            if (!skipQueue) {
                queueServerWrite(path, options);
            }
            if (error && error.name === "AbortError") {
                throw new Error("El servidor tarda en responder. Tu informacion queda en este dispositivo y se sincronizara cuando Huellitas este disponible.");
            }
            throw error;
        }).finally(function () {
            if (timer) {
                clearTimeout(timer);
            }
        });
    }

    function warmServer() {
        try {
            fetch(apiBase() + "/api/health", { cache: "no-store" }).catch(function () {});
        } catch (ignored) {}
    }

    function improveServerTransport() {
        if (!window.huellitasApi || window.huellitasApi.mobileFinalTransport) {
            return;
        }
        window.huellitasApi.request = function (path, options) {
            return apiRequest(path, options, 50000);
        };
        window.huellitasApi.mobileFinalTransport = true;
        window.addEventListener("online", flushPendingServerWrites);
        window.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "visible") {
                flushPendingServerWrites();
            }
        });
        setTimeout(flushPendingServerWrites, 1800);
    }

    async function finalRegister(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const nombre = String(document.getElementById("nombre") && document.getElementById("nombre").value || "").trim();
        const email = String(document.getElementById("email") && document.getElementById("email").value || "").trim().toLowerCase();
        const password = String(document.getElementById("newPass") && document.getElementById("newPass").value || "");
        const color = String(document.getElementById("color") && document.getElementById("color").value || "#5f9d63");
        if (!nombre || !email || password.length < 6) {
            showAuthMessage("Completa nombre, correo y una contrasena de al menos 6 caracteres.", "error");
            return;
        }

        setSubmitState("registerForm", true, "Creando...", "Crear cuenta");
        showAuthMessage("Creando tu perfil. Tambien lo sincronizaremos con Huellitas.", "");
        try {
            makeRoomForAccount();
            const foto = await compressPhoto(document.getElementById("foto"));
            if (localAccounts().some(function (item) { return item.email === email; })) {
                throw new Error("Ese correo ya tiene una cuenta en este dispositivo.");
            }
            const account = await saveLocalAccount({ nombre: nombre, email: email, color: color, foto: foto }, password, true);
            const user = publicUser(account);
            user.foto = foto || user.foto;
            const legacy = readJson("usuarios", []);
            if (Array.isArray(legacy) && !legacy.some(function (item) { return String(item.email || "").toLowerCase() === email; })) {
                legacy.push(user);
                safeSetJson("usuarios", legacy, { keepCurrentSessionPhoto: false });
            }
            finishLogin(user, "", "Cuenta creada. Ya puedes usar Huellitas.");
            warmServer();

            apiRequest("/api/register", {
                method: "POST",
                body: JSON.stringify({ nombre: nombre, email: email, pass: password, color: color, foto: foto })
            }, 55000).then(function (data) {
                if (!data || !data.user) {
                    return;
                }
                saveLocalAccount(data.user, password, false).then(function (saved) {
                    const syncedUser = publicUser(saved);
                    syncedUser.foto = data.user.foto || user.foto || "";
                    finishLogin(syncedUser, data.token || "", "Cuenta sincronizada con Huellitas.");
                });
            }).catch(function () {
                // El perfil local queda disponible; no guardamos la contrasena en una cola del navegador.
            });
        } catch (error) {
            showAuthMessage(error.message || "No fue posible crear la cuenta.", "error");
        } finally {
            setSubmitState("registerForm", false, "Creando...", "Crear cuenta");
        }
    }

    async function finalLogin(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const email = String(document.getElementById("loginUser") && document.getElementById("loginUser").value || "").trim().toLowerCase();
        const password = String(document.getElementById("loginPass") && document.getElementById("loginPass").value || "");
        if (!email || !password) {
            showAuthMessage("Escribe tu correo y contrasena.", "error");
            return;
        }

        setSubmitState("loginForm", true, "Ingresando...", "Ingresar");
        showAuthMessage("Verificando tu cuenta...", "");
        try {
            const local = await verifyLocalAccount(email, password);
            if (local) {
                finishLogin(publicUser(local), "", "Bienvenido " + local.nombre + ".");
                warmServer();
                apiRequest("/api/login", {
                    method: "POST",
                    body: JSON.stringify({ email: email, pass: password })
                }, 55000).then(function (data) {
                    if (data && data.user) {
                        saveLocalAccount(data.user, password, false);
                        if (data.token && window.huellitasApi) {
                            window.huellitasApi.setToken(data.token);
                        }
                    }
                }).catch(function () {});
                return;
            }

            showAuthMessage("Conectando con Huellitas. Puede tardar un momento al iniciar el servidor...", "");
            const data = await apiRequest("/api/login", {
                method: "POST",
                body: JSON.stringify({ email: email, pass: password })
            }, 55000);
            const account = await saveLocalAccount(data.user, password, false);
            const user = publicUser(account);
            user.foto = data.user && data.user.foto || user.foto;
            finishLogin(user, data.token || "", "Bienvenido " + account.nombre + ".");
        } catch (error) {
            showAuthMessage(error.message || "No fue posible iniciar sesion.", "error");
        } finally {
            setSubmitState("loginForm", false, "Ingresando...", "Ingresar");
        }
    }

    function enhanceAuthPanel() {
        const panel = document.getElementById("panelLogin");
        if (!panel || panel.dataset.mobileFinalAuthReady === "true") {
            return;
        }
        panel.dataset.mobileFinalAuthReady = "true";
        panel.classList.add("huellitas-auth-panel");

        const close = panel.querySelector("[data-account-panel-close]");
        if (close) {
            close.setAttribute("aria-label", "Cerrar acceso");
        }

        panel.querySelectorAll('input[type="email"]').forEach(function (input) {
            input.setAttribute("autocomplete", input.id === "email" ? "email" : "username");
            input.setAttribute("inputmode", "email");
        });
        panel.querySelectorAll('input[type="password"]').forEach(function (input) {
            input.setAttribute("autocomplete", input.id === "newPass" ? "new-password" : "current-password");
            input.setAttribute("minlength", "6");
        });

        const register = document.getElementById("registerForm");
        if (register && !register.querySelector(".auth-storage-note")) {
            const note = document.createElement("p");
            note.className = "auth-storage-note";
            note.textContent = "Tu perfil queda disponible en este dispositivo y se sincroniza cuando Huellitas responde.";
            register.appendChild(note);
        }
    }

    function wireAuth() {
        if (!document.getElementById("panelLogin")) {
            return;
        }
        window.registro = finalRegister;
        window.login = finalLogin;
        enhanceAuthPanel();
    }

    function updateProfileStores(user) {
        const email = String(user.email || "").trim().toLowerCase();
        const accounts = localAccounts();
        const account = accounts.find(function (item) { return item.email === email; });
        if (account) {
            account.nombre = user.nombre || account.nombre;
            account.color = user.color || account.color || "#5f9d63";
            account.foto = user.foto || account.foto || "";
            account.updatedAt = new Date().toISOString();
            safeSetJson(ACCOUNTS_KEY, accounts, { keepCurrentSessionPhoto: true });
        }
        const saved = publicUser(Object.assign({}, account || {}, user));
        safeSetJson("sesion", saved, { keepCurrentSessionPhoto: true });
        const legacy = readJson("usuarios", []);
        if (Array.isArray(legacy)) {
            const index = legacy.findIndex(function (item) { return String(item.email || "").toLowerCase() === email; });
            if (index >= 0) {
                legacy[index] = Object.assign({}, legacy[index], saved);
            } else {
                legacy.push(saved);
            }
            safeSetJson("usuarios", legacy, { keepCurrentSessionPhoto: false });
        }
        return saved;
    }

    function closeEditPanel() {
        const panel = document.getElementById("editarPanel");
        if (panel) {
            panel.classList.remove("active");
        }
        document.body.classList.remove("mobile-modal-open");
    }

    function openEditProfile(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const user = readJson("sesion", null);
        const panel = document.getElementById("editarPanel");
        if (!user || !panel) {
            return;
        }
        const name = document.getElementById("editNombre");
        const color = document.getElementById("editColor");
        if (name) {
            name.value = user.nombre || "";
        }
        if (color) {
            color.value = user.color || "#5f9d63";
        }
        document.querySelectorAll("#menuPerfil,.profile-popover").forEach(function (popover) {
            popover.style.display = "none";
        });
        panel.classList.add("active");
        panel.scrollTop = 0;
        document.body.classList.add("mobile-modal-open");
    }

    async function saveEditedProfile(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const user = readJson("sesion", null);
        if (!user) {
            return;
        }
        const nameInput = document.getElementById("editNombre");
        const colorInput = document.getElementById("editColor");
        const name = String(nameInput && nameInput.value || "").trim();
        if (!name) {
            showAuthMessage("Escribe un nombre para tu perfil.", "error");
            return;
        }
        try {
            makeRoomForAccount();
            const foto = await compressPhoto(document.getElementById("editFoto"));
            const updated = Object.assign({}, user, {
                nombre: name,
                color: String(colorInput && colorInput.value || user.color || "#5f9d63")
            });
            if (foto) {
                updated.foto = foto;
            }
            const saved = updateProfileStores(updated);
            closeEditPanel();
            if (typeof window.cargarUsuario === "function") {
                window.cargarUsuario();
            }
            if (typeof window.huellitasMountProfile === "function") {
                window.huellitasMountProfile();
            }
            showAuthMessage("Perfil actualizado correctamente.", "success");
            apiRequest("/api/profile", { method: "POST", body: JSON.stringify(saved) }, 55000).catch(function () {});
        } catch (error) {
            showAuthMessage(error.message || "No se pudo actualizar el perfil.", "error");
        }
    }

    function simplifyProfile(popover) {
        if (!popover || popover.dataset.mobileFinalProfileReady === "true") {
            return;
        }
        popover.dataset.mobileFinalProfileReady = "true";

        const tabs = popover.querySelector(".profile-tabs");
        if (tabs) {
            const extraTabs = Array.from(tabs.querySelectorAll("[data-profile-tab]")).filter(function (button) {
                return ["logros", "patitas", "buzon"].indexOf(button.dataset.profileTab || "") >= 0;
            });

            if (extraTabs.length) {
                const details = document.createElement("details");
                details.className = "profile-secondary-tabs";
                details.innerHTML = '<summary><span>Mas del perfil</span><small>Logros, patitas y buzon</small></summary><div class="profile-secondary-tab-list"></div>';
                const list = details.querySelector(".profile-secondary-tab-list");
                extraTabs.forEach(function (button) {
                    list.appendChild(button);
                });
                list.addEventListener("click", function (event) {
                    if (event.target.closest("[data-profile-tab]")) {
                        details.open = false;
                    }
                });
                tabs.insertAdjacentElement("afterend", details);
            }
        }

        Array.from(popover.querySelectorAll(".profile-section")).forEach(function (section) {
            const heading = section.querySelector(":scope > h3");
            const title = String(heading && heading.textContent || "").trim().toLowerCase();
            if (title.indexOf("preferencias") >= 0 && !section.querySelector(".profile-preferences")) {
                const details = document.createElement("details");
                details.className = "profile-preferences";
                details.innerHTML = '<summary>Preferencias</summary><div class="profile-preferences-content"></div>';
                const content = details.querySelector(".profile-preferences-content");
                Array.from(section.children).forEach(function (child) {
                    if (child !== heading) {
                        content.appendChild(child);
                    }
                });
                if (heading) {
                    heading.remove();
                }
                section.appendChild(details);
            }
            if (title.indexOf("accesos") >= 0) {
                section.classList.add("profile-quick-access");
            }
        });
    }

    function wireProfile() {
        window.abrirEditar = openEditProfile;
        window.guardarCambios = saveEditedProfile;
        document.querySelectorAll("#menuPerfil,.profile-popover").forEach(function (popover) {
            popover.setAttribute("role", "dialog");
            popover.style.maxWidth = "";
            simplifyProfile(popover);
        });
    }

    function closeMobileNav(nav) {
        if (!nav) {
            return;
        }
        nav.classList.remove("nav-open");
        document.body.classList.remove("mobile-nav-open");
        const toggle = nav.querySelector(".nav-menu-toggle");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
        }
    }

    function openMobileNav(nav) {
        if (!nav) {
            return;
        }
        nav.classList.add("nav-open");
        document.body.classList.add("mobile-nav-open");
        const toggle = nav.querySelector(".nav-menu-toggle");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "true");
        }
        const links = nav.querySelector(".nav-links");
        if (links) {
            links.scrollTop = 0;
        }
    }

    function positionMorePanel(details) {
        const summary = details && details.querySelector(":scope > summary");
        if (!summary || window.innerWidth <= 900) {
            return;
        }
        const rect = summary.getBoundingClientRect();
        details.style.setProperty("--more-panel-top", Math.round(rect.bottom + 8) + "px");
        details.style.setProperty("--more-panel-right", Math.max(12, Math.round(window.innerWidth - rect.right)) + "px");
    }

    function wireMore() {
        document.querySelectorAll(".huellitas-structure-more").forEach(function (details) {
            const oldSummary = details.querySelector(":scope > summary");
            const panel = details.querySelector(":scope > .huellitas-structure-more-panel");

            if (panel) {
                panel.querySelectorAll(".huellitas-extra").forEach(function (link) {
                    link.classList.remove("huellitas-extra");
                });
            }

            if (!oldSummary || details.dataset.mobileFinalMoreVersion === "3") {
                return;
            }

            const summary = oldSummary.cloneNode(true);
            oldSummary.replaceWith(summary);
            details.dataset.mobileFinalMoreVersion = "3";
            summary.setAttribute("role", "button");
            summary.setAttribute("tabindex", "0");
            summary.setAttribute("aria-expanded", details.open ? "true" : "false");

            function setOpen(opening) {
                const nav = details.closest(".site-nav");
                if (window.innerWidth <= 900) {
                    openMobileNav(nav);
                }
                document.querySelectorAll(".huellitas-structure-more[open]").forEach(function (other) {
                    if (other !== details) {
                        other.open = false;
                        other.classList.remove("huellitas-more-open");
                        const otherSummary = other.querySelector(":scope > summary");
                        if (otherSummary) {
                            otherSummary.setAttribute("aria-expanded", "false");
                        }
                    }
                });
                details.open = opening;
                details.classList.toggle("huellitas-more-open", opening);
                summary.setAttribute("aria-expanded", opening ? "true" : "false");
                if (opening) {
                    positionMorePanel(details);
                    window.requestAnimationFrame(function () {
                        if (window.innerWidth <= 900) {
                            details.scrollIntoView({ block: "nearest", behavior: "smooth" });
                        }
                    });
                }
            }

            function activate(event) {
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === "function") {
                    event.stopImmediatePropagation();
                }
                setOpen(!details.open);
            }

            summary.addEventListener("click", activate, true);
            summary.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    activate(event);
                }
            }, true);
        });
    }

    function stabilizeProfileOpening() {
        const originalToggle = window.toggleMenu;
        if (typeof originalToggle === "function" && !originalToggle.mobileFinalWrapped) {
            window.toggleMenu = function () {
                const result = originalToggle.apply(this, arguments);
                setTimeout(function () {
                    const menu = document.getElementById("menuPerfil") || document.querySelector(".profile-popover");
                    if (menu && getComputedStyle(menu).display !== "none") {
                        document.body.classList.add("profile-sheet-open");
                        menu.scrollTop = 0;
                    }
                }, 0);
                return result;
            };
            window.toggleMenu.mobileFinalWrapped = true;
        }
        const originalClose = window.cerrarMenuPerfil;
        if (typeof originalClose === "function" && !originalClose.mobileFinalWrapped) {
            window.cerrarMenuPerfil = function () {
                document.body.classList.remove("profile-sheet-open");
                return originalClose.apply(this, arguments);
            };
            window.cerrarMenuPerfil.mobileFinalWrapped = true;
        }
    }

    function stabilizeCarousel() {
        document.querySelectorAll(".featured-pets-grid").forEach(function (grid) {
            if (grid.children.length > 1) {
                grid.classList.add("featured-carousel");
            }
        });
        document.querySelectorAll(".featured-carousel-controls").forEach(function (controls) {
            controls.style.maxWidth = "100%";
        });
    }

    function closeMorePanel(details) {
        if (!details) {
            return;
        }
        details.open = false;
        details.classList.remove("huellitas-more-open");
        const summary = details.querySelector(":scope > summary");
        if (summary) {
            summary.setAttribute("aria-expanded", "false");
        }
    }

    function handleTransientNavigation() {
        if (document.documentElement.dataset.mobileFinalTransientNavigation === "true") {
            return;
        }
        document.documentElement.dataset.mobileFinalTransientNavigation = "true";

        document.addEventListener("pointerdown", function (event) {
            document.querySelectorAll(".huellitas-structure-more[open]").forEach(function (details) {
                if (!details.contains(event.target)) {
                    closeMorePanel(details);
                }
            });
        }, true);

        document.addEventListener("click", function (event) {
            const close = event.target.closest && event.target.closest(".site-nav .huellitas-mobile-close");
            if (close) {
                event.preventDefault();
                event.stopPropagation();
                const nav = close.closest(".site-nav");
                closeMobileNav(nav);
                return;
            }

            const secondaryLink = event.target.closest && event.target.closest(".huellitas-structure-more-panel a");
            if (secondaryLink) {
                const details = secondaryLink.closest(".huellitas-structure-more");
                closeMorePanel(details);
                closeMobileNav(secondaryLink.closest(".site-nav"));
            }
        }, true);

        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }
            document.querySelectorAll(".huellitas-structure-more[open]").forEach(closeMorePanel);
            document.querySelectorAll(".site-nav.nav-open").forEach(closeMobileNav);
        }, true);
    }

    function handleClicks() {
        if (document.documentElement.dataset.mobileFinalClicks === "true") {
            return;
        }
        document.documentElement.dataset.mobileFinalClicks = "true";
        document.addEventListener("click", function (event) {
            const toggle = event.target.closest && event.target.closest(".site-nav .nav-menu-toggle");
            if (toggle && window.innerWidth <= 900) {
                const nav = toggle.closest(".site-nav");
                event.preventDefault();
                event.stopPropagation();
                if (typeof event.stopImmediatePropagation === "function") {
                    event.stopImmediatePropagation();
                }
                if (nav.classList.contains("nav-open")) {
                    closeMobileNav(nav);
                } else {
                    document.querySelectorAll(".site-nav.nav-open").forEach(closeMobileNav);
                    openMobileNav(nav);
                }
                return;
            }

            const profileEdit = event.target.closest && event.target.closest('.profile-edit-link, [onclick*="abrirEditar"]');
            if (profileEdit) {
                openEditProfile(event);
                return;
            }

            const editClose = event.target.closest && event.target.closest("#editarPanel [data-account-panel-close]");
            if (editClose) {
                closeEditPanel();
            }
        }, true);
    }

    function refresh() {
        improveServerTransport();
        wireAuth();
        wireProfile();
        wireMore();
        stabilizeProfileOpening();
        stabilizeCarousel();
    }

    function init() {
        ensureStyles();
        cleanupStorage(true);
        warmServer();
        refresh();
        handleTransientNavigation();
        handleClicks();
        setTimeout(refresh, 250);
        setTimeout(refresh, 900);
        setTimeout(refresh, 1800);
        if (window.MutationObserver && document.body) {
            let scheduled = false;
            new MutationObserver(function () {
                if (scheduled) {
                    return;
                }
                scheduled = true;
                setTimeout(function () {
                    scheduled = false;
                    refresh();
                }, 80);
            }).observe(document.body, { childList: true, subtree: true });
        }
    }

    ensureStyles();
    onReady(init);
})();
