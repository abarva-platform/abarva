# AbarVa Visual + Workflow Walkthrough Checklist

Status: Wave-17 / DEMO5
Authored: 2026-04-26
Audience: Founder / design reviewer

This checklist gives a founder a single document to walk every key route, judge whether AbarVa **visual canon** and **workflow content canon** are honored, and capture pass / fail / deferred decisions per route.

It is the companion artefact to:

- `DES1` AbarVa Visual Canon
- `DES7` Shell Nav Canon (Wave-17)
- `DES8` Admin Shell Canon (Wave-17)
- `ARCH3` / `ARCH5` Architecture Canvas
- `PROD8` Production Readiness Decision Flow (Wave-17)
- `SRC31` Source Commercial Workflow Canvas (Wave-17)

If a check fails, do **not** mask the failure — file a follow-up slice.

---

## How to use this checklist

1. Open AbarVa locally on the canonical demo tenant (Apex Retail) or on staging.
2. For each route below, walk through the **Visual checks** then the **Workflow checks**.
3. Mark each line **PASS / FAIL / DEFERRED** in the route's status row.
4. Capture a screenshot at the noted moment and save it under `docs/demo/screenshots/wave17/<route>.png`.
5. Capture founder notes in the **Notes** line.
6. If any FAIL is found, file a follow-up slice — do **not** mask it.
7. Sign off the **Founder sign-off** section at the end.

---

## Approved AbarVa visual canon (summary)

These tokens are LOCKED. No teal. No neon. No Sanskrit. No sparkle decorations. No AI-brain illustrations.

- **Wordmark**: `Abar` near-black `#0A0C12` + `Va` navy `#1B2B5C`, **no gap** between the two halves. Always set in DM Sans, normal weight.
- **Surface**: warm off-white `#FBFAF7`. Page backgrounds, nav, default cards.
- **Card**: pure white `#FFFFFF`. Used for elevated content and tables.
- **Accent**: navy `#1B2B5C` only. Active states, selected tabs, primary CTAs, agent badges.
- **Selective dark navy panels**: reserved for high-impact executive briefs (architecture hero, executive summary). Never full-page dark.
- **Typography**: DM Sans for all UI. No Georgia in the product surface (Georgia is reserved for marketing only).
- **Density**: calm hierarchy. Generous whitespace. Snowflake-style restraint, not Datadog density.
- **Banned**: teal, cyan, neon green, sparkle emoji, AI-brain icons, Mermaid diagrams, full-page dark themes, Sanskrit decorations, gradient hero backgrounds.

---

## Workflow content contract (summary)

Every product page must be able to answer the following nine questions, either directly on screen or via a one-hover affordance:

1. **Where am I?** — surface name + breadcrumb.
2. **What surface is this?** — Programs / Source / Intelligence / Tower / Admin.
3. **Which agent is anchoring?** — Nexus / Sentinel / Atlas / Steward as a visible badge.
4. **What does AbarVa know?** — what evidence has been ingested or seeded.
5. **What is missing?** — what evidence / input is required before the next promotion.
6. **What should happen next?** — the immediate next action.
7. **Evidence / source basis** — where the page's data comes from.
8. **Deterministic vs live status** — is this a manifest-backed seed or a live read?
9. **What must NOT be claimed** — explicit caveats (no live vendor data, no fake savings, no production_ready promotion without verification).

A page that cannot answer all nine is **incomplete** and must be filed as a follow-up slice.

---

## Routes to walk

### Route 1 — App shell / nav (DES7)

- **Where**: visible on every product page (top of viewport).
- **Visual checks**:
  - [ ] AbarVa wordmark visible: `Abar` near-black + `Va` navy, **no gap**.
  - [ ] Nav bar background is warm off-white `#FBFAF7` (not black, not teal, not gradient).
  - [ ] No teal / cyan / neon accents anywhere in the nav.
  - [ ] Active surface is highlighted with a navy underline or navy text — never teal.
  - [ ] Nav height is thin and elegant (≤56px).
  - [ ] Icons are minimal or absent in nav links.
  - [ ] Tenant / persona switcher is restrained, not loud.
- **Workflow checks**:
  - [ ] Current surface is obvious from the active state.
  - [ ] User can navigate to: **Programs**, **Source**, **Intelligence**, **Tower**, **Admin**.
  - [ ] The "Where am I?" question is answered by the active state alone.
  - [ ] Anchor agent for the active surface is surfaced (badge or hover tooltip).
- **Screenshot moment**: top of any page, full nav width.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 2 — `/home` (Home / Executive Entry)

- **Visual checks**:
  - [ ] Off-white page background.
  - [ ] Calm title hierarchy: eyebrow → headline → supporting line.
  - [ ] No large illustrations, no hero gradient, no animated background.
  - [ ] Dark navy text. No grey-on-grey body copy.
  - [ ] Restrained accent use — navy buttons, no rainbow chips.
- **Workflow checks**:
  - [ ] Page answers "Where am I in the program?".
  - [ ] Anchor agent visible — **Nexus** expected for the executive entry.
  - [ ] What's known / what's missing / next action are surfaced above the fold.
  - [ ] Deterministic caveat present (or appropriate live-status indicator).
  - [ ] Programs the executive owns / sponsors are visible without scrolling.
- **Must NOT appear**:
  - [ ] No teal accent.
  - [ ] No sparkle emoji.
  - [ ] No large network / AI-brain icons.
  - [ ] No "live" status claim if data is seed-backed.
- **Screenshot moment**: above the fold.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 3 — `/platform/admin` (Admin Setup, DES8)

- **Visual checks**:
  - [ ] Off-white admin background.
  - [ ] AdminCanonShell-style hierarchy: eyebrow (`ADMIN · STEWARD`) → title → description.
  - [ ] Workflow strip visible: anchor agent, primary question, next action.
  - [ ] Calm cards. No clutter, no toolbar dominance.
  - [ ] AbarVa wordmark + admin sub-nav visible at top.
- **Workflow checks**:
  - [ ] Page answers "Is the platform ready?".
  - [ ] Anchor agent: **Steward**.
  - [ ] Setup vs Production Readiness vs Architecture vs Build Progress vs Users & Access are all reachable from the admin sub-nav.
  - [ ] Next action is visible without scrolling.
  - [ ] Deterministic caveat present where seed-backed.
- **Must NOT appear**:
  - [ ] No old dark toolbar dominating the top.
  - [ ] No teal / cyber accents.
  - [ ] No fake "live monitoring" claim.
- **Screenshot moment**: page top + workflow strip.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 4 — `/platform/admin/architecture` (Architecture Canvas, ARCH5)

- **Visual checks**:
  - [ ] Off-white canvas behind the page.
  - [ ] **One** selective dark navy panel — the executive architecture brief — and **only** one.
  - [ ] CSS-only diagrams. No Mermaid renders.
  - [ ] Few high-signal cards, generous whitespace between them.
  - [ ] No neon, no teal, no cluttered dashboard feel.
  - [ ] Plane labels in DM Sans, navy on white.
- **Workflow checks**:
  - [ ] Executive architecture brief renders in the dark hero panel (one panel only).
  - [ ] **9 architecture planes** rendered: Identity, Tenancy, Context, Agent, Tool, Evidence, Audit, Data, Deployment.
  - [ ] **Request → Context → Agent → Output** flow is shown.
  - [ ] **Data → Evidence → Usability** flow is shown.
  - [ ] **SaaS Control Plane + Private Data Plane** model is shown side-by-side.
  - [ ] Azure target reference is shown (Container Apps, Postgres, Storage, Key Vault).
  - [ ] **Model Gateway + Tool Registry** boundary is shown.
  - [ ] **Agent Mission Runtime** is shown with stop-condition language.
  - [ ] **Built now vs Deferred** section is shown — no over-claiming.
  - [ ] Next architecture actions list is shown at the bottom.
- **Must NOT appear**:
  - [ ] No Mermaid diagrams (pure CSS only).
  - [ ] No full-page dark theme — only the executive brief panel is dark.
  - [ ] No fake "production-ready" badges on planes that are deferred.
- **Screenshot moment**: dark hero brief panel + 9-plane grid in one frame.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 5 — `/platform/admin/production-readiness` (Decision Flow, PROD8)

- **Visual checks**:
  - [ ] Off-white page background.
  - [ ] Decision-flow hierarchy: brief → demo? → pilot? → blockers → component table → evidence → caveat → next 5 actions.
  - [ ] No red/green overload. Status chips restrained.
  - [ ] No fake "live green" indicator. No animated pulses.
  - [ ] Component table is calm — striping subtle, navy headers.
- **Workflow checks**:
  - [ ] **"Can we demo?"** question + answer chip visible.
  - [ ] **"Can we pilot?"** question + answer chip visible.
  - [ ] **"What blocks production?"** list is enumerated.
  - [ ] Component readiness table renders the existing `production-readiness.json` tracker.
  - [ ] Evidence / testing basis is surfaced for each component.
  - [ ] Manifest-backed caveat visible (NOT live monitoring).
  - [ ] Next 5 actions are listed with owners.
- **Must NOT appear**:
  - [ ] No false `production_ready` promotions.
  - [ ] No fake CI / Vercel green light.
  - [ ] No GitHub polling claim if tokens are absent.
- **Screenshot moment**: top of decision flow + caveat block.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 6 — `/source/events/[eventId]` (Source Event Canvas + Commercial Hub)

- **Visual checks**:
  - [ ] Off-white event canvas background.
  - [ ] AbarVa shell nav at top with **Source** active.
  - [ ] Calm card hierarchy — event header, then sections.
  - [ ] Commercial intelligence section visible as a collapsible region.
  - [ ] When expanded: thin segmented stage nav (9 stages) renders in DM Sans, navy active highlight only.
- **Workflow checks**:
  - [ ] All workflow stages reachable: **brief, pricing, comparison, risk, BAFO, readiness, missions, signals, decision**.
  - [ ] Anchor agent visible — **Nexus** for source commercial.
  - [ ] Deterministic / seed-backed caveat visible.
  - [ ] Missing inputs before executive decision are surfaced (e.g. "no live vendor data ingested").
  - [ ] No fake savings claims anywhere on the page.
- **Must NOT appear**:
  - [ ] No teal / cyber dashboard.
  - [ ] No large icon grid for stage nav (segmented bar only).
  - [ ] No "live vendor data" claim.
- **Screenshot moment**: commercial intelligence section expanded with stage nav visible.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 7 — Source Commercial Hub stages (within event canvas, SRC31)

Same parent route as Route 6 — focus is on stage-by-stage walk.

- **Visual checks**:
  - [ ] Thin segmented stage nav (9 stages, navy active highlight, no icons).
  - [ ] Single active commercial canvas at a time — not a stacked dashboard.
  - [ ] Each stage occupies the same content frame (no layout shift).
- **Workflow checks**:
  - [ ] All 9 stages reachable: **brief / pricing / comparison / risk / BAFO / readiness / missions / signals / decision**.
  - [ ] Each stage description shows the workflow purpose at the top.
  - [ ] Each stage answers the 9-question contract or marks it explicitly deferred.
  - [ ] Caveat footer visible on every stage: "Deterministic seed · no live vendor data".
  - [ ] Missions stage shows priority + stop condition per mission card.
  - [ ] Decision stage shows what is required before executive sign-off.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 8 — Agents / Mission panels (sidebar or persistent panels)

- **Visual checks**:
  - [ ] Agent badges are subtle small chips — not avatars, not illustrations.
  - [ ] No large agent illustrations, no AI-brain decorations.
  - [ ] Agent badge typography: DM Sans, navy text on white chip.
  - [ ] Mission card border is hairline `#E6E2D9` or similar warm neutral.
- **Workflow checks**:
  - [ ] Each agent badge identifies the anchor: **Nexus / Sentinel / Atlas / Steward**.
  - [ ] Mission cards show priority and stop condition.
  - [ ] Cross-agent handoffs are explicit when present.
- **Must NOT appear**:
  - [ ] No "AI sparkle" decorations.
  - [ ] No animated pulse on agent badges.
  - [ ] No agent claim that overstates autonomy ("autonomous" → state the human gate).
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 9 — Production readiness caveats audit (cross-page sweep)

This is a cross-page audit, not a single route. Walk every page visited above and confirm the caveat posture.

- **Visual checks**:
  - [ ] Every page that uses deterministic seed data shows the deterministic caveat in a neutral footer-ish position.
  - [ ] Caveat text is small, navy, restrained — not a banner.
- **Workflow checks**:
  - [ ] No page falsely promotes "live" status.
  - [ ] Manifest-backed pages explicitly say so (e.g. "Source · `production-readiness.json`").
  - [ ] Pages that depend on absent tokens (GitHub, Vercel) show a "tokens not configured" line, not a fake green chip.
  - [ ] No page claims `production_ready` for any component.
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

### Route 10 — Azure / Private Data Plane story (within architecture)

- **Visual checks**:
  - [ ] Architecture page surfaces the Azure reference clearly — not buried.
  - [ ] Private data plane card is visually distinct from the SaaS control plane card.
  - [ ] Both cards use white card surface with navy plane labels — no teal.
- **Workflow checks**:
  - [ ] Boundary statement is explained: control plane in SaaS, data plane in customer VNet.
  - [ ] Target Azure services listed: **Container Apps, Postgres Flexible Server, Storage (Blob), Key Vault**, plus optional Private Link.
  - [ ] Deferred items clearly marked (e.g. "no live Azure deploy yet — see CLOUD2/CLOUD5 lab").
  - [ ] Dependency replacement matrix referenced (CLOUD6).
  - [ ] Data plane adapter contract referenced (TEN4).
- **PASS / FAIL / DEFERRED**:
- **Notes**:

---

## Visual + workflow coherence (cross-cutting)

These checks span the whole walk. Mark them after Routes 1–10 are complete.

- [ ] Every visited page is on warm off-white `#FBFAF7`.
- [ ] Wordmark is consistent across all pages (no teal `Va`, no SVG with stale colors).
- [ ] Navy is the only accent. No teal, no neon, no Sanskrit.
- [ ] No banned symbols anywhere (sparkle emoji, AI-brain icon, Mermaid diagram, gradient hero).
- [ ] Every page has a visible anchor agent.
- [ ] Every page surfaces "what is missing" or "what is next".
- [ ] Every page that uses seed data has a deterministic caveat.
- [ ] Wave-15 / Wave-16 / Wave-17 components are **not** visually distinguishable in feel — they read as one product.
- [ ] No page claims `production_ready` for any component without a verified evidence row in `production-readiness.json`.
- [ ] DM Sans is used consistently. No accidental Georgia in product surfaces.

---

## Founder sign-off

- **Reviewer name**:
- **Date**:
- **Tenant walked**: Apex Retail / Meridian / other:
- **Browser + viewport**:
- **Overall**: PASS / FAIL / DEFERRED
- **Headline founder note**:
- **Follow-up slices to file**:
  1.
  2.
  3.

---

## Caveat

This checklist is a **founder review aid**. It does NOT replace:

- The deterministic Jest smoke runbooks (`SOURCE_COMMERCIAL_ROUTE_SMOKE_RUNBOOK.md`, `AGENTIC_SPINE_VERIFICATION_RUNBOOK.md`).
- The CI / Vercel deployment verification runbook (`ENTERPRISE_DEPLOYMENT_VERIFICATION_RUNBOOK.md`).
- The production readiness component map (`PRODUCTION_READINESS_COMPONENT_MAP.md`).

A PASS on this checklist means **the founder's eye approves the visual + workflow story**. It does NOT promote any component to `production_ready`. Production readiness promotion still requires the verified evidence rows in `production-readiness.json`.
