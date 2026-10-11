# Strategy: Moat, Evidence, and the Path to Enterprise

> Written 2026-10-12. Supersedes the moat notes in `founder/board.md` and amends `docs/MASTER_PLAN.md` §7 (Stage 3). Implementation tasks live in `docs/superpowers/plans/2026-10-12-licensing-backend.md` (Tasks 2.2, 2.6, 3.3). Outreach lives in `GTM.md` §7.

## 1. Thesis

**Privacy is the moat. Evidence is how the world sees it.**

The code is not defensible: `founder/board.md` scores it 4/10 and says it can be cloned in days. Usage data is not defensible either. A tab cap does not learn, so logs do not compound. Two things do compound and cannot be forked:

1. **Proof:** a peer-reviewed result that the intercept changes behaviour.
2. **Trust:** an architecture where "we cannot see your browsing" is literally true, so it survives a security review and a journalist.

Everything below either builds one of those or is gated until it can be paid for.

## 2. Moat assessment (Helmer, *7 Powers*)

| Power | Applies? | Lever |
|---|---|---|
| **Counter-positioning** | **Strongest.** Trackers and employee-monitoring tools cannot adopt "we see nothing" without destroying their own model | Keep the server to a licensing ledger. Publish the data inventory. Keep the source public |
| **Cornered resource** | Possible | A published study (§4 L4). A fork copies code, not a paper |
| **Switching costs** | Weak, real | Queue history, rules, work-hours schedule, the 66-day horizon. Backup/restore raises trust and does not trap |
| **Brand** | Slow, real | Craft (`DESIGN_V2.md`), calm copy, the public Dec 2 post-mortem including bad numbers |
| Network effects · scale economies · process power | **No** | Do not claim them. Team features are NEVER BUILD |

**Platform risk:** Chrome Memory Saver, tab groups or a native focus mode could flatten the feature. Proof and brand outlast features, which is why they are the investment.

## 3. North-star metric

**Held moments per weekly active user (HM/WAU).**

- *Held moment* = an intercept **not followed by loosening** within 10 minutes. Loosening means raising the cap, turning enforcement off, or adding an exemption, all of which pass through the 60-second delay gate. The intercept has no "open anyway" button: its exits (queue, go back, swap one tab for another) all keep the cap, so loosening is the only way the pause loses.
- Outcomes are logged for the funnel, not the north star: `queued`, `back`, `swapped`, `abandoned`.
- Why: it measures the job (an impulse met a pause and the pause won), not activity (installs, minutes, tabs).
- **Guardrails:** D14 retention ≥10% (kill line, `README.md`), D30 retention, uninstall-survey reasons. A rising HM/WAU with falling D14 means the product is too punishing and needs fixing, not celebrating.
- **Hold rate** = held / intercepts. It is the per-user outcome, used in the study and the enterprise ROI story.

Computed locally from `weekLog` once intercept outcomes and loosen events are logged (plan Task 2.2). Today only `intercept` and `queue` are recorded. It reaches us only as consented aggregate counts.

## 4. Evidence ladder

Each rung needs the one before it.

| Rung | Proves | Method | Privacy design | Gate |
|---|---|---|---|---|
| **L0 Receipt** | To the user: it worked for me | Weekly receipt (shipped) | On device | Now |
| **L1 Telemetry** | Retention, funnels, HM/WAU | Consented ping + aggregate counts (plan 2.1, 2.2) | Aggregated on write, no per-user rows, no URLs | Launch |
| **L2 PMF survey** | People would miss it | Sean Ellis question at day 14, asked once. Target **≥40% "very disappointed"** | Answer + version only, no id | 30 days after listing |
| **L3 Research cohort** | Behaviour change at scale | Opt-in "data donation": the device computes weekly summaries, **the user previews the exact payload**, plus pre/post survey (plan 3.3) | Separate consent, withdraw anytime, random cohort id unrelated to install id | D14 passes |
| **L4 Published study** | To the world | Academic partner, pre-registered on OSF, ethics approval held by the lab | Lab is controller; we supply the tool | 6–12 months after L3 |
| **L5 Enterprise pilot** | ROI to a buyer | Pre/post *team* aggregates | Minimum group size **k ≥ 5**; no individual view exists | Stage 3 |

**Rules:**
- Pre-register the hypothesis, primary metric (hold rate) and analysis before the cohort opens. A null result is publishable, and publishing it is the brand.
- No medical or clinical claims, ever. This is especially important on the ADHD pages (`GTM.md` §7 guardrail).
- Precedent: one sec ran its study with Max Planck and Heidelberg. The company reports a 57% drop against a hoped-for 12%, published in PNAS. Treat the figure as the company's account. The mechanism (a pause at the moment of impulse) matches ours.

## 5. Product → company → enterprise

| Stage | Gate to enter | Build | Buyer | Data model |
|---|---|---|---|---|
| **1 Solo** | — (now) | Licensing plan phases 0–2 | Individual, $29/yr · $59 lifetime | Device + licensing ledger |
| **1.5 Managed install** | D14 ≥ 10% · founder approves the NEVER BUILD reading (§6) | `chrome.storage.managed` policy: IT force-installs and sets cap and work hours via Google Admin or GPO (plan 2.6). Volume licence via quantity checkout + invoice | IT admin. Signal: a 60,000-user tab limiter deployed by Group Policy (`RESEARCH.md` §1) | Unchanged. Admin pushes config and receives nothing |
| **2 Bottom-up signal** | ≥ 100 paying customers | Monthly query: paying customers per **work email domain** from the licensing ledger. At ≥ 3 seats on one domain, contact them by hand | Team lead who expenses it | Unchanged. Disclose as legitimate interest in the privacy policy |
| **3 Enterprise** | ≥ 5 domain clusters · L4 published or in press | Admin console: policy, seats, **k ≥ 5** adoption aggregates. SSO past ~50 seats. DPA template, security page, standard questionnaire answers. SOC 2 only when a signed deal requires it | IT / People / Eng leadership | **Employee-owned data.** The employer sees policy and aggregates, never a person |

**Why Stage 3 is employee-owned, not "focus analytics for managers":**
- Monitoring products read as bossware.
- In Germany, works councils have co-determination rights over technical systems capable of monitoring employees (BetrVG §87(1) no. 6), so the deal stalls.
- "The vendor technically cannot see browsing" ends the security review instead of starting it. Counter-positioning carries into the enterprise.

**Where revenue comes from in a local-first business:** anything that needs a server or a contract, such as renewals, managed deployment, invoicing, support and compliance paperwork. Honour-system business licences do not pay. Obsidian made its commercial licence optional in Feb 2025, saying it added "unnecessary complexity."

## 6. Constraints and decisions

- **NEVER BUILD "Teams"** (`README.md`). Stage 1.5 is a configuration schema with no shared surfaces, so it reads as *not* Teams. **The founder must approve that reading** before plan Task 2.6 starts. Stage 3 needs an explicit README amendment.
- **NEVER BUILD "Sync"** is unchanged. Encrypted backup (plan 3.1) needs its own amendment.
- The north star can be changed in one place (this §3). Candidates considered: days within cap during work hours (consistency), and queue items later acted on (nothing lost).

## 7. Principles

- Retention before acquisition. PMF before enterprise. An enterprise motion on unproven retention scales churn.
- A moat is an outcome, earned by proof, trust and time. It is not a feature.
- Measure outcomes, not activity, and pre-register what success looks like.
- Do things that don't scale: hand outreach at the first domain cluster, before any admin console.
- Publish the negatives. In a category of claims nobody can check, honesty stands out.

## 8. Next actions

| # | Action | Where | When |
|---|---|---|---|
| 1 | Log intercept outcomes; ship HM/WAU + PMF survey | Plan Task 2.2 | Before launch |
| 2 | Managed-policy schema | Plan Task 2.6 | After D14 gate + approval |
| 3 | Research cohort (data donation) | Plan Task 3.3 | After D14 gate |
| 4 | Send three academic outreach emails | `GTM.md` §7 | October 2026 |
| 5 | Publish n=1 founder numbers | `GTM.md` §7 rung 1 | With launch |
| 6 | Monthly domain-cluster query | Ops, once ≥ 100 paying | Stage 2 |

## Sources

- [one sec: Max Planck study](https://one-sec.app/max-planck-study) (company account of the PNAS paper)
- [Obsidian: free for work (2025-02-20)](https://obsidian.md/blog/free-for-work/)
- [Microsoft Viva Insights privacy settings: minimum group size ≥ 5](https://learn.microsoft.com/en-us/viva/insights/advanced/setup-maint/privacy-settings)
- `RESEARCH.md` §1: CWS tab-limiter user counts (fetched 2026-09-26)
