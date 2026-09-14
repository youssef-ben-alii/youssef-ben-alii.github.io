/* ==========================================================================
   MONDO MEDICAL — product detail page renderer (real supplier catalog).
   Requires window.PRODUCT_ID and window.PAGE_LANG to be set on the page.
   These products come from a real inventory export: only category, model
   (when known) and supplying brands are real data — no descriptions,
   features or specifications are invented for them.
   ========================================================================== */
(function(){
  var STR = {
    en: { addToQuote:"Add to Quote", requestInfo:"Request Information",
          priceNote:"Price on request. Our sales team will provide pricing tailored to your requirements.",
          category:"Category", model:"Model", modelUnknown:"Not specified",
          brand:"Brand", brandUnselected:"Not selected — choose one below",
          brandRequired:"Please select a brand below before adding this item to your quote.",
          brandsTitle:"Available from these brands", noBrands:"Supplier not specified in our current catalog.",
          infoNote:"This item is part of our supplier catalog. Contact our sales team for full technical specifications and availability.",
          related:"Related Items",
          breadcrumbHome:"Home", breadcrumbEquip:"Equipment", breadcrumbInstruments:"Instruments" },
    fr: { addToQuote:"Ajouter au devis", requestInfo:"Demander des informations",
          priceNote:"Prix sur demande. Notre équipe commerciale vous communiquera un tarif adapté à vos besoins.",
          category:"Catégorie", model:"Modèle", modelUnknown:"Non indiqué",
          brand:"Marque", brandUnselected:"Non sélectionnée — choisissez-en une ci-dessous",
          brandRequired:"Veuillez sélectionner une marque ci-dessous avant d'ajouter cet article à votre devis.",
          brandsTitle:"Disponible chez ces marques", noBrands:"Fournisseur non indiqué dans notre catalogue actuel.",
          infoNote:"Cet article fait partie de notre catalogue fournisseurs. Contactez notre équipe commerciale pour les spécifications techniques complètes et la disponibilité.",
          related:"Articles associés",
          breadcrumbHome:"Accueil", breadcrumbEquip:"Équipements", breadcrumbInstruments:"Instruments" }
  };

  function init(){
    var lang = window.PAGE_LANG || "en";
    var s = STR[lang];
    var product = findProductById(window.PRODUCT_ID);
    var root = document.getElementById('product-detail-root');
    if(!product || !root) return;

    recordProductView(product.id);
    document.title = product.name[lang] + " — Mondo Medical";

    var isInstrument = product.type === "instrument";
    var catUrl = productBase(product, lang);
    var catLabel = isInstrument ? s.breadcrumbInstruments : s.breadcrumbEquip;
    var homeUrl = lang === "fr" ? "/fr/" : "/en/";
    var thisUrl = productUrl(product, lang);

    var brandIds = product.brands || [];
    var params = new URLSearchParams(window.location.search);
    var selectedBrand = params.get('brand');
    if(selectedBrand && brandIds.indexOf(selectedBrand) === -1){ selectedBrand = null; }

    document.getElementById('pd-breadcrumb').innerHTML =
      '<a href="'+homeUrl+'">'+s.breadcrumbHome+'</a><span>/</span>'+
      '<a href="'+catUrl+'">'+catLabel+'</a><span>/</span><span>'+product.name[lang]+'</span>';

    var photoBases = [];
    if(selectedBrand){ photoBases.push(productPhotoUrl(product.id+'--'+selectedBrand)); }
    photoBases.push(productPhotoUrl(product.id));
    document.getElementById('pd-gallery-main').innerHTML = veridianPlaceholder(product.icon, product.name[lang], photoBases);
    document.getElementById('pd-thumbs').innerHTML = '';

    document.getElementById('pd-category').textContent = categoryName(product.category, lang);
    document.getElementById('pd-title').textContent = product.name[lang];
    document.getElementById('pd-selected-brand').textContent = s.brand + ': ' + (selectedBrand ? brandName(selectedBrand) : s.brandUnselected);
    document.getElementById('pd-brand').textContent = s.model + ': ' + (product.model || s.modelUnknown);
    document.getElementById('pd-short').textContent = s.infoNote;
    document.getElementById('pd-price-note').textContent = s.priceNote;

    var brandErrorEl = document.getElementById('pd-brand-required-msg');
    brandErrorEl.textContent = s.brandRequired;
    function brandIsRequired(){ return brandIds.length && !selectedBrand; }
    document.getElementById('pd-add-btn').addEventListener('click', function(){
      if(brandIsRequired()){
        brandErrorEl.style.display = 'block';
        return;
      }
      brandErrorEl.style.display = 'none';
      var qty = parseInt(document.getElementById('pd-qty-input').value,10) || 1;
      addToQuote(product.id, qty, selectedBrand);
    });
    document.getElementById('pd-add-btn').textContent = s.addToQuote;
    var requestInfoUrl = (lang === "fr" ? "/fr/contact/" : "/en/contact/") + "?product=" + encodeURIComponent(product.name[lang]) +
      (selectedBrand ? "&brand=" + encodeURIComponent(brandName(selectedBrand)) : "");
    var infoBtn = document.getElementById('pd-info-btn');
    infoBtn.textContent = s.requestInfo;
    infoBtn.href = requestInfoUrl;
    infoBtn.addEventListener('click', function(e){
      if(brandIsRequired()){
        e.preventDefault();
        brandErrorEl.style.display = 'block';
      } else {
        brandErrorEl.style.display = 'none';
      }
    });

    var brandsHtml;
    if(brandIds.length){
      brandsHtml = '<div class="app-chip-row">'+ brandIds.map(function(bid){
        var url = thisUrl + "?brand=" + bid;
        var activeCls = bid === selectedBrand ? ' app-chip-active' : '';
        return '<a class="app-chip'+activeCls+'" href="'+url+'">'+brandName(bid)+'</a>';
      }).join('') + '</div>';
    } else {
      brandsHtml = '<p class="body-text">'+s.noBrands+'</p>';
    }
    document.getElementById('pd-brands-title').textContent = s.brandsTitle;
    document.getElementById('pd-brands-list').innerHTML = brandsHtml;

    var related = VERIDIAN_DATA.products.filter(function(p){ return p.category === product.category && p.type === product.type && p.id !== product.id; }).slice(0,3);
    var relatedSection = document.getElementById('related-products-section');
    if(related.length){
      document.getElementById('related-grid').innerHTML = related.map(function(p){ return productCardHtml(p, lang); }).join('');
      document.getElementById('related-title').textContent = s.related;
    } else if(relatedSection){
      relatedSection.style.display = 'none';
    }

    initFadeIn();
    initQtyStepper(document.getElementById('pd-qty-scope'), function(){});
  }

  document.addEventListener('DOMContentLoaded', function(){ VERIDIAN_DATA.ready.then(init); });
})();
