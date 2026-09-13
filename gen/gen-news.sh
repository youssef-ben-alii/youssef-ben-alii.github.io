#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE="$ROOT/gen/news-template.html"

# id|title_en|title_fr|excerpt_en|excerpt_fr
ARTICLES=(
"choosing-patient-monitor|How to Choose the Right Patient Monitor|Comment choisir le bon moniteur patient|Key considerations for selecting a patient monitor suited to your care setting.|Les points clés à considérer pour choisir un moniteur patient adapté à votre environnement de soin."
"equipping-modern-clinic|Essential Equipment for a Modern Medical Clinic|Les équipements essentiels d'une clinique médicale moderne|A practical overview of the core equipment categories every clinic should consider.|Un aperçu pratique des catégories d'équipements essentielles pour toute clinique."
"understanding-monitoring-equipment|Understanding Medical Monitoring Equipment|Comprendre les équipements de monitoring médical|An introduction to how patient monitoring equipment supports clinical decision-making.|Une introduction à la façon dont les équipements de monitoring soutiennent la décision clinique."
"diagnostic-imaging-basics|A Guide to Diagnostic Imaging Basics|Guide des bases de l'imagerie diagnostique|An introductory look at common diagnostic imaging equipment and its uses.|Un aperçu introductif des équipements d'imagerie diagnostique courants et de leurs usages."
"laboratory-equipment-essentials|Laboratory Equipment Essentials|L'essentiel des équipements de laboratoire|The core instruments that support accurate, efficient laboratory testing.|Les instruments essentiels pour des analyses de laboratoire précises et efficaces."
"emergency-readiness-checklist|Emergency Readiness: An Equipment Checklist|Préparation aux urgences : liste de vérification des équipements|A practical checklist for keeping emergency equipment ready and accessible.|Une liste pratique pour garder les équipements d'urgence prêts et accessibles."
)

render() {
  local lang="$1" id="$2" title_en="$3" title_fr="$4" ex_en="$5" ex_fr="$6"
  local en_url="/en/news/${id}/"
  local fr_url="/fr/actualites/${id}/"
  local out_dir title desc alt_url canonical skip
  if [ "$lang" = "en" ]; then
    out_dir="$ROOT/en/news/${id}"
    title="$title_en"; desc="$ex_en"; alt_url="$fr_url"; canonical="$en_url"; skip="Skip to content"
  else
    out_dir="$ROOT/fr/actualites/${id}"
    title="$title_fr"; desc="$ex_fr"; alt_url="$en_url"; canonical="$fr_url"; skip="Aller au contenu"
  fi
  mkdir -p "$out_dir"
  sed \
    -e "s#{{LANG}}#${lang}#g" \
    -e "s#{{ARTICLE_ID}}#${id}#g" \
    -e "s#{{ALT_URL}}#${alt_url}#g" \
    -e "s#{{EN_URL}}#${en_url}#g" \
    -e "s#{{FR_URL}}#${fr_url}#g" \
    -e "s#{{CANONICAL}}#${canonical}#g" \
    -e "s#{{TITLE}}#${title}#g" \
    -e "s#{{DESC}}#${desc}#g" \
    -e "s#{{SKIP}}#${skip}#g" \
    "$TEMPLATE" > "$out_dir/index.html"
}

for row in "${ARTICLES[@]}"; do
  IFS='|' read -r id title_en title_fr ex_en ex_fr <<< "$row"
  render en "$id" "$title_en" "$title_fr" "$ex_en" "$ex_fr"
  render fr "$id" "$title_en" "$title_fr" "$ex_en" "$ex_fr"
done

echo "Generated $(( ${#ARTICLES[@]} * 2 )) news article pages."
