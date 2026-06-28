/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Inventario visual conectado al estado real de la mascota.
 */
(function () {
    const cssVersion = "20260628-treasure-v6";
    const slotLabels = { head: "Cabeza", neck: "Collar", toy: "Juguete", bed: "Descanso" };
    let activeFilter = "all";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function loadStyles() {
        if (document.getElementById("huellitasTreasureUiCss")) {
            return;
        }

        const link = document.createElement("link");
        link.id = "huellitasTreasureUiCss";
        link.rel = "stylesheet";
        link.href = "huellitas-treasure-ui.css?v=" + cssVersion;
        document.head.appendChild(link);
    }

    function itemForSlot(slot) {
        if (typeof state === "undefined" || !state.equipped || typeof getItem !== "function") {
            return null;
        }

        return getItem(state.equipped[slot]);
    }

    function ownedItems() {
        if (typeof inventory === "undefined" || !Array.isArray(inventory) || typeof getItem !== "function") {
            return [];
        }

        return inventory.map(function (id) {
            return getItem(id);
        }).filter(Boolean);
    }

    function iconMarkup(item) {
        if (!item) {
            return '<span class="treasure-empty-icon" aria-hidden="true">+</span>';
        }

        if (typeof getItemIconMarkup === "function") {
            return getItemIconMarkup(item, true);
        }

        return '<span class="shop-static-icon" aria-hidden="true">' + (item.emoji || "&#127873;") + '</span>';
    }

    function buildShell(section, status, shopGrid, inventoryList, cartPanel) {
        const shell = document.createElement("div");
        shell.className = "treasure-shell";
        shell.innerHTML = [
            '<header class="treasure-topbar">',
            '<div class="treasure-title">',
            '<a class="treasure-back" href="#zonaMichi" aria-label="Volver a mi mascota">&#8592;</a>',
            '<div class="treasure-title-copy"><span>Compra y equipa</span><strong>Tienda de tesoros</strong></div>',
            '</div>',
            '<div data-treasure-status></div>',
            '</header>',
            '<div class="treasure-mode-switch" role="tablist" aria-label="Tienda e inventario">',
            '<button type="button" data-treasure-mode="inventory" role="tab">Inventario</button>',
            '<button type="button" data-treasure-mode="shop" role="tab">Tienda</button>',
            '</div>',
            '<div class="treasure-workspace">',
            '<section class="treasure-stage" aria-label="Vestuario de la mascota">',
            '<div class="treasure-sign">&#128062; INVENTARIO &#128062;</div>',
            '<div class="treasure-awning" aria-hidden="true"></div>',
            '<div class="treasure-side-label">VESTUARIO<br>LISTO PARA EQUIPAR</div>',
            '<div class="treasure-shelf" aria-hidden="true"><span>&#127793;</span><span>&#129526;</span></div>',
            '<div class="treasure-chest" aria-hidden="true">&#129513;</div>',
            '<div class="treasure-rug" aria-hidden="true"></div>',
            '<div class="treasure-environment-layer" data-treasure-environment hidden></div>',
            '<div class="treasure-pet-mount">',
            '<span class="pet-sprite-stack treasure-pet-sprite" role="img" aria-label="Perrito personalizado con sus accesorios">',
            '<span class="pet-base" aria-hidden="true"></span>',
            '<span class="pet-collar-sprite" data-treasure-collar aria-hidden="true" hidden></span>',
            '<span class="pet-crown-sprite" data-treasure-crown aria-hidden="true" hidden></span>',
            '<span class="pet-ball-sprite" data-treasure-ball aria-hidden="true" hidden></span>',
            '<span class="treasure-emoji-layer treasure-bow-layer" data-treasure-bow aria-hidden="true" hidden>&#127872;</span>',
            '<span class="treasure-emoji-layer treasure-plaque-layer" data-treasure-plaque aria-hidden="true" hidden>&#127991;&#65039;</span>',
            '</span>',
            '</div>',
            '<div class="treasure-pet-caption" data-treasure-pet-name>Tu companero</div>',
            '</section>',
            '<section class="treasure-panel treasure-inventory-panel" data-treasure-panel="inventory">',
            '<div class="treasure-equipped"><h3>&#128062; Objetos equipados &#128062;</h3><div class="treasure-equipped-grid" data-treasure-equipped></div></div>',
            '<div class="treasure-tabs" role="tablist" aria-label="Categorias del inventario">',
            '<button type="button" data-treasure-filter="all">Todo</button>',
            '<button type="button" data-treasure-filter="head">Cabeza</button>',
            '<button type="button" data-treasure-filter="neck">Collar</button>',
            '<button type="button" data-treasure-filter="toy">Juguete</button>',
            '<button type="button" data-treasure-filter="bed">Descanso</button>',
            '</div>',
            '<div class="treasure-inventory-scroll" data-treasure-inventory></div>',
            '<div class="treasure-save-row"><span class="treasure-save-status" data-treasure-save-status>Los cambios se ven al instante.</span><button type="button" data-treasure-save>Guardar cambios</button></div>',
            '</section>',
            '</div>',
            '<section class="treasure-panel treasure-shop-panel" data-treasure-panel="shop">',
            '<div class="treasure-shop-heading"><div><h3>Tienda de tesoros</h3><p>Compra accesorios con patitas para tu perrito.</p></div><span data-treasure-cart-count aria-hidden="true">&#128722;</span></div>',
            '<div data-treasure-shop></div>',
            '<div data-treasure-cart></div>',
            '</section>'
        ].join("");

        shell.querySelector("[data-treasure-status]").appendChild(status);
        shell.querySelector("[data-treasure-inventory]").appendChild(inventoryList);
        shell.querySelector("[data-treasure-shop]").appendChild(shopGrid);
        shell.querySelector("[data-treasure-cart]").appendChild(cartPanel);
        section.replaceChildren(shell);
        return shell;
    }

    function setMode(mode) {
        const next = mode === "shop" ? "shop" : "inventory";

        document.querySelectorAll("[data-treasure-mode]").forEach(function (button) {
            const selected = button.dataset.treasureMode === next;
            button.classList.toggle("active", selected);
            button.setAttribute("aria-selected", selected ? "true" : "false");
        });

        document.querySelectorAll("[data-treasure-panel]").forEach(function (panel) {
            panel.hidden = panel.dataset.treasurePanel !== next;
        });

        const workspace = document.querySelector(".treasure-workspace");
        if (workspace) {
            workspace.classList.toggle("shop-mode", next === "shop");
        }
    }

    function renderInventoryView() {
        const list = document.getElementById("inventoryList");
        if (!list || typeof state === "undefined") {
            return;
        }

        const items = ownedItems().filter(function (item) {
            return activeFilter === "all" || item.slot === activeFilter;
        });

        if (!items.length) {
            list.innerHTML = [
                '<div class="empty-state">',
                '<strong>' + (activeFilter === "all" ? "A&uacute;n no hay tesoros." : "No tienes objetos en esta categoria.") + '</strong>',
                '<span>Visita la tienda para conseguir accesorios.</span>',
                '</div>'
            ].join("");
            return;
        }

        list.innerHTML = items.map(function (item) {
            const equipped = state.equipped[item.slot] === item.id;
            return [
                '<article class="inventory-item treasure-inventory-item' + (equipped ? " equipped" : "") + '" data-slot="' + item.slot + '">',
                iconMarkup(item),
                '<div class="treasure-item-copy">',
                '<strong>' + item.name + '</strong>',
                '<small>' + slotLabels[item.slot] + '</small>',
                '<p>' + item.desc + '</p>',
                '</div>',
                '<button type="button" onclick="equiparItem(\'' + item.id + '\')">' + (equipped ? "Quitar" : "Equipar") + '</button>',
                '</article>'
            ].join("");
        }).join("");
    }

    function renderEquipped() {
        const target = document.querySelector("[data-treasure-equipped]");
        if (!target) {
            return;
        }

        target.innerHTML = Object.keys(slotLabels).map(function (slot) {
            const item = itemForSlot(slot);
            return [
                '<div class="treasure-equipped-item">',
                iconMarkup(item),
                '<strong>' + (item ? item.name : "Vacio") + '</strong>',
                '<small>' + slotLabels[slot] + '</small>',
                '</div>'
            ].join("");
        }).join("");
    }

    function renderStage() {
        if (typeof state === "undefined") {
            return;
        }

        const head = itemForSlot("head");
        const neck = itemForSlot("neck");
        const toy = itemForSlot("toy");
        const bed = itemForSlot("bed");
        const crown = document.querySelector("[data-treasure-crown]");
        const bow = document.querySelector("[data-treasure-bow]");
        const collar = document.querySelector("[data-treasure-collar]");
        const plaque = document.querySelector("[data-treasure-plaque]");
        const ball = document.querySelector("[data-treasure-ball]");
        const environment = document.querySelector("[data-treasure-environment]");
        const name = document.querySelector("[data-treasure-pet-name]");

        if (!crown || !bow || !collar || !plaque || !ball || !environment || !name) {
            return;
        }

        crown.hidden = !(head && head.id === "corona-sol");
        bow.hidden = !(head && head.id === "mono-rojo");
        collar.hidden = !(neck && neck.id === "collar-verde");
        plaque.hidden = !(neck && neck.id === "placa-huella");
        ball.hidden = !(toy && toy.id === "pelota");

        if (bed) {
            environment.hidden = false;
            environment.dataset.kind = bed.id;
            environment.innerHTML = bed.emoji || (bed.id === "casita" ? "&#127968;" : "&#128719;&#65039;");
        } else {
            environment.hidden = true;
            environment.dataset.kind = "";
            environment.textContent = "";
        }

        name.textContent = (state.name || "Tu companero") + " - listo para equipar";
    }

    function updateCartCount() {
        const target = document.querySelector("[data-treasure-cart-count]");
        if (!target || typeof cart === "undefined") {
            return;
        }

        target.innerHTML = cart.length ? "&#128722; " + cart.length : "&#128722;";
        target.setAttribute("aria-label", cart.length + " objetos en el carrito");
    }

    function updateUi() {
        renderInventoryView();
        renderEquipped();
        renderStage();
        updateCartCount();
    }

    function setFilter(filter) {
        activeFilter = Object.prototype.hasOwnProperty.call(slotLabels, filter) ? filter : "all";

        document.querySelectorAll("[data-treasure-filter]").forEach(function (button) {
            const selected = button.dataset.treasureFilter === activeFilter;
            button.classList.toggle("active", selected);
            button.setAttribute("aria-selected", selected ? "true" : "false");
        });

        renderInventoryView();
    }

    function wrapRenderAll() {
        if (window.huellitasTreasureRenderWrapped || typeof window.renderAll !== "function") {
            return;
        }

        window.huellitasTreasureRenderWrapped = true;
        const original = window.renderAll;
        window.renderAll = function () {
            const result = original.apply(this, arguments);
            updateUi();
            return result;
        };
    }

    function bind(shell) {
        shell.querySelectorAll("[data-treasure-mode]").forEach(function (button) {
            button.addEventListener("click", function () {
                setMode(button.dataset.treasureMode);
            });
        });

        shell.querySelectorAll("[data-treasure-filter]").forEach(function (button) {
            button.addEventListener("click", function () {
                setFilter(button.dataset.treasureFilter);
            });
        });

        const save = shell.querySelector("[data-treasure-save]");
        const status = shell.querySelector("[data-treasure-save-status]");
        save.addEventListener("click", function () {
            if (typeof saveState === "function") {
                saveState();
            }
            status.textContent = "Cambios guardados para " + (typeof state !== "undefined" ? state.name : "tu perrito") + ".";
            save.textContent = "Guardado";
            window.setTimeout(function () {
                save.textContent = "Guardar cambios";
                status.textContent = "Los cambios se ven al instante.";
            }, 1800);
        });

        const cartPanel = shell.querySelector(".cart-panel");
        if (cartPanel && window.MutationObserver) {
            new MutationObserver(updateCartCount).observe(cartPanel, { childList: true, subtree: true });
        }
    }

    function enhance() {
        const shopGrid = document.getElementById("shopGrid");
        const inventoryList = document.getElementById("inventoryList");
        const cartPanel = document.querySelector(".cart-panel");
        const status = document.querySelector(".shop-status");

        if (!shopGrid || !inventoryList || !cartPanel || !status) {
            return;
        }

        const section = shopGrid.closest("section.section");
        if (!section || section.dataset.treasureEnhanced === "true") {
            return;
        }

        section.dataset.treasureEnhanced = "true";
        section.classList.add("treasure-section");
        loadStyles();

        const shell = buildShell(section, status, shopGrid, inventoryList, cartPanel);
        bind(shell);
        wrapRenderAll();
        setFilter("all");
        setMode(window.matchMedia("(max-width: 700px)").matches ? "shop" : "inventory");

        if (typeof window.renderAll === "function") {
            window.renderAll();
        } else {
            updateUi();
        }
    }

    onReady(enhance);
    window.addEventListener("pageshow", function () {
        window.setTimeout(function () {
            enhance();
            updateUi();
        }, 80);
    });
})();
