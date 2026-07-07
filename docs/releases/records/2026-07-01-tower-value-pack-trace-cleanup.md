# 2026-07-01-tower-value-pack-trace-cleanup — Tower Value Pack Trace Cleanup

## Release ID

`2026-07-01-tower-value-pack-trace-cleanup`

## Status

`candidate`

## Plain-English Summary

This release fixes two trace-proven gaps in the Tower Portfolio Value Pack ask path. The legacy `/api/tower/ask` seam now uses the same canonical tenant display-name cleanup as the CIO chat route, and inspection-priority answers include the governed initiative budget total required by the visible-answer contract.

## Layer Impact

- `global-control-lane`: Tower answer routing and visible-answer validation behavior for all clients.
- `client-data-lane`: No schema, migration, or data mutation is included.

## Client Applicability

- All clients: Yes, any tenant using the Tower ask seam.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/api/tower/ask` canonicalizes the active tenant display name before calling the CIO Tower answer engine.
- Tower inspection-priority answers include the governed `initiative_budget_fy26` display value when the contract requires it.

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/app/api/tower/ask/route.test.ts --runInBand` (`25 passed`).
- Pass: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/metric-packet.ts src/app/api/tower/ask/route.ts src/app/api/tower/ask/route.test.ts`.
- Not-run yet: `scripts/qa/tower-prompt-raw-render-trace.mjs` against deployed ACA. This is required after merge/deploy.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`; then rerun the signed-in Tower trace against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: resolved by deploy workflow after merge
- ACA runtime invariant: template image, active revision image, and 100% traffic image must agree
- Worker image invariant: deploy workflow aligns delivery workers
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior approved image. No database rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- Live trace artifact: to be generated after deploy.

## Known Gaps

This cleanup does not change Tower data quality, source templates, or dashboard visuals. It only fixes the trace-proven legacy ask label leak and inspection-answer contract failure.
