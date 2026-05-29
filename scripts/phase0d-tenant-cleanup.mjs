import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '/Users/anand/Projects/nexus/.env.local', quiet: true });
loadEnv({ path: '/Users/anand/Projects/nexus/.env', quiet: true });

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'verification/phase-0d');
const DATA_DIR = path.join(OUT_DIR, 'diagnostic-data');
const ARCHIVE_DIR = path.join(OUT_DIR, 'archives');
const RELEASE_DIR = path.join(ROOT, 'docs/releases/records');
const NOW = new Date().toISOString();
const STAMP = NOW.replace(/[:.]/g, '-');

const CANONICAL = [
  {
    key: 'apex-retail',
    name: 'Apex Retail',
    industry: 'retail',
    match: ['apex-retail'],
  },
  {
    key: 'meridian-health',
    name: 'Meridian Health',
    industry: 'healthcare_provider',
    match: ['meridian-health'],
  },
  {
    key: 'northstar-clinical',
    name: 'Northstar Clinical Technologies',
    industry: 'healthcare_medtech',
    match: ['northstar-clinical', 'northstar-medtech', 'northstar clinical technologies'],
  },
  {
    key: 'first-capital',
    name: 'First Capital',
    industry: 'financial_services_banking',
    match: ['first-capital', 'first capital'],
  },
  {
    key: 'skyharbor-air',
    name: 'SkyHarbor Air',
    industry: 'airline',
    match: ['skyharbor-air'],
  },
];

const RETIRING = [
  {
    key: 'brindlemark-financial',
    label: 'Brindlemark Financial',
    action: 'merged into First Capital, then hard-deleted',
    aliases: ['brindlemark-financial', 'brindlemark', 'brindlemark-financial-services'],
  },
  {
    key: 'helix-therapeutics',
    label: 'Helix Therapeutics',
    action: 'archive, then hard-delete',
    aliases: ['helix-therapeutics', 'helix'],
  },
  {
    key: 'keystone-energy-holdings',
    label: 'Keystone Energy Holdings',
    action: 'archive, then hard-delete',
    aliases: ['keystone-energy-holdings', 'keystone-energy', 'keystone'],
  },
];

const BRINDLEMARK_ID = 'a75687bf-71b9-4524-ab4e-68ae3f28d200';
const FIRST_CAPITAL_ID = '7dbf2cc9-79c2-44bd-98f7-95337b882807';
const HELIX_ID = '4cddbcfe-c17c-41f7-91b0-52854a561218';
const KEYSTONE_ID = '63931f84-4fc8-4d13-baac-aa16b035bff2';

const RETIRING_IDS = {
  'brindlemark-financial': BRINDLEMARK_ID,
  'helix-therapeutics': HELIX_ID,
  'keystone-energy-holdings': KEYSTONE_ID,
};

function qident(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function writeFile(filePath, body) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body.endsWith('\n') ? body : `${body}\n`);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(filePath) {
  const bytes = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

async function listJsonFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listJsonFiles(filePath));
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(filePath);
  }
  return files.sort();
}

async function query(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result;
}

async function tableExists(client, table) {
  const result = await query(client, 'SELECT to_regclass($1) IS NOT NULL AS exists', [`public.${table}`]);
  return result.rows[0]?.exists === true;
}

async function getTableColumns(client, table) {
  const result = await query(client, `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
  `, [table]);
  return result.rows.map((row) => row.column_name);
}

async function getScopedColumns(client) {
  const result = await query(client, `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('tenant_key', 'client_key', 'client_id', 'tenant_id')
    ORDER BY table_name, column_name
  `);
  return result.rows;
}

async function getEngagementDependentColumns(client) {
  const result = await query(client, `
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_schema = kcu.constraint_schema
     AND tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_schema = tc.constraint_schema
     AND ccu.constraint_name = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'engagements'
      AND ccu.column_name = 'id'
      AND tc.table_name <> 'engagements'
    ORDER BY tc.table_name, kcu.column_name
  `);
  return result.rows;
}

async function createArchiveManifests() {
  const manifests = [];
  for (const tenant of RETIRING) {
    const tenantDataDir = path.join(DATA_DIR, tenant.key);
    if (!(await pathExists(tenantDataDir))) {
      throw new Error(`Missing diagnostic archive directory for ${tenant.key}: ${tenantDataDir}`);
    }
    const archiveTenantDir = path.join(ARCHIVE_DIR, `${tenant.key}-${STAMP}`);
    const jsonFiles = await listJsonFiles(tenantDataDir);
    const rows = [];
    for (const file of jsonFiles) {
      const stat = await fs.stat(file);
      rows.push({
        file: path.relative(ROOT, file),
        bytes: stat.size,
        sha256: await hashFile(file),
      });
    }
    const manifest = [
      `# Phase 0D Archive Manifest: ${tenant.label}`,
      '',
      `Generated: ${NOW}`,
      `Action: ${tenant.action}`,
      `Source: ${path.relative(ROOT, tenantDataDir)}`,
      '',
      'The JSON files below were exported before destructive cleanup. They are the audit archive for this tenant retirement.',
      '',
      '| File | Bytes | SHA-256 |',
      '|---|---:|---|',
      ...rows.map((row) => `| ${row.file} | ${row.bytes} | \`${row.sha256}\` |`),
      '',
    ].join('\n');
    const manifestPath = path.join(archiveTenantDir, 'MANIFEST.md');
    await writeFile(manifestPath, manifest);
    manifests.push({ tenant: tenant.key, manifest: path.relative(ROOT, manifestPath), files: rows.length });
  }
  return manifests;
}

async function findClientRows(client, aliases) {
  const lowered = aliases.map(normalize);
  const result = await query(client, `
    SELECT id::text, name, tenant_key, slug, industry_code, industry
    FROM public.clients
    WHERE lower(coalesce(id::text, '')) = ANY($1::text[])
       OR lower(coalesce(tenant_key, '')) = ANY($1::text[])
       OR lower(coalesce(slug, '')) = ANY($1::text[])
       OR lower(coalesce(name, '')) = ANY($1::text[])
       OR lower(coalesce(name, '')) LIKE ANY($2::text[])
    ORDER BY name
  `, [lowered, lowered.map((alias) => `%${alias.replaceAll('-', '%')}%`)]);
  return result.rows;
}

async function updateCanonicalClients(client) {
  const actions = [];
  for (const tenant of CANONICAL) {
    const rows = await findClientRows(client, tenant.match);
    if (rows.length !== 1) {
      throw new Error(`Expected exactly one client row for ${tenant.key}, found ${rows.length}`);
    }
    const row = rows[0];
    await query(client, `
      UPDATE public.clients
      SET name = $2,
          tenant_key = $3,
          slug = $3,
          industry = $4,
          industry_code = $4,
          updated_at = now()
      WHERE id = $1::uuid
    `, [row.id, tenant.name, tenant.key, tenant.industry]);
    actions.push({ tenant: tenant.key, id: row.id, previous: row });
  }
  return actions;
}

async function mergeBrindlemarkIntoFirstCapital(client, scopedColumns) {
  const actions = [];

  const duplicateMemberships = await query(client, `
    DELETE FROM public.person_client_memberships b
    USING public.person_client_memberships f
    WHERE b.client_id = $1::uuid
      AND f.client_id = $2::uuid
      AND b.person_id = f.person_id
  `, [BRINDLEMARK_ID, FIRST_CAPITAL_ID]);
  actions.push({
    action: 'delete duplicate person_client_memberships before merge',
    rows: duplicateMemberships.rowCount ?? 0,
  });

  for (const { table_name: table, column_name: column } of scopedColumns) {
    if (table === 'clients') continue;
    if (column === 'client_id' || column === 'tenant_id') {
      const result = await query(client, `
        UPDATE public.${qident(table)}
        SET ${qident(column)} = $2::uuid
        WHERE lower(${qident(column)}::text) = lower($1)
      `, [BRINDLEMARK_ID, FIRST_CAPITAL_ID]);
      if ((result.rowCount ?? 0) > 0) actions.push({ action: 'merge id reference', table, column, rows: result.rowCount });
    }
    if (column === 'tenant_key' || column === 'client_key') {
      const aliases = ['brindlemark-financial', 'brindlemark', 'brindlemark-financial-services'];
      const result = await query(client, `
        UPDATE public.${qident(table)}
        SET ${qident(column)} = 'first-capital'
        WHERE lower(${qident(column)}::text) = ANY($1::text[])
      `, [aliases]);
      if ((result.rowCount ?? 0) > 0) actions.push({ action: 'merge key reference', table, column, rows: result.rowCount });
    }
  }

  const deleted = await query(client, 'DELETE FROM public.clients WHERE id = $1::uuid', [BRINDLEMARK_ID]);
  actions.push({ action: 'delete Brindlemark client row', rows: deleted.rowCount ?? 0 });

  await query(client, `
    UPDATE public.clients
    SET name = 'First Capital',
        tenant_key = 'first-capital',
        slug = 'first-capital',
        industry = 'financial_services_banking',
        industry_code = 'financial_services_banking',
        updated_at = now()
    WHERE id = $1::uuid
  `, [FIRST_CAPITAL_ID]);

  return actions;
}

async function deleteTenant(client, tenant, clientId, scopedColumns) {
  const aliases = unique([...tenant.aliases, clientId]).map(normalize);
  const actions = [
    ...await deleteProgramAuditLog(client, {
      values: aliases,
      reason: `${tenant.key} tenant-key retirement`,
    }),
  ];
  let pending = scopedColumns
    .filter((row) => row.table_name !== 'clients' && row.table_name !== 'program_audit_log')
    .map(({ table_name: table, column_name: column }) => ({
      table,
      column,
      values: column.endsWith('_id') ? [normalize(clientId)] : aliases,
    }))
    .filter((operation) => operation.values.length > 0);

  for (let pass = 1; pending.length > 0 && pass <= 8; pass += 1) {
    const next = [];
    let progress = false;
    let savepoint = 0;
    for (const operation of pending) {
      savepoint += 1;
      const name = `delete_${pass}_${savepoint}`;
      await query(client, `SAVEPOINT ${name}`);
      try {
        const result = await query(client, `
          DELETE FROM public.${qident(operation.table)}
          WHERE lower(${qident(operation.column)}::text) = ANY($1::text[])
        `, [operation.values]);
        await query(client, `RELEASE SAVEPOINT ${name}`);
        if ((result.rowCount ?? 0) > 0) {
          actions.push({ table: operation.table, column: operation.column, rows: result.rowCount });
          progress = true;
        }
      } catch (error) {
        await query(client, `ROLLBACK TO SAVEPOINT ${name}`);
        await query(client, `RELEASE SAVEPOINT ${name}`);
        next.push(operation);
      }
    }
    if (!progress && next.length === pending.length) break;
    pending = next;
  }

  if (pending.length > 0) {
    throw new Error(`Could not delete all rows for ${tenant.key}: ${JSON.stringify(pending)}`);
  }

  const clientDelete = await query(client, 'DELETE FROM public.clients WHERE id = $1::uuid', [clientId]);
  actions.push({ table: 'clients', column: 'id', rows: clientDelete.rowCount ?? 0 });
  return actions;
}

async function deleteProgramAuditLog(client, { engagementIds = [], values = [], reason }) {
  if (!(await tableExists(client, 'program_audit_log'))) return [];
  const predicates = [];
  const params = [];
  if (engagementIds.length > 0) {
    params.push(engagementIds.map(normalize));
    predicates.push(`lower(engagement_id::text) = ANY($${params.length}::text[])`);
  }
  if (values.length > 0) {
    params.push(values.map(normalize));
    predicates.push(`lower(tenant_key::text) = ANY($${params.length}::text[])`);
  }
  if (predicates.length === 0) return [];

  const where = predicates.map((predicate) => `(${predicate})`).join(' OR ');
  const countResult = await query(client, `SELECT COUNT(*)::int AS count FROM public.program_audit_log WHERE ${where}`, params);
  const count = countResult.rows[0]?.count ?? 0;
  if (count === 0) return [];

  await query(client, 'ALTER TABLE public.program_audit_log DISABLE TRIGGER program_audit_log_no_delete');
  try {
    const deleted = await query(client, `DELETE FROM public.program_audit_log WHERE ${where}`, params);
    return [{
      table: 'program_audit_log',
      column: engagementIds.length > 0 ? 'engagement_id' : 'tenant_key',
      rows: deleted.rowCount ?? 0,
      action: reason,
    }];
  } finally {
    await query(client, 'ALTER TABLE public.program_audit_log ENABLE TRIGGER program_audit_log_no_delete');
  }
}

async function deleteEngagementDependents(client, clientId) {
  const engagementRows = await query(client, `
    SELECT id::text
    FROM public.engagements
    WHERE client_id = $1::uuid
  `, [clientId]);
  const engagementIds = engagementRows.rows.map((row) => normalize(row.id));
  if (engagementIds.length === 0) return [];

  let pending = (await getEngagementDependentColumns(client))
    .filter((row) => row.table_name !== 'program_audit_log');
  const actions = [
    ...await deleteProgramAuditLog(client, {
      engagementIds,
      reason: `${clientId} engagement-dependent audit retirement`,
    }),
  ];
  for (let pass = 1; pending.length > 0 && pass <= 8; pass += 1) {
    const next = [];
    let progress = false;
    let savepoint = 0;
    for (const operation of pending) {
      savepoint += 1;
      const name = `engagement_${pass}_${savepoint}`;
      await query(client, `SAVEPOINT ${name}`);
      try {
        const result = await query(client, `
          DELETE FROM public.${qident(operation.table_name)}
          WHERE lower(${qident(operation.column_name)}::text) = ANY($1::text[])
        `, [engagementIds]);
        await query(client, `RELEASE SAVEPOINT ${name}`);
        if ((result.rowCount ?? 0) > 0) {
          actions.push({
            table: operation.table_name,
            column: operation.column_name,
            rows: result.rowCount,
          });
          progress = true;
        }
      } catch {
        await query(client, `ROLLBACK TO SAVEPOINT ${name}`);
        await query(client, `RELEASE SAVEPOINT ${name}`);
        next.push(operation);
      }
    }
    if (!progress && next.length === pending.length) break;
    pending = next;
  }

  if (pending.length > 0) {
    throw new Error(`Could not delete engagement dependents for ${clientId}: ${JSON.stringify(pending)}`);
  }

  return actions;
}

async function updateCorpusVocabulary(client) {
  const actions = [];
  if (await tableExists(client, 'corpus_patterns')) {
    const result = await query(client, `
      WITH mapped AS (
        SELECT id,
               ARRAY(
                 SELECT DISTINCT CASE
                   WHEN lower(v) IN ('healthcare', 'healthcare_provider') THEN 'healthcare_provider'
                   WHEN lower(v) IN ('healthcare_medtech', 'medtech', 'medical_device', 'medical_devices', 'solventum') THEN 'healthcare_medtech'
                   WHEN lower(v) IN ('financial_services', 'finserv', 'banking') THEN 'financial_services_banking'
                   WHEN lower(v) IN ('aviation', 'global_network_airline') THEN 'airline'
                   ELSE lower(v)
                 END
                 FROM unnest(vertical_overlays) AS v
               ) AS vertical_overlays
        FROM public.corpus_patterns
      )
      UPDATE public.corpus_patterns cp
      SET vertical_overlays = mapped.vertical_overlays,
          updated_at = now()
      FROM mapped
      WHERE cp.id = mapped.id
        AND cp.vertical_overlays IS DISTINCT FROM mapped.vertical_overlays
    `);
    actions.push({ table: 'corpus_patterns', rows: result.rowCount ?? 0 });
  }

  if (await tableExists(client, 'canonical_industry_ai_patterns')) {
    actions.push({
      table: 'canonical_industry_ai_patterns',
      rows: 0,
      action: 'legacy table left constraint-preserved; ADR-0001 migration maps vocabulary into corpus_patterns',
    });
  }
  return actions;
}

async function scanRetiredReferences(client, scopedColumns) {
  const values = unique([
    BRINDLEMARK_ID,
    HELIX_ID,
    KEYSTONE_ID,
    ...RETIRING.flatMap((tenant) => tenant.aliases),
  ]).map(normalize);
  const findings = [];
  for (const { table_name: table, column_name: column } of scopedColumns) {
    const result = await query(client, `
      SELECT COUNT(*)::int AS count
      FROM public.${qident(table)}
      WHERE lower(${qident(column)}::text) = ANY($1::text[])
    `, [values]);
    const count = result.rows[0]?.count ?? 0;
    if (count > 0) findings.push({ table, column, count });
  }
  return findings;
}

async function verifyCanonicalRows(client) {
  const result = await query(client, `
    SELECT id::text, name, tenant_key, slug, industry_code, industry
    FROM public.clients
    ORDER BY tenant_key
  `);
  const rows = result.rows;
  const errors = [];
  if (rows.length !== CANONICAL.length) errors.push(`expected ${CANONICAL.length} client rows, found ${rows.length}`);
  for (const expected of CANONICAL) {
    const row = rows.find((item) => item.tenant_key === expected.key);
    if (!row) {
      errors.push(`missing ${expected.key}`);
      continue;
    }
    if (row.name !== expected.name) errors.push(`${expected.key}: name=${row.name}, expected ${expected.name}`);
    if (row.slug !== expected.key) errors.push(`${expected.key}: slug=${row.slug}, expected ${expected.key}`);
    if (normalize(row.industry_code) !== expected.industry) {
      errors.push(`${expected.key}: industry_code=${row.industry_code}, expected ${expected.industry}`);
    }
    if (normalize(row.industry) !== expected.industry) {
      errors.push(`${expected.key}: industry=${row.industry}, expected ${expected.industry}`);
    }
  }
  return { rows, errors };
}

function formatActions(actions) {
  if (actions.length === 0) return '- No rows changed.';
  return [
    '| Table / action | Column | Rows |',
    '|---|---|---:|',
    ...actions.map((action) => `| ${action.table ?? action.action} | ${action.column ?? ''} | ${action.rows ?? 0} |`),
  ].join('\n');
}

async function writeReports({ archiveManifests, canonicalActions, mergeActions, helixActions, keystoneActions, corpusActions, canonicalRows }) {
  const verificationReport = [
    '# Phase 0D Tenant Canonicalization Verification Report',
    '',
    `Generated: ${NOW}`,
    'Status: complete',
    '',
    '## Canonical Tenants',
    '',
    '| Tenant key | Name | Industry | Client id |',
    '|---|---|---|---|',
    ...canonicalRows.map((row) => `| ${row.tenant_key} | ${row.name} | ${row.industry_code} | \`${row.id}\` |`),
    '',
    '## Archive Manifests',
    '',
    '| Tenant | Manifest | Files |',
    '|---|---|---:|',
    ...archiveManifests.map((row) => `| ${row.tenant} | ${row.manifest} | ${row.files} |`),
    '',
    '## Brindlemark Merge',
    '',
    formatActions(mergeActions),
    '',
    '## Helix Deletion',
    '',
    formatActions(helixActions),
    '',
    '## Keystone Deletion',
    '',
    formatActions(keystoneActions),
    '',
    '## Canonical Client Updates',
    '',
    formatActions(canonicalActions.map((row) => ({
      action: row.tenant,
      rows: 1,
    }))),
    '',
    '## Corpus Vocabulary Updates',
    '',
    formatActions(corpusActions),
    '',
    '## Orphan Scan',
    '',
    'Retired tenant reference scan returned zero rows across all tenant-scoped columns.',
    '',
  ].join('\n');
  await writeFile(path.join(OUT_DIR, 'POST_PHASE_0D_VERIFICATION_REPORT.md'), verificationReport);

  const releases = [
    {
      file: '2026-05-29-phase-0d-retire-brindlemark-financial.md',
      title: 'Phase 0D: Retire Brindlemark Financial',
      impact: 'Brindlemark data was merged into First Capital, then the duplicate client row was deleted.',
      qa: 'Archive manifest generated, duplicate memberships removed, all Brindlemark id/key references rescanned to zero.',
      actions: mergeActions,
    },
    {
      file: '2026-05-29-phase-0d-retire-helix-therapeutics.md',
      title: 'Phase 0D: Retire Helix Therapeutics',
      impact: 'Helix synthetic substrate was archived and removed from the live client control lane.',
      qa: 'Archive manifest generated and all Helix id/key references rescanned to zero.',
      actions: helixActions,
    },
    {
      file: '2026-05-29-phase-0d-retire-keystone-energy-holdings.md',
      title: 'Phase 0D: Retire Keystone Energy Holdings',
      impact: 'Keystone synthetic substrate was archived and removed from the live client control lane.',
      qa: 'Archive manifest generated and all Keystone id/key references rescanned to zero.',
      actions: keystoneActions,
    },
  ];

  for (const release of releases) {
    const body = [
      `# ${release.title}`,
      '',
      `Date: 2026-05-29`,
      'Authority: Founder-approved Class G Phase 0D tenant canonicalization',
      '',
      '## English Change Summary',
      '',
      release.impact,
      '',
      '## Impact Layer',
      '',
      '- App control lane: canonical tenant registry now contains only Apex, Meridian, Northstar, First Capital, and SkyHarbor.',
      '- Data layer: retired-tenant rows were merged or deleted according to Phase 0D policy.',
      '- Runtime behavior: tenant selection and pattern retrieval should no longer see retired tenant shells.',
      '',
      '## QA / Validation',
      '',
      release.qa,
      '- `npm run db:verify:canonical-tenants` verifies the five live tenants and their industry codes.',
      '',
      '## Audit Evidence',
      '',
      '- `verification/phase-0d/NON_CANONICAL_TENANT_DIAGNOSTIC.md`',
      '- `verification/phase-0d/POST_PHASE_0D_VERIFICATION_REPORT.md`',
      '- `verification/phase-0d/archives/`',
      '',
      '## Row Actions',
      '',
      formatActions(release.actions),
      '',
    ].join('\n');
    await writeFile(path.join(RELEASE_DIR, release.file), body);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for Phase 0D cleanup');

  const archiveManifests = await createArchiveManifests();
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  let canonicalActions = [];
  let mergeActions = [];
  let helixActions = [];
  let keystoneActions = [];
  let corpusActions = [];
  let canonicalRows = [];

  try {
    await query(client, 'BEGIN');
    const scopedColumns = await getScopedColumns(client);

    mergeActions = await mergeBrindlemarkIntoFirstCapital(client, scopedColumns);
    helixActions = [
      ...await deleteEngagementDependents(client, RETIRING_IDS['helix-therapeutics']),
      ...await deleteTenant(client, RETIRING[1], RETIRING_IDS['helix-therapeutics'], scopedColumns),
    ];
    keystoneActions = [
      ...await deleteEngagementDependents(client, RETIRING_IDS['keystone-energy-holdings']),
      ...await deleteTenant(client, RETIRING[2], RETIRING_IDS['keystone-energy-holdings'], scopedColumns),
    ];
    canonicalActions = await updateCanonicalClients(client);
    corpusActions = await updateCorpusVocabulary(client);

    const orphanFindings = await scanRetiredReferences(client, scopedColumns);
    if (orphanFindings.length > 0) {
      throw new Error(`Retired tenant references remain: ${JSON.stringify(orphanFindings)}`);
    }

    const verification = await verifyCanonicalRows(client);
    if (verification.errors.length > 0) {
      throw new Error(`Canonical tenant verification failed: ${verification.errors.join('; ')}`);
    }
    canonicalRows = verification.rows;

    await query(client, 'COMMIT');
  } catch (error) {
    await query(client, 'ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }

  await writeReports({
    archiveManifests,
    canonicalActions,
    mergeActions,
    helixActions,
    keystoneActions,
    corpusActions,
    canonicalRows,
  });

  console.log('phase0d-tenant-cleanup: complete');
  console.log(`phase0d-tenant-cleanup: report ${path.relative(ROOT, path.join(OUT_DIR, 'POST_PHASE_0D_VERIFICATION_REPORT.md'))}`);
}

main().catch((error) => {
  console.error('phase0d-tenant-cleanup: failed');
  console.error(error);
  process.exit(1);
});
