/* ==========================================================================
   MONDO MEDICAL — shared page interactions: toast, fade-in, tabs, steppers.
   ========================================================================== */

/* ---------- Toast ---------- */
/* href (optional): if given, the whole toast becomes clickable/focusable
   (mobile and desktop) and navigates there — used for "added to your
   quote" so tapping it jumps straight to My Quote. */
function showToast(message, href){
  var region = document.getElementById('toast-region');
  if(!region){
    region = document.createElement('div');
    region.id = 'toast-region';
    region.setAttribute('aria-live','polite');
    document.body.appendChild(region);
  }
  var toast = document.createElement(href ? 'a' : 'div');
  toast.className = 'toast';
  if(href){
    toast.href = href;
    toast.classList.add('toast-clickable');
  }
  toast.innerHTML = (window.veridianIcon ? veridianIcon('checkCircle') : '') + '<span>'+message+'</span>';
  region.appendChild(toast);
  requestAnimationFrame(function(){ toast.classList.add('show'); });
  setTimeout(function(){
    toast.classList.remove('show');
    setTimeout(function(){ toast.remove(); }, 350);
  }, 3200);
}

/* ---------- Fade-in on scroll ---------- */
function initFadeIn(){
  var els = document.querySelectorAll('.fade-in');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('in-view'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){ entry.target.classList.add('in-view'); io.unobserve(entry.target); }
    });
  }, {threshold:.12});
  els.forEach(function(el){ io.observe(el); });
}

/* ---------- Tabs (product detail) ---------- */
function initTabs(){
  document.querySelectorAll('.tab-nav').forEach(function(nav){
    var btns = nav.querySelectorAll('.tab-btn');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var target = btn.getAttribute('data-tab');
        var scope = nav.closest('[data-tabs-scope]') || document;
        scope.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
        scope.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
        btn.classList.add('active');
        var panel = scope.querySelector('[data-tab-panel="'+target+'"]');
        if(panel) panel.classList.add('active');
      });
    });
  });
}

/* ---------- Generic quantity stepper (delegated) ---------- */
function initQtyStepper(container, onChange){
  container.addEventListener('click', function(e){
    var btn = e.target.closest('[data-qty-action]');
    if(!btn) return;
    var wrap = btn.closest('.qty-stepper');
    var input = wrap.querySelector('input');
    var val = parseInt(input.value, 10) || 1;
    if(btn.getAttribute('data-qty-action') === 'inc') val += 1;
    else { val -= 1; if(val < 1) val = 1; }
    input.value = val;
    if(onChange) onChange(val, wrap);
  });
}

/* ---------- Mobile filter drawer toggle (catalog page) ---------- */
function initFilterToggle(){
  var toggle = document.querySelector('[data-filter-toggle]');
  var panel = document.querySelector('[data-filter-panel]');
  if(!toggle || !panel) return;
  toggle.addEventListener('click', function(){
    panel.classList.toggle('open');
  });
}

veridianOnReady(function(){
  initFadeIn();
  initTabs();
  initFilterToggle();
});
