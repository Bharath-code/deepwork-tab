# Permission justifications (Chrome Web Store review form)

- **tabs** — count open tabs against the user's cap, and to close/reopen tabs from the intercept and queue.
- **storage** — save the tab cap, queue, streak, and per-domain reasons locally on the user's device; nothing syncs.
- **alarms** — schedule the once-daily anonymous usage ping (install ID + day only).
- **host_permissions (`http://*/*`, `https://*/*`)** — read the URL a tab was about to open so the intercept can show/queue it; no page content is read or modified.
- **content script on www.youtube.com** — a paid feature hides the recommendation sidebar, comments and home feed on YouTube, and turns off YouTube's own autoplay toggle. It only restyles the page's own layout and clicks that one existing control; no page content is collected, stored or transmitted.
