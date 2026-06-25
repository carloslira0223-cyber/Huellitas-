/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Refuerzo tactil para tabs del perfil movil.
 */
(function () {
    const styleId = "huellitasProfileTouchStyles";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.profile-tabs{touch-action:pan-x}
.profile-tabs [data-profile-tab]{position:relative;z-index:5;touch-action:manipulation;pointer-events:auto}
.profile-tabs [data-profile-tab][aria-selected="true"]{background:var(--leaf-dark)!important;color:#fff!important}
@media(max-width:720px){
    .mobile-profile-panel .profile-tabs{position:sticky!important;top:0!important;z-index:6!important;background:var(--surface,#fff)!important;border-radius:0 0 8px 8px!important}
    body.dark .mobile-profile-panel .profile-tabs{background:#17211b!important}
    .mobile-profile-panel .profile-tabs button{min-width:94px!important;min-height:42px!important}
}
        `;
        document.head.appendChild(style);
    }

    function activateProfileTab(tabButton) {
        const scope = tabButton.closest(".profile-popover")
            || tabButton.closest("[data-global-profile]")
            || document.querySelector(".profile-popover.mobile-profile-panel");
        const tabName = tabButton.dataset.profileTab;

        if (!scope || !tabName) {
            return;
        }

        scope.querySelectorAll("[data-profile-tab]").forEach((tab) => {
            const active = tab.dataset.profileTab === tabName;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", active ? "true" : "false");
        });

        scope.querySelectorAll("[data-profile-panel]").forEach((panel) => {
            const active = panel.dataset.profilePanel === tabName;
            panel.hidden = !active;
            panel.classList.toggle("active", active);
        });
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

    onReady(injectStyles);
})();
