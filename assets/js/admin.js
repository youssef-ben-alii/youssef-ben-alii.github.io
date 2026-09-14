/* ==========================================================================
   MONDO MEDICAL — admin dashboard (Supabase Auth + data management).
   Single-file admin app: login, analytics overview, quote request
   management, and full product CRUD (including photo upload).
   ========================================================================== */
(function(){
  var cfg = (window.VERIDIAN_CONFIG || {}).supabase;
  if(!cfg || !cfg.url || !window.supabase){
    document.getElementById('admin-login-error').textContent = "Configuration Supabase manquante.";
    document.getElementById('admin-login-error').style.display = 'block';
    return;
  }
  var client = window.supabase.createClient(cfg.url, cfg.anonKey);

  var CATEGORIES = {
    equipment: [
      ["imagerie","Imagerie"], ["monitoring","Monitoring et surveillance"],
      ["reanimation","Réanimation et anesthésie"], ["bloc-operatoire","Bloc opératoire"],
      ["mobilier-transport","Mobilier et transport"], ["laboratoire","Laboratoire"], ["autre","Autres équipements"]
    ],
    instrument: [
      ["optiques-endoscopie","Optiques et cœlioscopie"], ["pinces-prehension","Pinces et préhension"],
      ["ciseaux-coupe","Ciseaux et instruments coupants"], ["ecarteurs","Écarteurs et crochets"],
      ["aiguilles-canules","Aiguilles et canules"], ["porte-aiguilles-sutures","Porte-aiguilles et sutures"],
      ["cables-electrodes","Câbles et électrodes"], ["autre","Autres instruments"]
    ]
  };
  function categoryLabel(type, id){
    var list = CATEGORIES[type] || [];
    for(var i=0;i<list.length;i++){ if(list[i][0] === id) return list[i][1]; }
    return id;
  }

  function slugify(s){
    s = (s||"").toLowerCase();
    var map = {'à':'a','â':'a','ä':'a','é':'e','è':'e','ê':'e','ë':'e','î':'i','ï':'i','ô':'o','ö':'o','ù':'u','û':'u','ü':'u','ç':'c','œ':'oe','’':'-','\'':'-','°':''};
    s = s.replace(/[àâäéèêëîïôöùûüçœ’°']/g, function(c){ return map[c] !== undefined ? map[c] : c; });
    s = s.replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
    return s;
  }

  function photoUrl(id, ext){ return cfg.url + '/storage/v1/object/public/product-photos/' + id + '.' + ext; }

  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ==================== AUTH ==================== */
  var loginWrap = document.getElementById('admin-login');
  var appWrap = document.getElementById('admin-app');
  var loginForm = document.getElementById('admin-login-form');
  var loginError = document.getElementById('admin-login-error');

  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    loginError.style.display = 'none';
    var email = document.getElementById('admin-email').value.trim();
    var password = document.getElementById('admin-password').value;
    client.auth.signInWithPassword({ email: email, password: password }).then(function(res){
      if(res.error){
        loginError.textContent = "Identifiants incorrects.";
        loginError.style.display = 'block';
      }
    });
  });

  document.getElementById('admin-logout').addEventListener('click', function(){
    client.auth.signOut();
  });

  client.auth.onAuthStateChange(function(_event, session){
    if(session){ loginWrap.style.display = 'none'; appWrap.style.display = 'block'; initApp(); }
    else { loginWrap.style.display = 'flex'; appWrap.style.display = 'none'; }
  });

  /* ==================== TABS ==================== */
  var appInited = false;
  function wireTabs(){
    document.querySelectorAll('.admin-tab').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('.admin-tab').forEach(function(b){ b.classList.remove('active'); });
        document.querySelectorAll('.admin-panel').forEach(function(p){ p.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('panel-' + btn.getAttribute('data-tab')).classList.add('active');
      });
    });
  }

  function initApp(){
    if(appInited) return;
    appInited = true;
    wireTabs();
    loadOverview();
    wireQuotes();
    wireProducts();
  }

  /* ==================== OVERVIEW / ANALYTICS ==================== */
  var currentPeriod = 'month';
  var quoteRowsCache = null;

  function fetchQuoteRows(){
    if(quoteRowsCache) return Promise.resolve(quoteRowsCache);
    return client.from('quote_requests').select('id, reference, created_at, status, first_name, last_name, items')
      .order('created_at', { ascending: false })
      .then(function(res){
        quoteRowsCache = res.data || [];
        return quoteRowsCache;
      });
  }

  document.querySelectorAll('#overview-period .admin-period-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('#overview-period .admin-period-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      currentPeriod = btn.getAttribute('data-period');
      renderOverviewFromCache();
    });
  });

  function loadOverview(){
    fetchQuoteRows().then(function(){ renderOverviewFromCache(); });
  }

  function periodStart(period){
    var d = new Date();
    d.setHours(0,0,0,0);
    if(period === 'week'){ d.setDate(d.getDate() - 6); }
    else if(period === 'month'){ d.setDate(d.getDate() - 29); }
    else { d.setMonth(d.getMonth() - 11); d.setDate(1); }
    return d;
  }

  function bucketize(rows, period){
    var start = periodStart(period);
    var labels = [], keys = [], counts = [];
    var dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    var monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

    if(period === 'year'){
      var cursor = new Date(start);
      for(var i=0;i<12;i++){
        keys.push(cursor.getFullYear()+'-'+cursor.getMonth());
        labels.push(monthNames[cursor.getMonth()]);
        cursor.setMonth(cursor.getMonth()+1);
      }
    } else {
      var days = period === 'week' ? 7 : 30;
      var c2 = new Date(start);
      for(var j=0;j<days;j++){
        keys.push(c2.getFullYear()+'-'+c2.getMonth()+'-'+c2.getDate());
        labels.push(period === 'week' ? dayNames[c2.getDay()] : String(c2.getDate()));
        c2.setDate(c2.getDate()+1);
      }
    }
    counts = keys.map(function(){ return 0; });

    rows.forEach(function(r){
      var d = new Date(r.created_at);
      if(d < start) return;
      var key = period === 'year' ? (d.getFullYear()+'-'+d.getMonth()) : (d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate());
      var idx = keys.indexOf(key);
      if(idx !== -1) counts[idx]++;
    });

    return { labels: labels, counts: counts, start: start };
  }

  function renderOverviewFromCache(){
    var rows = quoteRowsCache || [];
    var bucket = bucketize(rows, currentPeriod);
    var inPeriod = rows.filter(function(r){ return new Date(r.created_at) >= bucket.start; });

    var pending = inPeriod.filter(function(r){ return r.status !== 'done'; }).length;
    var done = inPeriod.filter(function(r){ return r.status === 'done'; }).length;
    document.getElementById('overview-stats').innerHTML = [
      ['Demandes (période)', inPeriod.length],
      ['En attente', pending],
      ['Traitées', done]
    ].map(function(s){
      return '<div class="admin-stat"><div class="label">'+escapeHtml(s[0])+'</div><div class="value">'+s[1]+'</div></div>';
    }).join('');

    renderChart(bucket);
    renderTopProducts(inPeriod);
  }

  function roundedTopBarPath(x, y, w, h, r){
    if(h <= 0) return '';
    r = Math.min(r, w/2, h);
    return 'M'+x+','+(y+h)+
      ' L'+x+','+(y+r)+
      ' Q'+x+','+y+' '+(x+r)+','+y+
      ' L'+(x+w-r)+','+y+
      ' Q'+(x+w)+','+y+' '+(x+w)+','+(y+r)+
      ' L'+(x+w)+','+(y+h)+' Z';
  }

  function renderChart(bucket){
    var wrap = document.getElementById('overview-chart-wrap');
    var emptyEl = document.getElementById('overview-chart-empty');
    var total = bucket.counts.reduce(function(a,b){ return a+b; }, 0);
    var old = wrap.querySelector('svg');
    if(old) old.remove();
    var oldTip = wrap.querySelector('.admin-tooltip');
    if(oldTip) oldTip.remove();

    if(total === 0){
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    var n = bucket.counts.length;
    var band = 34, barW = 20, chartH = 160, axisY = chartH + 8, labelEvery = n > 15 ? 5 : 1;
    var width = Math.max(n * band, 320);
    var maxVal = Math.max.apply(null, bucket.counts);
    var niceMax = maxVal <= 5 ? 5 : Math.ceil(maxVal * 1.15);

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class','admin-chart');
    svg.setAttribute('width', width);
    svg.setAttribute('height', axisY + 22);
    svg.setAttribute('viewBox', '0 0 '+width+' '+(axisY+22));

    var axis = document.createElementNS(svgNS,'line');
    axis.setAttribute('x1',0); axis.setAttribute('x2',width);
    axis.setAttribute('y1',axisY); axis.setAttribute('y2',axisY);
    axis.setAttribute('class','admin-chart-axis');
    svg.appendChild(axis);

    var tooltip = document.createElement('div');
    tooltip.className = 'admin-tooltip';
    wrap.appendChild(tooltip);
    wrap.style.position = 'relative';

    bucket.counts.forEach(function(count, i){
      var h = Math.round((count / niceMax) * chartH);
      var x = i * band + (band - barW)/2;
      var y = axisY - h;
      var path = document.createElementNS(svgNS,'path');
      path.setAttribute('d', roundedTopBarPath(x, y, barW, h, 4));
      path.setAttribute('class','admin-bar');
      var hit = document.createElementNS(svgNS,'rect');
      hit.setAttribute('x', i*band); hit.setAttribute('y', 0);
      hit.setAttribute('width', band); hit.setAttribute('height', axisY);
      hit.setAttribute('fill','transparent');
      hit.style.cursor = 'pointer';

      function showTip(evt){
        tooltip.innerHTML = '<span class="v">'+count+'</span> demande'+(count===1?'':'s')+' — '+escapeHtml(bucket.labels[i]);
        tooltip.classList.add('show');
        var rect = wrap.getBoundingClientRect();
        tooltip.style.left = (i*band + band/2) + 'px';
        tooltip.style.top = (axisY - h - 8) + 'px';
      }
      hit.addEventListener('mouseenter', showTip);
      hit.addEventListener('mousemove', showTip);
      hit.addEventListener('mouseleave', function(){ tooltip.classList.remove('show'); });

      svg.appendChild(path);
      svg.appendChild(hit);

      if(i % labelEvery === 0){
        var t = document.createElementNS(svgNS,'text');
        t.setAttribute('x', i*band + band/2);
        t.setAttribute('y', axisY + 16);
        t.setAttribute('text-anchor','middle');
        t.setAttribute('class','admin-chart-tick');
        t.textContent = bucket.labels[i];
        svg.appendChild(t);
      }
    });

    wrap.appendChild(svg);
  }

  function renderTopProducts(rows){
    var counts = {};
    rows.forEach(function(r){
      (r.items || []).forEach(function(it){
        var name = it.name_fr || it.name_en || it.id;
        counts[name] = (counts[name] || 0) + (it.qty || 1);
      });
    });
    var top = Object.keys(counts).map(function(name){ return { name: name, count: counts[name] }; })
      .sort(function(a,b){ return b.count - a.count; }).slice(0, 10);

    var listEl = document.getElementById('overview-top-list');
    if(!top.length){
      listEl.innerHTML = '<p class="body-text">Aucune donnée sur cette période.</p>';
      return;
    }
    listEl.innerHTML = top.map(function(item, i){
      return '<li><span class="admin-top-rank">'+(i+1)+'</span>'+
        '<span class="admin-top-name">'+escapeHtml(item.name)+'</span>'+
        '<span class="admin-top-count">'+item.count+' demande'+(item.count===1?'':'s')+'</span></li>';
    }).join('');
  }

  /* ==================== QUOTES ==================== */
  function statusBadge(status){
    var isDone = status === 'done';
    return '<span class="admin-badge '+(isDone?'done':'new')+'">'+(isDone?'Traité':'En attente')+'</span>';
  }

  function renderQuotesTable(filterText){
    var rows = quoteRowsCache || [];
    var q = (filterText||'').trim().toLowerCase();
    var filtered = !q ? rows : rows.filter(function(r){
      var hay = [r.reference, r.first_name, r.last_name].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    var tbody = document.getElementById('quotes-tbody');
    var emptyEl = document.getElementById('quotes-empty');
    if(!filtered.length){
      tbody.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    tbody.innerHTML = filtered.map(function(r){
      var date = new Date(r.created_at).toLocaleDateString('fr-FR', {year:'numeric',month:'short',day:'numeric'});
      return (
        '<tr data-row="'+r.id+'">'+
          '<td>'+escapeHtml(r.reference)+'</td>'+
          '<td>'+date+'</td>'+
          '<td>'+escapeHtml((r.first_name||'')+' '+(r.last_name||''))+'</td>'+
          '<td>'+statusBadge(r.status)+'</td>'+
          '<td style="text-align:right"><button type="button" class="btn btn-outline btn-sm" data-view="'+r.id+'">Détails</button></td>'+
        '</tr>'
      );
    }).join('');
  }

  function toggleDetailRow(id){
    var existing = document.querySelector('tr.admin-row-detail[data-detail-for="'+id+'"]');
    if(existing){ existing.remove(); return; }
    document.querySelectorAll('tr.admin-row-detail').forEach(function(el){ el.remove(); });
    var r = (quoteRowsCache||[]).filter(function(x){ return x.id === id; })[0];
    if(!r) return;
    var row = document.querySelector('tr[data-row="'+id+'"]');
    var itemsHtml = (r.items||[]).map(function(it){
      var name = it.name_fr || it.name_en || it.id;
      return '<li>'+escapeHtml(name)+(it.brandName?' — '+escapeHtml(it.brandName):'')+' × '+ (it.qty||1) +'</li>';
    }).join('');
    var tr = document.createElement('tr');
    tr.className = 'admin-row-detail';
    tr.setAttribute('data-detail-for', id);
    tr.innerHTML = '<td colspan="5">'+
      '<div class="admin-detail-grid">'+
        '<div><span>Type de client :</span>'+escapeHtml(r.customer_type||'—')+'</div>'+
        '<div><span>Entreprise :</span>'+escapeHtml(r.company||'—')+'</div>'+
        '<div><span>E-mail :</span>'+escapeHtml(r.email||'—')+'</div>'+
        '<div><span>Téléphone :</span>'+escapeHtml(r.phone||'—')+'</div>'+
        '<div><span>Ville / Pays :</span>'+escapeHtml([r.city,r.country].filter(Boolean).join(', ')||'—')+'</div>'+
        '<div><span>Contact préféré :</span>'+escapeHtml(r.contact_method||'—')+'</div>'+
      '</div>'+
      '<div><strong>Articles demandés :</strong><ul class="admin-detail-items">'+itemsHtml+'</ul></div>'+
      (r.message ? '<div style="margin-top:10px"><strong>Message :</strong> '+escapeHtml(r.message)+'</div>' : '')+
      '<div style="margin-top:14px">'+
        '<button type="button" class="btn btn-outline btn-sm" data-toggle-status="'+id+'">'+
          (r.status === 'done' ? 'Marquer en attente' : 'Marquer traité') +
        '</button>'+
      '</div>'+
    '</td>';
    row.parentNode.insertBefore(tr, row.nextSibling);
  }

  function wireQuotes(){
    document.getElementById('quotes-search').addEventListener('input', function(e){
      renderQuotesTable(e.target.value);
    });
    document.getElementById('quotes-tbody').addEventListener('click', function(e){
      var viewBtn = e.target.closest('[data-view]');
      if(viewBtn){ toggleDetailRow(viewBtn.getAttribute('data-view')); return; }
      var toggleBtn = e.target.closest('[data-toggle-status]');
      if(toggleBtn){
        var id = toggleBtn.getAttribute('data-toggle-status');
        var r = (quoteRowsCache||[]).filter(function(x){ return x.id === id; })[0];
        if(!r) return;
        var newStatus = r.status === 'done' ? 'new' : 'done';
        client.from('quote_requests').update({ status: newStatus }).eq('id', id).then(function(res){
          if(res.error){ alert("Erreur : " + res.error.message); return; }
          r.status = newStatus;
          renderQuotesTable(document.getElementById('quotes-search').value);
          toggleDetailRow(id);
        });
      }
    });
    fetchQuoteRows().then(function(){ renderQuotesTable(''); });
  }

  /* ==================== PRODUCTS ==================== */
  var productsCache = null, brandsCache = null;

  function fetchProducts(){
    return client.from('products').select('*').order('name_fr').then(function(res){
      productsCache = res.data || [];
      return productsCache;
    });
  }
  function fetchBrands(){
    return client.from('brands').select('*').order('name').then(function(res){
      brandsCache = res.data || [];
      return brandsCache;
    });
  }
  function brandName(id){
    var b = (brandsCache||[]).filter(function(x){ return x.id === id; })[0];
    return b ? b.name : id;
  }

  function renderProductsTable(filterText){
    var q = (filterText||'').trim().toLowerCase();
    var rows = (productsCache||[]).filter(function(p){
      if(!q) return true;
      return (p.name_fr+' '+p.name_en).toLowerCase().indexOf(q) !== -1;
    });
    var tbody = document.getElementById('products-tbody');
    var emptyEl = document.getElementById('products-empty');
    if(!rows.length){ tbody.innerHTML=''; emptyEl.style.display='block'; return; }
    emptyEl.style.display = 'none';
    tbody.innerHTML = rows.slice(0, 200).map(function(p){
      var brandsLine = (p.brand_ids||[]).slice(0,3).map(brandName).join(', ') + ((p.brand_ids||[]).length>3?'…':'');
      return (
        '<tr>'+
          '<td>'+escapeHtml(p.name_fr)+'</td>'+
          '<td>'+(p.type==='equipment'?'Équipement':'Instrument')+'</td>'+
          '<td>'+escapeHtml(categoryLabel(p.type, p.category))+'</td>'+
          '<td>'+escapeHtml(brandsLine)+'</td>'+
          '<td style="text-align:right;white-space:nowrap">'+
            '<button type="button" class="btn btn-outline btn-sm" data-edit="'+p.id+'">Modifier</button> '+
            '<button type="button" class="btn btn-ghost btn-sm" data-delete="'+p.id+'" style="color:var(--danger)">Supprimer</button>'+
          '</td>'+
        '</tr>'
      );
    }).join('');
    if(rows.length > 200){
      tbody.innerHTML += '<tr><td colspan="5" class="body-text">'+rows.length+' résultats — affinez la recherche pour voir le reste.</td></tr>';
    }
  }

  function populateCategorySelect(type){
    var sel = document.getElementById('pf-category');
    var list = CATEGORIES[type] || [];
    sel.innerHTML = list.map(function(c){ return '<option value="'+c[0]+'">'+escapeHtml(c[1])+'</option>'; }).join('');
  }

  function renderBrandPicker(selectedIds){
    var picker = document.getElementById('pf-brand-picker');
    selectedIds = selectedIds || [];
    picker.innerHTML = (brandsCache||[]).map(function(b){
      var checked = selectedIds.indexOf(b.id) !== -1 ? ' checked' : '';
      return '<label data-brand-label="'+escapeHtml(b.name.toLowerCase())+'"><input type="checkbox" value="'+b.id+'"'+checked+'> '+escapeHtml(b.name)+'</label>';
    }).join('');
  }

  var modal = document.getElementById('product-modal');
  var form = document.getElementById('product-form');
  var formError = document.getElementById('product-form-error');
  var photoFile = null;

  function openModal(product){
    formError.style.display = 'none';
    form.reset();
    photoFile = null;
    document.getElementById('pf-id').value = product ? product.id : '';
    document.getElementById('product-modal-title').textContent = product ? 'Modifier l\'article' : 'Nouvel article';
    document.getElementById('pf-name-fr').value = product ? product.name_fr : '';
    document.getElementById('pf-name-en').value = product ? product.name_en : '';
    document.getElementById('pf-type').value = product ? product.type : 'equipment';
    populateCategorySelect(product ? product.type : 'equipment');
    if(product) document.getElementById('pf-category').value = product.category;
    document.getElementById('pf-model').value = product ? (product.model||'') : '';
    document.getElementById('pf-desc-fr').value = product ? (product.description_fr||'') : '';
    document.getElementById('pf-desc-en').value = product ? (product.description_en||'') : '';
    renderBrandPicker(product ? product.brand_ids : []);

    var preview = document.getElementById('pf-photo-preview');
    if(product){
      preview.style.display = 'block';
      preview.setAttribute('data-stage','0');
      preview.src = photoUrl(product.id, 'jpg');
      preview.onerror = function(){
        if(preview.getAttribute('data-stage') === '0'){ preview.setAttribute('data-stage','1'); preview.src = photoUrl(product.id,'png'); }
        else { preview.style.display = 'none'; }
      };
    } else {
      preview.style.display = 'none';
    }
    modal.style.display = 'flex';
  }
  function closeModal(){ modal.style.display = 'none'; }

  document.getElementById('product-add-btn').addEventListener('click', function(){ openModal(null); });
  document.getElementById('product-form-cancel').addEventListener('click', closeModal);
  document.getElementById('pf-type').addEventListener('change', function(e){ populateCategorySelect(e.target.value); });
  document.getElementById('pf-photo').addEventListener('change', function(e){ photoFile = e.target.files[0] || null; });
  document.getElementById('pf-brand-search').addEventListener('input', function(e){
    var q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('#pf-brand-picker label').forEach(function(l){
      l.style.display = l.getAttribute('data-brand-label').indexOf(q) !== -1 ? '' : 'none';
    });
  });

  function uniqueProductId(baseName, excludeId){
    var base = slugify(baseName) || 'article';
    var existingIds = (productsCache||[]).map(function(p){ return p.id; });
    if(excludeId) existingIds = existingIds.filter(function(id){ return id !== excludeId; });
    if(existingIds.indexOf(base) === -1) return base;
    var n = 2;
    while(existingIds.indexOf(base + '-' + n) !== -1){ n++; }
    return base + '-' + n;
  }

  function uploadPhotoIfAny(id){
    if(!photoFile) return Promise.resolve();
    var ext = /png/i.test(photoFile.type) ? 'png' : 'jpg';
    return client.storage.from('product-photos').upload(id + '.' + ext, photoFile, { upsert: true, contentType: photoFile.type })
      .then(function(res){ if(res.error){ throw new Error(res.error.message); } });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formError.style.display = 'none';
    var existingId = document.getElementById('pf-id').value;
    var nameFr = document.getElementById('pf-name-fr').value.trim();
    var nameEn = document.getElementById('pf-name-en').value.trim();
    var type = document.getElementById('pf-type').value;
    var category = document.getElementById('pf-category').value;
    var model = document.getElementById('pf-model').value.trim();
    var descFr = document.getElementById('pf-desc-fr').value.trim();
    var descEn = document.getElementById('pf-desc-en').value.trim();
    var brandIds = Array.prototype.slice.call(document.querySelectorAll('#pf-brand-picker input:checked')).map(function(i){ return i.value; });

    var saveBtn = document.getElementById('product-form-save');
    saveBtn.disabled = true;

    var id = existingId || uniqueProductId(nameFr);
    var row = {
      id: id, type: type, category: category, name_fr: nameFr, name_en: nameEn,
      model: model, brand_ids: brandIds, description_fr: descFr, description_en: descEn
    };

    var save = existingId
      ? client.from('products').update(row).eq('id', existingId)
      : client.from('products').insert(row);

    save.then(function(res){
      if(res.error){ throw new Error(res.error.message); }
      return uploadPhotoIfAny(id);
    }).then(function(){
      saveBtn.disabled = false;
      closeModal();
      return fetchProducts();
    }).then(function(){
      renderProductsTable(document.getElementById('products-search').value);
    }).catch(function(err){
      saveBtn.disabled = false;
      formError.textContent = "Erreur : " + err.message;
      formError.style.display = 'block';
    });
  });

  function wireProducts(){
    document.getElementById('products-search').addEventListener('input', function(e){
      renderProductsTable(e.target.value);
    });
    document.getElementById('products-tbody').addEventListener('click', function(e){
      var editBtn = e.target.closest('[data-edit]');
      if(editBtn){
        var p = (productsCache||[]).filter(function(x){ return x.id === editBtn.getAttribute('data-edit'); })[0];
        if(p) openModal(p);
        return;
      }
      var delBtn = e.target.closest('[data-delete]');
      if(delBtn){
        var id = delBtn.getAttribute('data-delete');
        if(!confirm("Supprimer définitivement cet article ?")) return;
        client.from('products').delete().eq('id', id).then(function(res){
          if(res.error){ alert("Erreur : " + res.error.message); return; }
          productsCache = (productsCache||[]).filter(function(x){ return x.id !== id; });
          renderProductsTable(document.getElementById('products-search').value);
        });
      }
    });
    Promise.all([fetchBrands(), fetchProducts()]).then(function(){
      renderProductsTable('');
    });
  }

})();
