# Admin Completion Audit (ADMIN9)

**Generated:** 2026-04-27
**Author:** ADMIN9 autonomous audit
**Status:** complete (audit IS the deliverable)
**Wave registered:** `wave-admin-completion` (planned, ADMIN10–ADMIN19)

---

## Executive summary

After ADMIN1–8 and AGENT1, the admin tree has a single canonical path at `/admin/*` with eight pages (Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness, Build Progress, Architecture), a Clerk auth-gated layout, the locked AbarVa visual canon (Cormorant Garamond + #070707/#0b4a91/#FBFAF7 + soft mint/amber/coral pills), and AGENT1's deterministic context-bundle / posture / editorial / choices pipeline wired through every page-view. The Steward editorial card and 5-cell context bar render on every page; the agent rail surfaces honest posture; the live caveat is permanent. The visual lock is guarded by ADMIN7 regression tests + the shell-level hex audit script. WIRE2B compliance scores: Admin 92, Production Readiness 92, Architecture 90.

What remains is depth, not chrome. Each canonical page renders the editorial card and (for some) one canonical canvas widget — Architecture has the 7-plane stack, Production Readiness has the Demo/Pilot/Production tiles + blockers table, Data Trust has the 5-rung ladder, Connectors has the W32D table, Users & Access has the invite form. But most pages stop there: no drill-downs, no per-row drawers, no sub-tabs, no per-page action strips beyond the Steward primary action. The legacy `/platform/admin/*` tree still hosts 16 live sub-routes that were preserved out of ADMIN8 scope; some duplicate canonical pages, some host real engagement-ops views (approvals, audit, brief, context, data-governance, outcomes, quality, revenue, playbook, new-client) that have no canonical home, and a few are stubs or redirects.

The recommended path forward is `wave-admin-completion` — ADMIN10 first to finish the legacy consolidation (redirect/deprecate/keep-migrate dispositions for the 16 live legacy sub-routes), then ADMIN11–17 in parallel to add per-page depth (sub-tabs, drill-down drawers, action strips, per-row detail) to each of the seven content-bearing canonical pages, then ADMIN18 to pull-through the Overview with a setup timeline + recent-activity strip, then ADMIN19 to extend the visual lock test suite to cover all the new canvas widgets. Estimated wall-clock: 5–6 hours with multi-agent parallelization. Live model calls, real Clerk invite execution, real connector adapters, real dataset approval writes, and real audit event store all remain HARD-GATED and defer to Wave 27+ (model gateway).

---

## 1. Legacy route audit (`/platform/admin/*`)

### Route inventory

`find src/app/(maestro)/platform/admin -name page.tsx` returned **19 sub-routes** plus the root (`/platform/admin/page.tsx`). Of those, 3 are already 308 redirects shipped in ADMIN8 (`/platform/admin`, `/platform/admin/architecture`, `/platform/admin/production-readiness`) and 1 is a soft client-side redirect to `/intelligence` (`/platform/admin/intelligence`). That leaves **16 live legacy sub-routes** still hosting full UIs.

### Disposition summary

| Count | Disposition | Meaning |
|---|---|---|
| 4 | KEEP — migrate to canonical /admin tree | Unique functionality not covered by canonical pages; deserves a new `/admin/<x>` route |
| 5 | MERGE — fold into existing /admin page | Overlaps a canonical page; consolidate as a tab or drill-down |
| 4 | REDIRECT — already covered, redirect to canonical equivalent | Duplicate of canonical page; replace file with `redirect('/admin/...')` |
| 3 | DEPRECATE — delete (no upstream consumers) | Legacy / playbook content with no canonical home; safe to retire |

### Detail table

| # | Route | Purpose (1–2 sentences) | Auth | Reachability | Disposition | New path / target |
|---|---|---|---|---|---|---|
| 1 | `/platform/admin/approvals` | Approval workflows: pending output reviews, data requests, access requests; Approve/Approve-with-conditions/Reject buttons. | none (client component, no Clerk gate) | linked from legacy sub-nav | KEEP | new `/admin/approvals` (or `/admin/data-trust?tab=approvals` once ADMIN14 ships) |
| 2 | `/platform/admin/architecture` | 308 redirect to `/admin/architecture` (ADMIN8). | n/a | n/a | (already retired) | already redirect |
| 3 | `/platform/admin/audit` | Server-rendered audit log: merges three JSON ledgers (approvals, phase-gates, tasks), shows last 50 events sorted newest-first. Admin-only via Clerk publicMetadata.role. | Clerk admin role gate | linked from legacy sub-nav | KEEP | new `/admin/audit` (Wave 27 promotes to real audit store) |
| 4 | `/platform/admin/brief` | Static pre-meeting Q&A panel for Meridian (CIO/CFO/COO talking-points). Engagement-ops content, not platform admin. | none | linked from legacy sub-nav | DEPRECATE | delete; if engagement-ops surface is needed, lives under Programs |
| 5 | `/platform/admin/build-progress` | Founder build-control-tower with full BuildProgressDashboard + AdminCanonShell (v1, NOT v2). Reads `buildProgressRoadmap` from `src/lib/build-progress/roadmap`. | Clerk admin email allowlist (inline) | NOT linked from canonical /admin nav (orphan) | MERGE | merge into `/admin/build-progress` (canonical), promote BuildProgressDashboard component into ADMIN15 |
| 6 | `/platform/admin/connectors` | Composite connector health panel (6 connectors, last-sync minutes-ago, health states). Server component, demo data. | Clerk admin role gate | linked from legacy sub-nav | MERGE | fold connector list into `/admin/connectors` page; rich detail drawer in ADMIN13 |
| 7 | `/platform/admin/context` | Stakeholder profile cards (CIO/CFO/COO/CMIO) with quotes — engagement-ops content. | none | linked from legacy sub-nav | DEPRECATE | delete; engagement-ops content not in admin scope |
| 8 | `/platform/admin/data` | "Data Loader" — file upload UI with status pills (approved/missing/processing) by segment (Business / IT / Third-party). Engagement-ops, but overlaps Data Trust. | none | linked from legacy sub-nav | MERGE | merge into `/admin/data-trust` (ADMIN14) — file list as a "Loaded" rung sub-tab |
| 9 | `/platform/admin/data-governance` | Promotion-request workflow: pending/approved/rejected layers, audit entries, team access. Substantial functionality (518 lines). | none | linked from legacy sub-nav | MERGE | merge into `/admin/data-trust` (ADMIN14) — promotion approval as a tab |
| 10 | `/platform/admin/data-guide` | Walkthrough doc explaining data confidence steps (5 → 12 files → interviews) and CIO interview questions. Onboarding doc. | none | linked from legacy sub-nav | DEPRECATE | delete; content moves to `/docs/admin-onboarding.md` if needed (NOT this wave) |
| 11 | `/platform/admin/experience-gallery` | Internal visual-canon reference gallery (ExperienceGallery component). | Clerk admin email allowlist | not linked from canonical nav | KEEP | new `/admin/experience-gallery` route under canonical shell (low priority) |
| 12 | `/platform/admin/intelligence` | Client-side `window.location.replace('/intelligence?client=...')`. | none | linked from legacy sub-nav | REDIRECT | replace with `redirect('/intelligence')` (server-side); no new admin path |
| 13 | `/platform/admin/new-client` | 5-step new-client wizard (Org Identity / Data Loading / Team / Engagement Scope / Launch). Engagement-ops, onboarding flow. | none | linked from legacy sub-nav | KEEP | new `/admin/new-client` route under canonical shell (Tier-3 priority — out of ADMIN10 scope, deferred to wave-admin-completion+1) |
| 14 | `/platform/admin/outcomes` | Outcome tracker — traffic-light KPIs by client/initiative with attribution. | none | linked from legacy sub-nav | DEPRECATE | delete; outcome tracking belongs in Programs / Tower, not admin |
| 15 | `/platform/admin/page.tsx` (root) | 308 redirect to `/admin` (ADMIN8). | n/a | n/a | (already retired) | already redirect |
| 16 | `/platform/admin/playbook` | Demo-playbook content (CXO-first-look, 3-min walkthrough, etc.). Engagement-ops content. | none | linked from legacy sub-nav | DEPRECATE | delete |
| 17 | `/platform/admin/production-readiness` | 308 redirect to `/admin/production-readiness` (ADMIN8). | n/a | n/a | (already retired) | already redirect |
| 18 | `/platform/admin/quality` | Quality Ops — confidence scoring across 4 tenants × 4 pillars; large (974 lines). Engagement-ops + data-quality hybrid. | none | linked from legacy sub-nav | MERGE | merge into `/admin/data-trust` (ADMIN14) — quality scorecard as a tab |
| 19 | `/platform/admin/revenue` | Revenue stream tracker: enterprise license, services, marketplace. Engagement-ops. | none | linked from legacy sub-nav | DEPRECATE | delete; revenue tracking not in admin scope |
| 20 | `/platform/admin/users` | User provisioning: lists active Clerk users + pending invitations + InviteUserForm. Real Clerk integration. | Clerk admin role gate | linked from legacy sub-nav | REDIRECT | replace with `redirect('/admin/users-access')` once ADMIN11 lifts InviteUserForm into canonical |

### Disposition counts

- **KEEP** = 4: approvals, audit, experience-gallery, new-client
- **MERGE** = 5: build-progress (orphan), connectors, data, data-governance, quality
- **REDIRECT** = 4: architecture (already), production-readiness (already), intelligence, users (after ADMIN11), root (already) — net **2 NEW redirects to ship in ADMIN10** (intelligence + users)
- **DEPRECATE** = 3: brief, context, data-guide, outcomes, playbook, revenue — wait, that's 6. Recount.

Recounting cleanly (excluding the 3 ADMIN8-retired routes):

| Disposition | Count | Routes |
|---|---|---|
| KEEP — migrate to canonical | 4 | approvals, audit, experience-gallery, new-client |
| MERGE — fold into canonical page | 5 | build-progress, connectors, data, data-governance, quality |
| REDIRECT — replace with redirect() | 2 | intelligence (→ `/intelligence`), users (→ `/admin/users-access`) |
| DEPRECATE — delete | 5 | brief, context, data-guide, outcomes, playbook, revenue (6 — see note) |

> **Note on count drift:** 16 live legacy sub-routes total. KEEP 4 + MERGE 5 + REDIRECT 2 = 11. DEPRECATE = 16 − 11 = **5** routes. The DEPRECATE list is: brief, context, data-guide, outcomes, playbook, revenue. That's six names but the route inventory above shows them as routes 4, 7, 10, 14, 16, 19. **DEPRECATE = 6**, total = 17. Re-checking the "16 live" count: routes 2, 15, 17 are already-redirects = 3 retired. Routes total = 20 entries (19 sub-route page.tsx + the root). 20 − 3 retired − 1 (intelligence already a soft client-redirect, treated as REDIRECT) = 16 live. KEEP 4 + MERGE 5 + REDIRECT 2 + DEPRECATE 6 = 17. The "intelligence" route counts in REDIRECT because we promote it from client-side `window.location.replace` to server-side `redirect()`. Final accurate counts:

| Disposition | Count | Routes |
|---|---|---|
| KEEP — migrate to canonical | 4 | approvals, audit, experience-gallery, new-client |
| MERGE — fold into canonical page | 5 | build-progress, connectors, data, data-governance, quality |
| REDIRECT — replace with redirect() | 2 | intelligence (→ `/intelligence`), users (→ `/admin/users-access`) |
| DEPRECATE — delete | 6 | brief, context, data-guide, outcomes, playbook, revenue |
| (already retired, ADMIN8) | 3 | root, architecture, production-readiness |
| **Total** | **17 actionable + 3 already-retired = 20** |  |

### Per-route findings

**`/platform/admin/approvals`** — 63-line client component listing 3 pending items (output review, data request, access request) and 3 completed items, with Approve/Reject buttons that have no onClick handler. KEEP — real workflow content with no canonical home; new `/admin/approvals` page once ADMIN14's data-trust drill-downs land, or as a sibling page.

**`/platform/admin/audit`** — 295-line server component reading three JSON ledgers from `/api/tasks`, `/api/programs/approve`, `/api/programs/phase-gate`. Has real Clerk admin role guard. KEEP — there's no canonical `/admin/audit` and audit log is core to admin work. Migrate to canonical shell + AGENT1 read-model.

**`/platform/admin/brief`** — 354-line dark-themed Q&A panel; engagement-ops content (Meridian CIO/CFO/COO talking-points). DEPRECATE — not platform admin.

**`/platform/admin/build-progress`** — 71-line server component (rendered code shows full dashboard via `BuildProgressDashboard` component). Uses `AdminCanonShell` (V1). MERGE — content belongs in canonical `/admin/build-progress`; ADMIN15 lifts BuildProgressDashboard into canonical shell.

**`/platform/admin/connectors`** — 262-line server component listing 6 hardcoded connectors (Clerk, Supabase, Vercel, Pinecone, Anthropic, Azure OpenAI) with composite minutes-ago timestamps. MERGE — overlaps `/admin/connectors` (which is canonical-shell-wrapped W32D); fold the richer detail (vendor, docsHref, error detail) into ADMIN13's drawer.

**`/platform/admin/context`** — 255-line stakeholder profile cards. DEPRECATE — engagement-ops content.

**`/platform/admin/data`** — 452-line file-upload listing UI. MERGE into Data Trust as a "Loaded files" tab (ADMIN14).

**`/platform/admin/data-governance`** — 518-line promotion-request workflow with audit entries + team access. MERGE into Data Trust as a "Promotion / governance" tab (ADMIN14). Substantial — preserve the data model.

**`/platform/admin/data-guide`** — 409-line walkthrough doc / interview question list. DEPRECATE — onboarding doc, move text to `/docs/` if needed (NOT this wave).

**`/platform/admin/experience-gallery`** — 70-line server component, Clerk-allowlist gated, renders `<ExperienceGallery />`. KEEP — internal design reference; migrate to canonical at `/admin/experience-gallery` (low priority).

**`/platform/admin/intelligence`** — 20-line client-side soft redirect to `/intelligence?client=...`. REDIRECT — promote to server-side `redirect()`.

**`/platform/admin/new-client`** — 246-line 5-step wizard. KEEP — substantial onboarding flow, but no canonical home; deferred to a follow-up wave (after wave-admin-completion). For now ADMIN10 leaves the route live with a "legacy — being migrated" banner.

**`/platform/admin/outcomes`** — 325-line outcome tracker. DEPRECATE — outcomes belong in Programs / Tower.

**`/platform/admin/playbook`** — 264-line demo playbook content. DEPRECATE.

**`/platform/admin/quality`** — 974-line quality scorecard (4 tenants × 4 pillars). MERGE into Data Trust as a "Quality" tab (ADMIN14). Largest legacy file; preserve the confidence calculation in `lib/confidence`.

**`/platform/admin/revenue`** — 324-line revenue tracker. DEPRECATE — not platform admin.

**`/platform/admin/users`** — 158-line server component with real Clerk integration: lists active users, pending invitations, InviteUserForm. REDIRECT after ADMIN11 lifts InviteUserForm + the listing into canonical `/admin/users-access`.

---

## 2. Per-page depth audit (`/admin/*`)

For each of the 8 canonical pages: current canvas → blueprint → sub-nav → drill-downs → action strip → interactives → AGENT1 integration.

### 2.1 — `/admin` (Overview)

**Current canvas:** Steward editorial card (AGENT1 generated) + a thin setup-items list (6 items, status pills). No drill-down.

**Canonical canvas blueprint:**
- ContextBar (5 cells) — already today
- StewardEditorial card with eyebrow / title / body / context-used chips / evidence pill / blocker pill / primary action — already today (AGENT1)
- **NEW: Setup progress timeline** — six setup items as a vertical timeline with state per item (`done` / `in_progress` / `pending` / `blocked`) and a per-item next-action chip
- **NEW: Recent activity strip** — last 5 admin actions taken (deterministic seed: invitations sent, approvals signed, blockers resolved)
- **NEW: Cross-page CTAs** — links to highest-priority setup destinations based on AGENT1 posture (e.g. "Production Readiness → 3 blockers" if Steward posture is BLOCKED)
- Live caveat pill — already today

**Sub-navigation:** None — Overview is single-pane.

**Drill-down behavior:** Clicking a setup-item row expands in place to show the underlying requirement (what needs to happen, who owns it, links into the relevant canonical sub-page).

**Action strip:** Primary "Open Production Readiness" + secondary "Review next setup item" + tertiary "Skip to Architecture".

**Interactive elements:** Setup-item expand-collapse (deterministic, SAFE).

**Agent integration:** AGENT1 wired today. The setup timeline reads from a new `OverviewSetupTimeline` view-model that computes state from `ctx.blockers` + `ctx.evidenceStrength` + `ctx.pendingDecisions`. Recent-activity strip reads from a deterministic seed — NOT from real audit log (HARD-GATED).

---

### 2.2 — `/admin/data-trust`

**Current canvas:** Steward editorial + 5-rung trust ladder with counts (Loaded / Available / Usable / Agent-usable / Decision-grade).

**Canonical canvas blueprint:**
- Existing 5-rung ladder
- **NEW: Per-rung dataset list** — clicking a rung expands to show the deterministic dataset list at that trust level (provenance, last-updated date, evidence-usable flag, approval owner)
- **NEW: Dataset detail drawer** — slide-in right drawer with metadata, provenance trail, approval status, "Approve dataset" button (HARD-GATED stub)
- **NEW: Trust progression visualization** — small line-chart showing datasets moving up rungs over the past 30 days (deterministic seed)
- **NEW: Promotion-request panel** — promoted from `/platform/admin/data-governance` (pending / approved / rejected promotion requests)
- **NEW: Quality tab** — promoted from `/platform/admin/quality` (confidence scorecard 4 tenants × 4 pillars)
- **NEW: Loaded files tab** — promoted from `/platform/admin/data`

**Sub-navigation:** Tabs across the canvas — `Trust Ladder` (default) / `Loaded Files` / `Promotion Queue` / `Quality Scorecard` / `Audit Trail`.

**Drill-down behavior:** Rung click → expand-in-place dataset list. Dataset row click → right-side drawer.

**Action strip:** "Approve dataset" (HARD-GATED stub) + "Open evidence ledger" (SAFE link to evidence vault).

**Interactive elements:** Tab switch (SAFE), rung expand (SAFE), dataset drawer open/close (SAFE), drawer Approve button (STUB).

**Agent integration:** Sentinel posture reflects evidence strength state. AGENT1 editorial body explains what's blocking dataset promotion.

---

### 2.3 — `/admin/connectors`

**Current canvas:** Steward editorial + W32D connector health table (6 connectors).

**Canonical canvas blueprint:**
- W32D table — keep
- **NEW: Per-connector detail drawer** — right slide-in showing: vendor, last-sync timestamp + duration, error log (last 10), config keys (read-only with masked values), docs link, "Test connection" button (HARD-GATED stub)
- **NEW: Connector requirements panel** — pulls from W32D readiness model: which connectors are required for which canonical workflow (Source ingest / Programs / Intelligence)
- **NEW: Health-trend strip** — small sparkline per connector showing 24-hour health state (deterministic seed)

**Sub-navigation:** Tabs — `Health` (default) / `Requirements` / `Configuration` / `Logs`.

**Drill-down behavior:** Connector row click → drawer.

**Action strip:** "Test all connections" (STUB) + "Configure new connector" (STUB) + "Open requirements matrix" (SAFE).

**Interactive elements:** Tab switch (SAFE), drawer open/close (SAFE), Test connection (STUB), Configure (STUB).

**Agent integration:** AGENT1 Steward posture surfaces stale or errored connectors as blockers; connector-requirements panel feeds AGENT1's `whatIsKnown` / `whatIsMissing` reasoning.

---

### 2.4 — `/admin/users-access`

**Current canvas:** Steward editorial + Clerk-allowlist note. Today the canonical page does NOT host a user list (that lives at legacy `/platform/admin/users`).

**Canonical canvas blueprint:**
- **NEW: Active users table** — promoted from `/platform/admin/users`. Columns: name, email, role (admin / maestro / client / investor), tenant, last sign-in, status. 50-row paginated.
- **NEW: Pending invitations table** — promoted from `/platform/admin/users`. Columns: email, invited role, invited by, sent at, status.
- **NEW: User detail drawer** — right slide-in showing: full Clerk publicMetadata, audit log (last 10 sign-ins, role changes), "Suspend user" / "Change role" buttons (HARD-GATED stubs).
- **NEW: Invite user form** — promoted from `InviteUserForm` (legacy). Triggers `/api/admin/invite` (real Clerk flow). HARD-GATED in the sense that the form button writes to Clerk; for ADMIN11 we ship the form rendered + disabled, with a "Pilot environment only" notice.

**Sub-navigation:** Tabs — `Active Users` (default) / `Pending Invites` / `Roles & Permissions` / `Audit`.

**Drill-down behavior:** User row click → drawer with Clerk metadata + audit.

**Action strip:** "Invite user" (HARD-GATED — ships disabled stub in ADMIN11) + "Bulk import" (HARD-GATED stub) + "Export CSV" (SAFE).

**Interactive elements:** Tab switch (SAFE), drawer (SAFE), Invite (HARD-GATED), Suspend (HARD-GATED), Change role (HARD-GATED).

**Agent integration:** AGENT1 surfaces pending invitations + missing role assignments as Steward blockers.

---

### 2.5 — `/admin/agent-readiness`

**Current canvas:** Steward editorial + brief agent-list summary.

**Canonical canvas blueprint:**
- **NEW: Per-agent expandable card** — Steward / Nexus / Sentinel / Atlas, each with: posture (READY / PARTIAL / BLOCKED) from AGENT1, context coverage % (what fraction of expected context bundle keys are populated for the current page), evidence-strength heatmap, recent reasoning trace (last 5 editorial outputs).
- **NEW: Agent capability matrix** — rows = agents, columns = surfaces (Programs / Source / Intelligence / Tower / Admin), cells = "wired" / "partial" / "not wired" + last-rendered timestamp.
- **NEW: Reasoning trace drawer** — open per-agent to see the deterministic editorial template that fired for the most recent page-view.

**Sub-navigation:** Tabs — `Postures` (default) / `Capability Matrix` / `Reasoning Traces`.

**Drill-down behavior:** Agent card click → expand-in-place; trace row click → drawer.

**Action strip:** "Open AGENT1 spec" (SAFE link to docs) + "Run readiness check" (STUB — would invoke a deterministic context-bundle integrity test).

**Interactive elements:** Card expand (SAFE), tab switch (SAFE), drawer (SAFE), Run check (STUB).

**Agent integration:** This page IS the AGENT1 inspection surface — every block on it reads from AGENT1's pure read-model output.

---

### 2.6 — `/admin/production-readiness`

**Current canvas:** Steward editorial + Demo READY / Pilot PARTIAL / Production BLOCKED tiles + W32F top-blockers table.

**Canonical canvas blueprint:**
- Existing tiles + blockers table — keep
- **NEW: Per-tile expandable detail** — clicking a tile expands to show the underlying readiness criteria (which features are READY / PARTIAL / BLOCKED for that environment, with green/amber/red counts).
- **NEW: Per-blocker drawer** — clicking a blocker row opens drawer with: full description, owner, downstream impact (what shipping is blocked), remediation plan, "Mark resolved" button (HARD-GATED — needs blocker-store write).
- **NEW: Promotion-decision panel** — shows the gate criteria for promoting Demo → Pilot → Production; AGENT1 Steward editorial explains current gate state honestly (no `production_ready: true` promotion).

**Sub-navigation:** Tabs — `Readiness Tiles` (default) / `Blockers` / `Promotion Gate` / `History`.

**Drill-down behavior:** Tile click → expand-in-place; blocker row → drawer.

**Action strip:** "Mark blocker resolved" (HARD-GATED stub) + "View promotion gate criteria" (SAFE) + "Open run book" (SAFE link).

**Interactive elements:** Tile expand (SAFE), tab switch (SAFE), blocker drawer (SAFE), Mark resolved (HARD-GATED).

**Agent integration:** Steward posture is BLOCKED whenever any blocker is open; blocker count + severity feed into editorial body.

---

### 2.7 — `/admin/build-progress`

**Current canvas:** Steward editorial + brief wave summary.

**Canonical canvas blueprint:**
- **NEW: Wave timeline** — vertical timeline of all waves (wave-0 through wave-30 + planned waves), each with status (merged / in_progress / planned / blocked), percent-complete bar, slice-count badge.
- **NEW: Slice drill-down** — clicking a wave expands to show its slices (id, title, status, mergeSHA if merged, blockers if blocked).
- **NEW: CI mini-strip** — 5 most-recent CI runs with status (deterministic seed; NOT live Vercel API).
- **NEW: Backlog preview** — next 3 planned waves with their slice IDs and predicted execution order.

**Sub-navigation:** Tabs — `Waves` (default) / `Slices` / `CI` / `Backlog`.

**Drill-down behavior:** Wave row click → expand-in-place; slice row click → drawer with full slice metadata + linked PR.

**Action strip:** "Open WAVE_ROADMAP" (SAFE link) + "View build manifest" (SAFE).

**Interactive elements:** Tab switch (SAFE), wave expand (SAFE), slice drawer (SAFE).

**Agent integration:** AGENT1 Atlas posture (executive overview) reads wave-completion state and surfaces it; Steward posture surfaces planned/blocked waves.

---

### 2.8 — `/admin/architecture`

**Current canvas:** Steward editorial + 7-row plane stack (App / Agent / Context / Evidence / Data / Gateway+Tools / Deployment) + agent rail with Steward BLOCKED.

**Canonical canvas blueprint:**
- Existing plane stack — keep
- **NEW: Per-plane drilldown** — clicking a plane row expands to show the components that comprise it (e.g. App plane → AbarvaShell, AbarvaTopNav, MaestroChrome). Each component is a row with status (canonical / partial / not wired).
- **NEW: Component drawer** — clicking a component opens drawer with: file path, last-modified date, owning slice, dependency graph (which other components depend on it / it depends on), linked tests.
- **NEW: Plane health summary strip** — top of page, shows plane-by-plane status counts (canonical / partial / not wired) at a glance.

**Sub-navigation:** Tabs — `Planes` (default) / `Components` / `Dependencies`.

**Drill-down behavior:** Plane click → expand-in-place; component click → drawer.

**Action strip:** "Open architecture docs" (SAFE link to `docs/architecture/`) + "Run plane integrity check" (STUB).

**Interactive elements:** Tab switch (SAFE), plane expand (SAFE), component drawer (SAFE), integrity check (STUB).

**Agent integration:** Steward posture is BLOCKED today (per AGENT1 wiring). Per-plane state feeds AGENT1's `whatIsKnown`.

---

## 3. Interaction-safety audit

Classification rule:
- **SAFE** = deterministic, read-only, no live data needed; ship in `wave-admin-completion`.
- **STUB** = render the affordance with `disabled` state + reason copy; click does nothing or opens a "deferred to runtime wave" notice. Affordance visible.
- **HARD-GATED** = needs real backend (Clerk write, database write, audit-store, live agent runtime); defer to Wave 27+ (model gateway / agent runtime).

### Summary counts

| Class | Count | Examples |
|---|---|---|
| SAFE — ship in wave-admin-completion | 28 | Tab switches, row expands, drawers, deterministic filters, sparkline charts, link-out buttons |
| STUB — render disabled with reason | 9 | Test connection, Configure connector, Run readiness check, Run integrity check, Mark resolved (interim), Bulk import |
| HARD-GATED — Wave 27+ | 8 | Invite user (Clerk write), Suspend user, Change role, Approve dataset, Mark blocker resolved (real), Audit-event write, Live model call, Real connector adapter |

### Detail table

| Page | Interaction | Class | Reason |
|---|---|---|---|
| Overview | Setup-item expand-collapse | SAFE | Deterministic seed timeline |
| Overview | Recent-activity row click → drawer | SAFE | Deterministic seed |
| Overview | Cross-page CTA links | SAFE | Plain anchor navigation |
| Data Trust | Tab switch (Trust Ladder / Files / Promotion / Quality / Audit) | SAFE | Pure UI state |
| Data Trust | Rung expand → dataset list | SAFE | Deterministic seed |
| Data Trust | Dataset row click → drawer | SAFE | Deterministic seed |
| Data Trust | Approve dataset button (in drawer) | HARD-GATED | Needs real approval write to evidence ledger |
| Data Trust | Open evidence ledger link | SAFE | Anchor navigation |
| Data Trust | Promotion request approve/reject (in promotion tab) | HARD-GATED | Needs promotion-store write |
| Connectors | Tab switch | SAFE | Pure UI state |
| Connectors | Connector row click → drawer | SAFE | Deterministic seed |
| Connectors | Test connection button | HARD-GATED | Needs real connector adapter (Clerk/Supabase/Vercel/Pinecone/Anthropic/Azure SDKs) |
| Connectors | Configure connector button | HARD-GATED | Needs config write + secret management |
| Connectors | Health-trend sparkline | SAFE | Deterministic seed |
| Connectors | Show connector requirements (matrix) | SAFE | Pull from W32D static read-model |
| Users & Access | Tab switch | SAFE | Pure UI state |
| Users & Access | User row click → drawer | SAFE | Deterministic seed for non-prod; live Clerk read in pilot only |
| Users & Access | Invite user button | HARD-GATED | Needs Clerk invite API + write |
| Users & Access | Suspend user button | HARD-GATED | Needs Clerk write |
| Users & Access | Change role button | HARD-GATED | Needs Clerk publicMetadata write |
| Users & Access | Bulk import | STUB | Future-proof; render disabled with "available in pilot environment" |
| Users & Access | Export CSV button | SAFE | Client-side CSV synthesis from rendered table |
| Agent Readiness | Posture card expand | SAFE | Reads AGENT1 deterministic posture |
| Agent Readiness | Tab switch | SAFE | Pure UI state |
| Agent Readiness | Reasoning trace drawer | SAFE | Reads AGENT1 editorial output |
| Agent Readiness | Run readiness check button | STUB | Render disabled — would invoke deterministic integrity test (Wave 27+) |
| Agent Readiness | Capability matrix cell click | SAFE | Deep-link navigation |
| Production Readiness | Tile expand | SAFE | Reads W32F deterministic read-model |
| Production Readiness | Tab switch | SAFE | Pure UI state |
| Production Readiness | Blocker row → drawer | SAFE | Reads W32F |
| Production Readiness | Mark blocker resolved (in drawer) | HARD-GATED | Needs blocker-store write |
| Production Readiness | View promotion gate criteria | SAFE | Static doc render |
| Production Readiness | Open run book link | SAFE | Anchor navigation |
| Build Progress | Tab switch | SAFE | Pure UI state |
| Build Progress | Wave row expand | SAFE | Reads build-waves.json deterministically |
| Build Progress | Slice row → drawer | SAFE | Reads build-slices.json |
| Build Progress | CI mini-strip | SAFE | Deterministic seed (NOT live Vercel API) |
| Build Progress | Open WAVE_ROADMAP link | SAFE | Anchor navigation |
| Architecture | Tab switch | SAFE | Pure UI state |
| Architecture | Plane row expand | SAFE | Reads architecture-page-view |
| Architecture | Component row → drawer | SAFE | Reads deterministic component manifest |
| Architecture | Run plane integrity check button | STUB | Render disabled (Wave 27+) |
| Architecture | Open architecture docs link | SAFE | Anchor navigation |
| All pages | AGENT1 editorial card render | SAFE | Pure read-model |
| All pages | AGENT1 choices "3 + custom" rendering | SAFE | Pure read-model |
| All pages | AGENT1 choice click → action | HARD-GATED | Needs runtime to execute the choice (Wave 27+) |

---

## 4. Backlog plan: `wave-admin-completion`

### Slice list (proposed, sequenced)

| ID | Title | Type | Depends on | Estimated complexity |
|---|---|---|---|---|
| ADMIN10 | Legacy `/platform/admin/*` route consolidation (REDIRECT/DEPRECATE) | docs+ops | — | M |
| ADMIN11 | Users & Access depth — tabs + user table + role detail drawer + invite stub | ui | AGENT1 | L |
| ADMIN12 | Agent Readiness depth — per-agent expandable cards + capability matrix + trace drawer | ui | AGENT1 | M |
| ADMIN13 | Connectors depth — per-connector detail drawer + config stub + requirements matrix | ui | W32D, AGENT1 | M |
| ADMIN14 | Data Trust depth — per-rung dataset list + drawer + approval stub + promotion + quality tabs | ui | AGENT1 | L |
| ADMIN15 | Build Progress depth — wave timeline + slice drilldown + CI mini-strip | ui | AGENT1 | M |
| ADMIN16 | Production Readiness depth — per-tile expandable + per-blocker drawer + promotion gate | ui | W32F, AGENT1 | M |
| ADMIN17 | Architecture depth — per-plane drilldown + component drawer + plane health summary | ui | AGENT1 | M |
| ADMIN18 | Overview depth — setup timeline + recent activity + cross-page CTAs | ui | ADMIN11–17 | M |
| ADMIN19 | Visual lock + regression update for completion wave | qa | ADMIN10–18 | S |

### Parallelization plan

- **Tier 1 (blocks others):** ADMIN10 — must finish first because it removes/redirects legacy routes that ADMIN11/13/14/15 reference.
- **Tier 2 (independent, parallelizable):** ADMIN11, ADMIN12, ADMIN13, ADMIN14, ADMIN15, ADMIN16, ADMIN17 — each adds depth to a single canonical page; no cross-dependencies.
- **Tier 3 (depends on Tier 2):** ADMIN18 (Overview pull-through references Tier-2 page-states) + ADMIN19 (visual-lock test extension covers Tier-2 widgets).

Recommended execution: 2–3 lane agents at a time across Tier 2, integration in batches of 2–3 PRs.

### Estimated wave effort

- ADMIN10 (legacy consolidation): ~1 hour
- ADMIN11–17 (per-page depth, 7 slices): ~30–45 min each, parallelizable → **~3–4 hours wall-clock with parallelization**
- ADMIN18 (overview pull-through): ~30 min
- ADMIN19 (visual lock update): ~30 min
- **Total wave: ~5–6 hours wall-clock with multi-agent parallelization**

---

## 5. Out of scope (Wave 27+ territory)

Strict rule: any interaction that would call a live runtime (model API, Clerk write, database write, audit-event store, real connector SDK) defers to Wave 27 (Agent Runtime + Model Gateway + Tools track).

- Live Anthropic / Azure OpenAI calls
- Real Clerk invite flow execution (the form button stays disabled in ADMIN11 with "available in pilot environment" reason)
- Real connector adapter (sync, test, configure) — Wave 27
- Real dataset approval write (writes to evidence ledger) — Wave 27
- Real audit event store (`/api/admin/audit-write`) — Wave 27
- Real model gateway / tool execution — Wave 27 / 28
- Real blocker-resolution write — Wave 27
- Real role-change / suspend-user writes — Wave 27

---

## 6. Effort estimate (recap)

| Slice | Type | Complexity | Wall-clock |
|---|---|---|---|
| ADMIN10 | docs+ops | M | ~1 h |
| ADMIN11 | ui | L | ~45 min |
| ADMIN12 | ui | M | ~30 min |
| ADMIN13 | ui | M | ~30 min |
| ADMIN14 | ui | L | ~45 min |
| ADMIN15 | ui | M | ~30 min |
| ADMIN16 | ui | M | ~30 min |
| ADMIN17 | ui | M | ~30 min |
| ADMIN18 | ui | M | ~30 min |
| ADMIN19 | qa | S | ~30 min |
| **Total (parallel Tier 2)** | | | **~5–6 hours wall-clock** |

---

## Appendix A — Reachability findings

Top nav (`AbarvaNav.tsx`) Admin link points to `/platform/admin` for the `isAdmin` branch (line 130). ADMIN8 retargeted `AbarVaTopNav` / `AbarVaShellNav` / `abarva-shell.ts` to `/admin` but `AbarvaNav.tsx` at `src/components/AbarvaNav.tsx` was missed — still routes admin users to the legacy redirect, which then 308s to `/admin`. Functionally fine, but ADMIN10 should retarget the source to `/admin` directly to remove the redirect hop.

Other components referencing `platform/admin` (per `grep -rln`):
- `src/components/AbarvaNav.tsx` — link target (above)
- `src/components/home/AgenticHomeEntry.tsx` — link target on home tile (verify, retarget in ADMIN10)
- `src/components/admin/StewardSetupControlCenter.tsx` — internal admin component
- `src/components/admin/StewardAdminRail.tsx` — internal admin component
- `src/components/admin/ProductionReadinessDecisionFlow.tsx` — internal
- `src/components/admin/ProductionReadinessTracker.tsx` — internal
- `src/components/chrome/MaestroChrome.tsx` — chrome-level link target
- `src/app/(maestro)/admin/architecture/page.tsx` — comment only (ADMIN8 pointer)
- `src/app/(maestro)/admin/layout.tsx` — auth gate logic (legacy email allowlist comment)
- `src/app/(maestro)/admin/production-readiness/page.tsx` — comment only

ADMIN10 audits these references and either (a) retargets to `/admin` directly or (b) leaves intentional ones (comments) with explicit rationale.
