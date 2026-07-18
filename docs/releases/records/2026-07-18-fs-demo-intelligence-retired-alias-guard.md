# 2026-07-18-fs-demo-intelligence-retired-alias-guard — FS Demo Intelligence Retired Alias Guard

## Release ID

`2026-07-18-fs-demo-intelligence-retired-alias-guard`

## Status

`candidate`

## Plain-English Summary

FS Demo Intelligence answers were being blocked after source retrieval because an internal advisory packet still carried the retired First Capital display name. This change keeps the retired-name guard in place for model-visible and user-visible output, while applying the existing demo-safe name sanitizer before internal advisory packet self-checks.

## Layer Impact

`global-control-lane`: narrows the shared Intelligence retired-fact guard so internal packet metadata does not block FS Demo answers after the packet has been converted to demo-safe labels.

`public-demo`: adds a regression test and CIO-smoke evidence for the FS Demo internal advisory-packet boundary.

## Client Applicability

- All clients: The shared Intelligence packet self-check path receives the safer demo-name normalization.
- Specific clients: FS Demo / arcturus / first-capital is the directly affected demo tenant.
- Internal only: No.
- Public/demo only: Demo tenant naming behavior.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts`
- `reports/fs-demo-cio-meeting-smoke/`

## QA / Validation

- `./node_modules/.bin/jest src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts --runInBand` — pass, 7 tests.
- Pre-fix signed-in FS Demo CIO smoke captured the live blocker: pages rendered 5/5, but `/api/intelligence/ask` returned retired-alias safety fallback for 8/8 questions.

## Rollout Plan

Merge to `main`, then use the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merged SHA. After deployment, rerun the signed-in FS Demo CIO smoke proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: GitHub Actions ACA main deploy only.
- Approved image digest: To be produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required before live proof is claimed.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, FS Demo Home, Intelligence, Tower, Moves, and Source.

## Rollback Plan

Revert the PR and redeploy main through the ACA main deploy workflow. No schema, data-plane, active pointer, tenant promotion, or environment changes are included.

## Audit Evidence

- Pre-fix report: `reports/fs-demo-cio-meeting-smoke/intelligence-proof.md`
- Raw blocker proof: `reports/fs-demo-cio-meeting-smoke/intelligence-raw-tenant-key-probe.json`
- Regression test: `src/lib/intelligence/ask/__tests__/retired-fact-gate.test.ts`

## Known Gaps

Post-deploy signed-in proof is required before this can be called CIO-demo ready.
