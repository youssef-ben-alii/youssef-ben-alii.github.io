# Mondo Medical — Bilingual Medical Equipment Catalog

A premium, bilingual (English/French) front-end for a professional medical
equipment supplier. Customers browse a static catalog, build a **quote**
(not a shopping cart) across multiple pages, and submit a single request
that is emailed to the company. There is intentionally **no database, no
CMS, no admin panel, no accounts, and no online payment** — this is a
first, frontend-only version, structured so a backend can be added later
without a redesign.

## Real catalog data

The Equipment, Instruments and Brands sections are populated from a real
inventory export (149 supplier brands, 394 unique catalog items after
de-duplication). This was a one-time import, not something re-run
automatically — see "Updating the real catalog data" below if the
inventory changes.

**Equipment vs. Instruments — an important distinction kept from the
source data:** a reusable surgical instrument (forceps, scissors,
retractors, needle holders, etc.) is **not** a consumable and is not
equipment either — it's its own category, with its own nav item, catalog
page (`/instruments/`) and category taxonomy, separate from durable
Equipment (imaging, monitoring, critical care, operating room, furniture,
laboratory). There is currently no consumables data in the source
inventory, so that section was removed rather than populated with
invented examples — the codebase still supports a `type:"consumable"`
product if that data becomes available later.

**Why product names stay in French on both language versions:** the
inventory contains hundreds of specific surgical/medical instrument
designations (e.g. "Pince Kocher 15 cm", "Rugine de Cobb"). Some are
international eponyms with a standard English equivalent, but many are
plain French technical phrasing with no single verified English
rendering. Auto-translating all of them without clinical/domain review
risked introducing incorrect medical terminology, so product names are
deliberately kept in their original French wording in both `/en/` and
`/fr/` — only the surrounding site UI (buttons, labels, filters, nav) is
fully bilingual. Categories were grouped by keyword heuristics from the
source designations (see `gen/source/parse_catalogue.pl`) and are a
reasonable first pass, not a certified taxonomy.

**Multi-brand products:** many items in the source data are the same
instrument carried by several different suppliers (e.g. a given forceps
type sold under 8 different brand names). Rather than creating near-
duplicate catalog entries, each product has a `brands: [...]` array —
the detail page lists every brand that supplies it, each linking back to
that brand's filtered catalog view, and the Brands page's "View
Equipment / View Instruments" routing (see below) is computed from this
same array.

## Why plain HTML/CSS/JS (no framework)

This machine has no Node.js or Python installed, so the site is built as
static HTML/CSS/JS with zero build step. That turns out to be a good fit
for the brief anyway: no backend, no database, deployable to any static
host (Netlify, Vercel static, GitHub Pages, S3, IIS, etc.) with no build
pipeline required.

Because the header/footer are shared via `fetch()`-based includes (see
"Architecture" below), the site must be served over HTTP — opening files
directly via `file://` will show pages without navigation/footer. Use the
included local server for development.

## Running it locally

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open **http://localhost:8099/** (redirects to `/en/` or `/fr/` based
on browser language). Pass `-Port` to use a different port if 8099 is
taken. No Node/Python required — it's a ~60-line PowerShell static file
server used only for local preview; any real static host works in
production without it.

## Project structure

```
/pictures/logo.jpeg           Company logo (used in header + footer)
/assets/css/style.css         Design system (single stylesheet)
/assets/js/data.js             Categories, services, news, and the code that
                               merges in the real brands/products below
/assets/js/data-brands.js      Generated: 148 real supplier brands
/assets/js/data-products.js    Generated: 394 real catalog products
/assets/js/icons.js            Inline SVG icon set (used as UI icons AND as
                               placeholder "photography" — no stock images)
/assets/js/config.js           Email delivery configuration (see below)
/assets/js/quote.js            Quote (cart) logic — localStorage only
/assets/js/popularity.js       Click-based "featured" tracking (see below)
/assets/js/quote-submit.js     Builds reference number + email payload,
                               attempts delivery, falls back to mailto:
/assets/js/pdf-summary.js      Client-side "Quote Request Summary" PDF
/assets/js/partials.js         Injects shared header/footer, nav state,
                               language switch, mobile drawer, quote badge
/assets/js/*.js                One small renderer per page type (catalog,
                               product detail, quote page, search, etc.)
/partials/header-*.html        Shared nav markup (en/fr)
/partials/footer-*.html        Shared footer markup (en/fr)
/en/..., /fr/...               The actual pages (see URL structure below)
/gen/                          Generator for the real catalog + template +
                               bash generator for news pages (see below)
serve.ps1                      Local static file server for development
```

## Updating the real catalog data

The Equipment/Instruments/Brands data was generated once from a real
inventory export, not something that re-runs automatically:

1. Update `gen/source/catalogue.md` (same `## BRAND` / `- **[Équipement|Instrument]** Designation — Modèle : X` format as the original export).
2. Run `perl gen/source/parse_catalogue.pl` from the project root. This
   rewrites `gen/source/parsed-brands.js` / `parsed-products.js` **and**
   regenerates every product detail page under `/en/equipment/`,
   `/fr/equipements/`, `/en/instruments/` and `/fr/instruments/`.
3. Copy the two parsed files over the live ones:
   `cp gen/source/parsed-brands.js assets/js/data-brands.js` and same for
   `data-products.js`.

Categories are auto-assigned from keyword matching in the designation
text (see `categorize_equipment`/`categorize_instrument` in the Perl
script) — a reasonable first pass, worth reviewing rather than treating
as a certified taxonomy. News articles and Services are still hand-authored
in `data.js` and untouched by this process.

For the News section only, regenerate its templated pages with:
```
bash gen/gen-news.sh
```

## URL structure

Clean, localized URLs via real folders (`.../slug/index.html`). Equipment
and Instruments are two independent catalogs with separate URL bases:

- `/en/equipment/<slug>/` · `/fr/equipements/<slug>/`
- `/en/instruments/<slug>/` · `/fr/instruments/<slug>/` (same word, both languages)
- `/en/news/choosing-patient-monitor/` · `/fr/actualites/choosing-patient-monitor/`
- `/en/quote/` (My Quote) · `/fr/devis/`
- `/en/quote/request/` · `/fr/devis/demande/`

## Equipment vs. Instruments (not Consumables)

Every product has a `type: "equipment"` or `type: "instrument"` field. A
reusable surgical instrument (forceps, scissors, retractors, needle
holders...) is explicitly **not** treated as a consumable — it's a
separate catalog with its own nav item, its own category taxonomy
(`instrumentCategories` vs. `categories`), and its own URL base. The code
still recognizes a `type:"consumable"` value (via `productBase()` in
`render-helpers.js`) for whenever real consumables data becomes
available, but no consumable pages exist today since the source inventory
didn't contain any. `assets/js/catalog.js` powers both live catalog
pages; each page sets `window.CATALOG_TYPE` to pick which one.

## Brands page routing

Each brand card links based on what that brand's `products` array
(computed live from the real data, not hardcoded) actually contains: if a
brand supplies both equipment and instruments, an expandable panel
("More info" ▾) reveals two buttons ("View Equipment" / "View
Instruments"); if it only supplies one type, clicking the brand photo
goes straight to that catalog pre-filtered to the brand (`?brand=<id>`).

## "Featured" products are based on real page views

`assets/js/popularity.js` increments a per-product view counter (in
`localStorage`) every time a product detail page is opened, and the
homepage's "Featured Equipment" section shows the most-viewed products —
so it does become more realistic as a visitor (or the whole team testing
the site) clicks around.

**Limitation to know about:** there is no backend/database in this
version, so this counter lives in each visitor's own browser, not a
shared global count across every customer. It reflects "what has been
looked at on this device," not true store-wide popularity. Get real
cross-visitor popularity by replacing `getProductViewCounts()` in
`popularity.js` with a call to a small server-side counter (the same kind
of addition described in "Adding a backend later" below).

## The quote flow

1. **Add to Quote** on any product card or product page → stored in
   `localStorage` (`veridian_quote_v1`), no backend involved.
2. **My Quote** (`/en/quote/`) — review items, adjust quantities, remove
   products. No prices shown, per spec ("Prices will be provided by our
   sales team").
3. **Request a Quote** (`/en/quote/request/`) — a two-step wizard: contact
   information (including a required Company/Individual customer-type
   choice — the Company/Organization field is only required when
   "Company" is selected), then a review screen with a required consent
   checkbox, then submit.
4. On submit: a reference (`QT-2026-0001`, incrementing per year) is
   generated, an email payload is built, and delivery is attempted (see
   below). The request is also saved to `localStorage` so the
   confirmation page and PDF can render it.
5. **Confirmation page** shows the reference/date/item count and offers a
   **PDF request summary** download (clearly labeled as a summary, not an
   official quotation — no prices).

## Wiring up real email delivery

Right now, submitting a quote request (or the contact form) falls back to
opening the visitor's email client via a pre-filled `mailto:` link — so
the flow works end-to-end with zero configuration, but requires the
visitor to press "send" themselves. To deliver automatically, edit
**`assets/js/config.js`** and choose one option (all of them keep your real
inbox address out of the visible frontend code). If more than one is
enabled, precedence is `formEndpoint` > `emailjs` > `web3forms`.

- **Web3Forms** (simplest — always free, no server, no mailbox login):
  go to web3forms.com, enter your destination email, and it emails you an
  access key instantly (no account/password). Paste it into
  `web3forms.accessKey` and set `web3forms.enabled = true`. Free for 250
  submissions/month, forever.
- **EmailJS** (if you want the email to be sent from your own connected
  Gmail/Outlook): create a service + template at emailjs.com, set the
  destination address inside the EmailJS template configuration (not in
  this repo), then fill in `serviceId` / `templateId` / `publicKey` and
  set `emailjs.enabled = true`. Free for 200 emails/month.
- **Your own serverless endpoint** (future-ready path): point
  `formEndpoint.url` at a small server route you control, which receives
  the JSON payload and sends the email server-side — your real inbox then
  lives only in that server's environment variables. Set
  `formEndpoint.enabled = true`.

The contact page form (`assets/js/contact-form.js`) uses this exact same
configuration and precedence — no separate setup needed.

## News section

The News page (`/en/news/`, `/fr/actualites/`) currently shows curated,
hand-written sample articles (dated, sorted newest-first) rather than a
live feed — there is no backend to poll an external source on a schedule.
To get genuinely live, auto-updating daily news, the cleanest option for a
static site is a client-side fetch from a real medical news RSS/API feed
at page load (no backend needed, but it is an external service decision —
which outlet/API, and accepting its rate limits and content-licensing
terms — that's worth making deliberately rather than having a source
picked for you). `assets/js/news-article.js` and the news index renderer
in `listing-pages.js` both read from `VERIDIAN_DATA.news`, so swapping
that static array for the parsed response of a live feed is a contained
change once a source is chosen.

## Content that is intentionally placeholder

Per the brief, nothing was invented that could mislead a buyer:

- **Brand names** (149 of them) are real supplier/manufacturer brands from
  the customer's own inventory — no placeholders here.
- **Company contact details, address and hours** are bracketed
  placeholders (`[ contact@mondo-medical.example ]`) in the footer and
  Contact page — replace before launch.
- **News articles** are sample editorial content, clearly labeled as such
  on the News index page — see "News section" above.
- **Product specifications** are not shown at all for the real catalog
  items — the source inventory only gave us designation, category, model
  (when known) and supplying brand, so the detail page states exactly
  that and nothing more, with an honest "contact our sales team for full
  technical specifications" note instead of inventing feature lists.
- **Services** (installation, training, maintenance, etc.) are marked as
  indicative on the Services page.
- **Product photography** currently shows a consistent set of minimal
  line-icon illustrations (no stock photos), assigned per category — but
  the site is photo-ready: drop a file named `<product-id>.jpg` (or
  `.png`) into `pictures/products/` and it's picked up automatically on
  both the catalog card and the product page, no code change needed. See
  `pictures/products/LISEZ-MOI.txt` for the exact steps. Images are
  lazy-loaded (`loading="lazy"`), so adding photos for all 394 products
  does not slow down the catalog pages — only images near the visible
  viewport are ever fetched.
- **Legal pages** (Privacy Policy, Terms) are structurally complete but
  explicitly marked as placeholder text pending legal review.

## Adding a backend later

The frontend is already separated so this stays additive:

- Swap `assets/js/data.js` for a fetch to a real product API — every
  renderer already reads from the `VERIDIAN_DATA` object, not from HTML.
- Point `formEndpoint` in `config.js` at a real serverless/backend route
  to persist quote requests to a database instead of (or in addition to)
  emailing them.
- The quote system's functions (`addToQuote`, `removeFromQuote`,
  `increaseQuantity`, `decreaseQuantity`, `clearQuote`, `getQuote`,
  `getQuoteCount`) are isolated in `quote.js` and can be swapped to call
  an API instead of `localStorage` without touching any page.
