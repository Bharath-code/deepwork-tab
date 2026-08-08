# D14 heartbeat worker

Anonymous daily ping receiver for DeepWork Tab. Extension sends `{ id, day, d }` once per day; nothing else.

It also takes the website's email signups (`POST /subscribe`) — a second, unrelated job in the same Worker because one Worker is enough and the KV namespace already exists. The two never touch: pings live under `i:`/`idx:`, addresses under `e:`, and no key joins them.

| Route | Method | Who calls it |
|---|---|---|
| `/` | POST | Extension — daily ping |
| `/subscribe` | POST | Website form — JSON or form-encoded |
| `/stats?key=` | GET | You — the D14 gate |
| `/subscribers?key=` | GET | You — export the list |
| `/health` | GET | Anyone |

## Deploy (one-time)

```bash
cd heartbeat
npx wrangler login
npx wrangler kv namespace create PINGS
# paste the id into wrangler.toml (id + preview_id)
npx wrangler secret put STATS_KEY   # random string for /stats
npx wrangler deploy
```

Copy the `*.workers.dev` URL into `background/service-worker.js`:

```js
const PING_URL = 'https://deepwork-tab-ping.<you>.workers.dev/';
```

Reload the extension. Pings start within 6 hours (alarm period).

## Stats

```bash
curl "https://deepwork-tab-ping.<you>.workers.dev/stats?key=$STATS_KEY"
# → { installs, aged14, d14Active, d14Rate }
```

Day-30 gate (README): `d14Rate >= 0.10` among installs aged ≥14 days.

## Subscribers

```bash
curl "https://deepwork-tab-ping.<you>.workers.dev/subscribers?key=$STATS_KEY"
# → { count, emails: [...] }
```

Same secret as `/stats`. Deleting someone is `wrangler kv key delete "e:<addr>" --binding PINGS` — do it the day they ask.

## Privacy

- No IP logging in app code
- No URLs, titles, or reasons
- Install UUID is random, not tied to a Google account
- Email addresses come only from the website form, never from the extension, and are never joined to an install ID — `site/privacy.html` says so, so keep it true
