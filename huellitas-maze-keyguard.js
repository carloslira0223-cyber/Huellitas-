/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Fuerza las flechas del laberinto a usar el mapa aleatorio.
 */
(function () {
    function isMazeVisible() {
        const panel = document.getElementById("game-maze");
        return Boolean(panel && !panel.hidden && panel.classList.contains("active"));
    }

    document.addEventListener("keydown", (event) => {
        const keys = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right"
        };
        const direction = keys[event.key];
        const tag = event.target && event.target.tagName;
        const editing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (event.target && event.target.isContentEditable);

        if (!direction || editing || !isMazeVisible() || typeof window.moverLaberinto !== "function") {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }
        window.moverLaberinto(direction);
    }, true);
})();
