# 2026-07-22-moves-p2-family-aware-upload — Moves P2 Family-Aware Evidence Upload

## Release ID

`2026-07-22-moves-p2-family-aware-upload`

## Status

`candidate`

## Plain-English Summary

P2 current-state upload now uses the same evidence-family map that readiness and gate checks evaluate. For current-state phases with a readiness report, the Upload & Review step shows a compact family-aware uploader, maps obvious filenames to evidence families, sends files through the governed current-state ingest path, and refreshes the phase so review-required evidence becomes visible.

## Layer Impact

- `global-control-lane`: Updates the shared Moves phase shell P2 upload step and evidence-workflow presentation.
- `client-data-lane`: Routes P2 current-state files to tenant-scoped, move-scoped, review-required evidence-family ingest instead of only storing generic uploaded evidence.
- Governance: Preserves human review; uploaded documents do not become committed or agent-ready automatically.

## Client Applicability

- All clients: Yes, for Moves P2 current-state phases with a readiness report.
- Specific clients: Live proof target is the First Capital FS Demo sandbox Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the already-live Moves phase shell path.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Adds a P2-only family-aware upload panel backed by `/api/v1/programs/:programId/current-state/ingest-doc`.
- Keeps the generic `/artifacts/upload` path for non-current-state decision evidence.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Partial: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` now has no Moves-specific errors; it remains blocked by pre-existing Home graph optional dependency errors for `@xyflow/react` and `@dagrejs/dagre`.
- Pending: ACA deploy and signed-in First Capital browser proof.

## Rollout Plan

Merge through PR to `main`; deploy through the repo-owned ACA main deploy workflow; verify the ACA runtime invariant; then run signed-in First Capital P2 upload proof with synthetic current-state files.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. P2 would fall back to the previous generic upload panel; evidence/gate data already written through current-state ingest remains append-only and review-governed.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- ACA revision: Pending.
- Live proof: Pending.

## Known Gaps

- This does not auto-approve evidence; review-required evidence must still be accepted before it can satisfy hard readiness gates.
- Filename mapping is an operator convenience for obvious files, not a substitute for human evidence review.
