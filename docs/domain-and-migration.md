# Domain connection and htwebsolution.com migration checklist

Nothing here has been changed. htwebsolution.com stays live until you decide.

## A. Connect adzenmedia.com (approved path)
1. Publish the app from Emergent (Deploy). Note the live URL.
2. Emergent → Deployments → Custom domain → add `adzenmedia.com` and `www.adzenmedia.com`.
3. At your DNS provider, add the records Emergent shows (A/CNAME). Don't touch MX/TXT mail records.
4. Canonical host: `adzenmedia.com` (no www). Redirect `www` → apex with a 301.
5. Checks after DNS propagates:
   - `curl -I http://adzenmedia.com` → 301 to https
   - `curl -I https://www.adzenmedia.com` → 301 to https://adzenmedia.com
   - `https://adzenmedia.com/sitemap.xml` and `/robots.txt` load
   - View page source shows a valid certificate and `<link rel="canonical" href="https://adzenmedia.com/...">`
6. Add production secrets: `CORS_ORIGINS=https://adzenmedia.com`, `SITE_URL=https://adzenmedia.com`.

## B. Mail DNS
- Keep existing MX records for your mailbox provider.
- SPF: one TXT record `v=spf1 include:<mailbox provider> ~all` (merge, never two SPF records).
- DKIM: add the provider's DKIM CNAME/TXT.
- DMARC: `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:<monitored address>`; tighten to `quarantine` after 4 weeks.
- Transactional email is sent by the Emergent-managed sender with your monitored Reply-To. If you later want email *from* @adzenmedia.com, verify the domain with your own Resend account first.

## C. Move from htwebsolution.com (only when you decide)
1. Crawl the old site and list every indexed URL (Search Console → Pages, or `site:htwebsolution.com`).
2. Fill the URL map below. Every old URL gets a 301 to its closest new page.
3. Set 301s on the old host (server/hosting config). Keep the old domain registered and redirecting for at least 12 months.
4. Search Console: verify both domains (DNS TXT), submit `https://adzenmedia.com/sitemap.xml`, then use **Change of Address** from the old property to the new one.
5. Update the Google Business Profile, directory listings, email signatures and social profiles.
6. Monitor Search Console coverage and 404s weekly for 8 weeks.

| Old URL (htwebsolution.com) | New URL (adzenmedia.com) |
|---|---|
| / | / |
| /services, /web-design | /solutions/website-inquiry-system |
| /seo, /digital-marketing | /solutions/website-inquiry-system |
| /automation | /solutions/workflow-automation-pilot |
| /software, /portal | /solutions/customer-portal-software-discovery |
| /training | /solutions/ai-training-for-teams |
| /portfolio, /work, /projects | /work |
| /about | /about |
| /contact, /quote | /contact |
| /privacy | /privacy |
| [Owner to add remaining URLs from crawl] | |

## D. GitHub export
Emergent → Save to GitHub → choose repo. Secrets are not exported; use `backend/.env.example` as the template.
