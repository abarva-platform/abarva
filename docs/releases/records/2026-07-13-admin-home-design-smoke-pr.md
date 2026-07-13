# 2026-07-13-admin-home-design-smoke-pr — Admin/Home Design Smoke Proof

## Release ID

`2026-07-13-admin-home-design-smoke-pr`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable proof harness for Admin and Home design fidelity, click
coverage, active/candidate separation, data-layer wiring, naming safety, truth
safety, and scoped Home aVa quality. The harness compares the live pages against
the approved Admin/Home Claude Design direction and reports mismatches honestly.

## Layer Impact

- `internal-admin`: Adds operator QA/proof scripts and generated report
  artifacts for Admin/Home readiness.
- `global-control-lane`: Adds npm script entry points only. No product runtime
  behavior is changed.

## Client Applicability

- All clients: The harness can be pointed at any signed-in tenant session.
- Specific clients: The checked-in proof is generated from the active signed-in
  Chrome session when run in `chrome` mode.
- Internal only: Yes. This is a proof harness and report artifact.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/admin-home-design-smoke-proof.ts`
- `npm run smoke:admin-home-design`
- `npm run crawl:admin-home-design-proof`
- `npm run qa:admin-home-ava`
- `reports/admin-home-design-smoke/latest/*`
- `docs/releases/records/2026-07-13-admin-home-design-smoke-pr.md`

## QA / Validation

- Pass: `npm run smoke:admin-home-design`
- Pass: `npm run crawl:admin-home-design-proof` completed from signed-in
  Chrome and generated `reports/admin-home-design-smoke/latest`.
- Pass: `npm test -- --runTestsByPath
src/components/admin/__tests__/AdminSetupExperience.test.tsx
src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `npx eslint scripts/qa/admin-home-design-smoke-proof.ts`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH
NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`

Signed-in Chrome result:

- Admin design fidelity: `partially faithful`
- Home design fidelity: `wiring-only / visually not faithful`
- P0: `0`
- P1: `24`
- P2: `0`

Admin/Home are not release-ready by the ADMIN-HOME-DESIGN-SMOKE acceptance bar
until the P1 findings are addressed or explicitly accepted.

## Rollout Plan

Merge through the normal PR lane. No Azure Container Apps deploy is required for
the harness to exist in the repository, but future main deploys will include the
script files. Running the harness is manual/operator-triggered.

## Deployment Authority

- Repo-owned deploy workflow: Not required for the proof harness itself.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required when using the report as a release
  readiness gate.

## Rollback Plan

Revert this PR. Rollback removes only the Admin/Home smoke scripts, npm entries,
and proof report artifacts. No tenant data, candidate version, module runtime,
or Active Tenant Access pointer changes are involved.

## Audit Evidence

- `reports/admin-home-design-smoke/latest/summary.md`
- `reports/admin-home-design-smoke/latest/design-fidelity.json`
- `reports/admin-home-design-smoke/latest/design-fidelity.md`
- `reports/admin-home-design-smoke/latest/smoke-results.json`
- `reports/admin-home-design-smoke/latest/click-map.json`
- `reports/admin-home-design-smoke/latest/data-wiring.json`
- `reports/admin-home-design-smoke/latest/active-vs-candidate.json`
- `reports/admin-home-design-smoke/latest/naming-audit.json`
- `reports/admin-home-design-smoke/latest/truth-safety-audit.json`
- `reports/admin-home-design-smoke/latest/ava-quality.json`
- `reports/admin-home-design-smoke/latest/console-network.json`
- `reports/admin-home-design-smoke/latest/dom/`
- `reports/admin-home-design-smoke/latest/api-payloads/`

## Known Gaps

The harness treats DOM/API captures as primary proof. macOS screenshot capture
can return blank frames or be blocked by permissions in local automation.
