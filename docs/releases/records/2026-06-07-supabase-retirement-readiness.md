# 2026-06-07-supabase-retirement-readiness — Supabase retirement readiness (BLOCKED)

## Release ID
`2026-06-07-supabase-retirement-readiness`

## Status
`candidate` (readiness assessment; no runtime change)

## Plain-English Summary
Assessed whether Supabase can be retired. **It cannot yet.** Runtime is Azure-only
(Gate 1 green), but Supabase still holds the `enterprise_context_*` fact/context layer
that Azure `abarva_control` lacks, and the read-only reconcile (Gate 2) is **blocked**:
the Supabase **source** connection string was stripped from all operator jobs and
`.env.local` during decommission-prep, so the jobs hit `ECONNREFUSED`. Supabase data
is not deleted — the access needed to migrate it out is gone. **Do not retire Supabase.**

## Layer Impact
- `client-data-lane`: read-only assessment of client data parity (no data mutated).
  Names the `enterprise_context_*` migration gap and a Supabase-access governance issue.

## Client Applicability
- All clients (the fact-layer gap + source-connectivity blocker are platform-wide).

## Changes Included
- `docs/build/legacy-shutdown-readiness/README.md`, `runtime-dependency-proof.md`,
  `missing-data-register.csv`. (`supabase-azure-reconcile.{json,csv}` not produced —
  Gate-2 blocked on source connectivity.)

## QA / Validation
- **PASS** — Gate 1 runtime dependency proof (Azure-only; provider=anthropic).
- **BLOCKED** — Gate 2 reconcile: `job-supa-recon-eus` `ECONNREFUSED`; Supabase source
  secret absent from all operator jobs + `.env.local`; Key Vault private.
- **not-run** — Gates 3–6 (depend on Gate 2).

## Rollout Plan
No runtime rollout. This record gates the Supabase-retirement mission: unblock source
connectivity → Gate-2 reconcile → Gate-3 migrate `enterprise_context_*` → Gates 4–6.

## Rollback Plan
Not applicable — read-only assessment; no schema/data/image/config change to revert.

## Audit Evidence
`docs/build/legacy-shutdown-readiness/*`; operator job `job-supa-recon-eus` (ECONNREFUSED);
job env inspection (all Supabase jobs = Azure-target-only).

## Known Gaps
- **BLOCKER:** Supabase source connectivity removed (creds stripped pre-parity).
  Unblock: re-wire the Supabase secret from `kv-abarva-lab-001` into `job-supa-recon-eus`,
  or supply a read-only Supabase connection string via the secrets channel.
- **Governance:** Supabase access was stripped before `enterprise_context_*` parity —
  counter to the do-not-retire posture; coordinate with the decommission-prep lane.
- Then: Gate-2 reconcile, Gate-3 migration, Gates 4–6, before any deletion (Anand-approved).
