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

  /* Inserts a new row with a slug-based id, retrying with "-2", "-3"... if
     the id already exists. Relying only on the client-side brands/products
     cache to pick a "free" id isn't safe -- that cache can be a few seconds
     stale (another change landed since it was fetched), which surfaced as
     a raw "duplicate key value violates..." error. Postgres error code
     23505 = unique_violation; retrying on exactly that code (rather than
     matching the message text) is what's actually reliable here. */
  function insertWithUniqueId(table, baseId, fields, attempt){
    attempt = attempt || 0;
    var candidateId = attempt === 0 ? baseId : baseId + '-' + (attempt + 1);
    var row = Object.assign({ id: candidateId }, fields);
    return client.from(table).insert(row).then(function(res){
      if(res.error){
        if(res.error.code === '23505' && attempt < 30){
          return insertWithUniqueId(table, baseId, fields, attempt + 1);
        }
        throw new Error(res.error.message);
      }
      return candidateId;
    });
  }

  function photoUrl(id, ext){ return cfg.url + '/storage/v1/object/public/product-photos/' + id + '.' + ext; }
  function brandPhotoStorageUrl(id, ext){ return cfg.url + '/storage/v1/object/public/brand-photos/' + id + '.' + ext; }

  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ==================== AUTH ==================== */
  var loginWrap = document.getElementById('admin-login');
  var forgotWrap = document.getElementById('admin-forgot');
  var resetWrap = document.getElementById('admin-reset');
  var appWrap = document.getElementById('admin-app');
  var loginForm = document.getElementById('admin-login-form');
  var loginError = document.getElementById('admin-login-error');
  var inPasswordRecovery = false;

  function showOnly(wrap){
    [loginWrap, forgotWrap, resetWrap, appWrap].forEach(function(w){ w.style.display = 'none'; });
    wrap.style.display = wrap === appWrap ? 'block' : 'flex';
  }

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

  document.getElementById('admin-forgot-link').addEventListener('click', function(){
    document.getElementById('admin-forgot-email').value = document.getElementById('admin-email').value.trim();
    document.getElementById('admin-forgot-error').style.display = 'none';
    document.getElementById('admin-forgot-success').style.display = 'none';
    showOnly(forgotWrap);
  });
  document.getElementById('admin-forgot-cancel').addEventListener('click', function(){
    showOnly(loginWrap);
  });
  document.getElementById('admin-forgot-form').addEventListener('submit', function(e){
    e.preventDefault();
    var errEl = document.getElementById('admin-forgot-error');
    var okEl = document.getElementById('admin-forgot-success');
    errEl.style.display = 'none'; okEl.style.display = 'none';
    var email = document.getElementById('admin-forgot-email').value.trim();
    client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin/' }).then(function(res){
      if(res.error){ errEl.textContent = res.error.message; errEl.style.display = 'block'; return; }
      okEl.textContent = "E-mail envoyé — vérifiez votre boîte de réception (et vos spams).";
      okEl.style.display = 'block';
    });
  });

  document.getElementById('admin-reset-form').addEventListener('submit', function(e){
    e.preventDefault();
    var errEl = document.getElementById('admin-reset-error');
    errEl.style.display = 'none';
    var newPassword = document.getElementById('admin-new-password').value;
    client.auth.updateUser({ password: newPassword }).then(function(res){
      if(res.error){ errEl.textContent = res.error.message; errEl.style.display = 'block'; return; }
      inPasswordRecovery = false;
      showOnly(appWrap);
      initApp();
    });
  });

  document.getElementById('admin-logout').addEventListener('click', function(){
    client.auth.signOut();
  });

  client.auth.onAuthStateChange(function(event, session){
    if(event === 'PASSWORD_RECOVERY'){
      inPasswordRecovery = true;
      showOnly(resetWrap);
      return;
    }
    if(inPasswordRecovery) return; // stay on the "set new password" screen until it's submitted
    if(session){ showOnly(appWrap); initApp(); }
    else { showOnly(loginWrap); }
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
        if(btn.getAttribute('data-tab') === 'quotes'){ clearQuotesBadge(); }
      });
    });
  }

  /* ==================== LIVE NOTIFICATIONS (new quote requests) ====================
     Requires migration_004_realtime.sql (enables Postgres replication for
     quote_requests). Without it, this subscription simply never fires —
     the dashboard still works, just without live updates. */
  var unreadQuotesCount = 0;

  function showAdminToast(title, message, onClick, type){
    var stack = document.getElementById('admin-toast-stack');
    var el = document.createElement('div');
    el.className = 'admin-toast' + (type === 'error' ? ' error' : '');
    el.innerHTML = '<strong></strong><span></span>';
    el.querySelector('strong').textContent = title;
    el.querySelector('span').textContent = message;
    el.addEventListener('click', function(){ el.remove(); if(onClick) onClick(); });
    stack.appendChild(el);
    setTimeout(function(){ el.remove(); }, 8000);
  }

  function showAdminError(message){
    showAdminToast('Erreur', message, null, 'error');
  }

  /* Widget replacement for the native confirm() dialog -- styled like the
     rest of the dashboard instead of a browser popup. onConfirm runs only
     if the user clicks "Confirmer". */
  function showConfirmDialog(message, confirmLabel, onConfirm){
    var backdrop = document.createElement('div');
    backdrop.className = 'admin-modal-backdrop';
    backdrop.style.display = 'flex';
    backdrop.innerHTML =
      '<div class="admin-modal" style="max-width:400px">'+
        '<p class="body-text admin-confirm-message" style="margin-bottom:22px"></p>'+
        '<div class="admin-modal-actions">'+
          '<button type="button" class="btn btn-ghost" data-confirm-cancel>Annuler</button>'+
          '<button type="button" class="btn btn-primary" data-confirm-ok></button>'+
        '</div>'+
      '</div>';
    backdrop.querySelector('.admin-confirm-message').textContent = message;
    backdrop.querySelector('[data-confirm-ok]').textContent = confirmLabel || 'Confirmer';
    document.body.appendChild(backdrop);
    function close(){ backdrop.remove(); }
    backdrop.querySelector('[data-confirm-cancel]').addEventListener('click', close);
    backdrop.querySelector('[data-confirm-ok]').addEventListener('click', function(){ close(); onConfirm(); });
    backdrop.addEventListener('click', function(e){ if(e.target === backdrop) close(); });
  }

  function bumpQuotesBadge(){
    unreadQuotesCount++;
    var badge = document.getElementById('quotes-new-badge');
    badge.textContent = unreadQuotesCount;
    badge.style.display = 'inline-flex';
  }
  function clearQuotesBadge(){
    unreadQuotesCount = 0;
    document.getElementById('quotes-new-badge').style.display = 'none';
  }

  /* Notification center: a persistent history (derived straight from
     quote_requests, no separate table needed) so the admin can see what
     happened even if they missed the live toast or had the dashboard
     closed entirely. "Unread" = created after the last time the panel was
     opened, remembered in localStorage so it survives closing the tab. */
  var NOTIF_LAST_SEEN_KEY = 'mondo_admin_notif_last_seen';
  function getNotifLastSeen(){
    var v = localStorage.getItem(NOTIF_LAST_SEEN_KEY);
    return v ? new Date(v) : new Date(0);
  }
  function setNotifLastSeen(date){
    try{ localStorage.setItem(NOTIF_LAST_SEEN_KEY, date.toISOString()); }catch(e){}
  }

  function renderNotifCenter(){
    var rows = (quoteRowsCache || []).slice(0, 20);
    var lastSeen = getNotifLastSeen();
    var unreadCount = (quoteRowsCache || []).filter(function(r){ return new Date(r.created_at) > lastSeen; }).length;

    var badge = document.getElementById('admin-notif-badge');
    if(unreadCount > 0){ badge.textContent = unreadCount; badge.style.display = 'inline-flex'; }
    else { badge.style.display = 'none'; }

    var list = document.getElementById('admin-notif-list');
    if(!rows.length){
      list.innerHTML = '<div class="admin-notif-empty">Aucune demande de devis pour le moment.</div>';
      return;
    }
    list.innerHTML = rows.map(function(r){
      var isUnread = new Date(r.created_at) > lastSeen;
      var who = ((r.first_name||'')+' '+(r.last_name||'')).trim() || 'Client';
      var when = new Date(r.created_at).toLocaleString('fr-FR', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
      return (
        '<button type="button" class="admin-notif-item'+(isUnread?' unread':'')+'" data-notif-quote="'+r.id+'">'+
          '<span class="title">'+escapeHtml(who)+' — '+escapeHtml(r.reference)+'</span>'+
          '<span class="meta">'+when+'</span>'+
        '</button>'
      );
    }).join('');
  }

  function toggleNotifPanel(forceOpen){
    var panel = document.getElementById('admin-notif-panel');
    var willOpen = forceOpen !== undefined ? forceOpen : panel.style.display === 'none';
    panel.style.display = willOpen ? 'block' : 'none';
    if(willOpen){
      setNotifLastSeen(new Date());
      renderNotifCenter();
    }
  }

  document.getElementById('admin-notif-bell').addEventListener('click', function(e){
    e.stopPropagation();
    toggleNotifPanel();
  });
  document.getElementById('admin-notif-clear').addEventListener('click', function(){
    setNotifLastSeen(new Date());
    renderNotifCenter();
  });
  document.getElementById('admin-notif-list').addEventListener('click', function(e){
    var item = e.target.closest('[data-notif-quote]');
    if(!item) return;
    toggleNotifPanel(false);
    document.getElementById('quotes-search').value = '';
    renderQuotesTable('');
    document.querySelector('.admin-tab[data-tab="quotes"]').click();
    toggleDetailRow(item.getAttribute('data-notif-quote'));
  });
  document.addEventListener('click', function(e){
    var wrap = document.querySelector('.admin-notif-wrap');
    if(wrap && !wrap.contains(e.target)){ toggleNotifPanel(false); }
  });

  function subscribeQuoteRequestsRealtime(){
    if(window.Notification && Notification.permission === 'default'){ Notification.requestPermission(); }
    client.channel('quote-requests-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quote_requests' }, function(payload){
        var row = payload.new;
        quoteRowsCache = quoteRowsCache ? [row].concat(quoteRowsCache) : [row];
        renderOverviewFromCache();
        renderQuotesTable(document.getElementById('quotes-search').value);
        renderNotifCenter();
        bumpQuotesBadge();
        var who = ((row.first_name||'')+' '+(row.last_name||'')).trim() || 'Client';
        showAdminToast('Nouvelle demande de devis', who + ' — ' + row.reference, function(){
          document.querySelector('.admin-tab[data-tab="quotes"]').click();
        });
        if(window.Notification && Notification.permission === 'granted'){
          new Notification('Nouvelle demande de devis', { body: who + ' — ' + row.reference });
        }
      })
      .subscribe();
  }

  function initApp(){
    if(appInited) return;
    appInited = true;
    wireTabs();
    loadOverview();
    wireQuotes();
    wireProducts();
    wireBrands();
    subscribeQuoteRequestsRealtime();
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
    fetchQuoteRows().then(function(){ renderOverviewFromCache(); renderNotifCenter(); });
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
    var containerWidth = wrap.clientWidth || 640;
    var band = Math.max(34, containerWidth / n);
    var barW = Math.max(14, Math.min(24, band * 0.55));
    var chartH = 260, axisY = chartH + 8, labelEvery = n > 15 ? 5 : 1;
    var width = Math.max(band * n, containerWidth);
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
          if(res.error){ showAdminError(res.error.message); return; }
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

  function populateProductsBrandFilter(){
    var sel = document.getElementById('products-brand-filter');
    var current = sel.value;
    sel.innerHTML = '<option value="">Toutes les marques</option>' +
      (brandsCache||[]).map(function(b){ return '<option value="'+b.id+'">'+escapeHtml(b.name)+'</option>'; }).join('');
    sel.value = current;
  }

  function renderProductsTable(){
    var q = document.getElementById('products-search').value.trim().toLowerCase();
    var sortMode = document.getElementById('products-sort').value;
    var brandFilter = document.getElementById('products-brand-filter').value;
    var rows = (productsCache||[]).filter(function(p){
      if(brandFilter && (p.brand_ids||[]).indexOf(brandFilter) === -1) return false;
      if(!q) return true;
      return (p.name_fr+' '+p.name_en).toLowerCase().indexOf(q) !== -1;
    });
    if(sortMode === 'brand'){
      rows = rows.slice().sort(function(a,b){
        var an = brandName((a.brand_ids||[])[0] || ''), bn = brandName((b.brand_ids||[])[0] || '');
        return an.localeCompare(bn) || a.name_fr.localeCompare(b.name_fr);
      });
    }
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
  var perBrandPhotoFiles = {};

  function renderPerBrandPhotoInputs(productId){
    var checked = Array.prototype.slice.call(document.querySelectorAll('#pf-brand-picker input:checked')).map(function(i){ return i.value; });
    Object.keys(perBrandPhotoFiles).forEach(function(bid){ if(checked.indexOf(bid) === -1) delete perBrandPhotoFiles[bid]; });
    var container = document.getElementById('pf-brand-photos');
    if(!checked.length){
      container.innerHTML = '<p class="body-text" style="font-size:.82rem">Cochez une marque ci-dessus pour lui associer une photo spécifique.</p>';
      return;
    }
    container.innerHTML = checked.map(function(bid){
      var note = perBrandPhotoFiles[bid] ? ' <span style="color:var(--blue-500)">(nouvelle photo sélectionnée)</span>'
        : (productId ? ' <span style="color:var(--ink-500)">(photo actuelle conservée si vous n\'en choisissez pas)</span>' : '');
      return (
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">'+
          '<span style="min-width:110px;font-size:.85rem">'+escapeHtml(brandName(bid))+'</span>'+
          '<input type="file" accept="image/*" data-brand-photo="'+bid+'">'+
          '<span style="font-size:.78rem">'+note+'</span>'+
        '</div>'
      );
    }).join('');
  }

  document.getElementById('pf-brand-photos').addEventListener('change', function(e){
    var input = e.target.closest('[data-brand-photo]');
    if(!input) return;
    var bid = input.getAttribute('data-brand-photo');
    perBrandPhotoFiles[bid] = input.files[0] || null;
    renderPerBrandPhotoInputs(document.getElementById('pf-id').value);
  });
  document.getElementById('pf-brand-picker').addEventListener('change', function(e){
    if(e.target.matches('input[type="checkbox"]')) renderPerBrandPhotoInputs(document.getElementById('pf-id').value);
  });

  function openModal(product){
    formError.style.display = 'none';
    form.reset();
    photoFile = null;
    perBrandPhotoFiles = {};
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
    renderPerBrandPhotoInputs(product ? product.id : null);

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

  function uploadPerBrandPhotos(id){
    var bids = Object.keys(perBrandPhotoFiles).filter(function(b){ return perBrandPhotoFiles[b]; });
    return Promise.all(bids.map(function(bid){
      var file = perBrandPhotoFiles[bid];
      var ext = /png/i.test(file.type) ? 'png' : 'jpg';
      return client.storage.from('product-photos').upload(id + '--' + bid + '.' + ext, file, { upsert: true, contentType: file.type })
        .then(function(res){ if(res.error){ throw new Error(res.error.message + ' (' + brandName(bid) + ')'); } });
    }));
  }

  function findDuplicateProduct(nameFr, nameEn, excludeId){
    var fr = nameFr.trim().toLowerCase();
    var en = nameEn.trim().toLowerCase();
    return (productsCache||[]).filter(function(p){
      if(p.id === excludeId) return false;
      return p.name_fr.trim().toLowerCase() === fr || (en && p.name_en.trim().toLowerCase() === en);
    })[0];
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

    var dupProduct = findDuplicateProduct(nameFr, nameEn, existingId);
    if(dupProduct){
      formError.textContent = "Un article nommé \"" + dupProduct.name_fr + "\" existe déjà.";
      formError.style.display = 'block';
      return;
    }

    if(!brandIds.length){
      showConfirmDialog(
        "Aucune marque cochée pour cet article — l'enregistrer quand même sans marque ?",
        "Enregistrer sans marque",
        function(){ saveProduct(existingId, nameFr, nameEn, type, category, model, descFr, descEn, brandIds); }
      );
      return;
    }
    saveProduct(existingId, nameFr, nameEn, type, category, model, descFr, descEn, brandIds);
  });

  function saveProduct(existingId, nameFr, nameEn, type, category, model, descFr, descEn, brandIds){
    var saveBtn = document.getElementById('product-form-save');
    saveBtn.disabled = true;

    var fields = {
      type: type, category: category, name_fr: nameFr, name_en: nameEn,
      model: model, brand_ids: brandIds, description_fr: descFr, description_en: descEn
    };

    var savedId = null;
    var save = existingId
      ? client.from('products').update(fields).eq('id', existingId).then(function(res){
          if(res.error){ throw new Error(res.error.message); }
          savedId = existingId;
        })
      : insertWithUniqueId('products', uniqueProductId(nameFr), fields).then(function(newId){ savedId = newId; });

    save.then(function(){
      return Promise.all([uploadPhotoIfAny(savedId), uploadPerBrandPhotos(savedId)]);
    }).then(function(){
      saveBtn.disabled = false;
      closeModal();
      return fetchProducts();
    }).then(function(){
      renderProductsTable();
    }).catch(function(err){
      saveBtn.disabled = false;
      formError.textContent = "Erreur : " + err.message;
      formError.style.display = 'block';
    });
  }

  function wireProducts(){
    document.getElementById('products-search').addEventListener('input', function(e){
      renderProductsTable();
    });
    document.getElementById('products-sort').addEventListener('change', function(e){
      renderProductsTable();
    });
    document.getElementById('products-brand-filter').addEventListener('change', function(e){
      renderProductsTable();
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
        showConfirmDialog("Supprimer définitivement cet article ?", "Supprimer", function(){
          client.from('products').delete().eq('id', id).then(function(res){
            if(res.error){ showAdminError(res.error.message); return; }
            productsCache = (productsCache||[]).filter(function(x){ return x.id !== id; });
            renderProductsTable();
          });
        });
      }
    });
    Promise.all([fetchBrands(), fetchProducts()]).then(function(){
      populateProductsBrandFilter();
      renderProductsTable();
    });
  }

  /* ==================== BRANDS ==================== */
  function renderBrandsTable(filterText){
    var q = (filterText||'').trim().toLowerCase();
    var rows = (brandsCache||[]).filter(function(b){ return !q || b.name.toLowerCase().indexOf(q) !== -1; });
    var tbody = document.getElementById('brands-tbody');
    var emptyEl = document.getElementById('brands-empty');
    if(!rows.length){ tbody.innerHTML=''; emptyEl.style.display='block'; return; }
    emptyEl.style.display = 'none';
    tbody.innerHTML = rows.map(function(b){
      return (
        '<tr>'+
          '<td>'+escapeHtml(b.name)+'</td>'+
          '<td style="text-align:right;white-space:nowrap">'+
            '<button type="button" class="btn btn-outline btn-sm" data-edit-brand="'+b.id+'">Modifier</button> '+
            '<button type="button" class="btn btn-ghost btn-sm" data-delete-brand="'+b.id+'" style="color:var(--danger)">Supprimer</button>'+
          '</td>'+
        '</tr>'
      );
    }).join('');
  }

  var brandModal = document.getElementById('brand-modal');
  var brandForm = document.getElementById('brand-form');
  var brandFormError = document.getElementById('brand-form-error');
  var brandPhotoFile = null;

  function openBrandModal(brand){
    brandFormError.style.display = 'none';
    brandForm.reset();
    brandPhotoFile = null;
    document.getElementById('bf-id').value = brand ? brand.id : '';
    document.getElementById('brand-modal-title').textContent = brand ? 'Modifier la marque' : 'Nouvelle marque';
    document.getElementById('bf-name').value = brand ? brand.name : '';

    var preview = document.getElementById('bf-photo-preview');
    if(brand){
      preview.style.display = 'block';
      preview.setAttribute('data-stage','0');
      preview.src = brandPhotoStorageUrl(brand.id, 'jpg');
      preview.onerror = function(){
        if(preview.getAttribute('data-stage') === '0'){ preview.setAttribute('data-stage','1'); preview.src = brandPhotoStorageUrl(brand.id,'png'); }
        else { preview.style.display = 'none'; }
      };
    } else {
      preview.style.display = 'none';
    }
    brandModal.style.display = 'flex';
  }
  function closeBrandModal(){ brandModal.style.display = 'none'; }

  document.getElementById('brand-add-btn').addEventListener('click', function(){ openBrandModal(null); });
  document.getElementById('brand-form-cancel').addEventListener('click', closeBrandModal);
  document.getElementById('bf-photo').addEventListener('change', function(e){ brandPhotoFile = e.target.files[0] || null; });

  function uniqueBrandId(name, excludeId){
    var base = slugify(name) || 'marque';
    var existingIds = (brandsCache||[]).map(function(b){ return b.id; });
    if(excludeId) existingIds = existingIds.filter(function(id){ return id !== excludeId; });
    if(existingIds.indexOf(base) === -1) return base;
    var n = 2;
    while(existingIds.indexOf(base + '-' + n) !== -1){ n++; }
    return base + '-' + n;
  }

  function uploadBrandPhotoIfAny(id){
    if(!brandPhotoFile) return Promise.resolve();
    var ext = /png/i.test(brandPhotoFile.type) ? 'png' : 'jpg';
    return client.storage.from('brand-photos').upload(id + '.' + ext, brandPhotoFile, { upsert: true, contentType: brandPhotoFile.type })
      .then(function(res){ if(res.error){ throw new Error(res.error.message); } });
  }

  function findDuplicateBrand(name, excludeId){
    var n = name.trim().toLowerCase();
    return (brandsCache||[]).filter(function(b){
      return b.id !== excludeId && b.name.trim().toLowerCase() === n;
    })[0];
  }

  brandForm.addEventListener('submit', function(e){
    e.preventDefault();
    brandFormError.style.display = 'none';
    var existingId = document.getElementById('bf-id').value;
    var name = document.getElementById('bf-name').value.trim();

    var dupBrand = findDuplicateBrand(name, existingId);
    if(dupBrand){
      brandFormError.textContent = "Une marque nommée \"" + dupBrand.name + "\" existe déjà.";
      brandFormError.style.display = 'block';
      return;
    }

    var saveBtn = document.getElementById('brand-form-save');
    saveBtn.disabled = true;

    var savedId = null;
    var save = existingId
      ? client.from('brands').update({ name: name }).eq('id', existingId).then(function(res){
          if(res.error){ throw new Error(res.error.message); }
          savedId = existingId;
        })
      : insertWithUniqueId('brands', uniqueBrandId(name), { name: name }).then(function(newId){ savedId = newId; });

    save.then(function(){
      return uploadBrandPhotoIfAny(savedId);
    }).then(function(){
      saveBtn.disabled = false;
      closeBrandModal();
      return fetchBrands();
    }).then(function(){
      renderBrandsTable(document.getElementById('brands-search').value); populateProductsBrandFilter();
    }).catch(function(err){
      saveBtn.disabled = false;
      brandFormError.textContent = "Erreur : " + err.message;
      brandFormError.style.display = 'block';
    });
  });

  function wireBrands(){
    document.getElementById('brands-search').addEventListener('input', function(e){
      renderBrandsTable(e.target.value);
    });
    document.getElementById('brands-tbody').addEventListener('click', function(e){
      var editBtn = e.target.closest('[data-edit-brand]');
      if(editBtn){
        var b = (brandsCache||[]).filter(function(x){ return x.id === editBtn.getAttribute('data-edit-brand'); })[0];
        if(b) openBrandModal(b);
        return;
      }
      var delBtn = e.target.closest('[data-delete-brand]');
      if(delBtn){
        var id = delBtn.getAttribute('data-delete-brand');
        showConfirmDialog("Supprimer définitivement cette marque ? Les articles qui la référencent ne seront pas modifiés.", "Supprimer", function(){
          client.from('brands').delete().eq('id', id).then(function(res){
            if(res.error){ showAdminError(res.error.message); return; }
            brandsCache = (brandsCache||[]).filter(function(x){ return x.id !== id; });
            renderBrandsTable(document.getElementById('brands-search').value); populateProductsBrandFilter();
          });
        });
      }
    });
    fetchBrands().then(function(){ renderBrandsTable(''); });
  }

})();
