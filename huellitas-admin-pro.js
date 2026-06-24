/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const styleId = "huellitasAdminProStyles";
    const activityKey = "huellitasAdminActividad";
    const notesKey = "huellitasAdminNotas";
    const petsKey = "huellitasMascotasExtra";
    const requestsKey = "huellitasSolicitudesAdopcion";
    const reportsKey = "huellitasReportes";
    const mailboxKey = "huellitasBuzon";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function isAdminPage() {
        return Boolean(document.getElementById("adminGate") && document.querySelector(".admin-dashboard"));
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

    function now() {
        return new Date().toLocaleString("es-MX");
    }

    function recordActivity(action, section, detail) {
        const list = readJson(activityKey, []);
        list.unshift({
            id: "act-" + Date.now(),
            action: action,
            section: section,
            detail: detail || "",
            fecha: now()
        });
        writeJson(activityKey, list.slice(0, 40));
        renderActivity();
        updateKpis();
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.admin-pro-shell{display:grid;gap:14px;margin:18px 0 4px}
.admin-pro-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}
.admin-pro-kpi{min-width:0;padding:12px;border:1px solid var(--line);border-radius:12px;background:rgba(246,251,245,.82)}
.admin-pro-kpi span{display:block;color:var(--muted);font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.02em}
.admin-pro-kpi strong{display:block;margin-top:4px;color:var(--cocoa);font-size:24px;line-height:1}
.admin-pro-console{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:12px}
.admin-pro-tools,.admin-pro-activity{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.82);padding:12px}
.admin-pro-tools{display:grid;grid-template-columns:minmax(190px,1fr) repeat(3,minmax(130px,.55fr));gap:10px;align-items:end}
.admin-pro-tools label{display:grid;gap:6px;color:var(--cocoa);font-size:12px;font-weight:950}
.admin-pro-tools input,.admin-pro-tools select{width:100%;min-height:42px;border:1px solid var(--line);border-radius:12px;padding:8px 10px;background:#fff;color:var(--text)}
.admin-pro-activity h3{margin:0 0 10px;color:var(--cocoa);font-size:18px}
.admin-pro-activity-list{display:grid;gap:8px;max-height:255px;overflow:auto;padding-right:2px}
.admin-pro-activity-item{display:grid;gap:2px;padding:9px;border:1px solid var(--line);border-radius:12px;background:rgba(207,231,244,.18)}
.admin-pro-activity-item strong{color:var(--cocoa);font-size:13px}
.admin-pro-activity-item span{color:var(--muted);font-size:12px;font-weight:800}
.admin-pro-extra-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.admin-pro-extra-actions button,.admin-pro-note button{min-height:36px;margin:0;padding:7px 10px;border-radius:10px;font-size:12px}
.admin-pro-note{display:grid;gap:8px;margin-top:10px;padding:10px;border:1px dashed rgba(95,157,99,.34);border-radius:12px;background:rgba(246,251,245,.55)}
.admin-pro-note textarea{width:100%;min-height:68px;resize:vertical;border:1px solid var(--line);border-radius:12px;padding:9px 10px;background:#fff;color:var(--text)}
.admin-pro-note small{color:var(--muted);font-weight:800}
.admin-pro-filter-hidden{display:none!important}
.admin-pro-manual{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:14px}
.admin-pro-manual article{padding:12px;border:1px solid var(--line);border-radius:12px;background:rgba(246,251,245,.76)}
.admin-pro-manual strong{display:block;color:var(--cocoa);margin-bottom:4px}
.admin-pro-manual span{display:block;color:var(--muted);font-size:13px;font-weight:800;line-height:1.35}
body.dark .admin-pro-kpi,body.dark .admin-pro-tools,body.dark .admin-pro-activity,body.dark .admin-pro-note,body.dark .admin-pro-manual article{background:rgba(255,255,255,.06);border-color:rgba(220,235,215,.14)}
body.dark .admin-pro-kpi strong,body.dark .admin-pro-tools label,body.dark .admin-pro-activity h3,body.dark .admin-pro-activity-item strong,body.dark .admin-pro-manual strong{color:#f5fff7}
body.dark .admin-pro-tools input,body.dark .admin-pro-tools select,body.dark .admin-pro-note textarea{background:#17211b;color:#f5fff7;border-color:rgba(220,235,215,.18)}
body.dark .admin-pro-activity-item{background:rgba(255,255,255,.05);border-color:rgba(220,235,215,.12)}
@media(max-width:760px){.admin-pro-console,.admin-pro-tools{grid-template-columns:1fr}.admin-pro-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-pro-shell{margin-top:14px}.admin-pro-tools,.admin-pro-activity{padding:10px}.admin-pro-extra-actions{display:grid;grid-template-columns:1fr 1fr}.admin-pro-extra-actions button{width:100%}}
@media(max-width:390px){.admin-pro-kpis,.admin-pro-extra-actions{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function requestList() {
        return readJson(requestsKey, []);
    }

    function petList() {
        return readJson(petsKey, []);
    }

    function reportList() {
        return readJson(reportsKey, []);
    }

    function mailboxList() {
        return readJson(mailboxKey, []);
    }

    function appointmentList() {
        return requestList().filter((request) => request && request.cita && request.cita.fecha);
    }

    function scoreList() {
        return readJson("huellitasPuntajesJuego", []);
    }

    function updateKpis() {
        const target = document.getElementById("adminProKpis");
        if (!target) {
            return;
        }

        const requests = requestList();
        const pets = petList();
        const reports = reportList();
        const mailbox = mailboxList();
        const scores = scoreList();
        const newRequests = requests.filter((item) => ["", "nueva", "enviada"].includes(normalizeText(item.estado || "enviada"))).length;
        const availablePets = pets.filter((item) => normalizeText(item.estado || "disponible") !== "adoptada").length;
        const adoptedPets = pets.filter((item) => normalizeText(item.estado) === "adoptada").length;
        const pendingAppointments = appointmentList().filter((item) => !["finalizada", "completada"].includes(normalizeText(item.estado))).length;
        const reviewReports = reports.filter((item) => normalizeText(item.estado).includes("revision")).length;
        const newMessages = mailbox.filter((item) => item.from !== "admin" && item.readByAdmin !== true && normalizeText(item.estadoAdmin) !== "archivado").length;
        const bestScore = scores.reduce((max, item) => Math.max(max, Number(item.mejorPuntaje || 0)), 0);
        const metrics = [
            ["Solicitudes nuevas", newRequests],
            ["Mascotas disponibles", availablePets],
            ["Mascotas adoptadas", adoptedPets],
            ["Citas pendientes", pendingAppointments],
            ["Reportes en revision", reviewReports],
            ["Mensajes nuevos", newMessages],
            ["Mejor puntaje", bestScore]
        ];

        target.innerHTML = metrics.map((metric) => {
            return '<article class="admin-pro-kpi"><span>' + escapeHtml(metric[0]) + '</span><strong>' + escapeHtml(metric[1]) + '</strong></article>';
        }).join("");
    }

    function buildShell() {
        if (document.getElementById("adminProShell")) {
            return;
        }

        const dashboard = document.querySelector(".admin-overview-section .admin-dashboard");
        if (!dashboard) {
            return;
        }

        const shell = document.createElement("div");
        shell.className = "admin-pro-shell";
        shell.id = "adminProShell";
        shell.innerHTML = [
            '<div class="admin-pro-kpis" id="adminProKpis"></div>',
            '<div class="admin-pro-console">',
            '<div class="admin-pro-tools" aria-label="Herramientas admin">',
            '<label>Buscar<input id="adminProSearch" type="search" placeholder="Nombre, mascota, correo o texto"></label>',
            '<label>Estado<select id="adminProStatus"><option value="">Todos</option><option value="enviada">Nueva</option><option value="revisando">En revision</option><option value="aprobada">Aprobada</option><option value="rechazada">Rechazada</option><option value="cita">Cita</option><option value="finalizada">Finalizada</option><option value="disponible">Disponible</option><option value="adoptada">Adoptada</option><option value="archivado">Archivado</option></select></label>',
            '<label>Tipo<select id="adminProType"><option value="">Todos</option><option value="perro">Perro</option><option value="gato">Gato</option><option value="reporte">Reporte</option><option value="mensaje">Mensaje</option></select></label>',
            '<label>Seccion<select id="adminProSection"><option value="">Vista actual</option><option value="todo">Todo</option><option value="mascotas">Mascotas</option><option value="solicitudes">Solicitudes</option><option value="citas">Citas</option><option value="reportes">Reportes</option><option value="mensajes">Mensajes</option><option value="centros">Centros</option><option value="puntajes">Puntajes</option><option value="manual">Manual</option></select></label>',
            '</div>',
            '<aside class="admin-pro-activity"><h3>Actividad reciente</h3><div class="admin-pro-activity-list" id="adminProActivity"></div></aside>',
            '</div>'
        ].join("");

        dashboard.insertAdjacentElement("afterend", shell);

        ["adminProSearch", "adminProStatus", "adminProType"].forEach((id) => {
            const control = document.getElementById(id);
            if (control) {
                control.addEventListener("input", applyFilters);
                control.addEventListener("change", applyFilters);
            }
        });

        const sectionControl = document.getElementById("adminProSection");
        if (sectionControl) {
            sectionControl.addEventListener("change", () => {
                if (sectionControl.value && typeof window.filtrarAdmin === "function") {
                    window.filtrarAdmin(sectionControl.value);
                }
                window.setTimeout(() => {
                    enhanceCards();
                    applyFilters();
                }, 80);
            });
        }

        updateKpis();
        renderActivity();
    }

    function renderActivity() {
        const target = document.getElementById("adminProActivity");
        if (!target) {
            return;
        }

        const list = readJson(activityKey, []);
        if (!list.length) {
            target.innerHTML = '<div class="empty-state"><strong>Sin actividad reciente.</strong><span>Los cambios del panel apareceran aqui.</span></div>';
            return;
        }

        target.innerHTML = list.slice(0, 12).map((item) => {
            return [
                '<article class="admin-pro-activity-item">',
                '<strong>' + escapeHtml(item.action) + '</strong>',
                '<span>' + escapeHtml(item.section) + (item.detail ? " - " + escapeHtml(item.detail) : "") + '</span>',
                '<span>' + escapeHtml(item.fecha) + '</span>',
                '</article>'
            ].join("");
        }).join("");
    }

    function applyFilters() {
        const search = normalizeText((document.getElementById("adminProSearch") || {}).value || "");
        const status = normalizeText((document.getElementById("adminProStatus") || {}).value || "");
        const type = normalizeText((document.getElementById("adminProType") || {}).value || "");
        const cards = document.querySelectorAll(".admin-section:not([hidden]) .saved-list article,.admin-section:not([hidden]) .pet-admin-item,.admin-section:not([hidden]) .mailbox-admin-item,.admin-section:not([hidden]) .report-saved-item,.admin-section:not([hidden]) .adoption-request-admin");

        cards.forEach((card) => {
            const text = normalizeText(card.textContent);
            const matchesSearch = !search || text.includes(search);
            const matchesStatus = !status || text.includes(status);
            const matchesType = !type || text.includes(type);
            card.classList.toggle("admin-pro-filter-hidden", !(matchesSearch && matchesStatus && matchesType));
        });
    }

    function parseActionId(card, functionName) {
        const action = card.querySelector('[onclick*="' + functionName + '"]');
        const raw = action ? action.getAttribute("onclick") || "" : "";
        const match = raw.match(new RegExp(functionName + "\\('([^']+)'") );
        return match ? match[1] : "";
    }

    function addButton(row, label, callback, extraClass) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = extraClass || "status-action";
        button.textContent = label;
        button.addEventListener("click", callback);
        row.appendChild(button);
    }

    function appendNote(card, scope, id) {
        if (!id || card.querySelector("[data-admin-pro-note]")) {
            return;
        }

        const notes = readJson(notesKey, {});
        const key = scope + ":" + id;
        const box = document.createElement("div");
        box.className = "admin-pro-note";
        box.dataset.adminProNote = key;
        box.innerHTML = [
            '<small>Nota interna</small>',
            '<textarea placeholder="Agrega una nota para el equipo">' + escapeHtml(notes[key] || "") + '</textarea>',
            '<button class="secondary" type="button">Guardar nota</button>'
        ].join("");
        box.querySelector("button").addEventListener("click", () => {
            const next = readJson(notesKey, {});
            next[key] = box.querySelector("textarea").value.trim();
            writeJson(notesKey, next);
            recordActivity("Nota guardada", scope, id);
        });
        card.appendChild(box);
    }

    function enhanceRequests() {
        document.querySelectorAll(".adoption-request-admin:not([data-admin-pro-ready])").forEach((card) => {
            const id = parseActionId(card, "cambiarEstadoSolicitud");
            if (!id) {
                return;
            }

            card.dataset.adminProReady = "true";
            const row = document.createElement("div");
            row.className = "admin-pro-extra-actions";
            [
                ["Nueva", "Enviada"],
                ["En revision", "Revisando"],
                ["Aprobada", "Aprobada"],
                ["Rechazada", "Rechazada"],
                ["Cita agendada", "Cita programada"],
                ["Finalizada", "Finalizada"]
            ].forEach((item) => {
                addButton(row, item[0], () => {
                    if (typeof window.cambiarEstadoSolicitud === "function") {
                        window.cambiarEstadoSolicitud(id, item[1]);
                    }
                });
            });
            card.appendChild(row);
            appendNote(card, "Solicitudes", id);
        });
    }

    function enhanceReports() {
        document.querySelectorAll(".report-saved-item:not([data-admin-pro-ready])").forEach((card) => {
            const id = parseActionId(card, "cambiarEstadoReporte");
            if (!id) {
                return;
            }

            card.dataset.adminProReady = "true";
            const row = document.createElement("div");
            row.className = "admin-pro-extra-actions";
            [
                ["Recibido", "Recibido"],
                ["En revision", "En revision"],
                ["Atendido", "Atendido"],
                ["Archivado", "Archivado"]
            ].forEach((item) => {
                addButton(row, item[0], () => {
                    if (typeof window.cambiarEstadoReporte === "function") {
                        window.cambiarEstadoReporte(id, item[1]);
                    }
                });
            });
            card.appendChild(row);
            appendNote(card, "Reportes", id);
        });
    }

    function setMessageStatus(id, status) {
        const messages = mailboxList().map((message) => {
            if (message.id !== id) {
                return message;
            }

            return Object.assign({}, message, {
                estadoAdmin: status,
                readByAdmin: status !== "Nuevo",
                actualizado: now()
            });
        });
        writeJson(mailboxKey, messages);
        recordActivity("Mensaje marcado", "Mensajes", status);
        if (typeof window.cargarMensajes === "function") {
            window.cargarMensajes();
        }
        window.setTimeout(enhanceCards, 80);
    }

    function enhanceMessages() {
        document.querySelectorAll(".mailbox-admin-item:not([data-admin-pro-ready])").forEach((card) => {
            const id = parseActionId(card, "responderBuzon");
            if (!id) {
                return;
            }

            card.dataset.adminProReady = "true";
            const row = document.createElement("div");
            row.className = "admin-pro-extra-actions";
            ["Nuevo", "Leido", "Respondido", "Importante", "Archivado"].forEach((status) => {
                addButton(row, status, () => setMessageStatus(id, status));
            });
            card.appendChild(row);
            appendNote(card, "Mensajes", id);
        });
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

    function setSubmitText(text) {
        const button = document.querySelector("#petAdminForm button[type='submit']");
        if (button) {
            button.textContent = text;
        }
    }

    function ensureCancelEditButton() {
        const form = document.getElementById("petAdminForm");
        const actions = form && form.querySelector(".section-actions.left");
        if (!form || !actions || form.querySelector("[data-admin-pro-cancel-edit]")) {
            return;
        }

        const button = document.createElement("button");
        button.className = "secondary";
        button.type = "button";
        button.dataset.adminProCancelEdit = "true";
        button.textContent = "Cancelar edicion";
        button.hidden = true;
        button.addEventListener("click", () => {
            delete form.dataset.adminProEditId;
            form.reset();
            button.hidden = true;
            setSubmitText("Guardar mascota");
        });
        actions.appendChild(button);
    }

    function editPet(id) {
        const form = document.getElementById("petAdminForm");
        const pet = petList().find((item) => item.id === id);
        if (!form || !pet) {
            return;
        }

        form.dataset.adminProEditId = id;
        ensureCancelEditButton();
        const cancel = form.querySelector("[data-admin-pro-cancel-edit]");
        if (cancel) {
            cancel.hidden = false;
        }

        const fields = {
            petAdminName: pet.nombre,
            petAdminType: pet.tipo,
            petAdminAge: pet.edad,
            petAdminStatus: pet.estado,
            petAdminEnergy: pet.energia,
            petAdminHome: pet.espacio,
            petAdminRoutine: pet.rutina,
            petAdminPersonality: pet.personalidad,
            petAdminStory: pet.historia
        };

        Object.keys(fields).forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = fields[fieldId] || "";
            }
        });

        setSubmitText("Guardar cambios");
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        recordActivity("Edicion iniciada", "Mascotas", pet.nombre || id);
    }

    async function saveEditedPet(event) {
        const form = document.getElementById("petAdminForm");
        const id = form && form.dataset.adminProEditId;

        if (!id) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }

        if (typeof window.requiereAdmin === "function" && !window.requiereAdmin()) {
            return;
        }

        const pets = petList();
        const oldPet = pets.find((item) => item.id === id);
        if (!oldPet) {
            return;
        }

        const fileInput = document.getElementById("petAdminPhoto");
        const image = await fileToDataUrl(fileInput && fileInput.files && fileInput.files[0]);
        const updated = Object.assign({}, oldPet, {
            nombre: (document.getElementById("petAdminName") || {}).value || oldPet.nombre,
            tipo: (document.getElementById("petAdminType") || {}).value || oldPet.tipo,
            edad: (document.getElementById("petAdminAge") || {}).value || oldPet.edad,
            estado: (document.getElementById("petAdminStatus") || {}).value || oldPet.estado,
            energia: (document.getElementById("petAdminEnergy") || {}).value || oldPet.energia,
            espacio: (document.getElementById("petAdminHome") || {}).value || oldPet.espacio,
            rutina: (document.getElementById("petAdminRoutine") || {}).value || oldPet.rutina,
            personalidad: (document.getElementById("petAdminPersonality") || {}).value || oldPet.personalidad,
            historia: (document.getElementById("petAdminStory") || {}).value || oldPet.historia,
            imagen: image || oldPet.imagen,
            actualizado: now()
        });

        writeJson(petsKey, pets.map((item) => item.id === id ? updated : item));
        if (window.huellitasApi && window.huellitasApi.enabled) {
            try {
                await window.huellitasApi.request("/api/pets", {
                    method: "POST",
                    body: JSON.stringify(updated)
                });
            } catch (error) {}
        }

        delete form.dataset.adminProEditId;
        form.reset();
        const cancel = form.querySelector("[data-admin-pro-cancel-edit]");
        if (cancel) {
            cancel.hidden = true;
        }
        setSubmitText("Guardar mascota");
        recordActivity("Mascota editada", "Mascotas", updated.nombre);

        if (typeof window.cargarMascotas === "function") {
            window.cargarMascotas();
        }
    }

    function enhancePets() {
        document.querySelectorAll(".pet-admin-item:not([data-admin-pro-ready])").forEach((card) => {
            const id = parseActionId(card, "cambiarEstadoMascota");
            if (!id) {
                return;
            }

            card.dataset.adminProReady = "true";
            const row = document.createElement("div");
            row.className = "admin-pro-extra-actions";
            addButton(row, "Editar", () => editPet(id), "status-action");
            [
                ["Disponible", "Disponible"],
                ["Urgente", "Urgente"],
                ["Destacada", "Destacada"],
                ["Adoptada", "Adoptada"]
            ].forEach((item) => {
                addButton(row, item[0], () => {
                    if (typeof window.cambiarEstadoMascota === "function") {
                        window.cambiarEstadoMascota(id, item[1]);
                    }
                });
            });
            card.appendChild(row);
            appendNote(card, "Mascotas", id);
        });
    }

    function installPetEditSubmit() {
        const form = document.getElementById("petAdminForm");
        if (!form || form.dataset.adminProEditReady === "true") {
            return;
        }

        form.dataset.adminProEditReady = "true";
        form.addEventListener("submit", saveEditedPet, true);
        ensureCancelEditButton();
    }

    function enhanceManual() {
        const panel = document.querySelector('[data-admin-section="manual"] .team-panel');
        if (!panel || panel.querySelector(".admin-pro-manual")) {
            return;
        }

        const manual = document.createElement("div");
        manual.className = "admin-pro-manual";
        manual.innerHTML = [
            ["Mascotas", "Agrega, edita y cambia estado. Adoptada deja de salir como disponible."],
            ["Solicitudes", "Filtra por nombre, cambia estado y agenda citas desde la misma tarjeta."],
            ["Citas", "Toda solicitud con fecha aparece ordenada en calendario admin."],
            ["Reportes", "Usa estados y notas internas para dar seguimiento real."],
            ["Mensajes", "Marca conversaciones como leidas, importantes o archivadas."],
            ["Respaldos", "Exporta antes de importar. Las opciones destructivas quedan bloqueadas por seguridad."]
        ].map((item) => '<article><strong>' + item[0] + '</strong><span>' + item[1] + '</span></article>').join("");
        panel.appendChild(manual);
    }

    function wrapAction(name, section, label) {
        if (typeof window[name] !== "function" || window[name].adminProWrapped) {
            return;
        }

        const original = window[name];
        window[name] = function () {
            const args = Array.from(arguments);
            const result = original.apply(this, arguments);
            window.setTimeout(() => {
                recordActivity(label, section, args.filter(Boolean).join(" / "));
                updateKpis();
                enhanceCards();
            }, 120);
            return result;
        };
        window[name].adminProWrapped = true;
    }

    function wrapActions() {
        wrapAction("cambiarEstadoSolicitud", "Solicitudes", "Estado de solicitud actualizado");
        wrapAction("guardarCitaSolicitud", "Citas", "Cita guardada");
        wrapAction("cambiarEstadoReporte", "Reportes", "Reporte actualizado");
        wrapAction("cambiarEstadoMascota", "Mascotas", "Mascota actualizada");
        wrapAction("guardarMascotaDesdeFormulario", "Mascotas", "Mascota agregada");
        wrapAction("eliminarMascota", "Mascotas", "Mascota eliminada");
        wrapAction("responderBuzon", "Mensajes", "Mensaje respondido");
        wrapAction("cambiarEstadoCentro", "Centros", "Centro actualizado");
        wrapAction("crearCentroDemo", "Centros", "Centro agregado");
    }

    let scheduled = false;

    function enhanceCards() {
        if (!isAdminPage()) {
            return;
        }

        enhanceRequests();
        enhanceReports();
        enhanceMessages();
        enhancePets();
        enhanceManual();
        applyFilters();
    }

    function scheduleRefresh() {
        if (scheduled) {
            return;
        }

        scheduled = true;
        window.setTimeout(() => {
            scheduled = false;
            buildShell();
            wrapActions();
            installPetEditSubmit();
            enhanceCards();
            updateKpis();
            renderActivity();
        }, 120);
    }

    onReady(() => {
        if (!isAdminPage()) {
            return;
        }

        injectStyles();
        buildShell();
        wrapActions();
        installPetEditSubmit();
        enhanceCards();
        updateKpis();
        renderActivity();

        ["huellitas:adoptionsChanged", "huellitas:reportsChanged", "huellitas:mailboxChanged", "huellitas:petsChanged"].forEach((eventName) => {
            window.addEventListener(eventName, scheduleRefresh);
        });

        if (document.body && window.MutationObserver) {
            new MutationObserver(scheduleRefresh).observe(document.body, { childList: true, subtree: true });
        }

        window.addEventListener("storage", scheduleRefresh);
        window.setTimeout(scheduleRefresh, 500);
        window.setTimeout(scheduleRefresh, 1600);
    });
})();