# SkyHarbor Private Runtime Reset/Load Runbook

## Purpose

Complete the SkyHarbor reset/load proof from a runtime that can reach the private Azure/Postgres endpoint. The local desktop pass stopped correctly because `pg-abarva-context-lab-001.postgres.database.azure.com` did not resolve from outside the private network. This runbook is the executable packet for the VNet-connected retry.

## Non-Negotiable Rules

- Run from an Azure/VNet-connected runtime that resolves the private Postgres hostname.
- Do not fall back to the legacy `DATABASE_URL` Supabase pooler for this lane.
- Do not delete anything until the live SkyHarbor inventory has been exported.
- Delete only rows positively scoped to SkyHarbor.
- Preserve `clients.id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301'` unless the reset plan explicitly recreates it.
- Keep `.auth/*.json`, `.env*`, and backup exports out of git.

## Required Runtime

Preferred:

- Azure Container Apps Job, Azure VM, Azure Function, or GitHub self-hosted runner inside the VNet/private DNS zone.

Required software:

- Node.js 24.x
- npm
- Git
- `psql` or another Postgres client for independent count/export checks
- Chromium dependencies if screenshots will be captured from the same runner

Required environment variables:

- `ABARVA_AZURE_DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `BASE_URL=https://app.abarva.ai`
- Optional embedding provider vars, if embeddings should be generated during load

## Repo Setup

```bash
git clone https://github.com/abarva-platform/abarva.git
cd abarva
git checkout main
git pull --ff-only origin main
npm ci
```

Never print secret values. Check only presence and host:

```bash
node - <<'NODE'
const url = new URL(process.env.ABARVA_AZURE_DATABASE_URL || '');
console.log(JSON.stringify({
  hasAzureUrl: Boolean(process.env.ABARVA_AZURE_DATABASE_URL),
  host: url.hostname,
}, null, 2));
NODE
```

## Gate 0: DNS And DB Connectivity

```bash
node - <<'NODE'
const dns = require('node:dns/promises');
const { Client } = require('pg');

(async () => {
  const url = new URL(process.env.ABARVA_AZURE_DATABASE_URL);
  const addresses = await dns.lookup(url.hostname, { all: true });
  const client = new Client({ connectionString: process.env.ABARVA_AZURE_DATABASE_URL });
  await client.connect();
  const result = await client.query('select current_database() as database, now() as checked_at');
  await client.end();
  console.log(JSON.stringify({ ok: true, host: url.hostname, addresses, db: result.rows[0] }, null, 2));
})().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
NODE
```

Stop if this fails.

## Gate 1: Live Inventory

Create a run folder:

```bash
RUN_ID="$(date -u +%Y-%m-%dT%H-%M-%SZ)-skyharbor-private-reset-load"
OUT="reports/skyharbor-private-reset-load/$RUN_ID"
mkdir -p "$OUT/backups"
```

Run read-only counts:

```bash
psql "$ABARVA_AZURE_DATABASE_URL" -v ON_ERROR_STOP=1 -o "$OUT/01-live-counts.txt" <<'SQL'
select 'clients' as table_name, count(*) from clients
where id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select 'enterprise_context_source_files' as table_name, count(*) from enterprise_context_source_files
where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select 'enterprise_context_chunks' as table_name, count(*) from enterprise_context_chunks
where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select 'applications' as table_name, count(*) from applications
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select 'ai_initiatives' as table_name, count(*) from ai_initiatives
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select 'vendor_contracts' as table_name, count(*) from vendor_contracts
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select 'source_events' as table_name, count(*) from source_events
where client_key in ('skyharbor-air', 'skyharbor');

select 'source_artifacts' as table_name, count(*) from source_artifacts
where tenant_key in ('skyharbor-air', 'skyharbor');
SQL
```

Review `01-live-counts.txt` before continuing.

## Gate 2: Backup Export

Export every scoped table before delete. Use CSV or JSON; JSON is easier to restore and inspect.

```bash
psql "$ABARVA_AZURE_DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
\\copy (select * from clients where id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301') to '$OUT/backups/clients.json' with csv quote e'\\x01' delimiter e'\\x02';
\\copy (select * from enterprise_context_source_files where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301') to '$OUT/backups/enterprise_context_source_files.csv' csv header;
\\copy (select * from enterprise_context_chunks where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301') to '$OUT/backups/enterprise_context_chunks.csv' csv header;
\\copy (select * from applications where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301') to '$OUT/backups/applications.csv' csv header;
\\copy (select * from ai_initiatives where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301') to '$OUT/backups/ai_initiatives.csv' csv header;
\\copy (select * from vendor_contracts where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301') to '$OUT/backups/vendor_contracts.csv' csv header;
\\copy (select * from source_events where client_key in ('skyharbor-air', 'skyharbor')) to '$OUT/backups/source_events.csv' csv header;
\\copy (select * from source_artifacts where tenant_key in ('skyharbor-air', 'skyharbor')) to '$OUT/backups/source_artifacts.csv' csv header;
SQL
```

Record checksums:

```bash
find "$OUT/backups" -type f -maxdepth 1 -print0 | sort -z | xargs -0 shasum -a 256 > "$OUT/02-backup-checksums.txt"
```

Stop if backups are missing or unexpectedly empty for tables that had inventory rows.

## Gate 3: Scoped Delete

Use one transaction. Keep the client row unless the loader needs to update it.

```bash
psql "$ABARVA_AZURE_DATABASE_URL" -v ON_ERROR_STOP=1 -o "$OUT/03-delete-log.txt" <<'SQL'
begin;

delete from source_artifacts
where tenant_key in ('skyharbor-air', 'skyharbor');

delete from source_events
where client_key in ('skyharbor-air', 'skyharbor');

delete from vendor_contracts
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

delete from ai_initiatives
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

delete from applications
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

delete from enterprise_context_chunks
where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

delete from enterprise_context_source_files
where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

commit;
SQL
```

If any FK constraint blocks the delete, stop and inspect the FK path. Do not broaden predicates blindly.

## Gate 4: Clean-Slate Verification

```bash
psql "$ABARVA_AZURE_DATABASE_URL" -v ON_ERROR_STOP=1 -o "$OUT/04-clean-slate-counts.txt" <<'SQL'
select 'enterprise_context_source_files' as table_name, count(*) from enterprise_context_source_files
where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select 'enterprise_context_chunks' as table_name, count(*) from enterprise_context_chunks
where tenant_key = 'skyharbor-air' or client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select 'applications' as table_name, count(*) from applications
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select 'ai_initiatives' as table_name, count(*) from ai_initiatives
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select 'vendor_contracts' as table_name, count(*) from vendor_contracts
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
SQL
```

Expected: zero rows for the deleted scoped tables. Stop if stale rows remain.

## Gate 5: Loader Dry Run From Private Runtime

```bash
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --dry-run 2>&1 | tee "$OUT/05-loader-dry-run.txt"
```

Expected dry-run counts:

- 3,240 context chunks
- 92 applications
- 38 initiatives
- 52 vendor contracts

## Gate 6: Real Load

```bash
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs 2>&1 | tee "$OUT/06-real-load.txt"
```

If the first load should avoid embedding spend, verify that a real skip-embedding guard exists before relying on any `--skip-embeddings` flag. The earlier local evidence noted that the shared loader did not parse that flag.

## Gate 7: Post-Load Verification

```bash
psql "$ABARVA_AZURE_DATABASE_URL" -v ON_ERROR_STOP=1 -o "$OUT/07-post-load-counts.txt" <<'SQL'
select count(*) as clients from clients
where id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select count(*) as chunks from enterprise_context_chunks
where tenant_key = 'skyharbor-air';

select source_segment_id, count(*) from enterprise_context_chunks
where tenant_key = 'skyharbor-air'
group by source_segment_id
order by 2 desc;

select embedding_status, count(*) from enterprise_context_chunks
where tenant_key = 'skyharbor-air'
group by embedding_status;

select count(*) as applications from applications
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select count(*) as initiatives from ai_initiatives
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';

select count(*) as vendor_contracts from vendor_contracts
where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
SQL
```

Expected:

- `clients = 1`
- `chunks = 3240`
- `applications = 92`
- `initiatives = 38`
- `vendor_contracts = 52`

## Gate 8: Signed-In Product Proof

Prime crawl auth states from the same branch after PR #3152 is merged, or use a branch that includes that change:

```bash
BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client skyharbor --refresh
```

Then capture signed-in product proof:

```bash
BASE_URL=https://app.abarva.ai npm run crawl:post-deploy -- \
  --base-url https://app.abarva.ai \
  --output-dir "$OUT/08-post-load-crawl" \
  --persona skyharbor-cto \
  --surface home,intelligence-root,strategic-moves-list,source-list,tower-root
```

Minimum screenshot/proof routes:

- `/home?client=skyharbor`
- `/admin/setup?client=skyharbor`
- `/intelligence?client=skyharbor`
- `/strategic-moves?client=skyharbor`
- `/source?client=skyharbor`
- `/tower?client=skyharbor`

## Gate 9: Moves And Source Proof Definition

Create or verify these two saved artifacts only after Gate 7 passes:

| Proof | Required evidence |
| --- | --- |
| Move: AI-Powered SDLC Modernization Factory | linked to `SHA-INIT-001`, DORA/product-development patterns, estimated productivity/cost impact, human approval gate |
| Source: outsourcing/vendor spend optimization | linked to `SHA-VEND-001` or `SHA-VEND-002`, vendor contract evidence, sourcing stage, savings hypothesis, artifact route |

Do not call this lane done until each proof has a persisted record ID, route, screenshot, and source evidence path.

## Completion Packet

Copy non-secret outputs into a PR/report packet:

- `01-live-counts.txt`
- `02-backup-checksums.txt`
- `03-delete-log.txt`
- `04-clean-slate-counts.txt`
- `05-loader-dry-run.txt`
- `06-real-load.txt`
- `07-post-load-counts.txt`
- crawl `comparison.json`
- screenshot paths
- Move and Source record IDs/routes

Do not commit backup exports, `.auth/*.json`, raw secrets, or private data dumps.
