/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Correcciones puntuales para entrega: sincronizacion y estabilidad visual.
 */
(function () {
    const styleId = "huellitasCriticalFixesStyles";
    const knownAdoptionsKey = "huellitasSolicitudesServidorIds";
    const knownReportsKey = "huellitasReportesServidorIds";
    let syncActive = false;
    let lostWrapperReady = false;
    let lastServerSync = 0;

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
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

    function normalizeText(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function mergeById(localItems, serverItems) {
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

    function ids(items) {
        return (Array.isArray(items) ? items : [])
            .map((item) => item && item.id)
            .filter(Boolean);
    }

    function isDemoItem(item) {
        const id = String(item && item.id || "");
        return id.indexOf("demo-") === 0 || item && item.demo === true;
    }

    function apiEnabled() {
        return Boolean(window.huellitasApi && window.huellitasApi.enabled && typeof window.huellitasApi.request === "function");
    }

    async function apiRequest(path, options) {
        if (!apiEnabled()) {
            return null;
        }

        try {
            return await window.huellitasApi.request(path, options);
        } catch (error) {
            console.warn(error.message);
            return null;
        }
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.featured-pets-section .section-title{max-width:980px;margin-left:auto;margin-right:auto}
.featured-pets-grid.featured-carousel{width:min(100%,980px)!important;max-width:980px!important;min-height:0!important;margin-inline:auto!important;overflow:hidden!important;border-radius:16px!important}
.featured-pets-grid.featured-carousel .featured-pet{grid-template-columns:minmax(290px,.9fr) minmax(320px,1fr)!important;min-height:360px!important;align-items:stretch!important}
.featured-pets-grid.featured-carousel .featured-pet.active{display:grid!important}
.featured-pets-grid.featured-carousel .featured-pet img{height:360px!important;min-height:0!important;max-height:360px!important;object-fit:cover!important}
.featured-pets-grid.featured-carousel .featured-pet>div{min-width:0!important;min-height:360px!important;padding:24px!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important}
.featured-pets-grid.featured-carousel .featured-pet h3{overflow-wrap:anywhere!important;word-break:normal!important}
.featured-pets-grid.featured-carousel .featured-pet p{max-height:4.5em!important;overflow:hidden!important}
.featured-carousel-controls{width:min(100%,980px)!important}
.adoption-gallery-grid{align-items:stretch!important}
.adoption-pet-card{min-width:0!important;height:100%!important;display:grid!important;grid-template-rows:auto 1fr!important;overflow:hidden!important}
.adoption-pet-media{aspect-ratio:4/3!important;min-height:0!important;overflow:hidden!important}
.adoption-pet-media img{width:100%!important;height:100%!important;object-fit:cover!important}
.adoption-pet-content{min-width:0!important;display:grid!important;align-content:start!important;gap:10px!important}
.adoption-pet-content h2{overflow-wrap:anywhere!important;word-break:normal!important;line-height:1.12!important}
.adoption-pet-content p,.lost-pet-body p{display:-webkit-box!important;-webkit-line-clamp:4!important;-webkit-box-orient:vertical!important;overflow:hidden!important;overflow-wrap:anywhere!important}
.pet-traits{min-width:0!important;overflow:hidden!important}
.pet-traits span{max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
.lost-pet-card,.lost-pet-admin-item,.pet-admin-item{min-width:0!important;overflow:hidden!important}
.lost-pet-body h2,.lost-pet-admin-item strong,.pet-admin-item strong{overflow-wrap:anywhere!important}
.lost-pet-admin-item span,.pet-admin-item span{overflow-wrap:anywhere!important}
@media(min-width:721px){
    .adoption-gallery-grid{grid-template-columns:repeat(auto-fit,minmax(270px,1fr))!important}
    .extra-pet-card .adoption-pet-content{grid-template-rows:auto auto minmax(72px,auto) auto auto!important}
}
@media(max-width:720px){
    .featured-pets-grid.featured-carousel{width:100%!important;min-height:468px!important}
    .featured-pets-grid.featured-carousel .featured-pet{grid-template-columns:1fr!important;grid-template-rows:210px minmax(238px,1fr)!important;min-height:456px!important}
    .featured-pets-grid.featured-carousel .featured-pet img{height:210px!important;max-height:210px!important}
    .featured-pets-grid.featured-carousel .featured-pet>div{min-height:0!important;padding:14px!important}
    .adoption-pet-content p,.lost-pet-body p{-webkit-line-clamp:3!important}
}
        `;
        document.head.appendChild(style);
    }

    function dispatchDataEvents() {
        [
            "huellitas:adoptionsChanged",
            "huellitas:reportsChanged",
            "huellitas:petsChanged",
            "huellitas:lostPetsChanged"
        ].forEach((eventName) => window.dispatchEvent(new CustomEvent(eventName)));
    }

    function reportStateForLostPet(item) {
        const state = item && item.estado;

        if (state === "Reunida" || state === "Archivada") {
            return "Atendido";
        }

        if (state === "Pendiente" || state === "En busqueda") {
            return "En revision";
        }

        return "Recibido";
    }

    function lostPetFromReport(report) {
        if (!report) {
            return null;
        }

        const source = report.lostPet || {};
        const typeText = normalizeText(report.tipo);
        if (!report.lostPet && !typeText.includes("mascota perdida")) {
            return null;
        }

        const reportState = report.estado || "En revision";
        const state = source.estado || (reportState === "Atendido" ? "Reunida" : (reportState === "En revision" ? "Pendiente" : "Reportada"));

        return Object.assign({}, source, {
            id: source.id || report.id,
            nombre: source.nombre || source.mascota || "Mascota reportada",
            tipo: source.tipo || "Perro",
            estado: state,
            estadoSolicitado: source.estadoSolicitado || state,
            pendienteAdmin: state === "Pendiente",
            zona: source.zona || report.pagina || report.ubicacion || "Zona por confirmar",
            contacto: source.contacto || report.contacto || report.correo || "Sin contacto",
            descripcion: source.descripcion || report.mensaje || "Reporte recibido desde Huellitas.",
            fecha: source.fecha || report.fecha,
            createdAt: source.createdAt || report.fecha,
            imagen: source.imagen || source.foto || (normalizeText(source.tipo) === "gato" ? "assets/imagenes/1000107795.jpg" : "assets/imagenes/1000107801.jpg"),
            historial: Array.isArray(source.historial) && source.historial.length
                ? source.historial
                : [{ estado: state, fecha: report.fecha || new Date().toLocaleString("es-MX") }]
        });
    }

    async function postCollection(path, item) {
        return await apiRequest(path, {
            method: "POST",
            body: JSON.stringify(item)
        });
    }

    async function syncLocalCollection(key, knownKey, serverItems, path) {
        const localItems = readJson(key, []);
        const serverIdSet = new Set(ids(serverItems));
        const remembered = new Set(readJson(knownKey, []));
        const pending = localItems.filter((item) => item && item.id && !serverIdSet.has(item.id) && !remembered.has(item.id) && !isDemoItem(item));

        writeJson(knownKey, Array.from(new Set([...remembered, ...serverIdSet])));

        for (const item of pending) {
            const result = await postCollection(path, item);
            if (result && result.ok !== false) {
                serverIdSet.add(item.id);
            }
        }

        writeJson(knownKey, Array.from(new Set([...remembered, ...serverIdSet])));
        writeJson(key, mergeById(localItems, serverItems));
    }

    function mergeLostPetsFromReports(reports) {
        const serverLostPets = (Array.isArray(reports) ? reports : [])
            .map(lostPetFromReport)
            .filter(Boolean);

        if (!serverLostPets.length) {
            return;
        }

        writeJson("huellitasMascotasPerdidas", mergeById(readJson("huellitasMascotasPerdidas", []), serverLostPets));
    }

    async function syncServerData() {
        const nowTime = Date.now();

        if (syncActive || !apiEnabled() || nowTime - lastServerSync < 4500) {
            return;
        }

        syncActive = true;
        lastServerSync = nowTime;

        try {
            const data = await apiRequest("/api/team-data");
            if (!data) {
                return;
            }

            await syncLocalCollection("huellitasSolicitudesAdopcion", knownAdoptionsKey, data.adoptions || [], "/api/adoptions");
            await syncLocalCollection("huellitasReportes", knownReportsKey, data.reports || [], "/api/reports");

            if (Array.isArray(data.pets)) {
                writeJson("huellitasMascotasExtra", mergeById(readJson("huellitasMascotasExtra", []), data.pets));
            }

            mergeLostPetsFromReports(data.reports || []);
            dispatchDataEvents();
        } finally {
            syncActive = false;
        }
    }

    async function postLostPetToServer(item) {
        if (!item || !item.id) {
            return;
        }

        await postCollection("/api/reports", {
            id: item.id,
            tipo: "Mascota perdida",
            pagina: item.zona,
            contacto: item.contacto,
            mensaje: item.nombre + " - " + item.tipo + ". " + (item.descripcion || ""),
            estado: reportStateForLostPet(item),
            fecha: item.createdAt || item.fecha || new Date().toLocaleString("es-MX"),
            lostPet: item
        });
    }

    function wrapLostPetAdminActions() {
        if (lostWrapperReady || typeof window.cambiarEstadoMascotaPerdida !== "function") {
            return;
        }

        const originalChange = window.cambiarEstadoMascotaPerdida;
        window.cambiarEstadoMascotaPerdida = function (id, state) {
            const result = originalChange.apply(this, arguments);
            window.setTimeout(() => {
                const item = readJson("huellitasMascotasPerdidas", []).find((pet) => pet && pet.id === id);
                if (item) {
                    postLostPetToServer(Object.assign({}, item, { estado: state }));
                }
            }, 250);
            return result;
        };

        lostWrapperReady = true;
    }

    function init() {
        injectStyles();
        wrapLostPetAdminActions();
        window.setTimeout(wrapLostPetAdminActions, 700);
        window.setTimeout(syncServerData, 900);
        window.setTimeout(syncServerData, 2600);

        ["huellitas:adoptionsChanged", "huellitas:reportsChanged", "huellitas:lostPetsChanged", "huellitas:petsChanged"].forEach((eventName) => {
            window.addEventListener(eventName, () => window.setTimeout(syncServerData, 900));
        });
    }

    onReady(init);
    window.addEventListener("load", init);
})();
