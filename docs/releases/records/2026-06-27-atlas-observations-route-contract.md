# 2026-06-27-atlas-observations-route-contract — Atlas Observation Route Contract

## Release ID

`2026-06-27-atlas-observations-route-contract`

## Status

`candidate`

## Plain-English Summary

Aligns the live Atlas observation database constraint with the route types already used by the Tower/aVa answer path. Tower was assembling deterministic, tool-backed answers, then failing while saving the observation because Postgres still rejected `tool_augmented` as an observation route type. That surfaced to users as the generic "could not answer" fallback even when authentication and answer assembly were working.

## Layer Impact

- `global-control-lane`: fixes the shared Atlas/Tower answer persistence contract used by the deployed app.
- `client-data-lane`: applies an additive-compatible database constraint migration. No tenant data is changed.

## Client Applicability

- All clients: yes, this fixes the shared Atlas observation route contract.
- Specific clients: live failure was reproduced on Lakeshore Tower.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260627033000_atlas_observations_allow_tool_augmented.sql`
- `src/app/api/v1/atlas/__tests__/mode-visibility.test.ts`

## QA / Validation

- PASS: focused Jest verifies the persisted observation route contract allows `tool_augmented`.
- PASS: focused ESLint verifies the updated Atlas mode visibility test.
- PASS: TypeScript compilation before PR.
- PASS: `npm run release:check`.
- NOT RUN YET: live validation requires applying the migration inside the private VNet, then rerunning the signed-in Tower chat quality crawl against `https://app.abarva.ai/tower`.

## Rollout Plan

Merge the migration and test to main, then apply the migration to Azure/Postgres from a VNet-visible operator path. No feature flag is required. The app code already emits `tool_augmented`; the database must accept it before the live Tower answer path can persist and return the deterministic response.

## Deployment Authority

- Repo-owned deploy workflow: required for code/test release.
- Shared runtime mutators: none in this PR.
- Approved image digest: unchanged by the migration itself.
- ACA runtime invariant: live ACA image remains on the approved main deployment path.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: rerun Tower crawl with refreshed Clerk storage state and verify non-fallback answers.

## Rollback Plan

If needed, reapply the previous constraint that allowed only `scripted`, `llm`, `hybrid`, and `rule`. That would restore the old database contract but would also re-break deterministic `tool_augmented` Tower observation persistence, so rollback should be paired with a code rollback that stops emitting `tool_augmented`.

## Audit Evidence

- PR and CI for this migration/test change.
- Private VNet migration execution log, without secrets.
- Signed-in `/api/v1/atlas/chat` smoke showing HTTP 200 after migration.
- Tower chat quality crawl report after migration.

## Known Gaps

This fixes the persistence failure. It does not by itself change Tower data realism or add new Tower facts; those remain governed by the Tower read model and dataset quality lanes.
