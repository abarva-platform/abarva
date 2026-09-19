# 2026-09-19-source-pricing-comparability-guard — Source pricing comparability guard

## Release ID

`2026-09-19-source-pricing-comparability-guard`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic guard that prevents Source pricing comparisons from treating raw submitted
prices as normalized comparable pricing. A pricing row must carry an explicit raw amount and
normalized amount, with currency, unit, period, quantity, and scenario basis present, before the
comparison workbook can make cross-vendor comparison or TCO claims.

## Layer Impact

`global-control-lane`: Layer 4 product projection. The d19 pricing comparison export now blocks
comparison and TCO claims when its input records are basis-incomplete. It does not change canonical
data, substrate schema, tenant intake, source adapters, or stored submission rows.

## Client Applicability

- All clients: yes, for Source pricing comparison exports.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/lib/source/pricing-comparability-guard.ts`, a pure deterministic guard over pricing
  records.
- Updates `src/lib/source/exports/renderers/pricing-comparison.ts` so raw submitted unit prices and
  normalized unit prices are separate fields, and missing normalized basis blocks comparison/TCO
  workbook claims.
- Updates `src/lib/source/exports/payloads/pricing-comparison-payload.ts` to keep existing persisted
  submission rows raw-only rather than inferring comparability metadata.
- Adds focused tests for missing basis blockers, normalized-basis mismatch, raw-vs-normalized
  separation, and workbook blocked-state rendering.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/pricing-comparability-guard.test.ts src/lib/source/exports/__tests__/pricing-comparison.test.ts --runInBand`

## Rollout Plan

Merge to `main`; deploy through the repo-owned Azure Container Apps main deploy workflow. No schema
migration, data-plane write, feature flag, or manual data job is included.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime deployment.
- Shared runtime mutators: none in this release.
- Approved image digest: supplied by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy before calling the change live.
- Worker image invariant: not affected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not required for this export-only guard, but runtime invariant proof
  is required after shared deployment.

## Rollback Plan

Revert the PR. Existing stored pricing submissions remain unchanged because this release does not
write data or alter schema.

## Audit Evidence

- PR URL: to be added after PR creation.
- Focused test command listed above.
- ACA deployment and runtime-invariant proof: to be added after merge/deploy.

## Known Gaps

Existing persisted pricing submission rows do not yet carry explicit normalized basis metadata, so
the comparison workbook will show their raw submitted prices while blocking comparison and TCO claims
until an upstream record supplies currency, period, scenario, and normalized values.
