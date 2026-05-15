# AbarVa Parallel-Run Diff Protocol

Status: live as of 2026-05-15 (Lane D — founder-readable tri-state harness)
Owner: ops / platform
Scope: current production path (Vercel + Supabase) vs Azure lab (Container
Apps + private Azure Postgres) during the parallel-run window defined in
`AZLAB18-database-migration-parallel-run.md`.

## Purpose

A parallel run only earns the name "parallel" if we can prove the two
backends agree on the canonical substrate. This protocol turns "it looks
fine" into a deterministic, repeatable diff and renders the result as a
founder-readable verdict — green / yellow / red — that answers one
question:

> Does Azure return the same tenant facts we trust in production?

The harness is designed to produce a **useful report even when some
checks cannot run**. Connectivity invariants always run with no auth.
Tenant-fact invariants need a bearer token. Authenticated-surface checks
need a session cookie. A missing credential yields a `preflight-blocked`
row — never a hard abort and never a false `fail`.

## The four severities

| Severity | Meaning | Effect on verdict |
|---|---|---|
| `pass` | Both backends agree. | — |
| `warn` | Small count drift (<= 5 rows) or a degraded non-substrate health sub-service. Likely transient. | yellow |
| `fail` | Real divergence, or a backend is unreachable. | red |
| `preflight-blocked` | The check could not run because a token/cookie was not supplied. Not a failure. | yellow |

Verdict roll-up:

- **red** — one or more `fail`. Cutover blocked.
- **yellow** — no `fail`, but at least one `warn` or `preflight-blocked`. Re-run with the missing credential / after a 60s settle.
- **green** — every check `pass`. This run clears the cutover gate.

## Running the harness

The harness is `scripts/parallel-run-diff.ts` (`npm run parallel-run:diff`).
It is **read-only** — it never POSTs to either backend — and is safe to
run during a live demo.

### Minimal run (connectivity only — no credentials)

```
npm run parallel-run:diff -- \
  --left-base-url  https://nexus-vert-kappa.vercel.app \
  --right-base-url https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io
```

This always works and proves backend reachability + postgres health on
both sides. Tenant-fact and authenticated-surface rows come back
`preflight-blocked`.

### Full run (substrate + authenticated surface)

```
npm run parallel-run:diff -- \
  --left-base-url    https://nexus-vert-kappa.vercel.app \
  --right-base-url   https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io \
  --invariant-token  <shared-secret> \
  --auth-cookie      '__session=<clerk-session-cookie>' \
  --tenant apex-retail --tenant meridian-health --tenant first-capital
```

### Flags

| Flag | Env fallback | Purpose |
|---|---|---|
| `--left-base-url` | `BASE_URL_A` | Current prod base URL (required). |
| `--right-base-url` | `BASE_URL_B` | Azure lab base URL (required). |
| `--tenant` | — | Restrict tenant-fact rows to a tenant. Repeatable / comma-separated. Default: all canonical tenants. |
| `--invariant-token` | `PARALLEL_RUN_INVARIANT_TOKEN` | Bearer token for `/api/admin/parallel-run-invariants`. |
| `--auth-cookie` | `PARALLEL_RUN_AUTH_COOKIE` | Session cookie for the authenticated-surface probe. |
| `--auth-probe-path` | — | Authenticated surface to GET (default `/intelligence`). |
| `--left-label` / `--right-label` | — | Founder-readable labels (default `prod` / `azure-lab`). |
| `--json` | — | JSON output path (default `parallel-run-diff-results.json`). |
| `--markdown` | — | Markdown output path (default `parallel-run-diff-results.md`). |

The harness writes both a JSON file (machine-readable, for CI / the C5
dashboard) and a Markdown file (founder-readable). It exits `0` when there
are no `fail` rows, `1` when there is at least one `fail`, `2` on bad
arguments. `warn` and `preflight-blocked` do not change the exit code —
they are reported, not gated.

### Provisioning the shared bearer token

Both backends must set the same value for `PARALLEL_RUN_INVARIANT_TOKEN`
(Vercel env var on the prod side; Azure Key Vault projected into Container
Apps on the Azure side). If the env var is unset on a backend, the
endpoint returns 403 — never accidentally open. A 403 surfaces as
`preflight-blocked`, not `fail`, so an unconfigured token never produces
a misleading red verdict.

## What is compared

### Connectivity (no auth — always runs)

| Check | Source | Severity rule |
|---|---|---|
| `/api/health` reachability | `GET /api/health` | No response = `fail`. 4xx/5xx with a body = `warn` (backend up, a sub-service degraded). 2xx/3xx = `pass`. |
| postgres reachability | `checks.postgres` in the health body | Green = `pass`, otherwise `warn`. This is the substrate-critical signal. |
| distinct backends | `backendMarker` from the invariants payload | If both markers are equal = `warn` (you pointed `--left` and `--right` at the same backend). |

### Tenant-fact invariants (bearer token required)

For each canonical tenant — `apex-retail`, `meridian-health`,
`first-capital` — the harness asserts:

| Invariant | Source table | Severity rule |
|---|---|---|
| graph nodes | `enterprise_graph_nodes` (by `tenant_key`) | exact = `pass`; off by 1-5 = `warn`; off by >5 = `fail`. |
| graph edges | `enterprise_graph_edges` (by `tenant_key`) | same. |
| context chunks | `enterprise_context_chunks` (by `tenant_key`) | same. |
| data segments | `data_inventory_segments` (by `tenant_key`) | same. |
| programs | `engagements` (by `client_id`, not archived/deleted) | same. |
| source events | `source_events` (by `tenant_key`) | same. |
| top-3 KPI names | `kpis` ORDER BY `id` ASC LIMIT 3 | exact content + order = `pass`; any difference = `fail` (no warn tier). |
| top-3 pattern IDs | `pattern_packs` ORDER BY `id` ASC LIMIT 3 | same. |

A tenant present on one side but not the other is a `fail`.

### Authenticated surface (session cookie required)

With `--auth-cookie`, the harness GETs `--auth-probe-path` (default
`/intelligence`) on each backend and asserts an HTTP 200. A 3xx redirect
to the Clerk sign-in interstitial means the session is missing/invalid
= `fail`. Without a cookie, the row is `preflight-blocked`. The full
CXO × surface matrix is Lane C (`azure-l6-primary-surfaces`); this row is
a lightweight smoke, not a replacement for it.

## What is not compared

- **Latency.** Belongs to L8 perf work.
- **Embedding / vector ordering.** Non-deterministic across model lanes
  and index builds — only the deterministic substrate aggregates above
  are compared.
- **Derived UI shape.** Tile order, copy variants, React rendering belong
  to E2E parity tests, not this substrate diff.

## How to interpret a diff

| Symptom | Likely cause | Action |
|---|---|---|
| count `warn` (off 1-5) | A writer raced the run. | Wait 60s, rerun. If still drifting, investigate writer idempotency. |
| count `fail` (off by hundreds) | Tenant-context copy did not finish, or `tenant_key` aliasing leaked. | Re-run `db:azure:copy-tenant-context`; check `TENANT-KEY-CANONICALIZATION-AUDIT.md`. |
| `data segments` != 14 | Setup-data seed incomplete for that tenant. | Re-run `db:seed:<tenant>-setup-data`. |
| `top-3 KPI names` differ | Wrong `client_id` binding or wrong seed pack. | Real divergence — block cutover until resolved. |
| `/api/health` `warn` (HTTP 503) but postgres `pass` | Health aggregator flags a non-substrate sub-service (e.g. an optional integration). | Substrate is reachable; not a cutover blocker. Investigate the degraded sub-service separately. |
| both tenant-fact rows `preflight-blocked` | `PARALLEL_RUN_INVARIANT_TOKEN` not supplied or mismatched. | Supply `--invariant-token`; re-project the secret on both backends. |
| `distinct backends` `warn` | `--left` and `--right` resolved to the same host. | Fix the URLs. |

## Exit criteria for cutover

Azure can begin receiving demo traffic once **three consecutive runs
>= 60s apart all return a green verdict** — every check `pass`, no
`fail`, no `warn`, no `preflight-blocked`. A yellow verdict means the
proof is incomplete (missing credential) or transient drift was seen;
it does not clear the gate. Record each green run in the cutover
decision log alongside the generated `parallel-run-diff-results.md`.

Cutover is reversible: if a post-cutover run regresses, fall back to the
Vercel-prod traffic lane while the divergence is debugged. Do not "fix
forward" by mutating production data to match the diff — investigate the
writer instead.

## Validation evidence

A connectivity-only run on 2026-05-15 (`PARALLEL-RUN-DIFF-SAMPLE-2026-05-15.md`)
returned a **yellow** verdict: both backends reachable, postgres green on
both, tenant-fact and authenticated-surface rows `preflight-blocked`
pending a token/cookie, and both `/api/health` endpoints reporting a
degraded non-substrate sub-service (`warn`). This demonstrates the
harness produces a useful, non-misleading report before any credential
is wired.

## Implementation notes

- The endpoint: `src/app/api/admin/parallel-run-invariants/route.ts`
  (admin bearer-token gate, no Clerk, no PII in response).
- The runner: `scripts/parallel-run-diff.ts` (`npm run parallel-run:diff`).
- The diff library: `src/lib/parallel-run/invariant-diff.ts`
  (`buildParallelRunDiff` for the tri-state layer; `buildInvariantReport`
  for the underlying binary substrate diff). Covered by
  `src/lib/parallel-run/__tests__/invariant-diff.test.ts`.
- Token rotation: rotate `PARALLEL_RUN_INVARIANT_TOKEN` on Vercel and
  Azure simultaneously; the harness fails closed (a 403 → `preflight-blocked`)
  if either side is out-of-sync, which is the desired posture.
