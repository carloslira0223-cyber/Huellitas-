/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Ajustes finales de UX, seguridad de publicacion y juegos.
 */
(function () {
    const styleId = "huellitasUxGuardStyles";
    const lostStorageKey = "huellitasMascotasPerdidas";
    let randomMazeLayout = [];
    let randomMazePosition = { row: 0, col: 0 };
    let randomMazeMoves = 0;
    let randomMazeComplete = false;
    let lastMazeSignature = "";

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

    function stateLabel(state) {
        if (state === "Pendiente") {
            return "Pendiente admin";
        }

        return state === "En busqueda" ? "En busqueda" : (state || "Reportada");
    }

    function stateClass(state) {
        return "status-" + slug(state || "Reportada");
    }

    function normalizeLostPet(item, index) {
        const createdAt = item.createdAt || item.fechaRegistro || now();
        const requestedState = item.estadoSolicitado || item.situacion || "Reportada";
        const state = item.estado || (item.pendienteAdmin ? "Pendiente" : requestedState);
        const normalizedState = state === "En b&uacute;squeda" ? "En busqueda" : state;

        return Object.assign({}, item, {
            id: item.id || "lost-" + index + "-" + String(createdAt).replace(/\W/g, ""),
            nombre: item.nombre || item.mascota || "Mascota sin nombre",
            tipo: item.tipo || "Perro",
            estado: normalizedState,
            estadoSolicitado: requestedState,
            pendienteAdmin: normalizedState === "Pendiente",
            zona: item.zona || item.ubicacion || "Zona por confirmar",
            contacto: item.contacto || item.correo || item.telefono || "Sin contacto",
            descripcion: item.descripcion || item.mensaje || "",
            fecha: item.fecha || createdAt,
            createdAt: createdAt,
            imagen: item.imagen || item.foto || defaultImage(item.tipo),
            historial: Array.isArray(item.historial) && item.historial.length
                ? item.historial
                : [{ estado: normalizedState, fecha: createdAt }]
        });
    }

    function getLostPets() {
        return readJson(lostStorageKey, []).map(normalizeLostPet);
    }

    function saveLostPets(items) {
        writeJson(lostStorageKey, items.map(normalizeLostPet));
        window.dispatchEvent(new CustomEvent("huellitas:lostPetsChanged"));
    }

    function isPublicLostPet(item) {
        return item && item.estado !== "Pendiente" && item.estado !== "Archivada";
    }

    function contactHref(contact) {
        const clean = String(contact || "").trim();
        return clean.includes("@") ? "mailto:" + clean.replace(/\s/g, "") : "tel:" + clean.replace(/[^\d+]/g, "");
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
.status-pendiente{background:#f3d37a!important;color:#4b3321!important}
.featured-pets-grid.featured-carousel{max-width:900px!important;min-height:356px!important;overflow:hidden!important}
.featured-pets-grid.featured-carousel .featured-pet{min-height:342px!important;max-width:100%!important;overflow:hidden!important;border-radius:14px!important}
.featured-pets-grid.featured-carousel .featured-pet img{width:100%!important;min-height:342px!important;object-fit:cover!important}
.featured-pets-grid.featured-carousel .featured-pet>div{min-width:0!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;align-content:stretch!important;gap:12px!important;overflow:hidden!important}
.featured-pets-grid.featured-carousel .featured-pet h3{margin:0!important;font-size:clamp(24px,3vw,34px)!important;line-height:1.08!important;overflow:hidden!important;overflow-wrap:anywhere!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important}
.featured-pets-grid.featured-carousel .featured-pet p{min-height:0!important;margin:0!important;font-size:15px!important;line-height:1.45!important;overflow:hidden!important;display:-webkit-box!important;-webkit-line-clamp:3!important;-webkit-box-orient:vertical!important}
.featured-pets-grid.featured-carousel .featured-pet .button-link{align-self:end!important}
@media(max-width:720px){
    .featured-pets-grid.featured-carousel{min-height:468px!important}
    .featured-pets-grid.featured-carousel .featured-pet{grid-template-columns:1fr!important;grid-template-rows:210px minmax(238px,1fr)!important;min-height:456px!important}
    .featured-pets-grid.featured-carousel .featured-pet img{min-height:210px!important}
    .featured-pets-grid.featured-carousel .featured-pet>div{padding:14px!important;grid-template-rows:auto auto minmax(58px,1fr) auto!important}
    .featured-pets-grid.featured-carousel .featured-pet h3{font-size:clamp(23px,8vw,30px)!important}
}
        `;
        document.head.appendChild(style);
    }

    function publicLostPetCard(item) {
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

    function renderApprovedLostPets() {
        const target = document.getElementById("lostPetsList");

        if (!target) {
            return;
        }

        const search = normalizeText((document.getElementById("lostPetSearch") || {}).value || "");
        const status = (document.getElementById("lostPetStatusFilter") || {}).value || "";
        const type = (document.getElementById("lostPetTypeFilter") || {}).value || "";
        const pets = getLostPets().filter(isPublicLostPet);

        if (!pets.length) {
            target.innerHTML = '<div class="empty-state"><strong>Aun no hay avisos aprobados.</strong><span>Los reportes aparecen aqui cuando el equipo Huellitas los confirma.</span><a class="empty-action" href="#lostPetForm">Reportar mascota</a></div>';
            return;
        }

        const filtered = pets.filter((item) => {
            const text = normalizeText([item.nombre, item.tipo, item.estado, item.zona, item.contacto, item.descripcion].join(" "));
            return (!search || text.includes(search))
                && (!status || item.estado === status)
                && (!type || item.tipo === type);
        });

        target.innerHTML = filtered.length
            ? filtered.map(publicLostPetCard).join("")
            : '<div class="empty-state"><strong>No encontramos coincidencias.</strong><span>Prueba con otra zona, nombre o estado.</span></div>';
    }

    function postPendingLostPet(item) {
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
                estado: "En revision",
                fecha: item.createdAt,
                lostPet: item
            })
        }).catch(() => {});
    }

    async function submitLostPetForReview(event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }

        const form = event.currentTarget;
        const feedback = document.getElementById("lostPetFeedback");
        const fileInput = document.getElementById("lostPetPhoto");
        const requestedState = (document.getElementById("lostPetSituation") || {}).value || "Reportada";
        const type = (document.getElementById("lostPetType") || {}).value || "Perro";
        const name = ((document.getElementById("lostPetName") || {}).value || "").trim();
        const zone = ((document.getElementById("lostPetZone") || {}).value || "").trim();
        const contact = ((document.getElementById("lostPetContact") || {}).value || "").trim();
        const description = ((document.getElementById("lostPetDescription") || {}).value || "").trim();

        if (!name || !zone || !contact || description.length < 8) {
            if (feedback) {
                feedback.className = "form-note error";
                feedback.textContent = "Completa nombre, zona, contacto y detalles para mandar el aviso a revision.";
            }
            return;
        }

        const image = await fileToDataUrl(fileInput && fileInput.files && fileInput.files[0]);
        const item = normalizeLostPet({
            id: "lost-" + Date.now(),
            nombre: name,
            tipo: type,
            estado: "Pendiente",
            estadoSolicitado: requestedState,
            pendienteAdmin: true,
            zona: zone,
            contacto: contact,
            descripcion: description,
            fecha: (document.getElementById("lostPetDate") || {}).value || todayValue(),
            createdAt: now(),
            imagen: image || defaultImage(type),
            historial: [{ estado: "Pendiente", fecha: now() }]
        });
        const pets = getLostPets();

        pets.unshift(item);
        saveLostPets(pets);
        postPendingLostPet(item);
        form.reset();

        if (document.getElementById("lostPetDate")) {
            document.getElementById("lostPetDate").value = todayValue();
        }

        if (feedback) {
            feedback.className = "form-note success";
            feedback.textContent = "Aviso enviado a revision. Un administrador lo revisara antes de publicarlo.";
        }

        renderApprovedLostPets();
        window.setTimeout(enhanceLostPetsAdmin, 80);
    }

    function installLostPetsApproval() {
        const form = document.getElementById("lostPetForm");

        if (form && form.dataset.approvalGuard !== "true") {
            form.dataset.approvalGuard = "true";
            form.addEventListener("submit", submitLostPetForReview, true);
        }

        ["lostPetSearch", "lostPetStatusFilter", "lostPetTypeFilter"].forEach((id) => {
            const control = document.getElementById(id);
            if (control && control.dataset.approvalFilter !== "true") {
                control.dataset.approvalFilter = "true";
                control.addEventListener("input", () => window.setTimeout(renderApprovedLostPets, 0));
                control.addEventListener("change", () => window.setTimeout(renderApprovedLostPets, 0));
            }
        });

        const clear = document.getElementById("lostPetClearFilters");
        if (clear && clear.dataset.approvalFilter !== "true") {
            clear.dataset.approvalFilter = "true";
            clear.addEventListener("click", () => window.setTimeout(renderApprovedLostPets, 0));
        }

        renderApprovedLostPets();
    }

    function enhanceLostPetsAdmin() {
        const pets = getLostPets();
        const summary = document.getElementById("lostPetsAdminSummary");
        const kpi = document.getElementById("adminLostPets");
        const pending = pets.filter((item) => item.estado === "Pendiente").length;
        const published = pets.filter((item) => ["Reportada", "En busqueda", "Encontrada"].includes(item.estado)).length;
        const found = pets.filter((item) => item.estado === "Encontrada").length;
        const reunited = pets.filter((item) => item.estado === "Reunida").length;

        if (kpi) {
            kpi.textContent = pending + published;
        }

        if (summary) {
            summary.innerHTML = [
                ["Pendientes", pending],
                ["Publicados", published],
                ["Encontradas", found],
                ["Reunidas", reunited]
            ].map((item) => '<article><span>' + item[0] + '</span><strong>' + item[1] + '</strong></article>').join("");
        }

        document.querySelectorAll("#lostPetsAdminList .lost-pet-admin-item").forEach((card) => {
            const badge = card.querySelector(".status-pendiente");
            const firstAction = card.querySelector(".status-actions button[onclick]");

            if (!badge || !firstAction || card.dataset.pendingEnhanced === "true") {
                return;
            }

            const match = firstAction.getAttribute("onclick").match(/cambiarEstadoMascotaPerdida\('([^']+)'/);
            const id = match && match[1];
            const pet = pets.find((item) => item.id === id);
            const requested = pet && pet.estadoSolicitado === "Encontrada" ? "Encontrada" : "Reportada";
            const actions = card.querySelector(".status-actions");

            if (actions && id) {
                actions.insertAdjacentHTML("afterbegin", '<button class="status-action active" type="button" onclick="cambiarEstadoMascotaPerdida(\'' + id + '\', \'' + requested + '\')">Publicar</button>');
            }

            badge.textContent = "Pendiente admin";
            card.dataset.pendingEnhanced = "true";
        });
    }

    function shuffle(items) {
        const next = items.slice();
        for (let index = next.length - 1; index > 0; index -= 1) {
            const swap = Math.floor(Math.random() * (index + 1));
            const temp = next[index];
            next[index] = next[swap];
            next[swap] = temp;
        }
        return next;
    }

    function createRandomMazeLayout() {
        const size = 7;
        const grid = Array.from({ length: size }, () => Array(size).fill("#"));

        function inBounds(row, col) {
            return row >= 0 && row < size && col >= 0 && col < size;
        }

        function carve(row, col) {
            grid[row][col] = ".";
            shuffle([[0, 2], [0, -2], [2, 0], [-2, 0]]).forEach((delta) => {
                const nextRow = row + delta[0];
                const nextCol = col + delta[1];

                if (!inBounds(nextRow, nextCol) || grid[nextRow][nextCol] !== "#") {
                    return;
                }

                grid[row + delta[0] / 2][col + delta[1] / 2] = ".";
                carve(nextRow, nextCol);
            });
        }

        carve(0, 0);

        for (let index = 0; index < 6; index += 1) {
            const row = 1 + Math.floor(Math.random() * (size - 2));
            const col = 1 + Math.floor(Math.random() * (size - 2));
            const openNeighbors = [[0, 1], [1, 0], [0, -1], [-1, 0]].filter((delta) => {
                const nextRow = row + delta[0];
                const nextCol = col + delta[1];
                return inBounds(nextRow, nextCol) && grid[nextRow][nextCol] !== "#";
            }).length;

            if (grid[row][col] === "#" && openNeighbors >= 2) {
                grid[row][col] = ".";
            }
        }

        grid[0][0] = "S";
        grid[size - 1][size - 1] = "G";
        return grid.map((row) => row.join(""));
    }

    function nextRandomMazeLayout() {
        let layout = createRandomMazeLayout();
        let signature = layout.join("|");

        for (let attempt = 0; attempt < 5 && signature === lastMazeSignature; attempt += 1) {
            layout = createRandomMazeLayout();
            signature = layout.join("|");
        }

        lastMazeSignature = signature;
        return layout;
    }

    function renderRandomMaze() {
        const grid = document.getElementById("mazeGrid");
        const moves = document.getElementById("mazeMoves");
        const status = document.getElementById("mazeStatus");

        if (!grid || !moves) {
            return;
        }

        moves.textContent = "Movimientos: " + randomMazeMoves;
        grid.innerHTML = randomMazeLayout.map((row, rowIndex) => {
            return row.split("").map((cell, colIndex) => {
                const isDog = randomMazePosition.row === rowIndex && randomMazePosition.col === colIndex;
                const classes = ["maze-cell"];

                if (cell === "#") classes.push("wall");
                if (cell === "G") classes.push("goal");
                if (isDog) classes.push("dog");

                const sprite = typeof window.getMiniPetSpriteMarkup === "function"
                    ? window.getMiniPetSpriteMarkup("maze-pet-sprite")
                    : "&#128054;";
                const content = isDog ? sprite : cell === "G" ? "&#127858;" : "";
                return '<span class="' + classes.join(" ") + '">' + content + '</span>';
            }).join("");
        }).join("");

        if (status && !randomMazeComplete) {
            status.textContent = "Llega al plato. Este laberinto cambia cada partida.";
        }
    }

    function installRandomMaze() {
        if (!document.getElementById("mazeGrid") || window.huellitasRandomMazeReady) {
            return;
        }

        function reset() {
            randomMazeLayout = nextRandomMazeLayout();
            randomMazePosition = { row: 0, col: 0 };
            randomMazeMoves = 0;
            randomMazeComplete = false;
            renderRandomMaze();
        }

        function move(direction) {
            const deltas = {
                up: [-1, 0],
                down: [1, 0],
                left: [0, -1],
                right: [0, 1]
            };
            const delta = deltas[direction];

            if (!delta || randomMazeComplete) {
                return;
            }

            const nextRow = randomMazePosition.row + delta[0];
            const nextCol = randomMazePosition.col + delta[1];
            const row = randomMazeLayout[nextRow];
            const status = document.getElementById("mazeStatus");

            if (!row || row[nextCol] === undefined || row[nextCol] === "#") {
                if (typeof window.playGameSound === "function") window.playGameSound("bad");
                if (status) status.textContent = "Pared. Busca otro camino.";
                return;
            }

            randomMazePosition = { row: nextRow, col: nextCol };
            randomMazeMoves += 1;
            renderRandomMaze();

            if (randomMazeLayout[nextRow][nextCol] === "G") {
                randomMazeComplete = true;
                if (typeof window.playGameSound === "function") window.playGameSound("good");
                if (status) status.textContent = "Llegaste al plato en " + randomMazeMoves + " movimientos.";
                if (typeof window.premiarJuego === "function") {
                    window.premiarJuego("Laberinto completado. Ganaste croquetas y patitas.", 24, Math.max(10, 30 - randomMazeMoves), { energy: 6, health: 6, bond: 5 });
                }
                window.setTimeout(reset, 900);
            }
        }

        window.reiniciarLaberinto = reset;
        window.moverLaberinto = move;
        window.huellitasRandomMazeReady = true;
        reset();
    }

    function init() {
        injectStyles();
        installLostPetsApproval();
        enhanceLostPetsAdmin();
        installRandomMaze();
    }

    onReady(() => {
        init();
        window.setTimeout(init, 250);
        window.setTimeout(init, 1200);
    });

    window.addEventListener("load", init);
    window.addEventListener("huellitas:lostPetsChanged", () => {
        window.setTimeout(renderApprovedLostPets, 0);
        window.setTimeout(enhanceLostPetsAdmin, 80);
    });
    window.addEventListener("storage", (event) => {
        if (event.key === lostStorageKey) {
            window.setTimeout(renderApprovedLostPets, 0);
            window.setTimeout(enhanceLostPetsAdmin, 80);
        }
    });
})();
