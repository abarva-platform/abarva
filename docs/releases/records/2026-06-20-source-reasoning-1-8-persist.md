# 2026-06-20-source-reasoning-1-8-persist — Source Reasoning Spine: Envelope Persistence (Slice 1.8)

## Release ID

`2026-06-20-source-reasoning-1-8-persist`

## Status

`candidate`

## Plain-English Summary

Each time "Generate with Sentinel" runs for a tenant with the reasoning flag ON, the
validated reasoning envelope is now written to a new `source_reasoning_envelopes` table
for durable audit lineage. The envelope was already stored as JSON inside
`body_generation_metadata`; this table makes it independently queryable, sortable, and
RLS-gated by tenant.

The insert is non-fatal — if it fails, the envelope stays in `body_generation_metadata`
and generation returns normally. The `"disabled"` status (flag OFF) is never inserted;
only `"ok"` and `"refusal"` envelopes are persisted (the paths where the spine ran
successfully and produced a meaningful result).

## Layer Impact

**Lane:** `client-data-lane` (new table, migration)

- **`supabase/migrations/20260620000000_source_reasoning_envelopes.sql`**: creates
  `source_reasoning_envelopes` with RLS mirroring the source_event_artifact_states
  pattern. No existing table or data is touched.
- **`src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`**:
  inserts the envelope after the body write, non-fatally. `supabase.from(...)` already
  in scope from the artifact-state lookup on the same request.

## Client Applicability

- Specific clients: `meridian` (flag `source_reasoning_spine` ON). `arcturus` if enabled.
- All other clients: flag OFF → `captureReasoningEnvelope` returns `"disabled"` → no insert.
- Feature flag: `source_reasoning_spine`

## Changes Included

- `supabase/migrations/20260620000000_source_reasoning_envelopes.sql`: new table +
  indexes + RLS (service_role full, authenticated read/insert scoped to tenant).
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`:
  non-fatal insert of envelope after activity write, when status is "ok" or "refusal".
- `src/lib/source/reasoning/__tests__/capture.test.ts`: 2 new tests validating that
  the envelope shape satisfies the DB insert contract (all required fields present).
- `docs/releases/records/2026-06-20-source-reasoning-1-8-persist.md`: this record.

## QA / Validation

Status: **pass (unit) / pending (DB apply)**

- Jest capture suite: **8/8 PASS** — includes 2 new Slice 1.8 tests verifying envelope
  shape against the insert contract.
- `tsc --noEmit`: **PASS** (zero `error TS` diagnostics).
- DB apply: requires running migration against ACA private Postgres via VNet job
  (`az acr build` + `job-abarva-db-migrate-lab-eastus` with `npm run db:migrate`).
  Not yet applied — pending in this record as a known gap.

## Rollout Plan

1. Merge PR to `main`.
2. ACA auto-deploys web revision.
3. Run migration via VNet job:
   ```
   az acr build --registry acrabarvalab001 --image abarva/web:$(git rev-parse --short HEAD) .
   az containerapp job update --name job-abarva-db-migrate-lab-eastus \
     --resource-group rg-abarva-controlplane-lab-eastus \
     --image acrabarvalab001.azurecr.io/abarva/web@sha256:<new-digest>
   az containerapp job start --name job-abarva-db-migrate-lab-eastus \
     --resource-group rg-abarva-controlplane-lab-eastus
   ```
4. Sign in as `cdio@meridian-health` → Source event strategy canvas →
   Generate with Sentinel → verify a row appears in `source_reasoning_envelopes`
   (query via ACA operator job or admin panel).

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- Shared runtime mutators: `job-abarva-db-migrate-lab-eastus` (migration apply)
- Approved image digest: set at merge time by ACR build
- ACA runtime invariant: single active revision post-deploy
- Worker image invariant: migrate job pinned to `sha256:11b3eac1...` (current main);
  update to new digest before running migration
- Feature/env flag update path: `ABARVA_FEATURE_SOURCE_REASONING_SPINE_TENANTS=meridian`
  (already set)
- Live signed-in proof required: yes — confirm envelope row in DB after generation

## Rollback Plan

Drop the `source_reasoning_envelopes` table (`DROP TABLE source_reasoning_envelopes`).
Revert to previous web image. The route insert is guarded by `reasoningCapture.status
!== "disabled"` — with the table gone, inserts fail (non-fatally) and generation
continues. The envelope is still in `body_generation_metadata`.

## Audit Evidence

- Branch: `codex/source-reasoning-1-8`
- Jest 8/8: capture suite (worktree)
- tsc: zero errors
- Migration SQL reviewed: no destructive operations (no DROP TABLE / DROP COLUMN /
  TRUNCATE), only CREATE TABLE IF NOT EXISTS + indexes + RLS policies + GRANT

## Known Gaps

- Migration not yet applied to ACA private Postgres (requires VNet job run).
- Live signed-in proof pending (requires deployed image + applied migration).
- Slice 1.1 (classify-at-intake) not yet built.
