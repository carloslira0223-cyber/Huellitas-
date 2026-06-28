/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Iconos estaticos para tienda e inventario.
 */
(function () {
    const styleId = "huellitasShopIconsStyles";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(text) {
        return String(text || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function iconFromText(text) {
        const clean = normalize(text);

        if (clean.includes("corona")) return "👑";
        if (clean.includes("mono") || clean.includes("moño")) return "🎀";
        if (clean.includes("collar")) return "🟢";
        if (clean.includes("placa")) return "🏷️";
        if (clean.includes("pelota")) return "⚽";
        if (clean.includes("camita")) return "🛏️";
        if (clean.includes("casita")) return "🏠";
        return "🎁";
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.shop-sprite-preview,.item-sprite-icon{display:none!important}
.shop-static-icon,.inventory-emoji-icon{display:grid!important;place-items:center;flex:0 0 auto;border-radius:12px;background:rgba(207,231,244,.34);box-shadow:inset 0 0 0 1px rgba(255,255,255,.32);line-height:1}
.shop-static-icon{width:64px;height:64px;font-size:42px}
.cart-item>.shop-static-icon,.inventory-item>.shop-static-icon,.inventory-emoji-icon{width:42px;height:42px;font-size:25px}
body.dark .shop-static-icon,body.dark .inventory-emoji-icon{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(220,235,215,.12)}
@media(max-width:520px){
    .shop-grid{grid-template-columns:1fr!important}
    .shop-item{grid-template-columns:1fr!important;gap:10px!important;padding:12px!important;overflow:hidden!important;text-align:center!important}
    .shop-item>.shop-emoji{grid-row:auto!important;min-height:76px!important;width:100%!important}
    .shop-item .shop-static-icon{width:56px!important;height:56px!important;margin:0 auto!important;font-size:34px!important}
    .shop-item>div:not(.shop-emoji){min-width:0!important;display:grid!important;gap:5px!important}
    .shop-item h3{margin:0!important;font-size:clamp(22px,8vw,30px)!important;line-height:1.05!important;overflow-wrap:anywhere!important}
    .shop-item p{margin:0!important;font-size:14px!important;line-height:1.35!important;overflow-wrap:anywhere!important}
    .shop-item strong{margin:2px 0 0!important;font-size:clamp(18px,7vw,25px)!important;line-height:1.1!important}
    .shop-item button{grid-column:1!important;width:100%!important;min-width:0!important;min-height:44px!important;white-space:normal!important}
}
        `;
        document.head.appendChild(style);
    }

    function makeIcon(text) {
        const icon = document.createElement("span");
        icon.className = "shop-static-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = iconFromText(text);
        return icon;
    }

    function replaceSprite(preview) {
        const container = preview.closest(".shop-item,.cart-item,.inventory-item") || preview.parentElement;

        if (!container || preview.dataset.staticIconDone === "true") {
            return;
        }

        preview.dataset.staticIconDone = "true";
        preview.replaceWith(makeIcon(container.textContent));
    }

    function polishShopIcons() {
        document.querySelectorAll(".shop-sprite-preview,.item-sprite-icon").forEach(replaceSprite);

        document.querySelectorAll(".shop-emoji").forEach((wrap) => {
            if (wrap.querySelector(".shop-static-icon") || !wrap.closest(".shop-item")) {
                return;
            }

            const icon = makeIcon(wrap.closest(".shop-item").textContent);
            wrap.textContent = "";
            wrap.appendChild(icon);
        });
    }

    function overrideIconMarkup() {
        if (window.huellitasShopIconsOverrideReady) {
            return;
        }

        window.huellitasShopIconsOverrideReady = true;
        window.getItemIconMarkup = function (item, compact) {
            const label = item ? (item.name || item.id || item.emoji || "") : "";
            const sizeClass = compact ? " shop-static-icon-compact" : "";
            return '<span class="shop-static-icon' + sizeClass + '" aria-hidden="true">' + iconFromText(label) + '</span>';
        };
    }

    function observe() {
        if (document.body && !document.body.dataset.shopIconsObserver) {
            document.body.dataset.shopIconsObserver = "true";
            new MutationObserver(polishShopIcons).observe(document.body, { childList: true, subtree: true });
        }
    }

    function init() {
        injectStyles();
        overrideIconMarkup();
        polishShopIcons();
        observe();
    }

    onReady(() => {
        init();
        window.setTimeout(init, 250);
        window.setTimeout(init, 1000);
    });
    window.addEventListener("load", init);
})();
