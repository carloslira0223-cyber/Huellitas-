(function() {
    const themeKey = "huellitasTema";
    const settingsKey = "huellitasAjustes";
    const badgeStorageKey = "huellitasInsignias";
    const favoritePetKey = "huellitasMascotaFavorita";
    const favoritesStorageKey = "huellitasFavoritos";
    const reportStorageKey = "huellitasReportes";
    const adoptionStorageKey = "huellitasSolicitudesAdopcion";
    const notificationStorageKey = "huellitasNotificaciones";
    const mailboxStorageKey = "huellitasBuzon";
    const adminPetStorageKey = "huellitasMascotasExtra";
    const centersReviewKey = "huellitasCentrosRevision";
    const badgeDefinitions = {
        "guardian-huellitas": {
            title: "Guardi&aacute;n Huellitas",
            desc: "Alcanzaste una marca alta ayudando en los juegos."
        },
        "experto-cuidados": {
            title: "Experto en cuidados",
            desc: "Demostraste buenas decisiones sobre bienestar animal."
        },
        "aliado-adopcion": {
            title: "Aliado de adopci&oacute;n",
            desc: "Completaste una acci&oacute;n relacionada con adopci&oacute;n responsable."
        },
        "coleccionista-huellitas": {
            title: "Coleccionista Huellitas",
            desc: "Guardaste mascotas o centros favoritos para darles seguimiento."
        }
    };
    const defaultSettings = {
        accent: "verde",
        language: "es",
        music: true,
        musicVolume: 0.16,
        sfx: true,
        sfxVolume: 0.42,
        navCompact: true,
        view: "normal"
    };
    const palettes = {
        verde: {
            leaf: "#5f9d63",
            leafDark: "#2f6b43",
            coral: "#d96f63",
            sky: "#cfe7f4"
        },
        azul: {
            leaf: "#4f8fbf",
            leafDark: "#28628f",
            coral: "#d96f63",
            sky: "#d5ecfb"
        },
        rosa: {
            leaf: "#c8698a",
            leafDark: "#8d3f5c",
            coral: "#5f9d63",
            sky: "#f5d8e3"
        },
        morado: {
            leaf: "#8067c8",
            leafDark: "#513a91",
            coral: "#d96f63",
            sky: "#e4dcfb"
        }
    };
    const navLabels = {
        es: {
            "pagina.html": "Inicio",
            "jueguitos.html": "Juegos",
            "directorio.html": "Directorio",
            "areas.html": "&Aacute;reas",
            "domesticos.html": "Mascotas",
            "leyes.html": "Leyes",
            "equipo.html": "Equipo",
            "presentacion.html": "Presentaci&oacute;n",
            "adopcion_huellitas.html": "Adopciones",
            "adoptar.html": "Adoptar",
            "mi_adopcion.html": "Mi adopci&oacute;n"
        },
        en: {
            "pagina.html": "Home",
            "jueguitos.html": "Games",
            "directorio.html": "Directory",
            "areas.html": "Nature",
            "domesticos.html": "Pets",
            "leyes.html": "Laws",
            "equipo.html": "Team",
            "presentacion.html": "Project",
            "adopcion_huellitas.html": "Adoptions",
            "adoptar.html": "Adopt",
            "mi_adopcion.html": "My adoption"
        }
    };
    let bgAudio = null;
    let clickAudio = null;
    let audioUnlocked = false;
    let notificationEventsReady = false;
    const isFramed = window.self !== window.top;
    const isAppShell = document.body && document.body.classList.contains("app-shell-body");
    const staticHost = /(^|\.)github\.io$|\.netlify\.app$|\.vercel\.app$|\.pages\.dev$/i.test(window.location.hostname);
    const apiEnabled = (window.location.protocol === "http:" || window.location.protocol === "https:") && !staticHost;

    function getApiToken() {
        return localStorage.getItem("huellitasToken") || "";
    }

    function setApiToken(token) {
        if (token) {
            localStorage.setItem("huellitasToken", token);
        }
    }

    function clearApiToken() {
        localStorage.removeItem("huellitasToken");
    }

    async function apiRequest(path, options) {
        if (!apiEnabled) {
            throw new Error("Servidor no activo.");
        }

        const requestOptions = Object.assign({
            method: "GET",
            headers: {}
        }, options || {});
        const headers = Object.assign({
            "Content-Type": "application/json"
        }, requestOptions.headers || {});
        const token = getApiToken();

        if (token) {
            headers.Authorization = "Bearer " + token;
        }

        const response = await fetch(path, Object.assign({}, requestOptions, { headers }));
        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.ok === false) {
            throw new Error(data.error || "No se pudo completar la accion.");
        }

        return data;
    }

    window.huellitasApi = {
        enabled: apiEnabled,
        request: apiRequest,
        setToken: setApiToken,
        clearToken: clearApiToken
    };

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark", isDark);

        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.innerHTML = isDark ? "&#9788;" : "&#9790;";
            button.setAttribute("aria-pressed", isDark ? "true" : "false");
        });
    }

    function getSettings() {
        try {
            return Object.assign({}, defaultSettings, JSON.parse(localStorage.getItem(settingsKey)) || {});
        } catch (error) {
            return Object.assign({}, defaultSettings);
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(settingsKey, JSON.stringify(settings));

        if (isFramed) {
            window.parent.postMessage({ type: "huellitas:settingsChanged" }, "*");
        }
    }

    function applyPalette(settings) {
        const palette = palettes[settings.accent] || palettes.verde;

        document.documentElement.style.setProperty("--leaf", palette.leaf);
        document.documentElement.style.setProperty("--leaf-dark", palette.leafDark);
        document.documentElement.style.setProperty("--coral", palette.coral);
        document.documentElement.style.setProperty("--sky", palette.sky);
    }

    function applyLanguage(settings) {
        const labels = navLabels[settings.language] || navLabels.es;

        document.querySelectorAll(".nav-link").forEach((link) => {
            const href = (link.getAttribute("href") || "").split("#")[0];

            if (labels[href]) {
                link.innerHTML = labels[href];
            }
        });
    }

    function applyView(settings) {
        document.body.classList.toggle("nav-full", !settings.navCompact);
        document.body.classList.toggle("view-compact", settings.view === "compact");
        document.body.classList.toggle("view-large", settings.view === "large");
    }

    function applySettings(settings) {
        applyPalette(settings);
        applyLanguage(settings);
        applyView(settings);
        updateAudioSettings(settings);

        document.querySelectorAll("[data-setting-control]").forEach((control) => {
            const key = control.dataset.settingControl;

            if (control.type === "checkbox") {
                control.checked = Boolean(settings[key]);
            } else {
                control.value = settings[key];
            }
        });

        document.querySelectorAll("[data-color-option]").forEach((button) => {
            button.classList.toggle("active", button.dataset.colorOption === settings.accent);
        });
    }

    window.toggleDark = function() {
        const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
        localStorage.setItem(themeKey, nextTheme);
        applyTheme(nextTheme);
    };

    function initTheme() {
        applyTheme(localStorage.getItem(themeKey) || "light");
    }

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem("sesion"));
        } catch (error) {
            return null;
        }
    }

    function escapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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

    function mergeArrayById(localItems, serverItems) {
        const map = new Map();

        (Array.isArray(localItems) ? localItems : []).forEach((item, index) => {
            const id = item && item.id ? item.id : "local-" + index;
            map.set(id, item);
        });

        (Array.isArray(serverItems) ? serverItems : []).forEach((item, index) => {
            const id = item && item.id ? item.id : "server-" + index;
            map.set(id, Object.assign({}, map.get(id) || {}, item));
        });

        return Array.from(map.values());
    }

    function mergeFavoriteMaps(localFavorites, serverFavorites) {
        const merged = Object.assign({}, localFavorites || {});

        Object.keys(serverFavorites || {}).forEach((profileId) => {
            merged[profileId] = mergeArrayById(merged[profileId] || [], serverFavorites[profileId] || []);
        });

        return merged;
    }

    function syncCollection(key, serverItems) {
        if (!Array.isArray(serverItems)) {
            return false;
        }

        const merged = mergeArrayById(readJson(key, []), serverItems);
        writeJson(key, merged);
        return true;
    }

    async function syncServerState() {
        if (!window.huellitasApi || !window.huellitasApi.enabled) {
            return null;
        }

        try {
            const data = await window.huellitasApi.request("/api/team-data");
            let changed = false;

            changed = syncCollection(adoptionStorageKey, data.adoptions) || changed;
            changed = syncCollection(reportStorageKey, data.reports) || changed;
            changed = syncCollection(mailboxStorageKey, data.mailbox) || changed;
            changed = syncCollection(notificationStorageKey, data.notifications) || changed;
            changed = syncCollection(adminPetStorageKey, data.pets) || changed;
            changed = syncCollection(centersReviewKey, data.centers) || changed;

            if (data.favorites) {
                writeJson(favoritesStorageKey, mergeFavoriteMaps(readJson(favoritesStorageKey, {}), data.favorites));
                changed = true;
            }

            if (Array.isArray(data.scores)) {
                writeJson("huellitasPuntajesJuego", mergeArrayById(readJson("huellitasPuntajesJuego", []), data.scores));
                changed = true;
            }

            if (changed) {
                ["huellitas:adoptionsChanged", "huellitas:reportsChanged", "huellitas:mailboxChanged", "huellitas:notificationsChanged", "huellitas:petsChanged", "huellitas:favoritesChanged"].forEach((eventName) => {
                    window.dispatchEvent(new CustomEvent(eventName));
                });
            }

            return data;
        } catch (error) {
            console.warn(error.message);
            return null;
        }
    }

    function postServer(path, payload) {
        if (!window.huellitasApi || !window.huellitasApi.enabled) {
            return;
        }

        window.huellitasApi.request(path, {
            method: "POST",
            body: JSON.stringify(payload || {})
        }).then((data) => {
            if (data && data.notifications) {
                writeJson(notificationStorageKey, mergeArrayById(readJson(notificationStorageKey, []), data.notifications));
                window.dispatchEvent(new CustomEvent("huellitas:notificationsChanged"));
            }

            if (data && data.mailbox) {
                writeJson(mailboxStorageKey, mergeArrayById(readJson(mailboxStorageKey, []), data.mailbox));
                window.dispatchEvent(new CustomEvent("huellitas:mailboxChanged"));
            }
        }).catch((error) => console.warn(error.message));
    }

    function getProfileId(usuario) {
        if (usuario && usuario.email) {
            return usuario.email;
        }

        let invitadoId = localStorage.getItem("huellitasInvitadoId");

        if (!invitadoId) {
            invitadoId = "invitado-" + Date.now();
            localStorage.setItem("huellitasInvitadoId", invitadoId);
        }

        return invitadoId;
    }

    function getCurrentProfileId() {
        return getProfileId(getSession());
    }

    function scopedPetStorageKey(profileId, suffix) {
        return "huellitasMichi:" + encodeURIComponent(profileId || getCurrentProfileId()) + ":" + suffix;
    }

    function readScopedPetJson(profileId, suffix, legacyKey, fallback) {
        const key = scopedPetStorageKey(profileId, suffix);

        if (localStorage.getItem(key)) {
            return readJson(key, fallback);
        }

        return readJson(legacyKey, fallback);
    }

    function readPetStateForProfile(profileId) {
        return readScopedPetJson(profileId, "estado", "huellitasMichiEstado", null);
    }

    function readPetInventoryForProfile(profileId) {
        return readScopedPetJson(profileId, "inventario", "huellitasMichiInventario", []);
    }

    function getBadges(profileId) {
        const allBadges = readJson(badgeStorageKey, {});
        return allBadges[profileId] || [];
    }

    function saveBadges(profileId, badges) {
        const allBadges = readJson(badgeStorageKey, {});
        allBadges[profileId] = badges;
        localStorage.setItem(badgeStorageKey, JSON.stringify(allBadges));
    }

    function showBadgeToast(badge) {
        const toast = document.createElement("div");
        toast.className = "badge-toast";
        toast.innerHTML = '<strong>Insignia desbloqueada</strong><span>' + badge.title + '</span>';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("visible");
        }, 30);

        setTimeout(() => {
            toast.classList.remove("visible");
            setTimeout(() => toast.remove(), 260);
        }, 2600);
    }

    function awardBadge(badgeId) {
        const badge = badgeDefinitions[badgeId];

        if (!badge) {
            return false;
        }

        const profileId = getCurrentProfileId();
        const badges = getBadges(profileId);

        if (badges.includes(badgeId)) {
            return false;
        }

        badges.push(badgeId);
        saveBadges(profileId, badges);
        window.dispatchEvent(new CustomEvent("huellitas:badgesChanged"));
        showBadgeToast(badge);
        return true;
    }

    function renderBadges(badges) {
        if (!badges.length) {
            return '<span class="mini-empty">A&uacute;n no hay insignias desbloqueadas</span>';
        }

        return badges.map((badgeId) => {
            const badge = badgeDefinitions[badgeId] || { title: badgeId, desc: "" };
            return '<span class="badge-pill" title="' + escapeHtml(badge.desc) + '">' + badge.title + '</span>';
        }).join("");
    }

    function getBestScore(profileId) {
        const scores = readJson("huellitasPuntajesJuego", []);
        const match = scores.find((item) => item.id === profileId || item.email === profileId);
        return match ? (match.mejorPuntaje || 0) : 0;
    }

    function statusSlug(status) {
        return String(status || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-");
    }

    function formatStatus(status) {
        const labels = {
            "En revision": "En revisi&oacute;n",
            "Cita programada": "Cita programada"
        };

        return labels[status] || status || "Enviada";
    }

    function normalizeAdoptionRequest(request, index) {
        const fecha = request.fecha || new Date().toLocaleString("es-MX");
        const estado = request.estado || "Enviada";
        const idBase = request.id || ("solicitud-" + index + "-" + String(fecha).replace(/\W/g, ""));

        return Object.assign({}, request, {
            id: idBase,
            fecha: fecha,
            estado: estado,
            historial: Array.isArray(request.historial) && request.historial.length
                ? request.historial
                : [{ estado: estado, fecha: fecha }],
            cita: request.cita || null
        });
    }

    function getAdoptionRequests() {
        return readJson(adoptionStorageKey, []).map(normalizeAdoptionRequest);
    }

    function saveAdoptionRequests(requests) {
        localStorage.setItem(adoptionStorageKey, JSON.stringify(requests));
        window.dispatchEvent(new CustomEvent("huellitas:adoptionsChanged"));
    }

    function getUserRequests(usuario) {
        if (!usuario) {
            return [];
        }

        return getAdoptionRequests().filter((item) => {
            return item.correo === usuario.email || item.nombre === usuario.nombre || item.profileId === getProfileId(usuario);
        });
    }

    function getRequestCount(usuario) {
        return getUserRequests(usuario).length;
    }

    function getFavoritePet(profileId) {
        const favorites = readJson(favoritePetKey, {});
        return favorites[profileId] || "";
    }

    function saveFavoritePet(profileId, pet) {
        const favorites = readJson(favoritePetKey, {});
        favorites[profileId] = pet;
        localStorage.setItem(favoritePetKey, JSON.stringify(favorites));
    }

    function getSavedFavorites(profileId) {
        const favorites = readJson(favoritesStorageKey, {});
        return favorites[profileId] || [];
    }

    function renderSavedFavorites(favorites) {
        if (!favorites.length) {
            return [
                '<div class="mini-empty">',
                '<strong>A&uacute;n no tienes favoritos.</strong>',
                '<span>Guarda mascotas o centros para encontrarlos r&aacute;pido despu&eacute;s.</span>',
                '<a class="empty-action" href="adopcion_huellitas.html#mascotas">Explorar adopciones</a>',
                '</div>'
            ].join("");
        }

        return favorites.slice(0, 4).map((favorite) => {
            const label = favorite.kind === "center" ? "Centro" : "Mascota";
            const href = escapeHtml(favorite.href || "#");

            return [
                '<a class="favorite-mini" href="' + href + '">',
                '<span>' + label + '</span>',
                '<strong>' + escapeHtml(favorite.title || favorite.id) + '</strong>',
                '</a>'
            ].join("");
        }).join("");
    }

    function renderRequestTimeline(request) {
        const states = ["Enviada", "Revisando", "Aprobada", "Rechazada", "Cita programada"];

        return [
            '<div class="request-timeline">',
            states.map((status) => {
                const active = request.estado === status || (Array.isArray(request.historial) && request.historial.some((item) => item.estado === status));
                return '<span class="' + (active ? "active" : "") + '">' + formatStatus(status) + '</span>';
            }).join(""),
            '</div>'
        ].join("");
    }

    function renderProfileRequests(requests) {
        if (!requests.length) {
            return [
                '<div class="mini-empty">',
                '<strong>A&uacute;n no hay solicitudes.</strong>',
                '<span>Elige una mascota y registra tu solicitud para dar seguimiento.</span>',
                '<a class="empty-action" href="adopcion_huellitas.html#mascotas">Explorar mascotas</a>',
                '<a class="empty-action secondary" href="adoptar.html#solicitud">Crear solicitud</a>',
                '</div>'
            ].join("");
        }

        return requests.slice(0, 5).map((request) => {
            const cita = request.cita && request.cita.fecha
                ? '<span>Cita: ' + escapeHtml(request.cita.fecha) + ' ' + escapeHtml(request.cita.hora || "") + '</span>'
                : '<span>Cita: pendiente</span>';

            return [
                '<article class="profile-mini-card">',
                '<div class="status-line">',
                '<strong>' + escapeHtml(request.mascotaNombre || request.mascota || "Mascota") + '</strong>',
                '<span class="status-badge status-' + statusSlug(request.estado) + '">' + formatStatus(request.estado) + '</span>',
                '</div>',
                '<span>Fecha: ' + escapeHtml(request.fecha) + '</span>',
                cita,
                renderRequestTimeline(request),
                '</article>'
            ].join("");
        }).join("");
    }

    function getUserReports(usuario) {
        const profileId = usuario ? getProfileId(usuario) : getCurrentProfileId();
        const email = usuario && usuario.email;

        return getReports().filter((report) => {
            return report.profileId === profileId || (email && report.contacto === email);
        });
    }

    function renderProfileReports(reports) {
        if (!reports.length) {
            return [
                '<div class="mini-empty">',
                '<strong>A&uacute;n no hay reportes personales.</strong>',
                '<span>Registra un reporte para darle seguimiento desde tu perfil.</span>',
                '<button class="empty-action" type="button" onclick="window.huellitasOpenReport && window.huellitasOpenReport()">Crear reporte</button>',
                '</div>'
            ].join("");
        }

        return reports.slice(0, 5).map((report) => {
            const estadoTexto = report.estado === "En revision" ? "En revisi&oacute;n" : report.estado;

            return [
                '<article class="profile-mini-card">',
                '<div class="status-line">',
                '<strong>' + escapeHtml(report.tipo || "Reporte") + '</strong>',
                '<span class="status-badge status-' + statusSlug(report.estado) + '">' + escapeHtml(estadoTexto) + '</span>',
                '</div>',
                '<span>' + escapeHtml(report.pagina || "Sin zona") + '</span>',
                '<span>' + escapeHtml(report.fecha) + '</span>',
                '</article>'
            ].join("");
        }).join("");
    }

    function getMailboxMessages(profileId) {
        return readJson(mailboxStorageKey, []).filter((message) => message.profileId === profileId);
    }

    function saveMailboxMessages(messages) {
        localStorage.setItem(mailboxStorageKey, JSON.stringify(messages));
        window.dispatchEvent(new CustomEvent("huellitas:mailboxChanged"));
    }

    function renderMailbox(messages) {
        const list = messages.length
            ? messages.slice(0, 6).map((message) => {
                return [
                    '<article class="profile-mini-card mailbox-message ' + (message.from === "admin" ? "from-admin" : "from-user") + '">',
                    '<span>' + (message.from === "admin" ? "Equipo Huellitas" : "T&uacute;") + ' - ' + escapeHtml(message.fecha) + '</span>',
                    '<strong>' + escapeHtml(message.mensaje) + '</strong>',
                    '</article>'
                ].join("");
            }).join("")
            : [
                '<div class="mini-empty">',
                '<strong>Buz&oacute;n listo.</strong>',
                '<span>Los mensajes del equipo aparecer&aacute;n aqu&iacute;.</span>',
                '<a class="empty-action secondary" href="mi_adopcion.html">Ver Mi adopci&oacute;n</a>',
                '</div>'
            ].join("");

        return [
            '<div class="profile-mailbox-list">' + list + '</div>',
            '<form class="profile-message-form" data-profile-message-form>',
            '<label>Enviar mensaje al centro o equipo</label>',
            '<textarea data-profile-message-text required placeholder="Hola, me interesa saber el siguiente paso."></textarea>',
            '<button type="submit">Enviar mensaje</button>',
            '<p class="form-note" data-profile-message-feedback></p>',
            '</form>'
        ].join("");
    }

    function renderPetProfileSummary(profileId) {
        const pet = readPetStateForProfile(profileId);
        const inventory = readPetInventoryForProfile(profileId);

        if (!pet) {
            return [
                '<div class="mini-empty">',
                '<strong>Tu mascota virtual aparecer&aacute; aqu&iacute;.</strong>',
                '<span>Empieza a jugar para ganar patitas y desbloquear tesoros.</span>',
                '<a class="empty-action" href="jueguitos.html#zonaMichi">Cuidar mascota</a>',
                '</div>'
            ].join("");
        }

        return [
            '<div class="profile-pet-summary">',
            '<strong>' + escapeHtml(pet.name || "Bobby") + '</strong>',
            '<span>Nivel ' + escapeHtml(pet.level || 1) + ' - ' + escapeHtml(pet.coins || 0) + ' patitas</span>',
            '<span>Inventario: ' + inventory.length + ' tesoros</span>',
            '<div class="profile-pet-bars">',
            '<span>Felicidad <b style="width:' + Math.max(0, Math.min(100, Number((pet.stats && pet.stats.happy) || 0))) + '%"></b></span>',
            '<span>Energ&iacute;a <b style="width:' + Math.max(0, Math.min(100, Number((pet.stats && pet.stats.energy) || 0))) + '%"></b></span>',
            '</div>',
            '<a class="profile-edit-link" href="jueguitos.html">Cuidar mascota</a>',
            '</div>'
        ].join("");
    }

    function renderPawHistory(profileId) {
        const pet = readPetStateForProfile(profileId);
        const scores = readJson("huellitasPuntajesJuego", []);
        const score = scores.find((item) => item.id === profileId || item.email === profileId);

        return [
            '<div class="profile-history-grid">',
            '<span><b>' + (pet ? escapeHtml(pet.coins || 0) : "0") + '</b> patitas actuales</span>',
            '<span><b>' + (pet ? escapeHtml(pet.points || 0) : "0") + '</b> puntos de mascota</span>',
            '<span><b>' + (score ? escapeHtml(score.mejorPuntaje || 0) : "0") + '</b> mejor puntaje</span>',
            '<span><b>' + (pet ? escapeHtml(pet.bestStreak || 0) : "0") + '</b> mejor racha</span>',
            '</div>'
        ].join("");
    }

    function readNotifications() {
        return readJson(notificationStorageKey, []);
    }

    function saveNotifications(notifications) {
        localStorage.setItem(notificationStorageKey, JSON.stringify(notifications.slice(0, 40)));
        window.dispatchEvent(new CustomEvent("huellitas:notificationsChanged"));
    }

    function addNotification(notification) {
        const notifications = readNotifications();
        const id = notification.id || ("noti-" + Date.now());
        const existing = notifications.find((item) => item.id === id);
        const next = [Object.assign({
            id: id,
            fecha: existing ? existing.fecha : new Date().toLocaleString("es-MX"),
            read: existing ? existing.read : false
        }, notification, { id: id })].concat(notifications.filter((item) => item.id !== id));

        saveNotifications(next);
        postServer("/api/notifications", next[0]);
    }

    window.huellitasNotify = addNotification;
    window.huellitasGetAdoptionRequests = getAdoptionRequests;
    window.huellitasSaveAdoptionRequests = saveAdoptionRequests;
    window.huellitasGetMailbox = function() {
        return readJson(mailboxStorageKey, []);
    };
    window.huellitasSaveMailbox = saveMailboxMessages;
    window.huellitasSyncServerState = syncServerState;
    window.huellitasPushFavorites = function(profileId, favorites) {
        postServer("/api/favorites", {
            profileId: profileId || getCurrentProfileId(),
            favorites: Array.isArray(favorites) ? favorites : []
        });
    };
    window.huellitasPostMailbox = function(message) {
        postServer("/api/mailbox", message);
    };

    function renderProfilePanels(usuario, profileId, data) {
        return [
            '<div class="profile-tabs" role="tablist" aria-label="Secciones del perfil">',
            '<button class="active" type="button" data-profile-tab="favoritos">Favoritos</button>',
            '<button type="button" data-profile-tab="solicitudes">Solicitudes</button>',
            '<button type="button" data-profile-tab="reportes">Reportes</button>',
            '<button type="button" data-profile-tab="logros">Logros</button>',
            '<button type="button" data-profile-tab="mascota">Mascota</button>',
            '<button type="button" data-profile-tab="patitas">Patitas</button>',
            '<button type="button" data-profile-tab="buzon">Buz&oacute;n</button>',
            '</div>',
            '<div class="profile-tab-panel active" data-profile-panel="favoritos">',
            '<h3>Favoritos</h3>',
            '<div class="profile-favorites">' + renderSavedFavorites(data.savedFavorites) + '</div>',
            '</div>',
            '<div class="profile-tab-panel" data-profile-panel="solicitudes" hidden>',
            '<h3>Solicitudes</h3>',
            renderProfileRequests(data.requests),
            '</div>',
            '<div class="profile-tab-panel" data-profile-panel="reportes" hidden>',
            '<h3>Reportes</h3>',
            renderProfileReports(data.reports),
            '</div>',
            '<div class="profile-tab-panel" data-profile-panel="logros" hidden>',
            '<h3>Logros</h3>',
            '<div class="profile-badges">' + renderBadges(data.badges) + '</div>',
            '</div>',
            '<div class="profile-tab-panel" data-profile-panel="mascota" hidden>',
            '<h3>Mascota virtual</h3>',
            renderPetProfileSummary(profileId),
            '</div>',
            '<div class="profile-tab-panel" data-profile-panel="patitas" hidden>',
            '<h3>Historial de patitas</h3>',
            renderPawHistory(profileId),
            '</div>',
            '<div class="profile-tab-panel" data-profile-panel="buzon" hidden>',
            '<h3>Buz&oacute;n</h3>',
            renderMailbox(data.mailbox),
            '</div>'
        ].join("");
    }

    function setupProfileTabs(wrap) {
        wrap.querySelectorAll("[data-profile-tab]").forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.profileTab;

                wrap.querySelectorAll("[data-profile-tab]").forEach((tab) => {
                    tab.classList.toggle("active", tab === button);
                });

                wrap.querySelectorAll("[data-profile-panel]").forEach((panel) => {
                    const active = panel.dataset.profilePanel === target;
                    panel.hidden = !active;
                    panel.classList.toggle("active", active);
                });
            });
        });
    }

    function setupProfileMailbox(wrap, usuario, profileId) {
        const form = wrap.querySelector("[data-profile-message-form]");

        if (!form) {
            return;
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const text = form.querySelector("[data-profile-message-text]").value.trim();

            if (!text) {
                return;
            }

            const messages = readJson(mailboxStorageKey, []);
            const message = {
                id: "msg-" + Date.now(),
                profileId: profileId,
                nombre: usuario.nombre,
                correo: usuario.email,
                from: "usuario",
                mensaje: text,
                fecha: new Date().toLocaleString("es-MX"),
                readByAdmin: false,
                readByUser: true
            };
            messages.unshift(message);
            saveMailboxMessages(messages);
            postServer("/api/mailbox", message);
            form.querySelector("[data-profile-message-text]").value = "";

            const feedback = form.querySelector("[data-profile-message-feedback]");
            if (feedback) {
                feedback.textContent = "Mensaje registrado correctamente. El equipo podr&aacute; revisarlo desde Admin.";
            }

            const panel = wrap.querySelector('[data-profile-panel="buzon"]');
            if (panel) {
                panel.innerHTML = '<h3>Buz&oacute;n</h3>' + renderMailbox(getMailboxMessages(profileId));
                setupProfileMailbox(wrap, usuario, profileId);
            }
        });
    }

    function ensureDerivedNotifications(usuario) {
        const profileId = usuario ? getProfileId(usuario) : getCurrentProfileId();
        const requests = usuario ? getUserRequests(usuario) : [];
        const latestRequest = requests[0];
        const pet = readPetStateForProfile(profileId);
        const extraPets = readJson("huellitasMascotasExtra", []);

        if (latestRequest) {
            addNotification({
                id: "adoption-" + latestRequest.id + "-" + statusSlug(latestRequest.estado),
                profileId: profileId,
                title: "Solicitud " + formatStatus(latestRequest.estado).replace(/<[^>]+>/g, ""),
                body: "Tu solicitud para " + (latestRequest.mascotaNombre || latestRequest.mascota || "una mascota") + " est&aacute; actualizada.",
                href: "mi_adopcion.html",
                kind: "adoption"
            });
        }

        if (pet && pet.stats && Number(pet.stats.health || 0) < 55) {
            addNotification({
                id: "pet-hunger-" + (pet.name || "Bobby"),
                profileId: profileId,
                title: (pet.name || "Bobby") + " tiene hambre",
                body: "Tu mascota necesita comida o cuidados para sentirse mejor.",
                href: "jueguitos.html",
                kind: "pet"
            });
        }

        if (extraPets.length) {
            const latestPet = extraPets[0];
            addNotification({
                id: "new-pet-" + latestPet.id,
                profileId: profileId,
                title: "Nueva mascota disponible",
                body: latestPet.nombre + " fue agregada a adopciones.",
                href: "adopcion_huellitas.html#mascotas",
                kind: "pet"
            });
        }
    }

    function renderNotificationsFor(profileId) {
        const notifications = readNotifications().filter((item) => !item.profileId || item.profileId === profileId);

        if (!notifications.length) {
            return '<div class="empty-state"><strong>Todo tranquilo por ahora.</strong><span>No hay notificaciones pendientes.</span></div>';
        }

        return notifications.slice(0, 8).map((item) => {
            return [
                '<a class="notification-item ' + (item.read ? "" : "unread") + '" href="' + escapeHtml(item.href || "#") + '">',
                '<span>' + escapeHtml(item.fecha || "") + '</span>',
                '<strong>' + escapeHtml(item.title || "Notificaci&oacute;n") + '</strong>',
                '<small>' + escapeHtml(item.body || "") + '</small>',
                '</a>'
            ].join("");
        }).join("");
    }

    function markNotificationsRead(profileId) {
        const notifications = readNotifications().map((item) => {
            if (!item.profileId || item.profileId === profileId) {
                return Object.assign({}, item, { read: true });
            }

            return item;
        });

        localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
        postServer("/api/notifications/read", { profileId: profileId });
    }

    function updateNotificationBell(wrap, profileId) {
        const count = readNotifications().filter((item) => (!item.profileId || item.profileId === profileId) && !item.read).length;
        const badge = wrap.querySelector("[data-notification-count]");

        if (badge) {
            badge.textContent = count;
            badge.hidden = count === 0;
        }
    }

    function createNotificationBell(usuario) {
        const profileId = usuario ? getProfileId(usuario) : getCurrentProfileId();
        const wrap = document.createElement("div");

        wrap.className = "notification-wrap";
        wrap.dataset.notificationWrap = "true";
        wrap.innerHTML = [
            '<button class="icon-button notification-button" type="button" aria-label="Abrir notificaciones" aria-expanded="false">',
            '&#128276;<b data-notification-count hidden>0</b>',
            '</button>',
            '<div class="notification-popover" role="dialog" aria-label="Notificaciones Huellitas">',
            '<div class="notification-header">',
            '<strong>Notificaciones</strong>',
            '<button class="profile-close" type="button" data-notification-close aria-label="Cerrar notificaciones">&times;</button>',
            '</div>',
            '<div class="notification-list" data-notification-list>' + renderNotificationsFor(profileId) + '</div>',
            '</div>'
        ].join("");

        const button = wrap.querySelector(".notification-button");
        const popover = wrap.querySelector(".notification-popover");
        const list = wrap.querySelector("[data-notification-list]");

        function close() {
            popover.style.display = "none";
            button.setAttribute("aria-expanded", "false");
        }

        button.addEventListener("click", () => {
            const open = popover.style.display === "block";

            if (open) {
                close();
                return;
            }

            list.innerHTML = renderNotificationsFor(profileId);
            markNotificationsRead(profileId);
            updateNotificationBell(wrap, profileId);
            popover.style.display = "block";
            button.setAttribute("aria-expanded", "true");
        });

        wrap.querySelector("[data-notification-close]").addEventListener("click", close);
        popover.addEventListener("click", (event) => event.stopPropagation());
        document.addEventListener("click", (event) => {
            if (!wrap.contains(event.target)) {
                close();
            }
        });

        window.addEventListener("huellitas:notificationsChanged", () => {
            list.innerHTML = renderNotificationsFor(profileId);
            updateNotificationBell(wrap, profileId);
        });

        updateNotificationBell(wrap, profileId);
        return wrap;
    }

    function normalizeReport(report, index) {
        const fecha = report.fecha || new Date().toLocaleString("es-MX");
        const estado = report.estado || report.status || "Recibido";

        return Object.assign({}, report, {
            id: report.id || "reporte-" + index + "-" + String(fecha).replace(/\W/g, ""),
            fecha: fecha,
            estado: estado,
            historial: Array.isArray(report.historial) && report.historial.length
                ? report.historial
                : [{ estado: estado, fecha: fecha }]
        });
    }

    function getReports() {
        return readJson(reportStorageKey, []).map(normalizeReport);
    }

    function saveReports(reports) {
        localStorage.setItem(reportStorageKey, JSON.stringify(reports));
        window.dispatchEvent(new CustomEvent("huellitas:reportsChanged"));
    }

    function renderReportTracker(targetId) {
        const target = document.getElementById(targetId);

        if (!target) {
            return;
        }

        const reports = getReports();

        if (!reports.length) {
            target.innerHTML = '<div class="empty-state"><strong>A&uacute;n no hay reportes.</strong><span>Cuando se registre uno, aparecer&aacute; aqu&iacute; con su seguimiento.</span></div>';
            return;
        }

        target.innerHTML = reports.slice(0, 5).map((report) => {
            return [
                '<article class="saved-item report-saved-item">',
                '<div class="status-line">',
                '<strong>' + escapeHtml(report.tipo || "Reporte") + '</strong>',
                '<span class="status-badge status-' + escapeHtml(report.estado).toLowerCase().replace(/\s+/g, "-") + '">' + escapeHtml(report.estado) + '</span>',
                '</div>',
                '<span>P&aacute;gina: ' + escapeHtml(report.pagina || "Sin zona") + '</span>',
                '<span>Fecha: ' + escapeHtml(report.fecha) + '</span>',
                '<div class="report-timeline">',
                '<span class="' + (report.estado === "Recibido" ? "active" : "") + '">Recibido</span>',
                '<span class="' + (report.estado === "En revision" ? "active" : "") + '">En revisi&oacute;n</span>',
                '<span class="' + (report.estado === "Atendido" ? "active" : "") + '">Atendido</span>',
                '</div>',
                '</article>'
            ].join("");
        }).join("");
    }

    window.huellitasAwardBadge = awardBadge;
    window.huellitasGetBadges = function() {
        return getBadges(getCurrentProfileId());
    };
    window.huellitasGetProfileId = getCurrentProfileId;
    window.huellitasGetFavorites = function() {
        return getSavedFavorites(getCurrentProfileId());
    };
    window.huellitasGetReports = getReports;
    window.huellitasSaveReports = saveReports;

    function updateMobileNavState() {
        document.body.classList.toggle("mobile-nav-open", Boolean(document.querySelector(".site-nav.nav-open")));
    }

    function closeAllNavMenus() {
        document.querySelectorAll(".site-nav.nav-open").forEach((nav) => {
            const toggle = nav.querySelector(".nav-menu-toggle");

            nav.classList.remove("nav-open");

            if (toggle) {
                toggle.setAttribute("aria-expanded", "false");
            }
        });

        updateMobileNavState();
    }

    function setPageLocked(isLocked) {
        document.body.classList.toggle("modal-open", isLocked);
        document.documentElement.classList.toggle("modal-open", isLocked);
        document.body.style.overflow = isLocked ? "hidden" : "";
        document.documentElement.style.overflow = isLocked ? "hidden" : "";
    }

    function initResponsiveNav() {
        document.querySelectorAll(".site-nav").forEach((nav) => {
            const brand = nav.querySelector(".brand");

            if (!brand || nav.querySelector(".nav-menu-toggle")) {
                return;
            }

            const toggle = document.createElement("button");
            toggle.className = "nav-menu-toggle";
            toggle.type = "button";
            toggle.setAttribute("aria-label", "Abrir menu de navegacion");
            toggle.setAttribute("aria-expanded", "false");
            toggle.innerHTML = "&#9776;";

            toggle.addEventListener("click", (event) => {
                event.stopPropagation();
                const isOpen = nav.classList.toggle("nav-open");
                toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
                updateMobileNavState();
            });

            nav.querySelectorAll(".nav-links a").forEach((link) => {
                link.addEventListener("click", closeAllNavMenus);
            });

            brand.insertAdjacentElement("afterend", toggle);
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".site-nav")) {
                closeAllNavMenus();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                closeAllNavMenus();
            }
        });
    }

    function createProfileChip(usuario) {
        const wrap = document.createElement("div");
        wrap.className = "global-profile";
        wrap.dataset.globalProfile = "true";

        if (!usuario) {
            wrap.innerHTML = '<a class="profile-chip" href="pagina.html#login" aria-label="Abrir perfil">&#128100;</a>';
            return wrap;
        }

        const foto = usuario.foto || "https://via.placeholder.com/100";
        const nombre = escapeHtml(usuario.nombre || "Perfil");
        const email = escapeHtml(usuario.email || "");
        const profileId = getProfileId(usuario);
        const bestScore = getBestScore(profileId);
        const requestCount = getRequestCount(usuario);
        const favoritePet = getFavoritePet(profileId);
        const savedFavorites = getSavedFavorites(profileId);
        const badges = getBadges(profileId);
        const requests = getUserRequests(usuario);
        const reports = getUserReports(usuario);
        const mailbox = getMailboxMessages(profileId);
        const profileData = {
            savedFavorites: savedFavorites,
            badges: badges,
            requests: requests,
            reports: reports,
            mailbox: mailbox
        };
        const petOption = function(value, label) {
            return '<option value="' + value + '"' + (favoritePet === value ? " selected" : "") + '>' + label + '</option>';
        };

        wrap.innerHTML = [
            '<button class="profile-chip" type="button" aria-expanded="false">',
            '<img src="' + foto + '" alt="Foto de perfil">',
            '<span>' + nombre + '</span>',
            '</button>',
            '<div class="profile-popover" role="dialog" aria-label="Perfil Huellitas">',
            '<div class="profile-popover-header">',
            '<img src="' + foto + '" alt="Foto de perfil">',
            '<div>',
            '<span class="profile-kicker">Perfil Huellitas</span>',
            '<strong>' + nombre + '</strong>',
            '<small>' + email + '</small>',
            '</div>',
            '<button class="profile-close" type="button" data-profile-close aria-label="Cerrar perfil">&times;</button>',
            '</div>',
            '<div class="profile-stats">',
            '<span><b>' + bestScore + '</b> pts</span>',
            '<span><b>' + requestCount + '</b> solicitudes</span>',
            '<span><b data-favorite-count>' + savedFavorites.length + '</b> favoritos</span>',
            '<span><b>' + badges.length + '</b> insignias</span>',
            '</div>',
            '<div class="profile-section">',
            '<h3>Preferencias</h3>',
            '<label class="profile-favorite">Mascota favorita',
            '<select data-profile-favorite>',
            '<option value="">Elegir</option>',
            petOption("Perro", "Perro"),
            petOption("Gato", "Gato"),
            petOption("Tortuga", "Tortuga"),
            petOption("Perico", "Perico"),
            '</select>',
            '</label>',
            '</div>',
            renderProfilePanels(usuario, profileId, profileData),
            '<div class="profile-section">',
            '<h3>Accesos r&aacute;pidos</h3>',
            '<div class="profile-actions-grid">',
            '<a href="adopcion_huellitas.html">Mascotas</a>',
            '<a href="adoptar.html">Checklist</a>',
            '<a href="mi_adopcion.html">Mi adopci&oacute;n</a>',
            '<a href="jueguitos.html">Mascota</a>',
            '<a href="equipo.html">Panel</a>',
            '</div>',
            '</div>',
            '<div class="profile-footer-actions">',
            '<a class="profile-edit-link" href="pagina.html#editar-perfil">Editar perfil</a>',
            '<button class="profile-logout" type="button" data-global-logout>Cerrar sesi&oacute;n</button>',
            '</div>',
            '</div>'
        ].join("");

        const chip = wrap.querySelector(".profile-chip");
        const popover = wrap.querySelector(".profile-popover");
        const closeButton = wrap.querySelector("[data-profile-close]");
        setupProfileTabs(wrap);
        setupProfileMailbox(wrap, usuario, profileId);

        function closePopover() {
            popover.style.display = "none";
            chip.setAttribute("aria-expanded", "false");
        }

        chip.addEventListener("click", () => {
            const isOpen = popover.style.display === "block";
            if (isOpen) {
                closePopover();
            } else {
                popover.style.display = "block";
                chip.setAttribute("aria-expanded", "true");
            }
        });

        closeButton.addEventListener("click", closePopover);

        popover.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        wrap.querySelector("[data-global-logout]").addEventListener("click", () => {
            localStorage.removeItem("sesion");
            window.location.reload();
        });

        wrap.querySelector("[data-profile-favorite]").addEventListener("change", (event) => {
            saveFavoritePet(profileId, event.target.value);
        });

        window.addEventListener("huellitas:badgesChanged", () => {
            const latestBadges = getBadges(profileId);
            const badgeWrap = wrap.querySelector(".profile-badges");
            const stats = wrap.querySelector(".profile-stats");

            if (badgeWrap) {
                badgeWrap.innerHTML = renderBadges(latestBadges);
            }

            if (stats) {
                stats.children[3].innerHTML = '<b>' + latestBadges.length + '</b> insignias';
            }
        });

        window.addEventListener("huellitas:favoritesChanged", () => {
            const latestFavorites = getSavedFavorites(profileId);
            const favoriteList = wrap.querySelector(".profile-favorites");
            const favoriteCount = wrap.querySelector("[data-favorite-count]");

            if (favoriteList) {
                favoriteList.innerHTML = renderSavedFavorites(latestFavorites);
            }

            if (favoriteCount) {
                favoriteCount.textContent = latestFavorites.length;
            }
        });

        document.addEventListener("click", (event) => {
            if (!wrap.contains(event.target)) {
                closePopover();
            }
        });

        return wrap;
    }

    function createSettingsPanel() {
        if (document.getElementById("settingsPanel")) {
            return;
        }

        const panel = document.createElement("div");
        panel.className = "settings-panel";
        panel.id = "settingsPanel";
        panel.hidden = true;
        panel.innerHTML = [
            '<div class="settings-card" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">',
            '<button class="modal-close" type="button" data-settings-close aria-label="Cerrar ajustes">&times;</button>',
            '<span class="eyebrow">Personaliza Huellitas</span>',
            '<h2 id="settingsTitle">Ajustes</h2>',
            '<p>Controla apariencia, navegaci&oacute;n y sonido del sitio.</p>',
            '<div class="settings-grid">',
            '<section>',
            '<h3>Apariencia</h3>',
            '<label class="setting-row"><span>Modo oscuro</span><input data-settings-dark type="checkbox"></label>',
            '<label>Vista</label>',
            '<select data-setting-control="view">',
            '<option value="normal">Normal</option>',
            '<option value="compact">Compacta</option>',
            '<option value="large">Grande</option>',
            '</select>',
            '<label>Idioma de navegaci&oacute;n</label>',
            '<select data-setting-control="language">',
            '<option value="es">Espa&ntilde;ol</option>',
            '<option value="en">English</option>',
            '</select>',
            '<label>Color principal</label>',
            '<div class="color-options">',
            '<button type="button" data-color-option="verde" style="--swatch:#5f9d63;">Verde</button>',
            '<button type="button" data-color-option="azul" style="--swatch:#4f8fbf;">Azul</button>',
            '<button type="button" data-color-option="rosa" style="--swatch:#c8698a;">Rosa</button>',
            '<button type="button" data-color-option="morado" style="--swatch:#8067c8;">Morado</button>',
            '</div>',
            '</section>',
            '<section>',
            '<h3>Sonido</h3>',
            '<label class="setting-row"><span>M&uacute;sica de fondo</span><input data-setting-control="music" type="checkbox"></label>',
            '<label>Volumen de m&uacute;sica</label>',
            '<input data-setting-control="musicVolume" type="range" min="0" max="0.4" step="0.01">',
            '<label class="setting-row"><span>Sonido de botones</span><input data-setting-control="sfx" type="checkbox"></label>',
            '<label>Volumen de botones</label>',
            '<input data-setting-control="sfxVolume" type="range" min="0" max="1" step="0.01">',
            '<p class="form-note">La m&uacute;sica empieza despu&eacute;s del primer clic por seguridad del navegador.</p>',
            '<button type="button" data-open-app-mode>Modo continuo</button>',
            '</section>',
            '<section>',
            '<h3>Navegaci&oacute;n</h3>',
            '<label class="setting-row"><span>Men&uacute; oculto</span><input data-setting-control="navCompact" type="checkbox"></label>',
            '<p class="form-note">Con men&uacute; oculto, las pesta&ntilde;as salen al tocar el bot&oacute;n de arriba.</p>',
            '</section>',
            '</div>',
            '<p class="settings-version">Versi&oacute;n 3.0</p>',
            '</div>'
        ].join("");

        document.body.appendChild(panel);

        panel.addEventListener("click", (event) => {
            if (event.target === panel || event.target.hasAttribute("data-settings-close")) {
                closeSettings();
            }
        });

        panel.querySelector("[data-settings-dark]").addEventListener("change", (event) => {
            localStorage.setItem(themeKey, event.target.checked ? "dark" : "light");
            applyTheme(event.target.checked ? "dark" : "light");
        });

        panel.querySelector("[data-open-app-mode]").addEventListener("click", () => {
            if (isFramed || isAppShell) {
                closeSettings();
                return;
            }

            const currentPage = window.location.pathname.split("/").pop() || "pagina.html";
            window.location.href = "app.html?page=" + encodeURIComponent(currentPage + window.location.hash);
        });

        panel.querySelectorAll("[data-setting-control]").forEach((control) => {
            control.addEventListener("input", () => {
                const settings = getSettings();
                const key = control.dataset.settingControl;

                if (control.type === "checkbox") {
                    settings[key] = control.checked;
                } else if (control.type === "range") {
                    settings[key] = Number(control.value);
                } else {
                    settings[key] = control.value;
                }

                saveSettings(settings);
                applySettings(settings);
            });
        });

        panel.querySelectorAll("[data-color-option]").forEach((button) => {
            button.addEventListener("click", () => {
                const settings = getSettings();
                settings.accent = button.dataset.colorOption;
                saveSettings(settings);
                applySettings(settings);
            });
        });
    }

    function openSettings() {
        createSettingsPanel();
        const panel = document.getElementById("settingsPanel");
        const darkControl = panel.querySelector("[data-settings-dark]");
        darkControl.checked = document.body.classList.contains("dark");
        applySettings(getSettings());
        panel.hidden = false;
        setPageLocked(true);
    }

    function closeSettings() {
        const panel = document.getElementById("settingsPanel");

        if (panel) {
            panel.hidden = true;
            setPageLocked(false);
        }
    }

    function createReportPanel() {
        if (document.getElementById("reportPanel")) {
            return;
        }

        const panel = document.createElement("div");
        panel.className = "settings-panel report-panel";
        panel.id = "reportPanel";
        panel.hidden = true;
        panel.innerHTML = [
            '<div class="settings-card report-card" role="dialog" aria-modal="true" aria-labelledby="reportTitle">',
            '<button class="modal-close" type="button" data-report-close aria-label="Cerrar reportes">&times;</button>',
            '<span class="eyebrow">Ayuda r&aacute;pida</span>',
            '<h2 id="reportTitle">Reportes Huellitas</h2>',
            '<p>Guarda un reporte sobre errores de la p&aacute;gina, sugerencias o una situaci&oacute;n de maltrato animal.</p>',
            '<form id="reportForm" class="contact-form">',
            '<div class="form-grid">',
            '<div>',
            '<label for="reportType">Tipo de reporte</label>',
            '<select id="reportType" required>',
            '<option>Error de la p&aacute;gina</option>',
            '<option>Maltrato animal</option>',
            '<option>Animal perdido o herido</option>',
            '<option>Sugerencia</option>',
            '</select>',
            '</div>',
            '<div>',
            '<label for="reportContact">Contacto opcional</label>',
            '<input id="reportContact" placeholder="Correo o tel&eacute;fono">',
            '</div>',
            '<div>',
            '<label for="reportPage">P&aacute;gina o zona</label>',
            '<input id="reportPage" placeholder="Ej. Directorio, Juegos, Inicio">',
            '</div>',
            '<div>',
            '<label for="reportTeamEmail">Correo del equipo</label>',
            '<input id="reportTeamEmail" type="email" placeholder="equipo404@correo.com">',
            '</div>',
            '</div>',
            '<label for="reportMessage">Descripci&oacute;n</label>',
            '<textarea id="reportMessage" required minlength="12" placeholder="Describe lo que pasa o lo que viste."></textarea>',
            '<p class="form-note">Si hay peligro inmediato para una persona o animal, busca apoyo de un adulto responsable o autoridad local.</p>',
            '<div class="section-actions">',
            '<button type="submit">Guardar reporte</button>',
            '</div>',
            '<p class="form-note" id="reportFeedback"></p>',
            '</form>',
            '<div class="report-tracker-wrap">',
            '<h3>Seguimiento local</h3>',
            '<p>Estos estados ayudan al equipo a revisar qu&eacute; ya se recibi&oacute;, qu&eacute; est&aacute; en revisi&oacute;n y qu&eacute; fue atendido.</p>',
            '<div class="saved-list report-tracker" id="reportTracker"></div>',
            '</div>',
            '</div>'
        ].join("");

        document.body.appendChild(panel);
        document.getElementById("reportTeamEmail").value = localStorage.getItem("huellitasCorreoEquipo") || "";
        document.getElementById("reportPage").value = document.title.replace("Huellitas | ", "");
        renderReportTracker("reportTracker");

        panel.addEventListener("click", (event) => {
            if (event.target === panel || event.target.hasAttribute("data-report-close")) {
                closeReport();
            }
        });

        document.getElementById("reportForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const feedback = document.getElementById("reportFeedback");
            const reportMessage = document.getElementById("reportMessage");
            reportMessage.setCustomValidity("");

            if (reportMessage.value.trim().length < 12) {
                reportMessage.setCustomValidity("Describe el reporte con un poco m&aacute;s de detalle.");
            }

            if (!event.currentTarget.checkValidity()) {
                event.currentTarget.reportValidity();
                feedback.className = "form-note error";
                feedback.textContent = "Revisa los campos marcados para guardar el reporte.";
                return;
            }

            const report = {
                id: "reporte-" + Date.now(),
                profileId: getCurrentProfileId(),
                fecha: new Date().toLocaleString("es-MX"),
                tipo: document.getElementById("reportType").value,
                contacto: document.getElementById("reportContact").value.trim(),
                pagina: document.getElementById("reportPage").value.trim(),
                correoEquipo: document.getElementById("reportTeamEmail").value.trim(),
                mensaje: document.getElementById("reportMessage").value.trim(),
                estado: "Recibido",
                historial: [{
                    estado: "Recibido",
                    fecha: new Date().toLocaleString("es-MX")
                }]
            };
            const reports = getReports();

            reports.unshift(report);
            saveReports(reports);
            addNotification({
                id: "report-" + report.id,
                profileId: getCurrentProfileId(),
                title: "Reporte recibido",
                body: "Tu reporte qued&oacute; registrado para seguimiento.",
                href: "pagina.html#impacto",
                kind: "report"
            });
            renderReportTracker("reportTracker");

            if (report.correoEquipo) {
                localStorage.setItem("huellitasCorreoEquipo", report.correoEquipo);
            }

            if (window.huellitasApi && window.huellitasApi.enabled) {
                try {
                    const data = await window.huellitasApi.request("/api/reports", {
                        method: "POST",
                        body: JSON.stringify(report)
                    });

                    feedback.className = "form-note success";
                    feedback.textContent = data.emailSent
                        ? "Reporte registrado y enviado al equipo."
                        : "Reporte registrado correctamente.";
                    event.currentTarget.reset();
                    document.getElementById("reportTeamEmail").value = localStorage.getItem("huellitasCorreoEquipo") || "";
                    document.getElementById("reportPage").value = document.title.replace("Huellitas | ", "");
                    return;
                } catch (error) {
                    feedback.className = "form-note error";
                    feedback.textContent = "Reporte registrado en este equipo. No se pudo enviar al servidor: " + error.message;
                    return;
                }
            }

            feedback.className = "form-note success";
            feedback.textContent = "Reporte registrado en este navegador.";

            if (report.correoEquipo) {
                const asunto = "Reporte Huellitas - " + report.tipo;
                const cuerpo = [
                    "Hola Equipo Huellitas.",
                    "",
                    "Nuevo reporte guardado desde la pagina.",
                    "",
                    "Tipo: " + report.tipo,
                    "Pagina: " + report.pagina,
                    "Contacto: " + (report.contacto || "Sin contacto"),
                    "Fecha: " + report.fecha,
                    "",
                    "Descripcion:",
                    report.mensaje
                ].join("\n");

                window.location.href = "mailto:" + report.correoEquipo.replace(/\s/g, "")
                    + "?subject=" + encodeURIComponent(asunto)
                    + "&body=" + encodeURIComponent(cuerpo);
            }
        });
    }

    function openReport() {
        createReportPanel();
        document.getElementById("reportPanel").hidden = false;
        setPageLocked(true);
    }

    function closeReport() {
        const panel = document.getElementById("reportPanel");

        if (panel) {
            panel.hidden = true;
            setPageLocked(false);
        }
    }

    window.huellitasOpenReport = openReport;

    function initReportButton() {
        document.querySelectorAll(".nav-actions").forEach((actions) => {
            if (actions.querySelector("[data-report-toggle]")) {
                return;
            }

            const button = document.createElement("button");
            button.className = "icon-button report-button";
            button.type = "button";
            button.dataset.reportToggle = "true";
            button.setAttribute("aria-label", "Abrir reportes");
            button.innerHTML = "&#9888;";
            button.addEventListener("click", openReport);
            actions.insertBefore(button, actions.firstChild);
        });

        document.querySelectorAll("[data-report-toggle-home]").forEach((button) => {
            if (button.dataset.reportReady) {
                return;
            }

            button.dataset.reportReady = "true";
            button.addEventListener("click", openReport);
        });
    }

    function initSettingsButton() {
        document.querySelectorAll(".nav-actions").forEach((actions) => {
            if (actions.querySelector("[data-settings-toggle]")) {
                return;
            }

            const button = document.createElement("button");
            button.className = "icon-button settings-button";
            button.type = "button";
            button.dataset.settingsToggle = "true";
            button.setAttribute("aria-label", "Abrir ajustes");
            button.innerHTML = "&#9881;";
            button.addEventListener("click", openSettings);
            actions.insertBefore(button, actions.firstChild);
        });
    }

    function initMobileMenuTools() {
        document.querySelectorAll(".site-nav").forEach((nav) => {
            const links = nav.querySelector(".nav-links");

            if (!links || links.querySelector("[data-mobile-menu-tools]")) {
                return;
            }

            const tools = document.createElement("div");
            tools.className = "mobile-menu-tools";
            tools.dataset.mobileMenuTools = "true";
            tools.innerHTML = [
                '<button class="nav-link mobile-nav-tool" type="button" data-mobile-settings>Ajustes</button>',
                '<button class="nav-link mobile-nav-tool" type="button" data-mobile-report>Reportar</button>',
                '<button class="nav-link mobile-nav-tool" type="button" data-mobile-theme>Tema</button>'
            ].join("");

            tools.querySelector("[data-mobile-settings]").addEventListener("click", () => {
                closeAllNavMenus();
                openSettings();
            });
            tools.querySelector("[data-mobile-report]").addEventListener("click", () => {
                closeAllNavMenus();
                openReport();
            });
            tools.querySelector("[data-mobile-theme]").addEventListener("click", () => {
                closeAllNavMenus();
                window.toggleDark();
            });
            links.appendChild(tools);
        });
    }

    function initNotificationBell() {
        const usuario = getSession();

        ensureDerivedNotifications(usuario);
        if (!notificationEventsReady) {
            notificationEventsReady = true;
            ["huellitas:adoptionsChanged", "huellitas:reportsChanged", "huellitas:petsChanged"].forEach((eventName) => {
                window.addEventListener(eventName, () => ensureDerivedNotifications(getSession()));
            });
        }

        document.querySelectorAll(".nav-actions").forEach((actions) => {
            if (actions.querySelector("[data-notification-wrap]")) {
                return;
            }

            actions.insertBefore(createNotificationBell(usuario), actions.firstChild);
        });
    }

    function initGlobalProfile() {
        const usuario = getSession();

        document.querySelectorAll(".nav-actions").forEach((actions) => {
            if (actions.querySelector("[data-global-profile]")) {
                return;
            }

            if (actions.id === "zonaUsuario") {
                if (!usuario) {
                    return;
                }

                const legacyProfile = actions.querySelector("#perfil");
                const loginButton = actions.querySelector("#btnLogin");

                if (legacyProfile) {
                    legacyProfile.style.display = "none";
                }

                if (loginButton) {
                    loginButton.style.display = "none";
                }
            }

            actions.appendChild(createProfileChip(usuario));
        });
    }

    window.huellitasMountProfile = function() {
        document.querySelectorAll("[data-notification-wrap], [data-global-profile]").forEach((element) => {
            element.remove();
        });
        initNotificationBell();
        initGlobalProfile();
    };

    function openProfileHash() {
        if (window.location.hash === "#login" && typeof window.abrirLogin === "function") {
            window.abrirLogin();
        }

        if (window.location.hash === "#editar-perfil" && typeof window.abrirEditar === "function") {
            window.abrirEditar();
        }
    }

    function updateAudioSettings(settings) {
        if (bgAudio) {
            bgAudio.volume = settings.musicVolume;

            if (!settings.music) {
                bgAudio.pause();
            } else if (audioUnlocked) {
                startMusic();
            }
        }

        if (clickAudio) {
            clickAudio.volume = settings.sfxVolume;
        }
    }

    function startMusic() {
        const settings = getSettings();

        if (!settings.music || !bgAudio) {
            return;
        }

        bgAudio.volume = settings.musicVolume;
        bgAudio.play().catch(() => {});
    }

    function playClickSound() {
        const settings = getSettings();

        if (!settings.sfx || !clickAudio) {
            return;
        }

        clickAudio.pause();
        clickAudio.currentTime = 0;
        clickAudio.volume = settings.sfxVolume;
        clickAudio.play().catch(() => {});
    }

    function unlockAudio() {
        if (audioUnlocked) {
            return;
        }

        audioUnlocked = true;
        startMusic();
    }

    function initAudio() {
        if (isFramed) {
            document.addEventListener("click", (event) => {
                if (event.target.closest("button, a, .memoria-card, .map-pin, .profile-chip, .favorite-button")) {
                    window.parent.postMessage({ type: "huellitas:playClickSound" }, "*");
                }
            });
            return;
        }

        if (!bgAudio) {
            bgAudio = new Audio("assets/sonidos/musica.mp3");
            bgAudio.loop = true;
            bgAudio.preload = "auto";
        }

        if (!clickAudio) {
            clickAudio = new Audio("assets/sonidos/boton.mp3");
            clickAudio.preload = "auto";
        }

        updateAudioSettings(getSettings());
        document.addEventListener("pointerdown", unlockAudio, { once: true });
        document.addEventListener("keydown", unlockAudio, { once: true });
        document.addEventListener("click", (event) => {
            if (event.target.closest("button, a, .memoria-card, .map-pin, .profile-chip, .favorite-button")) {
                playClickSound();
            }
        });

        window.addEventListener("message", (event) => {
            if (event.data && event.data.type === "huellitas:playClickSound") {
                playClickSound();
            }
        });
    }

    function isLocalHtmlLink(link) {
        const href = link.getAttribute("href") || "";

        if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || link.hasAttribute("download")) {
            return false;
        }

        return href.includes(".html");
    }

    function navigateWithTransition(href) {
        document.body.classList.add("page-leaving");

        setTimeout(() => {
            window.location.href = href;
        }, 180);
    }

    function ensurePageLoader() {
        let loader = document.getElementById("loader");

        if (!loader) {
            loader = document.createElement("div");
            loader.id = "loader";
            document.body.prepend(loader);
        }

        loader.className = "huellitas-loader";
        loader.innerHTML = [
            '<div class="loader-card" role="status" aria-live="polite">',
            '<img src="assets/imagenes/logo.png" alt="">',
            '<strong>Preparando Huellitas</strong>',
            '<span>Cargando paneles, datos y patitas...</span>',
            '<b aria-hidden="true"></b>',
            '</div>'
        ].join("");
    }

    function hidePageLoader() {
        const loader = document.getElementById("loader");

        if (!loader) {
            return;
        }

        loader.classList.add("loader-hidden");
        setTimeout(() => {
            if (loader && loader.parentNode) {
                loader.remove();
            }
        }, 360);
    }

    window.huellitasHidePageLoader = function() {
        setTimeout(hidePageLoader, 520);
    };

    function initPageTransitions() {
        document.body.classList.add("page-ready");

        document.addEventListener("click", (event) => {
            const link = event.target.closest("a");

            if (!link || !isLocalHtmlLink(link)) {
                return;
            }

            const href = link.getAttribute("href");
            event.preventDefault();

            if (isFramed) {
                window.parent.postMessage({ type: "huellitas:navigate", href: href }, "*");
            } else {
                navigateWithTransition(href);
            }
        });

        if (isFramed && typeof window.irPagina === "function") {
            window.irPagina = function(pagina) {
                window.parent.postMessage({ type: "huellitas:navigate", href: pagina }, "*");
            };
        }
    }

    window.huellitasRefreshSettings = function() {
        applyTheme(localStorage.getItem(themeKey) || "light");
        applySettings(getSettings());
    };

    function initSharedUi() {
        ensurePageLoader();
        initTheme();
        applySettings(getSettings());
        initResponsiveNav();
        initReportButton();
        initSettingsButton();
        initMobileMenuTools();
        initNotificationBell();
        initGlobalProfile();
        initAudio();
        initPageTransitions();
        window.huellitasHidePageLoader();
        openProfileHash();
        syncServerState().then((data) => {
            if (data) {
                window.huellitasMountProfile();
                renderReportTracker("reportTracker");
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAllNavMenus();
            closeSettings();
            closeReport();
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSharedUi);
    } else {
        initSharedUi();
    }
})();

