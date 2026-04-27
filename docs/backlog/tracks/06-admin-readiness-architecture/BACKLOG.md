# Track 06 — Admin + Readiness + Architecture

## Purpose
Make AbarVa operationally governable: data readiness, production readiness, build progress, source of truth, and freshness.

## Current state
PROD1/PROD2/PROD4 style readiness exists, but freshness/live status and cross-session updates need hardening.

## Target state
A unified Steward-led control plane that honestly shows build, data, evidence, pilot, and production readiness.

## Backlog Items

---

## PROD2 — Production readiness freshness layer

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** /platform/admin/production-readiness  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Show stale/fresh/static/live-ish status so the tracker does not feel stale.

### Primary question answered
Is this readiness view current?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- production-readiness.ts
- ProductionReadinessTracker.tsx
- production-readiness.json
- tests

### Forbidden
- No model calls unless explicitly approved.
- No upload/parsing unless explicitly approved.
- No workflow/approval engine unless explicitly approved.
- No broad UI redesign.

### Tests and validation
- Targeted Jest
- Scoped ESLint
- npx tsc --noEmit --pretty false
- npm run build -- --webpack
- git diff --check
- hygiene_gate.sh via CI

### Acceptance criteria
- Page/workflow answers the primary question.
- Agent guidance is contextual.
- No false production/live claims.
- Production readiness tracker is updated or explicitly marked not applicable.

### Codex-ready slice prompt
```text
Implement PROD2 — Production readiness freshness layer.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROD4 — Unified production readiness control plane

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** Admin readiness  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Ensure all GPT/Codex sessions update one canonical readiness manifest.

### Primary question answered
What is the single source of truth for readiness?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- src/** where scoped
- tests under src/__tests__/integration/**
- docs/build/slices/<ID>.md if tracked

### Forbidden
- No model calls unless explicitly approved.
- No upload/parsing unless explicitly approved.
- No workflow/approval engine unless explicitly approved.
- No broad UI redesign.

### Tests and validation
- Targeted Jest
- Scoped ESLint
- npx tsc --noEmit --pretty false
- npm run build -- --webpack
- git diff --check
- hygiene_gate.sh via CI

### Acceptance criteria
- Page/workflow answers the primary question.
- Agent guidance is contextual.
- No false production/live claims.
- Production readiness tracker is updated or explicitly marked not applicable.

### Codex-ready slice prompt
```text
Implement PROD4 — Unified production readiness control plane.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## ADM9 — Dataset domain drilldown

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Admin Setup  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Show loaded/available/usable evidence by domain with blockers and owner.

### Primary question answered
What data can agents trust?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- src/** where scoped
- tests under src/__tests__/integration/**
- docs/build/slices/<ID>.md if tracked

### Forbidden
- No model calls unless explicitly approved.
- No upload/parsing unless explicitly approved.
- No workflow/approval engine unless explicitly approved.
- No broad UI redesign.

### Tests and validation
- Targeted Jest
- Scoped ESLint
- npx tsc --noEmit --pretty false
- npm run build -- --webpack
- git diff --check
- hygiene_gate.sh via CI

### Acceptance criteria
- Page/workflow answers the primary question.
- Agent guidance is contextual.
- No false production/live claims.
- Production readiness tracker is updated or explicitly marked not applicable.

### Codex-ready slice prompt
```text
Implement ADM9 — Dataset domain drilldown.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## ADM10 — Admin-to-Source readiness backing plan

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** Admin + Source  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Move Source data readiness from seed rows to platform readiness contract.

### Primary question answered
How does Source consume Admin readiness?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- src/** where scoped
- tests under src/__tests__/integration/**
- docs/build/slices/<ID>.md if tracked

### Forbidden
- No model calls unless explicitly approved.
- No upload/parsing unless explicitly approved.
- No workflow/approval engine unless explicitly approved.
- No broad UI redesign.

### Tests and validation
- Targeted Jest
- Scoped ESLint
- npx tsc --noEmit --pretty false
- npm run build -- --webpack
- git diff --check
- hygiene_gate.sh via CI

### Acceptance criteria
- Page/workflow answers the primary question.
- Agent guidance is contextual.
- No false production/live claims.
- Production readiness tracker is updated or explicitly marked not applicable.

### Codex-ready slice prompt
```text
Implement ADM10 — Admin-to-Source readiness backing plan.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROD5 — GitHub/Vercel readiness integration plan

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Admin readiness  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Plan safe GitHub checks/Vercel deploy sync without fake monitoring.

### Primary question answered
What does the user need to know or do next?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- src/** where scoped
- tests under src/__tests__/integration/**
- docs/build/slices/<ID>.md if tracked

### Forbidden
- No model calls unless explicitly approved.
- No upload/parsing unless explicitly approved.
- No workflow/approval engine unless explicitly approved.
- No broad UI redesign.

### Tests and validation
- Targeted Jest
- Scoped ESLint
- npx tsc --noEmit --pretty false
- npm run build -- --webpack
- git diff --check
- hygiene_gate.sh via CI

### Acceptance criteria
- Page/workflow answers the primary question.
- Agent guidance is contextual.
- No false production/live claims.
- Production readiness tracker is updated or explicitly marked not applicable.

### Codex-ready slice prompt
```text
Implement PROD5 — GitHub/Vercel readiness integration plan.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROD6 — Live persona walk protocol

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** QA / Admin  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Create repeatable manual/automated live route persona walk protocol for pilot readiness.

### Primary question answered
What does the user need to know or do next?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- src/** where scoped
- tests under src/__tests__/integration/**
- docs/build/slices/<ID>.md if tracked

### Forbidden
- No model calls unless explicitly approved.
- No upload/parsing unless explicitly approved.
- No workflow/approval engine unless explicitly approved.
- No broad UI redesign.

### Tests and validation
- Targeted Jest
- Scoped ESLint
- npx tsc --noEmit --pretty false
- npm run build -- --webpack
- git diff --check
- hygiene_gate.sh via CI

### Acceptance criteria
- Page/workflow answers the primary question.
- Agent guidance is contextual.
- No false production/live claims.
- Production readiness tracker is updated or explicitly marked not applicable.

### Codex-ready slice prompt
```text
Implement PROD6 — Live persona walk protocol.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## Wave: Admin Surface Canonical Redesign (`wave-admin-redesign`)

### Why
Current admin compliance score is 72/100 (WIRE2B). The audit measured "imports canonical shell" and "no banned tokens in shell file" but the rendered pixels still violate the canon — teal accents, purple chips, missing agent rail, no Steward editorial, no context bar. Wireframes shared 2026-04-27 lock the canonical 3-zone editorial layout. New logo lockup-v2 + token palette adopted. This wave makes admin pages demonstrably match the wireframe.

### Founder source (2026-04-27)
- `abarva_logo_lockup_v2.svg` — refined orbital symbol + Cormorant Garamond wordmark
- 5 wireframe screenshots — Overview, Production Readiness, Architecture, plus 2 supporting variants
- Color palette: `#070707` ink, `#0b4a91` navy, `#FBFAF7` cream, soft mint/amber/coral status pills
- Top nav: 6 surfaces (Home / Programs / Source / Intelligence / Control Tower / Platform pill)
- 8-item admin sub-sidebar: Overview, Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness, Build Progress, Architecture

### Slices

| ID | Title | Type | Depends on |
|---|---|---|---|
| ADMIN0 | Backlog registration (this) | docs | — |
| ADMIN1 | Foundation: logo + tokens | ui | ADMIN0 |
| ADMIN2 | Admin shell 3-zone layout | ui | ADMIN1 |
| ADMIN3 | Steward editorial component | ui | ADMIN1, ADMIN2 |
| ADMIN4 | Architecture page wired | ui | ADMIN3 |
| ADMIN5 | Production Readiness page wired | ui | ADMIN3 |
| ADMIN6 | Remaining 6 sub-pages | ui | ADMIN3 |
| ADMIN7 | Visual lock + regression guard | qa | ADMIN1–6 |

### Acceptance
- Admin compliance score (WIRE2B) lifts 72 → 92
- Banned tokens on admin pages 11 → 0
- All 8 admin pages render the 3-zone shell
- All 8 admin pages show Steward editorial card
- All 8 admin pages show context bar
- All 8 admin pages show agent rail with honest posture
- Live caveat permanent on every admin page
- Logo lockup v2 rendered (not stub)
- New design tokens used (no hex literals in admin tree)
- 200+ new tests passing
- No `production_ready` promotion

### Wave file
- `docs/backlog/waves/WAVE-ADMIN-REDESIGN.md`

---

## Wave: Admin Completion (`wave-admin-completion`)

### Why
ADMIN1–8 + AGENT1 locked the canonical admin shell, visual canon, and deterministic agent reasoning across 8 `/admin/*` pages. What remains is depth, not chrome. Most canonical pages stop at the editorial card with thin or absent drill-downs. The legacy `/platform/admin/*` tree still hosts 16 live sub-routes — some duplicate canonical pages, some host real engagement-ops content, some are stubs. ADMIN9 audited every legacy route and every canonical page, classified every interaction SAFE / STUB / HARD-GATED, and produced this 10-slice plan. All write actions and live model calls remain HARD-GATED for Wave 27+ (Agent Runtime + Model Gateway).

### Source documents
- `docs/build/ADMIN_COMPLETION_AUDIT.md` — three audits + backlog plan + interaction-safety matrix
- `docs/build/slices/ADMIN9_*.md` through `ADMIN19_*.md` — slice docs

### Slices

| ID | Title | Type | Tier | Depends on |
|---|---|---|---|---|
| ADMIN9 | Admin Completion Audit + Plan | docs | (this audit) | ADMIN1–8 + AGENT1 |
| ADMIN10 | Legacy `/platform/admin/*` route consolidation | docs+ops | 1 (blocks others) | ADMIN9 |
| ADMIN11 | Users & Access depth | ui | 2 (parallel) | ADMIN10 |
| ADMIN12 | Agent Readiness depth | ui | 2 (parallel) | ADMIN10 |
| ADMIN13 | Connectors depth | ui | 2 (parallel) | ADMIN10 |
| ADMIN14 | Data Trust depth | ui | 2 (parallel) | ADMIN10 |
| ADMIN15 | Build Progress depth | ui | 2 (parallel) | ADMIN10 |
| ADMIN16 | Production Readiness depth | ui | 2 (parallel) | ADMIN10 |
| ADMIN17 | Architecture depth | ui | 2 (parallel) | ADMIN10 |
| ADMIN18 | Overview depth — pull-through | ui | 3 | ADMIN11–17 |
| ADMIN19 | Visual lock + regression update | qa | 3 | ADMIN10–18 |

### Acceptance
- 16 live legacy `/platform/admin/*` sub-routes are honestly disposed (4 KEEP / 5 MERGE / 2 REDIRECT / 6 DEPRECATE per ADMIN9 audit).
- 7 canonical `/admin/*` pages have rich canvas (sub-tabs, drill-down drawers, action strips, stub buttons with reason copy).
- Overview pulls state through from all 7 sibling pages.
- ADMIN7 regression suite extended to cover all new ADMIN11–18 components.
- WIRE2B compliance scores rescore honestly (only where deviations close).
- No `production_ready: true` promotion.
- HARD-GATED interactions (Invite, Approve, Test connection, Mark resolved, Configure, Suspend, ChangeRole, audit-write) all render disabled with reason copy and defer to Wave 27+.

### Estimated effort
~5–6 hours wall-clock with 2–3 lane agents in parallel across Tier 2.

### Wave file
- `docs/build/ADMIN_COMPLETION_AUDIT.md`
- `docs/build/slices/ADMIN9_*.md` through `ADMIN19_*.md`

---

## Wave: Native Admin Data Layer (`wave-admin-data`)

### Why
After `wave-admin-completion` shipped (10 of 11 slices merged at 91%), the canonical `/admin/*` tree at `src/app/(maestro)/admin/*` is content-rich but every page reads from **hardcoded TypeScript constants** in `src/lib/admin/*-page-view.ts` — `SETUP_ITEMS`, `SEED_USER_DETAILS`, `APEX_DETAIL_SEEDS`, `LOADED_FILES`, `CI_SNAPSHOT`, etc. The founder rejected ADMIN18 (Overview pull-through) shipping with deterministic seed and called for native data flow from real DB tables. ADMIN18 was deferred from `wave-admin-completion` for exactly this reason. ADMIN-DATA1 audited the existing Supabase infrastructure (74 migrations, including `persons`, `teams`, `clients`, `audit_log`, `data_integrations`, `integration_health`), the canonical adapter pattern (`commercial-mission-adapter.ts`, `atlas/repository.ts`), and produced this 12-slice plan. All write actions, live model calls, and audit-event emission stay HARD-GATED for Wave 27+ — this wave is **READ-ONLY**.

### Source documents
- `docs/build/ADMIN_DATA_LAYER_AUDIT.md` — comprehensive audit + DDL specs + adapter contracts + sequencing
- `docs/build/slices/ADMIN-DATA1_*.md` through `ADMIN-DATA13_*.md` — slice docs

### Slices

| ID | Title | Type | Tier | Depends on |
|---|---|---|---|---|
| ADMIN-DATA1 | Native Admin Data Layer Audit + Backlog Registration | docs | (this audit) | ADMIN9, ADMIN19 |
| ADMIN-DATA2 | Adapter contracts + types + fixture mode | code | 1 (foundation) | DATA1 |
| ADMIN-DATA3 | `/admin/users-access` wired | code | 2 (parallel) | DATA2 |
| ADMIN-DATA4 | `/admin/connectors` wired | code | 2 (parallel) | DATA2 |
| ADMIN-DATA5 | `/admin/data-trust` wired | code | 2 (parallel) | DATA2 |
| ADMIN-DATA6 | `/admin/agent-readiness` wired | code | 2 (parallel) | DATA2 |
| ADMIN-DATA7 | `/admin/build-progress` audit | code | 2 (parallel) | DATA2 |
| ADMIN-DATA8 | `/admin/production-readiness` wired | code | 2 (parallel) | DATA2 |
| ADMIN-DATA9 | `/admin/architecture` audit | code | 2 (parallel) | DATA2 |
| ADMIN-DATA10 | Admin tables migrations + Apex/Meridian seed | sql | 2 (parallel) | DATA2 |
| ADMIN-DATA11 | AGENT1 context bundle wired to real DB | code | 3 | DATA10 |
| ADMIN-DATA12 | ADMIN18 Overview pull-through (live data) | code | 3 | DATA10 |
| ADMIN-DATA13 | Visual + data regression lock | qa | 4 | DATA12 |

### New tables (DATA10)
- `admin_connectors` — per-tenant connector readiness (kind, vendor, status, required-for-pilot/prod, blocker reason, steward guidance)
- `admin_datasets` — per-tenant dataset trust ladder (rung, lineage, schema)
- `admin_dataset_approvals` — promotion request log (pending/approved/rejected)
- `admin_dataset_quality` — quality scorecard pillar scores per dataset
- `admin_blockers` — production-readiness blockers (severity, scope, status, owner)
- `admin_audit_log` — admin-page interaction events (read-only in this wave)
- `admin_setup_progress` — computed/cached setup-step status per tenant

### Acceptance
- 8 admin pages no longer read from hardcoded TypeScript constants (except platform-level concept data like `AGENT_CAPABILITIES`, `TRUST_LADDER` rungs, `ARCHITECTURE_PLANES`).
- 7 new admin tables exist with RLS, indexes, seed for Apex Retail + Meridian Bank.
- AGENT1 context bundle reads from live DB (DATA11).
- ADMIN18 Overview pull-through ships with real `admin_setup_progress` + `admin_audit_log` data (DATA12).
- WIRE2B Admin Overview score eligible to rescore from 92.
- All write actions, live model calls, audit-event emission remain HARD-GATED for Wave 27+.
- `production_ready: true` never promoted in this wave.

### Estimated effort
~7-8 hours wall-clock with 4-lane parallelization (Tier 2 has 8 lanes).

### Wave file
- `docs/build/ADMIN_DATA_LAYER_AUDIT.md`
- `docs/build/slices/ADMIN-DATA1_*.md` through `ADMIN-DATA13_*.md`
