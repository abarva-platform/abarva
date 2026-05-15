# AbarVa Azure Lab Key Vault Environment Projection

Status: deployed to `abarva-lab-sub` on 2026-05-15
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`
Data posture: synthetic/no-client-data only

## Purpose

This stage wires the real AbarVa Container App to Azure Key Vault using Container Apps secret references. The app still reads `process.env.*`, just as it does on Vercel, but secret custody and access control move to Azure.

This is the right lab and first-pilot pattern. It avoids code churn across every secret consumer while proving managed identity, Key Vault RBAC, and revision-based secret projection.

## Deployed Resources

| Capability | Resource | State |
|---|---|---|
| Runtime app | `ca-abarva-web-lab-eastus` | Updated revision with Key Vault-backed secret refs. |
| Key Vault | `kv-abarva-lab-001` | Holds runtime secrets; RBAC enabled. |
| Runtime identity | `id-abarva-scale-runtime-lab-eastus` | Granted `Key Vault Secrets User` on the vault. |
| Image | `acrabarvalab001.azurecr.io/abarva/web:lab-keyvault-health-20260515-r1` | Rebuilt after the public health-probe proxy fix. |
| Latest revision | `ca-abarva-web-lab-eastus--0000002` | Deployment succeeded after the health-probe image rebuild. |
| FQDN | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` | Public lab endpoint for smoke only. |

## Secret Projection Model

| App env var | Container App secret | Key Vault secret | Purpose |
|---|---|---|---|
| `CLERK_SECRET_KEY` | `clerk-secret-key` | `clerk-secret-key` | Server-side Clerk auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase-service-role-key` | `supabase-service-role-key` | Current server-side Supabase access. |
| `DATABASE_URL` | `database-url` | `database-url` | Current direct Postgres-backed persistence paths. |
| `ANTHROPIC_API_KEY` | `anthropic-api-key` | `anthropic-api-key` | Current Claude model calls. |
| `OPENAI_API_KEY` | `openai-api-key` | `openai-api-key` | Embeddings and fallback calls. |
| `PINECONE_API_KEY` | `pinecone-api-key` | `pinecone-api-key` | Current vector retrieval compatibility. |
| `NEO4J_URI` | `neo4j-uri` | `neo4j-uri` | Current graph-driver compatibility only. |
| `NEO4J_USERNAME` | `neo4j-username` | `neo4j-username` | Current graph-driver compatibility only. |
| `NEO4J_PASSWORD` | `neo4j-password` | `neo4j-password` | Current graph-driver compatibility only. |
| `DEMO_LOGIN_PASSWORD` | `demo-login-password` | `demo-login-password` | Demo login flow parity. |

## Non-Secret Runtime Env

The lab parameter file uses `readEnvironmentVariable()` for public or non-secret values so they are not committed as literal tenant/project values:

| Env var | Source | Notes |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | Literal `true` | Safe lab flag. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Deployment environment | Public Clerk key. |
| `NEXT_PUBLIC_SUPABASE_URL` | Deployment environment | Public Supabase URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Deployment environment | Public Supabase anon key. |
| `PINECONE_INDEX` | Deployment environment with default | Non-secret index name. |
| `NEXUS_COMPOSER_MODEL` | Deployment environment with default | Non-secret model selection. |

Important: `NEXT_PUBLIC_*` values may still need to be provided at image build time for fully client-side code paths. This stage projects them at runtime for parity and server-side access; a later image-build stage should formalize build-time public env injection.

## Graph Direction

Neo4j settings are projected only because the current app uses a Neo4j driver and `/api/health` checks that compatibility path today. The Azure target state is not Neo4j by default.

The target graph strategy is:

- Azure Cosmos DB for Apache Gremlin for operational traversal over tenant context relationships.
- Microsoft Fabric Graph for analytical and visual graph scenarios as it matures.
- Neo4j only as a client-specific or compatibility adapter.

See `ADR-006-graph-layer-strategy.md`.

## Verification

Completed:

- Bicep build: `infra/azure/app-runtime.bicep`
- Bicep build: `infra/azure/app-runtime-foundation.bicep`
- Bicep build: `infra/azure/key-vault-rbac.bicep`
- ACR build: `ca4` → `acrabarvalab001.azurecr.io/abarva/web:lab-keyvault-health-20260515-r1`
- Image digest: `sha256:2e788fd9b6d67803aca93593ec01d7d7ee631cf836b11ba89ea5707a541380fc`
- Key Vault secrets created/updated without printing secret values.
- Subscription deployment: `azlab16-keyvault-env-projection-20260515024415` → `Succeeded`
- Container App observed with `20` env vars and `10` Key Vault-backed secrets before image refresh.
- Runtime managed identity observed with `Key Vault Secrets User` on `kv-abarva-lab-001`.
- Runtime deployment: `azlab16-health-probe-image-20260515025741` → `Succeeded`

Smoke result after image refresh:

- `GET /api/health` returns JSON without redirecting to Clerk.
- HTTP status is `503` because `postgres=true` and `neo4j=false`.
- This confirms the app runtime, Clerk public config, Key Vault projection, and Supabase path are alive enough to execute the health route. It also confirms Neo4j is not a healthy backing service from the Azure runtime.

Follow-up:

- Do not treat Neo4j as a strategic dependency. Keep it as current-code compatibility only while the Azure-native graph provider is designed.
- Add a split health response later: `runtime`, `relational-store`, `retrieval-provider`, `graph-provider`, and `model-provider`.

## Rotation Model

Rotation is intentionally revision-based:

1. Update the secret value in Key Vault.
2. Restart or roll a Container App revision.
3. Validate `/api/health` and one authenticated flow.

Runtime SDK secret fetching can wait until rotation frequency justifies code changes.
