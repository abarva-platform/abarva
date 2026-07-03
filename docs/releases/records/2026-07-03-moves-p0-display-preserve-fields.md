# 2026-07-03-moves-p0-display-preserve-fields — Preserve Move P0 Brief Fields

## Release ID

`2026-07-03-moves-p0-display-preserve-fields`

## Status

`candidate`

## Plain-English Summary

Strategic Moves P0 promotion could capture the correct sponsor and archetype in the origination canvas, then show a generic resolved user and coarse archetype on the created Move page. This release preserves the captured P0 sponsor candidate and archetype label in the charter scaffold and makes the Move detail page display those scaffold labels for P0 context, while keeping resolved people records for permissions and approvals.

## Layer Impact

- `global-control-lane`: Moves origination submit and Moves detail display behavior change for all tenants.
- Runtime UI: The Move detail header and Sponsor & team panel prefer the captured P0 scaffold labels when present.
- Runtime data contract: The origination charter now stores both captured scaffold labels and resolved backend identities.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/origination-submit.ts`
- `src/lib/programs/__tests__/origination-submit-contract.test.ts`
- `src/app/api/v1/programs/originate/extract-brief/extract-brief-deterministic.test.ts`
- `src/components/strategic-moves/StrategicMoveDetailView.tsx`

## QA / Validation

- Local focused Jest: `Pass` after implementation.
- Local ESLint: `Pass` after implementation.
- Release check: `Pass` after implementation.
- Live signed-in proof: `Required after ACA deploy` using Industrial Demo / Kyriba Moves origination.

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

- PR URL: https://github.com/abarva-platform/abarva/pull/4367
- CI run: To be added.
- ACA deploy run: To be added.
- Live proof report: To be added.

## Known Gaps

Existing Moves created before this release may still have older scaffold labels if they were already persisted with resolved-person text. New P0 promotions preserve the captured labels.
