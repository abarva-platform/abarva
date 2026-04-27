# Track 00 — Executive Summary + Master Roadmap

## Purpose
Keep the founder and builders aligned on product vision, demo readiness, production readiness, and next build priorities.

## Current state
Progress trackers exist, but the roadmap is spread across Source, production readiness, waves, and conversation state.

## Target state
Single executive source of truth that explains what is built, what is demoable, what is pending, and what is blocked.

## Backlog Items

---

## ROAD1 — Master product readiness map

**Priority:** P0  
**Status:** pending  
**Type:** docs  
**Primary surface:** docs  
**Primary agent:** Atlas  
**Dependencies:** None

### Purpose
Create one master view of AbarVa readiness by product surface and runtime layer.

### Primary question answered
Where are we across the full product, not just Source?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- docs/planning/abarva-master-backlog/MASTER_PRODUCT_READINESS_MAP.md
- docs/build/production-readiness.json if readiness changes

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
Implement ROAD1 — Master product readiness map.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## ROAD2 — Eight-hour / three-day / pilot roadmap

**Priority:** P0  
**Status:** pending  
**Type:** docs  
**Primary surface:** docs  
**Primary agent:** Atlas  
**Dependencies:** None

### Purpose
Create a time-boxed roadmap for 8 hours, 3 days, and pilot readiness.

### Primary question answered
What should we build next and why?

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
Implement ROAD2 — Eight-hour / three-day / pilot roadmap.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## ROAD3 — Open risk and dependency register

**Priority:** P1  
**Status:** pending  
**Type:** docs  
**Primary surface:** docs  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Maintain cross-track risks: auth, upload, model gateway, tenant isolation, data readiness, production deploy, screenshot QA.

### Primary question answered
What can block pilot readiness?

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
Implement ROAD3 — Open risk and dependency register.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```
