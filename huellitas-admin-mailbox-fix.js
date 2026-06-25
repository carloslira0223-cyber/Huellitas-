/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Ajuste visual para textos largos en bandeja admin.
 */
(function () {
    const styleId = "huellitasAdminMailboxFixStyles";

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
#mensajesGuardados,.mailbox-admin-item{min-width:0!important}
.mailbox-admin-item{overflow:hidden!important}
.mailbox-admin-item .status-line{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;gap:8px!important;min-width:0!important}
.mailbox-admin-item .status-line strong{flex:1 1 220px!important;min-width:0!important}
.mailbox-admin-item strong,.mailbox-admin-item span{max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
.mailbox-admin-item>span{line-height:1.45!important}
.mailbox-admin-item .admin-reply-row{grid-template-columns:minmax(0,1fr) auto!important;min-width:0!important}
.mailbox-admin-item .admin-reply-row input{width:100%!important;min-width:0!important}
@media(max-width:720px){.mailbox-admin-item .admin-reply-row{grid-template-columns:1fr!important}.mailbox-admin-item .admin-reply-row button{width:100%!important}}
        `;
        document.head.appendChild(style);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectStyles);
    } else {
        injectStyles();
    }
})();
