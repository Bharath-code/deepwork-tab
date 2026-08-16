# Permission justifications (Chrome Web Store review form)

- **tabs** — count open tabs against the user's cap, and to close/reopen tabs from the intercept and queue.
- **storage** — save the tab cap, queue, streak, and per-domain reasons locally on the user's device; nothing syncs.
- **alarms** — schedule the once-daily anonymous usage ping (install ID + day only).
- **host_permissions (`https://deepwork-tab-ping.kumarbharath63.workers.dev/*`)** — send the once-daily anonymous ping (install id + day only). No other origin is contacted. Tab URLs come from the `tabs` permission (`pendingUrl` / `url`), not from fetching pages.
- **optional host `*://www.youtube.com/*`** — requested only after Pro is activated. Hides YouTube's sidebar, comments, home feed and autoplay toggle. Not granted at install. Denied: Pro still works; de-pandora stays off.
