# 2026-10-06-phase-capture-evidence-hold — A captured phase that cannot continue says why

## Release ID

`2026-10-06-phase-capture-evidence-hold`

## Status

`candidate`

## Plain-English Summary

In the redesigned Moves phase capture, the Continue button is switched off until
every question in the step is complete. A question is also reported incomplete
when the phase's required evidence check has not passed — and from the design
phase onward, none of the questions carry an evidence requirement of their own,
so a single open evidence item marks every question on the phase as incomplete.

The result was a dead end. Someone could answer every question on a late-phase
step, see each one saved, and still find Continue switched off, with the only
explanation a small per-field marker. The one sentence the product did produce
said "Complete N phase inputs before Approve & Build" — counting questions that
were already complete, never mentioning evidence, and naming no control on the
screen that could clear it. The evidence in question is not collected on that
screen at all; it is reviewed and approved in Files & Evidence.

This change makes the held step state its real reason. When every question is
answered and saved and the phase is held only by open evidence, the step shows
which required evidence is still open, says it is closed in Files & Evidence,
and offers a control that opens it. When a question genuinely is unanswered,
the wording is unchanged — that work is on the same screen, so it stays the
stated reason and the evidence band does not appear.

Nothing is loosened. A phase held by open evidence is held exactly as before;
only the explanation changes.

## Layer Impact

Lane: `global-control-lane` — shared product behaviour for all clients, behind no
flag of its own.

- **Products (Moves)** — the phase capture step and the Approve & Build control
  now explain an evidence hold instead of misreporting it as unfinished
  capture. No change to what is held or to who may advance a phase.
- No change to the canonical model, source adapters, or client intake. No
  schema, migration, or data-plane change.

## Client Applicability

- All clients: yes, wherever the redesigned 3-step capture is already enabled.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The behaviour rides the existing capture flow; with
  that flow off, the legacy canvas gets the corrected sentence on its own build
  control and nothing else changes.

## Changes Included

- `src/lib/programs/phase-capture-hold.ts` (new) — pure decision:
  `resolvePhaseCaptureHold` returns an `inputs` hold or an `evidence` hold and
  writes the sentence for it. Unanswered capture takes precedence. The sentence
  counts the OPEN EVIDENCE, never the held-but-complete questions, names at
  most three items and summarises the rest, and names nothing when no item
  label was supplied.
- `src/components/strategic-moves/CaptureEvidenceHoldNotice.tsx` (new) — renders
  the evidence hold as a band on the capture step, with a control that opens
  Files & Evidence. Renders nothing for an inputs hold.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — measures how
  many questions are held only by the evidence verdict (by asking the existing
  status machine the same question twice, once with the real verdict and once
  with it forced to passed, so the distinction is never re-implemented), passes
  the resolved hold into the step band, and uses its sentence as the build
  control's stated reason.
- `src/lib/programs/__tests__/phase-capture-hold.test.ts` (new) — 14 cases.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 4 host cases covering both phases that exhibit the defect.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/phase-capture-hold.test.ts` —
  14 passed.
- **PASS** mutation check on the new module, 7 mutations, 7 killed: inverted
  hold precedence; counting held sections instead of open evidence; dropping
  the blank-label filter; removing the three-item cap; removing the negative
  clamp; making the evidence branch always return null; collapsing the
  singular/plural noun. The last one initially survived because the singular
  assertion was a substring of the ungrammatical plural; the assertion was
  tightened to include the following character and the mutation then failed.
- **PASS** `npx jest src/lib/programs/__tests__` — 115 suites, 1132 tests.
- **PASS** `npx jest src/components/strategic-moves/__tests__` — 41 suites,
  587 tests, including the 4 new host cases.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit 0.
- **PASS** `npx eslint` on all changed files — 0 errors (2 pre-existing
  unused-import warnings in the host, untouched by this change).
- **PASS** test-CI coverage census regenerated: testFiles 2743 → 2745,
  coveredTestFiles 2579 → 2581, uncoveredTestFiles unchanged at 164. The new
  suite lands in an already-covered directory, so no dark directory is created.
  Two of that delta is this change plus one test file that had already landed
  on the base without a census refresh.
- **NOT RUN** live signed-in walk. This change is behind no flag of its own and
  needs a signed-in session on a deployed build to observe; see Known Gaps.
- **NOT RUN** tenancy-fence coverage census — regenerated and unchanged, as
  this change adds no route and no data-plane read.

## Rollout Plan

Merge to `main` by squash. The repo-owned Azure Container Apps main deploy
workflow builds the image and shifts shared web traffic; no manual Azure
command is part of this release. No migration, no flag change, no environment
variable change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not
  pinned by this record.
- ACA runtime invariant: unchanged by this change; proven by the deploy
  workflow in the ordinary way.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable, no flag added or changed.
- Live signed-in proof required: yes, to claim `live-proven`. This record does
  not claim it.

## Rollback Plan

Revert the single squash commit. The change is additive in two new files plus a
contained edit to the phase workspace, with no schema, flag, or data change, so
a revert restores the prior sentence and removes the band with nothing to
unwind. Nothing reads the new module except the phase workspace.

## Audit Evidence

- The pull request for this branch and its CI run.
- The test output quoted under QA / Validation, reproducible by the commands
  given there.
- The census diff in `docs/architecture/test-ci-coverage-census.json`.

## Known Gaps

- **Not live-proven.** No signed-in walk was performed. Observing the band
  requires a signed-in session on a deployed build, with a late-phase Move that
  is fully captured and has at least one open required evidence item.
- **The hold itself is unchanged, and it may be stricter than intended.** From
  the design phase onward, the phase evidence verdict is computed over evidence
  need packets stamped with the active phase by `buildMoveEvidenceNeedPackets`
  (`Math.max(2, currentPhase)`), i.e. the discovery set re-presented at the
  current phase. So one open discovery item holds every question on every later
  phase. Whether that is the intended control or an over-reach is a product
  decision and is deliberately NOT changed here; this release only stops the
  product from misdescribing it.
- **Two gate criteria at the roadmap phase look for a deliverable key the
  product never writes.** The gate resolves one of them against
  `tower_metric_plan` while the generation registry writes
  `tower_metrics_plan`, and the other against three keys that appear in no
  registry entry at all. Both are soft criteria with their own text fallbacks,
  so neither blocks an advance; they are reported here as a separate, unfixed
  finding rather than folded into this change.
- **The archetype phase model's `gateRequirements` remain inert** — no source
  outside one test reads the field, so a declared archetype does not contribute
  phase-gate criteria. Unchanged by this release and still awaiting a product
  decision.
