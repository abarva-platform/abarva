# 2026-07-03-moves-duplicate-slot-fallback — Avoid Duplicate Active Move Slot Failures

## Release ID

`2026-07-03-moves-duplicate-slot-fallback`

## Status

`candidate`

## Plain-English Summary

Repeated Moves demos can ask for the same business problem and produce the same legacy `solution` slot. Production still enforces one active row per client and solution, so a repeat Kyriba origination could fail with a database duplicate-key error instead of creating the Move. This release retries the insert with a collision-safe legacy solution slot while preserving the user-visible Move name.

## Layer Impact

- `global-control-lane`: Strategic Moves origination submit behavior for all tenants.
- Runtime data contract: `engagements.name` remains the user-facing Move title; `engagements.solution` may receive a timestamp suffix only when the legacy active-slot uniqueness constraint rejects a duplicate.
- Runtime UI: No intentional UI change.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/origination-submit.ts`
- `src/lib/programs/__tests__/origination-submit-contract.test.ts`

## QA / Validation

- Local focused Jest: `Pass`.
- Local ESLint: `Pass`.
- Release check: `Pass`.
- Live signed-in proof: `Not run` until ACA deploy; required using Industrial Demo / Kyriba repeat-origination flow.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the exact merge SHA to `ca-abarva-web-lab-eastus`, shifts 100% traffic, and verifies production health.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Captured by ACA main deploy evidence.
- ACA runtime invariant: Verified by ACA main deploy.
- Worker image invariant: Verified by ACA main deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No schema migration is included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4368
- CI run: To be added.
- ACA deploy run: To be added.
- Live proof report: To be added.

## Known Gaps

This preserves current schema behavior; it does not remove the legacy `solution` slot or the active-slot uniqueness index.
