# 2026-06-22-tenant-matrix-hard-grounding — Tenant Matrix Requires Tenant Evidence

## Release ID

`2026-06-22-tenant-matrix-hard-grounding`

## Status

`candidate`

## Plain-English Summary

The all-tenant live gate now treats grounding as a real evidence requirement. A tenant answer must both avoid the "context not loaded" hedge and cite tenant evidence through the AgentAnswer citation contract.

## Layer Impact

`internal-admin` lane — tightens the live QA script operators use to prove Home and Intelligence answers across tenants.

## Client Applicability

- All clients: the gate is tenant-matrix capable across Apex Retail, First Capital, SkyHarbor, Meridian, and Lakeshore.
- Internal only: this changes QA enforcement, not user-facing runtime behavior.

## Changes Included

- `scripts/qa/tenant-matrix-gate.mjs`: makes `grounded` fail unless the answer cites `tenant-fact` or `tenant-chunk` evidence and avoids loaded-context hedging.

## QA / Validation

- pass: `node --check scripts/qa/tenant-matrix-gate.mjs`
- pass: `npm run release:check`

## Rollout Plan

Merge to `main`. No migration or feature flag is required. The script becomes active when operators run the tenant-matrix live gate with signed-in tenant cookies.

## Deployment Authority

- Repo-owned deploy workflow: not required for runtime behavior, but main deploy may publish the script with the app image.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this QA-only change.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, by running the tenant-matrix gate with tenant cookies.

## Rollback Plan

Revert this PR to restore the softer "no hedge" grounding check.

## Audit Evidence

- PR URL
- CI checks
- Tenant-matrix gate output from a signed-in run

## Known Gaps

This PR tightens the gate only. It does not make answers more grounded by itself; if the live engine lacks tenant citations, this gate will correctly fail.
