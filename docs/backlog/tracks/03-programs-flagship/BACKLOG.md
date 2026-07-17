# Track 03 — Programs Flagship + Workshop Mode

## Purpose
Make the Program experience as rich as Source: journey-aware, workshop-driven, deliverable/evidence-backed, and agent-guided.

## Current state
Apex Retail has rich program seed data; Program flagship exists; Source link and later deliverables/workshop polish remain pending.

## Target state
Programs becomes the reference implementation for Nexus-led transformation execution, not a static project page.

## Backlog Items

---

## PROG20 — Program subnav + workflow canvas interaction

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** Program Detail  
**Primary agent:** Nexus  
**Dependencies:** None

### Purpose
Add/verify Overview, Workshop, Deliverables, Evidence, Actions, Gate, Decisions tabs with deterministic content.

### Primary question answered
How do we move this program to the next gate?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- src/components/programs/*
- src/lib/programs/*
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
Implement PROG20 — Program subnav + workflow canvas interaction.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROG26 — Moves phase readiness packs after gate approval

**Priority:** P1
**Status:** pending
**Type:** feature
**Primary surface:** Moves phase workspace + Files & Evidence
**Primary agent:** aVa / Moves
**Dependencies:** Moves phase gate approval contract, File Cabinet artifact lifecycle, phase template catalog

### Purpose
When a Move advances through a phase gate, AbarVa should create a real next-phase readiness pack, not just show static template/session guidance. The pack should make the next phase runnable: session guides, sponsor prep, templates, upload checklist, and expected outputs should appear as generated Move artifacts in Files & Evidence.

### Primary question answered
What exactly do I need to run next, which templates do I use, and where are the generated prep materials?

### Workflow and UX requirements
- After P0 approval, generate a P1 Readiness Pack with the charter workshop guide, sponsor prep guide, scope boundary matrix, success metrics template, stakeholder/session plan, and “what to upload to complete P1” checklist.
- Repeat the pattern for later phase approvals: each gate should prepare the next phase with tailored session guides, templates, upload expectations, and decision criteria.
- Readiness pack artifacts must appear in Files & Evidence with clear status: generated, downloadable, usable in workspace, completed/uploaded, reviewed, approved.
- The phase Prepare screen must distinguish generated artifacts from catalog guidance. Do not imply a template exists in Files & Evidence unless it was actually created.
- The screen should explain before/during/after expectations for the phase: what to review, what session to run, what to upload, what AbarVa will parse, what gates will check, and what carries forward.

### Data contract and caveats
- Do not fabricate client evidence or mark generated prep artifacts as approved evidence.
- Generated readiness materials are guidance artifacts until a human completes/uploads the actual session output.
- Use the phase template catalog as the source of recommended templates, but persist generated readiness-pack artifacts through the Move artifact/File Cabinet lifecycle.
- The pack should be tailored from the Move brief, phase, archetype/use case, tenant context where agent-ready, and current evidence state.

### Expected files
- `src/components/strategic-moves/**`
- `src/lib/programs/phase-templates/**`
- `src/lib/programs/**`
- `src/app/api/**/strategic-moves/**` or equivalent Move artifact/gate endpoints
- `src/components/strategic-moves/__tests__/**`
- release record under `docs/releases/records/`

### Forbidden
- Do not treat generated prep materials as approved evidence.
- Do not use candidate/unapproved context by default.
- Do not bypass gate approval or evidence review.
- Do not create static-only UI labels that imply real downloadable artifacts.
- Do not rewrite the whole Moves shell.

### Tests and validation
- Targeted Jest for P0 approval creating/listing a P1 Readiness Pack.
- Targeted Jest for P1/P2/P3/P4/P5 gate approval preparing the next phase.
- Verify generated prep artifacts appear in Files & Evidence but are not consumed as approved evidence until completed/reviewed.
- Scoped ESLint.
- `npx tsc --noEmit --pretty false` or documented repo-wide blocker.
- `npm run release:check`.
- Signed-in browser smoke on a disposable Move.

### Acceptance criteria
- P0 approval creates a visible P1 Readiness Pack.
- P1 Prepare shows real generated pack artifacts, not only catalog labels.
- Files & Evidence lists the readiness pack artifacts with correct lifecycle status.
- Completed/uploaded session outputs remain separate from generated prep artifacts.
- Later phase gates follow the same “approve → prepare next phase” pattern.
- Browser proof shows an operator can advance, see the generated prep pack, download/use it, upload completed outputs, and understand what blocks the next gate.

### Production readiness impact
Global-control-lane. Improves shared Moves workflow behavior for all tenants. Requires normal PR, release record, ACA deployment, runtime invariant proof, and signed-in workflow proof before claiming live-proven.

### Codex-ready slice prompt
```text
Implement PROG26 — Moves phase readiness packs after gate approval.

Goal:
After each phase gate approval, create and persist a tailored next-phase readiness pack as real Move artifacts visible in Files & Evidence. Do not rely on static template/session labels alone.

Scope:
- P0 approval should create a P1 Readiness Pack.
- Later phase approvals should prepare the next phase using the same pattern.
- Readiness pack artifacts should include session guides, sponsor prep, templates/checklists, upload expectations, and gate criteria.
- Generated prep artifacts are guidance, not approved evidence.
- Completed human/session outputs must remain separate uploaded evidence.

Validation:
Run targeted Moves tests, scoped lint, release:check, and a signed-in disposable Move smoke proving:
approve gate → next-phase readiness pack created → Files & Evidence visible → generated pack separate from approved evidence.

Final report must include PR link, files changed, validation results, deployment/proof status, and exclusions.
```


---

## PROG21 — Gate + approval interaction drawer

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Program Detail  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Show gate blockers, required evidence, approvals, waiver caveat; no fake approvals.

### Primary question answered
Can this program move to the next phase?

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
Implement PROG21 — Gate + approval interaction drawer.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROG22 — Deliverables canvas interaction polish

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Program Deliverables  
**Primary agent:** Nexus  
**Dependencies:** None

### Purpose
Prioritize current phase deliverables, evidence trace, missing inputs, disabled approval/export actions.

### Primary question answered
Can this deliverable be trusted or approved?

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
Implement PROG22 — Deliverables canvas interaction polish.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROG23 — Program Source link deepening

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** Program Detail + Source  
**Primary agent:** Nexus  
**Dependencies:** None

### Purpose
Show linked Source event context in Program detail and Program context in Source event.

### Primary question answered
How does sourcing affect this program?

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
Implement PROG23 — Program Source link deepening.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROG24 — Client Maestro next action composer

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Program Workshop  
**Primary agent:** Nexus  
**Dependencies:** None

### Purpose
Add deterministic 3 choices + custom for Client Maestro where it moves workflow forward.

### Primary question answered
What should the Client Maestro do next?

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
Implement PROG24 — Client Maestro next action composer.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## PROG25 — Workshop notes to actions/deliverables plan

**Priority:** P2  
**Status:** pending  
**Type:** feature  
**Primary surface:** Program Workshop  
**Primary agent:** Nexus  
**Dependencies:** None

### Purpose
Plan how workshop notes become actions, decisions, evidence, and deliverable drafts without model calls initially.

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
Implement PROG25 — Workshop notes to actions/deliverables plan.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```
