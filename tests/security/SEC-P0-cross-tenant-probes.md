# SEC-P0 cross-tenant probe suite

> A1 deliverable. Permanent regression suite that asserts every cross-tenant API route returns **403 `forbidden_cross_tenant`** when a signed-in caller from tenant A passes a `clientId` / `tenantKey` belonging to tenant B.
>
> Locks the 8 SEC-P0 routes hardened during the 2026-05-13 audit arc (PRs #1923–#1933). Use this before any pilot deployment + on every release as a smoke test.

## Why this matters

The audit B-agent found 8 routes that accepted `clientId` / `tenantKey` from request input without verifying it matched the caller's session tenant. PR #1923 closed them. This suite is the regression that proves they stay closed.

A single curl run that returns anything other than `403 forbidden_cross_tenant` on a cross-tenant probe is a P0 incident — the entire pilot motion depends on this guarantee.

## The 8 SEC-P0 routes covered

| ID | Route | Method | Audit reference |
|---|---|---|---|
| SEC-P0-1 | `/api/tower/seed-demo` | POST | seed another tenant's tower |
| SEC-P0-2 | `/api/tower/seed-demo` | DELETE | **destructive** — delete another tenant's tower data |
| SEC-P0-3 | `/api/data/upload` | POST | write engagement docs into any tenant |
| SEC-P0-4 | `/api/setup/initiatives` | POST | write into another tenant's private schema |
| SEC-P0-5 | `/api/setup/initiatives` | GET | read another tenant's AI initiatives + financials |
| SEC-P0-6 | `/api/admin/upload-dataset` | POST | write tenant_metric datasets into any tenant |
| SEC-P0-7 | `/api/turn/[turnId]/trace` | GET | read another tenant's agent reasoning trace |
| SEC-P0-8 | `/api/intelligence/query` | POST | cross-tenant Neo4j NL-to-Cypher reads |

Plus the middleware gate: `/api/admin(.*)` now lives in `AUTH_REQUIRED_ROUTE_PATTERNS` (PR #1923 SEC-P0-9).

## How to run

### Locally against staging

```bash
# 1. Get a session cookie for one tenant (e.g., Apex Retail CIO)
# Sign in via browser at https://staging.abarva.ai, copy the __session
# cookie value into env var ABARVA_PROBE_SESSION.

# 2. Get the *other* tenant's client UUID — the one we WANT a 403 from.
export ABARVA_PROBE_OTHER_TENANT_ID=<meridian-client-uuid>

# 3. Run the suite.
export ABARVA_PROBE_BASE_URL=https://staging.abarva.ai
export ABARVA_PROBE_SESSION=<the cookie value>
bash tests/security/sec-p0-cross-tenant-probes.sh
```

### In CI (recommended)

The repo workflow is `.github/workflows/sec-p0-post-deploy.yml`. It supports three targets:

| Target | Required secrets |
|---|---|
| `staging` | `STAGING_BASE_URL`, `STAGING_APEX_SESSION`, `STAGING_MERIDIAN_CLIENT_ID` |
| `production` | `PRODUCTION_BASE_URL`, `PRODUCTION_APEX_SESSION`, `PRODUCTION_MERIDIAN_CLIENT_ID` |
| `azure-lab` | `AZURE_LAB_BASE_URL`, `AZURE_LAB_APEX_SESSION`, `AZURE_LAB_MERIDIAN_CLIENT_ID` |

Each target also supports optional `*_MERIDIAN_CLIENT_KEY` and `*_KNOWN_MERIDIAN_TURN_ID` secrets. The Azure lab session cookie must be minted against the Azure Container Apps host, not copied from `app.abarva.ai`, because browser cookies are host scoped.

The script exits non-zero on any failure. The workflow can be run manually:

```bash
gh workflow run sec-p0-post-deploy.yml -f environment=azure-lab
```

Direct workflow step shape:

```yaml
- name: SEC-P0 cross-tenant probes
  run: bash tests/security/sec-p0-cross-tenant-probes.sh
  env:
    ABARVA_PROBE_BASE_URL: ${{ secrets.STAGING_URL }}
    ABARVA_PROBE_SESSION: ${{ secrets.STAGING_APEX_SESSION }}
    ABARVA_PROBE_OTHER_TENANT_ID: ${{ secrets.STAGING_MERIDIAN_CLIENT_ID }}
```

## Expected output

```
SEC-P0 cross-tenant probe suite — N probes
─────────────────────────────────────────
✅ SEC-P0-1  POST   /api/tower/seed-demo                    → 403 forbidden_cross_tenant
✅ SEC-P0-2  DELETE /api/tower/seed-demo                    → 403 forbidden_cross_tenant
✅ SEC-P0-3  POST   /api/data/upload                        → 403 forbidden_cross_tenant
✅ SEC-P0-4  POST   /api/setup/initiatives                  → 403 forbidden_cross_tenant
✅ SEC-P0-5  GET    /api/setup/initiatives?tenantKey=...    → 403 forbidden_cross_tenant
✅ SEC-P0-6  POST   /api/admin/upload-dataset               → 403 forbidden_cross_tenant
✅ SEC-P0-7  GET    /api/turn/<known-other-tenant-turn>/trace → 404 not_found  (tenant-join refused)
✅ SEC-P0-8  POST   /api/intelligence/query                 → 400 query missing tenant scope

All N probes passed.
```

## Failure-mode reading guide

- **200 anywhere** = P0 incident. The route accepted cross-tenant input. Page the founder.
- **500 anywhere** = the route blew up. Could be benign (e.g., upstream substrate missing) but investigate — the test should have been rejected before any work happened.
- **401 anywhere** = the session cookie expired. Refresh and re-run; not a security incident.
- **404 on SEC-P0-7** = correct. The `turn_traces` query joins through `engagements.client_id`; a turn from another tenant just isn't visible.
- **400 on SEC-P0-8** = correct. The genome-query route refuses Cypher that doesn't reference `$callerClientId`.
