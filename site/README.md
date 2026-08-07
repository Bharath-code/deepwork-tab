# Landing page

Static site, no build step. One inline script (upgrades the intercept mockup
into a working demo); the page reads correctly without it. No webfonts, no
external requests. Deployed as a Cloudflare Worker with static assets.

## Deploy

```bash
cd site
cp ../shared/tokens.css .          # site/ is the web root; ../ won't resolve once deployed
npx wrangler deploy                # config in wrangler.jsonc
```

Live at https://deepwork-tab.kumarbharath63.workers.dev

`site/tokens.css` is gitignored — it's a build copy, `shared/tokens.css` stays
the source of truth. The page deliberately overrides that palette in
`style.css`: the extension is furniture you live inside, the site is an
argument.

## Before deploying

- Replace the `Install from source` link with the live Web Store listing URL
  once approved, and demote the current button (see the comment in `index.html`).
