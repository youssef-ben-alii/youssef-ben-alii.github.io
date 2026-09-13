/* ==========================================================================
   MONDO MEDICAL — "My Quote" page renderer.
   ========================================================================== */
(function(){
  var STR = {
    en: { qty:"Quantity", remove:"Remove", empty:"Your quote is empty.",
          emptySub:"Explore our equipment and add the products you're interested in.",
          explore:"Explore Equipment", continueBrowsing:"Continue Browsing", requestQuote:"Request a Quote",
          itemsInQuote:"item(s) in your quote", priceNote:"Prices will be provided by our sales team." },
    fr: { qty:"Quantité", remove:"Retirer", empty:"Votre demande de devis est vide.",
          emptySub:"Découvrez nos équipements et ajoutez les produits qui vous intéressent.",
          explore:"Découvrir les équipements", continueBrowsing:"Continuer la navigation", requestQuote:"Demander un devis",
          itemsInQuote:"article(s) dans votre demande", priceNote:"Les prix vous seront communiqués par notre équipe commerciale." }
  };

  function render(){
    var lang = window.PAGE_LANG || "en";
    var s = STR[lang];
    var items = getQuote();
    var listEl = document.getElementById('quote-list');
    var emptyEl = document.getElementById('quote-empty');
    var summaryEl = document.getElementById('quote-summary');
    if(!listEl) return;

    if(!items.length){
      listEl.style.display = 'none';
      summaryEl.style.display = 'none';
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = '<div class="icon">'+veridianIcon('empty')+'</div>'+
        '<h2 class="h-md">'+s.empty+'</h2>'+
        '<p class="body-text" style="margin:14px auto 0">'+s.emptySub+'</p>'+
        '<a href="'+productEquipmentBase(lang)+'" class="btn btn-primary" style="margin-top:26px">'+s.explore+'</a>';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.style.display = 'block';
    summaryEl.style.display = 'block';

    listEl.innerHTML = items.map(function(it){
      var name = lang === "fr" ? it.name_fr : it.name_en;
      var key = quoteLineKey(it.id, it.brand);
      return (
        '<div class="quote-row" data-row="'+key+'">'+
          '<div class="q-thumb">'+veridianPlaceholder(it.icon, name)+'</div>'+
          '<div class="q-name-wrap">'+
            '<div class="q-name">'+name+'</div>'+
            '<div class="q-cat">'+categoryName(it.category, lang)+(it.brandName ? ' · '+it.brandName : '')+'</div>'+
            '<div class="q-remove-wrap"><button class="q-remove" data-remove="'+key+'">'+s.remove+'</button></div>'+
          '</div>'+
          '<div class="qty-stepper" data-qty-row="'+key+'">'+
            '<button type="button" data-qty-action="dec" aria-label="Decrease quantity">&minus;</button>'+
            '<input type="text" inputmode="numeric" value="'+it.qty+'" readonly aria-label="'+s.qty+'">'+
            '<button type="button" data-qty-action="inc" aria-label="Increase quantity">+</button>'+
          '</div>'+
        '</div>'
      );
    }).join('');

    var count = getQuoteCount();
    document.getElementById('quote-item-count').textContent = count + ' ' + s.itemsInQuote;
    document.getElementById('quote-price-note').textContent = s.priceNote;

    listEl.querySelectorAll('[data-qty-row]').forEach(function(wrap){
      wrap.addEventListener('click', function(e){
        var btn = e.target.closest('[data-qty-action]');
        if(!btn) return;
        var id = wrap.getAttribute('data-qty-row');
        if(btn.getAttribute('data-qty-action') === 'inc'){ increaseQuantity(id); }
        else { decreaseQuantity(id); }
        render();
      });
    });
    listEl.querySelectorAll('[data-remove]').forEach(function(btn){
      btn.addEventListener('click', function(){
        removeFromQuote(btn.getAttribute('data-remove'));
        render();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', render);
})();
