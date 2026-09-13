/* ==========================================================================
   MONDO MEDICAL — "featured" products driven by actual product page views.
   Every time a product detail page is opened, its view count is
   incremented. Featured lists are then simply the most-viewed products.

   IMPORTANT LIMITATION: there is no backend/database in this version, so
   view counts are stored in the visitor's own browser (localStorage) —
   this reflects what a given visitor has looked at, not a true global
   "most popular across all customers" count. A real global popularity
   ranking would require a small server-side counter (see README).
   ========================================================================== */
var VQ_VIEWS_KEY = "mondo_product_views_v1";

function getProductViewCounts(){
  try{ return JSON.parse(localStorage.getItem(VQ_VIEWS_KEY) || "{}"); }
  catch(e){ return {}; }
}

function recordProductView(productId){
  var counts = getProductViewCounts();
  counts[productId] = (counts[productId] || 0) + 1;
  try{ localStorage.setItem(VQ_VIEWS_KEY, JSON.stringify(counts)); }catch(e){}
}

function getProductViewCount(productId){
  return getProductViewCounts()[productId] || 0;
}

/* Most-viewed products first; products never viewed fall back to the
   curated `featured` flag order so the homepage never looks empty for a
   first-time visitor. */
function getFeaturedProducts(limit){
  var counts = getProductViewCounts();
  var products = VERIDIAN_DATA.products.slice();
  products.sort(function(a, b){
    var diff = (counts[b.id] || 0) - (counts[a.id] || 0);
    if(diff !== 0) return diff;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });
  return products.slice(0, limit || 6);
}
