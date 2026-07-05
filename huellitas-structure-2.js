/*!
 * Proyecto Huellitas - Carlos Alexis Lira Alcala - 2026.
 * Estructura principal Huellitas 2.0.
 */
(function () {
    "use strict";

    const STYLE_ID = "huellitas-structure-2-css";
    const STYLE_URL = "huellitas-structure-2.css?v=20260705-structure-v1";
    const PRIMARY_LINKS = [
        { href: "pagina.html", label: "Inicio", description: "Vista principal" },
        { href: "adoptar.html", label: "Adoptar", description: "Inicia una solicitud" },
        { href: "directorio.html", label: "Directorio", description: "Busca centros cercanos" },
        { href: "mascotas_perdidas.html", label: "Reportes", description: "Reporta y consulta casos" },
        { href: "jueguitos.html", label: "Juegos", description: "Juega y aprende" }
    ];
    const SECONDARY_LINKS = [
        { href: "adopcion_huellitas.html", label: "Mascotas disponibles", description: "Conoce a quienes buscan hogar" },
        { href: "mi_adopcion.html", label: "Mi adopcion", description: "Consulta tu seguimiento" },
        { href: "pagina.html#favoritos", label: "Favoritos", description: "Vuelve a tus guardados" },
        { href: "domesticos.html", label: "Guia de cuidados", description: "Bienestar para mascotas" },
        { href: "areas.html", label: "Areas naturales", description: "Naturaleza y participacion" },
        { href: "leyes.html", label: "Leyes", description: "Proteccion animal" },
        { href: "equipo.html", label: "Equipo", description: "Conoce el proyecto" },
        { href: "presentacion.html", label: "Presentacion", description: "Consulta la exposicion" }
    ];

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    }

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = STYLE_URL;
        document.head.appendChild(link);
    }

    function fileName(href) {
        return String(href || "").split("#")[0].split("?")[0].split("/").pop().toLowerCase();
    }

    function currentFile() {
        return fileName(window.location.pathname) || "pagina.html";
    }

    function isCurrent(meta) {
        if (meta.href.indexOf("#favoritos") >= 0) {
            return window.location.hash === "#favoritos";
        }
        return fileName(meta.href) === currentFile();
    }

    function updateLink(link, meta, secondary) {
        link.href = meta.href;
        link.classList.add("nav-link", "huellitas-nav-item");
        link.classList.toggle("huellitas-extra", Boolean(secondary));
        link.classList.toggle("active", isCurrent(meta));
        link.setAttribute("aria-label", meta.label);
        if (isCurrent(meta)) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }

        const title = link.querySelector(".huellitas-nav-copy strong");
        const description = link.querySelector(".huellitas-nav-copy small");
        if (title) {
            title.textContent = meta.label;
        }
        if (description) {
            description.textContent = meta.description;
        }
        if (!title) {
            link.textContent = meta.label;
        }
        return link;
    }

    function createPlainLink(meta) {
        const link = document.createElement("a");
        link.className = "nav-link huellitas-nav-item";
        link.href = meta.href;
        const icon = document.createElement("span");
        icon.className = "structure-link-symbol";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = meta.label.charAt(0);
        const copy = document.createElement("span");
        copy.className = "huellitas-nav-copy";
        const title = document.createElement("strong");
        title.textContent = meta.label;
        const description = document.createElement("small");
        description.textContent = meta.description;
        copy.append(title, description);
        link.append(icon, copy);
        return link;
    }

    function takeLink(links, meta) {
        const targetFile = fileName(meta.href);
        const candidates = Array.from(links.querySelectorAll("a.nav-link"));
        let link = candidates.find(function (item) {
            return fileName(item.getAttribute("href")) === targetFile &&
                (meta.href.indexOf("#favoritos") < 0 || item.getAttribute("href").indexOf("#favoritos") >= 0);
        });
        if (!link || meta.href.indexOf("#favoritos") >= 0) {
            link = createPlainLink(meta);
        }
        return updateLink(link, meta, false);
    }

    function closeMobileNav(nav) {
        nav.classList.remove("nav-open");
        document.body.classList.remove("mobile-nav-open");
        const toggle = nav.querySelector(".nav-menu-toggle");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
        }
    }

    function organizeNavigation(nav) {
        if (nav.dataset.huellitasStructure2 === "true") {
            return;
        }
        const links = nav.querySelector(".nav-links");
        if (!links) {
            return;
        }

        nav.dataset.huellitasStructure2 = "true";
        const header = links.querySelector(".huellitas-mobile-head");
        const tools = links.querySelector(":scope > .mobile-menu-tools");
        const oldMore = links.querySelector(":scope > .huellitas-more-toggle");
        if (oldMore) {
            oldMore.remove();
        }

        const primary = PRIMARY_LINKS.map(function (meta) {
            return updateLink(takeLink(links, meta), meta, false);
        });
        const secondary = SECONDARY_LINKS.map(function (meta) {
            return updateLink(takeLink(links, meta), meta, true);
        });

        const more = document.createElement("details");
        more.className = "huellitas-structure-more";
        if (secondary.some(function (link) { return link.classList.contains("active"); })) {
            more.classList.add("has-active");
        }

        const summary = document.createElement("summary");
        summary.setAttribute("aria-label", "Abrir mas opciones");
        summary.innerHTML = [
            '<span class="structure-more-icon" aria-hidden="true">•••</span>',
            '<span class="huellitas-nav-copy"><strong>Mas</strong><small>Informacion y proyecto</small></span>'
        ].join("");

        const panel = document.createElement("div");
        panel.className = "huellitas-structure-more-panel";
        secondary.forEach(function (link) {
            link.addEventListener("click", function () {
                more.open = false;
                closeMobileNav(nav);
            });
            panel.appendChild(link);
        });
        more.append(summary, panel);

        const nodes = [];
        if (header) {
            nodes.push(header);
        }
        primary.forEach(function (link) {
            link.addEventListener("click", function () {
                closeMobileNav(nav);
            });
            nodes.push(link);
        });
        nodes.push(more);
        if (tools) {
            nodes.push(tools);
        }
        links.replaceChildren.apply(links, nodes);

        summary.addEventListener("click", function () {
            document.querySelectorAll(".huellitas-structure-more[open]").forEach(function (item) {
                if (item !== more) {
                    item.removeAttribute("open");
                }
            });
        });
    }

    function organizeAllNavigation() {
        document.querySelectorAll(".site-nav").forEach(organizeNavigation);
    }

    function makeHomeAction(href, title, text) {
        return [
            '<a class="home-structure-action" href="', href, '">',
            '<strong>', title, '</strong>',
            '<span>', text, '</span>',
            '</a>'
        ].join("");
    }

    function organizeHome() {
        if (currentFile() !== "pagina.html" && currentFile() !== "index.html") {
            return;
        }

        document.body.classList.add("huellitas-home-v2");
        const hero = document.querySelector(".home-hero");
        if (hero) {
            const eyebrow = hero.querySelector(".eyebrow");
            const paragraph = hero.querySelector(".hero-inner > p");
            const actions = hero.querySelector(".hero-actions");
            const quick = hero.querySelector(".home-quick-actions");
            if (eyebrow) {
                eyebrow.textContent = "Adopcion, reportes y educacion animal";
            }
            if (paragraph) {
                paragraph.textContent = "Huellitas es una plataforma para encontrar mascotas en adopcion, reportar casos, localizar centros de apoyo y aprender sobre cuidado animal.";
            }
            if (actions) {
                actions.innerHTML = [
                    '<a class="button-link" href="adopcion_huellitas.html">Adoptar una mascota</a>',
                    '<a class="button-link secondary" href="mascotas_perdidas.html#reportar">Reportar un caso</a>',
                    '<a class="button-link secondary" href="directorio.html">Buscar centros</a>',
                    '<a class="button-link secondary" href="jueguitos.html">Jugar y aprender</a>'
                ].join("");
            }
            if (quick) {
                quick.remove();
            }
        }

        const impactTitle = document.querySelector("#impacto .section-title p");
        if (impactTitle) {
            impactTitle.textContent = "Conoce la actividad de la comunidad: adopciones, reportes, centros, favoritos y aprendizaje.";
        }

        const featured = document.querySelector(".featured-pets-section");
        if (featured) {
            const heading = featured.querySelector("h2");
            const intro = featured.querySelector(".section-title p");
            if (heading) {
                heading.textContent = "Mascotas destacadas";
            }
            if (intro) {
                intro.textContent = "Conoce algunas mascotas disponibles y entra directamente a su proceso de adopcion.";
            }
            featured.querySelectorAll(".featured-pet .button-link").forEach(function (link) {
                link.textContent = "Adoptar";
            });
        }

        const actionsSection = document.querySelector(".middle-grid");
        const topics = document.getElementById("temas");
        if (actionsSection) {
            actionsSection.id = "acciones-principales";
            actionsSection.classList.add("home-main-actions");
            actionsSection.innerHTML = [
                '<div class="section-title">',
                '<h2>Acciones principales</h2>',
                '<p>Todo lo importante de Huellitas, con rutas claras y sin opciones repetidas.</p>',
                '</div>',
                '<div class="home-structure-action-grid">',
                makeHomeAction("adopcion_huellitas.html", "Mascotas disponibles", "Explora perfiles de mascotas que buscan hogar."),
                makeHomeAction("adoptar.html", "Adoptar", "Completa una solicitud de adopcion responsable."),
                makeHomeAction("mi_adopcion.html", "Mi adopcion", "Consulta el avance de tu solicitud."),
                makeHomeAction("pagina.html#favoritos", "Favoritos", "Revisa las mascotas y centros que guardaste."),
                '</div>'
            ].join("");
            if (topics && topics.parentNode) {
                topics.parentNode.insertBefore(actionsSection, topics);
            }
        }

        if (topics) {
            const heading = topics.querySelector(".section-title h2");
            const intro = topics.querySelector(".section-title p");
            if (heading) {
                heading.textContent = "Temas educativos";
            }
            if (intro) {
                intro.textContent = "Aprende sobre cuidado responsable, areas naturales y leyes de proteccion animal.";
            }
            const teamLink = topics.querySelector('.section-actions a[href="equipo.html"]');
            if (teamLink) {
                teamLink.remove();
            }
        }

        const about = document.querySelector("main > .about");
        if (about) {
            about.remove();
        }

        const contactHeading = document.querySelector(".contacto h2");
        const contactIntro = document.querySelector(".contacto > p");
        if (contactHeading) {
            contactHeading.textContent = "Contacto";
        }
        if (contactIntro) {
            contactIntro.textContent = "Comparte una duda, propuesta o situacion que necesite seguimiento.";
        }
    }

    function organizeFooter() {
        document.querySelectorAll(".site-footer").forEach(function (footer) {
            if (footer.dataset.huellitasStructure2 === "true") {
                return;
            }
            footer.dataset.huellitasStructure2 = "true";
            footer.innerHTML = [
                '<div class="structure-footer-main">',
                '<div class="structure-footer-about">',
                '<span>Sobre el proyecto</span>',
                '<strong>Huellitas 2.0</strong>',
                '<p>Huellitas nacio como un proyecto escolar, pero busca convertirse en una plataforma util para promover la adopcion, el cuidado animal y la participacion comunitaria.</p>',
                '</div>',
                '<div class="structure-footer-links">',
                '<span>Explora</span>',
                '<a href="areas.html">Areas</a>',
                '<a href="leyes.html">Leyes</a>',
                '<a href="equipo.html">Equipo</a>',
                '<a href="presentacion.html">Presentacion</a>',
                '</div>',
                '</div>',
                '<div class="structure-footer-bottom">',
                '<strong>© 2026 Carlos Alexis Lira Alcala - Huellitas.</strong>',
                '<span>Origen: proyecto escolar de CECyTEM Tultitlan, Grupo 404, Equipo Huellitas.</span>',
                '</div>'
            ].join("");
        });
    }

    function showAuthMessage(message, type) {
        const element = document.getElementById("mensaje");
        if (!element) {
            return;
        }
        element.style.display = "block";
        element.className = type || "";
        element.textContent = message;
    }

    function isNetworkError(error) {
        return /(failed to fetch|network|load failed|servidor no activo|timeout|conectar)/i.test(String(error && error.message || ""));
    }

    async function requestWithRetry(path, options, pendingMessage) {
        if (!window.huellitasApi || !window.huellitasApi.enabled) {
            throw new Error("El servidor de Huellitas no esta disponible.");
        }

        let lastError;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                return await window.huellitasApi.request(path, options);
            } catch (error) {
                lastError = error;
                if (!isNetworkError(error) || attempt === 1) {
                    throw error;
                }
                showAuthMessage(pendingMessage || "Conectando con Huellitas. Un momento...", "");
                await new Promise(function (resolve) { setTimeout(resolve, 1400); });
            }
        }
        throw lastError;
    }

    async function reliableLogin(event) {
        if (event) {
            event.preventDefault();
        }
        const emailInput = document.getElementById("loginUser");
        const passwordInput = document.getElementById("loginPass");
        const email = String(emailInput && emailInput.value || "").trim().toLowerCase();
        const pass = String(passwordInput && passwordInput.value || "");
        if (!email || !pass) {
            showAuthMessage("Escribe tu correo y contrasena.", "error");
            return;
        }

        const submit = document.querySelector('#loginForm button[type="submit"]');
        if (submit) {
            submit.disabled = true;
            submit.textContent = "Ingresando...";
        }
        showAuthMessage("Verificando tu cuenta...", "");

        try {
            const data = await requestWithRetry("/api/login", {
                method: "POST",
                body: JSON.stringify({ email: email, pass: pass })
            }, "El servidor esta despertando. Seguimos intentando...");
            window.huellitasApi.setToken(data.token);
            localStorage.setItem("sesion", JSON.stringify(data.user));
            showAuthMessage("Bienvenido " + data.user.nombre, "success");
            document.getElementById("panelLogin").classList.remove("active");
            if (typeof window.cargarUsuario === "function") {
                window.cargarUsuario();
            }
            if (window.huellitasMountProfile) {
                window.huellitasMountProfile();
            }
        } catch (error) {
            showAuthMessage(error.message || "No fue posible iniciar sesion.", "error");
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.textContent = "Ingresar";
            }
        }
    }

    async function reliableRegister(event) {
        if (event) {
            event.preventDefault();
        }
        const nombre = String(document.getElementById("nombre") && document.getElementById("nombre").value || "").trim();
        const email = String(document.getElementById("email") && document.getElementById("email").value || "").trim().toLowerCase();
        const pass = String(document.getElementById("newPass") && document.getElementById("newPass").value || "");
        const color = String(document.getElementById("color") && document.getElementById("color").value || "#5f9d63");
        const photoInput = document.getElementById("foto");

        if (!nombre || !email || pass.length < 6) {
            showAuthMessage("Completa nombre, correo y una contrasena de al menos 6 caracteres.", "error");
            return;
        }

        const submit = document.querySelector('#registerForm button[type="submit"]');
        if (submit) {
            submit.disabled = true;
            submit.textContent = "Creando...";
        }
        showAuthMessage("Creando tu cuenta segura...", "");

        try {
            let photo = "";
            if (photoInput && photoInput.files && photoInput.files[0]) {
                photo = await new Promise(function (resolve, reject) {
                    const reader = new FileReader();
                    reader.onload = function () { resolve(reader.result); };
                    reader.onerror = reject;
                    reader.readAsDataURL(photoInput.files[0]);
                });
            }
            const data = await requestWithRetry("/api/register", {
                method: "POST",
                body: JSON.stringify({
                    nombre: nombre,
                    email: email,
                    pass: pass,
                    color: color,
                    foto: photo
                })
            }, "El servidor esta despertando. Tu cuenta se creara en un momento...");
            window.huellitasApi.setToken(data.token);
            localStorage.setItem("sesion", JSON.stringify(data.user));
            showAuthMessage("Cuenta creada correctamente.", "success");
            document.getElementById("panelLogin").classList.remove("active");
            if (typeof window.cargarUsuario === "function") {
                window.cargarUsuario();
            }
            if (window.huellitasMountProfile) {
                window.huellitasMountProfile();
            }
        } catch (error) {
            showAuthMessage(error.message || "No fue posible crear la cuenta.", "error");
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.textContent = "Crear cuenta";
            }
        }
    }

    function strengthenAuthPanel() {
        const panel = document.getElementById("panelLogin");
        if (!panel || panel.dataset.huellitasAuth2 === "true") {
            return;
        }
        panel.dataset.huellitasAuth2 = "true";

        const createLink = Array.from(panel.querySelectorAll(".link")).find(function (item) {
            return item.id !== "volverLogin";
        });
        const backLink = document.getElementById("volverLogin");
        [createLink, backLink].forEach(function (item) {
            if (!item) {
                return;
            }
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");
            item.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    item.click();
                }
            });
        });

        window.login = reliableLogin;
        window.registro = reliableRegister;
        window.mostrarRegistro = function () {
            document.getElementById("loginForm").style.display = "none";
            document.getElementById("registerForm").style.display = "block";
            if (createLink) {
                createLink.style.display = "none";
            }
            if (backLink) {
                backLink.style.display = "block";
            }
            showAuthMessage("", "");
        };
        window.mostrarLogin = function () {
            document.getElementById("loginForm").style.display = "block";
            document.getElementById("registerForm").style.display = "none";
            if (createLink) {
                createLink.style.display = "block";
            }
            if (backLink) {
                backLink.style.display = "none";
            }
            showAuthMessage("", "");
        };
    }

    function openFavoritesFromHash() {
        if (window.location.hash !== "#favoritos") {
            return;
        }
        setTimeout(function () {
            if (typeof window.toggleMenu === "function" && localStorage.getItem("sesion")) {
                window.toggleMenu();
                const favorites = document.querySelector(".profile-favorites");
                if (favorites) {
                    favorites.scrollIntoView({ block: "center" });
                }
            } else if (typeof window.abrirLogin === "function") {
                window.abrirLogin();
                showAuthMessage("Inicia sesion para ver tus favoritos.", "");
            }
        }, 450);
    }

    function init() {
        ensureStyles();
        organizeAllNavigation();
        organizeHome();
        organizeFooter();
        strengthenAuthPanel();
        openFavoritesFromHash();

        document.addEventListener("click", function (event) {
            document.querySelectorAll(".huellitas-structure-more[open]").forEach(function (details) {
                if (!details.contains(event.target)) {
                    details.removeAttribute("open");
                }
            });
        });

        if (window.MutationObserver) {
            let scheduled = false;
            new MutationObserver(function () {
                if (scheduled) {
                    return;
                }
                scheduled = true;
                setTimeout(function () {
                    scheduled = false;
                    organizeAllNavigation();
                    organizeFooter();
                    strengthenAuthPanel();
                }, 0);
            }).observe(document.body, { childList: true, subtree: true });
        }
    }

    onReady(init);
})();