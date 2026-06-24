/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const spriteUrl = "assets/sprites/Sprite-0001-Sheet.png";
    const styleId = "huellitasPetColorStyles";
    const panelId = "petColorPanel";
    const statusId = "petColorStatus";
    const cache = {};
    let baseImage = null;
    let baseImagePromise = null;

    const colors = {
        cafe: { label: "Caf&eacute; cl&aacute;sico", swatch: "#a66a3a", light: "#c48b55", shade: "#7a4524" },
        negro: { label: "Negro", swatch: "#313336", light: "#5a5d62", shade: "#1c1d20" },
        blanco: { label: "Blanco", swatch: "#f6f0e8", light: "#ffffff", shade: "#d8d0c8" },
        azul: { label: "Azul", swatch: "#58aee8", light: "#8ed2ff", shade: "#2b73ad" },
        rosa: { label: "Rosa", swatch: "#ef8eb3", light: "#ffc0d5", shade: "#c64f7e" },
        morado: { label: "Morado", swatch: "#9670dc", light: "#c0a3ff", shade: "#6548a8" },
        verde: { label: "Verde", swatch: "#72c985", light: "#a6e5b4", shade: "#3c9456" },
        amarillo: { label: "Amarillo", swatch: "#f1c84f", light: "#ffe58c", shade: "#bd8d1f" }
    };

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function isGamesPage() {
        return Boolean(document.getElementById("zonaMichi") || document.getElementById("petSpriteStack"));
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.pet-base,.mini-pet-base,.sprite-preview-base{background-image:var(--huellitas-pet-sprite,url("${spriteUrl}"))!important;background-repeat:no-repeat!important;background-size:320px 64px!important}
.pet-color-panel{margin-top:16px;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(246,251,245,.84);box-shadow:0 12px 24px rgba(38,51,44,.08)}
.pet-color-panel strong{display:block;color:var(--cocoa);font-size:14px;margin-bottom:4px}
.pet-color-panel p{margin:0 0 12px;color:var(--muted);font-size:13px;font-weight:800;line-height:1.35}
.pet-color-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.pet-color-option{min-height:48px;padding:8px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--cocoa);box-shadow:none;display:grid;grid-template-columns:18px minmax(0,1fr);align-items:center;gap:7px;text-align:left;font-size:12px;font-weight:900;line-height:1.1}
.pet-color-option::before{content:"";width:18px;height:18px;border-radius:999px;background:var(--pet-color-swatch);box-shadow:inset 0 0 0 2px rgba(255,255,255,.7),0 0 0 1px rgba(38,51,44,.16)}
.pet-color-option.active{background:var(--leaf-dark);color:#fff;border-color:transparent}
.pet-color-status{min-height:18px;margin-top:10px!important;margin-bottom:0!important;color:var(--leaf-dark)!important}
body.dark .pet-color-panel{background:rgba(255,255,255,.06);border-color:rgba(220,235,215,.14)}
body.dark .pet-color-panel strong,body.dark .pet-color-option{color:#f5fff7}
body.dark .pet-color-option{background:rgba(255,255,255,.07);border-color:rgba(220,235,215,.14)}
body.dark .pet-color-option.active{background:var(--leaf);color:#08120d}
body.dark .pet-color-status{color:#cfe7d2!important}
@media(max-width:720px){.pet-color-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pet-color-option{min-height:46px}}
        `;
        document.head.appendChild(style);
    }

    function normalizeColor(color) {
        return colors[color] ? color : "";
    }

    function getFallbackProfileId() {
        try {
            const session = JSON.parse(localStorage.getItem("sesion"));
            if (session && session.email) {
                return session.email;
            }
        } catch (error) {}

        let guest = localStorage.getItem("huellitasInvitadoId");
        if (!guest) {
            guest = "invitado-" + Date.now();
            localStorage.setItem("huellitasInvitadoId", guest);
        }
        return guest;
    }

    function getPetStateKey() {
        try {
            if (typeof petStateKey !== "undefined") {
                return petStateKey;
            }
        } catch (error) {}

        return "huellitasMichi:" + encodeURIComponent(getFallbackProfileId()) + ":estado";
    }

    function getActivePetState() {
        try {
            if (typeof state !== "undefined") {
                return state;
            }
        } catch (error) {}

        try {
            return JSON.parse(localStorage.getItem(getPetStateKey())) || {};
        } catch (error) {
            return {};
        }
    }

    function saveActivePetState(nextState) {
        try {
            if (typeof state !== "undefined") {
                state.petColor = nextState.petColor || "";
                if (typeof saveState === "function") {
                    saveState();
                    return;
                }
            }
        } catch (error) {}

        localStorage.setItem(getPetStateKey(), JSON.stringify(nextState));
    }

    function loadPetColor() {
        return normalizeColor(getActivePetState().petColor);
    }

    function savePetColor(color) {
        const normalized = normalizeColor(color);
        const nextState = getActivePetState();
        nextState.petColor = normalized;
        saveActivePetState(nextState);
        return normalized;
    }

    function hexToRgb(hex) {
        const clean = hex.replace("#", "");
        return {
            r: parseInt(clean.slice(0, 2), 16),
            g: parseInt(clean.slice(2, 4), 16),
            b: parseInt(clean.slice(4, 6), 16)
        };
    }

    function isWhiteBodyPixel(r, g, b, a) {
        if (a < 255) {
            return false;
        }

        return (r === 255 && g === 255 && b === 255)
            || (r === 226 && g === 218 && b === 218);
    }

    function loadBaseImage() {
        if (baseImage) {
            return Promise.resolve(baseImage);
        }

        if (baseImagePromise) {
            return baseImagePromise;
        }

        baseImagePromise = new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                baseImage = image;
                resolve(image);
            };
            image.onerror = reject;
            image.src = spriteUrl;
        });

        return baseImagePromise;
    }

    function recolorSprite(colorId) {
        const color = colors[colorId];
        if (!color) {
            return Promise.resolve("");
        }

        if (cache[colorId]) {
            return Promise.resolve(cache[colorId]);
        }

        return loadBaseImage().then((image) => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            const light = hexToRgb(color.light);
            const shade = hexToRgb(color.shade);

            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;
            context.drawImage(image, 0, 0);

            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;

            for (let index = 0; index < data.length; index += 4) {
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];

                if (!isWhiteBodyPixel(r, g, b, a)) {
                    continue;
                }

                const target = r === 255 ? light : shade;
                data[index] = target.r;
                data[index + 1] = target.g;
                data[index + 2] = target.b;
            }

            context.putImageData(frame, 0, 0);
            cache[colorId] = canvas.toDataURL("image/png");
            return cache[colorId];
        });
    }

    function setActiveButton(colorId) {
        document.querySelectorAll("[data-pet-color-option]").forEach((button) => {
            button.classList.toggle("active", button.dataset.petColorOption === colorId);
            button.setAttribute("aria-pressed", button.dataset.petColorOption === colorId ? "true" : "false");
        });
    }

    function applyPetColor(colorId) {
        const normalized = normalizeColor(colorId);
        setActiveButton(normalized);

        if (!normalized) {
            document.documentElement.style.removeProperty("--huellitas-pet-sprite");
            return Promise.resolve();
        }

        return recolorSprite(normalized).then((dataUrl) => {
            document.documentElement.style.setProperty("--huellitas-pet-sprite", 'url("' + dataUrl + '")');
        }).catch(() => {
            document.documentElement.style.removeProperty("--huellitas-pet-sprite");
        });
    }

    function buildPanel() {
        const nameRow = document.querySelector("#zonaMichi .pet-name-row");
        if (!nameRow || document.getElementById(panelId)) {
            return;
        }

        const panel = document.createElement("div");
        panel.className = "pet-color-panel";
        panel.id = panelId;
        panel.innerHTML = [
            "<strong>Color de tu compa&ntilde;ero</strong>",
            "<p>Se guarda solo para este perfil.</p>",
            '<div class="pet-color-grid" aria-label="Color de tu compa&ntilde;ero">',
            Object.keys(colors).map((key) => {
                return '<button class="pet-color-option" type="button" data-pet-color-option="' + key + '" style="--pet-color-swatch:' + colors[key].swatch + '">' + colors[key].label + '</button>';
            }).join(""),
            "</div>",
            '<p class="pet-color-status" id="' + statusId + '" aria-live="polite"></p>'
        ].join("");

        nameRow.insertAdjacentElement("afterend", panel);

        panel.querySelectorAll("[data-pet-color-option]").forEach((button) => {
            button.addEventListener("click", () => {
                const colorId = savePetColor(button.dataset.petColorOption);
                applyPetColor(colorId).then(() => {
                    const status = document.getElementById(statusId);
                    if (status) {
                        status.innerHTML = "Color guardado para tu compa&ntilde;ero &#128062;";
                    }

                    try {
                        if (typeof showPetThought === "function") {
                            showPetThought("Color guardado para tu companero.", true);
                        } else if (typeof celebrarMichi === "function") {
                            celebrarMichi("Color guardado para tu companero.");
                        }
                    } catch (error) {}

                    try {
                        if (typeof renderMiniPetSprites === "function") {
                            renderMiniPetSprites();
                        }
                        if (typeof restartPetSpriteAnimation === "function") {
                            restartPetSpriteAnimation();
                        }
                    } catch (error) {}
                });
            });
        });
    }

    function refreshPetColorUi() {
        if (!isGamesPage()) {
            return;
        }

        injectStyles();
        buildPanel();
        applyPetColor(loadPetColor());
    }

    onReady(() => {
        refreshPetColorUi();
        window.addEventListener("load", refreshPetColorUi);
        window.addEventListener("pageshow", refreshPetColorUi);
        window.addEventListener("hashchange", () => window.setTimeout(refreshPetColorUi, 80));
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                refreshPetColorUi();
            }
        });

        if (document.body && window.MutationObserver) {
            new MutationObserver(() => window.setTimeout(refreshPetColorUi, 60))
                .observe(document.body, { childList: true, subtree: true });
        }
    });
})();
