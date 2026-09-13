/* ==========================================================================
   MONDO MEDICAL — contact page form handling.
   Uses the same delivery chain as the quote request (configured in
   assets/js/config.js): formEndpoint > EmailJS > Web3Forms > mailto: fallback.
   ========================================================================== */
(function(){
  var STR = {
    en: { required:"This field is required.", invalidEmail:"Please enter a valid email address.",
          sent:"Your message has been sent. We'll be in touch shortly.",
          sending:"Sending…" },
    fr: { required:"Ce champ est obligatoire.", invalidEmail:"Veuillez saisir une adresse e-mail valide.",
          sent:"Votre message a été envoyé. Nous reviendrons vers vous rapidement.",
          sending:"Envoi…" }
  };

  function init(){
    var form = document.getElementById('contact-form');
    if(!form) return;
    var lang = window.PAGE_LANG || "en";
    var s = STR[lang];

    var params = new URLSearchParams(window.location.search);
    if(params.get('product')){
      var subjectField = form.querySelector('[name="subject"]');
      if(subjectField && !subjectField.value){
        var subject = (lang === "fr" ? "Demande d'information : " : "Information request: ") + params.get('product');
        if(params.get('brand')){ subject += (lang === "fr" ? " (marque : " : " (brand: ") + params.get('brand') + ")"; }
        subjectField.value = subject;
      }
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[data-required]').forEach(function(field){
        var wrap = field.closest('.field');
        var val = (field.value || '').trim();
        var ok = val.length > 0;
        if(ok && field.type === 'email'){
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          if(!ok) wrap.querySelector('.error-msg').textContent = s.invalidEmail;
        } else if(!ok){
          wrap.querySelector('.error-msg').textContent = s.required;
        }
        wrap.classList.toggle('has-error', !ok);
        if(!ok) valid = false;
      });
      if(!valid) return;

      var fd = new FormData(form);
      var cfg = window.VERIDIAN_CONFIG || {};
      var name = fd.get('name');
      var email = fd.get('email');
      var subject = fd.get('subject') || (lang === "fr" ? "Nouveau message de contact" : "New contact message");
      var body = [
        (lang==="fr"?"Nom : ":"Name: ") + name,
        (lang==="fr"?"Entreprise : ":"Company: ") + (fd.get('company')||'-'),
        (lang==="fr"?"E-mail : ":"Email: ") + email,
        (lang==="fr"?"Téléphone : ":"Phone: ") + (fd.get('phone')||'-'),
        "", fd.get('message')
      ].join("\n");

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = s.sending;

      var delivery = Promise.resolve({method:"none"});

      if(cfg.formEndpoint && cfg.formEndpoint.enabled){
        delivery = fetch(cfg.formEndpoint.url, {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({subject:subject, message:body, name:name, email:email})
        }).then(function(){ return {method:"endpoint"}; }).catch(function(){ return {method:"failed"}; });
      } else if(cfg.emailjs && cfg.emailjs.enabled){
        delivery = loadEmailJsSdk().then(function(){
          emailjs.init(cfg.emailjs.publicKey);
          return emailjs.send(cfg.emailjs.serviceId, cfg.emailjs.templateId, {
            subject: subject, message: body, reply_to: email, from_name: name
          }).then(function(){ return {method:"emailjs"}; });
        }).catch(function(){ return {method:"failed"}; });
      } else if(cfg.web3forms && cfg.web3forms.enabled){
        delivery = fetch("https://api.web3forms.com/submit", {
          method: "POST", headers: {"Content-Type":"application/json","Accept":"application/json"},
          body: JSON.stringify({access_key: cfg.web3forms.accessKey, subject: subject, from_name: name, replyto: email, message: body})
        }).then(function(r){ return r.json(); })
          .then(function(json){ return json.success ? {method:"web3forms"} : {method:"failed"}; })
          .catch(function(){ return {method:"failed"}; });
      }

      delivery.then(function(result){
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        var note = document.getElementById('contact-form-note');
        if(result.method === "none" || result.method === "failed"){
          var mailto = cfg.fallbackMailto || "sales@mondo-medical.example";
          window.location.href = "mailto:"+mailto+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
        }
        if(note){ note.textContent = s.sent; note.style.display = 'block'; }
        form.reset();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
