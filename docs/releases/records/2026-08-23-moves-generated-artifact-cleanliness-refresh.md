# 2026-08-23-moves-generated-artifact-cleanliness-refresh — Moves generated artifact cleanliness refresh

## Release ID

`2026-08-23-moves-generated-artifact-cleanliness-refresh`

## Status

`candidate`

## Plain-English Summary

Extends the Moves artifact-cleanliness operator so current generated artifacts with persisted structured renderable content can be re-saved as new superseding versions after deterministic client-facing language cleanup. The operator still dry-runs by default, never edits artifact bytes in place, and only applies when the regenerated DOCX/PPTX scans clean.

## Layer Impact

- `global-control-lane`: updates shared Moves artifact-cleanliness tooling and artifact rendering hygiene.
- Layer 4 products: Moves generated artifacts can be re-saved as clean superseding versions by the internal operator. The change does not mutate Layer 1 intake, Layer 2 adapters, Layer 3 canonical records, tenant registries, or product routing.

## Client Applicability

- All clients: Moves generated-artifact cleanup path is available wherever the operator is run.
- Specific clients: None named in this public record.
- Internal only: Operator execution remains internal/admin.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- `scripts/moves/refresh-persisted-artifact-cleanliness.ts`
- `src/lib/deliverables/client-facing-artifact-sanitize.ts`
- `src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts`

## QA / Validation

- `npx jest src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts --runInBand` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.
- Production operator dry-run/apply evidence to be captured after merge/deploy before this record is marked released.

## Rollout Plan

Merge to main through PR review, let the repo-owned ACA main deploy workflow build and deploy the image, then run the operator first in dry-run mode and only then in the scoped apply mode if the dry-run proves clean regeneration.

## Deployment Authority

- Repo-owned deploy workflow: yes, main merge triggers the approved ACA deploy workflow.
- Shared runtime mutators: none in this change.
- Approved image digest: captured by ACA deploy workflow.
- ACA runtime invariant: required after deploy before any live operator proof is quoted.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no, operator report is the proof for this internal artifact-cleanliness path.

## Rollback Plan

Revert the PR to remove the generated-artifact refresh path. Any operator-applied generated artifact refresh creates new superseding rows rather than editing bytes in place, so rollback for applied artifacts is to supersede with a later clean generated artifact or restore the prior current row through an explicit governed operator action.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6752
- ACA deploy run: pending.
- Operator dry-run/apply reports: pending.

## Known Gaps

No tenant data, canonical data, or runtime product routing is refreshed by this change.
