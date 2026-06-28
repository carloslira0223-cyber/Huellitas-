(function () {
    const menuItems = [
        { href: "pagina.html", label: "Inicio", icon: "inicio.png" },
        { href: "jueguitos.html", label: "Juegos", icon: "juegos.png" },
        { href: "directorio.html", label: "Directorio", icon: "directorio.png" },
        { href: "areas.html", label: "Áreas", icon: "areas.png" },
        { href: "domesticos.html", label: "Mascotas", icon: "mascotas.png" },
        { href: "leyes.html", label: "Leyes", icon: "leyes.png" },
        { href: "equipo.html", label: "Equipo", icon: "equipo.png" },
        { href: "presentacion.html", label: "Presentación", icon: "presentacion.png" },
        { href: "mascotas_perdidas.html", label: "Perdidas", icon: "perdidas.png" },
        { href: "adopcion_huellitas.html", label: "Adopciones", icon: "adopciones.png" },
        { href: "adoptar.html", label: "Adoptar", icon: "adoptar.png" }
    ];
    const primaryPages = ["pagina.html", "jueguitos.html", "directorio.html", "adopcion_huellitas.html"];

    function currentPage() {
        return (window.location.pathname.split("/").pop() || "pagina.html").toLowerCase();
    }

    function isCurrent(item) {
        return currentPage() === item.href.toLowerCase();
    }

    function closeDrawer(nav) {
        nav.classList.remove("nav-open");
        document.body.classList.remove("mobile-nav-open", "huellitas-drawer-open");
        const toggle = nav.querySelector("[data-huellitas-menu-toggle]");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Abrir menú de navegación");
        }
    }

    function openDrawer(nav) {
        nav.classList.add("nav-open");
        document.body.classList.add("mobile-nav-open", "huellitas-drawer-open");
        const toggle = nav.querySelector("[data-huellitas-menu-toggle]");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Cerrar menú de navegación");
        }
    }

    function createLink(item, className) {
        const link = document.createElement("a");
        link.className = className + (isCurrent(item) ? " active" : "");
        link.href = item.href;
        if (isCurrent(item)) {
            link.setAttribute("aria-current", "page");
        }

        if (className.indexOf("drawer") !== -1) {
            const image = document.createElement("img");
            image.src = "assets/icons/" + item.icon;
            image.alt = item.label;
            image.width = 40;
            image.height = 40;
            link.appendChild(image);
        }

        const label = document.createElement("span");
        label.textContent = item.label;
        link.appendChild(label);
        return link;
    }

    function polishTopActions(nav) {
        const settings = nav.querySelector("[data-settings-toggle]");
        if (settings && !settings.querySelector("img")) {
            settings.textContent = "";
            const image = document.createElement("img");
            image.src = "assets/icons/ajustes.png";
            image.alt = "Ajustes";
            image.width = 26;
            image.height = 26;
            settings.appendChild(image);
        }

        const login = nav.querySelector("#btnLogin");
        if (login && !login.querySelector("img")) {
            login.textContent = "";
            login.setAttribute("aria-label", "Usuario");
            login.title = "Usuario";
            const image = document.createElement("img");
            image.src = "assets/icons/usuario.png";
            image.alt = "Usuario";
            image.width = 25;
            image.height = 25;
            login.appendChild(image);
        }

        nav.querySelectorAll(".profile-chip").forEach((chip) => {
            if (!chip.querySelector("img")) {
                chip.textContent = "";
                const image = document.createElement("img");
                image.src = "assets/icons/usuario.png";
                image.alt = "Usuario";
                image.width = 25;
                image.height = 25;
                chip.appendChild(image);
            }
        });
    }

    function enhanceNavigation(nav) {
        if (nav.dataset.huellitasNavigationReady === "true") {
            polishTopActions(nav);
            return;
        }

        const brand = nav.querySelector(".brand");
        const actions = nav.querySelector(".nav-actions");
        const drawer = nav.querySelector(".nav-links");
        if (!brand || !actions || !drawer) {
            return;
        }

        nav.dataset.huellitasNavigationReady = "true";
        nav.classList.add("huellitas-nav-enhanced");

        const oldToggle = nav.querySelector(".nav-menu-toggle");
        if (oldToggle) {
            oldToggle.remove();
        }

        drawer.innerHTML = "";
        drawer.className = "nav-links huellitas-drawer";
        drawer.setAttribute("aria-label", "Navegación principal");
        drawer.setAttribute("aria-hidden", "true");

        const header = document.createElement("div");
        header.className = "huellitas-drawer-header";
        header.innerHTML = [
            '<div class="huellitas-drawer-brand">',
            '<img src="assets/imagenes/logo.png" alt="">',
            '<div><strong>🐾 Huellitas</strong><span>Explora y ayuda a más mascotas</span></div>',
            '</div>',
            '<button class="huellitas-drawer-close" type="button" aria-label="Cerrar menú">&times;</button>'
        ].join("");
        drawer.appendChild(header);

        const list = document.createElement("div");
        list.className = "huellitas-drawer-list";
        menuItems.forEach((item) => list.appendChild(createLink(item, "huellitas-drawer-link")));
        drawer.appendChild(list);

        const footer = document.createElement("div");
        footer.className = "huellitas-drawer-footer";
        footer.innerHTML = "<span>Información, ayuda y adopción responsable</span>";
        drawer.appendChild(footer);

        const desktop = document.createElement("div");
        desktop.className = "huellitas-primary-nav";
        desktop.setAttribute("aria-label", "Secciones principales");
        primaryPages.forEach((href) => {
            const item = menuItems.find((candidate) => candidate.href === href);
            if (item) {
                desktop.appendChild(createLink(item, "huellitas-primary-link"));
            }
        });
        brand.insertAdjacentElement("afterend", desktop);

        const toggle = document.createElement("button");
        toggle.className = "huellitas-menu-toggle";
        toggle.type = "button";
        toggle.dataset.huellitasMenuToggle = "true";
        toggle.setAttribute("aria-label", "Abrir menú de navegación");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = [
            '<span class="huellitas-menu-bars" aria-hidden="true"><i></i><i></i><i></i></span>',
            '<span class="huellitas-menu-label">Más</span>'
        ].join("");
        nav.insertBefore(toggle, actions);

        const scrim = document.createElement("button");
        scrim.className = "huellitas-nav-scrim";
        scrim.type = "button";
        scrim.setAttribute("aria-label", "Cerrar menú");
        nav.appendChild(scrim);

        toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            if (nav.classList.contains("nav-open")) {
                closeDrawer(nav);
            } else {
                openDrawer(nav);
            }
        });
        scrim.addEventListener("click", () => closeDrawer(nav));
        header.querySelector(".huellitas-drawer-close").addEventListener("click", () => closeDrawer(nav));
        list.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeDrawer(nav)));

        actions.addEventListener("click", () => {
            if (nav.classList.contains("nav-open")) {
                closeDrawer(nav);
            }
        });

        const observer = new MutationObserver(() => polishTopActions(nav));
        observer.observe(actions, { childList: true, subtree: true });
        polishTopActions(nav);
    }

    function updateDrawerAccessibility() {
        document.querySelectorAll(".site-nav.huellitas-nav-enhanced").forEach((nav) => {
            const drawer = nav.querySelector(".huellitas-drawer");
            if (drawer) {
                drawer.setAttribute("aria-hidden", nav.classList.contains("nav-open") ? "false" : "true");
            }
        });
    }

    function init() {
        document.querySelectorAll(".site-nav").forEach(enhanceNavigation);
        updateDrawerAccessibility();

        const classObserver = new MutationObserver(updateDrawerAccessibility);
        document.querySelectorAll(".site-nav.huellitas-nav-enhanced").forEach((nav) => {
            classObserver.observe(nav, { attributes: true, attributeFilter: ["class"] });
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            document.querySelectorAll(".site-nav.nav-open").forEach(closeDrawer);
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    const style = document.createElement("style");
    style.id = "huellitas-navigation-styles";
    style.textContent = `
.site-nav.huellitas-nav-enhanced,
body.nav-full .site-nav.huellitas-nav-enhanced {
    position: sticky; top: 0; z-index: 1000;
    display: grid !important;
    grid-template-columns: auto minmax(0, 1fr) auto auto !important;
    align-items: center;
    gap: clamp(10px, 1.5vw, 22px);
    padding: 10px clamp(18px, 3vw, 42px);
    background: rgba(255, 255, 255, 0.94);
    border-bottom: 1px solid rgba(91, 63, 163, 0.14);
    box-shadow: 0 8px 28px rgba(38, 51, 44, 0.09);
    backdrop-filter: blur(16px);
}
.site-nav.huellitas-nav-enhanced.nav-open { z-index: 2000; }
.huellitas-nav-enhanced > .brand,
.huellitas-nav-enhanced > .huellitas-primary-nav,
.huellitas-nav-enhanced > .huellitas-menu-toggle,
.huellitas-nav-enhanced > .nav-actions { position: relative; z-index: 2; }
.huellitas-nav-enhanced .brand img { width: 48px; height: 48px; }
.huellitas-nav-enhanced .brand span { font-size: 24px; }
.huellitas-primary-nav { min-width: 0; display: flex; align-items: center; justify-content: center; gap: 4px; }
.huellitas-primary-link {
    min-height: 42px; display: inline-flex; align-items: center; padding: 9px 12px;
    border-radius: 8px; color: var(--cocoa); font-weight: 800; white-space: nowrap;
    transition: color 160ms ease, background 160ms ease;
}
.huellitas-primary-link:hover { color: #5b3fa3; background: rgba(108, 75, 196, 0.09); }
.huellitas-primary-link.active { color: #fff; background: #6c4bc4; }
.huellitas-menu-toggle {
    min-width: 78px; height: 44px; display: inline-flex; align-items: center; justify-content: center;
    gap: 9px; padding: 0 13px; border: 1px solid rgba(91, 63, 163, 0.24);
    border-radius: 8px; color: #5b3fa3; background: rgba(108, 75, 196, 0.08);
    box-shadow: none; font-weight: 900;
}
.huellitas-menu-toggle:hover { color: #fff; background: #6c4bc4; box-shadow: 0 8px 18px rgba(91,63,163,.2); transform: none; }
.huellitas-menu-bars { width: 18px; display: grid; gap: 3px; }
.huellitas-menu-bars i { width: 18px; height: 2px; display: block; border-radius: 2px; background: currentColor; }
.huellitas-nav-enhanced .nav-actions { min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 7px; flex-wrap: nowrap; }
.huellitas-nav-enhanced .nav-actions > button,
.huellitas-nav-enhanced .nav-actions .icon-button,
.huellitas-nav-enhanced .profile-chip {
    width: 42px; min-width: 42px; height: 42px; min-height: 42px; padding: 0; border-radius: 8px;
}
.huellitas-nav-enhanced .nav-actions > button,
.huellitas-nav-enhanced .icon-button,
.huellitas-nav-enhanced .profile-chip {
    color: var(--cocoa); background: rgba(255,255,255,.78); border: 1px solid var(--line); box-shadow: none;
}
.huellitas-nav-enhanced .nav-actions > button:hover,
.huellitas-nav-enhanced .icon-button:hover,
.huellitas-nav-enhanced .profile-chip:hover {
    color: #5b3fa3; background: rgba(108,75,196,.1); border-color: rgba(91,63,163,.28); transform: none;
}
.huellitas-nav-enhanced .nav-actions [data-theme-toggle] { display: none !important; }
.huellitas-nav-enhanced .settings-button img,
.huellitas-nav-enhanced #btnLogin img,
.huellitas-nav-enhanced .profile-chip > img[src*="usuario.png"] { width: 25px; height: 25px; object-fit: contain; }
.huellitas-nav-enhanced #btnLogin { font-size: 0; overflow: hidden; }
.huellitas-drawer {
    position: fixed !important; top: 12px; right: 12px; bottom: 12px; z-index: 4;
    width: min(380px, calc(100vw - 24px)) !important; max-height: none !important;
    display: flex !important; flex-direction: column; gap: 0 !important; padding: 0 !important;
    overflow: hidden !important; border: 1px solid rgba(91,63,163,.17); border-radius: 12px;
    background: #fff; box-shadow: 0 28px 70px rgba(21,19,31,.26);
    opacity: 0; visibility: hidden; pointer-events: none;
    transform: translateX(calc(100% + 34px));
    transition: transform 240ms ease, opacity 200ms ease, visibility 240ms;
}
.site-nav.nav-open .huellitas-drawer,
body.nav-full .site-nav.nav-open .huellitas-drawer {
    opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(0);
}
.huellitas-nav-scrim {
    position: fixed; inset: 0; z-index: 3; width: 100vw; height: 100dvh; display: block;
    padding: 0; border: 0; border-radius: 0; background: rgba(20,17,28,.38); box-shadow: none;
    opacity: 0; visibility: hidden; pointer-events: none;
    transition: opacity 200ms ease, visibility 200ms;
}
.site-nav.nav-open .huellitas-nav-scrim { opacity: 1; visibility: visible; pointer-events: auto; }
.huellitas-nav-scrim:hover { background: rgba(20,17,28,.38); box-shadow: none; transform: none; }
.huellitas-drawer-header {
    flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 14px;
    padding: 18px; border-bottom: 1px solid rgba(91,63,163,.13); background: rgba(108,75,196,.07);
}
.huellitas-drawer-brand { min-width: 0; display: flex; align-items: center; gap: 12px; }
.huellitas-drawer-brand > img {
    width: 50px; height: 50px; flex: 0 0 auto; border: 2px solid rgba(91,63,163,.25);
    border-radius: 50%; object-fit: cover;
}
.huellitas-drawer-brand div { min-width: 0; display: grid; gap: 3px; }
.huellitas-drawer-brand strong { color: #34234f; font-size: 18px; }
.huellitas-drawer-brand span { color: #6e6877; font-size: 12px; font-weight: 700; line-height: 1.35; }
.huellitas-drawer-close {
    width: 38px; min-width: 38px; height: 38px; min-height: 38px; display: grid; place-items: center;
    padding: 0; border-radius: 8px; color: #5b3fa3; background: #fff;
    border: 1px solid rgba(91,63,163,.2); box-shadow: none; font-size: 25px; line-height: 1;
}
.huellitas-drawer-close:hover { color: #fff; background: #6c4bc4; transform: none; }
.huellitas-drawer-list {
    min-height: 0; flex: 1 1 auto; display: grid; align-content: start; gap: 7px;
    padding: 14px; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;
}
.huellitas-drawer-link {
    min-height: 54px; display: grid; grid-template-columns: 40px minmax(0,1fr); align-items: center;
    gap: 13px; padding: 7px 12px; border: 1px solid transparent; border-radius: 8px;
    color: #302d35; background: transparent; font-size: 15px; font-weight: 850;
    transition: color 160ms ease, background 160ms ease, border-color 160ms ease;
}
.huellitas-drawer-link img { width: 36px; height: 36px; object-fit: contain; transition: filter 160ms ease; }
.huellitas-drawer-link:hover { color: #5b3fa3; border-color: rgba(91,63,163,.15); background: rgba(108,75,196,.07); }
.huellitas-drawer-link.active {
    color: #fff; border-color: #6c4bc4; background: #6c4bc4; box-shadow: 0 9px 20px rgba(91,63,163,.22);
}
.huellitas-drawer-link.active img { filter: invert(1) brightness(1.7); }
.huellitas-drawer-footer {
    flex: 0 0 auto; padding: 12px 18px 15px; border-top: 1px solid rgba(91,63,163,.12);
    color: #77717f; font-size: 11px; font-weight: 750; text-align: center;
}
body.huellitas-drawer-open { overflow: hidden; }
body.dark .site-nav.huellitas-nav-enhanced,
body.dark.nav-full .site-nav.huellitas-nav-enhanced {
    background: rgba(16,24,20,.96); border-bottom-color: rgba(170,145,237,.2);
}
body.dark .huellitas-primary-link { color: #f1f5f2; }
body.dark .huellitas-primary-link:hover { color: #d9cbff; background: rgba(123,92,255,.15); }
body.dark .huellitas-primary-link.active { color: #fff; background: #6c4bc4; }
body.dark .huellitas-menu-toggle {
    color: #e1d6ff; border-color: rgba(193,171,255,.28); background: rgba(123,92,255,.14);
}
body.dark .huellitas-nav-enhanced .nav-actions > button,
body.dark .huellitas-nav-enhanced .icon-button,
body.dark .huellitas-nav-enhanced .profile-chip {
    color: #f4f7f5; border-color: rgba(225,235,229,.15); background: rgba(255,255,255,.055);
}
body.dark .huellitas-nav-enhanced .settings-button img,
body.dark .huellitas-nav-enhanced #btnLogin img,
body.dark .huellitas-nav-enhanced .profile-chip > img[src*="usuario.png"] { filter: invert(1) brightness(1.7); }
body.dark .huellitas-drawer {
    border-color: rgba(193,171,255,.2); background: #151d18; box-shadow: 0 28px 74px rgba(0,0,0,.52);
}
body.dark .huellitas-drawer-header { border-bottom-color: rgba(193,171,255,.16); background: rgba(123,92,255,.12); }
body.dark .huellitas-drawer-brand strong { color: #fff; }
body.dark .huellitas-drawer-brand span,
body.dark .huellitas-drawer-footer { color: #b9c5bd; }
body.dark .huellitas-drawer-close {
    color: #eadfff; border-color: rgba(193,171,255,.22); background: rgba(255,255,255,.07);
}
body.dark .huellitas-drawer-link { color: #f2f6f3; }
body.dark .huellitas-drawer-link img { filter: invert(1) brightness(1.7); }
body.dark .huellitas-drawer-link:hover {
    color: #eadfff; border-color: rgba(193,171,255,.18); background: rgba(123,92,255,.13);
}
body.dark .huellitas-drawer-link.active { color: #fff; border-color: #7b5cff; background: #6c4bc4; }
body.dark .huellitas-drawer-footer { border-top-color: rgba(193,171,255,.14); }
@media (max-width: 1120px) {
    .huellitas-primary-link:nth-child(4) { display: none; }
    .huellitas-nav-enhanced .nav-actions [data-report-toggle] { display: none !important; }
}
@media (max-width: 900px) {
    .site-nav.huellitas-nav-enhanced,
    body.nav-full .site-nav.huellitas-nav-enhanced {
        grid-template-columns: minmax(0,1fr) auto auto !important; gap: 7px; padding: 8px 12px;
    }
    .huellitas-primary-nav { display: none; }
    .huellitas-menu-toggle { grid-column: 2; min-width: 42px; width: 42px; height: 42px; padding: 0; }
    .huellitas-menu-label { display: none; }
    .huellitas-nav-enhanced .nav-actions {
        grid-column: 3; width: auto; max-width: none; gap: 5px; overflow: visible;
    }
    .huellitas-nav-enhanced .nav-actions [data-settings-toggle] { display: inline-flex !important; }
    .huellitas-nav-enhanced .nav-actions [data-report-toggle],
    .huellitas-nav-enhanced .nav-actions [data-theme-toggle] { display: none !important; }
    .huellitas-drawer {
        top: 0; right: 0; bottom: 0; width: min(88vw,390px) !important; border-radius: 12px 0 0 12px;
    }
    .huellitas-drawer-header { padding: 15px; }
    .huellitas-drawer-list { padding: 12px; }
    .huellitas-drawer-link { min-height: 56px; }
}
@media (max-width: 640px) {
    .site-nav.huellitas-nav-enhanced,
    body.nav-full .site-nav.huellitas-nav-enhanced {
        grid-template-columns: minmax(0,1fr) 40px auto !important; gap: 5px; padding: 7px 9px;
    }
    .huellitas-nav-enhanced .brand { min-width: 0; gap: 7px; }
    .huellitas-nav-enhanced .brand img { width: 40px; height: 40px; border-width: 2px; }
    .huellitas-nav-enhanced .brand span { display: none; }
    .huellitas-menu-toggle,
    .huellitas-nav-enhanced .nav-actions > button,
    .huellitas-nav-enhanced .nav-actions .icon-button,
    .huellitas-nav-enhanced .profile-chip,
    .huellitas-nav-enhanced #btnLogin {
        width: 38px; min-width: 38px; height: 38px; min-height: 38px; border-radius: 8px;
    }
    .huellitas-menu-toggle { width: 40px; min-width: 40px; height: 40px; }
    .huellitas-nav-enhanced .notification-button b { top: -5px; right: -4px; }
    .huellitas-drawer { width: min(88vw,380px) !important; }
    .huellitas-drawer-brand > img { width: 46px; height: 46px; }
    .huellitas-drawer-brand strong { font-size: 17px; }
    .huellitas-drawer-link {
        grid-template-columns: 38px minmax(0,1fr); min-height: 54px; padding: 6px 10px;
    }
    .huellitas-drawer-link img { width: 34px; height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
    .huellitas-drawer, .huellitas-nav-scrim, .huellitas-drawer-link, .huellitas-primary-link {
        transition: none !important;
    }
}
`;
    document.head.appendChild(style);
})();