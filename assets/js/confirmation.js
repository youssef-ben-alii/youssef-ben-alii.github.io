/* ==========================================================================
   MONDO MEDICAL — quote confirmation page renderer.
   ========================================================================== */
(function(){
  var STR = {
    en: { products:"Products", noRecord:"We couldn't find a recent request.", noRecordSub:"Please submit a quote request first.",
          exploreBtn:"Explore Equipment" },
    fr: { products:"Produits", noRecord:"Aucune demande récente n'a été trouvée.", noRecordSub:"Veuillez d'abord envoyer une demande de devis.",
          exploreBtn:"Découvrir les équipements" }
  };

  function init(){
    var lang = window.PAGE_LANG || "en";
    var s = STR[lang];
    var record = getLastQuoteRequest();
    var root = document.getElementById('confirmation-root');
    var emptyEl = document.getElementById('confirmation-empty');
    if(!root) return;

    if(!record){
      root.style.display = 'none';
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = '<div class="icon">'+veridianIcon('empty')+'</div>'+
        '<h2 class="h-md">'+s.noRecord+'</h2>'+
        '<p class="body-text" style="margin:14px auto 0">'+s.noRecordSub+'</p>'+
        '<a href="'+productEquipmentBase(lang)+'" class="btn btn-primary" style="margin-top:26px">'+s.exploreBtn+'</a>';
      return;
    }

    document.getElementById('confirm-ref').textContent = record.reference;
    document.getElementById('confirm-date').textContent = record.date;
    document.getElementById('confirm-count-label').textContent = s.products;
    var count = record.items.reduce(function(sum,it){ return sum+it.qty; }, 0);
    document.getElementById('confirm-count').textContent = count;

    document.getElementById('download-pdf-btn').addEventListener('click', function(){
      downloadQuoteSummaryPdf(record);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
