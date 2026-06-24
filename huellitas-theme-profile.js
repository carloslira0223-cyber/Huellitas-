/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const themeKey = "huellitasTema";
    const settingsKey = "huellitasAjustes";
    const styleId = "huellitasThemeProfileStyles";
    const panelId = "huellitasThemePanel";
    const palettes = {
        verde: { label: "Verde", leaf: "#5f9d63", leafDark: "#2f6b43", coral: "#d96f63", sky: "#cfe7f4" },
        azul: { label: "Azul", leaf: "#4f8fbf", leafDark: "#28628f", coral: "#d96f63", sky: "#d5ecfb" },
        rosa: { label: "Rosa", leaf: "#c8698a", leafDark: "#8d3f5c", coral: "#5f9d63", sky: "#f5d8e3" },
        morado: { label: "Morado", leaf: "#8067c8", leafDark: "#513a91", coral: "#d96f63", sky: "#e4dcfb" }
    };

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function readSettings() {
        try {
            return Object.assign({ accent: "verde" }, JSON.parse(localStorage.getItem(settingsKey)) || {});
        } catch (error) {
            return { accent: "verde" };
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    function refreshSettings() {
        if (typeof window.huellitasRefreshSettings === "function") {
            window.huellitasRefreshSettings();
            return;
        }

        const settings = readSettings();
        const palette = palettes[settings.accent] || palettes.verde;
        document.body.classList.toggle("dark", localStorage.getItem(themeKey) === "dark");
        document.documentElement.style.setProperty("--leaf", palette.leaf);
        document.documentElement.style.setProperty("--leaf-dark", palette.leafDark);
        document.documentElement.style.setProperty("--coral", palette.coral);
        document.documentElement.style.setProperty("--sky", palette.sky);
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.theme-quick-button{gap:7px;min-width:auto;padding:0 12px;border-radius:999px}
.theme-quick-button span{font-size:13px;font-weight:900}
.theme-quick-dots{display:inline-grid;grid-template-columns:repeat(2,7px);gap:2px}
.theme-quick-dots i{width:7px;height:7px;border-radius:999px;background:var(--leaf)}
.theme-quick-dots i:nth-child(2){background:var(--coral)}
.theme-quick-dots i:nth-child(3){background:var(--sky)}
.theme-quick-dots i:nth-child(4){background:var(--leaf-dark)}
.theme-quick-button::after{content:"";position:absolute;inset:-4px;border-radius:999px;border:2px solid rgba(95,157,99,.18);animation:theme-nudge 2.8s ease-in-out infinite;pointer-events:none}
@keyframes theme-nudge{0%,70%,100%{opacity:0;transform:scale(.92)}12%,32%{opacity:1;transform:scale(1)}}
.theme-panel{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:18px;background:rgba(22,30,25,.46);backdrop-filter:blur(8px)}
.theme-panel[hidden]{display:none!important}
.theme-card{width:min(430px,100%);padding:20px;border:1px solid rgba(255,255,255,.38);border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 28px 80px rgba(20,28,24,.28);color:var(--cocoa);position:relative}
.theme-card h2{margin:4px 0 12px;color:var(--cocoa);font-size:clamp(26px,7vw,36px);line-height:1}
.theme-card .eyebrow{color:var(--leaf-dark)}
.theme-close{position:absolute;top:12px;right:12px;width:38px;height:38px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--cocoa);font-size:24px;line-height:1;display:grid;place-items:center}
.theme-mode-row,.theme-swatch-grid{display:grid;gap:10px}
.theme-mode-row{grid-template-columns:repeat(2,minmax(0,1fr));margin:12px 0}
.theme-mode-row button,.theme-swatch-grid button{min-height:46px;border:1px solid var(--line);border-radius:12px;background:rgba(246,251,245,.92);color:var(--cocoa);font-weight:900}
.theme-mode-row button.active,.theme-swatch-grid button.active{border-color:transparent;background:var(--leaf-dark);color:#fff;box-shadow:0 12px 24px rgba(38,51,44,.16)}
.theme-swatch-grid{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:10px}
.theme-swatch-grid button{display:flex;align-items:center;justify-content:center;gap:8px}
.theme-swatch{width:18px;height:18px;border-radius:999px;background:var(--swatch);box-shadow:inset 0 0 0 3px rgba(255,255,255,.75),0 0 0 1px rgba(38,51,44,.14)}
.theme-note{margin:14px 0 0;color:var(--muted);font-size:13px;font-weight:800;text-align:center}
body.dark .theme-card{background:rgba(18,27,22,.97);border-color:rgba(220,235,215,.14);color:#f5fff7}
body.dark .theme-card h2,body.dark .theme-mode-row button,body.dark .theme-swatch-grid button,body.dark .theme-close{color:#f5fff7}
body.dark .theme-mode-row button,body.dark .theme-swatch-grid button,body.dark .theme-close{background:rgba(255,255,255,.06);border-color:rgba(220,235,215,.14)}
body.dark .theme-note{color:#cfe7d2}
.profile-tab-panel[hidden]{display:none!important}
.profile-tabs [data-profile-tab]{cursor:pointer}
.profile-tabs [data-profile-tab][aria-selected="true"]{background:var(--leaf-dark)!important;color:#fff!important}
@media(max-width:720px){.theme-quick-button{min-height:40px;padding:0 10px}.theme-quick-button span{font-size:12px}.theme-panel{align-items:end;padding:12px}.theme-card{border-radius:18px 18px 10px 10px;padding:18px}.theme-mode-row,.theme-swatch-grid{grid-template-columns:1fr}.theme-mode-row button,.theme-swatch-grid button{min-height:44px}.theme-note{text-align:left}}
        `;
        document.head.appendChild(style);
    }

    function ensurePanel() {
        let panel = document.getElementById(panelId);

        if (panel) {
            return panel;
        }

        panel = document.createElement("div");
        panel.id = panelId;
        panel.className = "theme-panel";
        panel.hidden = true;
        panel.innerHTML = [
            '<div class="theme-card" role="dialog" aria-modal="true" aria-labelledby="themePanelTitle">',
            '<button class="theme-close" type="button" data-theme-close aria-label="Cerrar">&times;</button>',
            '<span class="eyebrow">Personalizar</span>',
            '<h2 id="themePanelTitle">Tema Huellitas</h2>',
            '<div class="theme-mode-row" aria-label="Modo visual">',
            '<button type="button" data-theme-mode="light">Claro</button>',
            '<button type="button" data-theme-mode="dark">Oscuro</button>',
            '</div>',
            '<div class="theme-swatch-grid" aria-label="Colores">',
            Object.keys(palettes).map((key) => '<button type="button" data-theme-accent="' + key + '"><span class="theme-swatch" style="--swatch:' + palettes[key].leaf + '"></span>' + palettes[key].label + '</button>').join(""),
            '</div>',
            '<p class="theme-note">Se guarda en este navegador.</p>',
            '</div>'
        ].join("");

        document.body.appendChild(panel);
        panel.addEventListener("click", (event) => {
            if (event.target === panel || event.target.closest("[data-theme-close]")) {
                closePanel();
            }
        });

        panel.querySelectorAll("[data-theme-mode]").forEach((button) => {
            button.addEventListener("click", () => {
                localStorage.setItem(themeKey, button.dataset.themeMode);
                refreshSettings();
                updatePanelState();
            });
        });

        panel.querySelectorAll("[data-theme-accent]").forEach((button) => {
            button.addEventListener("click", () => {
                const settings = readSettings();
                settings.accent = button.dataset.themeAccent;
                saveSettings(settings);
                refreshSettings();
                updatePanelState();
            });
        });

        return panel;
    }

    function updatePanelState() {
        const panel = document.getElementById(panelId);
        const settings = readSettings();
        const currentMode = localStorage.getItem(themeKey) || "light";

        if (!panel) {
            return;
        }

        panel.querySelectorAll("[data-theme-mode]").forEach((button) => {
            button.classList.toggle("active", button.dataset.themeMode === currentMode);
        });

        panel.querySelectorAll("[data-theme-accent]").forEach((button) => {
            button.classList.toggle("active", button.dataset.themeAccent === settings.accent);
        });
    }

    function openPanel() {
        const panel = ensurePanel();
        updatePanelState();
        panel.hidden = false;
    }

    function closePanel() {
        const panel = document.getElementById(panelId);

        if (panel) {
            panel.hidden = true;
        }
    }

    function addThemeButtons() {
        document.querySelectorAll(".nav-actions").forEach((actions) => {
            if (actions.querySelector("[data-huellitas-theme-open]")) {
                return;
            }

            const button = document.createElement("button");
            button.className = "icon-button theme-quick-button";
            button.type = "button";
            button.dataset.huellitasThemeOpen = "true";
            button.setAttribute("aria-label", "Cambiar tema y colores");
            button.title = "Cambiar tema y colores";
            button.innerHTML = '<span>Tema</span><b class="theme-quick-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></b>';
            button.addEventListener("click", openPanel);
            actions.insertBefore(button, actions.firstChild);
        });
    }

    function activateProfileTab(tabButton) {
        const profileWrap = tabButton.closest("[data-global-profile]");
        const tabName = tabButton.dataset.profileTab;

        if (!profileWrap || !tabName) {
            return;
        }

        profileWrap.querySelectorAll("[data-profile-tab]").forEach((tab) => {
            const active = tab.dataset.profileTab === tabName;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", active ? "true" : "false");
        });

        profileWrap.querySelectorAll("[data-profile-panel]").forEach((panel) => {
            const active = panel.dataset.profilePanel === tabName;
            panel.hidden = !active;
            panel.classList.toggle("active", active);
        });
    }

    function prepareProfileTabs() {
        document.querySelectorAll("[data-profile-tab]").forEach((tab) => {
            tab.type = "button";
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-selected", tab.classList.contains("active") ? "true" : "false");
        });
    }

    function wrapProfileMount() {
        if (typeof window.huellitasMountProfile !== "function" || window.huellitasMountProfile.themeProfileWrapped) {
            return;
        }

        const originalMount = window.huellitasMountProfile;
        window.huellitasMountProfile = function () {
            const result = originalMount.apply(this, arguments);
            window.setTimeout(() => {
                prepareProfileTabs();
                addThemeButtons();
            }, 0);
            return result;
        };
        window.huellitasMountProfile.themeProfileWrapped = true;
    }

    let scheduled = false;

    function scheduleUiRefresh() {
        if (scheduled) {
            return;
        }

        scheduled = true;
        window.setTimeout(() => {
            scheduled = false;
            addThemeButtons();
            prepareProfileTabs();
            wrapProfileMount();
        }, 80);
    }

    document.addEventListener("click", (event) => {
        const tabButton = event.target.closest && event.target.closest("[data-profile-tab]");

        if (!tabButton) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }
        activateProfileTab(tabButton);
    }, true);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePanel();
        }
    });

    onReady(() => {
        injectStyles();
        refreshSettings();
        addThemeButtons();
        prepareProfileTabs();
        wrapProfileMount();
        ensurePanel();

        if (document.body && window.MutationObserver) {
            new MutationObserver(scheduleUiRefresh).observe(document.body, { childList: true, subtree: true });
        }

        window.setTimeout(scheduleUiRefresh, 300);
        window.setTimeout(scheduleUiRefresh, 1200);
    });

    try {
        console.info("Huellitas - Todos los derechos reservados. No copiar, distribuir ni usar sin autorizacion.");
    } catch (error) {}
})();
