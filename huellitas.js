(function () {
    const version = "20260628-treasure-v8";

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
        writeScript("huellitas-maze-keyguard.js");
        writeScript("huellitas-shop-icons.js");
        writeScript("huellitas-admin-mailbox-fix.js");
        writeScript("huellitas-admin-pet-sync.js");
        writeScript("huellitas-critical-fixes.js");
        writeScript("huellitas-navigation.js");
        writeScript("huellitas-treasure-ui.js");
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
                                            appendScript("huellitas-final-polish.js", () => {
                                                appendScript("huellitas-ux-guard.js", () => {
                                                    appendScript("huellitas-maze-keyguard.js", () => {
                                                        appendScript("huellitas-shop-icons.js", () => {
                                                            appendScript("huellitas-admin-mailbox-fix.js", () => {
                                                                appendScript("huellitas-admin-pet-sync.js", () => appendScript("huellitas-critical-fixes.js", () => appendScript("huellitas-navigation.js", () => appendScript("huellitas-treasure-ui.js"))));
                                                            });
                                                        });
                                                    });
                                                });
                                            });
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
