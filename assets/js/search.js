/* ==========================================================================
   MONDO MEDICAL — global search results page.
   ========================================================================== */
(function(){
  var STR = {
    en: { resultsFor:"Search results for", results:" results found", result:" result found",
          noResults:"No equipment found.", noResultsSub:"Try a different search term, or browse our full equipment catalog.",
          browseAll:"Browse All Equipment" },
    fr: { resultsFor:"Résultats de recherche pour", results:" résultats trouvés", result:" résultat trouvé",
          noResults:"Aucun équipement trouvé.", noResultsSub:"Essayez un autre terme de recherche ou parcourez notre catalogue complet.",
          browseAll:"Voir tous les équipements" }
  };

  function init(){
    var lang = window.PAGE_LANG || "en";
    var s = STR[lang];
    var grid = document.getElementById('search-grid');
    if(!grid) return;
    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();

    document.getElementById('search-query-input').value = query;
    document.getElementById('search-form').addEventListener('submit', function(e){
      e.preventDefault();
      var val = document.getElementById('search-query-input').value.trim();
      window.location.search = '?q=' + encodeURIComponent(val);
    });

    var results = [];
    if(query){
      var q = query.toLowerCase();
      results = VERIDIAN_DATA.products.filter(function(p){
        var brandNames = (p.brands||[]).map(brandName).join(' ');
        var hay = [p.name.en, p.name.fr, categoryName(p.category,'en'), categoryName(p.category,'fr'),
          brandNames, p.model||''].join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }

    document.getElementById('search-summary').innerHTML = query
      ? s.resultsFor + ' &ldquo;' + query.replace(/</g,'&lt;') + '&rdquo; &mdash; ' + results.length + (results.length===1 ? s.result : s.results)
      : '';

    var emptyEl = document.getElementById('search-empty');
    if(!results.length){
      grid.innerHTML = '';
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = '<div class="icon">'+veridianIcon('empty')+'</div>'+
        '<h2 class="h-md">'+s.noResults+'</h2>'+
        '<p class="body-text" style="margin:14px auto 0">'+s.noResultsSub+'</p>'+
        '<a href="'+productEquipmentBase(lang)+'" class="btn btn-primary" style="margin-top:26px">'+s.browseAll+'</a>';
    } else {
      emptyEl.style.display = 'none';
      grid.innerHTML = results.map(function(p){ return productCardHtml(p, lang); }).join('');
    }
    initFadeIn();
  }

  veridianOnReady(function(){ VERIDIAN_DATA.ready.then(init); });
})();
