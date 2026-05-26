#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadEnv({ path: fs.existsSync(path.join(REPO_ROOT, '.env.local')) ? path.join(REPO_ROOT, '.env.local') : '/Users/anand/Projects/nexus/.env.local' });

const TENANT_ALIASES = {
  northstar: ['northstar-medtech', 'northstar', 'northstar-clinical-tech'],
  'northstar-medtech': ['northstar-medtech', 'northstar', 'northstar-clinical-tech'],
  apex: ['apex-retail', 'apexretail', 'apex'],
  'apex-retail': ['apex-retail', 'apexretail', 'apex'],
  meridian: ['meridian-health', 'meridian'],
  'meridian-health': ['meridian-health', 'meridian'],
  firstcapital: ['first-capital', 'firstcapital', 'first-capital-financial'],
  'first-capital': ['first-capital', 'firstcapital', 'first-capital-financial'],
};

const questions = [
  ['Q1 identity', 'What do you know about us?'],
  ['Q2 top apps', 'Top 5 apps by criticality, name them'],
  ['Q3 top vendors', 'Top 5 vendors by annual spend'],
  ['Q4 active initiatives', 'Active initiatives by stage'],
  ['Q5 CFO', 'Who is our CFO?'],
  ['Q6 IT spend', 'FY26 IT spend by category'],
  ['Q7 renewals', 'Most-exposed vendor renewals in next 6 months'],
  ['Q8 EU AI Act', 'Where are we exposed on EU AI Act?'],
  ['Q9 biggest initiative', "What's our biggest in-flight initiative?"],
  ['Q10 biggest risk', 'How would you approach our biggest current risk?'],
];

const tenant = readArg('--tenant') ?? process.env.TENANT_KEY ?? 'northstar';
const databaseUrl = process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing ABARVA_AZURE_DATABASE_URL or DATABASE_URL');
  process.exit(2);
}

const db = new pg.Client({
  connectionString: databaseUrl,
  application_name: 'demo-question-readiness',
  ssl: disableSsl(databaseUrl) ? false : { rejectUnauthorized: false },
});
try {
  await db.connect();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Postgres connection failed: ${message}`);
  process.exit(2);
}
const client = await resolveClient(tenant);
if (!client) {
  console.error(`No client row found for tenant ${tenant}`);
  await db.end().catch(() => undefined);
  process.exit(2);
}

const facts = await loadFacts(client.id);
const rows = questions.map(([label, question]) => classifyQuestion(label, question, facts, client));
printHeatmap(client, tenant, rows);

const hallucinated = rows.filter((row) => row.status === 'HALLUCINATED').length;
const grounded = rows.filter((row) => row.status === 'GROUNDED').length;
if (hallucinated > 0) process.exit(1);
if (grounded < 7) process.exit(1);
await db.end().catch(() => undefined);

function disableSsl(connectionString) {
  try {
    const parsed = new URL(connectionString);
    if (parsed.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function resolveClient(tenantKey) {
  const aliases = TENANT_ALIASES[tenantKey] ?? [tenantKey];
  const { rows } = await db.query(
    `SELECT id, name, tenant_key, slug, annual_revenue_usd, it_budget_usd,
            employee_count, operational_units, business_description
       FROM clients
      WHERE tenant_key = ANY($1::text[]) OR slug = ANY($1::text[])
      LIMIT 1`,
    [aliases],
  );
  return rows[0] ?? null;
}

async function loadFacts(clientId) {
  const [apps, vendors, initiatives, chunks] = await Promise.all([
    db.query('SELECT id, name, vendor, criticality, annual_cost_usd, business_function, deployment_model, status FROM applications WHERE client_id = $1 LIMIT 300', [clientId]),
    db.query('SELECT vendor_id, vendor_name, annual_contract_value_usd, renewal_date, contract_category, exit_terms_jsonb FROM vendor_contracts WHERE client_id = $1 LIMIT 150', [clientId]),
    db.query('SELECT initiative_id, name, stage, status_flag, committed_total_usd, measured_value_usd, status_summary, metadata FROM ai_initiatives WHERE client_id = $1 LIMIT 150', [clientId]),
    db.query('SELECT chunk_id, chunk_text, source_segment_id FROM enterprise_context_chunks WHERE client_id = $1 LIMIT 1200', [clientId]),
  ]);
  return {
    apps: apps.rows ?? [],
    vendors: vendors.rows ?? [],
    initiatives: initiatives.rows ?? [],
    chunks: chunks.rows ?? [],
    text: (chunks.rows ?? []).map((chunk) => chunk.chunk_text ?? '').join('\\n'),
  };
}

function classifyQuestion(label, question, facts, client) {
  const evidence = [];
  let status = 'CONFESSED';

  if (label === 'Q1 identity') {
    if (client.name && client.annual_revenue_usd) {
      status = 'GROUNDED';
      evidence.push(client.name, formatUsd(client.annual_revenue_usd));
    }
  } else if (label === 'Q2 top apps') {
    const topApps = facts.apps.filter((app) => app.criticality).slice(0, 5);
    if (topApps.length >= 5) {
      status = containsForbiddenProviderApps(topApps.map((app) => app.name).join(' ')) ? 'HALLUCINATED' : 'GROUNDED';
      evidence.push(...topApps.map((app) => app.name));
    }
  } else if (label === 'Q3 top vendors') {
    const topVendors = facts.vendors.filter((vendor) => vendor.annual_contract_value_usd).slice(0, 5);
    if (topVendors.length >= 5) {
      status = 'GROUNDED';
      evidence.push(...topVendors.map((vendor) => vendor.vendor_name));
    }
  } else if (label === 'Q4 active initiatives') {
    const active = facts.initiatives.filter((initiative) => !/closed|sunset|archived/i.test(`${initiative.initiative_id ?? ''} ${initiative.status_flag ?? ''} ${initiative.stage ?? ''}`));
    if (active.length >= 5) {
      status = 'GROUNDED';
      evidence.push(...active.slice(0, 5).map((initiative) => initiative.initiative_id));
    }
  } else if (label === 'Q5 CFO') {
    const match = facts.text.match(/Daniel Okafor[^\\n.]*CFO|CFO[^\\n.]*Daniel Okafor/i);
    if (match) {
      status = 'GROUNDED';
      evidence.push('Daniel Okafor');
    }
  } else if (label === 'Q6 IT spend') {
    if (client.it_budget_usd || /\\$1\\.15B|1\\.15B|FY2026 IT operating envelope/i.test(facts.text)) {
      status = 'GROUNDED';
      evidence.push(client.it_budget_usd ? formatUsd(client.it_budget_usd) : '$1.15B');
    }
  } else if (label === 'Q7 renewals') {
    const soon = facts.vendors.filter((vendor) => {
      const renewal = new Date(vendor.renewal_date ?? '').getTime();
      const now = Date.now();
      return Number.isFinite(renewal) && renewal >= now && renewal <= now + 183 * 24 * 60 * 60 * 1000;
    });
    if (soon.length >= 3) {
      status = 'GROUNDED';
      evidence.push(...soon.slice(0, 3).map((vendor) => `${vendor.vendor_id ?? vendor.vendor_name} ${vendor.renewal_date}`));
    }
  } else if (label === 'Q8 EU AI Act') {
    if (/EU AI Act|Annex I|August 2027/i.test(facts.text)) {
      status = 'GROUNDED';
      evidence.push('EU AI Act Annex I');
    } else {
      status = 'PATTERN';
    }
  } else if (label === 'Q9 biggest initiative') {
    const biggest = [...facts.initiatives].sort((a, b) => Number(b.committed_total_usd ?? 0) - Number(a.committed_total_usd ?? 0))[0];
    if (biggest) {
      status = 'GROUNDED';
      evidence.push(biggest.initiative_id, formatUsd(biggest.committed_total_usd));
    }
  } else if (label === 'Q10 biggest risk') {
    if (/TSA exit|tariff|ERP|regulatory|stacked execution/i.test(facts.text)) {
      status = 'GROUNDED';
      evidence.push('TSA exit / ERP / tariff / regulated AI context');
    } else {
      status = 'PATTERN';
    }
  }

  return { label, question, status, evidence };
}

function printHeatmap(client, tenantKey, rows) {
  console.log(`\n${client.name ?? tenantKey} demo-readiness (${tenantKey})`);
  console.log('Question                              GROUNDED  PATTERN  CONFESSED  HALLUCINATED  Evidence');
  for (const row of rows) {
    const mark = (status) => row.status === status ? '✓' : '';
    console.log(`${row.label.padEnd(37)}${mark('GROUNDED').padEnd(10)}${mark('PATTERN').padEnd(9)}${mark('CONFESSED').padEnd(11)}${mark('HALLUCINATED').padEnd(14)}${row.evidence.slice(0, 4).join('; ')}`);
  }
  const counts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`\nSummary: GROUNDED=${counts.GROUNDED ?? 0} PATTERN=${counts.PATTERN ?? 0} CONFESSED=${counts.CONFESSED ?? 0} HALLUCINATED=${counts.HALLUCINATED ?? 0}`);
}

function containsForbiddenProviderApps(text) {
  return /Epic\\s+EHR|Meditech\\s+Expanse|Mirth\\s+Connect/i.test(text);
}

function formatUsd(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'unknown';
  if (Math.abs(numeric) >= 1_000_000_000) return `$${(numeric / 1_000_000_000).toFixed(2).replace(/\\.00$/, '')}B`;
  if (Math.abs(numeric) >= 1_000_000) return `$${(numeric / 1_000_000).toFixed(1).replace(/\\.0$/, '')}M`;
  return `$${numeric.toLocaleString('en-US')}`;
}
