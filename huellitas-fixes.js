(function () {
    const styleId = "huellitasFinalFixStyles";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function injectFinalFixStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.profile-tab-panel[hidden],
body.profile-sheet-open .profile-tab-panel[hidden]{display:none!important}
.profile-tabs button[aria-selected="true"]{background:var(--leaf-dark);color:#fff}
.game-hub-control-section{padding-top:22px;padding-bottom:8px}
.game-hub-controls{width:min(100%,960px);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 auto;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-strong,#fff);box-shadow:var(--shadow-soft)}
.game-hub-controls button{min-height:48px;margin:0;padding:10px 12px;border:1px solid var(--line);background:var(--surface,#fff);color:var(--cocoa);box-shadow:none;white-space:normal}
.game-hub-controls button.active,.game-hub-controls button[aria-pressed="true"]{background:var(--leaf-dark);color:#fff;border-color:transparent;box-shadow:0 10px 24px rgba(36,92,61,.18)}
.game-hub-section[hidden]{display:none!important}
.arcade-shell{width:min(100%,1120px)}
.shop-side{position:static}
.inventory-panel{scroll-margin-top:94px}
body.inventory-focus .inventory-panel{outline:3px solid rgba(95,157,99,.28);outline-offset:4px}
.pet-scene-focus{animation:pet-focus-pulse 900ms ease}
@keyframes pet-focus-pulse{0%{transform:scale(1)}40%{transform:scale(1.015)}100%{transform:scale(1)}}
body.dark .game-hub-controls,body.dark .game-hub-controls button{background:rgba(18,27,22,.92);border-color:rgba(220,235,215,.14)}
body.dark .game-hub-controls button{color:#f5fff7}
body.dark .game-hub-controls button.active,body.dark .game-hub-controls button[aria-pressed="true"]{background:var(--leaf);color:#08120d}
body.dark .word-grid button.selected{background:var(--honey)!important;color:#2d251d!important;border-color:rgba(255,214,122,.72)!important}
body.dark .word-grid button.found{background:var(--leaf)!important;color:#fff!important;border-color:rgba(220,235,215,.24)!important}
body.dark .word-grid button.hint{outline-color:rgba(255,198,111,.72)}
.admin-overview-section .admin-dashboard{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.admin-command-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.admin-command-bar button,.admin-command-bar .button-link{width:100%;min-height:44px;margin:0}
.admin-insights-grid{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.admin-filter-bar{position:static!important;display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px;margin-top:18px}
.admin-filter-bar button{min-height:42px;margin:0;white-space:normal}
body.dark .admin-command-bar,body.dark .admin-filter-bar,body.dark .admin-visual-panel,body.dark .system-status-item{background:rgba(18,27,22,.92);border-color:rgba(220,235,215,.14)}
body.dark .admin-filter-bar .filter-button{background:rgba(255,255,255,.06);color:#f5fff7;border-color:rgba(220,235,215,.14)}
body.dark .admin-filter-bar .filter-button.active{background:var(--leaf);color:#08120d}
body.dark .system-status-item small,body.dark .admin-kpi-list span{color:#cfe7d2}
.visual-map{min-height:auto;aspect-ratio:16/10}
.map-shape{inset:30px 30px 74px}
.map-zone-grid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
body.dark .visual-map{background:linear-gradient(135deg,rgba(29,48,39,.94),rgba(16,23,19,.98)),linear-gradient(90deg,transparent 49%,rgba(220,235,215,.06) 50%,transparent 51%),linear-gradient(0deg,transparent 49%,rgba(220,235,215,.06) 50%,transparent 51%)}
@media(max-width:820px){.game-hub-controls{grid-template-columns:repeat(2,minmax(0,1fr))}.word-game-layout{grid-template-columns:1fr!important}.word-grid{width:min(100%,560px);margin:0 auto}.word-side{grid-template-columns:1fr}.shop-layout{grid-template-columns:1fr!important}.visual-map{aspect-ratio:1/1.08;padding:14px}.map-shape{inset:18px 16px 86px}.map-pin{width:34px;height:34px}.map-caption{left:12px;right:12px;bottom:12px;padding:9px 10px;font-size:12px;line-height:1.35}.map-list{padding:12px}.map-zone-grid{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}.map-zone-card{flex:0 0 190px;min-height:92px;scroll-snap-align:start}}
@media(max-width:520px){.game-hub-controls{grid-template-columns:1fr}.pet-stage-panel,.pet-side-panel,.shop-side .feature-panel,.arcade-stage{padding:14px}.pet-scene{min-height:360px;padding:14px}.pet-avatar-wrap{width:min(300px,86vw);min-height:280px}.pet-sprite-stack{transform:translateY(92px) scale(3.35)}.pet-actions,.guardian-options,.simon-pad{grid-template-columns:1fr!important}.word-grid{gap:2px}.word-grid button{font-size:11px}.admin-command-bar,.admin-filter-bar{grid-template-columns:1fr!important}.visual-map{aspect-ratio:1/1.28}.map-shape{inset:16px 12px 98px}.map-pin{width:30px;height:30px}}
        `;
        document.head.appendChild(style);
    }

    function setProfileTab(wrap, tabName) {
        wrap.querySelectorAll("[data-profile-tab]").forEach((tab) => {
            const active = tab.dataset.profileTab === tabName;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", active ? "true" : "false");
        });

        wrap.querySelectorAll("[data-profile-panel]").forEach((panel) => {
            const active = panel.dataset.profilePanel === tabName;
            panel.hidden = !active;
            panel.classList.toggle("active", active);
        });
    }

    function setupProfileTabFixes() {
        document.querySelectorAll("[data-global-profile]").forEach((wrap) => {
            const popover = wrap.querySelector(".profile-popover");
            const chip = wrap.querySelector(".profile-chip");

            if (chip && popover && !chip.dataset.finalProfileChipReady) {
                chip.dataset.finalProfileChipReady = "true";
                chip.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const shouldOpen = popover.hidden;
                    document.querySelectorAll(".profile-popover").forEach((item) => {
                        if (item !== popover) {
                            item.hidden = true;
                        }
                    });
                    popover.hidden = !shouldOpen;
                    if (shouldOpen) {
                        popover.scrollTop = 0;
                    }
                });
            }

            if (popover && !popover.dataset.finalProfilePopoverReady) {
                popover.dataset.finalProfilePopoverReady = "true";
                popover.addEventListener("click", (event) => event.stopPropagation());
            }

            wrap.querySelectorAll("[data-profile-tab]").forEach((button) => {
                if (button.dataset.finalProfileTabReady) {
                    return;
                }

                button.dataset.finalProfileTabReady = "true";
                button.setAttribute("role", "tab");
                button.setAttribute("aria-selected", button.classList.contains("active") ? "true" : "false");
                button.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setProfileTab(wrap, button.dataset.profileTab);
                });
            });
        });
    }

    function wrapProfileMount() {
        if (typeof window.huellitasMountProfile !== "function" || window.huellitasMountProfile.finalProfileFixWrapped) {
            return;
        }

        const originalMount = window.huellitasMountProfile;
        window.huellitasMountProfile = function () {
            const result = originalMount.apply(this, arguments);
            window.setTimeout(setupProfileTabFixes, 0);
            return result;
        };
        window.huellitasMountProfile.finalProfileFixWrapped = true;
    }

    function focusPetScene() {
        const scene = document.getElementById("petScene");

        if (!scene) {
            return;
        }

        scene.classList.remove("pet-scene-focus");
        void scene.offsetWidth;
        scene.classList.add("pet-scene-focus");
        scene.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => scene.classList.remove("pet-scene-focus"), 1300);
    }

    function patchGlobalGameData() {
        try {
            if (Array.isArray(wordDefinitions)) {
                for (let index = wordDefinitions.length - 1; index >= 0; index--) {
                    if (String(wordDefinitions[index].word || "").toUpperCase() === "BANO") {
                        wordDefinitions.splice(index, 1);
                    }
                }
            }
        } catch (error) {}

        try {
            if (Array.isArray(quizQuestions)) {
                quizQuestions.forEach((question) => {
                    if (Array.isArray(question.options)) {
                        question.options = question.options.map((option) => option === "Banarlo de inmediato" ? "Ba\u00f1arlo de inmediato" : option);
                    }
                });
            }
        } catch (error) {}
    }

    function ensureGamesHub() {
        if (!/jueguitos\.html$/i.test(window.location.pathname.split("/").pop() || "")) {
            return;
        }

        patchGlobalGameData();

        const heroActions = document.querySelector(".game-header .hero-actions");
        if (heroActions && !heroActions.querySelector("[data-open-games-hub]")) {
            const mainButton = heroActions.querySelector("button");
            if (mainButton) {
                mainButton.dataset.openGamesHub = "mascota";
                mainButton.setAttribute("onclick", "abrirZonaJuegos('mascota')");
            }

            const gamesButton = document.createElement("button");
            gamesButton.className = "secondary";
            gamesButton.type = "button";
            gamesButton.dataset.openGamesHub = "juegos";
            gamesButton.textContent = "Abrir juegos";
            gamesButton.addEventListener("click", () => window.abrirZonaJuegos("juegos"));

            const shopButton = document.createElement("button");
            shopButton.className = "secondary";
            shopButton.type = "button";
            shopButton.dataset.openGamesHub = "tienda";
            shopButton.textContent = "Abrir tienda";
            shopButton.addEventListener("click", () => window.abrirZonaJuegos("tienda"));

            const adoptionLink = heroActions.querySelector('a[href*="adopcion"]');
            heroActions.insertBefore(gamesButton, adoptionLink || null);
            heroActions.insertBefore(shopButton, adoptionLink || null);
        }

        const petSection = document.getElementById("zonaMichi");
        const arcadeSection = document.getElementById("arcadePerruno");
        const shopGrid = document.getElementById("shopGrid");
        const shopSection = shopGrid ? shopGrid.closest(".section") : null;
        const missionSection = document.getElementById("misionesMascota")
            || (document.querySelector(".mission-layout") ? document.querySelector(".mission-layout").closest(".section") : null);

        if (petSection) {
            petSection.classList.add("game-hub-section");
            petSection.dataset.gameHubSection = "mascota";
        }

        if (missionSection) {
            missionSection.id = missionSection.id || "misionesMascota";
            missionSection.classList.add("game-hub-section");
            missionSection.dataset.gameHubSection = "mascota";
        }

        if (arcadeSection) {
            arcadeSection.classList.add("game-hub-section");
            arcadeSection.dataset.gameHubSection = "juegos";
        }

        if (shopSection) {
            shopSection.id = shopSection.id || "tiendaTesoros";
            shopSection.classList.add("game-hub-section");
            shopSection.dataset.gameHubSection = "tienda";
        }

        const inventory = document.querySelector(".inventory-panel");
        if (inventory) {
            inventory.id = inventory.id || "inventarioMascota";
        }

        if (!document.getElementById("zonaJuegos")) {
            const controls = document.createElement("section");
            controls.className = "section game-hub-control-section";
            controls.id = "zonaJuegos";
            controls.innerHTML = [
                '<div class="game-hub-controls" aria-label="Abrir secciones de juegos">',
                '<button class="active" type="button" data-game-hub-button="mascota">&#128054; Mascota</button>',
                '<button type="button" data-game-hub-button="juegos">&#127918; Juegos</button>',
                '<button type="button" data-game-hub-button="tienda">&#128722; Tienda</button>',
                '<button type="button" data-game-hub-button="inventario">&#127873; Inventario</button>',
                '</div>'
            ].join("");

            if (petSection && petSection.parentNode) {
                petSection.parentNode.insertBefore(controls, petSection);
            }
        }

        document.querySelectorAll("[data-game-hub-button]").forEach((button) => {
            if (button.dataset.hubReady) {
                return;
            }

            button.dataset.hubReady = "true";
            button.addEventListener("click", () => window.abrirZonaJuegos(button.dataset.gameHubButton));
        });

        window.abrirZonaJuegos = function (area, shouldScroll = true) {
            const selectedArea = ["mascota", "juegos", "tienda", "inventario"].includes(area) ? area : "mascota";
            const visibleSection = selectedArea === "inventario" ? "tienda" : selectedArea;
            const focusTarget = selectedArea === "inventario"
                ? document.getElementById("inventarioMascota")
                : document.querySelector('[data-game-hub-section="' + visibleSection + '"]');

            document.querySelectorAll("[data-game-hub-section]").forEach((section) => {
                section.hidden = section.dataset.gameHubSection !== visibleSection;
            });

            document.querySelectorAll("[data-game-hub-button]").forEach((button) => {
                const active = button.dataset.gameHubButton === selectedArea;
                button.classList.toggle("active", active);
                button.setAttribute("aria-pressed", active ? "true" : "false");
            });

            document.body.classList.toggle("inventory-focus", selectedArea === "inventario");

            if (shouldScroll && focusTarget) {
                focusTarget.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        };

        const hash = window.location.hash;
        const initialArea = hash === "#arcadePerruno"
            ? "juegos"
            : (hash === "#tiendaTesoros" || hash === "#inventarioMascota" || hash === "#inventoryList" ? "inventario" : "mascota");
        window.abrirZonaJuegos(initialArea, Boolean(hash));

        if (!window.huellitasGameHashReady) {
            window.huellitasGameHashReady = true;
            window.addEventListener("hashchange", () => {
                const currentHash = window.location.hash;
                const area = currentHash === "#arcadePerruno"
                    ? "juegos"
                    : (currentHash === "#tiendaTesoros" || currentHash === "#inventarioMascota" || currentHash === "#inventoryList" ? "inventario" : "mascota");
                window.abrirZonaJuegos(area, true);
            });
        }

        if (typeof window.accionCuidado === "function" && !window.accionCuidado.huellitasFocusWrapped) {
            const originalAction = window.accionCuidado;
            window.accionCuidado = function () {
                const result = originalAction.apply(this, arguments);
                window.setTimeout(focusPetScene, 60);
                return result;
            };
            window.accionCuidado.huellitasFocusWrapped = true;
        }

        setupWordSoupPointerFixes();
    }

    function setupWordSoupPointerFixes() {
        if (window.huellitasWordSoupPointerReady) {
            return;
        }

        window.huellitasWordSoupPointerReady = true;

        document.addEventListener("pointerdown", (event) => {
            const button = event.target.closest && event.target.closest("#wordGrid [data-word-row]");

            if (!button) {
                return;
            }

            event.preventDefault();

            if (button.setPointerCapture && event.pointerId !== undefined) {
                try {
                    button.setPointerCapture(event.pointerId);
                } catch (error) {}
            }
        }, true);

        document.addEventListener("pointermove", (event) => {
            const grid = document.getElementById("wordGrid");

            if (!grid) {
                return;
            }

            try {
                if (!wordSelecting) {
                    return;
                }
            } catch (error) {
                return;
            }

            event.preventDefault();
            const target = document.elementFromPoint(event.clientX, event.clientY);
            const button = target && target.closest ? target.closest("#wordGrid [data-word-row]") : null;

            if (button && typeof window.moverSeleccionSopa === "function") {
                window.moverSeleccionSopa(Number(button.dataset.wordRow), Number(button.dataset.wordCol));
            }
        }, { passive: false });

        window.addEventListener("pointercancel", () => {
            try {
                wordSelecting = false;
                wordSelectedCells = [];
                document.querySelectorAll("#wordGrid button.selected").forEach((button) => button.classList.remove("selected"));
            } catch (error) {}
        });
    }

    document.addEventListener("click", (event) => {
        if (!event.target.closest("[data-global-profile], .profile-popover")) {
            document.querySelectorAll(".profile-popover").forEach((popover) => {
                popover.hidden = true;
            });
        }
    });

    onReady(() => {
        injectFinalFixStyles();
        wrapProfileMount();
        setupProfileTabFixes();
        ensureGamesHub();
        window.setTimeout(() => {
            setupProfileTabFixes();
            ensureGamesHub();
        }, 250);
    });

    window.addEventListener("load", () => {
        setupProfileTabFixes();
        ensureGamesHub();
    });
})();
