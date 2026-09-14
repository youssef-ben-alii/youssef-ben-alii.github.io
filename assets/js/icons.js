/* ==========================================================================
   MONDO MEDICAL — Icon registry.
   Minimal line-art SVGs used both as UI icons and as placeholder
   "photography" for products/categories (no stock imagery used).
   ========================================================================== */

var VERIDIAN_ICONS = {
  monitor:'<svg viewBox="0 0 64 64"><rect x="8" y="12" width="48" height="32" rx="2"/><line x1="22" y1="52" x2="42" y2="52"/><line x1="32" y1="44" x2="32" y2="52"/><polyline points="14,28 20,28 24,20 28,36 32,24 36,32 40,28 50,28"/></svg>',
  ecg:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24"/><polyline points="16,32 22,32 26,22 32,42 36,26 40,32 48,32"/></svg>',
  ultrasound:'<svg viewBox="0 0 64 64"><path d="M20 44c0-10 6-16 12-16s12 6 12 16"/><path d="M14 44c0-14 8-24 18-24s18 10 18 24"/><rect x="26" y="44" width="12" height="10" rx="1"/></svg>',
  infusion:'<svg viewBox="0 0 64 64"><rect x="24" y="8" width="16" height="10" rx="1"/><path d="M32 18v10"/><path d="M22 28h20l-3 26a3 3 0 0 1-3 3H28a3 3 0 0 1-3-3l-3-26z"/><line x1="24" y1="38" x2="40" y2="38"/></svg>',
  bed:'<svg viewBox="0 0 64 64"><path d="M8 40V22a2 2 0 0 1 2-2h6v10"/><path d="M8 40h48v10H8z"/><path d="M16 30h14v6H16z"/><line x1="30" y1="33" x2="52" y2="33"/><line x1="8" y1="50" x2="8" y2="56"/><line x1="56" y1="50" x2="56" y2="56"/></svg>',
  light:'<svg viewBox="0 0 64 64"><ellipse cx="32" cy="18" rx="20" ry="8"/><path d="M12 18c0 6 4 10 8 12M52 18c0 6-4 10-8 12"/><line x1="32" y1="26" x2="32" y2="40"/><circle cx="32" cy="46" r="6"/></svg>',
  centrifuge:'<svg viewBox="0 0 64 64"><rect x="10" y="34" width="44" height="18" rx="2"/><circle cx="32" cy="22" r="14"/><circle cx="32" cy="22" r="4"/><line x1="32" y1="8" x2="32" y2="12"/><line x1="46" y1="22" x2="42" y2="22"/><line x1="32" y1="36" x2="32" y2="32"/><line x1="18" y1="22" x2="22" y2="22"/></svg>',
  microscope:'<svg viewBox="0 0 64 64"><path d="M26 52h16"/><path d="M34 52V38"/><circle cx="34" cy="16" r="4"/><path d="M34 20v10l10 8a6 6 0 0 1-8 8l-14-14"/><path d="M18 46a8 8 0 1 0 12-10"/></svg>',
  defibrillator:'<svg viewBox="0 0 64 64"><rect x="10" y="14" width="44" height="30" rx="2"/><polyline points="16,29 22,29 26,21 32,37 36,25 40,29 48,29"/><path d="M22 50l6-6M42 50l-6-6"/></svg>',
  trolley:'<svg viewBox="0 0 64 64"><rect x="12" y="10" width="32" height="10"/><rect x="12" y="22" width="32" height="10"/><rect x="12" y="34" width="32" height="10"/><line x1="8" y1="10" x2="8" y2="52"/><line x1="48" y1="10" x2="48" y2="52"/><circle cx="16" cy="56" r="3"/><circle cx="40" cy="56" r="3"/></svg>',
  table:'<svg viewBox="0 0 64 64"><rect x="8" y="24" width="40" height="10" rx="1"/><path d="M48 24h6a2 2 0 0 1 2 2v8"/><line x1="14" y1="34" x2="14" y2="50"/><line x1="42" y1="34" x2="42" y2="50"/><line x1="54" y1="34" x2="54" y2="50"/></svg>',
  wheelchair:'<svg viewBox="0 0 64 64"><circle cx="22" cy="42" r="14"/><circle cx="50" cy="46" r="6"/><path d="M22 28v14h20l8 14"/><path d="M22 20h8"/></svg>',
  kit:'<svg viewBox="0 0 64 64"><rect x="10" y="22" width="44" height="30" rx="2"/><path d="M24 22v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><line x1="32" y1="30" x2="32" y2="44"/><line x1="25" y1="37" x2="39" y2="37"/></svg>',
  diagnostic:'<svg viewBox="0 0 64 64"><circle cx="27" cy="27" r="15"/><line x1="38" y1="38" x2="52" y2="52"/></svg>',
  hospital:'<svg viewBox="0 0 64 64"><rect x="12" y="16" width="40" height="38"/><line x1="32" y1="24" x2="32" y2="38"/><line x1="25" y1="31" x2="39" y2="31"/><line x1="20" y1="54" x2="20" y2="44"/><line x1="44" y1="54" x2="44" y2="44"/></svg>',
  lab:'<svg viewBox="0 0 64 64"><path d="M26 10v16L14 46a4 4 0 0 0 3.5 6h29a4 4 0 0 0 3.5-6L38 26V10"/><line x1="22" y1="10" x2="42" y2="10"/><line x1="22" y1="38" x2="42" y2="38"/></svg>',
  emergency:'<svg viewBox="0 0 64 64"><path d="M32 8c10 8 18 10 18 22 0 14-10 24-18 26-8-2-18-12-18-26 0-12 8-14 18-22z"/><line x1="32" y1="26" x2="32" y2="40"/><line x1="25" y1="33" x2="39" y2="33"/></svg>',
  furniture:'<svg viewBox="0 0 64 64"><rect x="10" y="30" width="36" height="8"/><path d="M46 30h6a2 2 0 0 1 2 2v6"/><line x1="16" y1="38" x2="16" y2="52"/><line x1="40" y1="38" x2="40" y2="52"/></svg>',
  mobility:'<svg viewBox="0 0 64 64"><circle cx="24" cy="44" r="12"/><circle cx="46" cy="46" r="5"/><path d="M24 32v12h18l6 12"/></svg>',
  consumables:'<svg viewBox="0 0 64 64"><rect x="14" y="18" width="36" height="34" rx="2"/><path d="M26 18v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><line x1="22" y1="30" x2="42" y2="30"/><line x1="22" y1="38" x2="42" y2="38"/></svg>',

  /* UI icons */
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  checkCircle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 19h14"/></svg>',
  quote:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h13M6 10h13M6 16h9"/><path d="M3 4h.01M3 10h.01M3 16h.01"/></svg>',
  cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
  precision:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>',
  reliable:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z"/><polyline points="9 12 11 14 15 10"/></svg>',
  support:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-7h3z"/><path d="M3 19a2 2 0 0 0 2 2h1v-7H3z"/></svg>',
  tailored:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 6 12 13 22 6"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2z"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  glove:'<svg viewBox="0 0 64 64"><path d="M20 30V14a4 4 0 0 1 8 0v10-12a4 4 0 0 1 8 0v12-10a4 4 0 0 1 8 0v18a4 4 0 0 1 8 0v10a14 14 0 0 1-14 14H30a14 14 0 0 1-14-14V36a4 4 0 0 1 4-4z"/></svg>',
  needle:'<svg viewBox="0 0 64 64"><rect x="8" y="40" width="20" height="10" rx="2" transform="rotate(-45 18 45)"/><line x1="24" y1="40" x2="52" y2="12"/><line x1="52" y1="12" x2="58" y2="6"/><line x1="30" y1="34" x2="36" y2="40"/></svg>',
  mask:'<svg viewBox="0 0 64 64"><path d="M8 26c8-6 40-6 48 0-2 10-10 20-24 20S10 36 8 26z"/><path d="M8 26c0-4 4-6 4-6M56 26c0-4-4-6-4-6"/><line x1="20" y1="30" x2="44" y2="30"/><line x1="20" y1="36" x2="44" y2="36"/></svg>',
  bandage:'<svg viewBox="0 0 64 64"><rect x="10" y="26" width="44" height="12" rx="6" transform="rotate(-30 32 32)"/><circle cx="22" cy="35" r="2.5"/><circle cx="42" cy="23" r="2.5"/></svg>',
  brandmark:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22"/><path d="M22 34l7 7 13-15"/></svg>',
  chevronDown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  instrument:'<svg viewBox="0 0 64 64"><path d="M20 20L44 44M44 20L20 44"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="48" r="6"/></svg>'
};

function veridianIcon(name, cls){
  var svg = VERIDIAN_ICONS[name] || VERIDIAN_ICONS.check;
  if(cls){ svg = svg.replace('<svg ', '<svg class="'+cls+'" '); }
  return svg;
}

/* Base URL (no extension) for a product photo stored in the Supabase Storage
   "product-photos" bucket — upload a file there named "<id>.jpg" (or
   "<id>--<brandId>.jpg" for a brand-specific photo) from the Supabase
   dashboard and it appears on the site automatically, no redeploy needed. */
function productPhotoUrl(id){
  var cfg = (window.VERIDIAN_CONFIG || {}).supabase;
  if(!cfg || !cfg.url || !id) return null;
  return cfg.url + '/storage/v1/object/public/product-photos/' + id;
}

/* photoPath (optional): base path WITHOUT extension, e.g. "/pictures/products/some-id",
   OR an array of base paths tried in priority order (e.g. a brand-specific photo first,
   then the generic product photo). For each base, .jpg is tried then .png. The icon
   stays underneath as an instant fallback if no photo file exists yet at any path. */
function veridianPlaceholder(iconKey, alt, photoPath){
  var iconHtml = '<div class="ph-visual" role="img" aria-label="'+(alt||'')+'">'+veridianIcon(iconKey)+'</div>';
  var bases = !photoPath ? [] : (Array.isArray(photoPath) ? photoPath.filter(Boolean) : [photoPath]);
  if(!bases.length) return iconHtml;
  var attempts = [];
  bases.forEach(function(b){ attempts.push(b+'.jpg', b+'.png'); });
  return (
    '<div class="ph-visual ph-has-photo" role="img" aria-label="'+(alt||'')+'">'+
      veridianIcon(iconKey)+
      '<img class="ph-photo" src="'+attempts[0]+'" alt="'+(alt||'')+'" loading="lazy" '+
        'data-fallback-stage="0" data-photo-attempts="'+attempts.join('|')+'" onerror="veridianPhotoError(this)">'+
    '</div>'
  );
}

/* Called via onerror on .ph-photo images. Steps through the remaining candidate
   paths, then gives up and hides the broken image so the icon underneath shows. */
function veridianPhotoError(img){
  var stage = parseInt(img.getAttribute('data-fallback-stage'), 10) + 1;
  var attempts = img.getAttribute('data-photo-attempts').split('|');
  if(stage < attempts.length){
    img.setAttribute('data-fallback-stage', String(stage));
    img.src = attempts[stage];
  } else {
    img.style.display = 'none';
  }
}
