# Track 01 — Brand + Design System + Visual QA

## Purpose
Make the product visibly match the AbarVa vision: premium, calm, off-white, table-forward, agent-centric, and name-only wordmark until final logo asset.

## Current state
Experience System and gallery exist; wordmark work is in progress; visual QA still needs production-domain screenshots.

## Target state
Consistent AbarVa brand, design compliance gates enforced in UI PRs, and visual QA artifacts for core routes.

## Backlog Items

---

## BRAND1 — Canonical name-only AbarVa wordmark

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** App shell / Experience Gallery  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Land a name-only AbarVa wordmark and remove prior symbol usage until final logo asset is provided.

### Primary question answered
Does every active shell use the approved wordmark?

### Workflow and UX requirements
- Use AbarVa as one wordmark.
- Abar near-black, Va dark sky blue.
- No symbol.
- Replace active shell/nav instances with reusable component.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- public/brand/abarva-logo.svg
- src/components/brand/AbarVaLogo.tsx
- shell/nav files
- ExperienceGallery
- brand tests
- VIS3 review doc

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
- App shell and gallery render name-only wordmark.
- No old symbol appears.
- Tests prove Abar and Va render and no external fonts are imported.

### Codex-ready slice prompt
```text
Implement BRAND1 — Canonical name-only AbarVa wordmark.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## VIS2 — Authenticated visual QA pass

**Priority:** P0  
**Status:** pending  
**Type:** qa  
**Primary surface:** /source, /source/events, /experience-gallery  
**Primary agent:** Atlas  
**Dependencies:** None

### Purpose
Capture desktop/tablet visual findings after brand and Source surfaces are built.

### Primary question answered
Does the product visually feel like the approved AbarVa direction?

### Workflow and UX requirements
- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats
- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files
- docs/platform-design/experience-system/implementation-reviews/VIS2_AUTHENTICATED_VISUAL_QA.md

### Forbidden
- No model calls unless explicitly approved.
- No upload/parsing unless explicitly approved.
- No workflow/approval engine unless explicitly approved.
- No broad UI redesign.

### Tests and validation
- Manual screenshot review
- git diff --check if docs changed

### Acceptance criteria
- Page/workflow answers the primary question.
- Agent guidance is contextual.
- No false production/live claims.
- Production readiness tracker is updated or explicitly marked not applicable.

### Codex-ready slice prompt
```text
Implement VIS2 — Authenticated visual QA pass.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## VIS4 — Design compliance CI/checklist enforcement

**Priority:** P1  
**Status:** pending  
**Type:** qa  
**Primary surface:** CI/docs  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Make sure UI PRs cite design files and include design compliance sections.

### Primary question answered
Can UI PRs bypass the design canon?

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
Implement VIS4 — Design compliance CI/checklist enforcement.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## DESIGN1 — Experience Gallery screenshot polish

**Priority:** P1  
**Status:** pending  
**Type:** ui  
**Primary surface:** /platform/admin/experience-gallery  
**Primary agent:** Steward  
**Dependencies:** None

### Purpose
Polish the internal design gallery after actual screenshots and wordmark are in place.

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
Implement DESIGN1 — Experience Gallery screenshot polish.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```
