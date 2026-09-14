/* ==========================================================================
   MONDO MEDICAL — shared render helpers for product/category cards.
   Products are split into two independent catalogs by `type`:
   "equipment" -> /equipment/ (/equipements/), "instrument" -> /instruments/.
   Each product can be supplied by several brands (product.brands is an
   array of brand ids), reflecting the real supplier catalog.
   ========================================================================== */

var VQ_STR = {
  en: { explore:"Explore", featured:"Featured" },
  fr: { explore:"Découvrir", featured:"En vedette" }
};

function productEquipmentBase(lang){ return lang === "fr" ? "/fr/equipements/" : "/en/equipment/"; }
function productInstrumentsBase(lang){ return "/" + lang + "/instruments/"; }
function productBase(product, lang){ return product.type === "instrument" ? productInstrumentsBase(lang) : productEquipmentBase(lang); }

function productUrl(product, lang){
  return productBase(product, lang) + product.slug[lang] + "/";
}

function categoryName(catId, lang){
  var all = (VERIDIAN_DATA.categories || []).concat(VERIDIAN_DATA.instrumentCategories || []);
  var cat = all.filter(function(c){ return c.id === catId; })[0];
  return cat ? cat.name[lang] : catId;
}

function brandName(brandId){
  var b = (VERIDIAN_DATA.brands || []).filter(function(x){ return x.id === brandId; })[0];
  return b ? b.name : brandId;
}

function productCardHtml(product, lang){
  var s = VQ_STR[lang];
  var brandsLine = (product.brands || []).map(brandName).slice(0,3).join(', ');
  if((product.brands||[]).length > 3){ brandsLine += '…'; }
  return (
    '<a class="card product-card fade-in" href="'+productUrl(product, lang)+'">'+
      '<div class="media">'+
        veridianPlaceholder(product.icon, product.name[lang], productPhotoUrl(product.id))+
        (product.featured ? '<span class="tag">'+s.featured+'</span>' : '')+
      '</div>'+
      '<div class="card-body">'+
        '<div class="card-eyebrow">'+categoryName(product.category, lang)+'</div>'+
        '<h3 class="card-title">'+product.name[lang]+'</h3>'+
        (brandsLine ? '<p class="card-desc">'+brandsLine+'</p>' : '')+
      '</div>'+
    '</a>'
  );
}

function categoryCardHtml(cat, lang, baseUrl){
  var s = VQ_STR[lang];
  var base = baseUrl || productEquipmentBase(lang);
  var href = base + "?category=" + cat.id;
  return (
    '<article class="card category-card fade-in">'+
      '<a class="media" href="'+href+'">'+veridianPlaceholder(cat.icon, cat.name[lang])+'</a>'+
      '<div class="card-body">'+
        '<h3 class="card-title">'+cat.name[lang]+'</h3>'+
        '<p class="card-desc">'+cat.desc[lang]+'</p>'+
        '<a href="'+href+'" class="text-link" style="margin-top:14px">'+s.explore+' <span class="arrow">'+veridianIcon('arrow')+'</span></a>'+
      '</div>'+
    '</article>'
  );
}
