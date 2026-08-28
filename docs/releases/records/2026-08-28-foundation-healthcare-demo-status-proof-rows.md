# 2026-08-28-foundation-healthcare-demo-status-proof-rows - Demo Status Proof Rows

## Release ID

`2026-08-28-foundation-healthcare-demo-status-proof-rows`

## Status

`candidate`

## Plain-English Summary

This release keeps the foundation healthcare demo status tracker aligned with browser proof. When a Moves browser proof summary is provided, the tracker now marks each named Moves surface as browser-proven instead of only updating the aggregate count.

## Layer Impact

- Product proof/control layer: improves the accuracy of demo readiness reporting.
- No data-plane layer: this change does not load, mutate, promote, or retire data.
- No runtime product route layer: product page behavior is unchanged.

## Client Applicability

- All clients: no runtime effect.
- Specific clients: none named in this public release note.
- Internal only: proof tracking and operator status.
- Public/demo only: demo readiness reporting.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- `docs/architecture/meridian-phs-demo-readiness-status.json`

## QA / Validation

- `node --check scripts/ecl/write_meridian_phs_demo_status.mjs` passed.
- `npm run ecl:meridian-phs-demo-status:write -- --browser-proof <proof-summary> --handoff-proof <handoff-summary> --json` passed.
- Signed-in browser proof for the Moves route family reported 6 of 6 accepted before the status artifact was refreshed.

## Rollout Plan

Merge through PR. No ACA deploy is required for the tracker itself, though the standard main deploy workflow may run after merge.

## Deployment Authority

- Repo-owned deploy workflow: standard main deploy only if triggered by merge.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: not required for tracker-only evidence.
- Worker image invariant: not required.
- Feature/env flag update path: none.
- Live signed-in proof required: already captured for the evidence being recorded.

## Rollback Plan

Revert the PR to restore the previous aggregate-only status rendering.

## Audit Evidence

- PR diff.
- Moves signed-in browser proof output under the operator job record.
- Refreshed status JSON showing the aggregate and per-surface proof rows agree.

## Known Gaps

- The tracker still records the Tower-to-Moves handoff as read-side proven and write-side unproven until the action workflow has separate product proof.
