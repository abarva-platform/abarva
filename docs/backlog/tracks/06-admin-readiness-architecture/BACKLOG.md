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
