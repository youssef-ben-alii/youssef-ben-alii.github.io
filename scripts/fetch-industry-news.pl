#!/usr/bin/perl
# Fetches FDA (device-related) and WHO news headlines from their public RSS
# feeds and writes assets/data/industry-news.json. Only title, short excerpt,
# date and link are kept; readers are sent to the original article.
use strict; use warnings; use utf8;
use JSON::PP; use Time::Piece;

my @FEEDS = (
  { source => 'FDA', url => 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml', filter => 1, max => 8 },
  { source => 'WHO', url => 'https://www.who.int/rss-feeds/news-english.xml', filter => 0, max => 4 },
);
my $KEYWORDS = qr/\b(devices?|diagnostics?|imaging|x-ray|ultrasound|mri|monitor(?:ing|s)?|surgical|surgery|implants?|ventilators?|catheters?|infusion|pumps?|laborator(?:y|ies)|test(?:s|ing)?|equipment|instruments?|sterili[sz]ation|pacemakers?|defibrillators?|medical technology|software)\b/i;

sub decode {
  my $s = shift // '';
  $s =~ s/<!\[CDATA\[(.*?)\]\]>/$1/gs;
  $s =~ s/<[^>]+>//g;
  my %e = (amp=>'&', lt=>'<', gt=>'>', quot=>'"', apos=>"'", nbsp=>' ');
  $s =~ s/&#(\d+);/chr($1)/ge;
  $s =~ s/&#x([0-9a-f]+);/chr(hex($1))/gie;
  $s =~ s/&(amp|lt|gt|quot|apos|nbsp);/$e{$1}/g;
  $s =~ s/\s+/ /g; $s =~ s/^ | $//g;
  return $s;
}
sub iso_date {
  my $d = shift // '';
  if($d =~ /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/){
    my $t = eval { Time::Piece->strptime("$1 $2 $3", "%d %b %Y") };
    return $t->strftime("%Y-%m-%d") if $t;
  }
  return Time::Piece->new->strftime("%Y-%m-%d");
}

my @all;
for my $f (@FEEDS){
  my $xml = `curl -sL -m 30 -A "Mozilla/5.0" "$f->{url}"`;
  utf8::decode($xml);
  my @items = $xml =~ m{<item[ >].*?</item>}gs;
  warn "$f->{source}: ".scalar(@items)." items fetched\n";
  my $n = 0;
  for my $it (@items){
    last if $n >= $f->{max};
    my ($t) = $it =~ m{<title>(.*?)</title>}s;
    my ($l) = $it =~ m{<link>(.*?)</link>}s;
    my ($d) = $it =~ m{<pubDate>(.*?)</pubDate>}s;
    my ($x) = $it =~ m{<description>(.*?)</description>}s;
    $t = decode($t); $l = decode($l); $x = decode($x);
    next unless $t && $l =~ m{^https?://};
    $l =~ s{^http://}{https://};
    next if $f->{filter} && "$t $x" !~ $KEYWORDS;
    $x = substr($x, 0, 197).'...' if length($x) > 200;
    push @all, { source => $f->{source}, title => $t, excerpt => $x, url => $l, date => iso_date($d) };
    $n++;
  }
}
if(!@all){ warn "No items fetched - keeping existing file.\n"; exit 0; }
@all = sort { $b->{date} cmp $a->{date} } @all;
open(my $fh, '>:utf8', 'assets/data/industry-news.json') or die $!;
print $fh JSON::PP->new->utf8(0)->canonical->pretty->encode({ generatedAt => gmtime->datetime.'Z', items => \@all });
close $fh;
warn "Wrote ".scalar(@all)." items.\n";
