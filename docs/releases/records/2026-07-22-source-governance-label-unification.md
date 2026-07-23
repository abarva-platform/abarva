# 2026-07-22-source-governance-label-unification — Source Governance Label Unification

## Release ID

`2026-07-22-source-governance-label-unification`

## Status

`released`

## Plain-English Summary

Source aVa artifact-authority answers now use the same shared artifact-authority resolver as the rest of Source instead of maintaining a hand-copied precedence order inside the answer engine. This prevents aVa from drifting away when the shared rules change, especially for explicit artifact acceptances that are stronger than a merely inferred current-authoritative generated record but still not the same as a client-final upload.

## Layer Impact

- Release lane: `global-control-lane` because this changes shared Source answer-engine behavior for all tenants.
- Product runtime: Updates `source-answer-engine.ts`, used by Source aVa artifact-governance answers.
- Evidence integrity: Aligns aVa artifact-finality selection with `resolveAuthoritativeArtifact()`.
- Governance/audit: Keeps the answer honest when the strongest available artifact is authoritative but not client-final.

## Client Applicability

- All clients: Yes, for Source aVa artifact-finality / artifact-authority questions.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-answer-engine.ts`
- `src/lib/source/__tests__/source-answer-engine.test.ts`
- `docs/backlog/source-product-backlog.md`

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/client-final-artifacts.test.ts --runInBand` — passed, 67 tests.
- Focused regression verifies an active-acceptance artifact beats a merely current-authoritative generated record through the shared resolver, and aVa does not claim client-final status when it is not confirmed.
- `npm test -- --runInBand src/lib/source/__tests__/source-answer-engine.test.ts -t "shared artifact-authority resolver"` — passed on 2026-07-23, 1 focused test passed.
- The original PR validation also ran `npx jest --runTestsByPath src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/client-final-artifacts.test.ts --runInBand` — passed, 67 tests.
- Current ACA runtime invariant passed on 2026-07-23T15:35:22Z for superseding main revision `ca-abarva-web-lab-eastus--m8e1cf690`, digest `sha256:b0d7bdd7681a32330e640823df0c3673bce2134db3df2e55e1260881dc081bb8`, 100% traffic, health ok, worker images matched.
- Signed-in Lakeshore proof passed on `https://app.abarva.ai`: Source analytics shell loaded, aVa launcher invoked, `/api/v1/source/c05872d8-0465-4bc8-8eeb-ff3d42ac6761/nexus/ask` returned `Artifact authority answer`, and the rendered panel showed the shared resolver-selected artifact with client-final honesty.

## Rollout Plan

Merged to `main` through governed PR #5389. The repo-owned ACA main deploy workflow deployed merge `c308bcde5`; later main deploys superseded it, and the current production revision still contains the merge. No migration or manual runtime mutation was required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR; deployed by the repo-owned main workflow only.
- Approved image digest: Original deploy succeeded for `c308bcde5`; current superseding digest is `sha256:b0d7bdd7681a32330e640823df0c3673bce2134db3df2e55e1260881dc081bb8`.
- ACA runtime invariant: Passed on the current superseding main revision at 2026-07-23T15:35:22Z.
- Worker image invariant: No worker changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Completed for Lakeshore on 2026-07-23.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow roll forward with the revert commit. No schema rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5389
- Merge commit: `c308bcde5ded29ab8117f8e394dc373733e00ef3`
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29967031904
- Current superseding ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/30019874450
- Runtime invariant report: `audit-artifacts/source-governance-label-unification-current-invariant-20260723/runtime-invariant-proof.json`
- Signed-in live proof bundle: `audit-artifacts/source-governance-label-unification-live-proof-20260723/ui-proof-summary.json`
- Screenshot: `audit-artifacts/source-governance-label-unification-live-proof-20260723/source-ava-artifact-authority-ui-render.png`

## Known Gaps

This slice does not add a new data join from `source_artifact_acceptances` into the Source aVa evidence formatter. It only aligns the answer-engine selection when that evidence is present. The later safe repair/regenerate slice is tracked separately as `SOURCE-ARTIFACT-AUTHORITY-001g`.
