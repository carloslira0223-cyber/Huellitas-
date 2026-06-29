/*!
 * Proyecto Huellitas - Carlos Alexis Lira Alcala - 2026.
 * Atrapa Premios: reto rapido, resultados y clasificacion local.
 */
(function () {
    "use strict";

    const STORAGE_KEY = "huellitasCatchRankingV2";
    const OWNER_KEY = "huellitasCatchOwnerId";
    const TARGET_TOTAL = 10;
    const targetTypes = [
        { symbol: "\uD83D\uDC8E", name: "Diamante", className: "diamond" },
        { symbol: "\uD83C\uDF81", name: "Regalo", className: "gift" },
        { symbol: "\uD83E\uDDB4", name: "Huesito", className: "bone" },
        { symbol: "\u23F1\uFE0F", name: "Reloj", className: "clock" }
    ];
    let recordsMode = "all";
    let game = null;

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    }

    function loadStyles() {
        if (document.getElementById("huellitasCatchChallengeCss")) {
            return;
        }
        const link = document.createElement("link");
        link.id = "huellitasCatchChallengeCss";
        link.rel = "stylesheet";
        link.href = "huellitas-catch-challenge.css?v=20260628-catch-v1";
        document.head.appendChild(link);
    }

    function ownerId() {
        try {
            if (typeof getPlayer === "function") {
                const player = getPlayer();
                if (player && (player.id || player.email)) {
                    return String(player.id || player.email);
                }
            }
        } catch (error) {
            console.warn(error.message);
        }

        let id = localStorage.getItem(OWNER_KEY);
        if (!id) {
            id = "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
            localStorage.setItem(OWNER_KEY, id);
        }
        return id;
    }

    function safeNickname(value) {
        const clean = String(value || "")
            .normalize("NFKC")
            .replace(/[^a-zA-Z0-9\u00C0-\u017F_. -]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 12);
        const blocked = ["admin", "moderador", "huellitas oficial"];
        return blocked.includes(clean.toLowerCase()) ? "" : clean;
    }

    function readRecords() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value.filter(function (item) {
                return item && Number.isFinite(Number(item.time)) && Number(item.prizes) === TARGET_TOTAL;
            }).slice(-100) : [];
        } catch (error) {
            return [];
        }
    }

    function writeRecords(records) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-100)));
    }

    function formatTime(milliseconds) {
        const total = Math.max(0, Math.floor(Number(milliseconds || 0) / 10));
        const minutes = Math.floor(total / 6000);
        const seconds = Math.floor((total % 6000) / 100);
        const hundredths = total % 100;
        return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(hundredths).padStart(2, "0");
    }

    function todayLabel(iso) {
        const date = new Date(iso);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return "Hoy";
        }
        return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    }

    function buildMarkup(panel) {
        panel.classList.add("catch-premium");
        panel.innerHTML = [
            '<div class="catch-premium-layout">',
                '<section class="catch-play-surface" aria-labelledby="catchPremiumTitle">',
                    '<div class="catch-hero">',
                        '<div class="catch-hero-copy">',
                            '<span class="catch-kicker">REFLEJOS</span>',
                            '<h2 id="catchPremiumTitle">Atrapa <em>Premios</em></h2>',
                            '<p>Encuentra 10 premios lo m&aacute;s r&aacute;pido posible. Cada acierto mantiene viva tu racha.</p>',
                        '</div>',
                        '<div class="catch-pixel-pet" role="img" aria-label="Perrito de Huellitas animando el reto"></div>',
                    '</div>',
                    '<div class="catch-progress-wrap">',
                        '<div class="catch-progress-label"><span>&#9203; Progreso del reto</span><strong id="catchProgressText">0/10</strong></div>',
                        '<div class="catch-progress-track"><i id="catchProgressBar"></i></div>',
                    '</div>',
                    '<div class="catch-stats" aria-live="polite">',
                        '<div><span>&#9201; Tiempo</span><strong id="catchTimer">00:00.00</strong></div>',
                        '<div><span>&#127942; Premios</span><strong id="catchScore">0</strong></div>',
                        '<div><span>&#128293; Racha</span><strong id="catchStreak">0</strong></div>',
                    '</div>',
                    '<div class="catch-board" id="catchBoard" aria-label="Tablero de 12 posiciones"></div>',
                    '<button class="catch-start" id="catchStartButton" type="button"><span aria-hidden="true">&#128062;</span> Iniciar reto</button>',
                    '<p class="catch-help"><span aria-hidden="true">&#9733;</span> Atrapa 10 premios y supera tu mejor tiempo.</p>',
                '</section>',
                '<aside class="catch-ranking" aria-label="Clasificacion de Atrapa Premios">',
                    '<div class="catch-ranking-tabs" role="tablist">',
                        '<button class="active" type="button" data-catch-records="all" role="tab" aria-selected="true">&#127942; Clasificaci&oacute;n</button>',
                        '<button type="button" data-catch-records="mine" role="tab" aria-selected="false">&#9201; Mis r&eacute;cords</button>',
                    '</div>',
                    '<div class="catch-ranking-title"><strong>Mejores reflejos</strong><span>Reto r&aacute;pido</span></div>',
                    '<div class="catch-ranking-table" id="catchRankingTable"></div>',
                    '<div class="catch-ranking-footer">',
                        '<small>Se actualiza al guardar cada partida.</small>',
                        '<button type="button" id="catchDeleteRecords">&#128465; Borrar mis r&eacute;cords</button>',
                    '</div>',
                '</aside>',
            '</div>',
            '<div class="catch-result-modal" id="catchResultModal" hidden>',
                '<div class="catch-result-backdrop" data-catch-close></div>',
                '<section class="catch-result-card" role="dialog" aria-modal="true" aria-labelledby="catchResultTitle">',
                    '<button class="catch-result-close" type="button" data-catch-close aria-label="Cerrar resultado">&times;</button>',
                    '<div class="catch-confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>',
                    '<span class="catch-trophy" aria-hidden="true">&#127942;</span>',
                    '<h2 id="catchResultTitle">&iexcl;Reto completado!</h2>',
                    '<p class="catch-result-subtitle">&iexcl;Reflejos de campe&oacute;n!</p>',
                    '<div class="catch-result-stats">',
                        '<div><span>Tiempo</span><strong id="catchFinalTime">00:00.00</strong></div>',
                        '<div><span>Premios</span><strong>10</strong></div>',
                        '<div><span>Mejor racha</span><strong id="catchFinalStreak">0</strong></div>',
                    '</div>',
                    '<label for="catchNickname">Apodo para la clasificaci&oacute;n</label>',
                    '<div class="catch-nickname-row"><input id="catchNickname" type="text" maxlength="12" autocomplete="nickname" placeholder="Escribe tu apodo"><span id="catchNicknameCount">0/12</span></div>',
                    '<p class="catch-nickname-error" id="catchNicknameError" role="alert"></p>',
                    '<button class="catch-save-result" id="catchSaveResult" type="button">&#10003; Guardar resultado</button>',
                    '<button class="catch-play-again" id="catchPlayAgain" type="button">&#8635; Jugar otra vez</button>',
                '</section>',
            '</div>'
        ].join("");
    }

    function elements() {
        return {
            panel: document.getElementById("game-catch"),
            board: document.getElementById("catchBoard"),
            timer: document.getElementById("catchTimer"),
            score: document.getElementById("catchScore"),
            streak: document.getElementById("catchStreak"),
            progress: document.getElementById("catchProgressBar"),
            progressText: document.getElementById("catchProgressText"),
            start: document.getElementById("catchStartButton"),
            modal: document.getElementById("catchResultModal"),
            finalTime: document.getElementById("catchFinalTime"),
            finalStreak: document.getElementById("catchFinalStreak"),
            nickname: document.getElementById("catchNickname"),
            nicknameCount: document.getElementById("catchNicknameCount"),
            nicknameError: document.getElementById("catchNicknameError"),
            ranking: document.getElementById("catchRankingTable")
        };
    }

    function initialGame() {
        return {
            active: false,
            hits: 0,
            streak: 0,
            bestStreak: 0,
            startedAt: 0,
            elapsed: 0,
            targetIndex: -1,
            targetType: null,
            targetTimer: null,
            frame: null,
            locked: false,
            rewarded: false
        };
    }

    function renderStats() {
        const el = elements();
        el.timer.textContent = formatTime(game.elapsed);
        el.score.textContent = String(game.hits);
        el.streak.textContent = String(game.streak);
        el.progress.style.width = Math.min(100, (game.hits / TARGET_TOTAL) * 100) + "%";
        el.progressText.textContent = game.hits + "/" + TARGET_TOTAL;
    }

    function makeCell(index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "catch-cell";
        button.setAttribute("aria-label", "Posicion vacia");
        button.innerHTML = '<span class="catch-dot" aria-hidden="true">&bull;</span>';
        button.addEventListener("click", function () {
            if (!game.active || game.locked) {
                return;
            }
            if (index === game.targetIndex) {
                hitTarget(button);
            } else {
                missTarget(button);
            }
        });
        return button;
    }

    function renderBoard() {
        const board = elements().board;
        board.replaceChildren();
        for (let index = 0; index < 12; index += 1) {
            board.appendChild(makeCell(index));
        }
    }

    function placeTarget() {
        if (!game.active) {
            return;
        }

        const board = elements().board;
        const cells = Array.from(board.querySelectorAll(".catch-cell"));
        cells.forEach(function (cell) {
            cell.className = "catch-cell";
            cell.setAttribute("aria-label", "Posicion vacia");
            cell.innerHTML = '<span class="catch-dot" aria-hidden="true">&bull;</span>';
        });

        let next = Math.floor(Math.random() * cells.length);
        if (cells.length > 1 && next === game.targetIndex) {
            next = (next + 1 + Math.floor(Math.random() * (cells.length - 1))) % cells.length;
        }

        game.targetIndex = next;
        game.targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
        game.locked = false;

        const target = cells[next];
        target.classList.add("target", "target-" + game.targetType.className);
        target.setAttribute("aria-label", "Atrapar " + game.targetType.name);
        const symbol = document.createElement("span");
        symbol.className = "catch-prize-symbol";
        symbol.setAttribute("aria-hidden", "true");
        symbol.textContent = game.targetType.symbol;
        target.replaceChildren(symbol);
    }

    function popScore(cell, text, good) {
        const pop = document.createElement("span");
        pop.className = "catch-score-pop " + (good ? "good" : "bad");
        pop.textContent = text;
        cell.appendChild(pop);
        window.setTimeout(function () {
            pop.remove();
        }, 520);
    }

    function hitTarget(cell) {
        game.locked = true;
        game.hits = Math.min(TARGET_TOTAL, game.hits + 1);
        game.streak += 1;
        game.bestStreak = Math.max(game.bestStreak, game.streak);
        cell.classList.add("caught");
        popScore(cell, "+1", true);
        if (typeof playGameSound === "function") {
            playGameSound("good");
        }
        renderStats();

        if (game.hits >= TARGET_TOTAL) {
            window.setTimeout(completeGame, 160);
        } else {
            window.setTimeout(placeTarget, 110);
        }
    }

    function missTarget(cell) {
        game.streak = 0;
        cell.classList.add("missed");
        popScore(cell, "Racha 0", false);
        if (typeof playGameSound === "function") {
            playGameSound("bad");
        }
        renderStats();
        window.setTimeout(function () {
            cell.classList.remove("missed");
        }, 260);
    }

    function updateClock(now) {
        if (!game.active) {
            return;
        }
        game.elapsed = now - game.startedAt;
        elements().timer.textContent = formatTime(game.elapsed);
        game.frame = window.requestAnimationFrame(updateClock);
    }

    function rewardPet() {
        if (game.rewarded) {
            return;
        }
        game.rewarded = true;
        try {
            if (typeof updateMission === "function") {
                updateMission("catch", 1);
            }
            if (typeof state !== "undefined") {
                state.streak = Number(state.streak || 0) + 1;
            }
            if (typeof addPoints === "function") {
                addPoints(20, 12);
            } else if (typeof saveState === "function") {
                saveState();
            }
            if (typeof renderAll === "function") {
                renderAll();
            }
        } catch (error) {
            console.warn("No se pudo aplicar la recompensa:", error.message);
        }
    }

    function stopTimers() {
        window.clearInterval(game.targetTimer);
        window.cancelAnimationFrame(game.frame);
        game.targetTimer = null;
        game.frame = null;
    }

    function completeGame() {
        if (!game.active) {
            return;
        }
        game.elapsed = performance.now() - game.startedAt;
        game.active = false;
        game.locked = true;
        stopTimers();
        renderStats();
        rewardPet();

        const el = elements();
        el.start.innerHTML = '<span aria-hidden="true">&#8635;</span> Jugar otra vez';
        el.start.classList.remove("running");
        el.finalTime.textContent = formatTime(game.elapsed);
        el.finalStreak.textContent = String(game.bestStreak);
        el.nickname.value = "";
        el.nicknameCount.textContent = "0/12";
        el.nicknameError.textContent = "";
        el.modal.hidden = false;
        document.body.classList.add("catch-modal-open");
        window.setTimeout(function () {
            el.nickname.focus();
        }, 100);
    }

    function startGame() {
        if (game) {
            stopTimers();
        }
        game = initialGame();
        game.active = true;
        game.startedAt = performance.now();

        const el = elements();
        el.modal.hidden = true;
        document.body.classList.remove("catch-modal-open");
        el.start.innerHTML = '<span aria-hidden="true">&#9201;</span> Reto en curso...';
        el.start.classList.add("running");
        renderBoard();
        renderStats();
        placeTarget();
        game.targetTimer = window.setInterval(placeTarget, 900);
        game.frame = window.requestAnimationFrame(updateClock);
    }

    function closeModal() {
        const modal = elements().modal;
        if (modal) {
            modal.hidden = true;
        }
        document.body.classList.remove("catch-modal-open");
    }

    function sortedRecords() {
        const id = ownerId();
        return readRecords()
            .filter(function (item) {
                return recordsMode === "all" || item.owner === id;
            })
            .sort(function (a, b) {
                return Number(a.time) - Number(b.time) || Number(b.streak) - Number(a.streak);
            })
            .slice(0, 10);
    }

    function addRankingCell(row, text, className) {
        const cell = document.createElement("span");
        cell.className = className || "";
        cell.textContent = text;
        row.appendChild(cell);
    }

    function renderRanking() {
        const target = elements().ranking;
        if (!target) {
            return;
        }

        target.replaceChildren();
        const head = document.createElement("div");
        head.className = "catch-rank-row catch-rank-head";
        ["#", "Jugador", "Tiempo", "Premios", "Racha", "Fecha"].forEach(function (label) {
            addRankingCell(head, label);
        });
        target.appendChild(head);

        const records = sortedRecords();
        if (!records.length) {
            const empty = document.createElement("div");
            empty.className = "catch-ranking-empty";
            empty.textContent = recordsMode === "mine"
                ? "Aun no guardas partidas. Tu siguiente reto puede ser el primero."
                : "Completa el reto para inaugurar la clasificacion.";
            target.appendChild(empty);
            return;
        }

        records.forEach(function (record, index) {
            const row = document.createElement("div");
            row.className = "catch-rank-row";
            if (record.owner === ownerId()) {
                row.classList.add("is-mine");
            }
            const place = index + 1;
            addRankingCell(row, place < 4 ? ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"][place - 1] : String(place), "rank-place");
            addRankingCell(row, record.nickname, "rank-name");
            addRankingCell(row, formatTime(record.time), "rank-time");
            addRankingCell(row, String(record.prizes));
            addRankingCell(row, String(record.streak));
            addRankingCell(row, todayLabel(record.date));
            target.appendChild(row);
        });
    }

    function saveResult() {
        const el = elements();
        const nickname = safeNickname(el.nickname.value);
        if (!nickname) {
            el.nicknameError.textContent = "Escribe un apodo valido de hasta 12 caracteres.";
            el.nickname.focus();
            return;
        }

        const records = readRecords();
        records.push({
            id: "catch-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
            owner: ownerId(),
            nickname: nickname,
            time: Math.round(game.elapsed),
            prizes: TARGET_TOTAL,
            streak: game.bestStreak,
            date: new Date().toISOString()
        });
        writeRecords(records);
        recordsMode = "all";
        setRecordsMode("all");
        renderRanking();
        closeModal();
    }

    function setRecordsMode(mode) {
        recordsMode = mode === "mine" ? "mine" : "all";
        document.querySelectorAll("[data-catch-records]").forEach(function (button) {
            const active = button.dataset.catchRecords === recordsMode;
            button.classList.toggle("active", active);
            button.setAttribute("aria-selected", active ? "true" : "false");
        });
        renderRanking();
    }

    function deleteMyRecords() {
        const mine = ownerId();
        if (!readRecords().some(function (item) { return item.owner === mine; })) {
            return;
        }
        if (!window.confirm("Borrar tus records de Atrapa Premios en este dispositivo?")) {
            return;
        }
        writeRecords(readRecords().filter(function (item) {
            return item.owner !== mine;
        }));
        renderRanking();
    }

    function bindControls() {
        const el = elements();
        el.start.addEventListener("click", startGame);
        document.querySelectorAll("[data-catch-close]").forEach(function (button) {
            button.addEventListener("click", closeModal);
        });
        document.getElementById("catchSaveResult").addEventListener("click", saveResult);
        document.getElementById("catchPlayAgain").addEventListener("click", function () {
            closeModal();
            startGame();
        });
        document.getElementById("catchDeleteRecords").addEventListener("click", deleteMyRecords);
        document.querySelectorAll("[data-catch-records]").forEach(function (button) {
            button.addEventListener("click", function () {
                setRecordsMode(button.dataset.catchRecords);
            });
        });
        el.nickname.addEventListener("input", function () {
            const value = safeNickname(el.nickname.value);
            el.nicknameCount.textContent = value.length + "/12";
            el.nicknameError.textContent = "";
        });
        el.nickname.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                saveResult();
            }
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !el.modal.hidden) {
                closeModal();
            }
        });
    }

    function enhance() {
        const panel = document.getElementById("game-catch");
        if (!panel || panel.dataset.catchPremium === "true") {
            return;
        }
        panel.dataset.catchPremium = "true";
        loadStyles();
        buildMarkup(panel);
        game = initialGame();
        renderBoard();
        renderStats();
        renderRanking();
        bindControls();

        window.iniciarAtrapaPremios = startGame;
        window.finalizarAtrapaPremios = completeGame;
        window.atraparPremio = function () {};
        window.fallarPremio = function () {};
    }

    onReady(enhance);
    window.addEventListener("pagehide", function () {
        if (game) {
            stopTimers();
        }
    });
})();