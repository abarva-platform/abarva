# Track 05 — Intelligence + Control Tower

## Purpose
Make Sentinel and Atlas surfaces action-generating instead of static signal previews.

## Current state
Deterministic Source control tower signals and intelligence patterns exist, but mostly seed/pattern-based and not client-specific.

## Target state
Control Tower and Intelligence connect portfolio signals to Source/Programs actions, executive decisions, and evidence gaps.

## Backlog Items

---

## INTELQA1 — Intelligence discovery audit

**Priority:** P0
**Status:** backlog
**Type:** audit / quality gate
**Primary surface:** Intelligence
**Primary agent:** Intelligence advisor
**Dependencies:** Signed-in production crawl harness; scoped test identities; shared response shaper; evidence/source tracing

### Purpose
Pressure-test Intelligence quality before the next revamp by proving whether cited, high-confidence answers actually resolve to supporting evidence, stay in scope, render cleanly, and convert strategy signals into grounded action.

### Primary question answered
Does Intelligence provide decision-useful enterprise strategy and benchmark interpretation, or does it only look strong because the surface hides weak grounding, generic prose, stale evidence, or scope bleed?

### Workflow and UX requirements
- Reuse the live signed-in crawl pattern: scoped test identity, read-only execution, verbatim question, raw model response, rendered response, matrix scoring, and artifact-backed proof.
- Score by dimension, not by a single headline percentage.
- Capture claim-to-source traces for sampled answers, including unresolved claims and citation-theater findings.
- Confirm the shared response shaper removes raw IDs, dimension keys, codenames, and overlong/scaffolded answer text.
- Verify rendered cards and answers have working source traces and action paths, including Shape-into-Move where applicable.
- Confirm Intelligence hands off cleanly instead of answering out-of-scope requests: portfolio performance numbers to Tower, vendor sourcing to Source, enterprise discovery to Home, and execution/work packets to Moves.

### Audit dimensions
- Grounding-truth: trace specific answer claims to cited source points and verify the source actually supports each claim.
- Specificity: distinguish enterprise-grounded insight from generic consulting advice that would fit any tenant.
- Confidence calibration: flag thin-evidence claims marked as high confidence and uniform confidence that does not track evidence.
- Scope discipline: detect Tower, Source, Home, or Moves bleed and require clean handoff language.
- Freshness: flag stale benchmark or web-grounded claims presented as current.
- Shaper cleanliness: detect raw IDs, dimension keys, codenames, labels, evidence scaffolding, or answer bloat.
- Render completeness: crawl cards and advisor answers for complete rendering, trace-source access, and non-empty action states.
- Actionability: test whether signal-to-Move paths produce grounded next actions instead of dead ends.

### Data contract and caveats
- Do not score grounding by citation count alone; citations must resolve claim-by-claim.
- Do not accept generic insight as enterprise-grounded.
- Do not accept screenshots as the proof artifact; screenshots may supplement, but the audit artifact must include verbatim text, raw/rendered response capture, source trace, and scores.
- Do not use production Clerk secrets; use scoped test identities or approved browser storage state.
- Be explicit about sample size and unresolved evidence.

### Expected files
- `reports/intelligence-discovery-audit/**`
- `docs/releases/records/**` if the audit drives a release-relevant fix
- Test or crawl harness updates only if required to capture prompt/raw/render evidence safely

### Forbidden
- No revamp before the Intelligence contract is locked from findings.
- No Intelligence-only fork for shared shaper, assembler, or dimension-resolution defects.
- No production secret access.
- No mutation of tenant data during the crawl.
- No model-call expansion beyond the controlled audit/proof path.

### Tests and validation
- Production signed-in crawl for SkyHarbor and Lakeshore question banks.
- Prompt/raw/render capture for each question where safe and explicitly enabled.
- Claim-to-source trace sample with resolved, unresolved, and citation-theater counts.
- Scope-handoff checks for Tower, Source, Home, and Moves boundaries.
- Shared-layer defect classification: shared shaper/assembler fixes vs Intelligence-specific fixes.

### Acceptance criteria
- Audit report includes per-dimension findings with verbatim card or answer text.
- Grounding-truth table includes claims sampled, resolved, unresolved, and citation-theater counts.
- Specificity, calibration, scope, freshness, render, and actionability scores are reported separately.
- Shared-layer overlap is identified so shared defects are fixed once.
- The next Intelligence contract and scoring bank can be written from evidence, not subjective impressions.

### Codex-ready slice prompt
```text
Implement INTELQA1 — Intelligence discovery audit.

Use the signed-in production crawl harness and scoped test identities. Audit Intelligence as an enterprise strategy and benchmark interpretation surface, not as Tower, Source, Home, or Moves.

Capture verbatim question, raw model response, rendered product response, source traces, claim-to-source resolution, and per-dimension scores. Report by dimension, not as one headline percent. Classify shared-layer defects separately from Intelligence-specific issues.

Do not mutate tenant data, use production secrets, or start a revamp before the Intelligence contract is locked from the audit findings.
```

---

## INT1 — Client-specific intelligence pattern plan

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Intelligence  
**Primary agent:** Sentinel  
**Dependencies:** None

### Purpose
Plan how patterns become client/program/event-specific instead of same output for every input.

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
Implement INT1 — Client-specific intelligence pattern plan.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## INT2 — Pattern detail action canvas

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Intelligence  
**Primary agent:** Sentinel  
**Dependencies:** None

### Purpose
Turn pattern detection into evidence, affected programs/events, and action plan.

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
Implement INT2 — Pattern detail action canvas.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## TOWER1 — Source commercial signals in Control Tower

**Priority:** P0  
**Status:** pending  
**Type:** feature  
**Primary surface:** Control Tower  
**Primary agent:** Atlas  
**Dependencies:** None

### Purpose
Surface Source pricing/BAFO/selection readiness signals in executive control tower.

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
Implement TOWER1 — Source commercial signals in Control Tower.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## TOWER2 — Executive decision queue

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Control Tower  
**Primary agent:** Atlas  
**Dependencies:** None

### Purpose
Show decisions requiring leadership attention across Source and Programs.

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
Implement TOWER2 — Executive decision queue.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## TOWER3 — Value at risk portfolio lens

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Control Tower  
**Primary agent:** Atlas  
**Dependencies:** None

### Purpose
Summarize value at stake, evidence confidence, blockers, and decision needs.

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
Implement TOWER3 — Value at risk portfolio lens.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```


---

## INT3 — Sentinel evidence gap queue

**Priority:** P1  
**Status:** pending  
**Type:** feature  
**Primary surface:** Intelligence  
**Primary agent:** Sentinel  
**Dependencies:** None

### Purpose
Centralize unsupported claims, low-confidence evidence, stale data, and blocked citations.

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
Implement INT3 — Sentinel evidence gap queue.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```
