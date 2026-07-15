# 2026-07-15-knowledge-layer-signed-in-preview-pr9 — Signed-In Knowledge Layer Preview Proof

## Release ID

`2026-07-15-knowledge-layer-signed-in-preview-pr9`

## Status

`released`

## Plain-English Summary

This release adds a simulated signed-in proof harness that checks whether Home, Moves, and Intelligence can use the same Enterprise Knowledge Layer preview context coherently for the same tenant/use case. It does not expose new routes, add navigation, change default module behavior, call Claude, write tenant data, update Active Tenant Access, or promote candidates.

## Layer Impact

- `global-control-lane`: Adds an audit-only cross-module proof harness for Enterprise Knowledge preview readiness.
- `experimental`: The proof explicitly enables default-off preview/runtime flags only inside the audit process.
- `public-demo`: Produces static proof artifacts for review; no public route changes.

## Client Applicability

- All clients: No default product behavior change.
- Specific clients: Meridian Health and HarborTrust Bank appear only in proof fixtures.
- Internal only: Audit proof and report artifacts.
- Public/demo only: None.
- Feature flag: All Knowledge Layer preview/runtime flags remain default false.

## Changes Included

- Adds `scripts/audit/build-knowledge-layer-signed-in-preview-proof.ts`.
- Adds `npm run audit:knowledge-layer-signed-in-preview`.
- Adds proof outputs under `reports/enterprise-knowledge-layer/signed-in-preview-proof/`.
- Adds this release record.

## QA / Validation

- `npm run audit:knowledge-layer-signed-in-preview`: Pass.
- `npm run audit:intelligence-knowledge-runtime`: Pass.
- `npm run audit:home-knowledge-preview`: Pass.
- `npm run audit:moves-knowledge-runtime`: Pass.
- `npm run audit:knowledge-module-preview`: Pass.
- `npm run audit:enterprise-knowledge-cache`: Pass.
- `npm run audit:enterprise-knowledge-assembler`: Pass.
- `npm run audit:enterprise-knowledge-layer`: Pass.
- `npm run audit:enterprise-naming`: Pass.
- `npm run release:check`: Pass.
- Isolated TypeScript compile for Enterprise Knowledge Home/Moves/Intelligence/cache/contracts/audit files: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge to main after validation. No ACA deploy is required because this is an audit-only proof harness with no route, navigation, environment flag, or default runtime behavior change.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not required.
- Worker image invariant: Not applicable.
- Feature/env flag update path: No production flag update in this PR.
- Live signed-in proof required: Not required; this PR uses simulated signed-in proof. Browser proof can follow after a staged enablement decision.

## Rollback Plan

Revert the PR. Because the change is audit-only and default-off, rollback does not require data migration, tenant repair, candidate demotion, or ACA traffic changes.

## Audit Evidence

- `reports/enterprise-knowledge-layer/signed-in-preview-proof/summary.md`
- `reports/enterprise-knowledge-layer/signed-in-preview-proof/summary.json`
- `reports/enterprise-knowledge-layer/signed-in-preview-proof/signed-in-preview-proof.html`

## Known Gaps

- This is simulated signed-in proof, not live browser proof.
- This does not expose preview routes or navigation.
- This does not call Claude.
- This does not enable previews for default users.
