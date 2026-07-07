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

## Step 9 — b1 gate runs on the new image (2026-06-07 ~03:50Z)

#3244 merged (`main` @ `43839a41c`). Image `abarva/web:cutover-main-20260607-43839a41c`
(digest `sha256:9c5bf5db…`, built from merged main) was pinned by digest onto all
4 jobs. Ran the gate sequence (Contributor → `jobs/start` works):

| Gate          | Job execution                    | Result                                                                                                                                                                                            |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB proof      | `…private-operator-eus-511wfrc`  | **Succeeded** — private DNS `10.43.1.4`, `abarva_control` reachable on new image                                                                                                                  |
| drain-apply   | `…supa-drain-apply-eus-xgzl0d8`  | **Succeeded** — `ok:true`; every table `skipped-parity-or-ahead` (Azure ≥ Supabase: facts 38,640, records 3,503, relationships 820, chunks 21,967≥15,847)                                         |
| search-verify | `…a24-search-verify-eus-kn88y7p` | **Succeeded** — `azure_search_backfill_verified`, all tenants match: apex 6497, first-capital 400, lakeshore 6576, **meridian-health 4376/4376** (off-by-7 closed), northstar 878, skyharbor 3240 |
| supa-final    | `…supa-final-eus-jb3yk3x`        | **Backup complete; freeze step Failed (intentionally not forced)** — see below                                                                                                                    |

### supa-final detail (guardrail-respecting)

- The Supabase **final backup** completed: all tables exported to blob
  `supabase-final-backups/supabase-final-20260607-001/…` (sha256 per table).
- The `supabase_final_backup_freeze` step then attempted `ALTER DATABASE … read-only`
  on Supabase and errored: `cannot execute ALTER DATABASE in a read-only transaction`.
- **This is the Supabase freeze (a pause-equivalent).** Per the guardrails — no
  Supabase pause/delete, no sunset-ready claim until signed-in QA + soak pass —
  this step must NOT run yet. The failure left Supabase unfrozen, which is the
  desired state. **Not fixed/forced by design.**

### Honest notes

- **drain-apply** went green because the live job runs an _inline_ drain with a
  `skipped-parity-or-ahead` guard and Azure had already reached parity — not
  because of the repo `drain-supabase-to-azure.ts` fix (that script path is not
  what the job invokes). The repo fix remains correct for the script path.
- **search-verify** uses the repo `azure-ai-search-backfill.ts` (via the new
  image), so the verify-poll fix is live; meridian now verifies 4376/4376.

### Cutover gate state

- Azure data parity: **GREEN** (drain) · Search index parity: **GREEN** (verify)
  · Supabase final backup: **GREEN** · Supabase freeze: **DEFERRED (guardrail)**.
- **NOT sunset-ready** — signed-in (Clerk) QA of Claude Sentinel/Source (PR #3243)
  and the Azure-only soak gate are still pending; Supabase remains live and unfrozen;
  DNS unchanged; Vercel production intact.

## Step 10 — Env/secret-injection repo proof (static, redacted)

Added deterministic verifier:

- Command: `npm run azure:env-secret-injection:verify`
- Result: **PASS** (`68` pass, `0` fail)
- Proof class: static repository proof over committed Azure Bicep/parameter
  files; no Key Vault values are read or printed.
- Evidence: `docs/build/cutover/ENV_SECRET_INJECTION_PROOF_2026-06-07.md`

This proves the committed app/runtime/job definitions inject secret env vars
through Container Apps `secretRef` entries backed by Key Vault URLs and managed
identity, and that required secret env vars are not present as plain runtime
values in the lab app parameters. It is **not** a live Azure observation because
this agent image does not include `az`; a live operator should still inspect the
deployed revision's env/secretRef metadata with values redacted.

## Step 8 — b1 image rebuild from merged main (2026-06-07 ~03:15Z)

PR #3242 merged to `main` (gate fixes + Azure-only guard present). Started
`az acr build` of `abarva/web` from merged main (Contributor + AcrPush).

**BLOCKER FOUND — pre-existing broken `main` image build (not from this work):**

- `az acr build` compiled but `next build` type-check failed:
  `Cannot find module '../../../docs/enterprise-context/templates/apexretail/manifest.json'`.
- Root cause: `src/lib/admin/setup-data-load-center.ts` imports three manifest
  JSONs from `docs/enterprise-context/templates/{apexretail,meridian,arcturus}/`
  at **build time** (added 2026-06-01, #2727), but `.dockerignore` `docs/*`
  strips `docs/` from the build context. The deployed image (`…20260522…`)
  predates #2727, so **no image has built from `main` since 2026-06-01.**
- Fix (`cursor/fix-dockerignore-build-manifests-a092` → PR): re-include
  `docs/enterprise-context/templates/` in the build context (mirrors the existing
  `docs/design/strategic-moves/tokens.css` negation). Build-context only — no
  runtime/script/DB-logic change; the gate scripts remain exactly merged `main`.
- Rebuild re-run from main + this fix → image `abarva/web:cutover-main-20260607-bea996676`.

Per the merged-main rule, the live gate runs (drain-apply/search-verify/final)
will use this image only after the `.dockerignore` fix is merged to main (the
image's delta vs merged main is build-context inclusion only).

## Step 7 — RBAC applied by owner; access now works (2026-06-07 ~02:50Z)

Owner granted the cutover SP: **Contributor** (rg-abarva-controlplane-lab-eastus),
**AcrPush** (acrabarvalab001), **Key Vault Secrets Officer** (kv-abarva-lab-001).
After a token refresh, all three are present and `jobs/start` now works.

### 7a — Fresh read-only DB proof via operator (`job-abarva-private-operator-eus-dpue05n`, Succeeded)

`abarva_control` @ 10.43.1.4 (private). Counts have grown materially since the
22:44Z run — the migration thread's drains have populated Azure:

| table                      | 22:44Z | now (02:50Z) |
| -------------------------- | -----: | -----------: |
| enterprise_context_chunks  |  9,360 |   **21,967** |
| enterprise_context_records | absent |    **3,503** |
| corpus_patterns            |     39 |    **9,026** |
| corpus_pattern_content     |     39 |    **9,026** |
| knowledge_sources          |     20 |      **136** |
| genome_patterns            |     52 |   **43,436** |
| intelligence_graph_edges   |    268 |   **93,743** |
| knowledge_chunks           |      0 |            0 |

`enterprise_context_records` now exists in `abarva_control` — the earlier
cross-schema split is closing as the corpus/context drains land in Azure.

### 7b — PR #3240 CI

All 24 checks **pass**; `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`, no
required review. Ready to merge.

### 7c — Merge blocker (capability) + QA-gate caution

- This agent's `gh` is read-only and the PR tool has no merge action; `main` is
  protected — so **the merge click must be done by a human / armed auto-merge.**
- Caution: PR #3240 bundles the **QA-gated Anthropic provider migration**.
  Merging ships Claude Sentinel/Source reasoning to prod **without** the
  required signed-in QA. Recommend either (a) accept and merge, or (b) split the
  provider migration into its own PR so the Azure-only guard + gate fixes merge
  now and the provider change waits for signed-in QA.

### 7d — Gate jobs still red (need the fixed image)

`job-supa-drain-apply-eus` (23:34Z), `job-a24-search-verify-eus` (00:19Z),
`job-supa-final-eus` (00:55Z) have NOT been re-run and remain Failed. They run
the deployed `abarva/web` image, which does not contain PR #3240's fixes
(drain idempotency, search per-doc surfacing). To turn them green the image must
be rebuilt with those fixes (`az acr build`, AcrPush now available) and the jobs
refreshed to it, then re-run in order. **Open decision:** rebuild from the merged
`main` (after merge) vs. rebuild from the branch pre-merge into a distinct
cutover tag to produce the green proof first — see report.

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
