# Track 04 — Source Commercial

## Purpose

Complete the Source/Outsourcing workflow from dashboard through vendor selection readiness, while staying deterministic and evidence-aware.

## Current state

Dashboard, event canvas, Scope, RFP readiness, data readiness, vendor response completeness, pricing normalization, BAFO, executive decision, stage gates, and artifacts are substantially built. Vendor selection readiness is next.

## Target state

A coherent sourcing operating workspace that answers: what is ready, what is blocked, what should we negotiate, and are we ready for selection review?

## Source New Event best-in-class program

The broader Source New Event vision is tracked in
[`SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md`](./SOURCE_NEW_EVENT_BEST_IN_CLASS_PROGRAM.md).
The current holistic 11-stage operating-design candidate is tracked in
[`SOURCE_NEW_EVENT_SRC48_OPERATING_DESIGN.md`](./SOURCE_NEW_EVENT_SRC48_OPERATING_DESIGN.md).
The active execution tracker and ranked remaining backlog are tracked in
[`SOURCE_NEW_EVENT_EXECUTION_TRACKER_2026-08-14.md`](./SOURCE_NEW_EVENT_EXECUTION_TRACKER_2026-08-14.md).

The holistic Source vendor value excellence program is tracked in
[`SOURCE_VENDOR_VALUE_EXCELLENCE_PROGRAM.md`](./SOURCE_VENDOR_VALUE_EXCELLENCE_PROGRAM.md).
It connects New Event, Optimize Contract, Vendor/Contract 360, evidence
contracts, aVa, artifact quality, guidebooks, and market differentiation into
one signoff-driven execution plan.

The first execution packet for that program is tracked in
[`SOURCE_VENDOR_VALUE_EXECUTION_PACKET_SVV01_SVV02.md`](./SOURCE_VENDOR_VALUE_EXECUTION_PACKET_SVV01_SVV02.md).
It is the current review candidate for `SVV01` and `SVV02`: holistic Source IA,
the evidence/data contract, parser lifecycle, value-state rules, and the first
implementation slice order.

Before starting additional New Event implementation beyond the current narrow
backlog slices, use the operating design and execution tracker to do the
holistic 11-stage design review first, then execute incrementally with explicit
PR, QA, ACA deploy, runtime invariant, and signed-in browser proof gates.

Before starting major Optimize Contract, Vendor/Contract 360, Source data model,
or aVa Source intelligence changes, use the vendor value excellence program to
produce the design packet, secure review/signoff, and split implementation into
independently testable slices.

## Active Execution Control — 2026-08-15

Canonical execution plan:
[`SOURCE_NEW_EVENT_EXECUTION_PLAN_2026-08-15.md`](/Users/anand/Projects/nexus/docs/codex-handoff/SOURCE_NEW_EVENT_EXECUTION_PLAN_2026-08-15.md).

Immediate execution order:

1. **Closed safe cleanup:** PR #6349 was merged as
   `11300c4a9d95b01577547e264ea545667a9e1cd0`. It removed only an
   unreachable Source presentation panel and must still receive SHA-specific
   ACA deploy, runtime invariant, and post-deploy crawl proof before being
   called live-proven.
2. **SRC-PROOF-001 — Signed-in proof lane repair:** Move the Atlas production
   CXO gauntlet from legacy human demo accounts to durable non-human agent
   identities, use Clerk testing-token bootstrap, and rerun smoke/full gauntlet.
   The latest known gauntlet failure was auth-blocked before tenant turns, so
   CXO quality was not evaluated in that run.
3. **SRC-BACKLOG-001 — Backlog consolidation:** Collapse duplicate SRC IDs and
   scattered handoff docs into one canonical roadmap with unique IDs,
   dependencies, proof bar, owner lane, demo impact rank, and explicit
   exclusions.

Do not start another visual cleanup slice by default. After proof/backlog
control, execute value-driving product work in this order:

1. New Event workflow reference slice, starting with Scope.
2. Vendor response intelligence for large proposal packages.
3. Evaluation scoring and rater/weight governance.
4. Pricing comparability and BAFO leverage.
5. Selection readiness.
6. Executive Decision and advisory story pack.
7. Transition and Tower/Finance-confirmed Value handoff.

Proof discipline:

- PR checks are not live proof.
- ACA deploy completion is not live proof.
- HTTP 200 is not live proof.
- Signed-in route/crawl/gauntlet evidence is required for protected product
  surfaces.
- Auth blockers must be reported as auth-blocked, not product-passed.

Latest proof result after PR #6353:

- Deployed SHA: `cc006f71e10cb4550bb5b3d6cc5dca98b3bce1c0`.
- ACA main deploy: passed, including runtime invariant and production health
  endpoint (`31882344995`).
- Atlas production CXO gauntlet smoke: failed but advanced past the prior
  harness blocker (`31882722216`).
- What improved: the gauntlet now uses non-human agent identities, Clerk
  testing-token bootstrap, tenant-key API requests, and 429 retry behavior. The
  run completed all 18 expected turns with no aborted sessions, no fallback
  turns, no tenant leak turns, and no network interruption turns.
- Remaining P0 proof gap: Apex Retail still resolves to
  `{"error":"no_client","detail":"No active client for this user"}` even with
  `abarva_active_client=apexretail`; do not count Apex Atlas as proof-ready
  until active-client/membership resolution is fixed or an approved proof scope
  excludes Apex.
- Remaining P0 answer-quality gap: Meridian/SkyHarbor produce live `200`
  Atlas answers, but the smoke quality bar failed: only 1 of 18 turns passed,
  0 of 6 required four-section answers passed, and most failures are missing
  the required next-action shape. One Meridian signal-ID question hit the
  visible-answer contract with HTTP `422`.

New proof/backlog items from that result:

1. **SRC-PROOF-002 — Apex active-client resolution for signed-in Atlas proof**
   - Priority: P0.
   - Decide whether Apex is in the required production proof scope. If yes,
     repair/provision the Apex active-client and membership path so
     `apexretail-agent@abarva.example.com` can resolve a real active client
     without bypassing tenancy. If no, remove Apex from the Atlas gauntlet with
     a tracked proof-scope decision rather than leaving a known failing tenant
     in the required smoke.
   - Hard gate: do not mutate production auth/data membership without explicit
     operator classification, command preview, and readback proof.
2. **SRC-PROOF-003 — Atlas CXO response shape quality bar**
   - Priority: P0.
   - For Meridian and SkyHarbor, enforce the visible answer shape expected by
     the gauntlet: consistent next action, required four-section response when
     requested, concise executive structure, and no visible-answer-contract
     `422` for signal-ID/plain-English questions.
   - Acceptance: rerun Atlas smoke on deployed SHA and show `status200`,
     four-section count, next-action checks, leak checks, and pass count moving
     to the agreed threshold.

## Backlog Items

---

## SRC47 — Source event archive and stale fact cleanup

**Priority:** P0
**Status:** pending
**Type:** operator / governance hygiene
**Primary surface:** Source event portfolio, event evidence ledger, Source facts
**Primary agent:** Nexus
**Dependencies:** Source event/fact read-model access, object storage archive path

### Purpose

Provide an operator-safe cleanup path for rehearsal or superseded Source events so they leave active portfolio views without deleting the audit record or touching canonical contract/vendor data.

### Workflow and data requirements

- Archive the event record so it no longer appears in active/in-flight Source lists.
- Archive uploaded event blobs alongside the event record.
- Before any mutation, report `source_event_facts` counts grouped by `fact_key` for the event.
- Mark event-scoped facts `is_stale = true` rather than deleting them.
- Verify from the live database whether any event facts were promoted to enterprise context before declaring cleanup complete.
- Do not touch Contract 360, vendor register, canonical contract tables, or tenant-wide Source projections.

### Acceptance criteria

- Target events are absent from active/in-flight Source portfolio views.
- Uploaded blobs remain auditable but are archived with the event.
- Event facts are stale-flagged and no longer available to non-stale readers.
- Enterprise-context promotion status is explicitly reported from live DB evidence.
- The cleanup is event-scoped and cannot mutate canonical contract/vendor records.

### Codex-ready slice prompt

```text
Implement SRC47 — Source event archive and stale fact cleanup.

Scope:
Build or run the narrow operator path for archiving superseded Source events, associated uploaded blobs, and event-scoped parsed facts. Use `is_stale = true` for facts, with a pre-flip fact-key count and live DB verification of enterprise-context promotion status. Do not touch Contract 360, vendor register, canonical contract tables, or tenant-wide projections.

Validation:
Show pre/post event visibility, fact stale counts, blob archive evidence, and enterprise-context verification. Treat this as operator/governance hygiene, not a data reload.
```

---

## SRC39 — Vendor selection readiness model

**Priority:** P0
**Status:** done
**Type:** feature
**Primary surface:** Source event canvas
**Primary agent:** Atlas
**Dependencies:** Executive decision summary, Stage gates, Commercial signals

### Purpose

Create deterministic readiness synthesis to determine if event is ready for selection review.

### Primary question answered

Are we ready to recommend a vendor for selection review?

### Workflow and UX requirements

- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats

- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files

- src/lib/source/vendor-selection-readiness.ts
- src/lib/source/vendor-selection-readiness-types.ts
- tests
- review doc

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

- Seeded event is not ready if blockers remain.
- Viable and blocked vendors are explicit.
- No final selection automation.

### Codex-ready slice prompt

```text
Implement SRC39 — Vendor selection readiness model.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```

---

## SRC40 — Vendor selection readiness panel

**Priority:** P0
**Status:** done
**Type:** feature
**Primary surface:** Source event canvas
**Primary agent:** Atlas
**Dependencies:** None

### Purpose

Show selection readiness in the event canvas without final selection/approval automation.

### Primary question answered

What still blocks selection review?

### Workflow and UX requirements

- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats

- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files

- SourceVendorSelectionReadinessPanel.tsx
- event canvas integration
- panel tests
- review doc

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
Implement SRC40 — Vendor selection readiness panel.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```

---

## SRC41 — Vendor selection readiness smoke coverage

**Priority:** P0
**Status:** done
**Type:** test
**Primary surface:** Source tests
**Primary agent:** Steward
**Dependencies:** None

### Purpose

Prove event canvas can surface selection readiness and does not imply final award decision.

### Primary question answered

Is selection readiness deterministic and safe?

### Workflow and UX requirements

- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats

- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files

- source-event-canvas-shell.test.ts
- source-vendor-selection-readiness\*.test.ts

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
Implement SRC41 — Vendor selection readiness smoke coverage.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```

---

## SRC42 — Commercial active canvas tab consolidation

**Priority:** P1
**Status:** done
**Type:** feature
**Primary surface:** Source event canvas
**Primary agent:** Nexus
**Dependencies:** SRC39, SRC40

### Purpose

Unify Source commercial tabs/panels into a coherent active canvas without clutter.

### Primary question answered

Can the user navigate Summary, Pricing, BAFO, Risks, Readiness, Missions, Signals, Linked Program?

### Workflow and UX requirements

- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats

- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files

- src/\*\* where scoped
- tests under src/**tests**/integration/\*\*
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
Implement SRC42 — Commercial active canvas tab consolidation.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```

---

## SRC43 — Pricing completeness drilldown

**Priority:** P1
**Status:** done
**Type:** feature
**Primary surface:** Source pricing
**Primary agent:** Nexus
**Dependencies:** Pricing normalization

### Purpose

Show missing sections, assumptions, transition vs steady-state, exclusions, and comparability gaps.

### Primary question answered

Why is this vendor not comparable?

### Workflow and UX requirements

- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats

- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files

- src/\*\* where scoped
- tests under src/**tests**/integration/\*\*
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
Implement SRC43 — Pricing completeness drilldown.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```

---

## SRC44 — BAFO scenario compare

**Priority:** P1
**Status:** done
**Type:** feature
**Primary surface:** Source BAFO
**Primary agent:** Atlas
**Dependencies:** None

### Purpose

Show conservative/base/stretch deterministic negotiation scenarios with caveats.

### Primary question answered

What can we realistically improve in BAFO?

### Workflow and UX requirements

- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats

- Seeded vendor assumptions and risks.
- No fake savings; all values must be deterministic and caveated.

### Expected files

- src/\*\* where scoped
- tests under src/**tests**/integration/\*\*
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
Implement SRC44 — BAFO scenario compare.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```

---

## SRC45 — Transition readiness placeholder surface

**Priority:** P2
**Status:** pending
**Type:** feature
**Primary surface:** Source Transition stage
**Primary agent:** Steward
**Dependencies:** None

### Purpose

Prepare next stage after selection: KT, access, retained/vendor responsibilities, Day 1 readiness.

### Primary question answered

Can this move into transition safely?

### Workflow and UX requirements

- Must be workflow-oriented, not a generic dashboard.
- Must show known / missing / blocked / next action.
- Must show deterministic vs live caveat where relevant.

### Data contract and caveats

- Seed/demo data today must map to real data tomorrow.
- Do not fabricate evidence.
- If data is missing, disclose missing context and block/downgrade confidence.

### Expected files

- src/\*\* where scoped
- tests under src/**tests**/integration/\*\*
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
Implement SRC45 — Transition readiness placeholder surface.

Use Codex Spark Medium by default. Follow PR lifecycle, production-readiness, and design compliance gates from `docs/planning/abarva-master-backlog/BACKLOG_OPERATING_MODEL.md`.

Scope:
Implement the slice described above with the allowed files only. Do not add model calls, upload/parsing, persistence, workflow engine, or unrelated UI.

Final report must include PR link, merge commit, files changed, validation results, production-readiness impact, and exclusions.
```

---

## SRC46 — Contract optimization advisory story pack

**Priority:** P0
**Status:** pending
**Type:** feature
**Primary surface:** Source contract optimization exports and event canvas
**Primary agent:** aVa
**Dependencies:** Source P2 Slice 7 visual-story proof, `CXO-ARTIFACT-STORYTELLING-CONTRACT.md`

### Purpose

Turn the existing AMS contract optimization brief from a strong evidence report
into a consulting-grade advisory story pack that proves the executive narrative,
not just the facts.

### Primary question answered

What executive story should the CIO/CFO/CPO believe, what should they do next,
and what happens if they do nothing?

### Workflow and UX requirements

- Must lead with a three-sentence executive message.
- Must show a value tree or exposure bridge for where money/value is leaking.
- Must explain why it happened as an operating/commercial mechanism.
- Must show an action timeline: today -> cure notice -> reconciliation -> vendor
  response -> executive decision -> renew with conditions or competitive event.
- Must organize negotiation levers by themes:
  - commercial recovery,
  - service accountability,
  - operating model,
  - future cost reduction,
  - competitive pressure.
- Must include a Commercial Opportunity Map:
  - recover cash,
  - reduce future spend,
  - reduce operational risk,
  - increase vendor accountability.
- Must include a do-nothing vs renegotiate scenario.
- Must map every material finding to revenue, cost, risk, speed, customer and/or
  compliance.
- Must keep detailed findings in a procurement appendix when they interrupt the
  executive story.

### Data contract and caveats

- Do not invent exposure, savings, recovery or productivity values.
- Non-quantified items must remain "value to be quantified during vendor cure
  review" or equivalent.
- The executive visuals must be generated from deterministic Source
  contract-optimization view models.
- Missing evidence must be explicit and assigned to an owner/gate.

### Expected files

- Source contract optimization story view model
- Source contract optimization board-pack PDF/DOCX renderer
- Source event canvas story pack panel or tab
- aVa answer update for story-specific prompts
- Tests for story spine, business-impact mapping and visual/exhibit presence
- Proof bundle with live signed-in screenshots and exported PDF/DOCX pages

### Forbidden

- No generic document Q&A.
- No broad Source page redesign.
- No fabricated values or unsupported recovery claims.
- No decorative charts without decision use.
- No hidden scaffold/internal labels in exported artifacts.

### Tests and validation

- Targeted Jest for story contract and renderer output
- Scoped ESLint
- npx tsc --noEmit --pretty false
- npm run release:check
- Signed-in SkyHarbor browser proof
- DOCX/PDF visual QA of all story pages, not only endpoint/text checks

### Acceptance criteria

- Page 1 has the three-sentence executive message.
- Page 2 has the value tree/exposure bridge.
- Page 3 explains why the commercial model created the exposure.
- Page 4 has the action timeline.
- Page 5 has negotiation themes and Commercial Opportunity Map.
- Do-nothing vs renegotiate scenario is visible.
- Business-impact scorecard maps findings to revenue/cost/risk/speed/customer/compliance.
- Procurement appendix preserves detailed evidence and caveats.
- aVa can answer "what story should I tell the steering committee?" without
  repeating a raw findings list.
- Exported DOCX/PDF are visually inspected and score 9.0+ for CXO readability.

### Codex-ready slice prompt

```text
Implement SRC46 — Contract optimization advisory story pack.

Base on `CXO-ARTIFACT-STORYTELLING-CONTRACT.md` and
`src/lib/artifacts/cxo-storytelling-contract.ts`.

Scope:
Create the Source contract optimization story view model and board-pack render
path that turns the current AMS optimization evidence into a consulting-grade
story: executive message, value tree/exposure bridge, why-it-happened,
action timeline, negotiation themes, Commercial Opportunity Map, do-nothing vs
renegotiate scenario, business-impact scorecard and procurement appendix.

Do not build generic document Q&A. Do not invent values. Preserve the existing
findings, levers, exposure rollup and recommendation behavior.

Final report must include PR link, merge commit, validation results, live
signed-in proof, DOCX/PDF visual QA, proof ZIP path and known caveats.
```
