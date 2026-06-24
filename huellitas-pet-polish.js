(function () {
    const styleId = "huellitasPetPolishStyles";

    function injectPetPolishStyles() {
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
#zonaMichi .section-title{text-align:center;max-width:780px;margin-inline:auto}
#zonaMichi .section-title p{margin-inline:auto}
#zonaMichi .pet-stage-panel,#zonaMichi .pet-side-panel{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(246,251,245,.94));box-shadow:0 22px 52px rgba(38,51,44,.12)}
#zonaMichi .pet-scene{box-shadow:inset 0 -34px 80px rgba(95,157,99,.16),0 18px 36px rgba(38,51,44,.1)}
#zonaMichi .pet-scene::after{content:"";position:absolute;inset:12px;z-index:0;border:1px solid rgba(255,255,255,.42);border-radius:inherit;pointer-events:none}
#zonaMichi .pet-avatar-wrap{justify-self:center;place-self:center;margin-inline:auto}
#zonaMichi .pet-wallet div{background:linear-gradient(180deg,rgba(207,231,244,.42),rgba(255,255,255,.72))}
#zonaMichi .pet-action-button{box-shadow:0 10px 22px rgba(38,51,44,.08)}
body.dark #zonaMichi .pet-stage-panel,body.dark #zonaMichi .pet-side-panel{background:linear-gradient(180deg,rgba(21,31,25,.96),rgba(12,18,15,.94));border-color:rgba(220,235,215,.14)}
body.dark #zonaMichi .pet-scene{box-shadow:inset 0 -34px 80px rgba(95,157,99,.12),0 18px 36px rgba(0,0,0,.28)}
body.dark #zonaMichi .pet-wallet div{background:rgba(255,255,255,.06);border-color:rgba(220,235,215,.12)}
@media(max-width:720px){
  #zonaMichi{padding-left:16px!important;padding-right:16px!important;overflow:hidden}
  #zonaMichi .section-title{text-align:center;margin-bottom:16px}
  #zonaMichi .pet-dashboard{display:grid!important;grid-template-columns:1fr!important;justify-items:center;width:100%;max-width:480px;margin:0 auto;gap:14px}
  #zonaMichi .pet-stage-panel,#zonaMichi .pet-side-panel{width:100%;max-width:480px;padding:18px!important}
  #zonaMichi .pet-stage-header{align-items:center;text-align:left;gap:10px}
  #zonaMichi .pet-stage-header h2{font-size:clamp(30px,10vw,42px)}
  #zonaMichi .pet-level-pill{min-height:36px;padding:8px 10px}
  #zonaMichi .pet-scene{width:100%;max-width:430px;min-height:356px!important;margin:0 auto;padding:16px!important;place-items:center;justify-items:center}
  #zonaMichi .pet-avatar-wrap{position:relative;width:min(276px,74vw)!important;min-height:260px!important;margin:0 auto;justify-self:center;place-self:center;transform:none!important}
  #zonaMichi .pet-sprite-stack{position:absolute!important;left:50%!important;right:auto!important;bottom:54px!important;transform:translateX(-50%) scale(3.05)!important;transform-origin:center bottom!important}
  #zonaMichi .pet-bed{bottom:48px}
  #zonaMichi .pet-head{top:42px;left:50%;transform:translateX(-50%)}
  #zonaMichi .pet-neck{top:104px;left:50%;transform:translateX(-50%)}
  #zonaMichi .pet-toy{right:clamp(18px,7vw,36px);bottom:48px}
  #zonaMichi .pet-scene p{left:12px;right:12px;bottom:12px;border-radius:16px}
  #zonaMichi .pet-thought{left:50%;top:12px;max-width:min(330px,calc(100% - 28px));transform:translate(-50%,8px) scale(.96);border-radius:20px 20px 20px 8px}
  #zonaMichi .pet-thought.visible{transform:translate(-50%,0) scale(1)}
  #zonaMichi .pet-thought::after{left:50%;transform:translateX(-50%)}
  #zonaMichi .pet-name-row>div{grid-template-columns:1fr;gap:8px}
  #zonaMichi .pet-name-row button{width:100%}
  #zonaMichi .pet-wallet,#zonaMichi .pet-stats,#zonaMichi .pet-actions,#zonaMichi .pet-action-note{max-width:430px;margin-left:auto;margin-right:auto}
}
@media(max-width:430px){
  #zonaMichi{padding-left:12px!important;padding-right:12px!important}
  #zonaMichi .pet-stage-panel,#zonaMichi .pet-side-panel{padding:14px!important}
  #zonaMichi .pet-scene{min-height:332px!important;max-width:100%}
  #zonaMichi .pet-avatar-wrap{width:min(242px,72vw)!important;min-height:240px!important}
  #zonaMichi .pet-sprite-stack{bottom:50px!important;transform:translateX(-50%) scale(2.72)!important}
  #zonaMichi .pet-bed{bottom:44px;transform:translateX(-50%) scale(.9)}
  #zonaMichi .pet-toy{right:18px;bottom:42px}
}
        `;
        document.head.appendChild(style);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectPetPolishStyles);
    } else {
        injectPetPolishStyles();
    }

    window.addEventListener("load", injectPetPolishStyles);
})();
