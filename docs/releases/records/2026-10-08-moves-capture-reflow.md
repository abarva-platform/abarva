# 2026-10-08-moves-capture-reflow — Capture layout and review rows

## Release ID

`2026-10-08-moves-capture-reflow`

## Status

`candidate`

## Plain-English Summary

The Moves capture workspace responds to the width of its question panel. Completed answers open as compact review rows with an Edit control, while open and unsaved answers stay expanded. Long basis and baseline fields wrap rather than hiding text in narrow single-line inputs. The gate and save routes are unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: Moves capture presentation and editor layout. Canonical records, source adapters, save semantics, authorization, and phase gates are unchanged.

## Client Applicability

- All clients: Applies where the existing Moves workspace v2 capture flag is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_workspace_v2` remains the existing gate.

## Changes Included

- Change the capture grid and footer to reflow based on the panel's available width.
- Summarize completed sections without unmounting their editors; preserve the draft on navigation.
- Wrap long basis and baseline fields and present narrow fact rows as stacked labelled fields.
- Add focused review-row and draft-preservation checks.

## QA / Validation

- Claude Design review: completed before implementation.
- Component and host suites: pass, 340/340.
- Full typecheck: pass.
- Targeted ESLint: pass, zero errors (two pre-existing unused-import warnings in the host).
- Test coverage census: committed census matches.
- `npm run release:check`: pass, all 11 gates.
- Signed-in responsive screenshots and save/reload readback: not run on this candidate; required after deployment.

## Rollout Plan

Squash merge through a PR. The repository-owned ACA main deploy workflow builds and deploys the approved digest. Verify the runtime invariant, then walk all P1/P2 steps at desktop, tablet, mobile, and increased zoom with save/reload checks.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the deploy workflow after merge.
- ACA runtime invariant: Verify the template and 100% traffic revision images match the approved digest.
- Worker image invariant: Verify required worker jobs use that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repository-owned main workflow. No data or schema rollback is needed.

## Audit Evidence

PR and deploy workflow links after merge; component suites; signed-in responsive captures and persisted readback after deployment.

## Known Gaps

The live responsive and persistence matrix remains to be captured on the deployed revision. No live usability claim is made by this candidate.
