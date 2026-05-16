# AZLAB53 - Lab Feature-Flag Override for Azure Search Retrieval

Date: 2026-05-15  
Scope: cutover control lever for tenant-by-tenant Azure Search rollout  
Data posture: synthetic/no-client-data only

## Executive Read

AZLAB52 proved Azure AI Search retrieval against `tenant-context-v1`. AZLAB53 adds the operational cutover lever: tenant-scoped feature flags can now be enabled by environment variable in Azure lab without changing the static production registry.

This is deliberately narrow. It does not make Azure Search the default retrieval path. It lets operators enable `retrieval_azure_search` for one tenant in the lab, run authenticated Sentinel/Nexus/Source/Atlas checks, and then either widen, remove, or roll back the override.

## Control

Environment variable:

```bash
ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS=apexretail
```

Accepted tenant-key forms:

| App client key | Azure canonical alias accepted |
|---|---|
| `apexretail` | `apex-retail` |
| `meridian` | `meridian-health` |
| `arcturus` | `first-capital` |

Multiple tenants are comma-separated:

```bash
ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS=apexretail,meridian
```

Unknown values are ignored. Missing tenant context still fails closed.

## Why This Matters

| Cutover need | How this helps |
|---|---|
| Prove Azure retrieval without changing production defaults | The static registry stays `includeTenants: []`; only the environment opt-in changes behavior. |
| Roll out tenant-by-tenant | Operators can enable Apex first, then Meridian, then First Capital. |
| Roll back fast | Remove the env var and restart the revision; broker falls back to pgvector/Supabase path. |
| Avoid one-off code branches | The same code path supports lab, preview, and future tenant-specific pilots. |

## Validation

| Check | Result |
|---|---|
| `npm run test:behaviors -- --testPathPatterns=src/lib/features/__tests__/is-feature-enabled.test.ts` | Pass: 21/21 tests. Existing duplicate Jest mock warnings are unrelated. |
| `npx eslint src/lib/features/is-feature-enabled.ts src/lib/features/__tests__/is-feature-enabled.test.ts` | Pass. |

## Next Proof

After this lands and a fresh Azure lab image is deployed:

1. Set `ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS=apexretail` on `ca-abarva-web-lab-eastus`.
2. Confirm the Container App revision restarts cleanly.
3. Run an authenticated Sentinel question against Azure lab as Apex.
4. Verify the context bundle includes the Azure Search info tag and no pgvector fallback tag.
5. Repeat with the L7 live agent-quality runner once an Azure-host Clerk session cookie is available.

