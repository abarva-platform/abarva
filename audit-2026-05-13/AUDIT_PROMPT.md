# AbarVa Comprehensive Audit — Reusable Prompt

> Drop this into a fresh Claude Code session against the AbarVa repo. The session has full permission to: log in to the live app, drive the browser, ask Sentinel/Atlas/Nexus/Steward live questions, read the codebase, run greps, and spawn subagents in parallel. It does **not** have permission to: write code, mutate the database, or send messages to anyone outside this session.

---

## 0. Purpose

Produce a single, skim-able-in-10-minutes audit report evaluating AbarVa against three measures at once:

1. **Functional correctness** — does every primary surface render, navigate, and persist correctly across all three tenants and every demo persona?
2. **Positioning fidelity** — does the product hold up to the claim "Sentinel is a super-smart consultant that can address any business and AI problem" for a business CXO (CEO / CFO / COO / CSO / CMO / CDO / BU-President — not tech-only)?
3. **Design + UX quality** — does it feel executive-grade, hold to the locked design canon, avoid dead ends, and load fast enough not to embarrass?

The report is the deliverable. The work that produces it is whatever combination of browser crawl, codebase grep, and live agent Q&A is most efficient for each defect class.

---

## 1. Operating constraints

- **Live URL:** `https://nexus-vert-kappa.vercel.app` (verify on first navigation).
- **Auth:** invite-only `DemoCodeSignIn` form requires email + password + 6-digit access code (all three mandatory).
- **Canonical demo roster** (verified 2026-05-13, source: `src/lib/auth/canonical-auth-roster.ts`):

  | Tenant | Email | Persona | Role |
  |---|---|---|---|
  | Apex Retail | `cio@apex-retail.example.com` | Carlos Rivera | CIO |
  | Apex Retail | `cdo@apex-retail.example.com` | Lynne Stratham | CDO |
  | Meridian Health | `cdio@meridian-health.example.com` | Dr. Anita Krishnamurthy | CDIO |
  | Meridian Health | `cdao@meridian-health.example.com` | Kiran Rao | CDAO |
  | First Capital | `cio@firstcapital.example.com` | Patricia Huang | CIO |

  All five share **password `Demo2026!`** and **access code `424242`**. Older `+clerk_test@abarva.com` emails are deprecated — do not use.

- **Sign-out gotcha (verified 2026-05-13):** the in-app Sign-out button is broken. To switch personas, run in DevTools console:
  ```js
  window.Clerk.signOut().then(()=>window.location.href='/sign-in')
  ```
  Log this as P1 defect **D-011** if still broken; skip the log if it's been fixed.

- **Output discipline:** the deliverable is the markdown report. Do not generate documents you can't justify being in the report. Working scratchpad is fine and encouraged for the agent's own memory across the long run.

---

## 2. How to run this — agent topology

You will produce the best report by running parallel agents for the parts that are genuinely parallel, and sequencing the parts that aren't. Spawn agents via the `Agent` tool with self-contained prompts; do not delegate synthesis.

### Recommended fan-out

**Wave 1 — context (sequential, you do this yourself, ~15 min):**
- Read `AGENTS.md`, `CLAUDE.md`, `src/lib/auth/canonical-auth-roster.ts`, the memory index, and any open project plans. Locate the demo personas, the locked design canon, and the four product surfaces (Intelligence / Moves / Source / Tower).
- Bring up the browser, sign in once as Apex CIO, screenshot `/home`, verify auth flow works. Capture any auth-time defects.

**Wave 2 — three parallel browser crawls (one per tenant, ~60 min each):**

For each tenant, spawn a separate `Agent` (subagent_type: `general-purpose`, with full tools) with a brief like:

> Log in to `https://nexus-vert-kappa.vercel.app/sign-in` as **<persona email>** / `Demo2026!` / `424242`. Crawl in this order, screenshotting and capturing tenant-grounded copy + defect candidates per surface:
> 1. `/home` (full scroll, all 5 sections, the 8 setup panels, the action queue, the recent activity)
> 2. `/intelligence` Brief tab — **specifically inspect Value-at-stake + Open-tensions panels for cross-tenant content leakage**, then Map / Art of Possible / Enterprise Context / Vendors sub-tabs
> 3. `/strategic-moves` + click into at least 2 individual moves + the `/strategic-moves/new` Originate flow
> 4. `/source` portfolio + `/source/new` chat-driven intake + 1 individual event
> 5. `/tower` Portfolio canvas + all 5 sub-canvases + click into Scorecards / Gates / Dependencies / Executive brief sub-nav
> 6. `/learn` (Atlas coach)
> 7. 404 page (visit `/admin/agents` or any other dead URL)
> 8. Test the in-app Sign-out button — log as P1 if broken
>
> Then run the full **25-question Sentinel battery** (see §4) for this persona. Capture each answer verbatim along with the scorecard in §4.3.
>
> Return: a structured findings list in the format from §6 plus the full Sentinel scorecard table. Keep the report under 2000 words; defects with screenshots are higher value than prose.

The three agents run in one message-batch with multiple Agent tool uses, in parallel.

**Wave 3 — four parallel code-side audits (~30 min each, kicked off at the same time as Wave 2):**

These don't need the browser and can run alongside the tenant crawls:

- **Agent A — Seed-leak sweep.** Grep the seed files (`src/lib/intelligence/seed-*.ts`, `src/scripts/seed/*.ts`, anything under `src/lib/data/`) for retail-specific terms (loyalty, merchandising, store productivity, demand sensing, item-location, promo, planogram, footfall), healthcare-specific terms (clinical, ambient AI, ACOs, MSSP, sepsis, prior auth, Innovaccer, Epic, KLAS), and banking-specific terms (FedNow, AML, SR 11-7, NIM, model risk, deposit retention). Assert each set of terms only appears in its matching tenant's content. Return: list of every cross-tenant seed leak with file:line.

- **Agent B — RLS / cross-tenant pen test.** Without writing code: enumerate every `/api/*` route, classify by tenant-scope assumption, and for each one identify whether it correctly checks the caller's tenant against the requested resource. Use `grep -rn "tenantId\|client_id\|clientKey" src/app/api/` and reason about the auth middleware. Also inspect the Supabase RLS policies in `supabase/migrations/`. Return: any route where a different-tenant resource could be read or written; flag P0 for read leaks, P0 for write leaks.

- **Agent C — Broker-boundary audit.** Per project memory, app-tier code must not directly import `EnterpriseDataRoom`, broker internals, vector store, or graph clients — all must go through `AgentContextBroker`. Grep `src/app/` and `src/components/` for direct imports of those modules. Return: every violation with file:line + suggested route through the broker.

- **Agent D — Contract / transformer audit.** Per memory, API routes return view-model types not DB types. Walk every `/api/programs/*`, `/api/intelligence/*`, `/api/source/*`, `/api/tower/*` route handler. For each: does the response type match a documented view-model? Is there a transformer in `lib/*/transformers.ts`? Return: list of routes where the contract is ambiguous or the transformer is missing.

**Wave 4 — synthesis (sequential, you do this yourself, ~45 min):**
- Collect all six agent reports + your own Wave-1 findings.
- Cross-reference: a finding seen in two agents is higher signal than one. Especially: code-side seed leaks (Agent A) and browser-observed leaks (Wave 2) should reconcile — list anything that one found and the other didn't.
- Rank defects per §6.
- Write the final report per §7.
- Update memory (especially `demo_accounts.md`, design system docs, project_*.md) for anything stale you discovered.

### Parallelization rules

- Tenants are independent — Wave-2 agents do not need to coordinate. Send all three Agent tool calls in **one** message.
- Code audits (Wave 3) are independent of browser crawls (Wave 2) — send them in the **same** message as Wave 2.
- Do not spawn an agent to do "everything for one tenant including the code audits" — that defeats the parallelism, since the code work is shared across tenants.
- Do not spawn an agent to write the final report — synthesis stays with you. The agents return raw findings; you decide severity, dedup, and headline.

---

## 3. Per-surface inspection protocol

For each tenant × each primary surface (`/home`, `/intelligence`, `/strategic-moves`, `/source`, `/tower`, `/learn`):

### 3.1 Tenant identity verification (every page)
- Top nav tenant indicator matches expected (Apex Retail Group / Meridian Health System / First Capital Financial).
- URL params and breadcrumbs use canonical client keys, **not** legacy codenames (Heliara, Keystone, Brindlemark, Arcturus, apexretail-without-dash inconsistencies).
- Hero copy is industry-correct (retail / healthcare / banking vocabulary, no cross-pollination).
- Any specific numbers, vendor names, org-chart names cited match the tenant.

Wrong tenant identity anywhere = **P0**.

### 3.2 Page render
- Time-to-render (rough: < 1s, 1-3s, 3-5s, > 5s) — anything > 3s is worth a P1.
- Loading / empty / error states present and on-canon.
- Console errors (`onlyErrors: true`, pattern: `error|warning`).
- Failed network requests (any 4xx/5xx).

### 3.3 Click coverage
- Click every top-nav item, sub-nav tab, sidebar item, and primary CTA (skip destructive: no delete, no sign-out unless testing the sign-out bug).
- For each modal/drawer/sub-route that opens: audit content, close, return.
- For each chat surface: ask one tenant-grounded sanity question ("Who are our top 3 vendors by spend?") and score per §4.3.

### 3.4 Design canon check
Per locked canon (memory `design_system.md`): #F8F7F4 bg · Georgia serif headers (normal weight) · DM Sans body · black/ghost CTAs · Snowflake-style density · Snowflake-style sub-nav · no chat bubble truncation · progressive scaffold collapse · sticky bottom Sentinel ask-toolbar on agent surfaces.

Score each surface against each rule. Anything failing on a primary surface is at minimum P2; on the Intelligence Brief specifically, design violations are P1 because that's the demo headline.

---

## 4. Sentinel question battery — full 25 per persona

Ask all 25 in one session per persona so continuity / memory can be evaluated. Adapt wording to the persona's lens; keep intent of each row constant.

### 4.1 Categories

**A. Tenant grounding (does it know me?) (5)**
1. "What do you know about our company? Give me your highest-confidence facts and where you're guessing."
2. "Who are our top 5 vendors by annual spend, and which contracts are up for renewal in the next 12 months?"
3. "Walk me through our organization at the SVP+ level. Who reports to whom? Who's missing?"
4. "What are our 3 biggest KPI pressures right now, and which functions own them?"
5. "What are our active AI and digital initiatives, their phases, and the ones at risk?"

**B. Strategic business decisions, non-AI (5)**
6. "Where is our gross margin compressing the most, and what's your diagnosis?"
7. "If we had to take $200M out of SG&A in 18 months without hurting growth, where would you cut first?"
8. "Which of our business segments should we double down on, and which should we exit?"
9. "What's our biggest competitive vulnerability that our leadership team is under-discussing?"
10. "Walk me through how you'd sequence a 3-year capital allocation plan for us."

**C. AI program decisions (5)**
11. "Where would AI create the most measurable value in our operations in the next 12 months? Rank top 5, cite evidence."
12. "Our last AI pilots stalled at production. What's the named failure mode pattern, and how do we avoid it on the next bet?"
13. "Should we build, buy, or partner for our next major AI capability — and on what dimensions does the answer depend?"
14. "Which of our current AI initiatives should we kill, and what's the reasoning?"
15. "What's the one AI bet our peers are making that we should and aren't?"

**D. Sourcing / vendor decisions (5)**
16. "We're about to RFP a new [tenant-relevant category]. What 5 questions should the RFP force vendors to answer?"
17. "Our largest SI partner is up for renewal. What's our negotiation posture, and where are we over-paying?"
18. "Where in our vendor portfolio are we paying for capability we already own in-house?"
19. "Which vendor is our biggest concentration risk, and what would a credible second source look like?"
20. "If we consolidated our analytics stack, which vendors stay and which go — and what's the migration risk?"

**E. Dissent / adversarial / edge (5)**
21. "What's the strongest argument against the recommendation you just gave? Be honest."
22. "What would have to be true for you to be wrong about #11?"
23. "What's the most important thing you DON'T know about us — and what would unlock a sharper answer?"
24. "Our CFO would read your last answer and call it 'consultant-speak.' Rewrite it with one specific number, one specific risk, and one specific action by Friday."
25. "If you had to pick one move from this whole session to staple to my next board pre-read — which one and why?"

### 4.2 Continuity checks
- After Q5: "Repeat the top 3 KPI pressures you named." (pass / partial / fail)
- After Q15: "Reconcile your answer to #11 with your answer to #14." (pass / partial / fail)
- After Q25: "Summarize this entire session in a 4-bullet executive brief I could paste into Slack." (pass / partial / fail)

### 4.3 Scorecard (per question, per persona)

| Field | Allowed | Notes |
|---|---|---|
| Tenant-grounded? | Yes / Partial / No | Did it cite tenant facts — not generic prose? |
| Citations present? | Count + quality | Real chunks/records you can click? |
| Dissent / "what would change my view"? | Yes / No | First-class output or buried? |
| Confidence calibration | Calibrated / Over / Under | Does it hedge when it should? |
| Arithmetic / internal consistency | Pass / Fail | Catch self-contradictions like ordering errors |
| Specificity | Specific / Generic | One number, one risk, one action — or platitudes? |
| Time-to-first-token | seconds | |
| Total response time | seconds | |
| Demo grade | A / B / C / D / F | A = quotable to a CXO. F = embarrassing. |
| Damning verbatim | Free text | 1–2 sentences from the answer that prove the score |

Per persona, compute average demo grade. Flag bottom-3 questions as P0/P1.

---

## 5. Defect severity rubric

- **P0 — Demo-killing.** Wrong tenant identity, agent crash, blank page, login fails, Sentinel answers with corpus refusal or hallucinates a competitor's name, console error in UI, content from one tenant rendering in another, PII leak, broken nav with no recovery, RLS write-path leak.
- **P1 — Visible to a CXO in a demo.** Generic-prose answer with no citations, missing dissent on a recommendation, dead-end page, mis-named vendor in tenant context, broken sub-nav, long-running spinner > 5s with no content, design-canon violation on a primary surface, sign-out button broken, legacy codename leak in URL.
- **P2 — Polish.** Spacing inconsistency, slightly mis-aligned typography, hover state missing, empty-state ugliness, soft error in non-primary route, brand suffix inconsistency.
- **P3 — Nit.** Copy typos, minor color drift, marketing-only page issues, sidebar truncation.

Every defect entry: ID · severity · surface · screenshot ref · verbatim quote or DOM snippet · suggested fix (one sentence).

---

## 6. Findings format (what the subagents return to you)

Each agent returns a markdown section in this shape:

```
## <Tenant or audit name>

### Surface log
- /home
  - Tenant identity: ✅/❌ + details
  - Sections observed: <list>
  - Render: <speed, errors>
  - Defects: D-NNN P? <one-line>

### Sentinel scorecard
| Q | Persona | Tenant-grounded | Specificity | Continuity | Demo grade | Damning verbatim |
| ... | ... | ... | ... | ... | ... | ... |

### Defects added
| ID | Sev | Surface | Defect | Suggested fix |
| ... | ... | ... | ... | ... |
```

Subagents do not write executive summaries, do not rank defects globally, do not propose roadmaps. They return raw findings; you synthesize.

---

## 7. Final report structure

```
# AbarVa Comprehensive Audit — <date>

## A. Executive verdict (10 lines max)
- Demo-ready: Yes / No / With caveats, per audience (Prat / Vipin / Sriram / Kiran / Sharad).
- Top 3 blockers.

## B. Top-10 fix list (ranked)
| # | Fix | Sev | Area | One-line sketch |

## C. Apex Retail — per-surface findings
## D. Meridian Health — per-surface findings
## E. First Capital — per-surface findings

## F. Sentinel scorecard (all 5 personas, all 25 questions, plus continuity)
- Per-persona averages.
- Bottom-3 questions per persona.
- Cross-persona patterns (e.g. "all 5 personas score B on Q11").

## G. Code-side audit findings
- Seed-leak sweep
- RLS / cross-tenant pen test
- Broker-boundary
- Contract / transformer

## H. Design + UX
- Canon compliance matrix.
- Performance: time-to-render per surface, Sentinel TTFT p50/p95.

## I. Cross-tenant patterns
- Defects affecting 2+ tenants (single fix unblocks all).

## J. Defect log (full P0/P1/P2/P3 table, deduped)

## K. Suggested next moves
- 48 hours
- 7 days
- 30 days
```

Skim-able by a founder in 10 minutes; actionable in 1 hour. Tables over prose. Screenshots inline-referenced. Verbatim Sentinel quotes liberally. Unsentimental.

---

## 8. Lessons baked in from the 2026-05-13 run

- **Don't trust memory for credentials.** Verify against `canonical-auth-roster.ts` before logging in. The old `+clerk_test@abarva.com` emails were stale for 12 days before discovery.
- **`/admin/*` sub-routes mostly 404 for client personas.** The admin surfaces are consolidated into the `/home` left rail Setup panels. Don't chase the old admin route list.
- **`/programs` → `/strategic-moves` redirect.** Programs and Moves are unified now.
- **Sign-out is broken.** Plan persona switches around `Clerk.signOut()` from the console.
- **The single biggest defect class is shared-content leaks** — D-012 (Value/Tensions panels shared retail content on Meridian + First Capital Intelligence Brief) was the headline finding of the 2026-05-13 run and was visible the moment a non-Apex Brief loaded. Inspect every "value at stake" / "open tensions" / "what we know" panel across tenants explicitly.
- **Sentinel's worst failure mode in 2026-05-13 was internal arithmetic inconsistency** (re-ranked $8.8M Adobe above $13.6M AWS as the "true rank"). Q24 (CFO-rewrite) was its best. Score arithmetic explicitly per §4.3.
- **The Originate flow drives correctly but wasn't measured for turn-count.** Specifically time the path from cold start to P1 promotion across 3 archetypes per tenant — this was a documented gap last time.

---

## 9. What this audit does NOT do

- It does not write or modify any code. All findings are observations + suggested fixes.
- It does not mutate the production database, send emails, or take any irreversible action on the user's behalf.
- It does not skip the safety rules around financial data, account creation, password handling, or sharing permissions.
- It does not promise full coverage in one session — a comprehensive run is 6–10 hours of agent work even with parallel fan-out. Report what you covered and what you didn't.

---

## 10. Start

When you're ready:

1. Confirm Chrome MCP is connected (`mcp__Claude_in_Chrome__list_connected_browsers`); if not, ask the user to connect it.
2. Verify the canonical-auth-roster file matches §1's table; if it has changed, update §1 in your scratchpad.
3. Spawn the Wave-2 + Wave-3 parallel agents in one message.
4. While they run, read the codebase context yourself and prepare the synthesis structure.
5. Collect, synthesize, write the report per §7, update memory.
6. Return the report path to the user.

End with one or two sentences: what's demo-ready, what's the top blocker, where the report is.
