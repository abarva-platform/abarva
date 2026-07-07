# Semantic2 Substrate-Proof — SkyHarbor (operator runbook)

**The gate everything waits on.** Before swapping the dataset-backed retriever for live-Azure retrieval (and flipping `semantic2_home_know` on for SkyHarbor), confirm the live `enterprise_context_*` tables actually carry the entities the 5 golden questions need — not just "rows exist", but **the payload fields the composer reads** (`executive_owner_role`, `criticality`, `platform`/`trust_score`, `vendor`).

Read-only. Touches nothing. Reuses the proven VNet-job + tenant-alias pattern from `verify-v4-live-counts.cjs`.

- **Script:** [`scripts/context-packs/verify-semantic2-golden-substrate.cjs`](../../scripts/context-packs/verify-semantic2-golden-substrate.cjs)
- **Vehicle image:** [`Dockerfile.substrate-proof`](../../Dockerfile.substrate-proof)

## Why it can't run from localhost
The DB is on a private VNet; localhost can't reach it. Run it **inside the VNet** as an ACA job, exactly like the v4 loads. Key gotchas (learned the hard way, per `docs/codex-handoff/FIRST_CAPITAL_VNET_LOAD_HANDOFF_2026-06-18.md`):
- **Only `--image` override works** — `--args`/`--yaml`/`--command` silently no-op. The command is baked into the image CMD; override a vehicle job whose `command/args` are null.
- **Build from a pruned context** — `az acr build .` from the repo root walks `.claude/worktrees` (153 GB) and hangs. Build from a `/tmp` context with only `scripts/`.
- The job's env must provide `ABARVA_AZURE_DATABASE_URL` or `DATABASE_URL` (the migrate vehicle job already has DB reach in the VNet).

## Run recipe
```bash
# 1. Pruned build context (avoids the worktrees walk)
rm -rf /tmp/s2-proof && mkdir -p /tmp/s2-proof
cp -R scripts /tmp/s2-proof/ && cp Dockerfile.substrate-proof /tmp/s2-proof/

# 2. Build the proof image into the lab ACR  (ACR name per the deploy runbook)
az acr build --registry <ACR_NAME> \
  --image semantic2-substrate-proof:latest \
  --file /tmp/s2-proof/Dockerfile.substrate-proof /tmp/s2-proof

# 3. Image-override the vehicle job (the migrate job, command/args null) and run it.
#    It already runs in the VNet with DB env. Use the same job you use for loads.
az containerapp job update -g <RESOURCE_GROUP> -n job-abarva-db-migrate-lab-eastus \
  --image <ACR_NAME>.azurecr.io/semantic2-substrate-proof:latest
az containerapp job start -g <RESOURCE_GROUP> -n job-abarva-db-migrate-lab-eastus

# 4. Read RESULT_JSON from Log Analytics (workspace 03910a48-cca5-483b-a4b6-c576a2ecfaa9).
#    Logs land in ContainerAppConsoleLogs_CL with EMPTY ContainerAppName_s;
#    filter by ContainerGroupName_s == '<job>-<execSuffix>-<replica>'.
az monitor log-analytics query -w 03910a48-cca5-483b-a4b6-c576a2ecfaa9 \
  --analytics-query "ContainerAppConsoleLogs_CL | where Log_s startswith 'RESULT_JSON' | top 5 by TimeGenerated desc" \
  -o tsv
```
(Exact `<ACR_NAME>` / `<RESOURCE_GROUP>` are in [docs/runbooks/azure-container-apps-deploy.md](../runbooks/azure-container-apps-deploy.md).)

## Reading the result
`RESULT_JSON` carries a `verdict` with `pass: true|false` and:
- `tenant_key_forms_present` — which key form the rows actually use (`skyharbor-air` vs `skyharbor`).
- `total_records`, `facts`, `relationships` — vs expected (~6083 context rows).
- `record_type_distribution` — how the live loader typed things (discovery).
- `golden_answerability` — per question, `matching_records` and a `sample_payload_keys`.
- `q1_live_sample` — actual IT-org rows (team / owner role / budget) pulled the way the composer would.

## Decision tree
| Result | Meaning | Next |
|---|---|---|
| `pass: true` | Records present **and** every golden question has matching payload keys | **Build the live-Azure retriever** (the `enterprise_context_records` analog of `skyharbor-retrieval.ts`), swap it into `composeAnyQuestion`, flip `ABARVA_FEATURE_SEMANTIC2_HOME_KNOW_TENANTS=skyharbor` on ACA. |
| `total_records` low / 0 | Data not loaded for SkyHarbor in this env | **Load first** (the v4 load job), then re-run this proof. |
| a question's `matching_records: 0` | The field is in the dataset but **not in the live payload** — the loader is dropping/renaming it | **Fix the loader (or add a payload mapping)** so the field survives, then re-run. Do NOT wire live retrieval over a payload that's missing the field — it would reproduce the "unavailable" answers. |

**Until `pass: true`, the route stays dataset-backed.** The dataset-backed answers are already proven executive-grade (see [GOLDEN_5_RESULTS.md](GOLDEN_5_RESULTS.md)); this proof is purely the gate for moving the *retrieval source* to the live semantic layer.
