# 2026-06-26-tower-materialization-jsonb-fix — Tower Materialization JSONB Fix

## Release ID

`2026-06-26-tower-materialization-jsonb-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the Tower materialized read-model writer so JSONB fields are serialized before they are written through the Azure/Postgres compatibility client. The previous writer passed nested objects directly; the live VNet materialization job rejected those rows with `invalid input syntax for type json`.

## Layer Impact

- `client-data-lane`: affects Tower-owned read-model materialization tables only. It does not change source tenant data or upstream enterprise-context records.
- `global-control-lane`: affects the shared Tower materialization writer used by all tenants that are projected into Tower read models.

## Client Applicability

- All clients: yes, when their Tower read model is materialized.
- Specific clients: first live repair target is Lakeshore Holdings and SkyHarbor Air.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/tower/tower-materialization.ts`
- `src/lib/tower/__tests__/tower-materialization.test.ts`

## QA / Validation

- `npx jest src/lib/tower/__tests__/tower-materialization.test.ts --runInBand` — passed.
- `npx eslint src/lib/tower/tower-materialization.ts src/lib/tower/__tests__/tower-materialization.test.ts` — passed.

## Rollout Plan

Merge to `main`, build a digest-pinned Azure Container Apps image from the merge SHA, deploy to `ca-abarva-web-lab-eastus`, then rerun the private VNet Tower materialization job for Lakeshore Holdings and SkyHarbor Air.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps shared runtime path.
- Shared runtime mutators: only the approved deploy operator should update `ca-abarva-web-lab-eastus`.
- Approved image digest: to be recorded after ACR build.
- ACA runtime invariant: template image, active traffic revision image, and approved digest must match.
- Worker image invariant: private operator job must be restored to `/bin/true` after materialization.
- Feature/env flag update path: none.
- Live signed-in proof required: Tower page proof after materialization and redeploy.

## Rollback Plan

Roll back ACA traffic to the previous healthy revision. The schema migration remains additive and does not need rollback for this code-only serialization fix.

## Audit Evidence

- PR URL: pending.
- Live failure evidence: `job-abarva-private-operator-eus-iewpun5` failed with `tower_read_model_initiatives upsert failed: invalid input syntax for type json`.
- Repair validation: targeted Jest and ESLint commands above.

## Known Gaps

Live materialization and browser proof are pending until this repair is merged and deployed.
