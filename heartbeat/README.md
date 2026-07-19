# D14 heartbeat worker

Anonymous daily ping receiver for DeepWork Tab. Extension sends `{ id, day, d }` once per day; nothing else.

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

## Privacy

- No IP logging in app code
- No URLs, titles, or reasons
- Install UUID is random, not tied to a Google account
