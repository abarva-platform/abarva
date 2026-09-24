# 2026-09-24 Moves Render Payload Readiness Guard

## Release ID

`2026-09-24-moves-render-payload-readiness-guard`

## Status

`candidate`

## Plain-English Summary

Generated client artifacts are now scanned for raw render-package field names such as `bodyMarkdown` before sign-off. These fields describe the internal document assembly payload, not client-facing narrative, so their presence is treated as a client-readiness blocker.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Moves deliverable readiness scanning now blocks raw render-package payload fields in generated artifact text.
- Layer 3 Canonical Model: No canonical model change.
- Layer 1/2 Intake and Source Adapters: No intake or adapter change.

## Client Applicability

- All clients: Applies to generated deliverable readiness scanning wherever the shared scanner is used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `render_package_payload` as a blocker finding in `src/lib/deliverables/shared/client-readiness-scan.ts`.
- Adds focused regression coverage in `src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts`.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts --runInBand` — 55/55 tests passed.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Local proof: the scanner blocks a downloaded generated artifact text sample containing `"bodyMarkdown":` with `render_package_payload`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: Yes.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Scanner behavior is unit-covered; live signed-in proof is not required for this guard unless paired with a regenerated artifact/sign-off flow.

## Rollback Plan

Revert the PR to remove the additional readiness finding. No data rollback is required.

## Audit Evidence

- PR URL: to be added.
- Test output: focused scanner suite and typecheck results in PR notes.
- Smoke evidence: local scan of downloaded generated artifact text blocked raw render-package payload field.

## Known Gaps

- This prevents future sign-off over raw render-package payload fields. It does not rewrite already-persisted artifacts; those must be regenerated or reviewed through the product workflow.
