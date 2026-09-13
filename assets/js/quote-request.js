/* ==========================================================================
   MONDO MEDICAL — quote request wizard (contact info -> review -> submit).
   ========================================================================== */
(function(){
  var STR = {
    en: {
      required:"This field is required.", invalidEmail:"Please enter a valid email address.",
      mustAgree:"You must agree to be contacted to submit your request.",
      emptyCartTitle:"Your quote is empty.", emptyCartSub:"Add at least one product before requesting a quote.",
      exploreBtn:"Explore Equipment", submitting:"Sending your request…",
      submitFailedFallback:"We couldn't reach our email service automatically — your default email application will now open with your request pre-filled. Please press send there to complete your request.",
      qty:"Qty"
    },
    fr: {
      required:"Ce champ est obligatoire.", invalidEmail:"Veuillez saisir une adresse e-mail valide.",
      mustAgree:"Vous devez accepter d'être contacté pour envoyer votre demande.",
      emptyCartTitle:"Votre demande de devis est vide.", emptyCartSub:"Ajoutez au moins un produit avant de demander un devis.",
      exploreBtn:"Découvrir les équipements", submitting:"Envoi de votre demande…",
      submitFailedFallback:"Nous n'avons pas pu joindre automatiquement notre service e-mail — votre application e-mail par défaut va s'ouvrir avec votre demande pré-remplie. Veuillez cliquer sur envoyer pour finaliser votre demande.",
      qty:"Qté"
    }
  };

  function goStep(n){
    document.querySelectorAll('[data-step-panel]').forEach(function(p){
      p.classList.toggle('active', p.getAttribute('data-step-panel') === String(n));
    });
    document.querySelectorAll('[data-step-pill]').forEach(function(p){
      var idx = parseInt(p.getAttribute('data-step-pill'),10);
      p.classList.toggle('active', idx === n);
      p.classList.toggle('done', idx < n);
    });
    window.scrollTo({top: document.getElementById('wizard-top').offsetTop - 100, behavior:'smooth'});
  }

  function isCompanyType(form){
    var checked = form.querySelector('[name="customerType"]:checked');
    return !checked || checked.getAttribute('data-type') === 'company';
  }

  function syncCompanyRequirement(form){
    var companyInput = form.querySelector('[name="company"]');
    var companyReq = document.getElementById('company-req');
    var isCompany = isCompanyType(form);
    if(isCompany){ companyInput.setAttribute('data-required',''); }
    else { companyInput.removeAttribute('data-required'); }
    if(companyReq){ companyReq.style.display = isCompany ? '' : 'none'; }
  }

  function validateStep1(form, s){
    var valid = true;
    form.querySelectorAll('[data-step-panel="1"] [data-required]').forEach(function(field){
      var wrap = field.closest('.field');
      var val = (field.value || '').trim();
      var ok = val.length > 0;
      if(ok && field.type === 'email'){
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        if(!ok){ wrap.querySelector('.error-msg').textContent = s.invalidEmail; }
      } else if(!ok){
        wrap.querySelector('.error-msg').textContent = s.required;
      }
      wrap.classList.toggle('has-error', !ok);
      if(!ok) valid = false;
    });
    return valid;
  }

  function validateConsent(form, s){
    var consent = form.querySelector('#consent-checkbox');
    var consentWrap = consent.closest('.field');
    if(!consent.checked){
      consentWrap.classList.add('has-error');
      consentWrap.querySelector('.error-msg').textContent = s.mustAgree;
      return false;
    }
    consentWrap.classList.remove('has-error');
    return true;
  }

  function renderReview(lang){
    var items = getQuote();
    var form = document.getElementById('quote-request-form');
    var fd = new FormData(form);
    var reviewProducts = document.getElementById('review-products');
    reviewProducts.innerHTML = items.map(function(it){
      var name = lang === "fr" ? it.name_fr : it.name_en;
      if(it.brandName){ name += ' <span style="color:var(--ink-500)">— '+it.brandName+'</span>'; }
      return '<div class="row"><span>'+name+'</span><span>&times; '+it.qty+'</span></div>';
    }).join('');

    var isCompany = isCompanyType(form);
    var checkedType = form.querySelector('[name="customerType"]:checked');
    document.getElementById('review-customer-type').textContent = checkedType ? checkedType.value : '-';
    document.getElementById('review-name').textContent = fd.get('firstName') + ' ' + fd.get('lastName');
    var companyRow = document.getElementById('review-company-row');
    if(isCompany){
      companyRow.style.display = '';
      document.getElementById('review-company').textContent = fd.get('company') || '-';
    } else {
      companyRow.style.display = 'none';
    }
    document.getElementById('review-email').textContent = fd.get('email');
    document.getElementById('review-phone').textContent = fd.get('phone');
    document.getElementById('review-location').textContent = [fd.get('city'), fd.get('country')].filter(Boolean).join(', ');
    document.getElementById('review-message').textContent = fd.get('message') || (lang === 'fr' ? '(aucun message)' : '(no message)');
  }

  function init(){
    var lang = window.PAGE_LANG || "en";
    var s = STR[lang];
    var items = getQuote();
    var wizard = document.getElementById('quote-wizard');
    var emptyEl = document.getElementById('wizard-empty');
    if(!wizard) return;

    if(!items.length){
      wizard.style.display = 'none';
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = '<div class="icon">'+veridianIcon('empty')+'</div>'+
        '<h2 class="h-md">'+s.emptyCartTitle+'</h2>'+
        '<p class="body-text" style="margin:14px auto 0">'+s.emptyCartSub+'</p>'+
        '<a href="'+productEquipmentBase(lang)+'" class="btn btn-primary" style="margin-top:26px">'+s.exploreBtn+'</a>';
      return;
    }

    var summaryList = document.getElementById('wizard-cart-summary');
    if(summaryList){
      summaryList.innerHTML = items.map(function(it){
        var name = lang === "fr" ? it.name_fr : it.name_en;
        return '<div class="row"><span>'+name+'</span><span>&times; '+it.qty+'</span></div>';
      }).join('');
    }

    var form = document.getElementById('quote-request-form');
    syncCompanyRequirement(form);
    form.querySelectorAll('[name="customerType"]').forEach(function(radio){
      radio.addEventListener('change', function(){ syncCompanyRequirement(form); });
    });

    document.getElementById('to-step-2').addEventListener('click', function(){
      if(validateStep1(form, s)){
        renderReview(lang);
        goStep(2);
      }
    });
    document.getElementById('back-to-step-1').addEventListener('click', function(){ goStep(1); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!validateStep1(form, s)) { goStep(1); return; }
      if(!validateConsent(form, s)) { return; }
      var fd = new FormData(form);
      var customer = {
        customerType: fd.get('customerType') || '',
        firstName: fd.get('firstName'), lastName: fd.get('lastName'), company: isCompanyType(form) ? fd.get('company') : '',
        email: fd.get('email'), phone: fd.get('phone'), country: fd.get('country'), city: fd.get('city'),
        address: fd.get('address') || '', contactMethod: fd.get('contactMethod') || 'Email', message: fd.get('message') || ''
      };
      var submitBtn = document.getElementById('submit-request-btn');
      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = s.submitting;

      submitQuoteRequest(customer, lang).then(function(record){
        clearQuote();
        var confirmUrl = lang === "fr" ? "/fr/devis/confirmation/" : "/en/quote/confirmation/";
        if(record.mailtoHref){
          window.location.href = record.mailtoHref;
          setTimeout(function(){ window.location.href = confirmUrl; }, 600);
        } else {
          window.location.href = confirmUrl;
        }
      }).catch(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
    });

    goStep(1);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
