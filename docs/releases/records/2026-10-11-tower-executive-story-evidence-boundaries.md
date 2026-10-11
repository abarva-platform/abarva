# 2026-10-11-tower-executive-story-evidence-boundaries — Make Tower's executive story evidence-bound

## Release ID

`2026-10-11-tower-executive-story-evidence-boundaries`

## Status

`candidate`

## Plain-English Summary

Tower's executive walkthrough now separates annual plans from year-to-date Finance amounts and distinguishes adoption evidence from measured economic outcomes. Charts, labels, row counts, and detail views state their population and evidence basis more precisely. The navigation closes on the decisions and evidence requests that follow from the review.

## Layer Impact

**Release lane: `global-control-lane`.**

- **Layer 4 (Products):** Tower presentation and its local tests change. The page continues to project governed read-model data; it does not create or alter canonical facts.
- **Layers 1–3:** No intake, adapter, or canonical-model change.

## Client Applicability

- All clients: yes, wherever this Tower command-center surface is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- Tower command-center tabs, charts, evidence copy, tool and case presentation, action and initiative drawers, and assistant starter prompt.
- Focused regression tests for period and evidence semantics, population counts, and detail behavior.
- This release record.
- No migration, loader, or data mutation.

## QA / Validation

- Node 24: Tower command-center Jest suite, 14 suites / 89 tests passed.
- Node 24: Tower case-attribute lineage suite, 1 suite / 88 tests passed.
- Node 24: `npx tsc --noEmit --pretty false` passed.
- Node 24: ESLint for the Tower command-center directory and the touched lineage test passed.
- `git diff --check` passed.
- Node 24: `npm run release:check` passed all 11 gates.
- Node 24: `npm run audit:route-reachability` passed with no new unreachable components or exports.
- `node scripts/tower/fact-lineage-report.mjs` quote mode completed against active intake in the clean release worktree. The in-scope budget has one active source; this report does not establish a reconciled live read-model figure. Generated report files were restored after inspection.
- Signed-in post-deploy proof remains pending; local rendering tests do not establish live behavior.

## Rollout Plan

Merge the reviewed PR to `main`. The repo-owned ACA main deploy workflow builds the exact merged SHA and promotes the approved digest-pinned image through its normal release path. Verify the runtime image invariant, then perform a signed-in Tower walkthrough for affected client scopes. No feature-branch or local command may shift shared web traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: determined and recorded by the main deploy workflow after merge.
- ACA runtime invariant: web template, 100% traffic revision, and required worker images must match the approved digest before a live claim.
- Worker image invariant: verify as part of the post-deploy proof; no worker change in this candidate.
- Feature/env flag update path: none.
- Live signed-in proof required: Tower tabs, chart periods, counts, drawers, and evidence gaps for affected client scopes.

## Rollback Plan

Revert the presentation PR and use the repo-owned main deploy workflow to release the reverted SHA. No schema or data rollback is required.

## Audit Evidence

- PR diff and local validation output.
- The Tower active-intake fact-lineage report, read-model provenance, and post-deploy signed-in observations are separate evidence; none alone certifies the others.

## Known Gaps

- The current projection does not provide a matched-period annual-to-actual conversion cohort or a defensible portfolio-wide measured-outcome amount. The UI avoids those inferred claims.
- Budget source reconciliation and a per-metric lineage verdict must reach the Tower view before that headline can be restored. Other portfolio projection amounts still need source/counting-basis readback before use as independently verified financial facts.
- A canonical case-versus-rollout row type is needed to classify every portfolio row without relying on source-template metadata.
