# 2026-10-17-purpose-contract-repetition — Stop instructing the writer to repeat what the header says

## Release ID

`2026-10-17-purpose-contract-repetition`

## Status

`candidate` — stacked on the purpose-export calibration draft; not for merge to `main` on its own.

## Plain-English Summary

Four fresh-writing outputs stalled between 72 and 74 against a required 85 across more than twenty
regenerations. The most frequent reviewer finding on the charter was repetition: the same status
stem in every cell of a column.

The writer was following its instructions. The story contract asked for a status prefix in each
action-register evidence cell, while the renderer already prints that exact phrase as the column
header. The same contract also told the writer to keep any meaning-changing qualification "next to
that claim", which it applied once per row, and separately told it to reuse a qualification only
when its absence would change a meaning. The two specific per-claim rules beat the general
anti-repetition rule every time, so retrying the writer could not converge.

## What changed

- The action-register instruction now asks for the completion test itself and tells the writer
  not to repeat a status prefix the column header already carries.
- The qualification rule is narrowed, not removed: a qualification that changes one claim still
  sits beside that claim; one that applies to every row of a table is stated once in the header or
  a one-line lead-in.

The prefix is only safe to drop because the header carries the proposal status. A test pins that
coupling, so renaming the header fails the suite rather than silently erasing the status.

## Layer Impact

Release lane: `experimental`.

- **Layers 1-3:** unchanged.
- **Layer 4:** the purpose story-contract prompt text only. No renderer, validator, claim guard,
  data, flag or enrollment change.

## Client Applicability

- No client receives this. Purpose exports remain behind an empty enrollment.
- Feature flag: `moves_purpose_page_design_v1`, unchanged and empty.

## Changes Included

- `purpose-story-contract.ts` — two instruction edits.
- `__tests__/purpose-contract-repetition.test.ts` (new) — 6 cases, including a rendered-docx check
  that the header still marks the entry as proposed when the cell carries no prefix.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the new suite.

## QA / Validation

- PASS the new suite, 6 of 6.
- PASS orchestrator suites: 77 suites, 1,231 tests (base 76 / 1,225).
- PASS `npm run typecheck`.
- PASS coverage census check; the new suite counts as covered.
- **Mutation-tested three ways:** restoring the per-cell prefix instruction fails 2 cases; dropping
  the shared-qualification rule fails 2; renaming the header so it no longer marks proposal status
  fails 1.
- NOT RUN: regeneration and independent review. No model key was available where this change was
  made, so the effect on the acceptance score is unmeasured. That is the next step and is required
  before any claim of improvement.

## Rollout Plan

Merge into the calibration draft branch. Regenerate all four outputs through the offline proof
harness and re-score before deciding anything further.

## Deployment Authority

- Repo-owned deploy workflow: not involved.
- Shared runtime mutators: none.
- ACA runtime invariant: not affected.
- Live signed-in proof required: no.

## Rollback Plan

Revert the commit. The contract returns to its previous wording.

## Audit Evidence

- The three mutation results.
- The reviewer findings that motivated it are retained, unedited, in the private review package.

## Known Gaps

- **Unmeasured.** This removes the cause of the most frequent finding on the charter. It does not
  address uneven page density, missing decision-risk and condition-rationale content, measurement
  period clarity, or source-register traceability, and it is not expected to reach 85 on its own.
- Per-cell citation stamping remains. Hoisting a citation shared by every row of a table to a
  single table-level attribution is consistent with the existing rule never to move a source across
  claims, but it is a renderer change and was not made without the ability to render and inspect it.
