/* ==========================================================================
   MONDO MEDICAL — project configuration.
   This is a frontend-only (no backend, no database) first version.
   To receive quote requests by email you have three options; all of them
   keep the real destination address OUT of the visible frontend/template.

   OPTION A — Web3Forms (simplest, always free, no server, no mailbox login):
     1. Go to https://web3forms.com, enter your destination email, and it
        emails you an Access Key instantly — no account/password needed.
     2. Paste that key into web3forms.accessKey below.
     3. Set web3forms.enabled = true.
     Free tier: 250 submissions/month, forever, no credit card.

   OPTION B — EmailJS (if you want to send FROM your own Gmail/Outlook):
     1. Create a free account at https://www.emailjs.com
     2. Create an Email Service + an Email Template. Set the destination
        address inside the EmailJS template/service configuration
        (server-side, in your EmailJS account) — NOT in this file.
     3. Fill in serviceId / templateId / publicKey below.
     4. Set emailjs.enabled = true.
     Free tier: 200 emails/month.

   OPTION C — Your own serverless endpoint (future-ready path):
     Point formEndpoint.url at a server route you control (e.g. a small
     serverless function) that receives the JSON payload built in
     assets/js/quote-submit.js and sends the email server-side. The
     destination address then lives only in that server's environment
     variables, never in frontend code. Set formEndpoint.enabled = true.

   If none are configured, the site falls back to opening the visitor's
   email client with a pre-filled message (mailto:), so the quote request
   flow always works end-to-end even before an email service is wired up.

   Precedence when several are enabled: formEndpoint > emailjs > web3forms.
   ========================================================================== */
var VERIDIAN_CONFIG = {
  /* Supabase backs the product/brand catalog and stores quote requests
     (with a real, server-side sequential reference number). The URL and
     "publishable"/anon key are meant to be public — they only allow what
     the database's Row Level Security policies explicitly permit (public
     read on brands/products, public insert-only on quote_requests). See
     supabase/migration.sql for the schema. */
  supabase: {
    url: "https://yunfkuopiqizjsvejeup.supabase.co",
    anonKey: "sb_publishable_NuwiR2Rn0z6olQa9p6cKaQ_n8bU73uH"
  },
  web3forms: {
    enabled: true,
    accessKey: "8940e53c-8b74-49e2-91e1-b7d906654136"
  },
  emailjs: {
    enabled: false,
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    templateId: "YOUR_EMAILJS_TEMPLATE_ID",
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY"
  },
  formEndpoint: {
    enabled: false,
    url: "/api/quote-request"
  },
  /* Fallback mailbox used ONLY to build the mailto: link when no email
     service is configured. Replace with your real inbox before launch,
     or better, leave this blank and configure one option above. */
  fallbackMailto: "sales@mondo-medical.example",
  companyDisplayName: "Mondo Medical"
};
