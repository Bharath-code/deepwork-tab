# Critique ignore list

- Go-back auto-enqueues the target URL ("Saved it, just in case"). Intentional safety net, confirmed by owner 2026-07-18. Do not flag as a user-control issue.
- `kbd` chips use 4px radius + 2px bottom border (shared/tokens.css). Documented keycap signature in DESIGN.md §5; not a border-accent anti-pattern.
