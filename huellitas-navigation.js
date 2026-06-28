(function () {
    const items = {
        "pagina.html": { label: "Inicio", icon: "inicio", description: "Vista principal" },
        "jueguitos.html": { label: "Juegos", icon: "juegos", description: "Gana patitas" },
        "directorio.html": { label: "Directorio", icon: "directorio", description: "Busca lugares" },
        "areas.html": { label: "Áreas", icon: "areas", description: "Conoce espacios" },
        "domesticos.html": { label: "Mascotas", icon: "mascotas", description: "Cuidados y tipos" },
        "leyes.html": { label: "Leyes", icon: "leyes", description: "Protección animal" },
        "equipo.html": { label: "Equipo", icon: "equipo", description: "Quiénes somos" },
        "presentacion.html": { label: "Presentación", icon: "presentacion", description: "Proyecto escolar" },
        "mascotas_perdidas.html": { label: "Perdidas", icon: "perdidas", description: "Reportes" },
        "adopcion_huellitas.html": { label: "Adopciones", icon: "adopciones", description: "Mascotas listas" },
        "adoptar.html": { label: "Adoptar", icon: "adoptar", description: "Solicitud" },
        "mi_adopcion.html": { label: "Mi adopción", icon: "adoptar", description: "Seguimiento" }
    };

    function fileName(href) {
        return String(href || "").split("#")[0].split("?")[0].split("/").pop().toLowerCase();
    }

    function currentPage() {
        return fileName(window.location.pathname) || "pagina.html";
    }

    function createIcon(icon, label) {
        const wrap = document.createElement("span");
        wrap.className = "huellitas-nav-icon";
        wrap.setAttribute("aria-hidden", "true");

        const light = document.createElement("img");
        light.className = "huellitas-icon-light";
        light.src = "assets/icons/nav/light/" + icon + ".png";
        light.alt = "";
        light.width = 44;
        light.height = 44;

        const dark = document.createElement("img");
        dark.className = "huellitas-icon-dark";
        dark.src = "assets/icons/nav/dark/" + icon + ".png";
        dark.alt = "";
        dark.width = 44;
        dark.height = 44;

        wrap.append(light, dark);
        return wrap;
    }

    function closeMenu(nav) {
        nav.classList.remove("nav-open");
        document.body.classList.remove("mobile-nav-open");
        const toggle = nav.querySelector(".nav-menu-toggle");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
        }
    }

    function ensureLostLink(links) {
        let lost = links.querySelector('a[href^="mascotas_perdidas.html"]');
        if (lost) {
            return lost;
        }

        lost = document.createElement("a");
        lost.className = "nav-link";
        lost.href = "mascotas_perdidas.html";
        lost.textContent = "Perdidas";

        const adoption = links.querySelector('a[href^="adopcion_huellitas.html"]');
        if (adoption) {
            links.insertBefore(lost, adoption);
        } else {
            const tools = links.querySelector(".mobile-menu-tools");
            links.insertBefore(lost, tools || null);
        }

        return lost;
    }

    function decorateLink(link, index) {
        const key = fileName(link.getAttribute("href"));
        const item = items[key];
        if (!item || link.querySelector(".huellitas-nav-icon")) {
            return;
        }

        link.classList.add("huellitas-nav-item");
        link.classList.toggle("active", key === currentPage());
        link.setAttribute("aria-label", item.label);
        if (key === currentPage()) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }

        if (index >= 6) {
            link.classList.add("huellitas-extra");
        } else {
            link.classList.remove("huellitas-extra");
        }

        const copy = document.createElement("span");
        copy.className = "huellitas-nav-copy";

        const title = document.createElement("strong");
        title.textContent = item.label;

        const description = document.createElement("small");
        description.textContent = item.description;

        copy.append(title, description);
        link.replaceChildren(createIcon(item.icon, item.label), copy);
    }

    function decorateSettings(nav) {
        const button = nav.querySelector("[data-settings-toggle]");
        if (!button || button.querySelector(".huellitas-nav-icon")) {
            return;
        }

        button.textContent = "";
        button.setAttribute("aria-label", "Abrir ajustes");
        button.title = "Ajustes";
        button.appendChild(createIcon("ajustes", "Ajustes"));
    }

    function enhance(nav) {
        const links = nav.querySelector(".nav-links");
        if (!links) {
            return;
        }

        nav.classList.add("huellitas-safe-nav");
        links.classList.add("huellitas-nav-list");
        ensureLostLink(links);

        let header = links.querySelector(".huellitas-mobile-head");
        if (!header) {
            header = document.createElement("div");
            header.className = "huellitas-mobile-head";
            header.innerHTML = [
                '<div class="huellitas-mobile-brand">',
                '<img src="assets/imagenes/logo.png" alt="">',
                '<div><strong>🐾 Huellitas</strong><span>Explora y ayuda a más mascotas</span></div>',
                '</div>',
                '<button type="button" class="huellitas-mobile-close" aria-label="Cerrar menú">&times;</button>'
            ].join("");
            links.insertBefore(header, links.firstChild);
            header.querySelector(".huellitas-mobile-close").addEventListener("click", () => closeMenu(nav));
        }

        function decorateAll() {
            const navLinks = Array.from(links.querySelectorAll(":scope > a.nav-link"));
            navLinks.forEach(decorateLink);
            navLinks.forEach((link) => {
                if (link.dataset.huellitasCloseReady === "true") {
                    return;
                }
                link.dataset.huellitasCloseReady = "true";
                link.addEventListener("click", () => closeMenu(nav));
            });
        }

        decorateAll();
        decorateSettings(nav);

        let more = links.querySelector(".huellitas-more-toggle");
        if (!more) {
            more = document.createElement("button");
            more.type = "button";
            more.className = "huellitas-more-toggle";
            more.textContent = "Mostrar más";
            const tools = links.querySelector(".mobile-menu-tools");
            links.insertBefore(more, tools || null);
            more.addEventListener("click", () => {
                const expanded = links.classList.toggle("huellitas-expanded");
                more.textContent = expanded ? "Mostrar menos" : "Mostrar más";
                more.setAttribute("aria-expanded", expanded ? "true" : "false");
            });
            more.setAttribute("aria-expanded", "false");
        }

        const tools = links.querySelector(".mobile-menu-tools");
        if (tools) {
            const duplicatedSettings = tools.querySelector("[data-mobile-settings]");
            if (duplicatedSettings) {
                duplicatedSettings.hidden = true;
            }
        }

        let scheduled = false;
        const observer = new MutationObserver(() => {
            if (scheduled) {
                return;
            }
            scheduled = true;
            setTimeout(() => {
                scheduled = false;
                decorateAll();
                decorateSettings(nav);
            }, 0);
        });
        observer.observe(links, { childList: true, subtree: true });
    }

    function init() {
        document.querySelectorAll(".site-nav").forEach(enhance);
    }

    const style = document.createElement("style");
    style.id = "huellitas-safe-navigation-styles";
    style.textContent = `
.huellitas-nav-icon {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    display: grid;
    place-items: center;
}

.huellitas-nav-icon img {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
}

.huellitas-icon-dark {
    display: none !important;
}

body.dark .huellitas-icon-light {
    display: none !important;
}

body.dark .huellitas-icon-dark {
    display: block !important;
}

.huellitas-mobile-head,
.huellitas-more-toggle {
    display: none;
}

@media (min-width: 901px) {
    .site-nav.huellitas-safe-nav,
    body.nav-full .site-nav.huellitas-safe-nav {
        display: grid !important;
        grid-template-columns: auto minmax(0, 1fr) auto !important;
        align-items: center;
        gap: 14px;
        padding: 9px clamp(16px, 3vw, 40px);
    }

    .huellitas-safe-nav .nav-menu-toggle {
        display: none !important;
    }

    .huellitas-safe-nav .nav-links.huellitas-nav-list,
    body.nav-full .huellitas-safe-nav .nav-links.huellitas-nav-list {
        grid-column: 2 !important;
        display: flex !important;
        width: 100%;
        min-width: 0;
        flex-wrap: nowrap;
        align-items: stretch;
        justify-content: flex-start;
        gap: 4px;
        padding: 3px 2px 7px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
        scrollbar-color: rgba(108, 75, 196, 0.45) transparent;
    }

    .huellitas-nav-list::-webkit-scrollbar {
        height: 5px;
    }

    .huellitas-nav-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .huellitas-nav-list::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(108, 75, 196, 0.42);
    }

    .huellitas-safe-nav .nav-actions {
        grid-column: 3 !important;
        width: auto;
        flex-wrap: nowrap;
    }

    .huellitas-nav-item {
        width: 76px;
        min-width: 76px;
        min-height: 70px;
        display: flex !important;
        flex: 0 0 76px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 5px 4px !important;
        border: 1px solid transparent !important;
        border-radius: 8px !important;
        color: var(--cocoa) !important;
        background: transparent !important;
        box-shadow: none !important;
        text-align: center;
        transition: color 160ms ease, background 160ms ease, transform 160ms ease !important;
    }

    .huellitas-nav-item .huellitas-nav-icon {
        width: 38px;
        height: 38px;
        flex-basis: 38px;
        transition: transform 160ms ease;
    }

    .huellitas-nav-copy {
        min-width: 0;
        display: block;
    }

    .huellitas-nav-copy strong {
        display: block;
        overflow: hidden;
        color: inherit;
        font-size: 11px;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .huellitas-nav-copy small {
        display: none;
    }

    .huellitas-nav-item:hover {
        color: #5b3fa3 !important;
        background: rgba(108, 75, 196, 0.08) !important;
        transform: none !important;
    }

    .huellitas-nav-item:hover .huellitas-nav-icon {
        transform: translateY(-2px);
    }

    .huellitas-nav-item.active {
        color: #ffffff !important;
        background: #6c4bc4 !important;
        box-shadow: 0 7px 16px rgba(91, 63, 163, 0.18) !important;
    }

    .huellitas-nav-item.active .huellitas-icon-light {
        display: none !important;
    }

    .huellitas-nav-item.active .huellitas-icon-dark {
        display: block !important;
    }

    body.dark .huellitas-nav-item {
        color: #f2f7f4 !important;
    }

    body.dark .huellitas-nav-item:hover {
        color: #e5d9ff !important;
        background: rgba(123, 92, 255, 0.13) !important;
    }

    body.dark .huellitas-nav-item.active {
        color: #ffffff !important;
        background: #6c4bc4 !important;
    }

    .huellitas-nav-list > .mobile-menu-tools {
        display: none !important;
    }
}

@media (max-width: 900px) {
    .site-nav.huellitas-safe-nav {
        grid-template-columns: minmax(0, 1fr) auto auto !important;
    }

    .huellitas-safe-nav .nav-menu-toggle {
        display: inline-flex !important;
        grid-column: 2;
        grid-row: 1;
    }

    .huellitas-safe-nav .nav-actions {
        grid-column: 3;
        grid-row: 1;
        width: auto;
        max-width: none;
        flex-wrap: nowrap;
    }

    .huellitas-safe-nav .nav-actions [data-settings-toggle] {
        display: inline-flex !important;
    }

    .huellitas-safe-nav .nav-actions [data-report-toggle],
    .huellitas-safe-nav .nav-actions [data-theme-toggle] {
        display: none !important;
    }

    .huellitas-safe-nav .nav-links.huellitas-nav-list,
    body.nav-full .huellitas-safe-nav .nav-links.huellitas-nav-list {
        position: fixed !important;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 1400;
        width: min(88vw, 370px) !important;
        max-height: none !important;
        display: flex !important;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 7px;
        padding: 0 12px 16px !important;
        overflow-x: hidden;
        overflow-y: auto;
        border-left: 1px solid rgba(91, 63, 163, 0.18);
        border-radius: 12px 0 0 12px;
        background: #ffffff;
        box-shadow: -18px 0 48px rgba(25, 21, 34, 0.2);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateX(104%);
        transition: transform 220ms ease, opacity 180ms ease, visibility 220ms;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }

    .huellitas-safe-nav.nav-open .nav-links.huellitas-nav-list,
    body.nav-full .huellitas-safe-nav.nav-open .nav-links.huellitas-nav-list {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateX(0);
    }

    .huellitas-mobile-head {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 0 -12px 5px;
        padding: 14px 12px;
        border-bottom: 1px solid rgba(91, 63, 163, 0.13);
        background: rgba(255, 255, 255, 0.97);
        backdrop-filter: blur(12px);
    }

    .huellitas-mobile-brand {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .huellitas-mobile-brand > img {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        border-radius: 50%;
        object-fit: cover;
    }

    .huellitas-mobile-brand > div {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    .huellitas-mobile-brand strong {
        color: #34234f;
        font-size: 17px;
    }

    .huellitas-mobile-brand span {
        color: #6f6977;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.3;
    }

    .huellitas-mobile-close {
        width: 38px;
        min-width: 38px;
        height: 38px;
        min-height: 38px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid rgba(91, 63, 163, 0.2);
        border-radius: 8px;
        color: #5b3fa3;
        background: rgba(108, 75, 196, 0.08);
        box-shadow: none;
        font-size: 24px;
        line-height: 1;
    }

    .huellitas-nav-item {
        width: 100%;
        min-height: 58px;
        display: grid !important;
        grid-template-columns: 42px minmax(0, 1fr);
        align-items: center;
        justify-content: stretch;
        gap: 11px;
        padding: 7px 10px !important;
        border: 1px solid rgba(91, 63, 163, 0.11) !important;
        border-radius: 8px !important;
        color: #2f2c34 !important;
        background: rgba(247, 245, 250, 0.8) !important;
        box-shadow: 0 4px 12px rgba(41, 34, 51, 0.05) !important;
        text-align: left;
    }

    .huellitas-nav-item .huellitas-nav-icon {
        width: 38px;
        height: 38px;
        flex-basis: 38px;
    }

    .huellitas-nav-copy {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    .huellitas-nav-copy strong {
        overflow: hidden;
        color: inherit;
        font-size: 14px;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .huellitas-nav-copy small {
        display: block;
        color: #77717f;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
    }

    .huellitas-nav-item.active {
        color: #ffffff !important;
        border-color: #6c4bc4 !important;
        background: #6c4bc4 !important;
        box-shadow: 0 8px 18px rgba(91, 63, 163, 0.2) !important;
    }

    .huellitas-nav-item.active .huellitas-icon-light {
        display: none !important;
    }

    .huellitas-nav-item.active .huellitas-icon-dark {
        display: block !important;
    }

    .huellitas-nav-item.active .huellitas-nav-copy small {
        color: rgba(255, 255, 255, 0.82);
    }

    .huellitas-nav-item.huellitas-extra {
        display: none !important;
    }

    .huellitas-nav-list.huellitas-expanded .huellitas-nav-item.huellitas-extra {
        display: grid !important;
    }

    .huellitas-more-toggle {
        width: 100%;
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 9px 12px;
        border: 1px solid rgba(91, 63, 163, 0.22);
        border-radius: 8px;
        color: #5b3fa3;
        background: rgba(108, 75, 196, 0.07);
        box-shadow: none;
        font-weight: 850;
    }

    .huellitas-nav-list > .mobile-menu-tools {
        display: grid !important;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
        padding-top: 9px;
        border-top: 1px solid var(--line);
    }

    .huellitas-nav-list > .mobile-menu-tools [data-mobile-settings] {
        display: none !important;
    }

    .huellitas-nav-list > .mobile-menu-tools .mobile-nav-tool {
        min-height: 40px;
        padding: 8px 9px;
        border-radius: 8px;
        font-size: 12px;
    }

    body.dark .huellitas-nav-list {
        border-left-color: rgba(193, 171, 255, 0.18);
        background: #151d18 !important;
    }

    body.dark .huellitas-mobile-head {
        border-bottom-color: rgba(193, 171, 255, 0.14);
        background: rgba(21, 29, 24, 0.97);
    }

    body.dark .huellitas-mobile-brand strong {
        color: #ffffff;
    }

    body.dark .huellitas-mobile-brand span {
        color: #b9c4bd;
    }

    body.dark .huellitas-mobile-close {
        color: #e6dcff;
        border-color: rgba(193, 171, 255, 0.22);
        background: rgba(123, 92, 255, 0.14);
    }

    body.dark .huellitas-nav-item {
        color: #f1f5f2 !important;
        border-color: rgba(225, 235, 229, 0.12) !important;
        background: rgba(255, 255, 255, 0.045) !important;
        box-shadow: none !important;
    }

    body.dark .huellitas-nav-copy small {
        color: #aebbb3;
    }

    body.dark .huellitas-nav-item.active {
        color: #ffffff !important;
        border-color: #7b5cff !important;
        background: #6c4bc4 !important;
    }

    body.dark .huellitas-more-toggle {
        color: #e6dcff;
        border-color: rgba(193, 171, 255, 0.2);
        background: rgba(123, 92, 255, 0.12);
    }
}

@media (max-width: 640px) {
    .huellitas-safe-nav .nav-actions {
        gap: 5px;
    }

    .huellitas-safe-nav .nav-actions [data-settings-toggle],
    .huellitas-safe-nav .nav-actions .notification-button,
    .huellitas-safe-nav .profile-chip,
    .huellitas-safe-nav #btnLogin {
        width: 38px;
        min-width: 38px;
        height: 38px;
        min-height: 38px;
    }

    .huellitas-safe-nav .nav-actions [data-settings-toggle] .huellitas-nav-icon {
        width: 25px;
        height: 25px;
        flex-basis: 25px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .huellitas-nav-list,
    .huellitas-nav-item,
    .huellitas-nav-icon {
        transition: none !important;
    }
}
`;
    document.head.appendChild(style);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();