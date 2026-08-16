# Permission justifications (Chrome Web Store review form)

- **tabs** — count open tabs against the user's cap, and to close/reopen tabs from the intercept and queue.
- **storage** — save the tab cap, queue, streak, and per-domain reasons locally on the user's device; nothing syncs.
- **alarms** — schedule the once-daily anonymous usage ping (install ID + day only).
- **host_permissions (`https://deepwork-tab-ping.kumarbharath63.workers.dev/*`)** — send the once-daily anonymous ping (install id + day only). No other origin is contacted. Tab URLs come from the `tabs` permission (`pendingUrl` / `url`), not from fetching pages.
- **content script on www.youtube.com** — a paid feature hides the recommendation sidebar, comments and home feed on YouTube, and turns off YouTube's own autoplay toggle. It only restyles the page's own layout and clicks that one existing control; no page content is collected, stored or transmitted. (Task 3 will move this to optional host permission.)
