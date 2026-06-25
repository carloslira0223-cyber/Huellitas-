/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Prohibida su copia, distribucion o uso sin autorizacion.
 */
(function () {
    const styleId = "huellitasFinalPolishStyles";
    const petStorageKey = "huellitasMascotasExtra";

    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function injectStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
.maze-grid{width:min(100%,340px)!important;max-width:340px!important;gap:5px!important;padding:8px!important;border-radius:14px!important}
.maze-cell{position:relative;overflow:hidden;border-radius:8px!important;min-width:0!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.maze-cell.dog>.mini-pet-sprite{display:none!important}
.maze-cell.dog::after{content:"🐶";font-size:clamp(18px,6vw,27px);line-height:1;filter:drop-shadow(0 3px 3px rgba(38,51,44,.16))}
.maze-cell.goal{font-size:clamp(17px,5vw,24px)!important}
.maze-controls{width:min(244px,100%)!important}
.maze-controls button{min-height:44px!important;padding:9px!important}
.inventory-emoji-icon{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border-radius:12px;background:rgba(207,231,244,.32);font-size:25px;line-height:1;box-shadow:inset 0 0 0 1px rgba(255,255,255,.32)}
.inventory-item .item-sprite-icon{display:none!important}
.featured-pets-grid.featured-carousel{position:relative;display:block;max-width:860px;min-height:342px;margin:0 auto;overflow:hidden}
.featured-pets-grid.featured-carousel .featured-pet{display:none;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);grid-template-rows:1fr;min-height:330px;animation:huellitas-carousel-in 360ms ease both}
.featured-pets-grid.featured-carousel .featured-pet.active{display:grid}
.featured-pets-grid.featured-carousel .featured-pet img{height:100%;min-height:330px}
.featured-carousel-controls{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px auto 0}
.featured-carousel-controls button{min-height:40px;margin:0;padding:8px 12px}
.featured-carousel-dots{display:flex;align-items:center;gap:7px}
.featured-carousel-dots button{width:10px;height:10px;min-height:10px;padding:0;border-radius:999px;background:rgba(95,157,99,.32);border:0;box-shadow:none}
.featured-carousel-dots button.active{width:26px;background:var(--leaf-dark)}
body.dark .inventory-emoji-icon{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(220,235,215,.12)}
body.dark .featured-carousel-dots button{background:rgba(220,235,215,.26)}
body.dark .featured-carousel-dots button.active{background:var(--leaf)}
@keyframes huellitas-carousel-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@media(max-width:720px){.maze-grid{width:min(100%,292px)!important;gap:4px!important;padding:6px!important}.maze-controls{width:min(216px,100%)!important;gap:7px!important}.maze-controls button{min-height:40px!important}.featured-pets-grid.featured-carousel{min-height:430px}.featured-pets-grid.featured-carousel .featured-pet{grid-template-columns:1fr;grid-template-rows:210px 1fr;min-height:420px}.featured-pets-grid.featured-carousel .featured-pet img{min-height:210px}.featured-carousel-controls{display:grid;grid-template-columns:auto 1fr auto;max-width:360px}.featured-carousel-dots{justify-content:center}}
        `;
        document.head.appendChild(style);
    }

    function isMazeVisible() {
        const panel = document.getElementById("game-maze");
        return Boolean(panel && !panel.hidden && panel.classList.contains("active"));
    }

    function guardMazeKeys() {
        if (document.documentElement.dataset.mazeKeyGuard === "true") {
            return;
        }

        document.documentElement.dataset.mazeKeyGuard = "true";
        document.addEventListener("keydown", (event) => {
            const mazeKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
            const tag = event.target && event.target.tagName;
            const editing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (event.target && event.target.isContentEditable);

            if (!mazeKeys.includes(event.key)) {
                return;
            }

            if (editing || !isMazeVisible()) {
                event.stopImmediatePropagation();
            }
        }, true);
    }

    function inventoryEmojiFromText(text) {
        const clean = String(text || "").toLowerCase();

        if (clean.includes("corona")) return "👑";
        if (clean.includes("moño") || clean.includes("mono")) return "🎀";
        if (clean.includes("collar")) return "🟢";
        if (clean.includes("pelota")) return "🎾";
        if (clean.includes("casita")) return "🏠";
        return "🎁";
    }

    function polishInventoryIcons() {
        document.querySelectorAll("#inventoryList .inventory-item").forEach((item) => {
            if (item.dataset.emojiPolished === "true") {
                return;
            }

            const sprite = item.querySelector(".item-sprite-icon");
            const firstIcon = item.querySelector(":scope > span");
            const icon = document.createElement("span");
            icon.className = "inventory-emoji-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = inventoryEmojiFromText(item.textContent);

            if (sprite) {
                sprite.replaceWith(icon);
            } else if (firstIcon) {
                firstIcon.replaceWith(icon);
            } else {
                item.insertBefore(icon, item.firstChild);
            }

            item.dataset.emojiPolished = "true";
        });
    }

    function observeInventory() {
        const list = document.getElementById("inventoryList");

        if (!list || list.dataset.emojiObserver === "true") {
            return;
        }

        list.dataset.emojiObserver = "true";
        new MutationObserver(polishInventoryIcons).observe(list, { childList: true, subtree: true });
        polishInventoryIcons();
    }

    function readPets() {
        try {
            return JSON.parse(localStorage.getItem(petStorageKey)) || [];
        } catch (error) {
            return [];
        }
    }

    function dispatchPetChange() {
        window.dispatchEvent(new CustomEvent("huellitas:petsChanged"));
    }

    function imageForType(type) {
        return String(type || "").toLowerCase() === "gato"
            ? "assets/imagenes/1000107795.jpg"
            : "assets/imagenes/1000107801.jpg";
    }

    function savePetsSafely(pets) {
        const normalized = Array.isArray(pets) ? pets : [];

        try {
            localStorage.setItem(petStorageKey, JSON.stringify(normalized));
            dispatchPetChange();
            return { ok: true, reduced: false };
        } catch (error) {
            const reduced = normalized.map((pet) => {
                const image = String(pet && pet.imagen || "");
                if (image.startsWith("data:") && image.length > 180000) {
                    return Object.assign({}, pet, { imagen: imageForType(pet.tipo) });
                }
                return pet;
            });

            localStorage.setItem(petStorageKey, JSON.stringify(reduced));
            dispatchPetChange();
            return { ok: true, reduced: true };
        }
    }

    function compressImage(file, maxSide, quality) {
        return new Promise((resolve) => {
            if (!file) {
                resolve("");
                return;
            }

            if (!/^image\//.test(file.type || "")) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result || "");
                reader.onerror = () => resolve("");
                reader.readAsDataURL(file);
                return;
            }

            const image = new Image();
            const reader = new FileReader();

            reader.onload = () => {
                image.onload = () => {
                    const ratio = Math.min(1, maxSide / Math.max(image.width || maxSide, image.height || maxSide));
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");

                    canvas.width = Math.max(1, Math.round((image.width || maxSide) * ratio));
                    canvas.height = Math.max(1, Math.round((image.height || maxSide) * ratio));
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", quality));
                };
                image.onerror = () => resolve(reader.result || "");
                image.src = reader.result;
            };
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
        });
    }

    function installPetAdminSaveFix() {
        if (!document.getElementById("petAdminForm") || window.guardarMascotaDesdeFormularioFinalPolish) {
            return;
        }

        const patched = async function (event) {
            event.preventDefault();

            if (typeof window.requiereAdmin === "function" && !window.requiereAdmin()) {
                return;
            }

            const form = document.getElementById("petAdminForm");
            const feedback = document.getElementById("petAdminFeedback");
            const fileInput = document.getElementById("petAdminPhoto");
            const type = (document.getElementById("petAdminType") || {}).value || "Perro";
            const name = ((document.getElementById("petAdminName") || {}).value || "").trim();
            const personality = ((document.getElementById("petAdminPersonality") || {}).value || "").trim();

            if (!name || personality.length < 4) {
                if (feedback) {
                    feedback.className = "form-note error";
                    feedback.textContent = "Completa nombre y personalidad para registrar la mascota.";
                }
                return;
            }

            const image = await compressImage(fileInput && fileInput.files && fileInput.files[0], 920, 0.72);
            const pet = {
                id: "pet-" + Date.now(),
                nombre: name,
                tipo: type,
                edad: ((document.getElementById("petAdminAge") || {}).value || "").trim(),
                estado: (document.getElementById("petAdminStatus") || {}).value || "Disponible",
                energia: (document.getElementById("petAdminEnergy") || {}).value || "medio",
                espacio: (document.getElementById("petAdminHome") || {}).value || "casa",
                rutina: (document.getElementById("petAdminRoutine") || {}).value || "familia",
                personalidad: personality,
                historia: ((document.getElementById("petAdminStory") || {}).value || "").trim(),
                imagen: image || imageForType(type),
                fecha: new Date().toLocaleString("es-MX")
            };
            const pets = readPets();
            pets.unshift(pet);

            try {
                const saved = savePetsSafely(pets);

                if (typeof window.apiPostAdmin === "function") {
                    window.apiPostAdmin("/api/pets", pet);
                } else if (window.huellitasApi && window.huellitasApi.enabled) {
                    window.huellitasApi.request("/api/pets", {
                        method: "POST",
                        body: JSON.stringify(pet)
                    }).catch(() => {});
                }

                if (typeof window.notificarLocal === "function") {
                    window.notificarLocal({
                        id: "new-pet-" + pet.id,
                        title: "Nueva mascota disponible",
                        body: pet.nombre + " fue agregada a adopciones.",
                        href: "adopcion_huellitas.html#mascotas",
                        kind: "pet"
                    });
                }

                if (form) {
                    form.reset();
                    delete form.dataset.adminProEditId;
                }

                if (feedback) {
                    feedback.className = "form-note success";
                    feedback.textContent = saved.reduced
                        ? pet.nombre + " se agrego. La foto se redujo para evitar el limite del navegador."
                        : pet.nombre + " se agrego a la galeria de adopcion.";
                }

                if (typeof window.mostrarAdminToast === "function") {
                    window.mostrarAdminToast("Mascota agregada", pet.nombre + " ya aparece en adopciones.");
                }

                if (typeof window.cargarMascotas === "function") {
                    window.cargarMascotas();
                }
            } catch (error) {
                if (feedback) {
                    feedback.className = "form-note error";
                    feedback.textContent = "No se pudo guardar. Intenta con una foto mas ligera o sin foto.";
                }
            }
        };

        window.guardarMascotaDesdeFormulario = patched;
        try {
            guardarMascotaDesdeFormulario = patched;
        } catch (error) {}
        window.guardarMascotaDesdeFormularioFinalPolish = true;
    }

    function featuredPetDataFromCard(card) {
        const link = card.querySelector("a[href]");
        const image = card.querySelector("img");
        const title = card.querySelector("h3");
        const text = card.querySelector("p");
        return {
            href: link ? link.getAttribute("href") : "adopcion_huellitas.html",
            image: image ? image.getAttribute("src") : "assets/imagenes/adopciones.jpg",
            alt: image ? image.getAttribute("alt") : "Mascota destacada",
            title: title ? title.textContent.trim() : "Huellita",
            text: text ? text.textContent.trim() : "Lista para conocer una familia responsable."
        };
    }

    function shuffle(items) {
        const next = items.slice();
        for (let index = next.length - 1; index > 0; index -= 1) {
            const swap = Math.floor(Math.random() * (index + 1));
            const temp = next[index];
            next[index] = next[swap];
            next[swap] = temp;
        }
        return next;
    }

    function buildFeaturedCarousel() {
        const grid = document.querySelector(".featured-pets-grid");

        if (!grid || grid.dataset.carouselReady === "true") {
            return;
        }

        const baseCards = Array.from(grid.querySelectorAll(".featured-pet"));
        if (baseCards.length < 2) {
            return;
        }

        const extraPets = readPets()
            .filter((pet) => pet && pet.estado !== "Adoptada")
            .slice(0, 5)
            .map((pet) => ({
                href: "adoptar.html?mascota=" + encodeURIComponent(pet.nombre) + "&tipo=" + encodeURIComponent(pet.tipo) + "#solicitud",
                image: pet.imagen || imageForType(pet.tipo),
                alt: pet.nombre + " en adopcion",
                title: pet.nombre,
                text: pet.historia || pet.personalidad || "Busca una familia responsable."
            }));
        const cards = shuffle(baseCards.map(featuredPetDataFromCard).concat(extraPets)).slice(0, 8);
        let current = 0;

        grid.dataset.carouselReady = "true";
        grid.classList.add("featured-carousel");
        grid.innerHTML = cards.map((card, index) => {
            return [
                '<article class="featured-pet' + (index === 0 ? " active" : "") + '">',
                '<img src="' + escapeHtml(card.image) + '" alt="' + escapeHtml(card.alt) + '">',
                '<div>',
                '<span class="status-badge status-aprobada">Disponible</span>',
                '<h3>' + escapeHtml(card.title) + '</h3>',
                '<p>' + escapeHtml(card.text) + '</p>',
                '<a class="button-link" href="' + escapeHtml(card.href) + '">Solicitar</a>',
                '</div>',
                '</article>'
            ].join("");
        }).join("");

        const controls = document.createElement("div");
        controls.className = "featured-carousel-controls";
        controls.innerHTML = [
            '<button class="secondary" type="button" data-featured-prev aria-label="Anterior">&#8592;</button>',
            '<div class="featured-carousel-dots" aria-label="Huellitas destacadas"></div>',
            '<button class="secondary" type="button" data-featured-next aria-label="Siguiente">&#8594;</button>'
        ].join("");
        grid.insertAdjacentElement("afterend", controls);

        const dots = controls.querySelector(".featured-carousel-dots");
        dots.innerHTML = cards.map((_, index) => '<button type="button" data-featured-dot="' + index + '" aria-label="Ver huellita ' + (index + 1) + '"></button>').join("");

        function show(index) {
            current = (index + cards.length) % cards.length;
            grid.querySelectorAll(".featured-pet").forEach((card, cardIndex) => {
                card.classList.toggle("active", cardIndex === current);
            });
            dots.querySelectorAll("button").forEach((dot, dotIndex) => {
                dot.classList.toggle("active", dotIndex === current);
            });
        }

        function randomNext() {
            if (cards.length < 2) {
                show(0);
                return;
            }

            let next = current;
            while (next === current) {
                next = Math.floor(Math.random() * cards.length);
            }
            show(next);
        }

        controls.querySelector("[data-featured-prev]").addEventListener("click", () => show(current - 1));
        controls.querySelector("[data-featured-next]").addEventListener("click", () => show(current + 1));
        dots.querySelectorAll("button").forEach((dot) => {
            dot.addEventListener("click", () => show(Number(dot.dataset.featuredDot)));
        });

        show(0);
        window.setInterval(randomNext, 5200);
    }

    function init() {
        injectStyles();
        guardMazeKeys();
        observeInventory();
        installPetAdminSaveFix();
        buildFeaturedCarousel();
        window.setTimeout(polishInventoryIcons, 500);
        window.setTimeout(observeInventory, 1200);
        window.setTimeout(installPetAdminSaveFix, 1200);
    }

    onReady(init);
    window.addEventListener("load", init);
    window.addEventListener("huellitas:petsChanged", () => {
        window.setTimeout(buildFeaturedCarousel, 80);
    });
})();
