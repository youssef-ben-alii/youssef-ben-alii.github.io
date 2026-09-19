/* ==========================================================================
   MONDO MEDICAL — client-side PDF request summary (via vendored jsPDF).
   This document is a SUMMARY of the customer's request, not an official
   quotation, and never displays a price. Fully bilingual — text is driven
   entirely by record.lang, which is the language the visitor used when
   they submitted the request (see quote-submit.js / quote-request.js).
   ========================================================================== */
function loadLogoImageForPdf(){
  return new Promise(function(resolve){
    var img = new Image();
    img.onload = function(){ resolve(img); };
    img.onerror = function(){ resolve(null); };
    img.src = "/pictures/logo.png";
  });
}

function downloadQuoteSummaryPdf(record){
  if(!window.jspdf || !window.jspdf.jsPDF){ return; }
  loadLogoImageForPdf().then(function(logoImg){
    buildQuoteSummaryPdf(record, logoImg);
  });
}

function buildQuoteSummaryPdf(record, logoImg){
  var isFr = record.lang === "fr";
  var doc = new window.jspdf.jsPDF({unit:"pt", format:"a4"});
  var pageWidth = doc.internal.pageSize.getWidth();
  var margin = 48;
  var y = 64;

  if(logoImg){
    var logoHeight = 34;
    var logoWidth = logoHeight * (logoImg.naturalWidth / logoImg.naturalHeight);
    doc.addImage(logoImg, "PNG", margin, y - 24, logoWidth, logoHeight);
    y += 20;
  } else {
    doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(10,22,40);
    doc.text("MONDO MEDICAL", margin, y);
    y -= 4;
  }

  y += 8;
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(59,69,82);
  doc.text((isFr ? "Référence : " : "Reference: ") + record.reference, margin, y);
  y += 15;
  doc.setFont("helvetica","normal");
  doc.text((isFr ? "Date : " : "Date: ") + record.date, margin, y);
  y += 20;
  doc.setDrawColor(228,231,234); doc.line(margin, y, pageWidth-margin, y);
  y += 32;

  doc.setFont("helvetica","bold"); doc.setFontSize(15); doc.setTextColor(10,22,40);
  doc.text(isFr ? "Récapitulatif de la demande de devis" : "Quote Request Summary", margin, y);
  y += 18;
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(150,60,47);
  doc.text(isFr ? "Ceci n'est pas un devis officiel — récapitulatif de votre demande uniquement." : "This is not an official quotation — a summary of your request only.", margin, y);
  y += 26;

  y += 4;

  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(10,22,40);
  doc.text(isFr ? "Informations client" : "Customer Information", margin, y);
  y += 16;
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(59,69,82);
  var c = record.customer;
  var custLines = [
    (isFr?"Type de client : ":"Customer Type: ") + (c.customerType||"-"),
    (isFr?"Nom : ":"Name: ") + c.firstName + " " + c.lastName,
    (isFr?"Entreprise : ":"Company: ") + (c.company||"-"),
    (isFr?"E-mail : ":"Email: ") + c.email,
    (isFr?"Téléphone : ":"Phone: ") + c.phone,
    (isFr?"Localisation : ":"Location: ") + [c.city,c.country].filter(Boolean).join(", "),
    (isFr?"Contact préféré : ":"Preferred contact: ") + c.contactMethod
  ];
  custLines.forEach(function(line){ doc.text(line, margin, y); y += 15; });

  y += 14;
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(10,22,40);
  doc.text(isFr ? "Équipements demandés" : "Requested Equipment", margin, y);
  y += 10;
  doc.setDrawColor(228,231,234); doc.line(margin, y+8, pageWidth-margin, y+8);
  y += 26;

  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  record.items.forEach(function(it, idx){
    var name = isFr ? it.name_fr : it.name_en;
    doc.setTextColor(10,22,40);
    doc.text((idx+1)+". "+name, margin, y);
    doc.setTextColor(105,115,128);
    doc.text((isFr?"Qté : ":"Qty: ")+it.qty, pageWidth-margin-60, y);
    y += 14;
    if(it.brandName){
      doc.setFontSize(8.5); doc.setTextColor(105,115,128);
      doc.text((isFr?"Marque : ":"Brand: ")+it.brandName, margin+14, y);
      doc.setFontSize(10);
      y += 14;
    } else {
      y += 4;
    }
    if(y > 700){ doc.addPage(); y = 64; }
  });

  y += 12;
  doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(10,22,40);
  doc.text(isFr ? "Message du client" : "Customer Message", margin, y);
  y += 16;
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(59,69,82);
  var msg = c.message ? c.message : (isFr ? "(aucun message)" : "(no message)");
  var msgLines = doc.splitTextToSize(msg, pageWidth - margin*2);
  doc.text(msgLines, margin, y);
  y += msgLines.length*14 + 20;

  doc.setDrawColor(228,231,234); doc.line(margin, y, pageWidth-margin, y);
  y += 20;
  doc.setFontSize(9); doc.setTextColor(154,163,173);
  doc.text(isFr ? "Prix sur demande. Les prix vous seront communiqués par notre équipe commerciale." : "Price on request. Prices will be provided by our sales team.", margin, y);
  y += 14;
  doc.text("[ contact@mondo-medical.example ]  ·  [ +00 000 000 000 ]", margin, y);

  doc.save("mondo-medical-"+record.reference.toLowerCase()+".pdf");
}
