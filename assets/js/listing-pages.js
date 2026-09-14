/* ==========================================================================
   MONDO MEDICAL — simple data-driven listing renderers used across
   the homepage, brands, services and news index pages.
   Each function is a no-op if its mount element isn't present on the page.
   ========================================================================== */
(function(){
  var lang = window.PAGE_LANG || "en";

  function renderCategoryGrid(){
    var mount = document.getElementById('home-category-grid');
    if(!mount) return;
    mount.innerHTML = VERIDIAN_DATA.categories.map(function(c){ return categoryCardHtml(c, lang); }).join('');
  }

  function renderFeaturedProducts(){
    var mount = document.getElementById('featured-product-grid');
    if(!mount) return;
    var items = getFeaturedProducts(6);
    mount.innerHTML = items.map(function(p){ return productCardHtml(p, lang); }).join('');
  }

  var BRAND_STR = {
    en: { equipment:"View Equipment", instruments:"View Instruments", moreInfo:"More info",
          results:" results found", result:" result found" },
    fr: { equipment:"Voir les équipements", instruments:"Voir les instruments", moreInfo:"Plus d'infos",
          results:" résultats trouvés", result:" résultat trouvé" }
  };

  function renderBrands(){
    var mount = document.getElementById('brand-grid');
    if(!mount) return;
    var s = BRAND_STR[lang];
    var searchInput = document.getElementById('brand-search');
    var countEl = document.getElementById('brand-count');
    var emptyEl = document.getElementById('brand-empty');
    var emptyIcon = document.getElementById('brand-empty-icon');
    if(emptyIcon){ emptyIcon.innerHTML = veridianIcon('empty'); }

    function draw(){
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var list = VERIDIAN_DATA.brands.filter(function(b){
        return !query || b.name.toLowerCase().indexOf(query) !== -1;
      });
      if(countEl){ countEl.textContent = list.length + (list.length === 1 ? s.result : s.results); }
      if(emptyEl){ emptyEl.style.display = list.length ? 'none' : 'block'; }
      mount.style.display = list.length ? '' : 'none';
      mount.innerHTML = list.map(renderBrandCard).join('');
      wireBrandToggles();
      initFadeIn();
    }

    if(searchInput){ searchInput.addEventListener('input', draw); }
    draw();
  }

  function wireBrandToggles(){
    document.querySelectorAll('[data-brand-toggle]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var card = btn.closest('.card');
        var panel = card ? card.querySelector('[data-brand-panel]') : null;
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if(panel){ panel.classList.toggle('open', !expanded); }
      });
    });
  }

  function renderBrandCard(b){
    var s = BRAND_STR[lang];
    var brandProducts = VERIDIAN_DATA.products.filter(function(p){ return (p.brands||[]).indexOf(b.id) !== -1; });
    var hasEquipment = brandProducts.some(function(p){ return p.type === 'equipment'; });
    var hasInstrument = brandProducts.some(function(p){ return p.type === 'instrument'; });
    var equipmentUrl = productEquipmentBase(lang) + '?brand=' + b.id;
    var instrumentsUrl = productInstrumentsBase(lang) + '?brand=' + b.id;
    var dual = hasEquipment && hasInstrument;

    var photoOpen, photoClose, indicator = '';
    if(dual){
      photoOpen = '<button type="button" class="media media-toggle" data-brand-toggle aria-expanded="false" aria-label="'+s.moreInfo+'">';
      photoClose = '</button>';
      indicator = '<span class="media-indicator">'+veridianIcon('chevronDown')+'</span>';
    } else {
      var photoHref = hasEquipment ? equipmentUrl : instrumentsUrl;
      photoOpen = '<a class="media" href="'+photoHref+'">';
      photoClose = '</a>';
    }

    var expandHtml = '';
    if(dual){
      expandHtml =
        '<div class="brand-panel" data-brand-panel>'+
          '<div class="brand-panel-inner" style="display:flex;gap:10px;flex-wrap:wrap">'+
            '<a href="'+equipmentUrl+'" class="btn btn-outline btn-sm">'+s.equipment+'</a>'+
            '<a href="'+instrumentsUrl+'" class="btn btn-outline btn-sm">'+s.instruments+'</a>'+
          '</div>'+
        '</div>';
    }

    return (
      '<article class="card fade-in">'+
        photoOpen + veridianPlaceholder('brandmark', b.name) + indicator + photoClose +
        '<div class="card-body">'+
          '<h3 class="card-title" style="text-align:left">'+b.name+'</h3>'+
          expandHtml +
        '</div>'+
      '</article>'
    );
  }

  function serviceIconMap(){
    return { sourcing:"diagnostic", installation:"hospital", training:"support", support:"support", maintenance:"reliable", aftersales:"tailored" };
  }

  function renderServices(){
    var mount = document.getElementById('service-grid');
    if(!mount) return;
    var icons = serviceIconMap();
    var note = lang === 'fr'
      ? "Service indicatif — à confirmer selon votre demande."
      : "Indicative service — to be confirmed based on your request.";
    mount.innerHTML = VERIDIAN_DATA.services.map(function(sv){
      return (
        '<div class="value-card fade-in">'+
          '<div class="icon">'+veridianIcon(icons[sv.id] || 'support')+'</div>'+
          '<h3>'+sv.name[lang]+'</h3>'+
          '<p>'+sv.desc[lang]+'</p>'+
          '<div class="placeholder-note">'+note+'</div>'+
        '</div>'
      );
    }).join('');
    initFadeIn();
  }

  function renderNewsIndex(){
    var mount = document.getElementById('news-grid');
    if(!mount) return;
    var base = lang === 'fr' ? '/fr/actualites/' : '/en/news/';
    var s = lang === 'fr' ? {read:'Lire l’article'} : {read:'Read Article'};
    var sorted = VERIDIAN_DATA.news.slice().sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
    mount.innerHTML = sorted.map(function(r){
      var href = base + r.id + '/';
      return (
        '<article class="card fade-in">'+
          '<a class="media" href="'+href+'">'+veridianPlaceholder('diagnostic', r.title[lang])+'</a>'+
          '<div class="card-body">'+
            '<div class="card-eyebrow">'+new Date(r.date).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',{year:'numeric',month:'long',day:'numeric'})+'</div>'+
            '<h3 class="card-title"><a href="'+href+'">'+r.title[lang]+'</a></h3>'+
            '<p class="card-desc">'+r.excerpt[lang]+'</p>'+
            '<a href="'+href+'" class="text-link" style="margin-top:14px">'+s.read+' <span class="arrow">'+veridianIcon('arrow')+'</span></a>'+
          '</div>'+
        '</article>'
      );
    }).join('');
    initFadeIn();
  }

  veridianOnReady(function(){
    VERIDIAN_DATA.ready.then(function(){
      renderCategoryGrid();
      renderFeaturedProducts();
      renderBrands();
      renderServices();
      renderNewsIndex();
      initFadeIn();
    });
  });
})();
