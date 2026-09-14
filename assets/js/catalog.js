/* ==========================================================================
   MONDO MEDICAL — product catalog: search, filter, sort.
   Serves both the Equipment and Instruments catalogs — set
   window.CATALOG_TYPE to "equipment" (default) or "instrument" on the page
   before this script runs, so the right product subset and category list
   are used. A product can be supplied by several brands (product.brands).
   ========================================================================== */
(function(){
  var STR = {
    en: { all:"All Categories", allBrands:"All Brands", featured:"Featured", newest:"Newest", az:"A–Z", brand:"Brand",
          results:" results found", result:" result found", noResults:"No equipment found.",
          noResultsSub:"Try adjusting your search or filters." },
    fr: { all:"Toutes les catégories", allBrands:"Toutes les marques", featured:"En vedette", newest:"Plus récents", az:"A–Z", brand:"Marque",
          results:" résultats trouvés", result:" résultat trouvé", noResults:"Aucun équipement trouvé.",
          noResultsSub:"Essayez de modifier votre recherche ou vos filtres." }
  };

  function init(){
    var lang = window.PAGE_LANG || "en";
    var catalogType = window.CATALOG_TYPE || "equipment";
    var s = STR[lang];
    var grid = document.getElementById('product-grid');
    if(!grid) return;
    var searchInput = document.getElementById('catalog-search');
    var catSelect = document.getElementById('filter-category');
    var brandSelect = document.getElementById('filter-brand');
    var sortSelect = document.getElementById('sort-select');
    var countEl = document.getElementById('result-count');
    var emptyEl = document.getElementById('empty-results');

    var params = new URLSearchParams(window.location.search);
    var categoryList = catalogType === "instrument" ? VERIDIAN_DATA.instrumentCategories : VERIDIAN_DATA.categories;
    var baseProducts = VERIDIAN_DATA.products.filter(function(p){ return p.type === catalogType; });
    var brandsInScope = VERIDIAN_DATA.brands.filter(function(b){
      return baseProducts.some(function(p){ return (p.brands||[]).indexOf(b.id) !== -1; });
    }).sort(function(a,b){ return a.name.localeCompare(b.name); });

    categoryList.forEach(function(c){
      var opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.name[lang];
      catSelect.appendChild(opt);
    });
    brandsInScope.forEach(function(b){
      var opt = document.createElement('option');
      opt.value = b.id; opt.textContent = b.name;
      brandSelect.appendChild(opt);
    });
    catSelect.options[0].textContent = s.all;
    brandSelect.options[0].textContent = s.allBrands;
    sortSelect.options[0].textContent = s.featured;
    sortSelect.options[1].textContent = s.newest;
    sortSelect.options[2].textContent = s.az;
    sortSelect.options[3].textContent = s.brand;

    if(params.get('category')){ catSelect.value = params.get('category'); }
    if(params.get('brand')){ brandSelect.value = params.get('brand'); }
    if(params.get('q')){ searchInput.value = params.get('q'); }

    function matches(p, query){
      if(!query) return true;
      query = query.toLowerCase();
      var brandNames = (p.brands||[]).map(brandName).join(' ');
      var hay = [p.name.en, p.name.fr, categoryName(p.category,'en'), categoryName(p.category,'fr'), brandNames, p.model||''].join(' ').toLowerCase();
      return hay.indexOf(query) !== -1;
    }

    function render(){
      var query = searchInput.value.trim();
      var cat = catSelect.value;
      var brand = brandSelect.value;
      var sort = sortSelect.value;

      var items = baseProducts.filter(function(p){
        if(cat && p.category !== cat) return false;
        if(brand && (p.brands||[]).indexOf(brand) === -1) return false;
        if(!matches(p, query)) return false;
        return true;
      });

      if(sort === "az"){ items.sort(function(a,b){ return a.name[lang].localeCompare(b.name[lang]); }); }
      else if(sort === "brand"){
        items.sort(function(a,b){
          var an = brandName((a.brands||[])[0] || ''), bn = brandName((b.brands||[])[0] || '');
          return an.localeCompare(bn) || a.name[lang].localeCompare(b.name[lang]);
        });
      }
      else if(sort === "newest"){ items.sort(function(a,b){ return baseProducts.indexOf(b) - baseProducts.indexOf(a); }); }
      else { items.sort(function(a,b){ return getProductViewCount(b.id) - getProductViewCount(a.id) || (b.featured?1:0) - (a.featured?1:0); }); }

      grid.innerHTML = items.map(function(p){ return productCardHtml(p, lang); }).join('');
      countEl.textContent = items.length + (items.length === 1 ? s.result : s.results);
      emptyEl.style.display = items.length ? 'none' : 'block';
      emptyEl.querySelector('.empty-title').textContent = s.noResults;
      emptyEl.querySelector('.empty-sub').textContent = s.noResultsSub;
      initFadeIn();
    }

    [searchInput, catSelect, brandSelect, sortSelect].forEach(function(el){
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  }

  veridianOnReady(function(){ VERIDIAN_DATA.ready.then(init); });
})();
