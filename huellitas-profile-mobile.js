/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const settingsKey = "huellitasAjustes";
    const styleId = "huellitasProfileMobileStyles";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function readSettings() {
        try {
            return Object.assign({}, JSON.parse(localStorage.getItem(settingsKey)) || {});
        } catch (error) {
            return {};
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    function refreshSettings() {
        if (typeof window.huellitasRefreshSettings === "function") {
            window.huellitasRefreshSettings();
        }
    }

    function keepDefaultColor() {
        const settings = readSettings();

        if (settings.accent && settings.accent !== "verde") {
            settings.accent = "verde";
            saveSettings(settings);
            refreshSettings();
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
.settings-card .color-options{display:none!important}
@media(max-width:640px){
    .site-nav{grid-template-columns:minmax(0,1fr) 40px minmax(116px,auto)!important}
    .site-nav .nav-actions{max-width:132px!important;width:auto!important;gap:6px!important;overflow:visible!important}
    .site-nav .nav-actions [data-settings-toggle]{display:inline-flex!important;order:-3}
    .site-nav .nav-actions [data-report-toggle],
    .site-nav .nav-actions [data-theme-toggle],
    .site-nav > .nav-actions > .button-link{display:none!important}
}
@media(max-width:420px){
    .site-nav{grid-template-columns:minmax(0,1fr) 38px minmax(112px,auto)!important}
    .site-nav .nav-actions{max-width:124px!important}
}
@media(max-width:360px){
    .site-nav{grid-template-columns:minmax(0,1fr) 36px minmax(104px,auto)!important}
    .site-nav .nav-actions{max-width:116px!important;gap:4px!important}
}
        `;
        document.head.appendChild(style);
    }

    function removeThemeControls() {
        document.querySelectorAll("[data-huellitas-theme-open],#huellitasThemePanel,[data-mobile-theme]").forEach((element) => {
            element.remove();
        });

        document.querySelectorAll(".settings-card .color-options").forEach((options) => {
            const label = options.previousElementSibling;

            if (label && label.tagName === "LABEL" && /color/i.test(label.textContent || "")) {
                label.remove();
            }

            options.remove();
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
            keepDefaultColor();
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
        keepDefaultColor();
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
