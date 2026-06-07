# Supabase Sunset Proof - 01 Freeze Proof

Date: 2026-06-07  
Status: HOLD - freeze not yet proven  
Scope: Production Supabase sunset after Azure-only Container Apps cutover

## Gate verdict

Supabase is **not sunset-ready**. This freeze gate remains blocked until the
production runtime has no Supabase environment variables, production write paths
to Supabase are blocked, code-level write paths are proven absent, and Supabase
project logs show zero app-originated writes after the freeze timestamp.

## Required freeze evidence

| Control | Required evidence | Current evidence | Status |
| --- | --- | --- | --- |
| Freeze timestamp marked | UTC timestamp, operator, and change ticket for the start of the write freeze | Not recorded in this proof pack | BLOCKED |
| Supabase env vars removed from Azure production runtime | Azure Container Apps revision/env dump showing no `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Supabase pooler host, or Supabase direct URL | 2026-06-06 lab evidence removed Supabase/Pinecone/Neo4j env projection from `ca-abarva-web-lab-eastus--0000048`; production proof is not attached here | PARTIAL |
| Production write paths disabled or blocked | Runtime guard, network egress rule, or service-role removal proving app writes to Supabase cannot succeed | Not recorded in this proof pack | BLOCKED |
| No app module can write to Supabase | Runtime import census plus write-path audit showing no production module imports Supabase clients or calls Supabase mutation helpers | `npm run audit:runtime-supabase-imports:guard` is the required repo-native code audit; fresh output must be attached before freeze completion | BLOCKED |
| Supabase logs show zero writes after freeze | Supabase database/API log export filtered after freeze timestamp, with app identities and user agents identified | Not recorded in this proof pack | BLOCKED |

## Freeze timestamp

Freeze timestamp: `PENDING`  
Operator: `PENDING`  
Approval/change record: `PENDING`

Do not fill this field until the operator has frozen production writes and
captured logs without printing secrets.

## Commands to capture evidence

Run from an approved operator shell. Do not print secret values.

```bash
# Azure Container Apps production env-name proof. Print names only, not values.
az containerapp show \
  --resource-group <production-resource-group> \
  --name <production-container-app-name> \
  --query "properties.template.containers[].env[].name" \
  --output table

# Runtime code proof.
npm run audit:runtime-supabase-imports:guard

# App log deny-list proof for the freeze window.
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "<query filtering production app logs after freeze timestamp for supabase.co, pooler.supabase.com, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY>"
```

## Evidence to attach before marking PASS

- Azure production revision ID.
- Freeze timestamp in UTC.
- Env-name output showing no Supabase runtime env vars.
- Runtime import/write audit output.
- Supabase log export query and result showing zero app-originated writes after
  the freeze.
- Confirmation that no secrets were printed in captured logs.

## Blockers

1. Freeze timestamp is not recorded.
2. Azure Container Apps **production** env removal is not proven in this pack.
3. Supabase logs after freeze are not attached.
4. Code-level write-path proof has not been freshly run on this branch.
