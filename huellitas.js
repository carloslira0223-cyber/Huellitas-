(function () {
    const version = "20260624-settings-themes";

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
        writeScript("huellitas-profile-mobile.js");
    } else {
        appendScript("huellitas-original.js", () => {
            appendScript("huellitas-fixes.js", () => {
                appendScript("huellitas-pet-polish.js", () => appendScript("huellitas-profile-mobile.js"));
            });
        });
    }
})();
