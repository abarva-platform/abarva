#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const client = await resolveClient(tenant);
if (!client) {
  console.error(`No client row found for tenant ${tenant}`);
  process.exit(2);
}

const facts = await loadFacts(client.id);
const rows = questions.map(([label, question]) => classifyQuestion(label, question, facts, client));
printHeatmap(client, tenant, rows);

const hallucinated = rows.filter((row) => row.status === 'HALLUCINATED').length;
const grounded = rows.filter((row) => row.status === 'GROUNDED').length;
if (hallucinated > 0) process.exit(1);
if (grounded < 7) process.exit(1);

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function resolveClient(tenantKey) {
  const aliases = TENANT_ALIASES[tenantKey] ?? [tenantKey];
  const orClause = aliases.flatMap((alias) => [`tenant_key.eq.${alias}`, `slug.eq.${alias}`]).join(',');
  const { data, error } = await sb
    .from('clients')
    .select('id,name,tenant_key,slug,annual_revenue_usd,it_budget_usd,employee_count,operational_units,business_description')
    .or(orClause)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function loadFacts(clientId) {
  const [apps, vendors, initiatives, chunks] = await Promise.all([
    sb.from('applications').select('id,name,vendor,criticality,annual_cost_usd,business_function,deployment_model,status').eq('client_id', clientId).limit(300),
    sb.from('vendor_contracts').select('vendor_id,vendor_name,annual_contract_value_usd,renewal_date,contract_category,exit_terms_jsonb').eq('client_id', clientId).limit(150),
    sb.from('ai_initiatives').select('initiative_id,name,stage,status_flag,committed_total_usd,measured_value_usd,status_summary,metadata').eq('client_id', clientId).limit(150),
    sb.from('enterprise_context_chunks').select('chunk_id,chunk_text,source_segment_id').eq('client_id', clientId).limit(1200),
  ]);
  for (const result of [apps, vendors, initiatives, chunks]) {
    if (result.error) throw new Error(result.error.message);
  }
  return {
    apps: apps.data ?? [],
    vendors: vendors.data ?? [],
    initiatives: initiatives.data ?? [],
    chunks: chunks.data ?? [],
    text: (chunks.data ?? []).map((chunk) => chunk.chunk_text ?? '').join('\\n'),
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
