# 2026-06-29-cio-tower-visible-contract-repair — Repair Invalid Tower Answer Contracts Once

## Release ID

`2026-06-29-cio-tower-visible-contract-repair`

## Status

`candidate`

## Plain-English Summary

Tower chat can fail a simple dashboard-backed question when Claude returns near-correct prose that violates the visible-answer contract, such as using an equivalent metric phrase instead of the exact dashboard value or exposing internal wording. This change keeps the renderer pure and adds one server-side Claude repair pass: validate the JSON answer contract, send Claude the exact validation errors if needed, validate again, then return or block.

## Layer Impact

- `global-control-lane`: Updates the shared Tower answer composer used by all clients on the Tower chat surface.
- `client-data-lane`: Preserves exact governed metric packet visibility, so chat answers must cite the same metric value the dashboard uses.

## Client Applicability

- All clients: Yes, for all tenants using `/api/tower/cio-chat`.
- Specific clients: Browser failure was observed on Lakeshore for `what is my IT spend?`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: adds one Claude repair pass after contract validation failure.
- `src/lib/cio-tower/answer.ts`: strengthens prompt instructions to forbid visible `rows` wording and require exact governed metric display values.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds coverage for repair prompt behavior and exact metric-value instruction.

## QA / Validation

- `pass`: `npx jest --runTestsByPath src/lib/cio-tower/__tests__/answer.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed `13/13` tests. Duplicate manual mock warnings are pre-existing repo noise.
- `pending`: `npm run release:check` must pass before PR.
- `pending after deploy`: signed-in Tower ask for `what is my IT spend?` must return a valid answer contract and include the same governed metric value visible on the dashboard.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the corrected image. Then browser-prove `/tower` with a signed-in Tower chat question against the deployed app.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned main deploy only
- Approved image digest: produced by the main deploy workflow after merge
- ACA runtime invariant: required by deploy workflow
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: Tower chat contract repair proof on the deployed app.

## Rollback Plan

Rollback by redeploying the prior approved main digest. This change is answer-path only and does not mutate Tower data.

## Audit Evidence

- Pre-fix browser evidence: signed-in Lakeshore `/tower` displayed governed dashboard IT spend `$877.9M`, but chat returned `aVa could not produce a valid Tower answer contract` for `what is my IT spend?`.
- PR URL: pending.
- Post-deploy browser proof: pending.

## Known Gaps

This fixes invalid contract recovery for Tower chat. It does not redesign the Tower visual surface or enrich missing Tower source-file fields such as vendor contract rows, OpEx/CapEx split, or additional tab storytelling.
