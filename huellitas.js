(function () {
    const version = "20260624-final-ux";

    function writeScript(src) {
        document.write('<script src="' + src + '?v=' + version + '"><\/script>');
    }

    function appendScript(src, onload) {
        const script = document.createElement("script");
        script.src = src + "?v=" + version;
        script.onload = onload || null;
        document.head.appendChild(script);
    }

    if (document.readyState === "loading") {
        writeScript("huellitas-original.js");
        writeScript("huellitas-fixes.js");
        writeScript("huellitas-pet-polish.js");
        writeScript("huellitas-profile-touch.js");
        writeScript("huellitas-profile-mobile.js");
        writeScript("huellitas-pet-color.js");
        writeScript("huellitas-lost-pets.js");
        writeScript("huellitas-admin-secure.js");
        writeScript("huellitas-admin-pro.js");
        writeScript("huellitas-final-polish.js");
        writeScript("huellitas-ux-guard.js");
    } else {
        appendScript("huellitas-original.js", () => {
            appendScript("huellitas-fixes.js", () => {
                appendScript("huellitas-pet-polish.js", () => {
                    appendScript("huellitas-profile-touch.js", () => {
                        appendScript("huellitas-profile-mobile.js", () => {
                            appendScript("huellitas-pet-color.js", () => {
                                appendScript("huellitas-lost-pets.js", () => {
                                    appendScript("huellitas-admin-secure.js", () => {
                                        appendScript("huellitas-admin-pro.js", () => {
                                            appendScript("huellitas-final-polish.js", () => appendScript("huellitas-ux-guard.js"));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
})();
