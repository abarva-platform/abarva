# 2026-10-06-moves-structured-baseline-writable — A structured capture question gets a writable input

## Release ID

`2026-10-06-moves-structured-baseline-writable`

## Status

`candidate`

## Plain-English Summary

One of the required questions on a Move's Discover phase asks for the baseline numbers the Move
will later be measured against. That question is structured: it is not a paragraph of prose but a
set of rows, each naming what is measured, its value, and where the number came from.

On the redesigned three-step capture screens, that question had no input a person could type into.
Every other structured question on those screens — the change assessment, the solution route, the
estimate model — reaches the screen as an editor that reports what the person enters. This one
reached it as the read-only table built for displaying numbers already captured, so the screen
showed its empty state ("none captured yet") and offered no way out of it.

That is not a cosmetic gap. The question is required, so the phase's capture can never read as
complete, and three things downstream of capture completeness are therefore unreachable on those
screens: the phase deliverable cannot be generated, the phase's inputs cannot be finalised, and the
phase gate's baseline criterion cannot be satisfied. A Move on the redesigned screens could not
leave that phase at all.

This change supplies the missing editor: an editable row table with the same three columns the read
view renders, writing through the same stored format. Nothing about how the value is stored, read
back, or folded into document generation changes — the new editor is the only writer of a format
that already had readers everywhere and, until now, no writer in the product.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves).** One capture question on the redesigned capture screens gains a
  writable input. No read model, API route, gate rule, or capture contract is changed.
- **Layers 1–3 — no impact.** The stored value's format is the existing structured-facts contract
  (`src/lib/programs/diagnosis-facts.ts`), unchanged; the save path is the existing phase-capture
  route, unchanged.

## Client Applicability

- All clients: yes, wherever the redesigned capture screens render — the defect and the fix are both
  reached through the same existing flag, not a new one.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. The affected screens are the ones already behind `moves_capture_v2`;
  a tenant without it keeps the legacy canvas, whose own rendering of this question is untouched.

## Changes Included

- `src/components/strategic-moves/DiagnosisFactsEditor.tsx` — new. The writable half of a
  `structured: "facts"` capture section: one editable metric · value · source row per baseline,
  add/remove, serialised through the existing facts contract. This is the first product caller of
  `serializeDiagnosisFacts`, which previously had none.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the capture-flow input slot now
  renders that editor for a `facts` section instead of the read-only table, and the style block
  gains the editor's rules. The read-only table keeps both of its display call sites.
- `src/components/strategic-moves/__tests__/DiagnosisFactsEditor.test.tsx` — new, 9 cases.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 2 cases added,
  pinning the host's choice of editor rather than the component in isolation.
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite is named by exact path in the
  step that already names the other suites in this directory, because the directory is not swept.
- `docs/architecture/test-ci-coverage-census.json`, `docs/security/tenancy-fence-coverage.json` —
  regenerated.

## QA / Validation

- **PASS** — `npx jest src/components/strategic-moves/__tests__` — 38 suites, 546 tests.
- **PASS** — `npx jest .../DiagnosisFactsEditor.test.tsx` — 9 cases: an empty section offers a row
  whose three inputs are each enabled, typed and neither read-only nor disabled; a filled row
  round-trips through the facts contract; any typing makes the reported value non-empty, which is
  what the required section's completeness reads; a half-typed row survives the host echoing the
  stored value back; rows add and remove and the last row's removal is refused; a stored value
  seeds the rows on reload; legacy free text is preserved rather than discarded; a value arriving
  from elsewhere re-seeds; the provenance standard is stated to the person.
- **PASS** — 2 host cases: on the redesigned flow the baseline question renders as a writable
  editor that accepts typing, and does not render the read-only empty state.
- **PASS** — mutation check, 6 of 6 killed off a green baseline: revert the host slot to the
  read-only table (2 failures); derive rows from the value on every change (2); stop seeding a row
  for an empty section (6); never report the serialised value (3); allow the last row to be removed
  (1); make the provenance column read-only (1). The sixth survived the first attempt — the
  assertion read `toBeEnabled`, which a read-only input satisfies — and the case was strengthened
  to assert the attribute before being counted.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on the four changed source files, exit 0 (2 pre-existing unused-import
  warnings in the host, untouched by this change).
- **NOT RUN** — any signed-in walk. This change cannot be rendered signed-in off the private data
  plane from a development machine; it is not live-proven until a walk of the redesigned Discover
  capture is performed.
- Censuses regenerated. The coverage census moves covered test files +4 with uncovered test files
  unchanged at 164 — one of the four is this change's suite, and the other three are pre-existing
  drift against the committed census from earlier merges. The fence census gains one byte-scanner
  entry, also pre-existing drift. Both are refreshed honestly rather than reverted.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys the image; no migration,
no flag change, no Azure command. The behaviour appears on the next deploy for any tenant already
on the redesigned capture screens.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift
  shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: unchanged by this record; the merge deploy's own proof applies.
- Worker image invariant: unaffected — no worker job, image, or queue behaviour changes.
- Feature/env flag update path: not used. No flag, env var, or secret is added or changed.
- Live signed-in proof required: **yes** — a signed-in walk of the redesigned Discover capture,
  entering a baseline row and saving it. Until that walk, this record is `candidate`, not
  `live-proven`.

## Rollback Plan

Revert the merge commit. The change is additive: one new component, one slot choice in the capture
host, one style block addition, two test files and a workflow line. Reverting restores the previous
rendering exactly, including the read-only table, and no stored data is migrated or reinterpreted
in either direction — values written by the new editor are in the format the readers already parse,
so they remain readable after a revert.

## Audit Evidence

- The PR for this branch and its CI run.
- The mutation table above, reproducible against the branch head.
- `docs/architecture/test-ci-coverage-census.json` — the covered/uncovered delta is the evidence the
  new suite runs in CI rather than only locally.
- `.github/workflows/ai-surface-control-catalog.yml` — the step that names the suite, in a job that
  is a required status check.

## Known Gaps

- **The legacy capture canvases still edit this question as raw serialised text.** On the screens
  that render when the redesigned capture is not in force, the question shows the read-only table
  and, beneath it, a plain text area holding the serialised value. That is writable, so it is not a
  block, but it is not a product-grade input either. It was left alone to keep this change to the
  path that was blocked; moving those two call sites onto the new editor is a follow-up.
- **No signed-in proof.** See QA above.
- **Provenance is urged, not enforced.** The editor states that a number without a named source
  reads as an assumption, but it does not refuse such a row. Whether an unsourced baseline should
  be refused outright at this question, rather than at the gate that reads it, is a product
  decision and is not taken here.
