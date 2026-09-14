/* ==========================================================================
   MONDO MEDICAL — Static catalog data (bilingual UI, real product data).
   Brands and products are imported from the customer's real inventory
   export (see /gen/source/) via assets/js/data-brands.js and
   assets/js/data-products.js (must be loaded BEFORE this file). Product
   designations come directly from that inventory and are kept in their
   original French wording on both language versions — this is real
   surgical/medical terminology, and auto-translating hundreds of highly
   specific instrument names without domain review risks introducing
   incorrect medical terminology, so we deliberately do not invent an
   English rendering of these names.
   No backend / no database in this version — swap this file for an API
   call later without touching the UI layer.
   ========================================================================== */

var ICON_BY_CATEGORY = {
  "imagerie":"diagnostic", "reanimation":"emergency", "monitoring":"monitor",
  "bloc-operatoire":"hospital", "mobilier-transport":"furniture", "laboratoire":"lab",
  "optiques-endoscopie":"diagnostic", "pinces-prehension":"instrument",
  "ciseaux-coupe":"instrument", "ecarteurs":"instrument", "aiguilles-canules":"needle",
  "porte-aiguilles-sutures":"instrument", "cables-electrodes":"ecg", "autre":"instrument"
};

var VERIDIAN_DATA = {

  categories: [
    { id:"imagerie", icon:"diagnostic",
      name:{en:"Imaging", fr:"Imagerie"},
      desc:{en:"Radiography, ultrasound and mammography systems.", fr:"Systèmes de radiographie, d'échographie et de mammographie."} },
    { id:"monitoring", icon:"monitor",
      name:{en:"Patient Monitoring", fr:"Monitoring et surveillance"},
      desc:{en:"Monitors and ECG for continuous patient surveillance.", fr:"Moniteurs et ECG pour la surveillance continue du patient."} },
    { id:"reanimation", icon:"emergency",
      name:{en:"Critical Care & Anesthesia", fr:"Réanimation et anesthésie"},
      desc:{en:"Ventilators, defibrillators and related critical care equipment.", fr:"Respirateurs, défibrillateurs et équipements de réanimation."} },
    { id:"bloc-operatoire", icon:"hospital",
      name:{en:"Operating Room", fr:"Bloc opératoire"},
      desc:{en:"Surgical lights, tables, motors and endoscopy columns.", fr:"Scialytiques, tables, moteurs et colonnes d'endoscopie."} },
    { id:"mobilier-transport", icon:"furniture",
      name:{en:"Furniture & Transport", fr:"Mobilier et transport"},
      desc:{en:"Beds, trolleys and patient transport equipment.", fr:"Lits, chariots et équipements de transport des patients."} },
    { id:"laboratoire", icon:"lab",
      name:{en:"Laboratory", fr:"Laboratoire"},
      desc:{en:"Refrigeration and general laboratory equipment.", fr:"Réfrigération et équipements généraux de laboratoire."} },
    { id:"autre", icon:"hospital",
      name:{en:"Other Equipment", fr:"Autres équipements"},
      desc:{en:"Additional equipment not yet grouped into a category above.", fr:"Équipements complémentaires non encore classés dans une catégorie ci-dessus."} }
  ],

  instrumentCategories: [
    { id:"optiques-endoscopie", icon:"diagnostic",
      name:{en:"Optics & Laparoscopy", fr:"Optiques et cœlioscopie"},
      desc:{en:"Endoscopes, optics and laparoscopic access instruments.", fr:"Endoscopes, optiques et instruments d'accès cœlioscopique."} },
    { id:"pinces-prehension", icon:"instrument",
      name:{en:"Forceps & Grasping", fr:"Pinces et préhension"},
      desc:{en:"Hemostatic, dissecting and grasping forceps.", fr:"Pinces hémostatiques, à dissection et de préhension."} },
    { id:"ciseaux-coupe", icon:"instrument",
      name:{en:"Scissors & Cutting Instruments", fr:"Ciseaux et instruments coupants"},
      desc:{en:"Surgical scissors, scalpel handles and cutting tools.", fr:"Ciseaux chirurgicaux, manches de bistouri et instruments coupants."} },
    { id:"ecarteurs", icon:"instrument",
      name:{en:"Retractors & Hooks", fr:"Écarteurs et crochets"},
      desc:{en:"Retractors, hooks and exposure instruments.", fr:"Écarteurs, crochets et instruments d'exposition."} },
    { id:"aiguilles-canules", icon:"needle",
      name:{en:"Needles & Cannulas", fr:"Aiguilles et canules"},
      desc:{en:"Puncture needles, cannulas and trocars.", fr:"Aiguilles de ponction, canules et trocarts."} },
    { id:"porte-aiguilles-sutures", icon:"instrument",
      name:{en:"Needle Holders & Suturing", fr:"Porte-aiguilles et sutures"},
      desc:{en:"Needle holders and suturing instruments.", fr:"Porte-aiguilles et instruments de suture."} },
    { id:"cables-electrodes", icon:"ecg",
      name:{en:"Cables & Electrodes", fr:"Câbles et électrodes"},
      desc:{en:"Bipolar/monopolar cables and coagulation electrodes.", fr:"Câbles bipolaires/monopolaires et électrodes de coagulation."} },
    { id:"autre", icon:"instrument",
      name:{en:"Other Instruments", fr:"Autres instruments"},
      desc:{en:"Additional instruments not yet grouped into a category above.", fr:"Instruments complémentaires non encore classés dans une catégorie ci-dessus."} }
  ],

  /* Populated below from PARSED_BRANDS (assets/js/data-brands.js) */
  brands: [],

  /* Populated below from PARSED_PRODUCTS (assets/js/data-products.js) */
  products: [],

  services: [
    { id:"sourcing", icon:"sourcing", name:{en:"Equipment Sourcing", fr:"Sourcing d'équipements"}, desc:{en:"Helping healthcare facilities identify and source equipment suited to their clinical needs.", fr:"Un accompagnement pour identifier et sourcer les équipements adaptés aux besoins cliniques des établissements de santé."} },
    { id:"installation", icon:"installation", name:{en:"Installation", fr:"Installation"}, desc:{en:"Guidance on equipment setup and installation for select product categories.", fr:"Des conseils pour la mise en place et l'installation des équipements pour certaines catégories de produits."} },
    { id:"training", icon:"training", name:{en:"Training", fr:"Formation"}, desc:{en:"Introductory training resources to help teams get familiar with new equipment.", fr:"Des ressources de formation d'introduction pour aider les équipes à se familiariser avec les nouveaux équipements."} },
    { id:"support", icon:"support", name:{en:"Technical Support", fr:"Support technique"}, desc:{en:"A point of contact for technical questions related to purchased equipment.", fr:"Un point de contact pour les questions techniques relatives aux équipements acquis."} },
    { id:"maintenance", icon:"maintenance", name:{en:"Maintenance", fr:"Maintenance"}, desc:{en:"Guidance on maintenance planning to help extend equipment reliability.", fr:"Des conseils de planification de la maintenance pour prolonger la fiabilité des équipements."} },
    { id:"aftersales", icon:"aftersales", name:{en:"After-Sales Support", fr:"Support après-vente"}, desc:{en:"Ongoing assistance after your purchase, from questions to reordering.", fr:"Une assistance continue après votre achat, des questions au réapprovisionnement."} }
  ],

  news: [
    { id:"choosing-patient-monitor", date:"2026-02-10",
      title:{en:"How to Choose the Right Patient Monitor", fr:"Comment choisir le bon moniteur patient"},
      excerpt:{en:"Key considerations for selecting a patient monitor suited to your care setting.", fr:"Les points clés à considérer pour choisir un moniteur patient adapté à votre environnement de soin."},
      body:{en:["Choosing a patient monitor starts with understanding the care setting it will serve. A general ward, an emergency department and a critical care unit each place different demands on parameter range, display clarity and alarm management.","Consider the parameters you need to monitor as a baseline: ECG, SpO2, non-invasive blood pressure and temperature cover most general needs, while specialized departments may require additional modules.","Portability matters when patients are moved frequently between departments. A monitor with battery backup and a compact housing simplifies patient transport without interrupting monitoring.","Finally, consider how the monitor fits into your existing infrastructure — network connectivity, central station compatibility and data export options can all affect long-term usability."],
            fr:["Le choix d'un moniteur patient commence par la compréhension de l'environnement de soin qu'il devra servir. Un service d'hospitalisation générale, un service d'urgences et une unité de soins critiques n'ont pas les mêmes exigences en matière de paramètres, de clarté d'affichage et de gestion des alarmes.","Considérez les paramètres à surveiller comme base : l'ECG, la SpO2, la pression artérielle non invasive et la température couvrent la plupart des besoins généraux, tandis que les services spécialisés peuvent nécessiter des modules supplémentaires.","La portabilité est importante lorsque les patients sont fréquemment déplacés entre services. Un moniteur doté d'une batterie de secours et d'un boîtier compact simplifie le transport du patient sans interrompre la surveillance.","Enfin, prenez en compte l'intégration du moniteur dans votre infrastructure existante : la connectivité réseau, la compatibilité avec une station centrale et les options d'export de données peuvent toutes affecter l'utilisation à long terme."] },
      relatedProducts:[] },
    { id:"equipping-modern-clinic", date:"2026-01-22",
      title:{en:"Essential Equipment for a Modern Medical Clinic", fr:"Les équipements essentiels d'une clinique médicale moderne"},
      excerpt:{en:"A practical overview of the core equipment categories every clinic should consider.", fr:"Un aperçu pratique des catégories d'équipements essentielles pour toute clinique."},
      body:{en:["A well-equipped clinic balances patient comfort, staff efficiency and diagnostic capability. Core furniture — examination tables, seating and storage — forms the foundation of any consultation room.","Basic diagnostic tools, such as an ECG machine or diagnostic instruments, allow practitioners to assess common conditions without referring patients elsewhere for routine checks.","Efficient patient flow also depends on practical details: adequate storage for consumables, accessible equipment layout and comfortable furniture that supports longer consultations.","As a clinic grows, equipment needs evolve — reviewing your equipment list periodically helps ensure it still matches patient volume and the services offered."],
            fr:["Une clinique bien équipée allie confort du patient, efficacité du personnel et capacité de diagnostic. Le mobilier de base — tables d'examen, sièges et rangements — constitue le socle de toute salle de consultation.","Des outils de diagnostic de base, comme un électrocardiographe ou des instruments de diagnostic, permettent aux praticiens d'évaluer les affections courantes sans orienter systématiquement les patients ailleurs.","Un flux de patients efficace dépend aussi de détails pratiques : un rangement suffisant pour les consommables, une disposition accessible des équipements et un mobilier confortable adapté aux consultations plus longues.","À mesure qu'une clinique se développe, les besoins en équipement évoluent — revoir périodiquement sa liste d'équipements permet de s'assurer qu'elle correspond toujours au volume de patients et aux services proposés."] },
      relatedProducts:[] },
    { id:"understanding-monitoring-equipment", date:"2025-12-15",
      title:{en:"Understanding Medical Monitoring Equipment", fr:"Comprendre les équipements de monitoring médical"},
      excerpt:{en:"An introduction to how patient monitoring equipment supports clinical decision-making.", fr:"Une introduction à la façon dont les équipements de monitoring soutiennent la décision clinique."},
      body:{en:["Patient monitoring equipment continuously tracks physiological parameters, giving clinical teams the information needed to detect changes in a patient's condition early.","Most monitors track a combination of ECG, oxygen saturation, blood pressure and temperature, presenting the data through a clear display with configurable alarm thresholds.","Understanding alarm management is essential: thresholds that are too sensitive can lead to alarm fatigue, while thresholds set too loosely may delay recognition of a deteriorating condition.","Modern monitoring systems increasingly support data export and network integration, allowing information to be reviewed centrally and supporting more coordinated care."],
            fr:["Les équipements de monitoring patient suivent en continu les paramètres physiologiques, fournissant aux équipes cliniques les informations nécessaires pour détecter rapidement une évolution de l'état du patient.","La plupart des moniteurs suivent une combinaison d'ECG, de saturation en oxygène, de pression artérielle et de température, présentées sur un écran clair avec des seuils d'alarme configurables.","Comprendre la gestion des alarmes est essentiel : des seuils trop sensibles peuvent entraîner une fatigue liée aux alarmes, tandis que des seuils trop larges peuvent retarder la détection d'une dégradation de l'état du patient.","Les systèmes de monitoring modernes prennent de plus en plus en charge l'export de données et l'intégration réseau, permettant une revue centralisée de l'information et des soins mieux coordonnés."] },
      relatedProducts:[] },
    { id:"diagnostic-imaging-basics", date:"2025-11-30",
      title:{en:"A Guide to Diagnostic Imaging Basics", fr:"Guide des bases de l'imagerie diagnostique"},
      excerpt:{en:"An introductory look at common diagnostic imaging equipment and its uses.", fr:"Un aperçu introductif des équipements d'imagerie diagnostique courants et de leurs usages."},
      body:{en:["Diagnostic imaging equipment helps clinicians visualize internal structures without invasive procedures. Ultrasound is among the most widely used modalities due to its portability and safety profile.","Portable ultrasound systems now offer image quality that was once limited to large departmental machines, making point-of-care imaging more accessible across departments.","Choosing the right imaging equipment depends on the clinical application — general abdominal imaging, vascular assessment and musculoskeletal examination each benefit from different transducer types.","As with all diagnostic equipment, proper training and adherence to manufacturer guidelines are essential for accurate, safe use."],
            fr:["Les équipements d'imagerie diagnostique aident les cliniciens à visualiser les structures internes sans recourir à des procédures invasives. L'échographie est l'une des modalités les plus utilisées en raison de sa portabilité et de son profil de sécurité.","Les systèmes d'échographie portables offrent désormais une qualité d'image auparavant réservée aux grands appareils de service, rendant l'imagerie au point de service plus accessible.","Le choix du bon équipement d'imagerie dépend de l'application clinique — l'imagerie abdominale générale, l'évaluation vasculaire et l'examen musculo-squelettique bénéficient chacun de types de sondes différents.","Comme pour tout équipement diagnostique, une formation adéquate et le respect des recommandations du fabricant sont essentiels pour une utilisation précise et sûre."] },
      relatedProducts:[] },
    { id:"laboratory-equipment-essentials", date:"2025-11-05",
      title:{en:"Laboratory Equipment Essentials", fr:"L'essentiel des équipements de laboratoire"},
      excerpt:{en:"The core instruments that support accurate, efficient laboratory testing.", fr:"Les instruments essentiels pour des analyses de laboratoire précises et efficaces."},
      body:{en:["Every laboratory relies on a set of core instruments to process and analyze samples accurately. Centrifuges and microscopes remain foundational across most testing workflows.","Selecting the right centrifuge depends on sample volume and required rotor configurations — laboratories with variable workloads benefit from interchangeable rotor systems.","Microscope quality directly affects diagnostic confidence. Achromatic optics and stable mechanical stages support consistent, accurate observation during routine analysis.","Maintaining laboratory equipment through regular calibration and servicing helps preserve accuracy and prolongs instrument lifespan."],
            fr:["Chaque laboratoire s'appuie sur un ensemble d'instruments essentiels pour traiter et analyser les échantillons avec précision. Les centrifugeuses et les microscopes restent fondamentaux dans la plupart des flux d'analyse.","Le choix de la bonne centrifugeuse dépend du volume d'échantillons et des configurations de rotor requises — les laboratoires à charge de travail variable bénéficient de systèmes à rotors interchangeables.","La qualité du microscope influence directement la confiance diagnostique. Une optique achromatique et une platine mécanique stable favorisent une observation constante et précise lors des analyses courantes.","L'entretien des équipements de laboratoire par un étalonnage et une maintenance réguliers permet de préserver leur précision et de prolonger leur durée de vie."] },
      relatedProducts:[] },
    { id:"emergency-readiness-checklist", date:"2025-10-18",
      title:{en:"Emergency Readiness: An Equipment Checklist", fr:"Préparation aux urgences : liste de vérification des équipements"},
      excerpt:{en:"A practical checklist for keeping emergency equipment ready and accessible.", fr:"Une liste pratique pour garder les équipements d'urgence prêts et accessibles."},
      body:{en:["Emergency readiness depends on more than having the right equipment — it depends on that equipment being maintained, accessible and familiar to staff.","A crash cart should be checked regularly against a standardized inventory list, with clear labeling to reduce time spent searching during a critical event.","Defibrillators require periodic checks of battery status and pad expiry to ensure they are ready for immediate use.","Regular drills involving emergency equipment help staff remain confident and efficient when responding to real critical events."],
            fr:["La préparation aux urgences ne dépend pas seulement de la disponibilité du bon équipement — elle dépend aussi de son entretien, de son accessibilité et de la familiarité du personnel avec celui-ci.","Un chariot d'urgence doit être vérifié régulièrement selon une liste d'inventaire standardisée, avec un étiquetage clair pour réduire le temps de recherche lors d'un événement critique.","Les défibrillateurs nécessitent des vérifications périodiques de l'état de la batterie et de la péremption des électrodes pour garantir leur disponibilité immédiate.","Des exercices réguliers impliquant les équipements d'urgence aident le personnel à rester confiant et efficace lors de véritables situations critiques."] },
      relatedProducts:[] }
  ]
};

/* ---------- Populate brands & products from the parsed real inventory ---------- */
(function(){
  var NEUTRAL_BRAND_DESC = { en:"Supplier brand referenced in our equipment catalog.", fr:"Marque fournisseur référencée dans notre catalogue d'équipements." };
  VERIDIAN_DATA.brands = (typeof PARSED_BRANDS !== "undefined" ? PARSED_BRANDS : []).map(function(b){
    return { id:b.id, name:b.name, desc:NEUTRAL_BRAND_DESC };
  });
  VERIDIAN_DATA.products = (typeof PARSED_PRODUCTS !== "undefined" ? PARSED_PRODUCTS : []).map(function(p){
    return {
      id: p.id,
      type: p.type,
      category: p.category,
      brands: p.brands,
      model: p.model || "",
      icon: ICON_BY_CATEGORY[p.category] || "instrument",
      slug: { en:p.id, fr:p.id },
      name: { en:(p.name_en || p.name), fr:p.name }
    };
  });
})();
