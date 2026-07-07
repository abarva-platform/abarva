# 2026-06-28-cio-tower-metric-packet-parity — Tower Dashboard And Chat Metric Parity

## Release ID

`2026-06-28-cio-tower-metric-packet-parity`

## Status

`candidate`

## Plain-English Summary

Tower dashboard KPI cards and aVa Tower chat now consume the same governed CIO Tower metric packet from `cio_tower.measure_results`. This prevents the dashboard from showing one IT budget value while chat answers with another value for the same tenant and question.

## Layer Impact

- `global-control-lane`: shared Tower page and Tower chat behavior for every tenant.
- `client-data-lane`: reads governed Tower metric results; no migration or destructive data change in this candidate.

## Client Applicability

- All clients: yes, for tenants with CIO Tower metric results.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a shared CIO Tower metric-packet module for canonical tenant keys, money formatting, row-count extraction, and metric visibility validation.
- Loads metric packets on the Tower server page.
- Updates the CIO dashboard model to prefer governed metric packets over secondary rollup fallbacks.
- Updates the Tower Claude prompt to state that governed metric packets are also what the dashboard uses.
- Adds explicit `tower:cio:load-standardized`, `tower:cio:quality`, and `tower:cio:proof` scripts for governed Tower reruns.
- Adds tests proving dashboard/chat metric parity when rollups disagree.

## QA / Validation

- PASS: Focused Jest for Tower answer prompt and Tower dashboard surface.
- PASS: Focused ESLint for touched Tower files.
- PASS: Local Tower standardized load dry-run.
- PASS: Local Tower deterministic question/quality gate.
- BLOCKED: Full TypeScript reached baseline repo dependency/type failures unrelated to this change (`js-yaml`, Azure Document Intelligence, and axe Playwright type declarations).
- PENDING: VNet Tower data-process rerun / live metric proof after this branch is deployed to the operator image.
- PENDING: Signed-in deployed browser proof after merge/deploy.

## Rollout Plan

Merge to `main`, build the approved Azure Container Apps image from the merge SHA, deploy to `ca-abarva-web-lab-eastus`, assign 100% traffic, and verify `/tower` plus `/api/tower/cio-chat` on the signed-in deployed app.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none introduced.
- Approved image digest: recorded at deployment.
- ACA runtime invariant: active revision image and template image must match the approved main digest.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest. No data rollback is required because this candidate only changes read-path selection and prompt validation.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Live data proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

This candidate does not redesign Tower source templates or add missing client spend/value fields. It only ensures that existing governed metric results are the single source used by dashboard and chat.
