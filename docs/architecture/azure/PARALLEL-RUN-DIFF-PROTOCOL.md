# AbarVa Parallel-Run Diff Protocol

Status: live as of 2026-05-15
Owner: ops / platform
Scope: Vercel prod (current source of truth, Supabase-backed) vs Azure lab
(Container Apps + private Azure Postgres) during the parallel-run window
defined in `AZLAB18-database-migration-parallel-run.md`.

## Purpose

A parallel run only earns the name "parallel" if we can prove the two
backends agree on the canonical substrate. This protocol turns "it looks
fine" into a deterministic, repeatable diff: the harness queries the
same read-only invariants on both backends and asserts they match.

## When To Run

| Trigger | Cadence | Required for |
|---|---|---|
| Before the daily Azure lab refresh | Once per morning | Catch overnight ingestion drift. |
| After any Azure-side data load (`db:azure:copy-tenant-context`, ingestion job, AZLAB23 normalizer run) | Immediately after, then again 60s later | Catch in-flight writes vs settled state. |
| Before promoting Azure to receive demo traffic | Three consecutive clean runs >=60s apart | Cutover gate L7. |
| Continuously during the cutover window | Hourly | Drift telemetry. |
| Pre-pilot customer go-live | Three consecutive clean runs over a 24h window | Final cutover gate. |

This harness is **read-only**. It does not POST to either backend. It is
safe to run during a live demo.

## Setup

### 1. Provision the shared bearer token

Both backends must set the same value for `PARALLEL_RUN_INVARIANT_TOKEN`.
Treat the token like a service-account secret: write it to the
respective secret store (Vercel env vars on the Vercel side; Azure Key
Vault projected into Container Apps on the Azure side) and rotate it on
the same cadence as other admin-only secrets.

If the env var is unset on a backend, the endpoint returns 403 — it is
never accidentally open.

### 2. Run the harness

```
BASE_URL_A=https://nexus-vert-kappa.vercel.app \
BASE_URL_B=https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io \
PARALLEL_RUN_INVARIANT_TOKEN=<shared-secret> \
npm run parallel-run:diff
```

The harness writes `parallel-run-diff-results.md` to the repo root and
exits `0` on full match, `1` on any drift, `2` on missing env vars.

## What Is Compared

For each of the three canonical demo tenants — `apex-retail`,
`meridian-health`, `first-capital` — the harness asserts the following
invariants. All counts must match exactly.

| Invariant | Source table | Why it has to match |
|---|---|---|
| nodes | `enterprise_graph_nodes` (by `tenant_key`) | Graph substrate parity; off-by-one = a writer raced. |
| edges | `enterprise_graph_edges` (by `tenant_key`) | Same. |
| context_chunks | `enterprise_context_chunks` (by `tenant_key`) | Retrieval substrate parity. |
| segments | `data_inventory_segments` (by `tenant_key`) | Canonical 14-segment setup pack. |
| programs | `engagements` (by `client_id`, not archived/deleted) | Portfolio shape. |
| top-3 KPI names | `kpis` ORDER BY `id` ASC LIMIT 3 | KPI seed determinism. |
| top-3 pattern IDs | `pattern_packs` ORDER BY `id` ASC LIMIT 3 | Pattern seed determinism. |
| source_events | `source_events` (by `tenant_key`) | Source lane substrate parity. |

Connectivity health is reported but not asserted: `/api/health` on each
backend is logged for human inspection.

## What Is Not Compared

These are out of scope for this harness — they belong to other gates.

- **Latency.** Capture in L8 perf work, not here.
- **Embedding / vector ordering.** Non-deterministic by design across
  model lanes and index builds. Compare only the deterministic substrate
  aggregates above.
- **Clerk-authenticated routes.** The harness cannot forge Clerk sessions
  on both sides. The bearer-token endpoint (`/api/admin/parallel-run-invariants`)
  exists specifically to give the harness a Clerk-free path to the same
  underlying data.
- **Derived UI shape.** Tile order, copy variants, and React rendering
  belong to E2E parity tests, not this substrate diff.

## How To Interpret A Diff

| Symptom | Likely cause | Action |
|---|---|---|
| `nodes`/`edges` off by 1-5 | A writer (ingestion worker, copy job) raced your run. | Wait 60s, rerun. If still drifting, investigate the writer's idempotency. |
| `nodes`/`edges` off by hundreds | Tenant context copy did not complete, or `tenant_key` aliasing leaked. | Re-run `db:azure:copy-tenant-context`. Check `TENANT-KEY-CANONICALIZATION-AUDIT.md`. |
| `segments` != 14 on either side | Setup-data seed is incomplete for that tenant. | Re-run `db:seed:<tenant>-setup-data`. |
| `programs` differ | Engagement insert/archive happened on only one side. | Either source-of-truth wrote without the parallel-copy job firing, or Azure side has a stale snapshot. Investigate; do not "fix forward" by deleting rows. |
| `top-3 KPI names` differ in **content** | Wrong client_id binding or wrong seed pack applied. | Real divergence — block cutover until resolved. |
| `top-3 KPI names` differ only in **order** | KPIs share the same `id` prefix and the secondary sort is undefined on one side. | Real divergence — pin a deterministic secondary order in the seed or the query before retrying. |
| `top-3 pattern IDs` differ | Pattern-pack seed drift. | Re-run pattern seed. If still off, the two backends are reading different seed files. |
| `source_events` differ | Source-lane writes happened on only one side. | Expected during a live demo. Rerun outside the active demo window. |
| A whole tenant is missing on B | Tenant copy job has not run yet for that tenant. | Run the copy job. |
| Both sides 403 on `/api/admin/parallel-run-invariants` | `PARALLEL_RUN_INVARIANT_TOKEN` not set or mismatched. | Re-project the secret from Key Vault / Vercel env. |
| A returns the payload, B returns 503 | B is unhealthy (probably DB connection). | Check Azure Container App logs. Rerun once B's `/api/health` is green. |

## Exit Criteria For Cutover

Azure can begin receiving demo traffic once **three consecutive runs
>=60s apart all exit 0**, with no skipped tenants and no failing
invariants. Record each pass in the cutover decision log alongside the
generated `parallel-run-diff-results.md`.

Cutover is reversible: if a post-cutover run regresses, the runbook is
to fall back to Vercel-prod as the canonical traffic lane while the
divergence is debugged. Do not "fix forward" by mutating production
data to match the diff — investigate the writer instead.

## Implementation Notes

- The endpoint: `src/app/api/admin/parallel-run-invariants/route.ts`
  (admin bearer-token gate, no Clerk, no PII in response).
- The runner: `scripts/parallel-run-diff.ts` (`npm run parallel-run:diff`).
- The diff library: `src/lib/parallel-run/invariant-diff.ts`
  (covered by `src/lib/parallel-run/__tests__/invariant-diff.test.ts`).
- Token rotation: rotate `PARALLEL_RUN_INVARIANT_TOKEN` on Vercel and
  Azure simultaneously; the harness fails closed if either side is
  out-of-sync, which is the desired posture.
