#!/usr/bin/perl
use strict; use warnings;
use utf8;
binmode(STDOUT, ":encoding(UTF-8)");

# Optional English translations for product/instrument names, keyed by the
# generated product id (e.g. "aiguille-de-palmere-3" => "Palmer Needle").
# Falls back to the French name when a translation isn't available yet, so
# the site keeps working even before every item has been translated.
our %NAME_EN;
if (-f "gen/source/translations-en.pl") {
  open(my $tfh, "<:encoding(UTF-8)", "gen/source/translations-en.pl") or die $!;
  local $/;
  my $code = <$tfh>;
  close($tfh);
  eval $code;
  warn "translations-en.pl not loaded: $@" if $@;
}

open(my $fh, "<:encoding(UTF-8)", "gen/source/catalogue.md") or die $!;

my $brand = "";
my %products;   # key => { type, name, brands => { brandname => model_or_undef } }
my @brand_order;
my %seen_brand;

sub slugify {
  my ($s) = @_;
  $s = lc($s);
  # transliterate common accented chars
  my %map = ("à"=>"a","â"=>"a","ä"=>"a","é"=>"e","è"=>"e","ê"=>"e","ë"=>"e",
             "î"=>"i","ï"=>"i","ô"=>"o","ö"=>"o","ù"=>"u","û"=>"u","ü"=>"u",
             "ç"=>"c","œ"=>"oe","'"=>"-","'"=>"-","°"=>"","’"=>"-");
  for my $k (keys %map) { $s =~ s/\Q$k\E/$map{$k}/g; }
  $s =~ s/[^a-z0-9]+/-/g;
  $s =~ s/^-+|-+$//g;
  $s =~ s/-{2,}/-/g;
  return $s;
}

sub normalize_key {
  my ($s) = @_;
  my $k = slugify($s);
  $k =~ s/-/ /g;
  $k =~ s/\s+/ /g;
  $k =~ s/^\s+|\s+$//g;
  return $k;
}

# The source list was hand-transcribed and mixes ALL CAPS, all lowercase and
# Capitalized entries, plus a few stray periods mid-name (e.g. "adaptateur.
# Pour uretrotomie"). Normalize every display name the same way: Title Case
# on alphabetic words, leaving measurements/codes (15cm, D11mm...) untouched.
sub normalize_display_name {
  my ($s) = @_;
  $s =~ s/^\s+|\s+$//g;
  $s =~ s/\s+/ /g;
  $s =~ s/(?<!\d)\.(?!\d)//g;
  $s =~ s/\s+/ /g;
  $s =~ s/^\s+|\s+$//g;
  $s =~ s/(?<![\d\p{L}])(\p{L}+)(?!\d)/ucfirst(lc($1))/ge;
  # A few entries have a stray space between a number and its unit (e.g. "3 Mm"
  # instead of "3mm"), which the rule above title-cases like a normal word.
  # Force known unit abbreviations back to lowercase wherever they land.
  $s =~ s/\b(Mm|Cm|Ml|Kg|Mg)\b/lc($1)/ge;
  return $s;
}

while (my $line = <$fh>) {
  chomp $line;
  if ($line =~ /^##\s+(.+?)\s*$/) {
    my $h = $1;
    next if $h eq "Statistiques";
    $brand = $h;
    unless ($seen_brand{$brand}) { $seen_brand{$brand} = 1; push @brand_order, $brand; }
    next;
  }
  if ($line =~ /^-\s+\*\*\[(Équipement|Instrument)\]\*\*\s*(.*)$/) {
    my ($type, $rest) = ($1, $2);
    $rest =~ s/\s+$//;
    my $model;
    if ($rest =~ /^(.*?)\s*—\s*Mod[eè]le\s*:\s*(.+)$/) {
      $rest = $1; $model = $2;
      $model =~ s/\s+$//;
    }
    $rest =~ s/\s+$//;
    $rest =~ s/\.$//;
    next if $rest eq "";
    my $key = normalize_key($rest);
    $type = $type eq "Équipement" ? "equipment" : "instrument";
    if (!exists $products{$key}) {
      $products{$key} = { type => $type, name => normalize_display_name($rest), brands => {} };
    }
    $products{$key}{brands}{$brand} = $model if $brand;
    if (defined $model && !defined $products{$key}{brands}{$brand}) {
      $products{$key}{brands}{$brand} = $model;
    }
  }
}
close($fh);

# ---- Category heuristics ----
sub categorize_equipment {
  my ($n) = @_; my $l = lc($n);
  return "imagerie" if $l =~ /radio|scopie|mammograph|echograph|arceau|scanner|surgiscanne/;
  return "reanimation" if $l =~ /respirat|defibril|anesth|optiflow|ventilat|reanimation/;
  return "monitoring" if $l =~ /moniteur|ecg|holter|surveillance/;
  return "bloc-operatoire" if $l =~ /scialytique|table|autoclave|sterilis|bistouri|craniotome|generateur|colonne|endoscop|coelio|resecteur|moteur|scie|arthropompe|garrot|cavitron|lithoclast|neuronavigation|neurostimulateur/;
  return "mobilier-transport" if $l =~ /lit|chariot|brancard|tabouret|fauteuil|matelas|paravent|civiere/;
  return "laboratoire" if $l =~ /refrigerateur|agitateur|centrifug/;
  return "autre";
}
sub categorize_instrument {
  my ($n) = @_; my $l = lc($n);
  return "optiques-endoscopie" if $l =~ /optique|coelio|trocart|chemise\b|gaine|endoscop|resecteur|resection/;
  return "pinces-prehension" if $l =~ /^pince|pinces/;
  return "ciseaux-coupe" if $l =~ /ciseau|coupe|scalpel|bistouri|lame\b/;
  return "ecarteurs" if $l =~ /ecarteur|crochet|spatule/;
  return "aiguilles-canules" if $l =~ /aiguille|canule|cannule|trocart|seringue/;
  return "porte-aiguilles-sutures" if $l =~ /porte.?aiguille|noeud|serre/;
  return "cables-electrodes" if $l =~ /cable|electrode|bipolaire|monopolaire/;
  return "autre";
}

my %CAT_LABEL_EQ = (
  "imagerie" => ["Imagerie", "Imaging"],
  "reanimation" => ["Reanimation et anesthesie", "Critical Care and Anesthesia"],
  "monitoring" => ["Monitoring et surveillance", "Patient Monitoring"],
  "bloc-operatoire" => ["Bloc operatoire", "Operating Room"],
  "mobilier-transport" => ["Mobilier et transport", "Furniture and Transport"],
  "laboratoire" => ["Laboratoire", "Laboratory"],
  "autre" => ["Autres equipements", "Other Equipment"],
);
my %CAT_LABEL_INS = (
  "optiques-endoscopie" => ["Optiques et coelioscopie", "Optics and Laparoscopy"],
  "pinces-prehension" => ["Pinces et prehension", "Forceps and Grasping"],
  "ciseaux-coupe" => ["Ciseaux et instruments coupants", "Scissors and Cutting Instruments"],
  "ecarteurs" => ["Ecarteurs et crochets", "Retractors and Hooks"],
  "aiguilles-canules" => ["Aiguilles et canules", "Needles and Cannulas"],
  "porte-aiguilles-sutures" => ["Porte-aiguilles et sutures", "Needle Holders and Suturing"],
  "cables-electrodes" => ["Cables et electrodes", "Cables and Electrodes"],
  "autre" => ["Autres instruments", "Other Instruments"],
);

# ---- Output brands.json-like JS ----
open(my $out, ">:encoding(UTF-8)", "gen/source/parsed-brands.js") or die $!;
print $out "var PARSED_BRANDS = [\n";
for my $b (sort @brand_order) {
  next if $b eq "Non indique";
  my $id = slugify($b);
  (my $esc = $b) =~ s/"/\\"/g;
  print $out "  { id:\"$id\", name:\"$esc\" },\n";
}
print $out "];\n";
close($out);

open(my $out2, ">:encoding(UTF-8)", "gen/source/parsed-products.js") or die $!;
print $out2 "var PARSED_PRODUCTS = [\n";

# ---- Load the shared detail-page template once ----
open(my $tplfh, "<:encoding(UTF-8)", "gen/real-product-template.html") or die $!;
local $/;
my $template = <$tplfh>;
close($tplfh);
$/ = "\n";

sub write_page {
  my (%a) = @_;
  my $html = $template;
  for my $k (keys %a) {
    my $v = $a{$k};
    $html =~ s/\{\{$k\}\}/$v/g;
  }
  my $dir = "$a{OUTDIR}";
  system("mkdir", "-p", $dir) unless -d $dir;
  open(my $fh, ">:encoding(UTF-8)", "$dir/index.html") or die "Cannot write $dir/index.html: $!";
  print $fh $html;
  close($fh);
}

my $idx = 0;
my $pagecount = 0;
for my $key (sort keys %products) {
  my $p = $products{$key};
  $idx++;
  my $slug = slugify($p->{name});
  $slug = "item-$idx" if $slug eq "";
  my $id = "$slug-$idx";
  my $cat = $p->{type} eq "equipment" ? categorize_equipment($p->{name}) : categorize_instrument($p->{name});
  (my $esc = $p->{name}) =~ s/"/\\"/g;
  my $nameEn = $NAME_EN{$id} || $p->{name};
  (my $escEn = $nameEn) =~ s/"/\\"/g;
  my @brandIds;
  my $modelOut = "";
  for my $bn (sort keys %{$p->{brands}}) {
    next if $bn eq "Non indique";
    push @brandIds, slugify($bn);
    if (defined $p->{brands}{$bn} && $modelOut eq "") { $modelOut = $p->{brands}{$bn}; }
  }
  next unless @brandIds;
  my $brandsJs = join(",", map { "\"$_\"" } @brandIds);
  (my $modelEsc = $modelOut) =~ s/"/\\"/g;
  print $out2 "  { id:\"$id\", type:\"$p->{type}\", category:\"$cat\", name:\"$esc\", name_en:\"$escEn\", model:\"$modelEsc\", brands:[$brandsJs] },\n";

  # ---- Generate EN + FR detail pages ----
  my $desc = $p->{name}; $desc =~ s/"/&quot;/g;
  my $descEn = $nameEn; $descEn =~ s/"/&quot;/g;
  my ($en_base, $fr_base, $page_key);
  if ($p->{type} eq "equipment") { $en_base = "/en/equipment/"; $fr_base = "/fr/equipements/"; $page_key = "equipment"; }
  else { $en_base = "/en/instruments/"; $fr_base = "/fr/instruments/"; $page_key = "instruments"; }
  my $en_url = "$en_base$id/";
  my $fr_url = "$fr_base$id/";

  write_page(
    LANG => "en", PRODUCT_ID => $id, TITLE => $escEn, DESC => $descEn,
    EN_URL => $en_url, FR_URL => $fr_url, CANONICAL => $en_url, ALT_URL => $fr_url,
    SKIP => "Skip to content", PAGE_KEY => $page_key,
    OUTDIR => "en" . ($p->{type} eq "equipment" ? "/equipment/$id" : "/instruments/$id")
  );
  write_page(
    LANG => "fr", PRODUCT_ID => $id, TITLE => $esc, DESC => $desc,
    EN_URL => $en_url, FR_URL => $fr_url, CANONICAL => $fr_url, ALT_URL => $en_url,
    SKIP => "Aller au contenu", PAGE_KEY => $page_key,
    OUTDIR => "fr" . ($p->{type} eq "equipment" ? "/equipements/$id" : "/instruments/$id")
  );
  $pagecount += 2;
}
print $out2 "];\n";
close($out2);

print "Brands: " . scalar(@brand_order) . "\n";
print "Unique products: " . scalar(keys %products) . "\n";
print "Detail pages generated: $pagecount\n";
