# Unlisted — Data Broker Removal

Node.js + Express + Tailwind app for tracking and filing data-broker removal
requests, built in support of blockd.ai. Mobile responsive throughout.

## What's real here, and what isn't

This is important, so it's not buried:

- **Breach exposure check is real.** It calls the live [Have I Been Pwned v3 API](https://haveibeenpwned.com/API/v3)
  server-side. You need your own paid API key (~$4.50–5/mo depending on current pricing —
  check haveibeenpwned.com/API/Key).
- **The broker database is real.** ~20 actual data brokers with their genuine opt-out
  method (form URL, email address, or phone), sourced from publicly documented opt-out
  guides. Each entry has a `source_url` and `last_verified` date — re-verify periodically,
  brokers change process without notice. See `server/data/seed.js` for sources.
- **California's DROP platform link is real.** It's a live, free, state-run deletion
  mechanism covering 540+ CPPA-registered brokers in one request. We link to it; there's
  no public API for a third party to file on a resident's behalf, so this is a deep link,
  not an automated integration.
- **Email-based opt-outs can be sent automatically** if you configure SMTP credentials —
  the app composes a real CCPA/GDPR-citing deletion request and sends it via nodemailer.
- **Form-based opt-outs are NOT automated end-to-end.** Most brokers don't expose an API
  or accept third-party automated submissions reliably. The app generates the exact request
  text and deep-links to the broker's opt-out page; a human click is required. Building
  true headless-browser automation per broker is a real, separate engineering project —
  brokers change their forms, add CAPTCHAs, and require identity verification in ways that
  make blind automation unreliable and, in some cases, against a given broker's terms.

If you want full form automation later, the natural next step is a job queue
(`server/services/optout.js` is the place to extend) with a headless browser
(Playwright/Puppeteer) worker per broker, built and tested one broker at a time.

## Setup

```bash
npm install
cp .env.example .env
# edit .env — at minimum set SESSION_SECRET and HIBP_API_KEY
npm run seed          # populates the broker database
npm run build:css     # compiles Tailwind once
npm run dev           # runs server + Tailwind watcher together
```

Visit `http://localhost:3000`.

### Required for breach checking
Get an HIBP API key at https://haveibeenpwned.com/API/Key and put it in `.env`
as `HIBP_API_KEY`. Without it, the breach-check endpoint returns a 503 with a
clear message rather than failing silently or faking a result.

### Optional, for sending real opt-out emails
Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` in `.env` to a real
transactional email provider (Postmark, SES, SendGrid SMTP, etc). Without
this, the "Send email now" button in the dashboard returns a clear reason
instead of pretending to send.

## Stack

- **Backend:** Node.js, Express, better-sqlite3 (swap for Postgres easily — the
  schema is plain SQL in `server/data/db.js`)
- **Frontend:** Server-rendered EJS + Tailwind CSS, vanilla JS for interactivity
  (no SPA framework — keeps this simple and fast on mobile)
- **Auth:** Session-based (cookie-session), bcrypt password hashing
- **APIs:** Have I Been Pwned v3 (real), nodemailer (real, needs SMTP config)

## Project structure

```
server/
  index.js              Express app entry
  data/
    db.js                SQLite schema
    seed.js               Real broker data + seed script
  services/
    hibp.js               HaveIBeenPwned API client
    optout.js             Request text generation + email sending
  routes/
    auth.js, api.js, pages.js
  middleware/auth.js
views/                   EJS templates (mobile responsive)
public/
  css/input.css           Tailwind source
  js/dashboard.js          Dashboard interactivity, talks to /api/*
```

## Design notes

Visual identity: a "case file / redaction" theme — void-black background,
a signal-red redaction bar, monospace "dossier" styling for data fields and
stats, condensed display type for headlines. Token system lives in
`tailwind.config.js`.

## Pricing

Tier structure and pricing match incogni.com's public pricing page (Standard
$7.99/mo, Unlimited $14.99/mo, Family $15.99/mo, Family Unlimited $22.99/mo,
billed annually; monthly rates roughly 2x). Update `views/pricing-partial.ejs`
if you want different numbers — there's no live billing integration wired up
yet (no Stripe), since that wasn't in scope here but is the obvious next step.
