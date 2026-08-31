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
The canonical current execution backlog and proof register are tracked in
[`SOURCE_NEW_EVENT_CANONICAL_EXECUTION_BACKLOG_2026-08-15.md`](./SOURCE_NEW_EVENT_CANONICAL_EXECUTION_BACKLOG_2026-08-15.md).

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

## Active Source 360 Data-Depth Follow-Ups — 2026-08-31

These items came from the current Source 360 data-depth and chart-readiness
audit. They are intentionally tracked separately from the broad redesign so the
executive workspace only speaks from deterministic, loaded, and visually proven
facts.

1. **SRC49 — Source chart mark and tab visual QA gate**
   - Priority: P0.
   - Type: visual QA / regression guard.
   - Scope: every chart-bearing Source 360 tab and subtab must be visited while
     mounted, and each expected chart must prove visible SVG/canvas marks rather
     than title text or legend text alone.
   - Acceptance: authenticated browser proof covers Verdict, Vendors,
     Contracts, Optimize, Evidence, Contract graph, and all Vendor subtabs;
     failing screenshots/DOM where a chart frame is blank are stored as proof;
     no tab is marked passed from HTTP 200 or text-only checks.
2. **SRC50 — Governed document and change-order depth load**
   - Priority: P0.
   - Type: data-plane / ACA job.
   - Scope: load and live-prove document page text and change-order rows through
     the governed Source pipeline before any UI claims page-span retrieval,
     amendment chronology, or change-order economics.
   - Acceptance: source files, Layer 2 adapter rows, Layer 3 canonical rows,
     Layer 4 read models, Source UI, and aVa citation bundles all reconcile; if
     page text or change orders are generated but not physically loaded, the
     product must label them unavailable.
3. **SRC51 — Utilization evidence quality gate**
   - Priority: P0.
   - Type: data-quality / claim guard.
   - Scope: block cross-vendor utilization claims when evidence rows use
     repeated template language or lack row-level system/source variation.
   - Acceptance: utilization evidence is either proven row-specific with source
     system, period, entitlement, active-use, and evidence reference fields, or
     the UI and aVa render `Not loaded` / `Not assessed` rather than a vendor
     utilization claim.
4. **SRC52 — Computed concentration-risk reconciliation**
   - Priority: P0.
   - Type: deterministic calculation / data-quality.
   - Scope: compute concentration risk from recorded annual value and vendor
     share instead of trusting asserted risk labels when the arithmetic
     disagrees.
   - Acceptance: Source displays computed concentration posture with the basis
     visible to operators; asserted labels are reconciled, downgraded, or
     quarantined before executive display.
5. **SRC53 — Renewal freshness and runway guard**
   - Priority: P0.
   - Type: deterministic calculation / claim guard.
   - Scope: past or non-active renewal dates must be excluded from forward
     runway and deadline claims unless a fresh renewal state is loaded and
     reconciled.
   - Acceptance: stale renewal rows remain visible as data-freshness work, not
     future commercial deadlines; active renewal exposure and expired/stale
     exposure reconcile separately.
6. **SRC54 — Legacy/golden evidence render decision**
   - Priority: P1.
   - Type: product proof / retirement decision.
   - Scope: verify whether older contract-evidence loaders are still live,
     renderable, and mapped to the current Source 360 evidence substrate. If
     not, archive or label them as historical proof rather than letting them
     imply current coverage.
   - Acceptance: each legacy evidence path is either mapped into the current
     governed layers with signed-in proof, or explicitly removed from demo and
     default operator narratives.

## Active Execution Control — 2026-08-15

Canonical execution plan:
[`SOURCE_NEW_EVENT_EXECUTION_PLAN_2026-08-15.md`](/Users/anand/Projects/nexus/docs/codex-handoff/SOURCE_NEW_EVENT_EXECUTION_PLAN_2026-08-15.md).

Immediate execution order:

1. **Closed safe cleanup:** PR #6349 was merged as
   `11300c4a9d95b01577547e264ea545667a9e1cd0`. It removed only an
   unreachable Source presentation panel. Current `main` containing this change
   has passed ACA main deploy (`31892068923`) and post-deploy crawl
   (`31892493437`), but this is runtime coverage, not a claim that a reachable
   Source workflow changed.
2. **Closed for the provisioned default scope — SRC-PROOF-001/SRC-PROOF-003:**
   PR #6363 and PR #6366 repaired the proof scope and Atlas visible answer
   shape. The deployed Atlas smoke gauntlet on
   `58a697259c5b28756ce51cbba3ee1c7ee7766973` passed `12/12` default-scope
   turns with `0` tenant leaks, `0` fallback turns, and `2/2` default-scope
   tenant sessions passed (`31891539660`).
3. **Still open — SRC-PROOF-002:** one active-client membership repair remains
   excluded from the default proof scope. Do not describe the proof lane as
   all-tenant complete until that repair is classified, applied with explicit
   approval, read back, and opt-in smoke-proven.
4. **Active — SRC-BACKLOG-001:** collapse duplicate SRC IDs and scattered
   handoff docs into one canonical roadmap with unique IDs, dependencies, proof
   bar, owner lane, demo impact rank, and explicit exclusions. Canonical current
   file:
   [`SOURCE_NEW_EVENT_CANONICAL_EXECUTION_BACKLOG_2026-08-15.md`](./SOURCE_NEW_EVENT_CANONICAL_EXECUTION_BACKLOG_2026-08-15.md).

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

Latest proof result after PR #6366:

- Deployed proof SHA: `58a697259c5b28756ce51cbba3ee1c7ee7766973`.
- ACA main deploy: passed, including runtime invariant and production health
  endpoint (`31891161508`).
- Post-deploy crawl: passed (`31891515211`).
- Atlas production CXO gauntlet smoke: passed for the provisioned default scope
  (`31891539660`).
- Result: `12/12` default-scope turns passed, `0` fallback turns, `0` tenant
  leak turns, `0` network interruptions, `6` four-section answers against `4`
  expected, and `2/2` default-scope tenant sessions passed.
- Caveat: the excluded active-client membership repair remains open. This is an
  explicit proof-scope decision, not an all-tenant proof claim.

New proof/backlog items from that result:

1. **SRC-PROOF-002 — Apex active-client resolution for signed-in Atlas proof**
   - Priority: P0.
   - Current execution slice: the Atlas smoke profile now defaults to the
     proof-ready Meridian and SkyHarbor tenants, with
     `ATLAS_GAUNTLET_INCLUDE_APEX=true` as the explicit opt-in path for Apex
     once active-client provisioning is repaired.
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
   - Current execution slice: Atlas rendered responses get a deterministic
     executive-readability pass that preserves the model answer, adds a
     concrete next action when missing, enforces the four-section shape for
     Copilot/industry questions, and scrubs visible raw signal IDs or legacy
     agent branding before API contract enforcement.
   - For Meridian and SkyHarbor, enforce the visible answer shape expected by
     the gauntlet: consistent next action, required four-section response when
     requested, concise executive structure, and no visible-answer-contract
     `422` for signal-ID/plain-English questions.
   - Acceptance: rerun Atlas smoke on deployed SHA and show `status200`,
     four-section count, next-action checks, leak checks, and pass count moving
     to the agreed threshold.

## Backlog Items

---

## SRC-DEMO-HARDENING-20260828 — Final Source demo hardening punch list

**Priority:** P0
**Status:** mostly closed; file-cabinet route remains intentionally excluded from the live demo path
**Type:** QA / demo hardening
**Primary surface:** Source Contract 360, Source aVa, Source demo path
**Primary agent:** Nexus
**Dependencies:** governed Source depth load, signed-in tenant-scoped proof lane

### Purpose

Close the last high-signal demo-readiness gaps with the lowest-risk checks and fixes before the
Source Vendor/Contract 360 walkthrough.

### Workflow and data requirements

- Run a small signed-in Source aVa check after explicit chat-record approval: ask why the selected
  contract is actionable, what remains missing before value can be claimed, and one cross-tenant
  pricing isolation probe. Treat posted prompts and responses as tenant-scoped records.
- Repair or suppress the malformed 5-digit contract date currently visible as `20210-12-31` before
  clicking that contract in a live walkthrough.
- After the contract-depth load lands, regression-check the already-proven Contract 360 pivots so
  the new performance/spend slice does not break existing rendered detail pages.
- Do not open retired event-detail/file-cabinet slugs live. The canonical Source workspace and
  Contract 360 paths are the demo path; stale event slugs now land in the Source access guard, not a
  Home redirect.

### Acceptance criteria

- Closed: Source aVa returns evidence-bounded answers for selected-contract actionability and value
  readiness, and blocks the cross-tenant probe before retrieval without leaking pricing or vendor
  detail.
- Closed: The malformed 5-digit contract date is no longer visible on the checked demo-path tabs.
- Closed: Previously proven Contract 360 pages still load without error text, cross-tenant strings,
  or missing-tab regressions after the depth load and aVa routing fixes.
- Still excluded: Demo-driver notes must continue to avoid retired event-detail/file-cabinet slugs;
  the live check shows a tenant-safe access guard for the stale slug, not a working artifact route.

### Latest proof notes

- PASS: signed-in Source aVa proof captured the actionability prompt, value-readiness prompt, and
  cross-tenant isolation probe against the selected-contract workflow.
- PASS: signed-in Contract 360 regression proof checked the already-proven pivot contracts across
  Story, Evidence, and Optimize.
- PASS: signed-in malformed-date proof checked the affected contract across Story, Economics,
  Relationship, and Evidence.
- PASS: signed-in file-cabinet/event-detail check confirmed the stale event slug no longer redirects
  to Home and does not leak another tenant; it lands in the Source access guard because the slug is
  not a current Meridian event.
- PASS: signed-in default-route ECL browser proof confirmed Home, Source, Tower, and Intelligence
  render the governed serving projection without provider query strings: 10/10 demo findings and
  40/40 named surfaces passed.

### Codex-ready slice prompt

```text
Execute SRC-DEMO-HARDENING-20260828.

Scope:
Run the small signed-in Source aVa smoke after explicit chat-record approval, repair or suppress the
malformed 5-digit contract date if it remains on the demo path, regression-check the already-proven
Contract 360 pages after the Source depth load, and add a demo-driver note to avoid retired
event-detail/file-cabinet slugs in favor of the canonical Source workspace and Contract 360 path.

Validation:
Capture signed-in transcript proof for aVa, before/after date evidence or an explicit avoid-click
note, Contract 360 regression screenshots, and the demo-driver route exclusion note.
```

---

## SRC-VENDOR360-GROUPED-VENDOR-VIEW — Make vendor rollups navigable and searchable

**Priority:** P1
**Status:** done
**Type:** UI / projection consumption
**Primary surface:** Source Vendor portfolio, Source Vendor 360
**Primary agent:** Nexus
**Dependencies:** `source.vendor_contract_portfolio`, Source workspace navigation model

### Purpose

Turn the already-computed vendor rollup into an operator-usable Vendor portfolio / Vendor 360 flow,
instead of exposing it only as proof-layer row counts and separate top-contract rows.

### Workflow and data requirements

- The Serving Surfaces row should use real controls or links when a surface is named as available.
- Vendor portfolio should render a searchable list of vendors with contract count and annual value
  from the governed vendor rollup.
- Selecting a vendor should show the vendor's grouped contracts in one place before the operator
  pivots into individual Contract 360 pages.
- Do not create new data or re-compute vendor concentration in the UI; consume the existing governed
  vendor rollup projection.

### Acceptance criteria

- Closed: Clicking Vendor portfolio / Vendor 360 from the live Source workspace changes the active view or
  route in an accessible, keyboard-operable way.
- Closed: The vendor list displays governed rollup rows and supports finding a specific vendor by name.
- Closed: A selected vendor view shows all contracts for that vendor together with annual value, term, gate,
  and source-document state.
- Closed: Signed-in proof confirms the surface is tenant-clean and visually presentable.

### Latest proof notes

- PASS: signed-in Vendor portfolio click-through shows 102 vendor rollups and `$492.5M` annual
  contract value from the governed projection.
- PASS: vendor search filters to Epic Systems Corporation and shows the expected grouped rollup:
  5 contracts and `$50.9M` annual contract value.
- PASS: Epic Vendor 360 groups `CTR-0004`, `CTR-0005`, `CTR-0006`, `CTR-0007`, and `CTR-0008` in
  one vendor view with no load-error text or cross-tenant strings.
- Caveat: the grouped view has no mapped critical applications, platforms, or initiatives for this
  vendor, so demo narration should not imply Epic-specific dependency mapping is loaded.

### Codex-ready slice prompt

```text
Implement SRC-VENDOR360-GROUPED-VENDOR-VIEW.

Scope:
Make the Source Vendor portfolio / Vendor 360 surface row actionable and render a searchable
vendor-rollup view backed by source.vendor_contract_portfolio. Selecting a vendor should show its
contracts grouped together and preserve the existing Contract 360 drill path.

Validation:
Add focused UI/model tests for actionable surface controls, vendor search, grouped vendor contracts,
and tenant-clean signed-in proof. Do not introduce new data-plane writes.
```

---

## SRC71 — Source artifact decision-package story contract

**Priority:** P0
**Status:** done
**Type:** design contract / prompt governance
**Primary surface:** Source New Event artifacts
**Primary agent:** Atlas
**Dependencies:** Source artifact catalog, Source prompt registry, artifact upstream graph

### Purpose

Define the decision-package story contract for the 33 Source New Event artifacts so generated
deliverables tell one executive decision story instead of 33 isolated documents.

### Workflow and data requirements

- Preserve the canonical artifact catalog and upstream graph.
- Group artifacts into six decision packages:
  - Strategy & Scope
  - RFP & Responses
  - Evaluation & Pricing
  - BAFO & Executive Decision
  - Selection & Transition
  - Value
- Mark only package story artifacts as `narrative_leader`; companion artifacts support evidence
  and should not repeat full package-level narrative framing.
- Selection and Transition remain one package with two narrative beats: selection decision and
  transition authorization.
- Add an executive-editor pass contract for narrative leaders only. It may improve executive
  flow and resolve contradictions by naming evidence, but it must not invent facts or rewrite
  companion artifacts.

### Acceptance criteria

- Every canonical artifact code resolves to a package and role.
- Every narrative leader has non-empty decision framing.
- Legacy suffixed prompt keys resolve through the same base contract without changing legacy keys.
- Companion prompts do not carry package-level why-now framing verbatim.
- Tests guard the contract against catalog and prompt drift.
- No tenant data, production artifacts, runtime routes, migrations, or live generation behavior are
  changed by this slice.

### Codex-ready slice prompt

```text
Implement SRC71 — Source artifact decision-package story contract.

Scope:
Add a typed story contract to the Source prompt registry that maps each canonical artifact to one
of six decision packages and either narrative_leader or companion. Add an executive-editor pass
contract for narrative leaders only. Preserve the existing upstream graph, evidence binding,
legacy prompt keys, and runtime generation behavior.

Validation:
Add prompt-reachability tests that prove every canonical artifact resolves to a package/role,
narrative leaders carry decision framing, legacy prompt keys resolve to their base contract, and
companions do not repeat package-level why-now framing verbatim.
```

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
