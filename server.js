/*!
 * Proyecto Huellitas - Creado por Carlos Alexis Lira Alcala - 2026.
 * Todos los derechos reservados.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const tls = require("tls");

const root = __dirname;
const dataDir = path.resolve(process.env.DATA_DIR || path.join(root, "data"));
const dbPath = path.join(dataDir, "huellitas-db.json");
const configPath = path.join(root, "server-config.json");
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

function readConfig() {
    if (!fs.existsSync(configPath)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
        console.warn("No se pudo leer server-config.json:", error.message);
        return {};
    }
}

const config = readConfig();
const adminTokens = new Map();
const adminAttempts = new Map();
const simonSubmissions = new Map();
const simonSubmissionWindow = 10 * 60 * 1000;
const simonSubmissionLimit = 8;
const adminTokenLifetime = 8 * 60 * 60 * 1000;
const adminAttemptWindow = 15 * 60 * 1000;
const adminAttemptLimit = 5;
const legacyAdminPasswordHash = "7571e4e75ae70141d773cbd36bfdac3e92f10c9eeb3e56f5cc03bf7126121a8c";
const adminProtectedRoutes = new Set([
    "GET:/api/backup",
    "GET:/api/team-data",
    "POST:/api/adoptions/status",
    "POST:/api/adoptions/appointment",
    "POST:/api/reports/status",
    "POST:/api/pets",
    "POST:/api/pets/status",
    "POST:/api/pets/delete",
    "POST:/api/centers",
    "POST:/api/centers/status",
    "POST:/api/demo",
    "POST:/api/demo/reset",
    "POST:/api/restore",
    "POST:/api/base",
    "POST:/api/reset"
]);

function normalizeAdminPassword(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function sha256(value) {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function configuredAdminPasswordHash() {
    const configuredHash = String(process.env.HUELLITAS_ADMIN_PASSWORD_HASH || config.adminPasswordHash || "").trim().toLowerCase();

    if (/^[a-f0-9]{64}$/.test(configuredHash)) {
        return configuredHash;
    }

    const configuredPassword = process.env.HUELLITAS_ADMIN_PASSWORD || config.adminPassword;
    if (configuredPassword) {
        return sha256(normalizeAdminPassword(configuredPassword));
    }

    // Compatibilidad temporal. En produccion se recomienda HUELLITAS_ADMIN_PASSWORD_HASH.
    return legacyAdminPasswordHash;
}

function safeHashEqual(actual, expected) {
    if (!/^[a-f0-9]{64}$/.test(actual) || !/^[a-f0-9]{64}$/.test(expected)) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function requestIp(req) {
    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    return forwarded || (req.socket && req.socket.remoteAddress) || "unknown";
}

function normalizeSimonNickname(value) {
    return cleanText(value)
        .replace(/<[^>]*>/g, "")
        .replace(/[<>\`{}]/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 12) || "Jugador";
}

function hasBlockedSimonNickname(value) {
    const compact = String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const blocked = ["puta", "puto", "mierda", "pendejo", "pendeja", "idiota", "imbecil", "cabron", "cagada"];
    return blocked.some((word) => compact.includes(word));
}

function validateSimonScore(body) {
    const nickname = normalizeSimonNickname(body.nickname);
    const anonymousId = cleanText(body.anonymousId);
    const round = Number(body.round);
    const errors = Number(body.errors);
    const combo = Number(body.combo);
    const avgTime = Number(body.avgTime);
    const mode = cleanText(body.mode).toLowerCase();
    const maxCombo = round * (round + 1) / 2 + 3 * (round + 1);

    if (!/^simon-[a-z0-9-]{8,80}$/i.test(anonymousId)) {
        return { error: "Identificador anonimo invalido." };
    }

    if (hasBlockedSimonNickname(nickname)) {
        return { error: "Elige otro apodo." };
    }

    if (mode !== "challenge") {
        return { error: "Solo el modo reto entra a la clasificacion." };
    }

    if (!Number.isInteger(round) || round < 1 || round > 60 ||
        !Number.isInteger(errors) || errors < 0 || errors > 3 ||
        !Number.isInteger(combo) || combo < 0 || combo > maxCombo ||
        !Number.isFinite(avgTime) || avgTime < 0.12 || avgTime > 30) {
        return { error: "Resultado fuera de los limites permitidos." };
    }

    return {
        value: {
            nickname,
            anonymousId,
            round,
            errors,
            combo,
            avgTime: Math.round(avgTime * 1000) / 1000,
            mode
        }
    };
}

function isSimonRateLimited(req, anonymousId) {
    const now = Date.now();
    const key = requestIp(req) + ":" + anonymousId;
    const state = simonSubmissions.get(key);

    if (!state || now - state.startedAt > simonSubmissionWindow) {
        simonSubmissions.set(key, { count: 1, startedAt: now });
        return false;
    }

    state.count += 1;
    return state.count > simonSubmissionLimit;
}

function compareSimonScores(a, b) {
    return Number(b.round || 0) - Number(a.round || 0) ||
        Number(a.errors || 0) - Number(b.errors || 0) ||
        Number(b.combo || 0) - Number(a.combo || 0) ||
        Number(a.avgTime || 99) - Number(b.avgTime || 99) ||
        String(a.date || "").localeCompare(String(b.date || ""));
}

function isBetterSimonScore(candidate, current) {
    return compareSimonScores(candidate, current) < 0;
}

function publicSimonScore(item, rank, currentId) {
    return {
        rank,
        nickname: normalizeSimonNickname(item.nickname),
        round: Number(item.round || 0),
        errors: Number(item.errors || 0),
        combo: Number(item.combo || 0),
        avgTime: Number(item.avgTime || 0),
        date: item.date || "",
        current: Boolean(currentId && item.anonymousId === currentId)
    };
}

function isAdminRateLimited(req) {
    const key = requestIp(req);
    const now = Date.now();
    const attempt = adminAttempts.get(key);

    if (!attempt || now - attempt.startedAt > adminAttemptWindow) {
        adminAttempts.set(key, { count: 0, startedAt: now });
        return false;
    }

    return attempt.count >= adminAttemptLimit;
}

function registerFailedAdminAttempt(req) {
    const key = requestIp(req);
    const now = Date.now();
    const attempt = adminAttempts.get(key);

    if (!attempt || now - attempt.startedAt > adminAttemptWindow) {
        adminAttempts.set(key, { count: 1, startedAt: now });
        return;
    }

    attempt.count += 1;
}

function clearAdminAttempts(req) {
    adminAttempts.delete(requestIp(req));
}

function purgeAdminTokens() {
    const now = Date.now();
    adminTokens.forEach((session, token) => {
        if (!session || session.expiresAt <= now) {
            adminTokens.delete(token);
        }
    });
}

function adminTokenFromRequest(req) {
    return String(req.headers["x-huellitas-admin-token"] || "");
}

function isAdminRequest(req) {
    purgeAdminTokens();
    const token = adminTokenFromRequest(req);
    const session = token ? adminTokens.get(token) : null;
    return Boolean(session && session.expiresAt > Date.now());
}

function createAdminToken() {
    purgeAdminTokens();
    const token = crypto.randomBytes(32).toString("hex");
    adminTokens.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + adminTokenLifetime
    });
    return token;
}

function revokeAdminToken(req) {
    const token = adminTokenFromRequest(req);
    if (token) {
        adminTokens.delete(token);
    }
}

function verifyAdminPassword(value) {
    const actual = sha256(normalizeAdminPassword(value));
    return safeHashEqual(actual, configuredAdminPasswordHash());
}

function isProtectedAdminRoute(req, pathname) {
    return adminProtectedRoutes.has(req.method + ":" + pathname);
}


function defaultDb() {
    return {
        users: [],
        sessions: {},
        scores: [],
        simonScores: [],
        adoptions: [],
        messages: [],
        reports: [],
        favorites: {},
        notifications: [],
        mailbox: [],
        pets: [],
        centers: [],
        createdAt: new Date().toISOString()
    };
}

function ensureDb() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dbPath)) {
        writeDb(defaultDb());
    }
}

function normalizeDb(db) {
    const base = defaultDb();
    const next = Object.assign(base, db || {});
    const arrayKeys = ["users", "scores", "simonScores", "adoptions", "messages", "reports", "notifications", "mailbox", "pets", "centers"];

    arrayKeys.forEach((key) => {
        if (!Array.isArray(next[key])) {
            next[key] = [];
        }
    });

    if (!next.sessions || typeof next.sessions !== "object" || Array.isArray(next.sessions)) {
        next.sessions = {};
    }

    if (!next.favorites || typeof next.favorites !== "object" || Array.isArray(next.favorites)) {
        next.favorites = {};
    }

    return next;
}

function readDb() {
    ensureDb();
    return normalizeDb(JSON.parse(fs.readFileSync(dbPath, "utf8")));
}

function writeDb(db) {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const tmp = dbPath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmp, dbPath);
}

function sendJson(res, status, payload) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    res.end(JSON.stringify(payload));
}

function configuredOrigins() {
    const raw = process.env.ALLOWED_ORIGINS || config.allowedOrigins || "*";

    if (Array.isArray(raw)) {
        return raw;
    }

    return String(raw).split(",").map((item) => item.trim()).filter(Boolean);
}

function applyCors(req, res) {
    const origin = req.headers.origin;
    const allowed = configuredOrigins();
    const allowAll = allowed.includes("*");

    if (!origin && !allowAll) {
        return;
    }

    if (allowAll) {
        res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (allowed.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Huellitas-Token, X-Huellitas-Admin-Token, X-Huellitas-Player");
    res.setHeader("Access-Control-Max-Age", "86400");
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;

            if (body.length > 8 * 1024 * 1024) {
                reject(new Error("El contenido es demasiado grande."));
                req.destroy();
            }
        });

        req.on("end", () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error("JSON invalido."));
            }
        });

        req.on("error", reject);
    });
}

function cleanText(value) {
    return String(value || "").trim();
}

function normalizeEmail(value) {
    return cleanText(value).toLowerCase();
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(String(password), salt, 160000, 32, "sha256").toString("hex");
    return salt + ":" + hash;
}

function verifyPassword(password, stored) {
    const parts = String(stored || "").split(":");

    if (parts.length !== 2) {
        return false;
    }

    const [salt, expected] = parts;
    const actual = crypto.pbkdf2Sync(String(password), salt, 160000, 32, "sha256").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function publicUser(user) {
    return {
        id: user.id || user.email,
        nombre: user.nombre,
        email: user.email,
        color: user.color || "#5f9d63",
        foto: user.foto || "https://via.placeholder.com/100",
        mascotaFavorita: user.mascotaFavorita || ""
    };
}

function createSession(db, user) {
    const token = crypto.randomBytes(32).toString("hex");
    db.sessions[token] = {
        email: user.email,
        createdAt: new Date().toISOString()
    };
    return token;
}

function getAuthUser(req, db) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers["x-huellitas-token"];
    const session = token ? db.sessions[token] : null;

    if (!session) {
        return null;
    }

    return db.users.find((user) => user.email === session.email) || null;
}

function smtpConfig() {
    const smtp = config.smtp || {};

    return {
        host: process.env.SMTP_HOST || smtp.host || "",
        port: Number(process.env.SMTP_PORT || smtp.port || 465),
        user: process.env.SMTP_USER || smtp.user || "",
        pass: process.env.SMTP_PASS || smtp.pass || "",
        from: process.env.SMTP_FROM || smtp.from || smtp.user || "",
        teamEmail: process.env.TEAM_EMAIL || config.teamEmail || smtp.teamEmail || ""
    };
}

function encodeSubject(subject) {
    return "=?UTF-8?B?" + Buffer.from(subject, "utf8").toString("base64") + "?=";
}

function dotEscape(text) {
    return String(text).replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function waitFor(socket, matcher) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("SMTP sin respuesta.")), 15000);

        function onData(data) {
            const text = data.toString("utf8");

            if (matcher(text)) {
                cleanup();
                resolve(text);
            }
        }

        function onError(error) {
            cleanup();
            reject(error);
        }

        function cleanup() {
            clearTimeout(timeout);
            socket.off("data", onData);
            socket.off("error", onError);
        }

        socket.on("data", onData);
        socket.on("error", onError);
    });
}

async function smtpCommand(socket, command, codes) {
    if (command) {
        socket.write(command + "\r\n");
    }

    const response = await waitFor(socket, (text) => /^\d{3}[ -]/.test(text));
    const code = Number(response.slice(0, 3));

    if (!codes.includes(code)) {
        throw new Error("SMTP error " + response.trim());
    }

    return response;
}

async function sendEmail({ to, subject, text, replyTo }) {
    const smtp = smtpConfig();
    const target = cleanText(to || smtp.teamEmail);

    if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from || !target) {
        return { sent: false, reason: "SMTP no configurado" };
    }

    await new Promise((resolve, reject) => {
        const socket = tls.connect({
            host: smtp.host,
            port: smtp.port,
            servername: smtp.host
        }, async () => {
            try {
                await smtpCommand(socket, "", [220]);
                await smtpCommand(socket, "EHLO huellitas.local", [250]);
                await smtpCommand(socket, "AUTH LOGIN", [334]);
                await smtpCommand(socket, Buffer.from(smtp.user).toString("base64"), [334]);
                await smtpCommand(socket, Buffer.from(smtp.pass).toString("base64"), [235]);
                await smtpCommand(socket, "MAIL FROM:<" + smtp.from + ">", [250]);
                await smtpCommand(socket, "RCPT TO:<" + target + ">", [250, 251]);
                await smtpCommand(socket, "DATA", [354]);

                const headers = [
                    "From: Huellitas <" + smtp.from + ">",
                    "To: " + target,
                    "Subject: " + encodeSubject(subject),
                    "MIME-Version: 1.0",
                    "Content-Type: text/plain; charset=UTF-8"
                ];

                if (replyTo) {
                    headers.push("Reply-To: " + replyTo);
                }

                socket.write(headers.join("\r\n") + "\r\n\r\n" + dotEscape(text) + "\r\n.\r\n");
                await smtpCommand(socket, "", [250]);
                await smtpCommand(socket, "QUIT", [221]);
                socket.end();
                resolve();
            } catch (error) {
                socket.destroy();
                reject(error);
            }
        });

        socket.on("error", reject);
    });

    return { sent: true };
}

function emailBody(title, fields) {
    const lines = [title, ""];

    Object.entries(fields).forEach(([key, value]) => {
        lines.push(key + ": " + (value || "Sin dato"));
    });

    return lines.join("\n");
}

function nowMx() {
    return new Date().toLocaleString("es-MX");
}

function makeId(prefix) {
    return prefix + "-" + crypto.randomUUID();
}

function profileIdFrom(body, user) {
    return cleanText(body.profileId) || (user && user.email) || normalizeEmail(body.correo || body.email) || cleanText(body.nombre) || "visitante";
}

function findIndexById(items, id) {
    return items.findIndex((item) => cleanText(item.id) === cleanText(id));
}

function upsertById(items, item) {
    const id = cleanText(item.id) || makeId("item");
    const next = Object.assign({}, item, { id });
    const index = findIndexById(items, id);

    if (index >= 0) {
        items[index] = Object.assign({}, items[index], next);
        return { item: items[index], created: false };
    }

    items.unshift(next);
    return { item: next, created: true };
}

function addMailbox(db, message) {
    const item = Object.assign({
        id: makeId("msg"),
        fecha: nowMx(),
        readByAdmin: false,
        readByUser: false
    }, message);

    upsertById(db.mailbox, item);
    return item;
}

function addNotification(db, notification) {
    const item = Object.assign({
        id: makeId("noti"),
        fecha: nowMx(),
        read: false
    }, notification);

    upsertById(db.notifications, item);
    db.notifications = db.notifications.slice(0, 80);
    return item;
}

function normalizeAdoption(body, user) {
    const fecha = cleanText(body.fecha) || nowMx();
    const estado = cleanText(body.estado) || "Enviada";

    return Object.assign({}, body, {
        id: cleanText(body.id) || makeId("solicitud"),
        profileId: profileIdFrom(body, user),
        fecha,
        estado,
        historial: Array.isArray(body.historial) && body.historial.length
            ? body.historial
            : [{ estado, fecha }],
        cita: body.cita || null
    });
}

function normalizeReport(body, user) {
    const fecha = cleanText(body.fecha) || nowMx();
    const estado = cleanText(body.estado) || "Recibido";

    return Object.assign({}, body, {
        id: cleanText(body.id) || makeId("reporte"),
        profileId: profileIdFrom(body, user),
        fecha,
        estado,
        historial: Array.isArray(body.historial) && body.historial.length
            ? body.historial
            : [{ estado, fecha }]
    });
}

function appointmentList(db) {
    return db.adoptions
        .filter((item) => item.cita && item.cita.fecha)
        .map((item) => ({
            id: item.id,
            fecha: item.cita.fecha,
            hora: item.cita.hora || "",
            lugar: item.cita.lugar || item.centro || "Huellitas",
            nombre: item.nombre || "Adoptante",
            mascota: item.mascotaNombre || item.mascota || "Mascota",
            estado: item.estado || "Cita programada"
        }))
        .sort((a, b) => String(a.fecha + a.hora).localeCompare(String(b.fecha + b.hora)));
}

function buildStats(db) {
    const countBy = (items, key, fallback) => items.reduce((acc, item) => {
        const label = cleanText(item[key]) || fallback;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});

    return {
        adoptionStates: countBy(db.adoptions, "estado", "Enviada"),
        reportStates: countBy(db.reports, "estado", "Recibido"),
        petStates: countBy(db.pets, "estado", "Disponible"),
        reportsPending: db.reports.filter((item) => item.estado !== "Atendido").length,
        unreadMessages: db.mailbox.filter((item) => item.from !== "admin" && item.readByAdmin !== true).length,
        appointments: appointmentList(db),
        favoritesTotal: Object.values(db.favorites).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0),
        usersTotal: db.users.length
    };
}

function seedDemo(db) {
    const demoAdoptions = [
        {
            id: "demo-sol-luna",
            profileId: "demo.usuario@huellitas.local",
            fecha: "19/6/2026, 10:15:00 a.m.",
            centro: "Refugio Huellas de Amor",
            ubicacion: "Tultitlan",
            nombre: "Ana Martinez",
            correo: "ana.demo@correo.com",
            telefono: "5512345678",
            mascota: "Perro",
            mascotaNombre: "Luna",
            vivienda: "Casa",
            correoEquipo: "equipo@huellitas.local",
            mensaje: "Tengo patio y tiempo para paseos diarios.",
            checklist: 92,
            estado: "Cita programada",
            cita: { fecha: "2026-06-22", hora: "11:30", lugar: "Refugio Huellas de Amor" },
            historial: [
                { estado: "Enviada", fecha: "19/6/2026, 10:15:00 a.m." },
                { estado: "Revisando", fecha: "19/6/2026, 12:20:00 p.m." },
                { estado: "Aprobada", fecha: "20/6/2026, 09:10:00 a.m." },
                { estado: "Cita programada", fecha: "20/6/2026, 09:30:00 a.m." }
            ]
        },
        {
            id: "demo-sol-panque",
            profileId: "demo.gato@huellitas.local",
            fecha: "20/6/2026, 04:05:00 p.m.",
            centro: "Patitas Felices Tultitlan",
            ubicacion: "Unidad Morelos",
            nombre: "Diego Perez",
            correo: "diego.demo@correo.com",
            telefono: "5598765432",
            mascota: "Gato",
            mascotaNombre: "Panque",
            vivienda: "Departamento",
            correoEquipo: "equipo@huellitas.local",
            mensaje: "Busco un gatito tranquilo para casa.",
            checklist: 84,
            estado: "Revisando",
            cita: null,
            historial: [
                { estado: "Enviada", fecha: "20/6/2026, 04:05:00 p.m." },
                { estado: "Revisando", fecha: "20/6/2026, 04:40:00 p.m." }
            ]
        },
        {
            id: "demo-sol-oso",
            profileId: "demo.familia@huellitas.local",
            fecha: "18/6/2026, 02:35:00 p.m.",
            centro: "Casa Canina Esperanza",
            ubicacion: "Fuentes del Valle",
            nombre: "Familia Rivera",
            correo: "rivera.demo@correo.com",
            telefono: "5577001122",
            mascota: "Perro",
            mascotaNombre: "Oso",
            vivienda: "Casa con patio",
            correoEquipo: "equipo@huellitas.local",
            mensaje: "Queremos adoptar en familia y dar seguimiento.",
            checklist: 76,
            estado: "Aprobada",
            cita: null,
            historial: [
                { estado: "Enviada", fecha: "18/6/2026, 02:35:00 p.m." },
                { estado: "Revisando", fecha: "18/6/2026, 06:05:00 p.m." },
                { estado: "Aprobada", fecha: "19/6/2026, 11:00:00 a.m." }
            ]
        }
    ];
    const demoReports = [
        {
            id: "demo-reporte-juegos",
            profileId: "demo.usuario@huellitas.local",
            fecha: "20/6/2026, 01:10:00 p.m.",
            tipo: "Error de la pagina",
            contacto: "ana.demo@correo.com",
            pagina: "Juegos",
            correoEquipo: "equipo@huellitas.local",
            mensaje: "El usuario reporto que un minijuego tardaba en responder.",
            estado: "En revision",
            historial: [
                { estado: "Recibido", fecha: "20/6/2026, 01:10:00 p.m." },
                { estado: "En revision", fecha: "20/6/2026, 01:25:00 p.m." }
            ]
        },
        {
            id: "demo-reporte-calle",
            profileId: "demo.vecino@huellitas.local",
            fecha: "19/6/2026, 05:45:00 p.m.",
            tipo: "Animal perdido o herido",
            contacto: "vecino.demo@correo.com",
            pagina: "Inicio",
            correoEquipo: "equipo@huellitas.local",
            mensaje: "Se registro seguimiento para un perrito visto cerca del parque.",
            estado: "Atendido",
            historial: [
                { estado: "Recibido", fecha: "19/6/2026, 05:45:00 p.m." },
                { estado: "En revision", fecha: "19/6/2026, 06:20:00 p.m." },
                { estado: "Atendido", fecha: "20/6/2026, 09:00:00 a.m." }
            ]
        }
    ];
    const demoPets = [
        {
            id: "demo-pet-luna",
            nombre: "Luna",
            tipo: "Perro",
            edad: "1 ano",
            estado: "Disponible",
            energia: "medio",
            espacio: "casa",
            rutina: "familia",
            personalidad: "dulce, juguetona y sociable",
            historia: "Rescatada en buen estado; busca una familia que la acompane y la saque a pasear.",
            imagen: "assets/imagenes/1000107801.jpg",
            fecha: "18/6/2026, 11:20:00 a.m."
        },
        {
            id: "demo-pet-milo",
            nombre: "Milo",
            tipo: "Gato",
            edad: "8 meses",
            estado: "En proceso",
            energia: "calma",
            espacio: "departamento",
            rutina: "solo",
            personalidad: "curioso, limpio y tranquilo",
            historia: "Ideal para un hogar tranquilo con ventanas protegidas.",
            imagen: "assets/imagenes/1000107795.jpg",
            fecha: "17/6/2026, 02:00:00 p.m."
        }
    ];
    const demoCenters = [
        { id: "demo-centro-1", nombre: "Refugio Huellas de Amor", zona: "Tultitlan", contacto: "huellas@demo.com", estado: "Aprobado", fecha: "17/6/2026, 12:00:00 p.m." },
        { id: "demo-centro-2", nombre: "Centro Patitas Norte", zona: "Coacalco", contacto: "patitasnorte@demo.com", estado: "Pendiente", fecha: "20/6/2026, 10:00:00 a.m." }
    ];
    const demoMailbox = [
        { id: "demo-msg-1", profileId: "demo.usuario@huellitas.local", nombre: "Ana Martinez", correo: "ana.demo@correo.com", from: "admin", mensaje: "Tu cita quedo programada para conocer a Luna.", fecha: "20/6/2026, 09:30:00 a.m.", readByAdmin: true, readByUser: false },
        { id: "demo-msg-2", profileId: "demo.gato@huellitas.local", nombre: "Diego Perez", correo: "diego.demo@correo.com", from: "usuario", mensaje: "Puedo llevar transportadora para conocer a Panque?", fecha: "20/6/2026, 04:45:00 p.m.", readByAdmin: false, readByUser: true }
    ];
    const demoNotifications = [
        { id: "demo-noti-cita", profileId: "demo.usuario@huellitas.local", title: "Cita programada", body: "Luna te espera el 22 de junio a las 11:30.", href: "mi_adopcion.html", kind: "appointment", fecha: "20/6/2026, 09:30:00 a.m.", read: false },
        { id: "demo-noti-reporte", profileId: "demo.vecino@huellitas.local", title: "Reporte atendido", body: "El equipo actualizo el reporte del parque.", href: "pagina.html#impacto", kind: "report", fecha: "20/6/2026, 09:00:00 a.m.", read: false }
    ];

    demoAdoptions.forEach((item) => upsertById(db.adoptions, item));
    demoReports.forEach((item) => upsertById(db.reports, item));
    demoPets.forEach((item) => upsertById(db.pets, item));
    demoCenters.forEach((item) => upsertById(db.centers, item));
    demoMailbox.forEach((item) => upsertById(db.mailbox, item));
    demoNotifications.forEach((item) => upsertById(db.notifications, item));

    db.favorites["demo.usuario@huellitas.local"] = [
        { kind: "pet", id: "Luna", title: "Luna", subtitle: "Perro", href: "adoptar.html?mascota=Luna&tipo=Perro#solicitud", image: "assets/imagenes/1000107801.jpg", addedAt: "20/6/2026, 09:00:00 a.m." },
        { kind: "center", id: "Refugio Huellas de Amor", title: "Refugio Huellas de Amor", subtitle: "Tultitlan", href: "directorio.html#centros", image: "", addedAt: "20/6/2026, 09:05:00 a.m." }
    ];

    upsertById(db.scores, {
        id: "demo.usuario@huellitas.local",
        nombre: "Ana Martinez",
        email: "demo.usuario@huellitas.local",
        foto: "assets/imagenes/logo.png",
        mejorPuntaje: 1420,
        mejoresLogros: 12,
        ultimoPuntaje: 1420,
        ultimaVez: "20/6/2026, 08:45:00 p.m."
    });
}

function isDemoRecord(item) {
    const text = [
        item && item.id,
        item && item.profileId,
        item && item.email,
        item && item.correo,
        item && item.nombre
    ].join(" ").toLowerCase();

    return text.includes("demo");
}

function removeDemoData(db) {
    ["adoptions", "reports", "pets", "centers", "mailbox", "notifications", "scores", "messages"].forEach((key) => {
        db[key] = (db[key] || []).filter((item) => !isDemoRecord(item));
    });

    Object.keys(db.favorites || {}).forEach((profileId) => {
        if (String(profileId).toLowerCase().includes("demo")) {
            delete db.favorites[profileId];
            return;
        }

        db.favorites[profileId] = (db.favorites[profileId] || []).filter((item) => !isDemoRecord(item));
    });
}

async function handleApi(req, res, pathname) {
    const db = readDb();
    const body = await readBody(req);

    if (req.method === "POST" && pathname === "/api/admin/login") {
        if (isAdminRateLimited(req)) {
            sendJson(res, 429, { ok: false, error: "Demasiados intentos. Espera unos minutos." });
            return;
        }

        if (!verifyAdminPassword(body.password)) {
            registerFailedAdminAttempt(req);
            sendJson(res, 401, { ok: false, error: "Clave incorrecta." });
            return;
        }

        clearAdminAttempts(req);
        sendJson(res, 200, { ok: true, token: createAdminToken(), expiresIn: adminTokenLifetime });
        return;
    }

    if (req.method === "POST" && pathname === "/api/admin/logout") {
        revokeAdminToken(req);
        sendJson(res, 200, { ok: true });
        return;
    }

    if (isProtectedAdminRoute(req, pathname) && !isAdminRequest(req)) {
        sendJson(res, 401, { ok: false, error: "Se requiere una sesion de administrador valida." });
        return;
    }

    if (req.method === "POST" && pathname === "/api/mailbox" && String(body.from || "").toLowerCase() === "admin" && !isAdminRequest(req)) {
        sendJson(res, 401, { ok: false, error: "No puedes enviar mensajes como administrador." });
        return;
    }

    if (req.method === "GET" && pathname === "/api/health") {
        sendJson(res, 200, {
            ok: true,
            name: "Huellitas API",
            users: db.users.length,
            adoptions: db.adoptions.length,
            reports: db.reports.length,
            updatedAt: new Date().toISOString()
        });
        return;
    }

    if (req.method === "POST" && pathname === "/api/register") {
        const nombre = cleanText(body.nombre);
        const email = normalizeEmail(body.email);
        const pass = String(body.pass || "");

        if (!nombre || !email || pass.length < 6) {
            sendJson(res, 400, { ok: false, error: "Completa nombre, correo y contrasena de 6 caracteres." });
            return;
        }

        if (db.users.some((user) => user.email === email)) {
            sendJson(res, 409, { ok: false, error: "Ese correo ya esta registrado." });
            return;
        }

        const user = {
            id: crypto.randomUUID(),
            nombre,
            email,
            passHash: hashPassword(pass),
            color: cleanText(body.color) || "#5f9d63",
            foto: cleanText(body.foto) || "https://via.placeholder.com/100",
            mascotaFavorita: "",
            createdAt: new Date().toISOString()
        };

        db.users.push(user);
        const token = createSession(db, user);
        writeDb(db);
        sendJson(res, 201, { ok: true, token, user: publicUser(user) });
        return;
    }

    if (req.method === "POST" && pathname === "/api/login") {
        const email = normalizeEmail(body.email);
        const user = db.users.find((item) => item.email === email);

        if (!user || !verifyPassword(body.pass || "", user.passHash)) {
            sendJson(res, 401, { ok: false, error: "Correo o contrasena incorrectos." });
            return;
        }

        const token = createSession(db, user);
        writeDb(db);
        sendJson(res, 200, { ok: true, token, user: publicUser(user) });
        return;
    }

    if (req.method === "POST" && pathname === "/api/profile") {
        const user = getAuthUser(req, db);

        if (!user) {
            sendJson(res, 401, { ok: false, error: "Inicia sesion." });
            return;
        }

        user.nombre = cleanText(body.nombre) || user.nombre;
        user.color = cleanText(body.color) || user.color;
        user.foto = cleanText(body.foto) || user.foto;
        user.mascotaFavorita = cleanText(body.mascotaFavorita) || user.mascotaFavorita || "";
        user.updatedAt = new Date().toISOString();
        writeDb(db);
        sendJson(res, 200, { ok: true, user: publicUser(user) });
        return;
    }

    if (req.method === "GET" && pathname === "/api/simon-ranking") {
        const currentId = cleanText(req.headers["x-huellitas-player"]);
        const ordered = db.simonScores.slice().sort(compareSimonScores);
        const scores = ordered.slice(0, 10).map((item, index) => publicSimonScore(item, index + 1, currentId));
        const currentIndex = currentId ? ordered.findIndex((item) => item.anonymousId === currentId) : -1;

        sendJson(res, 200, {
            ok: true,
            title: "Mejor Memoria Perruna",
            scores,
            current: currentIndex >= 0 ? publicSimonScore(ordered[currentIndex], currentIndex + 1, currentId) : null,
            updatedAt: ordered.length ? ordered[0].date : null
        });
        return;
    }

    if (req.method === "POST" && pathname === "/api/simon-ranking") {
        const parsed = validateSimonScore(body);

        if (parsed.error) {
            sendJson(res, 400, { ok: false, error: parsed.error });
            return;
        }

        const score = parsed.value;

        if (isSimonRateLimited(req, score.anonymousId)) {
            sendJson(res, 429, { ok: false, error: "Demasiados envios. Espera unos minutos." });
            return;
        }

        const now = new Date().toISOString();
        const existingIndex = db.simonScores.findIndex((item) => item.anonymousId === score.anonymousId);
        let savedBest = true;

        if (existingIndex >= 0) {
            const existing = db.simonScores[existingIndex];
            savedBest = isBetterSimonScore(score, existing);
            existing.nickname = score.nickname;
            existing.lastPlayedAt = now;

            if (savedBest) {
                Object.assign(existing, score, { date: now, lastPlayedAt: now });
            }
        } else {
            db.simonScores.push(Object.assign({
                id: "simon-" + sha256(score.anonymousId).slice(0, 16)
            }, score, { date: now, lastPlayedAt: now }));
        }

        db.simonScores = db.simonScores.slice().sort(compareSimonScores).slice(0, 500);
        writeDb(db);

        const ordered = db.simonScores.slice().sort(compareSimonScores);
        const scores = ordered.slice(0, 10).map((item, index) => publicSimonScore(item, index + 1, score.anonymousId));
        const currentIndex = ordered.findIndex((item) => item.anonymousId === score.anonymousId);

        sendJson(res, 200, {
            ok: true,
            savedBest,
            scores,
            current: currentIndex >= 0 ? publicSimonScore(ordered[currentIndex], currentIndex + 1, score.anonymousId) : null,
            updatedAt: now
        });
        return;
    }

    if (req.method === "POST" && pathname === "/api/scores") {
        const authUser = getAuthUser(req, db);
        const id = authUser ? authUser.email : cleanText(body.id || body.email || "invitado");
        const existing = db.scores.find((item) => item.id === id);
        const score = Number(body.puntaje || body.mejorPuntaje || 0);
        const achievements = Number(body.logros || body.mejoresLogros || 0);

        if (existing) {
            existing.nombre = authUser ? authUser.nombre : cleanText(body.nombre) || existing.nombre;
            existing.email = authUser ? authUser.email : cleanText(body.email);
            existing.foto = authUser ? authUser.foto : cleanText(body.foto) || existing.foto || "assets/imagenes/logo.png";
            existing.mejorPuntaje = Math.max(existing.mejorPuntaje || 0, score);
            existing.mejoresLogros = Math.max(existing.mejoresLogros || 0, achievements);
            existing.ultimoPuntaje = score;
            existing.ultimaVez = new Date().toISOString();
        } else {
            db.scores.push({
                id,
                nombre: authUser ? authUser.nombre : cleanText(body.nombre) || "Invitado",
                email: authUser ? authUser.email : cleanText(body.email),
                foto: authUser ? authUser.foto : cleanText(body.foto) || "assets/imagenes/logo.png",
                mejorPuntaje: score,
                mejoresLogros: achievements,
                ultimoPuntaje: score,
                ultimaVez: new Date().toISOString()
            });
        }

        writeDb(db);
        sendJson(res, 200, { ok: true });
        return;
    }

    if (req.method === "POST" && pathname === "/api/contact") {
        const authUser = getAuthUser(req, db);
        const message = Object.assign({}, body, {
            id: cleanText(body.id) || makeId("contacto"),
            profileId: profileIdFrom(body, authUser),
            fecha: cleanText(body.fecha) || nowMx()
        });
        upsertById(db.messages, message);
        writeDb(db);

        const mail = await sendEmail({
            to: message.correoEquipo,
            replyTo: message.correo,
            subject: "Mensaje Huellitas - " + (message.tipo || "Contacto"),
            text: emailBody("Nuevo mensaje desde Huellitas.", message)
        });

        sendJson(res, 200, { ok: true, message, emailSent: mail.sent, emailReason: mail.reason || "" });
        return;
    }

    if (req.method === "POST" && pathname === "/api/adoptions") {
        const authUser = getAuthUser(req, db);
        const adoption = normalizeAdoption(body, authUser);
        const result = upsertById(db.adoptions, adoption);

        if (result.created) {
            addMailbox(db, {
                id: "msg-solicitud-" + adoption.id,
                profileId: adoption.profileId,
                nombre: adoption.nombre,
                correo: adoption.correo,
                from: "admin",
                mensaje: "Tu solicitud fue recibida. El equipo revisara tus datos y te avisara el siguiente paso.",
                fecha: adoption.fecha,
                readByAdmin: true,
                readByUser: false
            });
            addNotification(db, {
                id: "adoption-" + adoption.id + "-enviada",
                profileId: adoption.profileId,
                title: "Tu solicitud fue recibida",
                body: "Guardamos tu solicitud para " + (adoption.mascotaNombre || adoption.mascota || "tu mascota") + ".",
                href: "mi_adopcion.html",
                kind: "adoption",
                fecha: adoption.fecha
            });
        }

        writeDb(db);

        const mail = await sendEmail({
            to: adoption.correoEquipo,
            replyTo: adoption.correo,
            subject: "Solicitud de adopcion - " + (adoption.centro || "Huellitas"),
            text: emailBody("Nueva solicitud de adopcion.", adoption)
        });

        sendJson(res, 200, { ok: true, adoption: result.item, emailSent: mail.sent, emailReason: mail.reason || "" });
        return;
    }

    if (req.method === "POST" && pathname === "/api/adoptions/status") {
        const id = cleanText(body.id);
        const estado = cleanText(body.estado);
        const adoption = db.adoptions.find((item) => item.id === id);

        if (!adoption || !estado) {
            sendJson(res, 404, { ok: false, error: "Solicitud no encontrada." });
            return;
        }

        const fecha = nowMx();
        if (adoption.estado === estado) {
            sendJson(res, 200, { ok: true, adoption, unchanged: true });
            return;
        }

        adoption.estado = estado;
        adoption.historial = Array.isArray(adoption.historial) ? adoption.historial : [];
        adoption.historial.push({ estado, fecha });
        adoption.actualizado = fecha;
        addMailbox(db, {
            id: "msg-adoption-" + adoption.id + "-" + estado.toLowerCase().replace(/\s+/g, "-"),
            profileId: adoption.profileId,
            nombre: adoption.nombre,
            correo: adoption.correo,
            from: "admin",
            mensaje: "Tu solicitud ahora esta en estado: " + estado + ".",
            readByAdmin: true,
            readByUser: false
        });
        addNotification(db, {
            id: "adoption-" + adoption.id + "-" + estado.toLowerCase().replace(/\s+/g, "-"),
            profileId: adoption.profileId,
            title: "Solicitud " + estado,
            body: "El equipo actualizo tu solicitud de adopcion.",
            href: "mi_adopcion.html",
            kind: "adoption"
        });
        writeDb(db);
        sendJson(res, 200, { ok: true, adoption });
        return;
    }

    if (req.method === "POST" && pathname === "/api/adoptions/appointment") {
        const id = cleanText(body.id);
        const adoption = db.adoptions.find((item) => item.id === id);

        if (!adoption) {
            sendJson(res, 404, { ok: false, error: "Solicitud no encontrada." });
            return;
        }

        const cita = {
            fecha: cleanText(body.fecha),
            hora: cleanText(body.hora),
            lugar: cleanText(body.lugar) || adoption.centro || "Huellitas"
        };

        if (!cita.fecha || !cita.hora || !cita.lugar) {
            sendJson(res, 400, { ok: false, error: "Completa fecha, hora y lugar de la cita." });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(cita.fecha + "T00:00:00");

        if (selectedDate < today) {
            sendJson(res, 400, { ok: false, error: "La cita no puede quedar en una fecha pasada." });
            return;
        }

        if (adoption.cita
            && adoption.cita.fecha === cita.fecha
            && adoption.cita.hora === cita.hora
            && adoption.cita.lugar === cita.lugar
            && adoption.estado === "Cita programada") {
            sendJson(res, 200, { ok: true, adoption, unchanged: true });
            return;
        }

        const fechaHistorial = nowMx();
        adoption.cita = cita;
        adoption.estado = "Cita programada";
        adoption.historial = Array.isArray(adoption.historial) ? adoption.historial : [];
        adoption.historial.push({ estado: "Cita programada", fecha: fechaHistorial });
        adoption.actualizado = fechaHistorial;
        addMailbox(db, {
            id: "msg-cita-" + adoption.id,
            profileId: adoption.profileId,
            nombre: adoption.nombre,
            correo: adoption.correo,
            from: "admin",
            mensaje: "Tu cita quedo programada para " + cita.fecha + " " + cita.hora + " en " + cita.lugar + ".",
            readByAdmin: true,
            readByUser: false
        });
        addNotification(db, {
            id: "adoption-" + adoption.id + "-cita",
            profileId: adoption.profileId,
            title: "Cita programada",
            body: "Tienes una cita de adopcion para " + (adoption.mascotaNombre || adoption.mascota || "tu mascota") + ".",
            href: "mi_adopcion.html",
            kind: "appointment"
        });
        writeDb(db);
        sendJson(res, 200, { ok: true, adoption });
        return;
    }

    if (req.method === "POST" && pathname === "/api/reports") {
        const authUser = getAuthUser(req, db);
        const report = normalizeReport(body, authUser);
        upsertById(db.reports, report);
        addNotification(db, {
            id: "report-" + report.id,
            profileId: report.profileId,
            title: "Reporte recibido",
            body: "Tu reporte quedo guardado para seguimiento.",
            href: "pagina.html#impacto",
            kind: "report",
            fecha: report.fecha
        });
        writeDb(db);

        const mail = await sendEmail({
            to: report.correoEquipo,
            replyTo: report.contacto && report.contacto.includes("@") ? report.contacto : "",
            subject: "Reporte Huellitas - " + (report.tipo || "Reporte"),
            text: emailBody("Nuevo reporte desde Huellitas.", report)
        });

        sendJson(res, 200, { ok: true, report, emailSent: mail.sent, emailReason: mail.reason || "" });
        return;
    }

    if (req.method === "POST" && pathname === "/api/reports/status") {
        const id = cleanText(body.id);
        const estado = cleanText(body.estado);
        const report = db.reports.find((item) => item.id === id);

        if (!report || !estado) {
            sendJson(res, 404, { ok: false, error: "Reporte no encontrado." });
            return;
        }

        const fecha = nowMx();
        report.estado = estado;
        report.historial = Array.isArray(report.historial) ? report.historial : [];
        report.historial.push({ estado, fecha });
        addNotification(db, {
            id: "report-" + report.id + "-" + estado.toLowerCase().replace(/\s+/g, "-"),
            profileId: report.profileId,
            title: "Reporte " + estado,
            body: "El equipo actualizo el seguimiento de tu reporte.",
            href: "pagina.html#impacto",
            kind: "report"
        });
        writeDb(db);
        sendJson(res, 200, { ok: true, report });
        return;
    }

    if (req.method === "POST" && pathname === "/api/mailbox") {
        const message = addMailbox(db, Object.assign({}, body, {
            id: cleanText(body.id) || makeId("msg"),
            profileId: profileIdFrom(body, getAuthUser(req, db)),
            fecha: cleanText(body.fecha) || nowMx()
        }));

        if (message.from === "admin") {
            addNotification(db, {
                id: "mail-" + message.id,
                profileId: message.profileId,
                title: "Nuevo mensaje del equipo",
                body: message.mensaje,
                href: "mi_adopcion.html",
                kind: "mail",
                fecha: message.fecha
            });
        }

        writeDb(db);
        sendJson(res, 200, { ok: true, message, mailbox: db.mailbox });
        return;
    }

    if (req.method === "POST" && pathname === "/api/notifications") {
        const notification = addNotification(db, Object.assign({}, body, {
            id: cleanText(body.id) || makeId("noti"),
            profileId: cleanText(body.profileId) || profileIdFrom(body, getAuthUser(req, db)),
            fecha: cleanText(body.fecha) || nowMx()
        }));

        writeDb(db);
        sendJson(res, 200, { ok: true, notification, notifications: db.notifications });
        return;
    }

    if (req.method === "POST" && pathname === "/api/notifications/read") {
        const profileId = cleanText(body.profileId) || profileIdFrom(body, getAuthUser(req, db));

        db.notifications = db.notifications.map((item) => {
            if (!item.profileId || item.profileId === profileId) {
                return Object.assign({}, item, { read: true });
            }

            return item;
        });
        writeDb(db);
        sendJson(res, 200, { ok: true, notifications: db.notifications });
        return;
    }

    if (req.method === "POST" && pathname === "/api/favorites") {
        const profileId = cleanText(body.profileId) || profileIdFrom(body, getAuthUser(req, db));
        const favorites = Array.isArray(body.favorites) ? body.favorites : [];

        db.favorites[profileId] = favorites.slice(0, 80);
        writeDb(db);
        sendJson(res, 200, { ok: true, profileId, favorites: db.favorites[profileId] });
        return;
    }

    if (req.method === "POST" && pathname === "/api/pets") {
        const pet = Object.assign({}, body, {
            id: cleanText(body.id) || makeId("pet"),
            fecha: cleanText(body.fecha) || nowMx()
        });
        const result = upsertById(db.pets, pet);

        addNotification(db, {
            id: "new-pet-" + result.item.id,
            title: "Nueva mascota disponible",
            body: result.item.nombre + " fue agregada a adopciones.",
            href: "adopcion_huellitas.html#mascotas",
            kind: "pet",
            fecha: result.item.fecha
        });
        writeDb(db);
        sendJson(res, 200, { ok: true, pet: result.item, pets: db.pets });
        return;
    }

    if (req.method === "POST" && pathname === "/api/pets/status") {
        const pet = db.pets.find((item) => item.id === cleanText(body.id));

        if (!pet) {
            sendJson(res, 404, { ok: false, error: "Mascota no encontrada." });
            return;
        }

        pet.estado = cleanText(body.estado) || pet.estado || "Disponible";
        pet.actualizado = nowMx();
        writeDb(db);
        sendJson(res, 200, { ok: true, pet, pets: db.pets });
        return;
    }

    if (req.method === "POST" && pathname === "/api/pets/delete") {
        const id = cleanText(body.id);
        db.pets = db.pets.filter((item) => item.id !== id);
        writeDb(db);
        sendJson(res, 200, { ok: true, pets: db.pets });
        return;
    }

    if (req.method === "POST" && pathname === "/api/centers") {
        const center = Object.assign({}, body, {
            id: cleanText(body.id) || makeId("centro"),
            fecha: cleanText(body.fecha) || nowMx()
        });
        const result = upsertById(db.centers, center);

        writeDb(db);
        sendJson(res, 200, { ok: true, center: result.item, centers: db.centers });
        return;
    }

    if (req.method === "POST" && pathname === "/api/centers/status") {
        const center = db.centers.find((item) => item.id === cleanText(body.id));

        if (!center) {
            sendJson(res, 404, { ok: false, error: "Centro no encontrado." });
            return;
        }

        center.estado = cleanText(body.estado) || center.estado || "Pendiente";
        center.actualizado = nowMx();
        writeDb(db);
        sendJson(res, 200, { ok: true, center, centers: db.centers });
        return;
    }

    if (req.method === "POST" && pathname === "/api/demo") {
        seedDemo(db);
        writeDb(db);
        sendJson(res, 200, {
            ok: true,
            adoptions: db.adoptions,
            messages: db.messages,
            reports: db.reports,
            scores: db.scores,
            users: db.users.map(publicUser),
            favorites: db.favorites,
            notifications: db.notifications,
            mailbox: db.mailbox,
            pets: db.pets,
            centers: db.centers,
            stats: buildStats(db)
        });
        return;
    }

    if (req.method === "POST" && pathname === "/api/demo/reset") {
        removeDemoData(db);
        writeDb(db);
        sendJson(res, 200, {
            ok: true,
            adoptions: db.adoptions,
            messages: db.messages,
            reports: db.reports,
            scores: db.scores,
            users: db.users.map(publicUser),
            favorites: db.favorites,
            notifications: db.notifications,
            mailbox: db.mailbox,
            pets: db.pets,
            centers: db.centers,
            stats: buildStats(db)
        });
        return;
    }

    if (req.method === "GET" && pathname === "/api/backup") {
        sendJson(res, 200, {
            ok: true,
            exportedAt: new Date().toISOString(),
            db,
            stats: buildStats(db)
        });
        return;
    }

    if (req.method === "POST" && pathname === "/api/restore") {
        const restored = normalizeDb(body.db || body);
        writeDb(restored);
        sendJson(res, 200, {
            ok: true,
            adoptions: restored.adoptions,
            messages: restored.messages,
            reports: restored.reports,
            scores: restored.scores,
            favorites: restored.favorites,
            notifications: restored.notifications,
            mailbox: restored.mailbox,
            pets: restored.pets,
            centers: restored.centers,
            stats: buildStats(restored)
        });
        return;
    }

    if (req.method === "POST" && pathname === "/api/base") {
        const baseDb = defaultDb();
        baseDb.users = db.users || [];
        baseDb.sessions = db.sessions || {};
        writeDb(baseDb);
        sendJson(res, 200, {
            ok: true,
            adoptions: baseDb.adoptions,
            messages: baseDb.messages,
            reports: baseDb.reports,
            scores: baseDb.scores,
            favorites: baseDb.favorites,
            notifications: baseDb.notifications,
            mailbox: baseDb.mailbox,
            pets: baseDb.pets,
            centers: baseDb.centers,
            stats: buildStats(baseDb)
        });
        return;
    }

    if (req.method === "POST" && pathname === "/api/reset") {
        const cleanDb = defaultDb();
        writeDb(cleanDb);
        sendJson(res, 200, {
            ok: true,
            adoptions: cleanDb.adoptions,
            messages: cleanDb.messages,
            reports: cleanDb.reports,
            scores: cleanDb.scores,
            favorites: cleanDb.favorites,
            notifications: cleanDb.notifications,
            mailbox: cleanDb.mailbox,
            pets: cleanDb.pets,
            centers: cleanDb.centers,
            stats: buildStats(cleanDb)
        });
        return;
    }

    if (req.method === "GET" && pathname === "/api/public-data") {
        const publicReports = db.reports.filter((item) => {
            const state = String(item.estado || (item.lostPet && item.lostPet.status) || "").toLowerCase();
            return Boolean(item.lostPet && /(publicado|aprobado|activo|encontrado)/.test(state));
        });
        const publicPets = db.pets.filter((item) => !/(oculto|eliminado|rechazado)/i.test(String(item.estado || "")));
        const publicCenters = db.centers.filter((item) => !/(pendiente|oculto|rechazado)/i.test(String(item.estado || "Aprobado")));
        const publicScores = db.scores
            .slice()
            .sort((a, b) => Number(b.mejorPuntaje || 0) - Number(a.mejorPuntaje || 0))
            .slice(0, 25)
            .map((item, index) => ({
                id: "ranking-" + (index + 1),
                nombre: cleanText(item.nombre) || "Cuidador",
                foto: cleanText(item.foto) || "assets/imagenes/logo.png",
                mejorPuntaje: Number(item.mejorPuntaje || 0),
                mejoresLogros: Number(item.mejoresLogros || 0)
            }));

        sendJson(res, 200, {
            ok: true,
            adoptions: [],
            reports: publicReports,
            scores: publicScores,
            pets: publicPets,
            centers: publicCenters,
            stats: {
                pets: publicPets.length,
                centers: publicCenters.length,
                reports: publicReports.length
            }
        });
        return;
    }

    if (req.method === "GET" && pathname === "/api/team-data") {
        sendJson(res, 200, {
            ok: true,
            adoptions: db.adoptions,
            messages: db.messages,
            reports: db.reports,
            scores: db.scores,
            users: db.users.map(publicUser),
            favorites: db.favorites,
            notifications: db.notifications,
            mailbox: db.mailbox,
            pets: db.pets,
            centers: db.centers,
            appointments: appointmentList(db),
            stats: buildStats(db)
        });
        return;
    }

    sendJson(res, 404, { ok: false, error: "Ruta API no encontrada." });
}

function safeStaticPath(pathname) {
    let requested = decodeURIComponent(pathname);

    if (requested === "/") {
        requested = "/app.html";
    }

    const fullPath = path.normalize(path.join(root, requested));

    if (!fullPath.startsWith(root) || fullPath.includes(path.join(root, "data")) || fullPath.endsWith("server-config.json") || fullPath.endsWith("server.js")) {
        return null;
    }

    return fullPath;
}

function serveStatic(req, res, pathname) {
    const fullPath = safeStaticPath(pathname);

    if (!fullPath || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Archivo no encontrado.");
        return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    fs.createReadStream(fullPath).pipe(res);
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    applyCors(req, res);

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        if (url.pathname.startsWith("/api/")) {
            await handleApi(req, res, url.pathname);
            return;
        }

        serveStatic(req, res, url.pathname);
    } catch (error) {
        console.error(error);
        sendJson(res, 500, { ok: false, error: error.message || "Error del servidor." });
    }
});

ensureDb();
server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error("El puerto " + port + " ya esta ocupado. Si Huellitas ya esta abierto, usa http://localhost:" + port + ". Si no, cierra la otra ventana del servidor e intenta de nuevo.");
        process.exit(1);
        return;
    }

    console.error(error);
    process.exit(1);
});

server.listen(port, () => {
    console.log("Huellitas listo en http://localhost:" + port);
});
