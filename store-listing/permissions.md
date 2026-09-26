# Permission justifications (Chrome Web Store review form)

- **tabs** — count open tabs against the user's cap, and to close/reopen tabs from the intercept and queue.
- **storage** — save the tab cap, queue, streak, and per-domain reasons locally on the user's device; nothing syncs.
- **alarms** — schedule the once-daily anonymous usage ping (install ID + day only).
- **scripting** — register the YouTube de-pandora stylesheet/script at runtime, and only after the user grants the optional youtube.com permission. Keeps youtube.com out of the install-time permissions.
- **host_permissions (`https://deepwork-tab-ping.kumarbharath63.workers.dev/*`)** — send the once-daily anonymous ping (install id + day only). No other origin is contacted. Tab URLs come from the `tabs` permission (`pendingUrl` / `url`), not from fetching pages.
- **optional host `*://www.youtube.com/*`** — requested only after Pro is activated; the content script is registered via `chrome.scripting` on grant and unregistered on revoke, so there is no static `content_scripts` entry. Hides YouTube's sidebar, comments, home feed and autoplay toggle. Not granted at install. Denied: Pro still works; de-pandora stays off.
