/* ==========================================================================
   MONDO MEDICAL — Quote (cart) system, client-side only.
   Persists to localStorage under VQ_STORAGE_KEY. No backend / no database.
   Quote item shape: { id, name_en, name_fr, category, icon, qty, brand, brandName }
   `brand`/`brandName` are null when the item was added without picking a
   specific supplier (e.g. the quick "Add to Quote" button on catalog cards).
   Two lines for the same product but different brands are kept separate,
   using quoteLineKey() as the row identity everywhere in the UI.
   ========================================================================== */
var VQ_STORAGE_KEY = "veridian_quote_v1";

function quoteLineKey(productId, brand){ return productId + (brand ? '::' + brand : ''); }

function getQuote(){
  try{
    var raw = localStorage.getItem(VQ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}

function saveQuote(items){
  try{
    localStorage.setItem(VQ_STORAGE_KEY, JSON.stringify(items));
  }catch(e){ /* storage unavailable — quote will not persist across pages */ }
  if(window.updateQuoteBadges) updateQuoteBadges();
  if(window.bumpQuoteBadges) bumpQuoteBadges();
}

function getQuoteCount(){
  return getQuote().reduce(function(sum, it){ return sum + it.qty; }, 0);
}

function findProductById(id){
  return (VERIDIAN_DATA.products || []).filter(function(p){ return p.id === id; })[0] || null;
}

function addToQuote(productId, qty, brand){
  qty = qty || 1;
  brand = brand || null;
  var product = findProductById(productId);
  if(!product) return;
  var items = getQuote();
  var key = quoteLineKey(productId, brand);
  var existing = items.filter(function(it){ return quoteLineKey(it.id, it.brand) === key; })[0];
  if(existing){ existing.qty += qty; }
  else {
    items.push({
      id: product.id,
      name_en: product.name.en,
      name_fr: product.name.fr,
      category: product.category,
      icon: product.icon,
      brand: brand,
      brandName: brand ? brandName(brand) : null,
      qty: qty
    });
  }
  saveQuote(items);
  var lang = window.PAGE_LANG || "en";
  var label = lang === "fr" ? (product.name.fr + " ajouté à votre demande de devis.") : (product.name.en + " added to your quote.");
  if(window.showToast) showToast(label);
}

function removeFromQuote(lineKey){
  var items = getQuote().filter(function(it){ return quoteLineKey(it.id, it.brand) !== lineKey; });
  saveQuote(items);
}

function increaseQuantity(lineKey){
  var items = getQuote();
  var it = items.filter(function(i){ return quoteLineKey(i.id, i.brand) === lineKey; })[0];
  if(it){ it.qty += 1; saveQuote(items); }
  return items;
}

function decreaseQuantity(lineKey){
  var items = getQuote();
  var it = items.filter(function(i){ return quoteLineKey(i.id, i.brand) === lineKey; })[0];
  if(it){
    it.qty -= 1;
    if(it.qty <= 0){ items = items.filter(function(i){ return quoteLineKey(i.id, i.brand) !== lineKey; }); }
    saveQuote(items);
  }
  return items;
}

function clearQuote(){
  saveQuote([]);
}

veridianOnReady(function(){
  if(window.updateQuoteBadges) updateQuoteBadges();
});
