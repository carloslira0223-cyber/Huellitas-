/*!
 * Huellitas (c) 2026. Todos los derechos reservados.
 * Sincroniza mascotas creadas en admin con el servidor.
 */
(function () {
    const petStorageKey = "huellitasMascotasExtra";
    const adminAccessKey = "huellitasAdminActivo";
    const knownServerPetsKey = "huellitasMascotasServidorIds";
    let active = false;
    let timer = null;

    function readJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key)) || fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function hasAdminAccess() {
        return sessionStorage.getItem(adminAccessKey) === "true";
    }

    function petIds(items) {
        return (Array.isArray(items) ? items : [])
            .map((item) => item && item.id)
            .filter(Boolean);
    }

    function localPets() {
        return readJson(petStorageKey, []).filter((pet) => pet && pet.id && pet.nombre);
    }

    function knownIds() {
        return new Set(readJson(knownServerPetsKey, []));
    }

    function saveKnownIds(ids) {
        writeJson(knownServerPetsKey, Array.from(new Set((ids || []).filter(Boolean))));
    }

    function toast(title, message) {
        if (typeof window.mostrarAdminToast === "function") {
            window.mostrarAdminToast(title, message);
        }
    }

    async function request(path, options) {
        if (!window.huellitasApi || !window.huellitasApi.enabled || typeof window.huellitasApi.request !== "function") {
            return null;
        }

        try {
            return await window.huellitasApi.request(path, options);
        } catch (error) {
            console.warn(error.message);
            return null;
        }
    }

    async function syncLocalAdminPets() {
        if (active || !hasAdminAccess() || !window.huellitasApi || !window.huellitasApi.enabled) {
            return;
        }

        active = true;

        try {
            const data = await request("/api/team-data");
            const serverPets = data && Array.isArray(data.pets) ? data.pets : [];
            const serverIds = new Set(petIds(serverPets));
            const rememberedIds = knownIds();
            const pending = localPets().filter((pet) => !serverIds.has(pet.id) && !rememberedIds.has(pet.id));

            saveKnownIds([...rememberedIds, ...serverIds]);

            if (!pending.length) {
                return;
            }

            let uploaded = 0;

            for (const pet of pending) {
                const result = await request("/api/pets", {
                    method: "POST",
                    body: JSON.stringify(pet)
                });

                if (result && (result.ok || result.pet)) {
                    uploaded += 1;
                    if (result.pet && result.pet.id) {
                        serverIds.add(result.pet.id);
                    } else {
                        serverIds.add(pet.id);
                    }
                }
            }

            if (uploaded > 0) {
                saveKnownIds([...rememberedIds, ...serverIds]);
                window.dispatchEvent(new CustomEvent("huellitas:petsChanged"));

                if (typeof window.cargarMascotas === "function") {
                    window.cargarMascotas();
                }

                toast("Servidor actualizado", uploaded === 1 ? "1 mascota local se guardo para todos." : uploaded + " mascotas locales se guardaron para todos.");
            }
        } finally {
            active = false;
        }
    }

    function scheduleSync(delay) {
        window.clearTimeout(timer);
        timer = window.setTimeout(syncLocalAdminPets, delay || 500);
    }

    function init() {
        scheduleSync(900);

        window.addEventListener("huellitas:petsChanged", () => scheduleSync(900));
        window.addEventListener("storage", (event) => {
            if (event.key === petStorageKey || event.key === knownServerPetsKey) {
                scheduleSync(900);
            }
        });

        const adminForm = document.getElementById("adminAccessForm");
        if (adminForm) {
            adminForm.addEventListener("submit", () => scheduleSync(1500), true);
        }

        let attempts = 0;
        const watcher = window.setInterval(() => {
            attempts += 1;
            scheduleSync(100);

            if (hasAdminAccess() || attempts >= 12) {
                window.clearInterval(watcher);
            }
        }, 1500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
