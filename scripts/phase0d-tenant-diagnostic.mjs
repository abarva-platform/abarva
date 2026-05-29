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
const NOW = new Date().toISOString();

const RETIRING = [
  {
    key: 'brindlemark-financial',
    label: 'Brindlemark Financial',
    action: 'merge-then-delete',
    aliases: ['brindlemark-financial', 'brindlemark', 'brindlemark-financial-services'],
  },
  {
    key: 'helix-therapeutics',
    label: 'Helix Therapeutics',
    action: 'hard-delete',
    aliases: ['helix-therapeutics', 'helix'],
  },
  {
    key: 'keystone-energy-holdings',
    label: 'Keystone Energy Holdings',
    action: 'hard-delete',
    aliases: ['keystone-energy-holdings', 'keystone-energy', 'keystone'],
  },
];

const CANONICAL = [
  { key: 'apex-retail', industry: 'retail' },
  { key: 'meridian-health', industry: 'healthcare_provider' },
  { key: 'northstar-clinical', industry: 'healthcare_medtech' },
  { key: 'first-capital', industry: 'financial_services_banking' },
  { key: 'skyharbor-air', industry: 'airline' },
];

function qident(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function safeFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, '-');
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function queryRows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function findClientRows(client, aliases) {
  const lowered = aliases.map(normalize);
  return queryRows(client, `
    SELECT *
    FROM public.clients
    WHERE lower(coalesce(tenant_key, '')) = ANY($1::text[])
       OR lower(coalesce(slug, '')) = ANY($1::text[])
       OR lower(coalesce(name, '')) = ANY($1::text[])
       OR lower(coalesce(name, '')) LIKE ANY($2::text[])
    ORDER BY coalesce(tenant_key, slug, name)
  `, [lowered, lowered.map((alias) => `%${alias.replaceAll('-', '%')}%`)]);
}

async function getTenantScopedColumns(client) {
  return queryRows(client, `
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('tenant_key', 'client_key', 'client_id', 'tenant_id')
    ORDER BY table_name, column_name
  `);
}

async function getEngagementDependentColumns(client) {
  return queryRows(client, `
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
}

async function tableExists(client, table) {
  const rows = await queryRows(client, `
    SELECT to_regclass($1) IS NOT NULL AS exists
  `, [`public.${table}`]);
  return rows[0]?.exists === true;
}

async function countByColumn(client, table, column, values) {
  if (values.length === 0) return { count: 0, rows: [] };
  const sql = `
    SELECT *
    FROM public.${qident(table)}
    WHERE lower(${qident(column)}::text) = ANY($1::text[])
  `;
  const rows = await queryRows(client, sql, [values.map(normalize)]);
  return { count: rows.length, rows };
}

async function countRecentEgress(client, tenant) {
  if (!(await tableExists(client, 'ai_egress_audit'))) return { count: null, rows: [] };
  const columns = await queryRows(client, `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_egress_audit'
      AND column_name IN ('tenant_id', 'client_id', 'tenant_key', 'client_key')
  `);
  const available = columns.map((row) => row.column_name);
  if (available.length === 0) return { count: null, rows: [] };
  const aliases = tenant.aliases.map(normalize);
  const clientIds = tenant.clientRows.map((row) => normalize(row.id));
  const values = [...aliases, ...clientIds].filter(Boolean);
  if (values.length === 0) return { count: 0, rows: [] };
  const predicate = available
    .map((column) => `lower(coalesce(${qident(column)}::text, '')) = ANY($1::text[])`)
    .join(' OR ');
  const rows = await queryRows(client, `
    SELECT *
    FROM public.ai_egress_audit
    WHERE created_at >= now() - interval '30 days'
      AND (${predicate})
    ORDER BY created_at DESC
  `, [values]);
  return { count: rows.length, rows };
}

async function maybeClerkUsers() {
  if (!process.env.CLERK_SECRET_KEY) {
    return { status: 'skipped', reason: 'CLERK_SECRET_KEY not present in local environment', users: [] };
  }
  try {
    const { createClerkClient } = await import('@clerk/backend');
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const users = [];
    const limit = 100;
    for (let offset = 0; offset < 1000; offset += limit) {
      const page = await clerk.users.getUserList({ limit, offset });
      const data = page.data ?? page;
      if (!Array.isArray(data) || data.length === 0) break;
      users.push(...data.map((user) => ({
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        lastSignInAt: user.lastSignInAt ?? null,
        createdAt: user.createdAt ?? null,
        publicMetadata: user.publicMetadata ?? {},
        privateMetadata: user.privateMetadata ?? {},
        unsafeMetadata: user.unsafeMetadata ?? {},
      })));
      if (data.length < limit) break;
    }
    return { status: 'ok', users };
  } catch (error) {
    return { status: 'error', reason: error instanceof Error ? error.message : String(error), users: [] };
  }
}

function userMatchesTenant(user, tenant) {
  const aliases = tenant.aliases.map(normalize);
  const haystack = normalize([
    user.email,
    user.publicMetadata?.clientId,
    user.publicMetadata?.tenantKey,
    user.publicMetadata?.clientKey,
    user.privateMetadata?.clientId,
    user.privateMetadata?.tenantKey,
    user.privateMetadata?.clientKey,
    user.unsafeMetadata?.clientId,
    user.unsafeMetadata?.tenantKey,
    user.unsafeMetadata?.clientKey,
  ].filter(Boolean).join(' '));
  return aliases.some((alias) => haystack.includes(alias));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for Phase 0D diagnostic');
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const scopedColumns = await getTenantScopedColumns(client);
    const engagementDependentColumns = await getEngagementDependentColumns(client);
    const scopedByTable = new Map();
    for (const row of scopedColumns) {
      const cols = scopedByTable.get(row.table_name) ?? [];
      cols.push(row.column_name);
      scopedByTable.set(row.table_name, cols);
    }

    const canonicalRows = [];
    for (const tenant of CANONICAL) {
      canonicalRows.push({
        ...tenant,
        clientRows: await findClientRows(client, [tenant.key]),
      });
    }

    const clerk = await maybeClerkUsers();
    const reports = [];

    for (const tenant of RETIRING) {
      const clientRows = await findClientRows(client, tenant.aliases);
      const clientIds = clientRows.map((row) => normalize(row.id)).filter(Boolean);
      const aliases = tenant.aliases.map(normalize);
      const allValues = [...new Set([...aliases, ...clientIds])];
      const tableReports = [];

      const engagementIds = clientIds.length > 0
        ? (await queryRows(client, `
          SELECT id::text
          FROM public.engagements
          WHERE lower(client_id::text) = ANY($1::text[])
        `, [clientIds])).map((row) => normalize(row.id))
        : [];

      for (const [table, columns] of scopedByTable.entries()) {
        const columnReports = [];
        for (const column of columns) {
          const values = column.endsWith('_id') ? clientIds : allValues;
          if (values.length === 0) continue;
          const result = await countByColumn(client, table, column, values);
          if (result.count > 0) {
            const file = path.join(DATA_DIR, tenant.key, `${safeFileName(table)}.${safeFileName(column)}.json`);
            await writeJson(file, result.rows);
            columnReports.push({ column, count: result.count, archive: path.relative(ROOT, file) });
          }
        }
        if (columnReports.length > 0) tableReports.push({ table, columns: columnReports });
      }

      if (engagementIds.length > 0) {
        for (const row of engagementDependentColumns) {
          const result = await countByColumn(client, row.table_name, row.column_name, engagementIds);
          if (result.count > 0) {
            const file = path.join(DATA_DIR, tenant.key, `${safeFileName(row.table_name)}.${safeFileName(row.column_name)}.engagement-dependent.json`);
            await writeJson(file, result.rows);
            const existing = tableReports.find((report) => report.table === row.table_name);
            const columnReport = {
              column: row.column_name,
              count: result.count,
              archive: path.relative(ROOT, file),
              note: 'engagement-dependent',
            };
            if (existing) existing.columns.push(columnReport);
            else tableReports.push({ table: row.table_name, columns: [columnReport] });
          }
        }
      }

      const recentEgress = await countRecentEgress(client, { ...tenant, clientRows });
      if (recentEgress.rows.length > 0) {
        const file = path.join(DATA_DIR, tenant.key, 'ai_egress_audit.recent_30d.json');
        await writeJson(file, recentEgress.rows);
      }

      const clerkUsers = clerk.users.filter((user) => userMatchesTenant(user, tenant));
      if (clerkUsers.length > 0) {
        const file = path.join(DATA_DIR, tenant.key, 'clerk-users.json');
        await writeJson(file, clerkUsers);
      }

      const clientsFile = path.join(DATA_DIR, tenant.key, 'clients.rows.json');
      await writeJson(clientsFile, clientRows);

      reports.push({
        ...tenant,
        clientRows,
        tableReports,
        recentEgress: {
          count: recentEgress.count,
          archive: recentEgress.rows.length > 0 ? `verification/phase-0d/diagnostic-data/${tenant.key}/ai_egress_audit.recent_30d.json` : null,
        },
        clerk: {
          status: clerk.status,
          reason: clerk.reason ?? null,
          users: clerkUsers,
          archive: clerkUsers.length > 0 ? `verification/phase-0d/diagnostic-data/${tenant.key}/clerk-users.json` : null,
        },
      });
    }

    const rawFile = path.join(DATA_DIR, 'phase0d-diagnostic-raw.json');
    await writeJson(rawFile, { generatedAt: NOW, canonicalRows, reports });

    const lines = [
      '# Phase 0D Non-Canonical Tenant Diagnostic',
      '',
      `Generated: ${NOW}`,
      'Status: diagnostic complete; destructive cleanup not yet executed.',
      '',
      '## Canonical Tenant Target',
      '',
      '| Tenant key | Industry | Client rows found |',
      '|---|---|---:|',
      ...canonicalRows.map((tenant) => `| ${tenant.key} | ${tenant.industry} | ${tenant.clientRows.length} |`),
      '',
      '## Retiring Tenant Findings',
      '',
    ];

    for (const report of reports) {
      const totalRows = report.tableReports.reduce((sum, table) => (
        sum + table.columns.reduce((inner, column) => inner + column.count, 0)
      ), 0);
      lines.push(`### ${report.label} (${report.key})`);
      lines.push('');
      lines.push(`- Planned action: ${report.action}`);
      lines.push(`- Client rows found: ${report.clientRows.length}`);
      lines.push(`- Tenant-scoped DB row hits: ${totalRows}`);
      lines.push(`- Recent AI egress rows, last 30 days: ${report.recentEgress.count ?? 'table unavailable'}`);
      lines.push(`- Clerk diagnostic: ${report.clerk.status}${report.clerk.reason ? ` (${report.clerk.reason})` : ''}`);
      lines.push(`- Clerk users matched: ${report.clerk.users.length}`);
      lines.push(`- Client row archive: verification/phase-0d/diagnostic-data/${report.key}/clients.rows.json`);
      if (report.recentEgress.archive) lines.push(`- Recent egress archive: ${report.recentEgress.archive}`);
      if (report.clerk.archive) lines.push(`- Clerk user archive: ${report.clerk.archive}`);
      lines.push('');
      lines.push('| Table | Column | Rows | Archive |');
      lines.push('|---|---|---:|---|');
      if (report.tableReports.length === 0) {
        lines.push('| none | none | 0 | n/a |');
      } else {
        for (const table of report.tableReports) {
          for (const column of table.columns) {
            lines.push(`| ${table.table} | ${column.column} | ${column.count} | ${column.archive} |`);
          }
        }
      }
      lines.push('');
    }

    lines.push('## Diagnostic Interpretation');
    lines.push('');
    lines.push('- This report is generated from live database metadata and tenant-scoped table scans.');
    lines.push('- Any non-zero row counts above must be archived before deletion.');
    lines.push('- Brindlemark merge/discard classification should use the archived row payloads before hard delete.');
    lines.push('- Full raw diagnostic: verification/phase-0d/diagnostic-data/phase0d-diagnostic-raw.json');
    lines.push('');

    await fs.writeFile(path.join(OUT_DIR, 'NON_CANONICAL_TENANT_DIAGNOSTIC.md'), `${lines.join('\n')}\n`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
