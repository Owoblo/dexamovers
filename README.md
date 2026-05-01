# DEXA Movers

Static marketing site for `dexamovers.ca`, built to deploy cheaply on Cloudflare Pages with a lightweight lead endpoint.

## Stack

- Static HTML, CSS, and JavaScript
- Cloudflare Pages Functions for `/api/lead`
- No front-end framework or build step required

## Project structure

- `index.html`: homepage, SEO tags, FAQ schema, quote and contact forms
- `styles.css`: all visual styling and responsive layout
- `main.js`: mobile navigation and form submission UX
- `functions/api/lead.js`: Cloudflare Pages Function for lead handling
- `_headers`: security headers
- `wrangler.toml`: local Cloudflare Pages config starter

## Lead delivery options

The form endpoint supports two delivery paths:

1. `FORM_WEBHOOK_URL`
   Use this if you want leads to go to Zapier, Make, Slack, or another webhook target.
2. `RESEND_API_KEY` plus `FORM_TO_EMAIL`
   Use this if you want the site to send lead emails directly through Resend.

Optional:

- `RESEND_FROM_EMAIL`
  Override the sender address for lead notifications.

If neither delivery method is configured, the endpoint returns a configuration error instead of silently failing.

## D1 lead capture

The form endpoint can also store submissions in Cloudflare D1.

- Migration file: `migrations/0001_create_leads.sql`
- Binding name expected by the function: `DB`

This is useful as a deployment-safe fallback even before email delivery is configured.

## Cloudflare Pages deployment

1. Create a new Cloudflare Pages project.
2. Connect the repo, or upload this directory directly.
3. Set the build command to blank.
4. Set the output directory to `.`.
5. Add environment variables in Cloudflare Pages:
   - `FORM_TO_EMAIL=hello@dexamovers.ca`
   - `FORM_WEBHOOK_URL=...` or `RESEND_API_KEY=...`
   - optional `RESEND_FROM_EMAIL=DEXA Movers <leads@dexamovers.ca>`
6. Deploy.

## Domain setup for `dexamovers.ca`

Recommended production setup:

1. Add the domain to Cloudflare.
2. Change the registrar nameservers to the pair Cloudflare gives you.
3. In the Pages project, attach:
   - `dexamovers.ca`
   - `www.dexamovers.ca`
4. Set `www` to redirect to the apex domain, or vice versa, depending on your preferred canonical host.

If the domain is currently registered at Vercel, registration can stay there initially. What matters is changing the authoritative nameservers to Cloudflare if you want Cloudflare DNS, Pages, and Email Routing together.

## Custom email

Cloudflare Email Routing is the cheapest path if you only need custom-domain forwarding, for example:

- `hello@dexamovers.ca` -> your existing Gmail inbox
- `quotes@dexamovers.ca` -> your existing Gmail inbox

Important:

- Cloudflare Email Routing is forwarding only. It does not give you a real mailbox or SMTP sending.
- If you need a true inbox with send/receive from the custom domain, use Google Workspace, Microsoft 365, or Zoho Mail.

## Suggested email setup

Cheapest:

- Use Cloudflare Email Routing for incoming mail.
- Forward `hello@dexamovers.ca` and `quotes@dexamovers.ca` to your existing inbox.
- Use Gmail "Send mail as" only if you add a real outbound mail provider later.

Best simple professional setup:

- Google Workspace for a real mailbox.

Lowest-cost real mailbox:

- Zoho Mail if you want to minimize recurring cost.

## Business details still worth tightening

The site is production-ready structurally, but these details should be finalized before launch:

- primary phone number
- official service radius
- live review links
- actual office address if you want it on-page
- social profiles
- exact pricing language and any legal terms
