# Parallel-Run Diff — Cutover Readiness

> Committed validation artifact. This is a real connectivity-only run
> (no `--invariant-token`, no `--auth-cookie`) captured while building the
> Lane D harness. It demonstrates the harness produces a useful,
> non-misleading founder-readable report before any credential is wired —
> tenant-fact and authenticated-surface rows come back `preflight-blocked`,
> not `fail`. Re-run with credentials per `PARALLEL-RUN-DIFF-PROTOCOL.md`
> to complete the proof.

Generated: 2026-05-15T23:55:46.051Z

## Verdict: YELLOW

> No divergence found, but 2 preflight-blocked and 2 warnings — supply the missing token/cookie and rerun to complete the proof.

**2 pass · 2 warn · 0 fail · 2 preflight-blocked**

- Left (current prod): `prod` — https://nexus-vert-kappa.vercel.app
- Right (Azure lab): `azure-lab` — https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io

## Connectivity (no auth required)

| Check | Tenant | Left | Right | Result | Note |
|---|---|---|---|---|---|
| prod /api/health | — | prod | HTTP 503 | WARN | backend is up but its health aggregator reports a degraded sub-service — see the postgres line for substrate impact |
| azure-lab /api/health | — | azure-lab | HTTP 503 | WARN | backend is up but its health aggregator reports a degraded sub-service — see the postgres line for substrate impact |
| prod postgres reachability | — | prod | true | PASS |  |
| azure-lab postgres reachability | — | azure-lab | true | PASS |  |

## Tenant-Fact Invariants (bearer token required)

| Check | Tenant | Left | Right | Result | Note |
|---|---|---|---|---|---|
| substrate parity | (all canonical tenants) | n/a | n/a | BLOCKED | supply --invariant-token (or PARALLEL_RUN_INVARIANT_TOKEN); the endpoint 403s without it on both backends |

## Authenticated Surface (session cookie required)

| Check | Tenant | Left | Right | Result | Note |
|---|---|---|---|---|---|
| authenticated surface parity | — | n/a | n/a | BLOCKED | supply --auth-cookie to probe an authenticated surface; full CXO matrix is Lane C (azure-l6-primary-surfaces) |

## How To Read This

- **PASS** — both backends agree.
- **WARN** — small count drift (<=5); likely an in-flight writer. Rerun in 60s.
- **FAIL** — real divergence. Cutover is blocked until resolved.
- **BLOCKED** — the check could not run because a token or cookie was not supplied. Not a failure — supply the credential and rerun.

## Next Step

Re-run with the missing credential(s) to complete the proof: `--invariant-token` for tenant-fact invariants, `--auth-cookie` for the authenticated surface check.
