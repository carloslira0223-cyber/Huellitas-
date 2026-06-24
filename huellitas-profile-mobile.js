/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const styleId = "huellitasProfileMobileStyles";

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
.profile-tab-panel[hidden]{display:none!important}
.profile-tabs [data-profile-tab]{cursor:pointer}
.profile-tabs [data-profile-tab][aria-selected="true"]{background:var(--leaf-dark)!important;color:#fff!important}
[data-huellitas-theme-open],#huellitasThemePanel,[data-mobile-theme]{display:none!important}
@media(max-width:720px){
    .settings-panel:not([hidden]),.report-panel:not([hidden]){align-items:flex-start!important;padding:calc(12px + env(safe-area-inset-top,0px)) 10px 10px!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}
    .settings-card,.report-card{width:min(100%,560px)!important;max-height:calc(100dvh - 24px - env(safe-area-inset-top,0px))!important;padding:58px 16px 16px!important;overflow-y:auto!important;overscroll-behavior:contain!important}
    .settings-card .modal-close,.report-card .modal-close{position:absolute!important;top:10px!important;right:10px!important;z-index:5!important;width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important}
}
@media(max-width:640px){
    .site-nav{grid-template-columns:minmax(0,1fr) 40px max-content!important;column-gap:10px!important}
    .nav-menu-toggle{grid-column:2!important;justify-self:center!important;position:relative!important;z-index:2!important}
    .site-nav .nav-actions{grid-column:3!important;max-width:none!important;min-width:max-content!important;width:auto!important;gap:8px!important;justify-self:end!important;overflow:visible!important}
    .site-nav .nav-actions [data-settings-toggle]{display:inline-flex!important;order:-3}
    .site-nav .nav-actions [data-report-toggle],
    .site-nav .nav-actions [data-theme-toggle],
    .site-nav > .nav-actions > .button-link{display:none!important}
}
@media(max-width:420px){
    .site-nav{grid-template-columns:minmax(0,1fr) 38px max-content!important;column-gap:8px!important}
    .site-nav .nav-actions{max-width:none!important;gap:6px!important}
}
@media(max-width:360px){
    .site-nav{grid-template-columns:minmax(0,1fr) 36px max-content!important;column-gap:6px!important}
    .site-nav .nav-actions{max-width:none!important;gap:4px!important}
}
        `;
        document.head.appendChild(style);
    }

    function removeThemeControls() {
        document.querySelectorAll("[data-huellitas-theme-open],#huellitasThemePanel,[data-mobile-theme]").forEach((element) => {
            element.remove();
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
        if (typeof window.huellitasMountProfile !== "function" || window.huellitasMountProfile.profileMobileWrapped) {
            return;
        }

        const originalMount = window.huellitasMountProfile;
        window.huellitasMountProfile = function () {
            const result = originalMount.apply(this, arguments);
            window.setTimeout(() => {
                prepareProfileTabs();
                removeThemeControls();
            }, 0);
            return result;
        };
        window.huellitasMountProfile.profileMobileWrapped = true;
    }

    let scheduled = false;

    function scheduleUiRefresh() {
        if (scheduled) {
            return;
        }

        scheduled = true;
        window.setTimeout(() => {
            scheduled = false;
            removeThemeControls();
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

    onReady(() => {
        injectStyles();
        removeThemeControls();
        prepareProfileTabs();
        wrapProfileMount();

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
