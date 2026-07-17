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

## PROG27 — Moves phase operator clarity and evidence explorer usability

**Priority:** P0
**Status:** pending
**Type:** bugfix + UX contract
**Primary surface:** Moves phase workspace + Files & Evidence
**Primary agent:** aVa / Moves
**Dependencies:** PROG26 readiness-pack generation, Move artifact/File Cabinet lifecycle, evidence review workflow

### Purpose
Make every Moves phase understandable to a first-time operator. The user should never have to infer what to do from a long page, disconnected buttons, or generic language. Each phase must show: what was generated by the prior gate, what needs to be uploaded or reviewed now, what blocks the next gate, and what Approve & Build will create.

### Live findings captured
- P1 multi-upload reports “Uploaded 6 files” but does not display the six uploaded filenames, categories, review status, or next action in the phase canvas.
- Files & Evidence review appears generic/repeated across files; review content must be artifact-specific and clearly say what is being reviewed.
- Clicking `Open` in Files & Evidence closed the Chrome browser/window during live use. Opening artifacts must not close the operator’s browser or lose workflow state.
- P2 opens to a long page with unclear workflow language: “Provide the evidence this phase needs” and “Add evidence AbarVa asked for” are confusing unless the product shows exactly where the ask came from.
- P2 `Generate Execution & Readiness` and `Generate Session Pack` are disconnected from the phase journey. The page must explain which session pack is being generated, why, where it lands, and whether it is generated prep or required uploaded evidence.
- P2-P5 use too much vertical scrolling and underuse the available canvas width. The shell should surface the current action, evidence checklist, generated prep, and blockers above the fold.

### Primary question answered
What exactly should I do next, what files did I already provide, and what will happen if I approve/build this phase?

### Required UX contract
- The tabs must be the operator workflow, not passive navigation. Each phase should present tabbed steps that read like instructions:
  - `1. Prepare`: review generated prep, understand the session, and download/use materials.
  - `2. Upload`: upload the specific completed files or source evidence required for this phase.
  - `3. Review`: inspect parsed/extracted evidence and mark what is usable.
  - `4. Findings`: review what AbarVa found and what remains missing.
  - `5. Approve & Build`: approve the gate, generate phase deliverables, and prepare the next phase.
- Each tab must answer three things at the top: `What to do`, `What good looks like`, and `What unlocks the next tab`.
- The primary CTA must advance to the next workflow tab with explicit text such as `Continue to Upload`, `Review uploaded evidence`, or `Approve & Build P2`.
- Add a phase command center at the top of P1-P5 with a compact information table:
  - `Current step`
  - `What to do now`
  - `Artifacts generated by prior gate`
  - `Files uploaded`
  - `Files needing review`
  - `Gate blockers`
  - `Next action`
- After upload, show an uploaded-files table immediately in the phase canvas:
  - filename
  - evidence family/category
  - uploaded time
  - status: uploaded, parsed, reviewed, approved, blocked
  - actions: Review, Open, Download
- Replace vague copy such as “AbarVa asked for” with explicit source-backed language:
  - “Required by the P2 Evidence Checklist generated from the P1 gate”
  - or “No generated readiness pack exists yet. Generate the P2 Discovery Pack first.”
- Separate artifact classes visibly:
  - Generated prep pack
  - Blank template
  - Completed client upload
  - Reviewed evidence
  - Approved gate artifact
- The File Cabinet review panel must be artifact-specific. It should show the selected artifact title, source, phase, evidence family, why it matters, extracted findings, review decision, and next use.
- `Open` must open the artifact in a stable in-app panel or safe new tab/window without closing the active Chrome/app session.
- The P2-P5 page layout should use the wider canvas: compact top command center, tabs/sections for `Prepare`, `Evidence`, `Findings`, `Gate`, and fewer long vertical blocks.

### Phase language standard
- `Prepare` means review generated prep and run the recommended working session.
- `Upload` means upload completed session outputs and source files.
- `Review` means inspect uploaded/generated artifacts and mark usable evidence.
- `Findings` means inspect what AbarVa extracted from reviewed evidence.
- `Approve & Build` means Approve & Build will run the context extract, queue/generate phase deliverables, record approval, and prepare the next phase.

### Forbidden
- Do not imply a file was generated unless it exists in the Move artifact/File Cabinet lifecycle.
- Do not imply uploaded files are reviewed or approved just because upload succeeded.
- Do not use generic review copy for all artifacts.
- Do not close the operator’s browser/window from artifact `Open`.
- Do not use static template labels as proof that a readiness pack exists.
- Do not consume generated prep artifacts as approved evidence.

### Tests and validation
- Unit test: multi-file upload response renders each uploaded filename in the phase canvas.
- Unit test: uploaded evidence table distinguishes uploaded, reviewed, and approved statuses.
- Unit test: File Cabinet review panel renders artifact-specific content for at least two different artifact types.
- Browser test: `Open` artifact does not close the active tab/window and preserves current Move URL.
- Browser test: P2 first viewport clearly shows what to do now, generated prep/readiness pack state, evidence checklist state, and gate blocker state.
- Browser test: tabs guide the operator end to end with explicit CTAs: Prepare → Upload → Review → Findings → Approve & Build.
- Browser smoke P1-P5 on disposable Move proving each phase has a clear current action and gate path.

### Acceptance criteria
- A first-time operator can land on P2 and answer, without scrolling: what is this phase for, what do I do now, what evidence is needed, what has already been generated, and what blocks the next gate.
- After uploading multiple files, the operator sees all uploaded files immediately and can review/open/download each one.
- File Cabinet review is artifact-specific and no longer looks identical for every file.
- `Open` no longer closes the browser or loses the active workflow.
- P2-P5 use the same shell logic and terminology, so the workflow feels like one product instead of separate pages.

### Production readiness impact
Global-control-lane. This is shared Moves operator behavior for all tenants. Requires PR, release record, ACA deployment, runtime invariant proof, and signed-in browser proof before claiming live-proven.

### Codex-ready slice prompt
```text
Implement PROG27 — Moves phase operator clarity and evidence explorer usability.

Goal:
Make P1-P5 understandable and usable for a first-time operator. Show the current action, generated prep/readiness pack state, uploaded files, review status, blockers, and next action above the fold. Fix Files & Evidence review/open behavior.

Required:
- After multi-file upload, render every uploaded file in the phase canvas with status and actions.
- Replace vague “AbarVa asked for” copy with source-backed checklist language.
- Show whether a readiness/session pack was actually generated by the prior gate.
- Make File Cabinet review artifact-specific.
- Fix `Open` so it does not close the active browser/workflow.
- Use wider canvas and compact tables/tabs for P2-P5.
- Make tabs the workflow driver: Prepare → Upload → Review → Findings → Approve & Build, with explicit instructions and next-step CTAs on each tab.

Validation:
Run targeted Moves/File Cabinet tests, scoped lint, release:check, and signed-in disposable Move smoke across P1-P5.

Final response must include what was fixed, what remains separate under PROG26 readiness-pack generation, PR/deploy/proof status, and any live findings.
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
