# Landing page

Static site, no build step. Two inline scripts on `index.html` — one upgrades
the intercept mockup into a working demo, one keeps the signup form in place
instead of navigating away. Both are enhancements: the page reads and the form
works with JavaScript off. No webfonts, nothing loaded from a third party.
Deployed as a Cloudflare Worker with static assets.

## Pages

| File | Serves at | Job |
|---|---|---|
| `index.html` | `/` | The argument, the pricing, the signup |
| `privacy.html` | `/privacy` | Policy — covers the extension *and* the signup form |
| `vs-freedom.html` | `/vs-freedom` | Comparison intent (`GTM.md` §6) |
| `too-many-tabs-open.html` | `/too-many-tabs-open` | Problem intent — highest expected volume |
| `adhd-too-many-tabs.html` | `/adhd-too-many-tabs` | The ADHD wedge, reached by search rather than by posting |

The three written pages share the `.prose` shell with `privacy.html`. Adding
another is: copy one, change the words. Don't add a framework for a fourth.

**The ADHD page makes no clinical claim and must not start.** It says so at the
top, it names the one study it cites as being about a different app and a
different question, and it recommends against itself four ways. Keep all of
that if you edit it.

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
  once approved, and demote the current button. There's a comment marking the
  spot in `index.html` **and in each of the three written pages** — four
  places, easy to miss three of them.
- The signup form posts to the ping Worker at `/subscribe`. Deploy `heartbeat/`
  first or the form 404s. Read the list back with
  `/subscribers?key=$STATS_KEY`.
- Buy the real domain. `*.workers.dev` reads as unfinished and the canonical
  tags on the written pages point at it — update all four when you move.
