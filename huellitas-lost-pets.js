/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const storageKey = "huellitasMascotasPerdidas";
    const styleId = "huellitasLostPetsStyles";
    const activeStates = ["Reportada", "En busqueda", "Encontrada"];
    const allStates = ["Reportada", "En busqueda", "Encontrada", "Reunida", "Archivada"];

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeText(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function slug(value) {
        return normalizeText(value).replace(/\s+/g, "-");
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

    function now() {
        return new Date().toLocaleString("es-MX");
    }

    function todayValue() {
        return new Date().toISOString().slice(0, 10);
    }

    function displayDate(value) {
        if (!value) {
            return now();
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const parts = value.split("-");
            return parts[2] + "/" + parts[1] + "/" + parts[0];
        }

        return value;
    }

    function defaultImage(type) {
        return normalizeText(type) === "gato" ? "assets/imagenes/1000107795.jpg" : "assets/imagenes/1000107801.jpg";
    }

    function normalizeLostPet(item, index) {
        const createdAt = item.createdAt || item.fechaRegistro || now();
        const state = item.estado || item.situacion || "Reportada";

        return Object.assign({}, item, {
            id: item.id || "lost-" + index + "-" + String(createdAt).replace(/\W/g, ""),
            nombre: item.nombre || item.mascota || "Mascota sin nombre",
            tipo: item.tipo || "Perro",
            estado: state === "En busqueda" || state === "En b&uacute;squeda" ? "En busqueda" : state,
            zona: item.zona || item.ubicacion || "Zona por confirmar",
            contacto: item.contacto || item.correo || item.telefono || "Sin contacto",
            descripcion: item.descripcion || item.mensaje || "",
            fecha: item.fecha || createdAt,
            createdAt: createdAt,
            imagen: item.imagen || item.foto || defaultImage(item.tipo),
            historial: Array.isArray(item.historial) && item.historial.length
                ? item.historial
                : [{ estado: state, fecha: createdAt }]
        });
    }

    function getLostPets() {
        return readJson(storageKey, []).map(normalizeLostPet);
    }

    function saveLostPets(items) {
        writeJson(storageKey, items.map(normalizeLostPet));
        window.dispatchEvent(new CustomEvent("huellitas:lostPetsChanged"));
    }

    function stateLabel(state) {
        return state === "En busqueda" ? "En busqueda" : state;
    }

    function stateClass(state) {
        return "status-" + slug(state || "Reportada");
    }

    function contactHref(contact) {
        const clean = String(contact || "").trim();

        if (clean.includes("@")) {
            return "mailto:" + clean.replace(/\s/g, "");
        }

        return "tel:" + clean.replace(/[^\d+]/g, "");
    }

    function fileToDataUrl(file) {
        return new Promise((resolve) => {
            if (!file) {
                resolve("");
                return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
        });
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.lost-pets-hero{--hero-image:url("assets/imagenes/mascotas.jpg")}
.lost-pets-layout{align-items:start}
.lost-pets-guide .tip-list{margin-top:12px}
.lost-pets-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:16px}
.lost-pet-card{display:grid;grid-template-rows:auto 1fr;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.9);overflow:hidden;box-shadow:0 14px 30px rgba(38,51,44,.1)}
.lost-pet-media{position:relative;aspect-ratio:4/3;background:#eef5eb;overflow:hidden}
.lost-pet-media img{width:100%;height:100%;object-fit:cover;display:block}
.lost-pet-media .status-badge{position:absolute;left:12px;top:12px}
.lost-pet-body{display:grid;gap:9px;padding:14px}
.lost-pet-body h2{margin:0;color:var(--cocoa);font-size:22px}
.lost-pet-body p{margin:0;color:var(--muted);font-weight:800;line-height:1.45}
.lost-pet-meta{display:flex;flex-wrap:wrap;gap:7px}
.lost-pet-meta span{padding:6px 9px;border-radius:999px;background:rgba(207,231,244,.42);color:var(--cocoa);font-size:12px;font-weight:900}
.lost-pet-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.lost-pet-actions .button-link,.lost-pet-actions button{min-height:38px;padding:8px 12px}
.lost-admin-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0}
.lost-admin-summary article{padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(246,251,245,.78)}
.lost-admin-summary span{display:block;color:var(--muted);font-size:11px;font-weight:950;text-transform:uppercase}
.lost-admin-summary strong{display:block;margin-top:4px;color:var(--cocoa);font-size:24px}
.lost-pet-admin-item img{width:74px;height:74px;object-fit:cover;border-radius:14px;border:1px solid var(--line)}
.lost-pet-admin-item .status-actions{margin-top:10px}
body.dark .lost-pet-card,body.dark .lost-admin-summary article{background:rgba(255,255,255,.06);border-color:rgba(220,235,215,.14)}
body.dark .lost-pet-body h2,body.dark .lost-admin-summary strong{color:#f5fff7}
body.dark .lost-pet-meta span{background:rgba(255,255,255,.08);color:#f5fff7}
@media(max-width:720px){.lost-pets-grid{grid-template-columns:1fr}.lost-pet-card{border-radius:14px}.lost-pet-actions{display:grid}.lost-pet-actions .button-link,.lost-pet-actions button{width:100%}.lost-pet-admin-item{grid-template-columns:1fr!important}.lost-pet-admin-item img{width:100%;height:160px}}
        `;
        document.head.appendChild(style);
    }

    function ensureNavLink() {
        const isLostPage = location.pathname.toLowerCase().includes("mascotas_perdidas");

        document.querySelectorAll(".nav-links").forEach((nav) => {
            let link = nav.querySelector('a[href="mascotas_perdidas.html"]');

            if (!link) {
                link = document.createElement("a");
                link.className = "nav-link";
                link.href = "mascotas_perdidas.html";
                link.textContent = "Perdidas";

                const adoptionLink = nav.querySelector('a[href="adopcion_huellitas.html"]');
                if (adoptionLink) {
                    nav.insertBefore(link, adoptionLink);
                } else {
                    nav.appendChild(link);
                }
            }

            if (isLostPage) {
                nav.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
                link.classList.add("active");
            }
        });
    }

    function postLostPetToReports(item) {
        if (!window.huellitasApi || !window.huellitasApi.enabled || typeof window.huellitasApi.request !== "function") {
            return;
        }

        window.huellitasApi.request("/api/reports", {
            method: "POST",
            body: JSON.stringify({
                id: item.id,
                tipo: "Mascota perdida",
                pagina: item.zona,
                contacto: item.contacto,
                mensaje: item.nombre + " - " + item.tipo + ". " + item.descripcion,
                estado: item.estado === "Reunida" ? "Atendido" : "Recibido",
                fecha: item.createdAt,
                lostPet: item
            })
        }).catch(() => {});
    }

    function publicCard(item) {
        const contact = contactHref(item.contacto);

        return [
            '<article class="lost-pet-card" data-lost-card data-search="' + escapeHtml(normalizeText([item.nombre, item.tipo, item.estado, item.zona, item.contacto, item.descripcion].join(" "))) + '" data-status="' + escapeHtml(item.estado) + '" data-type="' + escapeHtml(item.tipo) + '">',
            '<div class="lost-pet-media">',
            '<img src="' + escapeHtml(item.imagen || defaultImage(item.tipo)) + '" alt="Aviso de ' + escapeHtml(item.nombre) + '">',
            '<span class="status-badge ' + stateClass(item.estado) + '">' + escapeHtml(stateLabel(item.estado)) + '</span>',
            '</div>',
            '<div class="lost-pet-body">',
            '<span class="eyebrow">' + escapeHtml(item.tipo) + '</span>',
            '<h2>' + escapeHtml(item.nombre) + '</h2>',
            '<p>' + escapeHtml(item.descripcion || "Sin detalles adicionales.") + '</p>',
            '<div class="lost-pet-meta">',
            '<span>' + escapeHtml(item.zona) + '</span>',
            '<span>' + escapeHtml(displayDate(item.fecha)) + '</span>',
            '</div>',
            '<div class="lost-pet-actions">',
            '<a class="button-link" href="' + escapeHtml(contact) + '">Contactar</a>',
            '<a class="button-link secondary" href="directorio.html">Ver apoyo</a>',
            '</div>',
            '</div>',
            '</article>'
        ].join("");
    }

    function renderPublicList() {
        const target = document.getElementById("lostPetsList");
        const search = normalizeText((document.getElementById("lostPetSearch") || {}).value || "");
        const status = (document.getElementById("lostPetStatusFilter") || {}).value || "";
        const type = (document.getElementById("lostPetTypeFilter") || {}).value || "";
        const pets = getLostPets();

        if (!target) {
            return;
        }

        if (!pets.length) {
            target.innerHTML = '<div class="empty-state"><strong>Aun no hay avisos.</strong><span>Cuando se publique una mascota perdida o encontrada aparecera aqui.</span><a class="empty-action" href="#lostPetForm">Reportar mascota</a></div>';
            return;
        }

        const filtered = pets.filter((item) => {
            const text = normalizeText([item.nombre, item.tipo, item.estado, item.zona, item.contacto, item.descripcion].join(" "));
            return (!search || text.includes(search))
                && (!status || item.estado === status)
                && (!type || item.tipo === type);
        });

        target.innerHTML = filtered.length
            ? filtered.map(publicCard).join("")
            : '<div class="empty-state"><strong>No encontramos coincidencias.</strong><span>Prueba con otra zona, nombre o estado.</span></div>';
    }

    async function handlePublicSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const feedback = document.getElementById("lostPetFeedback");
        const file = document.getElementById("lostPetPhoto").files[0];
        const image = await fileToDataUrl(file);
        const name = document.getElementById("lostPetName").value.trim();
        const type = document.getElementById("lostPetType").value;
        const state = document.getElementById("lostPetSituation").value;
        const zone = document.getElementById("lostPetZone").value.trim();
        const contact = document.getElementById("lostPetContact").value.trim();
        const description = document.getElementById("lostPetDescription").value.trim();

        if (!name || !zone || !contact || description.length < 8) {
            if (feedback) {
                feedback.className = "form-note error";
                feedback.textContent = "Completa nombre, zona, contacto y detalles para publicar el aviso.";
            }
            return;
        }

        const item = normalizeLostPet({
            id: "lost-" + Date.now(),
            nombre: name,
            tipo: type,
            estado: state,
            zona: zone,
            contacto: contact,
            descripcion: description,
            fecha: document.getElementById("lostPetDate").value || todayValue(),
            createdAt: now(),
            imagen: image || defaultImage(type),
            historial: [{ estado: state, fecha: now() }]
        });
        const pets = getLostPets();

        pets.unshift(item);
        saveLostPets(pets);
        postLostPetToReports(item);
        form.reset();
        const dateInput = document.getElementById("lostPetDate");
        if (dateInput) {
            dateInput.value = todayValue();
        }

        if (feedback) {
            feedback.className = "form-note success";
            feedback.textContent = "Aviso publicado. El panel admin ya puede darle seguimiento.";
        }

        renderPublicList();
        updateAdminLostPanel();
    }

    function initPublicPage() {
        const form = document.getElementById("lostPetForm");
        const dateInput = document.getElementById("lostPetDate");

        if (dateInput && !dateInput.value) {
            dateInput.value = todayValue();
        }

        if (form && form.dataset.lostReady !== "true") {
            form.dataset.lostReady = "true";
            form.addEventListener("submit", handlePublicSubmit);
        }

        ["lostPetSearch", "lostPetStatusFilter", "lostPetTypeFilter"].forEach((id) => {
            const control = document.getElementById(id);
            if (control && control.dataset.lostReady !== "true") {
                control.dataset.lostReady = "true";
                control.addEventListener("input", renderPublicList);
                control.addEventListener("change", renderPublicList);
            }
        });

        const clear = document.getElementById("lostPetClearFilters");
        if (clear && clear.dataset.lostReady !== "true") {
            clear.dataset.lostReady = "true";
            clear.addEventListener("click", () => {
                ["lostPetSearch", "lostPetStatusFilter", "lostPetTypeFilter"].forEach((id) => {
                    const control = document.getElementById(id);
                    if (control) {
                        control.value = "";
                    }
                });
                renderPublicList();
            });
        }

        renderPublicList();
    }

    function isAdminActive() {
        return sessionStorage.getItem("huellitasAdminActivo") === "true";
    }

    function callAdminToast(title, message) {
        if (typeof window.mostrarAdminToast === "function") {
            window.mostrarAdminToast(title, message);
        }
    }

    function canUseAdmin() {
        if (typeof window.requiereAdmin === "function") {
            return window.requiereAdmin();
        }

        return isAdminActive();
    }

    function ensureAdminButton() {
        const bar = document.querySelector(".admin-filter-bar");

        if (!bar || bar.querySelector('[data-admin-filter="perdidas"]')) {
            return;
        }

        const button = document.createElement("button");
        button.className = "filter-button";
        button.type = "button";
        button.dataset.adminFilter = "perdidas";
        button.textContent = "Perdidas";
        button.addEventListener("click", () => {
            if (typeof window.filtrarAdmin === "function") {
                window.filtrarAdmin("perdidas");
            } else {
                document.querySelectorAll("[data-admin-section]").forEach((section) => {
                    section.hidden = section.dataset.adminSection !== "perdidas";
                });
            }
        });

        const reportsButton = bar.querySelector('[data-admin-filter="reportes"]');
        if (reportsButton) {
            bar.insertBefore(button, reportsButton);
        } else {
            bar.appendChild(button);
        }
    }

    function ensureAdminKpi() {
        const dashboard = document.querySelector(".admin-dashboard");

        if (!dashboard || document.getElementById("adminLostPets")) {
            return;
        }

        const card = document.createElement("article");
        card.className = "impact-card";
        card.innerHTML = [
            '<span>Mascotas perdidas</span>',
            '<strong id="adminLostPets">0</strong>',
            '<p>Casos activos o encontrados.</p>'
        ].join("");
        dashboard.appendChild(card);
    }

    function ensureAdminProOption() {
        const select = document.getElementById("adminProSection");

        if (!select || select.querySelector('option[value="perdidas"]')) {
            return;
        }

        const option = document.createElement("option");
        option.value = "perdidas";
        option.textContent = "Perdidas";

        const reports = select.querySelector('option[value="reportes"]');
        if (reports) {
            select.insertBefore(option, reports);
        } else {
            select.appendChild(option);
        }
    }

    function keepCurrentAdminFilter() {
        if (!isAdminActive()) {
            return;
        }

        const activeButton = document.querySelector("[data-admin-filter].active");
        const filter = activeButton ? activeButton.dataset.adminFilter : "";

        if (filter && typeof window.filtrarAdmin === "function") {
            window.filtrarAdmin(filter);
        }
    }

    function ensureAdminSection() {
        if (!document.querySelector(".admin-overview-section") || document.querySelector('[data-admin-section="perdidas"]')) {
            return;
        }

        const section = document.createElement("section");
        section.className = "section admin-section admin-protected";
        section.dataset.adminSection = "perdidas";
        section.hidden = true;
        section.innerHTML = [
            '<div class="team-panel feature-panel">',
            '<div class="status-line">',
            '<div>',
            '<h2>Mascotas perdidas</h2>',
            '<p>Da seguimiento a avisos publicados por la comunidad y actualiza su estado.</p>',
            '</div>',
            '<a class="button-link secondary" href="mascotas_perdidas.html">Ver seccion publica</a>',
            '</div>',
            '<div class="lost-admin-summary" id="lostPetsAdminSummary"></div>',
            '<div class="saved-list" id="lostPetsAdminList"></div>',
            '<div class="section-actions">',
            '<button type="button" onclick="cargarMascotasPerdidasAdmin()">Actualizar casos</button>',
            '<button class="secondary" type="button" onclick="crearMascotaPerdidaDemo()">Agregar caso demo</button>',
            '</div>',
            '</div>'
        ].join("");

        const reportsSection = document.querySelector('[data-admin-section="reportes"]');
        if (reportsSection) {
            reportsSection.insertAdjacentElement("beforebegin", section);
        } else {
            document.querySelector(".admin-overview-section").insertAdjacentElement("afterend", section);
        }
    }

    function renderAdminSummary(pets) {
        const summary = document.getElementById("lostPetsAdminSummary");
        const kpi = document.getElementById("adminLostPets");
        const activeCount = pets.filter((item) => activeStates.includes(item.estado)).length;
        const foundCount = pets.filter((item) => item.estado === "Encontrada").length;
        const reunitedCount = pets.filter((item) => item.estado === "Reunida").length;

        if (kpi) {
            kpi.textContent = activeCount;
        }

        if (!summary) {
            return;
        }

        summary.innerHTML = [
            ["Activos", activeCount],
            ["Encontradas", foundCount],
            ["Reunidas", reunitedCount]
        ].map((item) => '<article><span>' + item[0] + '</span><strong>' + item[1] + '</strong></article>').join("");
    }

    function adminActions(item) {
        return allStates.map((state) => {
            const active = item.estado === state ? " active" : "";
            return '<button class="status-action' + active + '" type="button" onclick="cambiarEstadoMascotaPerdida(\'' + item.id + '\', \'' + state + '\')">' + escapeHtml(stateLabel(state)) + '</button>';
        }).join("") + '<button class="status-action danger" type="button" onclick="eliminarMascotaPerdida(\'' + item.id + '\')">Eliminar</button>';
    }

    function renderAdminList() {
        const target = document.getElementById("lostPetsAdminList");
        const pets = getLostPets();

        renderAdminSummary(pets);

        if (!target) {
            return;
        }

        if (!pets.length) {
            target.innerHTML = '<div class="empty-state"><strong>No hay avisos de mascotas perdidas.</strong><span>Los reportes publicados apareceran aqui.</span><a class="empty-action" href="mascotas_perdidas.html#lostPetForm">Crear aviso</a></div>';
            return;
        }

        target.innerHTML = pets.map((item) => {
            return [
                '<article class="saved-item lost-pet-admin-item">',
                '<img src="' + escapeHtml(item.imagen || defaultImage(item.tipo)) + '" alt="Foto de ' + escapeHtml(item.nombre) + '">',
                '<div>',
                '<div class="status-line">',
                '<strong>' + escapeHtml(item.nombre) + ' - ' + escapeHtml(item.tipo) + '</strong>',
                '<span class="status-badge ' + stateClass(item.estado) + '">' + escapeHtml(stateLabel(item.estado)) + '</span>',
                '</div>',
                '<span>Zona: ' + escapeHtml(item.zona) + '</span>',
                '<span>Contacto: ' + escapeHtml(item.contacto) + '</span>',
                '<span>Fecha: ' + escapeHtml(displayDate(item.fecha)) + '</span>',
                '<span>Detalles: ' + escapeHtml(item.descripcion) + '</span>',
                '<div class="status-actions">' + adminActions(item) + '</div>',
                '</div>',
                '</article>'
            ].join("");
        }).join("");
    }

    function updateAdminLostPanel() {
        ensureAdminButton();
        ensureAdminKpi();
        ensureAdminSection();
        ensureAdminProOption();
        renderAdminList();
        keepCurrentAdminFilter();
    }

    function changeLostPetState(id, state) {
        if (!canUseAdmin()) {
            return;
        }

        let changed = false;
        const pets = getLostPets().map((item) => {
            if (item.id !== id || item.estado === state) {
                return item;
            }

            changed = true;
            return Object.assign({}, item, {
                estado: state,
                actualizado: now(),
                historial: (item.historial || []).concat([{ estado: state, fecha: now() }])
            });
        });

        if (!changed) {
            callAdminToast("Sin cambios", "El caso ya tenia ese estado.");
            return;
        }

        saveLostPets(pets);
        renderPublicList();
        renderAdminList();
        callAdminToast("Mascota perdida actualizada", "El caso quedo como " + stateLabel(state) + ".");

        const reportState = state === "Reunida" || state === "Archivada" ? "Atendido" : (state === "En busqueda" ? "En revision" : "Recibido");
        if (window.huellitasApi && window.huellitasApi.enabled) {
            window.huellitasApi.request("/api/reports/status", {
                method: "POST",
                body: JSON.stringify({ id: id, estado: reportState })
            }).catch(() => {});
        }
    }

    async function deleteLostPet(id) {
        if (!canUseAdmin()) {
            return;
        }

        let ok = true;
        if (typeof window.confirmarAccion === "function") {
            ok = await window.confirmarAccion({
                titulo: "Eliminar aviso",
                mensaje: "El aviso se quitara de mascotas perdidas. Esta accion no borra solicitudes ni adopciones.",
                confirmar: "Eliminar",
                peligro: true
            });
        } else {
            ok = window.confirm("Eliminar aviso de mascota perdida?");
        }

        if (!ok) {
            return;
        }

        saveLostPets(getLostPets().filter((item) => item.id !== id));
        renderPublicList();
        renderAdminList();
        callAdminToast("Aviso eliminado", "El caso fue retirado de la lista.");
    }

    function createDemoLostPet() {
        if (!canUseAdmin()) {
            return;
        }

        const item = normalizeLostPet({
            id: "demo-lost-" + Date.now(),
            nombre: "Toby",
            tipo: "Perro",
            estado: "Reportada",
            zona: "Parque central de Tultitlan",
            contacto: "equipo@huellitas.local",
            descripcion: "Perrito cafe con collar azul. Es tranquilo y responde a su nombre.",
            fecha: todayValue(),
            createdAt: now(),
            imagen: "assets/imagenes/1000107804.jpg",
            historial: [{ estado: "Reportada", fecha: now() }]
        });
        const pets = getLostPets();

        pets.unshift(item);
        saveLostPets(pets);
        postLostPetToReports(item);
        renderAdminList();
        renderPublicList();
        callAdminToast("Caso demo agregado", "Toby aparece en mascotas perdidas.");
    }

    function wrapAdminRefresh() {
        if (typeof window.actualizarTodoAdmin !== "function" || window.actualizarTodoAdmin.lostPetsWrapped) {
            return;
        }

        const original = window.actualizarTodoAdmin;
        window.actualizarTodoAdmin = async function () {
            const result = await original.apply(this, arguments);
            updateAdminLostPanel();
            return result;
        };
        window.actualizarTodoAdmin.lostPetsWrapped = true;
    }

    window.cargarMascotasPerdidasAdmin = renderAdminList;
    window.cambiarEstadoMascotaPerdida = changeLostPetState;
    window.eliminarMascotaPerdida = deleteLostPet;
    window.crearMascotaPerdidaDemo = createDemoLostPet;
    window.huellitasLostPetsRefresh = function () {
        renderPublicList();
        updateAdminLostPanel();
    };

    onReady(() => {
        injectStyles();
        ensureNavLink();
        initPublicPage();
        updateAdminLostPanel();
        wrapAdminRefresh();

        window.addEventListener("huellitas:lostPetsChanged", () => {
            renderPublicList();
            renderAdminList();
        });
        window.addEventListener("storage", (event) => {
            if (event.key === storageKey) {
                renderPublicList();
                renderAdminList();
            }
        });
        window.setTimeout(updateAdminLostPanel, 500);
        window.setTimeout(updateAdminLostPanel, 1600);
    });
})();
