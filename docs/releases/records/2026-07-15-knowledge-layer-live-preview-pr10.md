# 2026-07-15-knowledge-layer-live-preview-pr10 - Hidden Knowledge Layer Live Preview

## Release ID

`2026-07-15-knowledge-layer-live-preview-pr10`

## Status

`candidate`

## Plain-English Summary

This release adds a hidden, proof-only admin route that lets an operator verify the Enterprise Knowledge Layer through Nexus Knowledge/Home, Moves, and Intelligence in one place. The route is disabled by default and requires an explicit proof token. It does not add navigation, change default module behavior, call Claude by default, write tenant data, update Active Tenant Access, or promote candidates.

## Layer Impact

- `global-control-lane`: Adds a hidden admin proof route and shared proof builder for cross-module Enterprise Knowledge preview.
- `experimental`: Enables Home, Moves, and Intelligence knowledge preview/runtime flags only inside the proof path.
- `public-demo`: Produces static proof artifacts for review; no public route is exposed.

## Client Applicability

- All clients: No default product behavior change.
- Specific clients: Meridian Health and HarborTrust Bank appear only in proof fixtures.
- Internal only: Hidden admin proof route and audit report artifacts.
- Public/demo only: None.
- Feature flag: Knowledge preview/runtime flags remain default false and are enabled only by proof-only code.

## Changes Included

- Adds `/admin/knowledge-preview` as a hidden proof route.
- Adds `src/lib/enterprise-knowledge/live-preview/knowledge-layer-live-preview.ts`.
- Adds `scripts/audit/build-knowledge-layer-live-preview-proof.ts`.
- Adds `npm run audit:knowledge-layer-live-preview`.
- Adds proof outputs under `reports/enterprise-knowledge-layer/live-preview-proof/`.
- Adds this release record.

## QA / Validation

- `npm run audit:knowledge-layer-live-preview`: Pass.
- `npm run audit:knowledge-layer-signed-in-preview`: Pass.
- `npm run audit:home-knowledge-preview`: Pass.
- `npm run audit:moves-knowledge-runtime`: Pass.
- `npm run audit:intelligence-knowledge-runtime`: Pass.
- `npm run audit:enterprise-knowledge-layer`: Pass.
- `npm run release:check`: Pass.
- Isolated TypeScript compile for live-preview builder, hidden route, and audit script: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge to main through PR. Deploy through the approved ACA main workflow if browser-visible proof is required. After deploy, navigate signed-in to `/admin/knowledge-preview?proof=knowledge-layer-live-preview` and confirm the enabled proof view renders. Also verify `/admin/knowledge-preview` without the token remains disabled.

## Deployment Authority

- Repo-owned deploy workflow: Required for any ACA rollout; no ad-hoc shared-runtime mutation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the ACA main workflow if deployed.
- ACA runtime invariant: Required after deploy before claiming live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: No production feature/env flag update in this PR.
- Live signed-in proof required: Required after deploy before calling the route live-proven.

## Rollback Plan

Revert the PR. Because no tenant data, Active Tenant Access state, candidate state, or default module read path changes, rollback does not require data repair or candidate demotion.

## Audit Evidence

- `reports/enterprise-knowledge-layer/live-preview-proof/summary.md`
- `reports/enterprise-knowledge-layer/live-preview-proof/summary.json`
- `reports/enterprise-knowledge-layer/live-preview-proof/live-preview-proof.html`
- `reports/enterprise-knowledge-layer/live-preview-proof/meridian-agent-assist-live.json`
- `reports/enterprise-knowledge-layer/live-preview-proof/meridian-finance-live.json`
- `reports/enterprise-knowledge-layer/live-preview-proof/harbortrust-fraud-live.json`
- `reports/enterprise-knowledge-layer/live-preview-proof/generic-vendor-onboarding-live.json`
- `reports/enterprise-knowledge-layer/live-preview-proof/screenshots/deterministic-route-proof.svg`

## Known Gaps

- Local audit creates deterministic route-proof artifacts; signed-in browser proof is still required after an ACA deploy.
- This does not call Claude.
- This does not expose a navigation item.
- This does not promote candidate data or make modules read candidate data by default.
