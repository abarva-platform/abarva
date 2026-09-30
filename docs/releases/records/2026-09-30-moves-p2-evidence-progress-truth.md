# 2026-09-30-moves-p2-evidence-progress-truth — P2 evidence status follows readiness

## Release ID

`2026-09-30-moves-p2-evidence-progress-truth`

## Status

`candidate`

## Plain-English Summary

The P2 progress header now reports current-state evidence gaps from the same archetype readiness report used by the P2 evidence workspace. It no longer says evidence is covered when that report has hard gaps, and it reports the check as unavailable when the report could not be loaded. P2's evidence and approval requirements are unchanged.

## Layer Impact

Release lane: `global-control-lane`.

Product projection only: the Moves P2 progress summary and its readiness-dependent step status now reflect the current-state readiness report as well as the existing evidence packet checks. No canonical model, intake adapter, persisted data, prompt, gate policy, or approval rule changes.

## Client Applicability

- All clients: yes, for Moves P2 workspaces using current-state readiness.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — include P2 archetype hard gaps in evidence progress and fail closed when that readiness report is unavailable.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — pin open, covered, and unavailable states.

## QA / Validation

- Focused Jest suite: `Pass` — 90 tests passed.
- Mutation check: `Pass` — disconnecting the P2 readiness report makes both the hard-gap and unavailable-report assertions fail.
- Focused ESLint: `Pass`.
- `npm run typecheck`: `Pass`.
- `git diff --check`: `Pass`.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: `Not run` before merge.
- Signed-in post-deploy P2 progress check: `Not run`.
- Signed-in synthetic evidence upload: `Blocked` — the browser file chooser did not open, so no evidence was uploaded or represented as loaded.

## Rollout Plan

Merge through a pull request. The repo-owned `.github/workflows/aca-main-deploy.yml` is the only authorized shared ACA deployment path. Verify the exact merge SHA, healthy 100%-traffic revision, digest-pinned web and required worker images, then confirm the P2 header in a signed-in session.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: `Not run` — capture from the exact merge-SHA workflow.
- ACA runtime invariant: `Not run` — verify the exact merge-SHA deployment.
- Worker image invariant: `Not run` — verify required worker digests against the exact merge-SHA deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — P2 evidence status and unavailable-report behavior.

## Rollback Plan

Revert the single pull request. No data migration or persisted state change is involved; the previous progress calculation is restored.

## Audit Evidence

- Pull request and CI checks for the release record.
- The focused component suite and mutation result.
- Exact merge-SHA ACA workflow, revision, traffic allocation, and image digest evidence.
- Signed-in P2 progress check after deployment.

## Known Gaps

The end-to-end synthetic journey remains incomplete. Browser-based evidence upload is blocked until the Chrome file-upload permission is available; no upload or phase advancement is claimed by this release.
