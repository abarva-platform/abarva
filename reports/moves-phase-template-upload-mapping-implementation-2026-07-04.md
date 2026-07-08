# Moves — Phase Template + Upload Mapping (implementation report)

**Date:** 2026-07-04 · **Slice:** typed phase-template + upload-mapping intelligence layer for the Moves phase workspace, with the Lakeshore Legal Contract Intake demo. Target UX reference: `Moves Phase Workspace · standalone (1).html` (Claude Design).

## 1. Executive verdict

Delivered **increment 1 of 2**: a **real, typed data/intelligence layer** (`src/lib/programs/phase-templates/`) that makes the phase workspace phase-specific and use-case-aware — governed template catalog, upload classification, section→building-block-lane mapping, next-phase Inputs Packs, and the Dynamic Solution Pattern Assembly packet + validator — plus proof artifacts and 12 passing tests. It is **self-contained, strict-typecheck-clean, and does not touch the fragile 2,700-line phase client**, so it merges safely even though `main` is currently red for unrelated reasons.

**Increment 2 (UI cards + wiring into the phase workspace)** is scoped with integration points identified but intentionally **not shipped in this slice** — it cannot be validated against the currently broken `main`, and surgically editing the live `StrategicMovePhaseClient` shouldn't be rushed. The typed layer + fixture are built precisely so the UI increment can consume them directly.

## 2. What was implemented

New module `src/lib/programs/phase-templates/` (greenfield — did not exist):
- `building-blocks.ts` — the 10 governed blocks (industry-agnostic keys + client-friendly labels).
- `types.ts` — `MovePhaseTemplateDefinition`, `MoveTemplateUploadClassification`, the four next-phase packs (`P3DesignInputsPack`, `P4WorkstreamInputsPack`, `P5MobilizationInputsPack`, `TowerMeasurementInputsPack`), `PatternAssemblyPacket`, `ValidatedPatternItem`.
- `catalog.ts` — **28 templates** across P2..Tower with section→lane mappings.
- `classification.ts` — `classifyUpload()` (Move-scoped by default; no auto-promotion).
- `pattern-assembly.ts` — `buildPatternAssemblyPacket()` + `validateAssembledResponse()` (governed AbarVa↔Claude loop; overreach + unbacked-number guards).
- `fixtures/lakeshore-legal.ts` — the deterministic Lakeshore Legal demo fixture.
- `__tests__/phase-templates.test.ts` — 12 tests.

## 3. UX changes

**None shipped in this increment** (data layer only). Increment 2 will add these client-friendly cards (HTML tokens: `--bg #f7f5f1`, `--ink #1a1a18`, `--blue #0057b8`, `--green #1d8f68`, cream/muted), each driven by the typed layer + fixture:
`PhaseCompletionGuideCard` · `PhaseTemplatesAndSessionsCard` · `CurrentStateAssessmentMap` · `BuildingBlockLaneCanvas` · `UploadMappingSummaryCard` · `NextPhaseReadinessPackCard` · `SolutionOptionsCanvas` · `BlockToWorkstreamPreview` · `ClientFinalReviewCard`.
Integration point: compose them behind the existing phase page (`src/components/strategic-moves/StrategicMovePhaseClient.tsx`) without altering the existing upload/download/review flow.

## 4. Data / intelligence layer changes

Real typed model (not UI-only mock). Mirrors `src/lib/source/analytics/*`. Key contracts:
- **Templates are governed data.** Each declares phase, client purpose, audience, session type, format, supported blocks, required/optional sections, parsed-output types, next-phase inputs created, sample questions, and use-case examples.
- **Uploads are classified deterministically** into Move-scoped intelligence (current-phase findings + next-phase inputs) with an explicit `moveScopedOnly: true` and `enterprisePromotionEligibility: 'not_eligible'`.
- **Pattern Assembly is governed:** AbarVa builds the packet (context/evidence/blocks/readiness/constraints/required outputs); a validator labels each assembled item `evidence_backed | assumption | needs_confirmation | not_allowed | draft_artifact | promote_candidate`. Overreach vs. low control readiness → `not_allowed`; unbacked numbers → `needs_confirmation`.

## 5. Template catalog summary

**28 templates** — P2: 6 · P3: 6 · P4: 6 · P5: 5 · Tower: 5. Machine-readable: `proof/moves-phase-template-upload-mapping-2026-07-04/template-catalog.{json,csv}`.
- P2: Interview Guide · Process Walkthrough · Systems & Data Inventory · Pain/Root-Cause Summary · Business Appetite for Change · Current-State Final Review.
- P3: Solution Options Canvas · Tradeoff Matrix · Human+AI Work Split · Architecture Constraints · Controls & Guardrails · Decision Summary.
- P4: Roadmap Workstream · Cost/Effort · Value Assumptions · Risk/Readiness · Tower Metrics · Finance/Sponsor Review.
- P5: RACI · Launch Readiness · Training/Change · Approval Conditions · Handoff Review.
- Tower: Measurement Contract · Metric Owner Matrix · Review Cadence · Escalation Threshold · Value Realization Review.

## 6. Upload classification model

`MoveTemplateUploadClassification`: uploadId, moveId, phase, inferredTemplateId, confidence, uploadCategory (`raw_evidence | interview_output | workshop_output | review_summary | final_artifact`), supportedBuildingBlocks, parsedOutputs, currentPhaseFindingsUpdated, nextPhaseInputsUpdated, isClientFinal, `moveScopedOnly`, `enterprisePromotionEligibility`, needsHumanReview, and a plain-English `clientFacingSummary` (whatWeFound / mappedTo / usedFor / nextStepPrepared / "Not added to enterprise context yet.").

## 7. Section-to-building-block mapping model

Every template section declares `mappedBlocks: BuildingBlockKey[]` + `parsedOutputs`. All 10 blocks are used; the block set is closed (subtypes, not new top-level blocks). This is what lets a P3 decision-summary upload resolve to the controls lane + human-in-loop lane + selected approach + deferred options deterministically.

## 8. Next-phase Inputs Pack model

Typed packs carry the feed-forward the spine describes: **P2→P3** (required-field contract, approval checkpoints, control boundaries, Tower metric candidates, open questions); **P3→P4** (selected approach, deferred options, architecture constraints, workstream candidates, controls, value assumptions); **P4→P5** and **P5→Tower** likewise. A phase never starts blank.

## 9. Lakeshore Legal demo scenario

Fixture: `proof/moves-phase-template-upload-mapping-2026-07-04/lakeshore-legal-demo-fixture.json`. Move = Legal Contract Intake & Obligation Control; bundle = process · data · workflow · human-in-loop · controls · value. P2 assessment map covers process/systems/data/people/controls/appetite/baselines/root-causes/open-questions with status; P3 options A/B/C with B recommended and autonomy deferred; P3 decision-summary upload classified to selected approach + deferred + controls + human-in-loop + P4 inputs; P4 lanes→workstreams with owners/deps/risks/metrics.

## 10. Healthcare provider applicability

The blocks are industry-agnostic; only evidence asks, controls, metrics, and examples are industry-aware. Templates carry `examplesByUseCase.healthcare_provider` where relevant (e.g., prior-auth intake, fragmented claims/EMR/pharmacy data). The same catalog + classifier serve the provider portfolio in `docs/build/moves-design/MOVES_PORTFOLIO_HEALTHCARE_PLAYBOOK.md` without new top-level blocks.

## 11. Files changed

New: `src/lib/programs/phase-templates/{building-blocks,types,catalog,classification,pattern-assembly,index}.ts`, `fixtures/lakeshore-legal.ts`, `__tests__/phase-templates.test.ts`. Proof: `proof/moves-phase-template-upload-mapping-2026-07-04/{template-catalog.json,template-catalog.csv,lakeshore-legal-demo-fixture.json}`. Docs: this report + the release record.

## 12. Tests run

- **Jest — 12/12 pass** (`npx jest src/lib/programs/phase-templates`): catalog ≥20; every template complete; P2/P3 required sets; P3-decision-summary mapping (selected approach + deferred + controls + human-in-loop + P4 inputs); Move-scoped default; no automatic enterprise promotion; P2→P3 pack; P3→P4 pack; no internal jargon; pattern-assembly overreach + unbacked-number guards.
- **Scoped strict `tsc --noEmit` — exit 0** on the module (self-contained, no `@/` deps).
- **Proof emission** compiled and ran cleanly; JSON/CSV valid; 28 rows.

## 13. Screenshots / proof

No UI in this increment → no screenshots. Proof = the JSON/CSV/fixture artifacts + passing tests above.

## 14. Known gaps / non-claims

- **UI not wired yet** (increment 2). No component renders this layer in the app; acceptance criteria that concern on-screen behavior are not met by this increment.
- **No real DOCX/XLSX generation.** The catalog defines templates + formats; "Download template" would be backed by placeholder/static docs or a future route.
- **`classifyUpload` uses provided/parsed outputs or template defaults** — it does not parse real document contents (no NLP extraction in this slice).
- **`main` is red for unrelated reasons** (pre-existing typecheck/ESLint failures from another feature merge — see `~/Downloads/broken-main-health-report-2026-07-07.md`). This slice was validated with targeted jest + scoped tsc; a full-project build was not run because it is already broken independently of this change.
- This is a demoable foundation, not a shipped end-to-end phase workspace.

## 15. Recommended next backlog

1. **Increment 2 — UI:** build the 9 cards against the HTML tokens; compose them behind `StrategicMovePhaseClient` without touching existing upload/review flows; drive with the fixture.
2. Wire the phase page to call `buildPatternAssemblyPacket` → (Claude synthesis) → `validateAssembledResponse` for the "assembled + labeled" findings.
3. Add "Download template" (static/sample docs first) + real upload→`classifyUpload` binding, Move-scoped.
4. Component/interaction tests for the cards; a preview screenshot for proof.
5. Fix `main` first (separate) so the full build validates the wiring.
