/* ==========================================================================
   MONDO MEDICAL — quote request submission.
   Builds a reference number + email payload, then attempts delivery via
   (in order of preference) a configured serverless endpoint, EmailJS, or a
   mailto: fallback. Always stores the submitted request locally so the
   confirmation page and the PDF summary can render it.
   ========================================================================== */
var VQ_LAST_REQUEST_KEY = "veridian_last_request_v1";
var VQ_REF_COUNTER_KEY = "veridian_ref_counter_v1";

function generateQuoteReference(){
  var year = new Date().getFullYear();
  var counter = 1;
  try{
    var stored = JSON.parse(localStorage.getItem(VQ_REF_COUNTER_KEY) || "{}");
    counter = (stored.year === year) ? (stored.count + 1) : 1;
    localStorage.setItem(VQ_REF_COUNTER_KEY, JSON.stringify({year:year, count:counter}));
  }catch(e){
    counter = Math.floor(Math.random()*9000)+1000;
  }
  var padded = String(counter).padStart(4,'0');
  return "QT-"+year+"-"+padded;
}

function buildQuoteEmailText(reference, dateStr, customer, items, lang){
  var isFr = lang === "fr";
  var lines = [];
  lines.push(isFr ? "NOUVELLE DEMANDE DE DEVIS" : "NEW QUOTE REQUEST");
  lines.push("");
  lines.push((isFr ? "Référence : " : "Reference: ") + reference);
  lines.push((isFr ? "Date : " : "Date: ") + dateStr);
  lines.push("");
  lines.push(isFr ? "INFORMATIONS CLIENT" : "CUSTOMER INFORMATION");
  lines.push((isFr ? "Type de client : " : "Customer Type: ") + customer.customerType);
  lines.push((isFr ? "Prénom : " : "First Name: ") + customer.firstName);
  lines.push((isFr ? "Nom : " : "Last Name: ") + customer.lastName);
  if(customer.company){ lines.push((isFr ? "Entreprise / Organisation : " : "Company / Organization: ") + customer.company); }
  lines.push((isFr ? "E-mail : " : "Email: ") + customer.email);
  lines.push((isFr ? "Téléphone : " : "Phone: ") + customer.phone);
  lines.push((isFr ? "Pays : " : "Country: ") + customer.country);
  lines.push((isFr ? "Ville : " : "City: ") + customer.city);
  if(customer.address){ lines.push((isFr ? "Adresse : " : "Address: ") + customer.address); }
  lines.push((isFr ? "Moyen de contact préféré : " : "Preferred Contact Method: ") + customer.contactMethod);
  lines.push("");
  lines.push(isFr ? "ÉQUIPEMENTS DEMANDÉS" : "REQUESTED EQUIPMENT");
  items.forEach(function(it, idx){
    var name = isFr ? it.name_fr : it.name_en;
    lines.push((idx+1)+". "+name);
    lines.push("   " + (isFr ? "Quantité : " : "Quantity: ") + it.qty);
    if(it.brandName){ lines.push("   " + (isFr ? "Marque : " : "Brand: ") + it.brandName); }
  });
  lines.push("");
  lines.push(isFr ? "MESSAGE DU CLIENT" : "CUSTOMER MESSAGE");
  lines.push(customer.message ? customer.message : (isFr ? "(aucun message)" : "(no message)"));
  return lines.join("\n");
}

function loadEmailJsSdk(){
  return new Promise(function(resolve, reject){
    if(window.emailjs){ resolve(); return; }
    var s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function submitQuoteRequest(customer, lang){
  var items = getQuote();
  var reference = generateQuoteReference();
  var now = new Date();
  var dateStr = now.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {year:"numeric",month:"long",day:"numeric"});
  var subject = (lang === "fr" ? "Nouvelle demande de devis — #" : "New Quote Request — #") + reference;
  var bodyText = buildQuoteEmailText(reference, dateStr, customer, items, lang);

  var record = {
    reference: reference, date: dateStr, lang: lang,
    customer: customer, items: items, subject: subject
  };
  try{ localStorage.setItem(VQ_LAST_REQUEST_KEY, JSON.stringify(record)); }catch(e){}

  var cfg = window.VERIDIAN_CONFIG || {};
  var delivery = Promise.resolve({method:"none"});

  if(cfg.formEndpoint && cfg.formEndpoint.enabled){
    delivery = fetch(cfg.formEndpoint.url, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(record)
    }).then(function(){ return {method:"endpoint"}; })
      .catch(function(){ return {method:"failed"}; });
  } else if(cfg.emailjs && cfg.emailjs.enabled){
    delivery = loadEmailJsSdk().then(function(){
      emailjs.init(cfg.emailjs.publicKey);
      return emailjs.send(cfg.emailjs.serviceId, cfg.emailjs.templateId, {
        reference: reference, date: dateStr, subject: subject, message: bodyText,
        reply_to: customer.email, from_name: customer.firstName+" "+customer.lastName
      }).then(function(){ return {method:"emailjs"}; });
    }).catch(function(){ return {method:"failed"}; });
  } else if(cfg.web3forms && cfg.web3forms.enabled){
    delivery = fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {"Content-Type":"application/json", "Accept":"application/json"},
      body: JSON.stringify({
        access_key: cfg.web3forms.accessKey,
        subject: subject,
        from_name: customer.firstName+" "+customer.lastName,
        replyto: customer.email,
        message: bodyText
      })
    }).then(function(r){ return r.json(); })
      .then(function(json){ return json.success ? {method:"web3forms"} : {method:"failed"}; })
      .catch(function(){ return {method:"failed"}; });
  }

  return delivery.then(function(result){
    if(result.method === "none" || result.method === "failed"){
      var mailto = cfg.fallbackMailto || "sales@mondo-medical.example";
      var href = "mailto:"+mailto+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(bodyText);
      record.mailtoHref = href;
      try{ localStorage.setItem(VQ_LAST_REQUEST_KEY, JSON.stringify(record)); }catch(e){}
    }
    return record;
  });
}

function getLastQuoteRequest(){
  try{ return JSON.parse(localStorage.getItem(VQ_LAST_REQUEST_KEY) || "null"); }
  catch(e){ return null; }
}
