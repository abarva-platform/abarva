import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredChecks = [
  {
    file: 'scripts/v7/sql/intelligence-v7-moat-foundation.sql',
    checks: [
      'intelligence_v7.active_tenant_contract_versions',
      'intelligence_v7.tenant_contract_promotion_events',
      'intelligence_v7.module_readiness_scores',
      'intelligence_v7.derived_intelligence_quality_reports',
      'intelligence_v7.existing_tenant_upgrade_snapshots',
      'fact_status',
      'current_tenant_pack_runs',
      'current_business_records',
    ],
  },
  {
    file: 'supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql',
    checks: [
      'intelligence_v7.active_tenant_contract_versions',
      'intelligence_v7.module_readiness_scores',
      'intelligence_v7.derived_intelligence_quality_reports',
      'current_tenant_pack_runs',
    ],
    rejects: ['\\i '],
  },
  {
    file: 'scripts/v7/load-tenant-v7-azure.mjs',
    checks: [
      'applyMoatFoundation',
      'promoteTenantContract',
      'MODULE_REQUIREMENTS',
      'module_readiness_scores',
      'derived_intelligence_quality_reports',
      'active_tenant_contract_versions',
    ],
  },
  {
    file: 'scripts/v7/load-lakeshore-holdco-v7-azure.mjs',
    checks: [
      'applyMoatFoundation',
      'promoteTenantContract',
      'MODULE_REQUIREMENTS',
      'module_readiness_scores',
      'active_tenant_contract_versions',
    ],
  },
  {
    file: 'src/lib/home/know/v7-home-ask.ts',
    checks: ['from intelligence_v7.current_tenant_pack_runs'],
  },
  {
    file: 'src/lib/intelligence/ask/retrievers/v7-dossier.ts',
    checks: ['from intelligence_v7.current_tenant_pack_runs'],
    rejects: ['v7.0.0-synthetic-depth-v2-20260703'],
  },
  {
    file: 'src/lib/tower/v7-tower-projection.ts',
    checks: [
      'join intelligence_v7.current_tenant_pack_runs run',
      "coalesce(r.fact_status, 'active') = 'active'",
    ],
  },
];

const failures = [];

for (const check of requiredChecks) {
  const absolute = path.join(root, check.file);
  if (!fs.existsSync(absolute)) {
    failures.push(`${check.file}: missing file`);
    continue;
  }
  const content = fs.readFileSync(absolute, 'utf8');
  for (const expected of check.checks ?? []) {
    if (!content.includes(expected)) {
      failures.push(`${check.file}: missing required marker "${expected}"`);
    }
  }
  for (const rejected of check.rejects ?? []) {
    if (content.includes(rejected)) {
      failures.push(`${check.file}: contains rejected marker "${rejected}"`);
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  verified: requiredChecks.map((check) => check.file),
}, null, 2));
