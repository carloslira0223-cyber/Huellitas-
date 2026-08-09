/*!
 * Proyecto Huellitas - Creado por Carlos Alexis Lira Alcala - 2026.
 * Todos los derechos reservados.
 * Experiencia final: perfil claro, accesibilidad y estabilidad visual.
 */
(function () {
    "use strict";

    const STYLE_ID = "huellitas-final-experience-style";
    const STYLE_URL = "huellitas-final-experience.css?v=20260808-final-v1";
    let refreshPending = false;

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

    function textOf(element, fallback) {
        const value = String(element && element.textContent || "").replace(/\s+/g, " ").trim();
        return value || fallback;
    }

    function getProfileTab(popover, name) {
        return popover.querySelector('[data-profile-tab="' + name + '"]');
    }

    function ensureSecondaryTabs(popover, tabs) {
        let details = popover.querySelector(".profile-secondary-tabs");
        if (!details) {
            details = document.createElement("details");
            details.className = "profile-secondary-tabs";
            details.innerHTML = '<summary><span>Más detalles</span><small>Reportes, logros y buzón</small></summary><div class="profile-secondary-tab-list"></div>';
            tabs.insertAdjacentElement("afterend", details);
        }

        let list = details.querySelector(".profile-secondary-tab-list");
        if (!list) {
            list = document.createElement("div");
            list.className = "profile-secondary-tab-list";
            details.appendChild(list);
        }

        const summary = details.querySelector("summary");
        if (summary) {
            summary.innerHTML = "<span>Más detalles</span><small>Reportes, logros y buzón</small>";
            summary.setAttribute("aria-label", "Abrir más detalles del perfil");
        }

        if (details.dataset.finalExperienceClose !== "true") {
            details.dataset.finalExperienceClose = "true";
            list.addEventListener("click", function (event) {
                if (event.target.closest("[data-profile-tab]")) {
                    details.open = false;
                }
            });
        }

        return { details: details, list: list };
    }

    function reorganizeProfileTabs(popover) {
        const tabs = popover.querySelector(".profile-tabs");
        if (!tabs) {
            return;
        }

        const secondary = ensureSecondaryTabs(popover, tabs);
        ["mascota", "patitas", "favoritos", "solicitudes"].forEach(function (name) {
            const button = getProfileTab(popover, name);
            if (button) {
                tabs.appendChild(button);
            }
        });

        ["reportes", "logros", "buzon"].forEach(function (name) {
            const button = getProfileTab(popover, name);
            if (button) {
                secondary.list.appendChild(button);
            }
        });
    }

    function profileMetric(popover, index) {
        const stats = popover.querySelector(".profile-stats");
        const stat = stats && stats.children[index];
        return textOf(stat && stat.querySelector("b"), "0");
    }

    function activePetName(popover) {
        const panel = popover.querySelector('[data-profile-panel="mascota"]');
        const name = panel && panel.querySelector(".profile-pet-summary strong");
        return textOf(name, "Sin mascota");
    }

    function createPriorityButton(label, value, tab) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "profile-priority-button";
        button.dataset.profilePriority = tab;

        const caption = document.createElement("span");
        caption.className = "profile-priority-label";
        caption.textContent = label;

        const number = document.createElement("strong");
        number.className = "profile-priority-value";
        number.textContent = value;

        button.append(caption, number);
        return button;
    }

    function updatePrioritySummary(popover) {
        let grid = popover.querySelector(".profile-priority-grid");
        const values = {
            mascota: activePetName(popover),
            patitas: profileMetric(popover, 0),
            favoritos: profileMetric(popover, 2),
            solicitudes: profileMetric(popover, 1)
        };
        const labels = {
            mascota: "Mascota activa",
            patitas: "Patitas",
            favoritos: "Favoritos",
            solicitudes: "Solicitudes"
        };

        if (!grid) {
            grid = document.createElement("div");
            grid.className = "profile-priority-grid";
            grid.setAttribute("aria-label", "Resumen del perfil");

            ["mascota", "patitas", "favoritos", "solicitudes"].forEach(function (tab) {
                grid.appendChild(createPriorityButton(labels[tab], values[tab], tab));
            });

            const stats = popover.querySelector(".profile-stats");
            const insertAfter = stats || popover.querySelector(".profile-popover-header");
            if (insertAfter) {
                insertAfter.insertAdjacentElement("afterend", grid);
            }
        }

        grid.querySelectorAll("[data-profile-priority]").forEach(function (button) {
            const tab = button.dataset.profilePriority;
            const value = button.querySelector(".profile-priority-value");
            if (value && values[tab] !== undefined) {
                value.textContent = values[tab];
                button.setAttribute("aria-label", labels[tab] + ": " + values[tab]);
            }
        });

        if (grid.dataset.finalExperienceReady !== "true") {
            grid.dataset.finalExperienceReady = "true";
            grid.addEventListener("click", function (event) {
                const button = event.target.closest("[data-profile-priority]");
                if (!button) {
                    return;
                }
                const tab = getProfileTab(popover, button.dataset.profilePriority);
                if (tab) {
                    tab.click();
                    const panel = popover.querySelector('[data-profile-panel="' + button.dataset.profilePriority + '"]');
                    if (panel) {
                        panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
                    }
                }
            });
        }
    }

    function organizeQuickAccess(popover) {
        const section = Array.from(popover.querySelectorAll(".profile-section")).find(function (item) {
            return textOf(item.querySelector(":scope > h3"), "").toLowerCase().indexOf("accesos") >= 0;
        });
        const grid = section && section.querySelector(".profile-actions-grid");

        if (!section || !grid) {
            return;
        }

        const links = Array.from(grid.querySelectorAll("a"));
        const primaryMatchers = [
            { match: "adopcion_huellitas", label: "Mascotas disponibles" },
            { match: "mi_adopcion", label: "Mi adopción" },
            { match: "jueguitos", label: "Cuidar mascota" }
        ];
        const primary = [];

        primaryMatchers.forEach(function (item) {
            const link = links.find(function (candidate) {
                return String(candidate.getAttribute("href") || "").indexOf(item.match) >= 0;
            });
            if (link) {
                link.textContent = item.label;
                primary.push(link);
                grid.appendChild(link);
            }
        });

        const utilityLinks = links.filter(function (link) {
            return primary.indexOf(link) < 0;
        });

        if (utilityLinks.length) {
            let details = section.querySelector(".profile-utility-links");
            if (!details) {
                details = document.createElement("details");
                details.className = "profile-utility-links";
                details.innerHTML = '<summary>Enlaces útiles</summary><div></div>';
                section.appendChild(details);
            }
            const list = details.querySelector("div");
            utilityLinks.forEach(function (link) {
                list.appendChild(link);
            });
        }
    }

    function enhanceProfile(popover) {
        if (!popover || !popover.querySelector(".profile-tabs")) {
            return;
        }

        popover.classList.add("profile-final-experience");
        popover.setAttribute("aria-label", "Perfil Huellitas");
        reorganizeProfileTabs(popover);
        updatePrioritySummary(popover);
        organizeQuickAccess(popover);
    }

    function strengthenEmptyStates() {
        document.querySelectorAll(".mini-empty, .empty-state").forEach(function (state) {
            state.classList.add("huellitas-friendly-empty");
            if (!state.hasAttribute("role")) {
                state.setAttribute("role", "status");
            }
        });
    }

    function strengthenMoreMenu() {
        document.querySelectorAll(".huellitas-structure-more").forEach(function (details) {
            const summary = details.querySelector(":scope > summary");
            const panel = details.querySelector(":scope > .huellitas-structure-more-panel");
            if (summary) {
                summary.setAttribute("aria-label", "Abrir más secciones");
                summary.setAttribute("aria-haspopup", "true");
            }
            if (panel) {
                panel.setAttribute("aria-label", "Secciones adicionales");
            }
        });
    }

    function installSkipLink() {
        const target = document.querySelector("main, .main-content, .page-content, #contenido");
        if (!target || document.getElementById("huellitas-skip-link")) {
            return;
        }

        if (!target.id) {
            target.id = "contenido-principal";
        }

        const link = document.createElement("a");
        link.id = "huellitas-skip-link";
        link.className = "huellitas-skip-link";
        link.href = "#" + target.id;
        link.textContent = "Saltar al contenido";
        document.body.insertBefore(link, document.body.firstChild);
    }

    function improveFormAccessibility() {
        document.querySelectorAll(".auth-message, .form-note, [data-profile-message-feedback]").forEach(function (element) {
            element.setAttribute("aria-live", "polite");
        });

        document.querySelectorAll("img").forEach(function (image) {
            if (!image.hasAttribute("loading") && !image.closest(".profile-chip")) {
                image.setAttribute("loading", "lazy");
            }
        });
    }

    function refresh() {
        refreshPending = false;
        ensureStyles();
        installSkipLink();
        document.querySelectorAll("#menuPerfil, .profile-popover").forEach(enhanceProfile);
        strengthenEmptyStates();
        strengthenMoreMenu();
        improveFormAccessibility();
    }

    function scheduleRefresh() {
        if (refreshPending) {
            return;
        }
        refreshPending = true;
        window.setTimeout(refresh, 80);
    }

    onReady(function () {
        refresh();
        [250, 900, 1800].forEach(function (delay) {
            window.setTimeout(refresh, delay);
        });
        ["huellitas:favoritesChanged", "huellitas:adoptionsChanged", "huellitas:reportsChanged", "huellitas:petsChanged", "huellitas:badgesChanged"].forEach(function (eventName) {
            window.addEventListener(eventName, scheduleRefresh);
        });
        if (document.body && window.MutationObserver) {
            new MutationObserver(scheduleRefresh).observe(document.body, { childList: true, subtree: true });
        }
    });
})();
