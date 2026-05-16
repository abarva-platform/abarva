# AZLAB55 — r12 Cutover Surface Proof

Status: completed on 2026-05-16

## What Changed

Azure lab now has the first clean end-to-end primary-surface proof on the real
AbarVa image after the data-plane cutover work.

Two small L6 blockers were closed before the proof:

- Intelligence now resolves page data from the same active-client row used by
  the shell, so Apex cannot fall back to a stale Meridian/default brief after
  sign-in.
- Tower no longer renders live wall-clock text during hydration; it uses the
  deterministic `towerToday` value already used for its metrics.

The final L6 selector was tightened so Source asserts the exact
`Sourcing events` H1 instead of matching secondary headings that contain the
word sourcing.

## Live Runtime

| Item | Value |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Resource group | `rg-abarva-controlplane-lab-eastus` |
| Active revision | `ca-abarva-web-lab-eastus--0000021` |
| Traffic | `100%` |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-azure-search-agent-20260515-r12` |
| Image digest | `sha256:bdc66188f3e69e79bba783756eafa5807554816cdaad0e9fec7041689fee944d` |
| Main commit | `814c036454dc264acfd798dd42b02e1092244bd3` plus test selector PR `9dad3b5b016d50871e626dcf5aeeeed845aafb48` |
| FQDN | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` |

## Health And Connectivity Proof

`GET /api/health` returned HTTP `200`.

```json
{
  "ok": true,
  "checks": {
    "postgres": true,
    "direct_postgres": true,
    "neo4j": "skipped"
  }
}
```

`GET /api/health/azure-connectivity` with `x-abarva-health-token` passed all
private-lane checks:

| Check | Result | Detail |
|---|---|---|
| Postgres | Pass | `SELECT 1` succeeded |
| Blob | Pass | put/get/delete succeeded in `context-drops` |
| Service Bus | Pass | send/receive succeeded on `q-context-ingestion-events` |
| Key Vault | Pass | secret read succeeded for `azure-connectivity-smoke-secret` |
| Azure AI Search | Pass | count query succeeded on `tenant-context-v1`: `6567` |

## L6 Browser Gate

GitHub Actions workflow:

- Workflow: `azure-l6-primary-surfaces.yml`
- Run: `25954240302`
- Result: success
- Job: `Tenant matrix primary surfaces`

Local proof against Azure r12:

```bash
BASE_URL=https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  npx playwright test tests/e2e/primary-surfaces-tenant-matrix.spec.ts \
  --project=chromium \
  --workers=1
```

Result: `15 passed`.

Coverage:

| Tenant | Home | Intelligence | Strategic Moves | Source | Tower |
|---|---:|---:|---:|---:|---:|
| Apex Retail | Pass | Pass | Pass | Pass | Pass |
| Meridian Health | Pass | Pass | Pass | Pass | Pass |
| First Capital | Pass | Pass | Pass | Pass | Pass |

## Parallel-Run Diff

`npm run parallel-run:diff` with `PARALLEL_RUN_INVARIANT_TOKEN` returned:

- Verdict: `YELLOW`
- Reason: authenticated-surface parity check was preflight-blocked because the
  harness was not supplied a reusable cookie.
- Tenant-fact invariants: `28 pass`, `0 warn`, `0 fail`.

Key parity counts:

| Tenant | Graph nodes | Graph edges | Context chunks | Segments | Programs |
|---|---:|---:|---:|---:|---:|
| Apex Retail | 338 | 413 | 2,075 | 23 | 23 |
| Meridian Health | 517 | 742 | 2,422 | 23 | 16 |
| First Capital | 458 | 413 | 2,070 | 23 | 9 |

Top-3 KPI names and top-3 pattern IDs matched exactly for all three tenants.

## L8 Load Smoke

Unauthenticated smoke:

```bash
AZURE_L8_BASE_URL=https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  npm run azure:load:primary-surfaces -- --duration-seconds 60 --concurrency 5
```

Result:

- Status: `pass`
- Attempts: `553`
- Request errors: `0`
- 5xx: `0`
- p95: `452.4 ms`

Protected pages returned expected `307` redirects when no session cookie was
supplied.

Authenticated raw-fetch load remains a separate harness gap. A browser-minted
Clerk cookie produced valid authenticated pages in Playwright, but the raw
Node fetch load harness still saw intermittent/then-repeatable `307` redirects
for protected pages. Treat browser L6 as the authenticated proof for now; do
not use the raw-fetch L8 cookie mode as the cutover blocker until the harness is
adapted for Clerk session semantics or replaced with Playwright/k6 browser
load.

## Cutover Meter Impact

Move the Azure parallel-run readiness meter to `90%`.

Closed:

- Real app image runs in Azure Container Apps.
- Azure Postgres is the app data plane through `ABARVA_DATA_PLANE=azure-postgres`.
- L2 connectivity is green.
- L5 tenant-fact parity is clean across three tenants.
- L6 authenticated browser matrix is green across three tenants and five
  primary surfaces.
- L8 unauthenticated load smoke is green.

Still open before a cutover decision:

- RLS JWT tenant-key-shape verification before applying the RLS gap migration.
- SEC-P0 Azure target run with an Azure-host valid Clerk session.
- Authenticated load harness improvement or browser-based load replacement.
- L7 live 50-prompt agent-quality baseline against Azure/prod with stored
  artifacts.
- L3 strict pilot hardening items from AZLAB27.
