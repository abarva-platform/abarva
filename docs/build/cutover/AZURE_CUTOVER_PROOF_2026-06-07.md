# Azure Cutover Proof Log — 2026-06-07

Operating under temporary cutover operator access. **Rules honored:** no secret
values printed; Supabase not deleted or paused; DNS unchanged; Vercel production
untouched; Azure DB proof taken only via operator/Log-Analytics (never local
`DATABASE_URL`); every step recorded below.

## Step 1 — Cutover access verification (read)

- Re-authenticated the cutover service principal against subscription
  `abarva-lab-sub` (`701a8554-…`), state Enabled. (No secret values printed.)
- Current SP role assignments (subscription `701a8554-…`):
  - `Reader` (subscription)
  - `Container Apps Contributor` (rg-abarva-controlplane-lab-eastus)
  - `Monitoring Reader` (rg-abarva-observability-lab-eastus)
  - `Storage Blob Data Contributor` (stabarvaprivatedplab001)
  - `Search Index Data Contributor` + `Search Service Contributor` (srch-abarva-context-lab-eastus)
  - `Azure Service Bus Data Owner` (sb-abarva-lab-eastus, …-prem)
  - `Key Vault Secrets User` (kv-abarva-lab-001)

## Step 2 — ACCESS GAP (blocker for live proof runs)

- `az containerapp job start -n job-abarva-private-operator-eus -g rg-abarva-controlplane-lab-eastus`
  → **AuthorizationFailed**: the SP `does not have authorization to perform action
'Microsoft.App/jobs/start/action'`. Retried after a fresh SP login — same result.
- Root cause: the SP's `Container Apps Contributor` assignment does not include
  `Microsoft.App/jobs/start/action` for this job. **The cutover grant gave read,
  not job-start.** Triggering operator jobs (read-only DB proof, the fixed
  decommission gates) is therefore not possible from this identity yet.
- Additionally: the data-plane RBAC the SP holds (Search/Blob/Service Bus/Key
  Vault) is on **private** resources (`publicNetworkAccess=Disabled`) that are
  **network-unreachable from Cursor Cloud**, so direct data-plane proof cannot
  run from here either — it must run inside the VNet via an operator job.

## Step 3 — Read-only Azure DB proof (from last operator run + Log Analytics)

Source: `job-abarva-private-operator-eus-xdaykbk`, **Succeeded 2026-06-06
22:44:49Z**; console output in Log Analytics workspace
`log-abarva-observability-lab-eastus`. Proof JSON (redacted host):

- Private DNS + connectivity proven: `pg-abarva-context-lab-001…` → **10.43.1.4**,
  DB `abarva_control`, user `abarvaadmin` (private-only, `PublicNetworkAccess=Disabled`).
- Live counts in `abarva_control`:
  - `enterprise_context_chunks` = **9,360** (meridian-health 873 + skyharbor-air 3,240 + lakeshore 5,247)
  - `corpus_patterns` 39 · `corpus_pattern_content` 39 · `knowledge_sources` 20 ·
    `knowledge_chunks` 0 · `genome_patterns` 52 · `intelligence_graph_edges` 268
  - `enterprise_context_records` table **absent** in `abarva_control` (the
    "3,503 records / 820 relationships" some answers cite are a different
    DB/schema — cross-store split finding).
- Meridian context layer (in-VNet load telemetry, 2026-06-06 14:56): **873 chunks,
  all embedded** — program_inventory 340, it_landscape 185, enterprise_profile 171,
  it_financials 109, org_structure 68.

## Step 4 — Decommission/proof gate state (fixes staged, NOT yet deployed)

The three failed gates were root-caused (operator logs) and **fixed in PR #3240**,
but those fixes are not in the deployed `abarva/web` operator image yet, so the
jobs would still fail if re-run against the current image:

- `job-supa-drain-apply-eus` — `clients_name_key` duplicate → fix merges clients
  on `name`, never rewrites the PK (`scripts/data-plane/upsert-sql.ts`).
- `job-a24-search-verify-eus` — off-by-7 → fix surfaces Azure Search per-doc
  `value[].status` failures + bounded verify poll (`src/lib/azure-search/index-results.ts`).
- `job-supa-final-eus` — downstream; re-run after the above.

## Step 5 — Provider cutover state (Anthropic-only)

- Sentinel Ask synthesis + Source chat migrated OpenAI → audited Anthropic Claude
  in PR #3240 (Nexus already Claude). **QA-gated:** signed-in validation required
  before prod (no Clerk session available here).

## Step 6 — Attempted RBAC self-grant (cannot self-elevate)

Ran the operator-provided role grants as the cutover SP (object id
`6928d484-…`, app id `419ec65c-…`):

```
az role assignment create --role Contributor --scope .../rg-abarva-controlplane-lab-eastus …
→ AuthorizationFailed: client lacks 'Microsoft.Authorization/roleAssignments/write'
```

- The SP **cannot grant roles to itself** — creating any role assignment
  requires the caller to already hold **Owner** or **User Access Administrator**.
  The remaining grants in the script (Key Vault Secrets Officer, AcrPush, and
  User Access Administrator) all require the same `roleAssignments/write` and
  fail identically; not retried to avoid noise.
- **These grants must be executed by a human/identity that already holds Owner
  or User Access Administrator** on the subscription / control RG. The single
  unblocker the cutover actually needs is **Contributor on
  `rg-abarva-controlplane-lab-eastus`** (it includes
  `Microsoft.App/jobs/start/action`); `AcrPush` if Cursor rebuilds the image;
  `Key Vault Secrets Officer` for secret refs. Note: granting an automation SP
  **User Access Administrator** is broad (it can then grant any role) — owner's
  call; not required just to run operator jobs.

## What is required to proceed (no DNS/Vercel/Supabase changes made)

1. **Grant the SP `Microsoft.App/jobs/start/action`** (or have a human/CI trigger
   the operator jobs) so the read-only proof and the fixed gates can be run.
2. **Merge PR #3240** and rebuild/deploy the `abarva/web` operator image so the
   fixed drain/search scripts + the Azure-only inventory + the Anthropic provider
   paths are in the running image.
3. Re-run, in order, via the operator: read-only DB proof → `drain-apply` →
   `search-verify` → `supa-final`; capture green proof here.
4. **Signed-in QA** (Clerk) of Claude Sentinel/Source; assert
   `ai_egress_audit.provider=anthropic`.
5. Azure Container Apps smoke + signed-in QA pass → only then DNS.
6. Azure-only soak pass → only then remove Vercel production.

Per the rules, none of steps 5–6 (DNS, Vercel removal) were performed, and
Supabase was neither deleted nor paused.
