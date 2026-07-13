# 2026-07-13-home-smoke-pr1 — End-to-End Home Smoke Proof

## Release ID

`2026-07-13-home-smoke-pr1`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable Home smoke harness and proof pack for the redesigned Home
Enterprise Knowledge surface. The harness checks active/default Home,
explicit candidate preview mode, Context Explorer clicks, selected-context
tabs, setup-control guardrails, scoped Home aVa answers, naming safety, and
active-versus-candidate separation.

## Layer Impact

- `internal-admin`: Adds QA/proof scripts and generated report artifacts for
  operators reviewing Home readiness.
- `global-control-lane`: Adds npm script entry points only. No runtime Home
  behavior is changed.

## Client Applicability

- All clients: The smoke harness can be pointed at any signed-in tenant Home
  session.
- Specific clients: The checked-in proof was run against the signed-in Airline
  Demo Home session on `https://app.abarva.ai`.
- Internal only: Yes. This is a proof harness and report artifact.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/home-e2e-smoke-proof.ts`
- `npm run smoke:home`
- `npm run crawl:home-proof`
- `npm run qa:home-ava`
- `reports/home-smoke/latest/*`
- `docs/releases/records/2026-07-13-home-smoke-pr1.md`

## QA / Validation

- Pass: `npm run smoke:home`
- Pass: `npm run crawl:home-proof` completed and generated
  `reports/home-smoke/latest`.
- Result: The signed-in Chrome proof found `0 P0`, `3 P1`, and `0 P2`
  findings. Home is therefore not release-ready by the HOME-SMOKE acceptance
  bar until the P1 findings are addressed or explicitly accepted.

P1 findings from the checked-in report:

- `Explain context` button has no visible behavior.
- `Send to Intelligence` button has no visible behavior.
- Scoped Home aVa question `What evidence supports this context?` returned
  HTTP `422`.

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

Revert this PR. Rollback removes only the Home smoke scripts, npm entries, and
proof report artifacts. No tenant data, candidate version, module runtime, or
Active Tenant Access pointer changes are involved.

## Audit Evidence

- `reports/home-smoke/latest/summary.md`
- `reports/home-smoke/latest/smoke-results.json`
- `reports/home-smoke/latest/click-map.json`
- `reports/home-smoke/latest/data-wiring.json`
- `reports/home-smoke/latest/active-vs-candidate.json`
- `reports/home-smoke/latest/naming-audit.json`
- `reports/home-smoke/latest/ava-quality.json`
- `reports/home-smoke/latest/console-network.json`
- `reports/home-smoke/latest/dom/`
- `reports/home-smoke/latest/api-payloads/`

## Known Gaps

The harness currently treats DOM/API captures as primary proof. macOS screenshot
capture can return blank frames in this automation context, so the checked-in
report includes a screenshot caveat rather than misleading image proof.
