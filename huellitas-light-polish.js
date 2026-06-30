/*!
 * Proyecto Huellitas - Carlos Alexis Lira Alcala - 2026.
 * Carga el pulido visual del modo claro. Todos los derechos reservados.
 */
(function () {
    "use strict";

    const id = "huellitas-light-polish-css";
    if (document.getElementById(id)) {
        return;
    }

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "huellitas-light-polish.css?v=20260630-light-v1";
    document.head.appendChild(link);
})();
