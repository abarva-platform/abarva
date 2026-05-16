# AZLAB35 - L8 Primary-Surface Load Smoke

Date: 2026-05-15  
Status: wired, dry-run validated  
Layer: L8 performance / load

## Why This Exists

The lab needs an early scale signal before we add heavier tooling. This slice creates a dependency-free load smoke for the primary AbarVa surfaces:

- `/`
- `/home`
- `/intelligence`
- `/strategic-moves`
- `/source`
- `/tower`

The first goal is not a perfect production benchmark. The goal is a repeatable L8 gate that catches runtime 5xx, redirect loops, p95 latency regressions, and obvious Container Apps/App Router instability against Azure, staging, or production.

## Artifacts

| Artifact | Purpose |
|---|---|
| `scripts/load/azure-primary-surfaces.mjs` | Node 24 load probe using built-in `fetch`; no k6/Artillery dependency. |
| `npm run azure:load:primary-surfaces` | Local/manual command for Azure, staging, or production. |
| `.github/workflows/azure-l8-primary-surface-load.yml` | Manual GitHub Actions gate that uploads the JSON report. |

## How To Run

Dry run:

```bash
npm run azure:load:primary-surfaces -- --base-url https://example.com --duration-seconds 1 --concurrency 1 --dry-run
```

Unauthenticated smoke:

```bash
AZURE_L8_BASE_URL=https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io \
  npm run azure:load:primary-surfaces -- --duration-seconds 60 --concurrency 5
```

Authenticated smoke:

```bash
AZURE_L8_BASE_URL=https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io \
AZURE_L8_COOKIE='<clerk-session-cookie>' \
  npm run azure:load:primary-surfaces -- --duration-seconds 60 --concurrency 5 --require-2xx
```

Authenticated demo-sign-in smoke with automatic Clerk cookie refresh:

```bash
npm run azure:load:primary-surfaces -- \
  --base-url https://ca-abarva-web-lab-eastus.<region>.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --demo-email cio@apex-retail.example.com \
  --paths /home,/intelligence,/strategic-moves,/source,/tower \
  --duration-seconds 60 \
  --concurrency 5 \
  --require-2xx
```

GitHub Actions:

```bash
gh workflow run azure-l8-primary-surface-load.yml \
  -f environment=azure-lab \
  -f duration_seconds=60 \
  -f concurrency=5 \
  -f p95_target_ms=8000
```

## Pass / Fail Rules

| Rule | Default |
|---|---:|
| 5xx responses | 0 allowed |
| Request errors | 0 allowed |
| Global p95 | <= 8,000 ms |
| Think time | 50 ms per worker by default |
| Redirect / non-2xx | Allowed unless `--require-2xx` is set |

The redirect allowance is intentional for early Azure host smoke: if Clerk does not yet allow the Azure Container Apps hostname, protected routes may redirect to sign-in. Once the Azure host is accepted by Clerk and `AZURE_LAB_L8_COOKIE` is loaded, run with `--require-2xx` for true app-surface load.

## Report Shape

The command emits JSON with:

| Field | Meaning |
|---|---|
| `summary.p95Ms` | Global p95 latency across all sampled paths. |
| `summary.fiveXx` | Count of HTTP 5xx responses. |
| `summary.requestErrors` | Network/timeouts/fetch errors. |
| `summary.statusCounts` | Distribution across 2xx/3xx/4xx/5xx. |
| `byPath` | Count, status distribution, average, and p95 per path. |

## Current Limit

This is a load smoke, not the final pilot load test. It does not yet simulate full agent turns, source-event creation, Move origination, or Tower decision-pack generation. Those belong in the next L8 phase after L6 workflow E2E is deeper.

## Next L8 Controls

| Next control | Why |
|---|---|
| Authenticated Azure run with `--auth-mode demo-sign-in` and `--require-2xx` | Measures real app-surface latency instead of redirect stability; refreshes Clerk's short session token during the run. |
| Agent-turn latency budget | Breaks Sentinel turn time into retrieval, reasoning, model, and synthesis. |
| Cold-start runbook | Measures Container Apps scale-to-zero recovery. |
| Postgres pool pressure scenario | Detects connection exhaustion before pilot traffic. |
