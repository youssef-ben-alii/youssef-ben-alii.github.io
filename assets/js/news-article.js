/* ==========================================================================
   MONDO MEDICAL — news article page renderer.
   Requires window.ARTICLE_ID and window.PAGE_LANG.
   ========================================================================== */
(function(){
  var STR = {
    en: { breadcrumbHome:"Home", breadcrumbNews:"News", related:"Related Equipment", published:"Published" },
    fr: { breadcrumbHome:"Accueil", breadcrumbNews:"Actualités", related:"Équipements associés", published:"Publié le" }
  };

  function init(){
    var lang = window.PAGE_LANG || "en";
    var s = STR[lang];
    var article = VERIDIAN_DATA.news.filter(function(x){ return x.id === window.ARTICLE_ID; })[0];
    var root = document.getElementById('article-root');
    if(!article || !root) return;

    document.title = article.title[lang] + " — Mondo Medical";
    var homeUrl = lang === 'fr' ? '/fr/' : '/en/';
    var newsBase = lang === 'fr' ? '/fr/actualites/' : '/en/news/';
    document.getElementById('article-breadcrumb').innerHTML =
      '<a href="'+homeUrl+'">'+s.breadcrumbHome+'</a><span>/</span><a href="'+newsBase+'">'+s.breadcrumbNews+'</a><span>/</span><span>'+article.title[lang]+'</span>';

    document.getElementById('article-title').textContent = article.title[lang];
    document.getElementById('article-date').textContent = s.published + ' ' + new Date(article.date).toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',{year:'numeric',month:'long',day:'numeric'});
    document.getElementById('article-body').innerHTML = article.body[lang].map(function(p){ return '<p>'+p+'</p>'; }).join('');

    var related = (article.relatedProducts||[]).map(findProductById).filter(Boolean);
    var relatedSection = document.getElementById('article-related-section');
    if(related.length){
      document.getElementById('article-related-title').textContent = s.related;
      document.getElementById('article-related-grid').innerHTML = related.map(function(p){ return productCardHtml(p, lang); }).join('');
    } else if(relatedSection){
      relatedSection.style.display = 'none';
    }

    initFadeIn();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
