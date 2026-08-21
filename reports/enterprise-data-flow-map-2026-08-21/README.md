# Reproduce The Sweep

This folder is a read-only audit artifact. It records what the current checkout exposed on 2026-08-21. It does not apply migrations, edit tests, run loaders, or mutate tenant data.

## Artifact Set

- `DATA_FLOW_MAP.md` - narrative map and findings.
- `tables.json` - database tables, views, dynamic file reads, and path reads found in the sweep.
- `module-chains.json` - product route root to reader chains.
- `conflicts.json` - verified and unverified conflicts.
- `orphans.json` - negative results, unresolved readers, and static/stub surfaces.

## Commands

From `/Users/anand/Projects/nexus`:

```bash
nl -ba docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md | sed -n '1,90p'
nl -ba datasets/tenant-inputs/tenant-input-registry.json | sed -n '30,130p'
nl -ba src/lib/enterprise-context/schema.ts | sed -n '1,30p'
nl -ba src/lib/tenant/aliases.ts | sed -n '20,110p;145,160p'
nl -ba src/lib/enterprise-data/enterprise-profile/enterprise-profile-read-model.ts | sed -n '1,120p'
nl -ba src/lib/enterprise-data/enterprise-profile/enterprise-profile-foundation.ts | sed -n '20,30p;146,200p;220,285p;343,370p;620,660p'
nl -ba src/lib/enterprise-knowledge/live-preview/knowledge-layer-live-preview.ts | sed -n '187,200p;246,309p;645,680p;752,815p'
nl -ba src/lib/home/local-cxo-runtime.ts | sed -n '86,117p;460,489p;560,635p'
nl -ba 'src/app/(maestro)/home/page.tsx' | sed -n '1,40p'
nl -ba 'src/app/(maestro)/tower/page.tsx' | sed -n '54,72p'
nl -ba src/lib/cio-tower/tower-mart-view-model.ts | sed -n '260,352p'
nl -ba 'src/app/(maestro)/strategic-moves/page.tsx' | sed -n '18,33p'
nl -ba src/lib/programs/queries.ts | sed -n '1,4p;97,197p'
nl -ba src/lib/data-plane/read-adapters/programsReadAdapter.ts | sed -n '120,241p'
nl -ba 'src/app/(maestro)/source/page.tsx' | sed -n '1,20p'
nl -ba 'src/app/(maestro)/source/portfolio/page.tsx' | sed -n '17,60p'
nl -ba 'src/app/(maestro)/source/vendor-portfolio/page.tsx' | sed -n '11,49p'
nl -ba src/lib/source/data-model/read-adapter.ts | sed -n '1,14p;37,257p'
nl -ba 'src/app/(maestro)/intelligence/page.tsx' | sed -n '28,66p'
nl -ba src/lib/home/enterprise-landscape-view-model.ts | sed -n '91,240p'
nl -ba 'src/app/(maestro)/admin/page.tsx' | sed -n '23,46p'
nl -ba 'src/app/(maestro)/setup/files/page.tsx' | sed -n '11,17p'
nl -ba src/lib/workspace-explorer/tenant-vault-adapter.ts | sed -n '49,69p'
nl -ba src/lib/context-ingestion/tenant-context-read-model.ts | sed -n '207,418p'
nl -ba src/lib/intelligence/context-read-model.ts | sed -n '245,323p'
nl -ba src/lib/enterprise-context/intelligence-read-model.ts | sed -n '120,205p;537,548p;745,793p'
nl -ba src/lib/context-ingestion/phs-stage-readiness-read-model.ts | sed -n '48,79p'
nl -ba src/lib/tower/tower-materialized-read-model.ts | sed -n '190,250p'
nl -ba src/lib/source/contract-evidence/read-model.ts | sed -n '116,155p'
nl -ba src/lib/admin/customer-admin-read-model.ts | sed -n '617,765p'
nl -ba src/lib/admin/connector-health-read-model.ts | sed -n '1,6p;73,95p'
nl -ba src/lib/admin/data-lineage-read-model.ts | sed -n '71,125p;184,192p'
nl -ba src/lib/sentinel/pattern-graph-read-model.ts | sed -n '134,137p;197,208p'
nl -ba src/lib/solutions/architecture-draft-read-model.ts | sed -n '582,637p'
nl -ba src/scripts/tower/materialize-read-model.ts | sed -n '61,92p'
nl -ba src/scripts/tower/load-lakeshore-holdings-read-model.ts | sed -n '129,170p;466,505p'
```

Read-model count checks:

```bash
rg --files src | rg '(read-model|readModel|ReadModel)\.(ts|tsx)$' | sort
rg --files | rg 'read-model|readModel|ReadModel' | sort
```

Home route reader negative check:

```bash
rg -n 'readSkyHarborAiSuccessHome|function readSkyHarborAiSuccessHome|const readSkyHarborAiSuccessHome' src/lib src/app
```

Meridian row-count reproduction:

```bash
node - <<'NODE'
const fs = require('fs');
for (const p of [
  'datasets/tenant-inputs/active/meridian-health/current/04_applications_systems.csv',
  'datasets/tenant-inputs/active/meridian-health/current/12_relationships.csv',
  'docs/enterprise-context/generated/meridian-vnext/03-cmdb-applications-services.csv',
  'docs/enterprise-context/generated/meridian-vnext/04-ci-relationships-dependencies.csv',
  'datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/relationship-graph/edges.csv',
  'datasets/tenant-inputs/generated/meridian-health/standard-2026-07-v3/relationship_summary.csv'
]) {
  const rows = fs.readFileSync(p, 'utf8').trim().split(/\r?\n/).length - 1;
  console.log(`${p}\t${rows}`);
}
NODE
```

SkyHarbor source-selection reproduction:

```bash
nl -ba reports/data-remediation/skyharbor-applications/latest/source-selection.md | sed -n '1,20p'
nl -ba reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json | sed -n '34860,34890p'
rg -n '503|1\\.54|1540000000|266000000' reports datasets docs src /Users/anand/Downloads/SkyHarbor-E2E-Data
```

JSON validation:

```bash
node -e "for (const p of ['tables.json','module-chains.json','conflicts.json','orphans.json']) JSON.parse(require('fs').readFileSync('reports/enterprise-data-flow-map-2026-08-21/'+p,'utf8')); console.log('json ok')"
```
