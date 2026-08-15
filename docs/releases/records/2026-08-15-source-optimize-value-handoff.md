# 2026-08-15-source-optimize-value-handoff — Optimize Value Handoff Action

## Release ID

`2026-08-15-source-optimize-value-handoff`

## Status

`live-proven`

## Plain-English Summary

Optimize Contract now keeps the final value-proof step auditable when finance evidence already exists before the explicit Finance/Tower handoff request is recorded or approved. The page distinguishes loaded finance evidence from completed value proof, surfaces the Finance/Tower handoff action in that state, and records the handoff request without changing realized-value amounts.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract page and workflow-position text now expose the final Finance/Tower handoff action when finance proof exists but the handoff request is not recorded. The status badge now says finance evidence is loaded until the Finance/Tower handoff is approved, so the page does not imply completed value proof while the gate remains pending.
- Canonical model: No schema or data mutation is introduced by the release itself. The existing workflow action continues to write the governed Finance/Tower confirmation request only when the user invokes it.

## Client Applicability

- All clients: Yes, for tenants using the shared Source Optimize Contract module.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source Optimize availability only.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-step.ts`
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts --runInBand` — passed.
- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — passed.
- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — passed after the copy/status clarification.
- `npx eslint src/lib/source/data-model/contract-optimization-workflow-step.ts src/components/source/SourceOptimizeContractPage.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` — passed.
- `git diff --check` — passed.
- `npm run release:check` — passed.
- Pull request #6361 merged at `e1f3727e525b325696b65dfa94f0f46097e3b799`.
- GitHub Actions ACA main deploy run `31888501990` completed successfully.
- ACA runtime invariant passed for `ca-abarva-web-lab-eastus--me1f3727e`.
- Live signed-in Chrome proof passed on `https://app.abarva.ai/source/optimize?contractId=CTR-090`.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned ACA main deploy workflow builds and deploys the image. After deployment, verify the runtime digest invariant and run a signed-in browser proof on the Source Optimize Contract route.

## Deployment Authority

- Repo-owned deploy workflow: completed by ACA main deploy run `31888501990`.
- Shared runtime mutators: none in this PR.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:6d2e95002c6baa534591602145389c204ae30efe984fe63626aef515dbd67c41`.
- ACA runtime invariant: passed. Template image and 100% traffic revision image both match the approved digest.
- Worker image invariant: passed for `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event`.
- Feature/env flag update path: none.
- Live signed-in proof required: completed.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to deploy the previous behavior. No migration rollback is required.

## Audit Evidence

- Pull request #6361: `https://github.com/abarva-platform/abarva/pull/6361`.
- Merge commit: `e1f3727e525b325696b65dfa94f0f46097e3b799`.
- GitHub Actions deployment run: `https://github.com/abarva-platform/abarva/actions/runs/31888501990`.
- Runtime readback:
  - Latest ready revision: `ca-abarva-web-lab-eastus--me1f3727e`.
  - Template image: `acrabarvalab001.azurecr.io/abarva/web@sha256:6d2e95002c6baa534591602145389c204ae30efe984fe63626aef515dbd67c41`.
  - Traffic: 100% to `ca-abarva-web-lab-eastus--me1f3727e`.
  - Worker jobs: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` on the same digest.
- Health endpoint: `https://app.abarva.ai/api/health` returned `ok: true` with Postgres and direct Postgres checks true.
- Signed-in browser proof on `https://app.abarva.ai/source/optimize?contractId=CTR-090` showed:
  - `Step 7 of 7 · Prove value`.
  - `6 of 6 stated amounts are reproducible from calculation runs ($6.8M)`.
  - `Finance evidence is loaded, but value proof stays blocked until Finance/Tower approves the confirmation request.`
  - `Finance/Tower confirmation request is pending approval.`
  - `FINANCE EVIDENCE LOADED`.
  - No completed-value status badge was presented.

## Known Gaps

This release exposes the handoff action. It does not create finance-realization rows, approve Finance/Tower confirmation, or change any realized-value amount.
