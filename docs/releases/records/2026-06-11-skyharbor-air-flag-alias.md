# 2026-06-11-skyharbor-air-flag-alias — resolve the dashed `skyharbor-air` tenant key for feature flags

## Release ID

`2026-06-11-skyharbor-air-flag-alias`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor data plane stores the tenant key in its dashed form
(`skyharbor-air`), but the canonical `ClientKey` is `skyharbor`. The feature-flag
resolver only mapped the dashed aliases for Apex, Meridian, and First Capital, so
a SkyHarbor Move (whose `tenant_key` is `skyharbor-air`) never resolved to a
tenant and every tenant-scoped flag failed closed for it. This adds the
`skyharbor-air → skyharbor` alias so flags (and their env allowlists) evaluate
correctly for SkyHarbor Moves. This is the prerequisite for enabling
`moves_orchestrated_deliverables` for SkyHarbor.

## Layer Impact

- `global-control-lane`: one entry added to the feature-flag tenant-alias map in
  `is-feature-enabled.ts`. No schema, no behavior change for any other tenant.

## Client Applicability

- All clients: no behavior change (additive alias for one tenant).
- Specific clients: SkyHarbor — its dashed `skyharbor-air` key now resolves to the
  `skyharbor` ClientKey for flag evaluation.
- Feature flag: none added here; this unblocks `moves_orchestrated_deliverables`.

## Changes Included

- `src/lib/features/is-feature-enabled.ts` — add `'skyharbor-air': 'skyharbor'`
  to `ENV_TENANT_ALIASES`.
- `src/lib/features/__tests__/is-feature-enabled.test.ts` — tests that the dashed
  key resolves via the env allowlist and that the flag stays off by default.

## QA / Validation

- `npx tsc --noEmit`: clean. Jest: 11/11 in the feature-flag suite pass.

## Rollout Plan

Merge and deploy. Additive; no migration. After deploy, the orchestrated
deliverable path can be enabled for SkyHarbor by setting the ACA env var
`ABARVA_FEATURE_MOVES_ORCHESTRATED_DELIVERABLES_TENANTS=skyharbor` (no rebuild).

## Rollback Plan

Revert the one-line alias; or unset the env var to disable the flag. No
destructive change.

## Audit Evidence

- Branch: `chore/skyharbor-air-flag-alias`.

## Known Gaps

- None. The alias is consistent with the existing dashed-key aliases for the
  other pilot tenants.
