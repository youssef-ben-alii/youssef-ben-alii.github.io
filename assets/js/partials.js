/* ==========================================================================
   MONDO MEDICAL — header/footer injection + global chrome behavior.
   Every page sets, before including this file:
     window.PAGE_LANG   = "en" | "fr"
     window.PAGE_KEY    = "home" | "equipment" | "instruments" | ... (nav highlight)
     window.ALT_LANG_URL = "/fr/..."  (equivalent page in the other language)
   ========================================================================== */
(function(){
  function injectPartial(url, mountId, done, unwrap){
    fetch(url).then(function(r){ return r.text(); }).then(function(html){
      var mount = document.getElementById(mountId);
      if(mount){
        if(unwrap){
          /* The header must be a direct child of <body>, not a small wrapper
             div sized to its own content -- position:sticky only stays
             pinned while scrolling through its parent's box, so a wrapper
             barely taller than the header itself made it un-stick and
             scroll away after ~1 header-height of scrolling. */
          mount.insertAdjacentHTML('afterend', html);
          mount.remove();
        } else {
          mount.innerHTML = html;
        }
      }
      if(done) done();
    }).catch(function(){ /* silent — page still usable without chrome on file:// */ });
  }

  function initHeader(){
    var lang = window.PAGE_LANG || "en";
    var pageKey = window.PAGE_KEY || "";
    var current = document.querySelectorAll('[data-page="'+pageKey+'"]');
    current.forEach(function(el){ el.setAttribute('aria-current','page'); });

    var altUrl = window.ALT_LANG_URL || (lang === "en" ? "/fr/" : "/en/");
    document.querySelectorAll('[data-lang-switch]').forEach(function(el){
      el.setAttribute('href', altUrl);
    });

    updateQuoteBadges();

    var header = document.getElementById('site-header');
    function onScroll(){
      if(!header) return;
      if(window.scrollY > 12){ header.classList.add('is-scrolled'); }
      else { header.classList.remove('is-scrolled'); }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();

    var drawer = document.querySelector('[data-drawer]');
    document.querySelectorAll('[data-drawer-open]').forEach(function(btn){
      btn.addEventListener('click', function(){ drawer && drawer.classList.add('open'); document.body.style.overflow='hidden'; });
    });
    document.querySelectorAll('[data-drawer-close]').forEach(function(btn){
      btn.addEventListener('click', function(){ drawer && drawer.classList.remove('open'); document.body.style.overflow=''; });
    });

    document.querySelectorAll('[data-icon]').forEach(function(el){
      if(window.veridianIcon){ el.innerHTML = veridianIcon(el.getAttribute('data-icon')); }
    });
  }

  function initFooter(){
    var y = document.querySelector('[data-year]');
    if(y){ y.textContent = new Date().getFullYear(); }
    var lang = window.PAGE_LANG || "en";
    var altUrl = window.ALT_LANG_URL || (lang === "en" ? "/fr/" : "/en/");
    document.querySelectorAll('[data-lang-switch]').forEach(function(el){
      el.setAttribute('href', altUrl);
    });
  }

  window.updateQuoteBadges = function(){
    var count = (window.getQuoteCount ? getQuoteCount() : 0);
    document.querySelectorAll('[data-quote-count]').forEach(function(el){
      el.textContent = count;
    });
  };

  window.bumpQuoteBadges = function(){
    document.querySelectorAll('.quote-badge').forEach(function(el){
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    });
  };

  veridianOnReady(function(){
    var lang = window.PAGE_LANG || "en";
    injectPartial('/partials/header-'+lang+'.html', 'site-header-slot', initHeader, true);
    injectPartial('/partials/footer-'+lang+'.html', 'site-footer-slot', initFooter);
  });
})();
