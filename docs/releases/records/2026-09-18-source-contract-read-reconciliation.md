# 2026-09-18 Source Contract Read Reconciliation

## Release ID

`2026-09-18-source-contract-read-reconciliation`

## Status

`candidate`

## Plain-English Summary

This is an incremental stage-09 read-path guard, not a completed cross-surface reconciliation. Optimize Contract now displays the selected Contract 360 annual value when an older optimization baseline disagrees, and marks that baseline as conflicted until its source records are reconciled. A sizing claim labelled calculated cannot supply a displayed amount unless its linked calculation output agrees. The approval packet describes reproducible value using the actual calculation trace, not the amount's `exact` formatting flag.

## Layer Impact

- Release lane: `global-control-lane`. Layer 4 Source read models and presentation only. No Layer 1 intake, Layer 2 adapter, or Layer 3 canonical record is changed.

## Client Applicability

- All clients using the governed Contract 360 and Optimize Contract read path.
- No feature flag.

## Changes Included

- Contract optimization read adapter and focused tests.
- Optimize Contract value-basis label and focused tests.
- No schema migration or data write.

## QA / Validation

- Focused read-adapter and traceability tests: 16 passed. Two approval-packet/basis-label tests passed.
- Three guard mutations each made its focused test fail, then were restored: baseline conflict, calculated-output agreement, and amount-basis label.
- Scoped ESLint and full TypeScript: passed locally.
- The broader Optimize page suite has one pre-existing rail-state expectation failure; it was present before this patch and is not changed here.
- Release check, CI, and signed-in acceptance: record exact results before release.

## Rollout Plan

Merge through a reviewed PR. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA. Verify the approved digest against the Container App template and 100%-traffic revision, then run a signed-in contract readback on a frozen dataset.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this read-only PR and redeploy through the repo-owned workflow. Persisted opportunity, baseline, and calculation history is untouched.

## Audit Evidence

- PR, CI, deploy digest, and signed-in acceptance links: pending.
- Focused local tests and mutation proof: include exact command output in the PR.

## Known Gaps

- This does not repair the underlying conflicting baseline rows or version their corrections. A governed data-plane job, source reconciliation, quality gate, and complete-version continuity proof remain required before those records can be called corrected.
- Story's annual-value tile and the Optimize header use `source.contract_360.annual_value`; this change aligns the Optimize baseline with that field. Economics separately computes spend and commitment from period rows, so this branch does not reconcile that tab's measures. aVa has a conflict-flag path that can select `resolved_annual_value`, and export parity is not proven. These remain acceptance gaps.
- No Azure dataset was frozen or read back for this branch. Local tests use synthetic fixtures only; a frozen dataset version, portfolio opportunity totals, aVa answers, and exports still require signed-in acceptance.
- Next non-overlapping aVa/export-answer slice: `src/lib/source/ava/server-contract-answer-context.ts`, `src/lib/source/facts/view/ava-contract-grounding-context.ts`, `src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts`, `src/lib/source/ava/source-workspace-visual-answer.ts`, and `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`. The last two build an Ask aVa export table, not a verified physical PDF export. Claim that slice separately before editing.
