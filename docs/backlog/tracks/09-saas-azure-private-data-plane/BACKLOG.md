# Track 09 — SaaS + Azure + Private Data Plane

## Purpose
Prove AbarVa can run as SaaS while sensitive client data/evidence/model routing stays in a private boundary.

## Current state
Architecture discussions exist; lab planned later; no implementation yet.

## Target state
A reference lab and architecture for SaaS control plane + private data plane.

## Backlog Items

---

## AZ1 — Azure SaaS/private data-plane lab plan

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Architecture  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Plan control plane, private data plane, tenant data boundary, model routing, and evidence storage.

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
Implement AZ1 — Azure SaaS/private data-plane lab plan.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## AZ2 — Private data-plane reference architecture docs

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Architecture  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Document Azure target, network, storage, identity, model gateway, and tool boundary.

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
Implement AZ2 — Private data-plane reference architecture docs.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## AZ3 — Request-to-context data flow diagram

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Architecture  
**Primary agent:** Nexus  
**Dependencies:** None

### Purpose
Create flow diagrams for user request -> context builder -> model gateway -> tools -> evidence.

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
Implement AZ3 — Request-to-context data flow diagram.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## AZ4 — Tenant isolation verification plan

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** QA/Security  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Define tests for tenant data isolation before pilot.

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
Implement AZ4 — Tenant isolation verification plan.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```
