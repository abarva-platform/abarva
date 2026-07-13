# 2026-07-13-admin-home-design-smoke-pr — Admin/Home Design Smoke and Corrections

## Release ID

`2026-07-13-admin-home-design-smoke-pr`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable proof harness for Admin and Home design fidelity, click
coverage, active/candidate separation, data-layer wiring, naming safety, truth
safety, and scoped Home aVa quality. Also fixes the first smoke findings that
were safe to correct in this slice: missing Home overview sections, inactive
overview actions, heavier Admin architecture labels, template-action affordance
labels, and a Home deterministic prose phrase that could trip the visible-answer
contract.

## Layer Impact

- `internal-admin`: Adds operator QA/proof scripts and generated report
  artifacts for Admin/Home readiness, and tightens read-only Admin setup-control
  labels.
- `global-control-lane`: Updates Home context-browser rendering and scoped Home
  aVa affordances. No tenant data writes, candidate promotion, Active Tenant
  Access pointer update, or module runtime behavior change.

## Client Applicability

- All clients: The harness can be pointed at any signed-in tenant session.
- Specific clients: The checked-in proof is generated from the active signed-in
  Chrome session when run in `chrome` mode.
- Internal only: Partly. The harness is internal; the Home/Admin label and
  affordance corrections are product UI behavior.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/admin-home-design-smoke-proof.ts`
- `npm run smoke:admin-home-design`
- `npm run crawl:admin-home-design-proof`
- `npm run qa:admin-home-ava`
- `src/components/home/HomeSurface.tsx`
- `src/components/admin/AdminSetupExperience.tsx`
- `src/lib/home/know/v7-home-ask.ts`
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

Follow-up validation after this correction slice must rerun the fixture and
signed-in Chrome harness before merge/deploy.

## Rollout Plan

Merge through the normal PR lane after validation. Because this slice changes
product UI behavior, deploy through the approved Azure Container Apps main lane
before claiming the Home/Admin corrections are live.

## Deployment Authority

- Repo-owned deploy workflow: Required before claiming product UI corrections
  are live.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required when using the report as a release
  readiness gate.

## Rollback Plan

Revert this PR. Rollback removes the Admin/Home smoke scripts, npm entries,
proof report artifacts, and the bounded Home/Admin label and affordance
corrections. No tenant data, candidate version, module runtime, or Active Tenant
Access pointer changes are involved.

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
