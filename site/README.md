# Landing page

Static site, no build step, no JS. Deployed on Cloudflare Pages.

## Deploy

```bash
cd site
npx wrangler pages deploy . --project-name=deepwork-tab
```

## Before deploying

- Replace `demo.gif` with a real ≤20s screen recording/gif (cap hit → queue → recover from popup).
- Replace the `Add to Chrome` link's `href="#"` with the live Web Store listing URL once approved.
