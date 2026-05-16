# AZLAB54 — Azure Search Agent Runtime Proof

## What Changed

Azure lab is running the fresh AbarVa web image that includes the Azure Search
broker retrieval smoke work and the lab feature-flag override for routing Apex
retrieval through Azure AI Search.

During live-route review, we found one small but important prerequisite: the
broker calls `isFeatureEnabled()` with Azure canonical tenant keys such as
`apex-retail`, while the lab override is configured with app client keys such
as `apexretail`. AZLAB54 closes that context-key normalization gap so the live
agent path can actually turn on the Azure Search lane.

The first authenticated agent smoke also showed that the request could stream
successfully but still emit a `tenantKey: null` context bundle when the
`clients` row lookup was unavailable. AZLAB54 keeps the server-resolved active
client key even when the data-backed row is missing, so the broker can still
assemble tenant context and test Azure Search.

Separately, `/api/health/azure-connectivity` was returning Clerk sign-in HTML
instead of machine-readable JSON because only exact `/api/health` was public in
middleware. The route is now public at the middleware layer and remains
self-guarded by `x-abarva-health-token`, so probes see JSON `404` without the
token and JSON smoke results with the token.

## Live Runtime Evidence

| Check | Evidence |
|---|---|
| Container App | `ca-abarva-web-lab-eastus` |
| Resource group | `rg-abarva-controlplane-lab-eastus` |
| Latest revision | `ca-abarva-web-lab-eastus--0000005` |
| Traffic | `100%` to latest revision |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-azure-search-agent-20260515-r1` |
| Image digest | `sha256:ca5f4ebef3db92b050bc38a46cbeeee3a64dd89f6c472e29e0c008dc0dcd4af9` |
| FQDN | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` |
| Azure Search service | `AZURE_SEARCH_SERVICE_NAME=srch-abarva-context-lab-eastus` |
| Azure Search key handling | `AZURE_SEARCH_ADMIN_KEY=secretref:azure-search-admin-key` |
| Retrieval flag | `ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS=apexretail` |

## Health Proof

`GET /api/health` on the Azure lab endpoint returned HTTP `200`.

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

This proves the Azure lab runtime is alive, the app can reach Postgres, the
direct Postgres check passes, and Neo4j is not a blocking health dependency.

## Code Gate Added

`isFeatureEnabled()` now normalizes both env override values and caller context
tenant keys through the same alias map:

- `apex-retail` -> `apexretail`
- `meridian-health` -> `meridian`
- `first-capital` -> `arcturus`

This matters because the app registry uses app client keys, while the broker
and Azure Search lane use Azure canonical tenant keys.

## Validation

- `npm run test:behaviors -- --testPathPatterns=src/lib/features/__tests__/is-feature-enabled.test.ts`
- `npm run test:behaviors -- --testPathPatterns="src/lib/features/__tests__/is-feature-enabled.test.ts|src/__tests__/unit/proxy-public-routes.test.ts|src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts|src/lib/__tests__/active-client.test.ts"`
- `npx eslint src/lib/features/is-feature-enabled.ts src/lib/features/__tests__/is-feature-enabled.test.ts`
- `npx tsc --noEmit -p tsconfig.json`

## Remaining Gate

The remaining cutover proof is an authenticated Sentinel/agent turn against
Azure lab showing that the live agent path uses Azure AI Search retrieval, not
just that the image, secrets, and health checks are clean.

## Cutover Meter Impact

Hold cutover at `63%` until the corrected flag-normalization image is deployed
and the authenticated Sentinel proof lands. Move to `67%` once the live Azure
agent turn confirms Azure Search-backed context retrieval.
