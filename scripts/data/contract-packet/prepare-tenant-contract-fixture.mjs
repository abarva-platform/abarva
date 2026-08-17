#!/usr/bin/env node

/**
 * Adapts a universal tenant vendor register into the contract-packet fixture shape.
 *
 * The packet generator intentionally renders legal-looking documents. When the source tenant
 * register contains recognizable supplier names, those names must not be carried into synthetic
 * agreements. This adapter preserves the tenant's commercial shape and spend/date facts while
 * substituting invented supplier legal identities before documents are generated.
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const ROOT = process.cwd();
const args = {
  tenant: '',
  in: '',
  out: '',
  limit: 8,
};

for (let i = 2; i < process.argv.length; i += 1) {
  const k = process.argv[i];
  if (k === '--tenant') { args.tenant = process.argv[i + 1]; i += 1; }
  else if (k === '--in') { args.in = process.argv[i + 1]; i += 1; }
  else if (k === '--out') { args.out = process.argv[i + 1]; i += 1; }
  else if (k === '--limit') { args.limit = Number(process.argv[i + 1]); i += 1; }
}

if (!args.tenant || !args.out) {
  console.error('--tenant <tenant-key> and --out <fixture dir> are required');
  process.exit(1);
}
if (!Number.isInteger(args.limit) || args.limit < 1) {
  console.error('--limit must be a positive integer');
  process.exit(1);
}

const tenantRoot = args.in
  ? path.resolve(ROOT, args.in)
  : path.resolve(ROOT, 'datasets/tenant-inputs/active', args.tenant, 'current');
const vendorPath = path.join(tenantRoot, '07_vendors_contracts.csv');

if (!fs.existsSync(vendorPath)) {
  console.error(`vendor register not found: ${vendorPath}`);
  process.exit(1);
}

const parseCsv = (p) => Papa.parse(fs.readFileSync(p, 'utf8').trim(), {
  header: true,
  skipEmptyLines: true,
}).data;

const addMonths = (iso, m) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + Number(m));
  return d.toISOString().slice(0, 10);
};

const monthsBetween = (start, end) => {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b <= a) return 36;
  return Math.max(12, (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()));
};

const daysBetween = (start, end) => {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 90;
  return Math.max(30, Math.round((b.getTime() - a.getTime()) / 86_400_000));
};

const slug = (s) => String(s || 'contract')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 40) || 'contract';

const title = (s) => String(s || 'Technology Services')
  .replace(/[_/;]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (m) => m.toUpperCase());

const cents = (n) => Math.round(Number(n || 0) * 100);
const dollars = (c) => (c / 100).toFixed(2);

function splitAnnual(annual) {
  const total = cents(annual);
  const base = Math.floor(total * 0.72);
  const support = Math.floor(total * 0.18);
  const services = total - base - support;
  return [base, support, services].map(dollars);
}

function categoryOf(row) {
  const raw = slug(row.service_category || row.contract_name || 'technology_services');
  if (/ehr|clinical|patient|care|pacs|imaging|laboratory|claims|revenue|payer|health/.test(raw)) {
    return 'healthcare_platform_services';
  }
  if (/cloud|productivity|identity|infrastructure|network|security/.test(raw)) {
    return 'technology_platform_services';
  }
  if (/managed|bpo|services|support/.test(raw)) return 'managed_services';
  return raw;
}

function serviceLabelFor(category) {
  if (category === 'healthcare_platform_services') return 'Healthcare Platform Services';
  if (category === 'technology_platform_services') return 'Enterprise Technology Platform Services';
  if (category === 'managed_services') return 'Managed Operations Services';
  return title(category);
}

function handlesPhi(row) {
  const text = [
    row.service_category,
    row.supported_systems,
    row.supported_functions,
    row.contract_terms_detail,
  ].join(' ').toLowerCase();
  return /ehr|clinical|patient|claims|revenue cycle|payer|care|pacs|imaging|laboratory|pharmacy|hipaa|phi/.test(text);
}

const riskTerms = {
  high: { liability: 4, insurance: 15_000_000, priceCap: 3, availability: '99.95', creditCap: 30 },
  medium: { liability: 3, insurance: 10_000_000, priceCap: 4, availability: '99.90', creditCap: 25 },
  low: { liability: 2, insurance: 5_000_000, priceCap: 5, availability: '99.50', creditCap: 20 },
};

const vendors = parseCsv(vendorPath)
  .filter((r) => r.tenant_key === args.tenant)
  .filter((r) => r.annual_spend_usd && r.term_start && (r.term_end || r.renewal_date))
  .sort((a, b) => Number(b.annual_spend_usd || 0) - Number(a.annual_spend_usd || 0))
  .slice(0, args.limit);

if (!vendors.length) {
  console.error(`no packet-eligible vendor rows found for ${args.tenant}`);
  process.exit(1);
}

const register = [];
const pricing = [];
const slas = [];
const invoices = [];
const rates = [];

// Contract ids carry the tenant, so packets from two tenants never collide in a shared corpus.
// The prefix was hardcoded to the tenant this lane was first built for, which meant every tenant
// afterwards produced contracts labelled as that one's.
const tenantPrefix = args.tenant
  .split('-')
  .map((part) => part[0])
  .join('')
  .toUpperCase()
  .slice(0, 3);

vendors.forEach((row, idx) => {
  const n = String(idx + 1).padStart(3, '0');
  const contractId = `CTR-${tenantPrefix}-${n}`;
  const risk = riskTerms[String(row.risk_rating || 'medium').toLowerCase()] ?? riskTerms.medium;
  const category = categoryOf(row);
  const service = serviceLabelFor(category);
  const supplierShort = `Supplier ${n}`;
  const supplierLegal = `Synthetic ${service.replace(/\b(And|Or|Of|The)\b/g, '').replace(/\s+/g, ' ').trim()} Supplier ${n} LLC`;
  const effectiveDate = row.term_start;
  const termEnd = row.term_end || addMonths(row.term_start, 36);
  const termMonths = monthsBetween(effectiveDate, termEnd);
  const renewalNoticeDays = row.renewal_date ? daysBetween(row.renewal_date, termEnd) : 90;
  const annual = Number(row.annual_spend_usd || 0);
  const [base, support, services] = splitAnnual(annual);
  const skuBase = slug(service).toUpperCase().slice(0, 18);

  register.push({
    contract_id: contractId,
    supplier_legal_entity: supplierLegal,
    supplier_short_name: supplierShort,
    contract_name: `${service} Master Agreement`,
    category,
    governing_law: 'Illinois',
    buyer_legal_entity: 'Integrated Healthcare Demonstration System Inc.',
    buyer_short_name: 'Integrated Healthcare Demo',
    effective_date: effectiveDate,
    initial_term_months: String(termMonths),
    renewal_notice_days: String(renewalNoticeDays),
    annual_value_usd: annual.toFixed(2),
    currency: 'USD',
    payment_terms_days: row.commercial_model === 'time_and_materials' ? '45' : '30',
    liability_cap_multiple: String(risk.liability),
    insurance_required_usd: String(risk.insurance),
    handles_phi: handlesPhi(row) ? 'yes' : 'no',
    owner_role: row.business_owner || row.contract_owner || 'Vendor Management Lead',
    notice_address: '1 Integrated Health Plaza, Lakeview, IL 60601',
  });

  [
    ['1', `${skuBase}-SUB`, `${service} subscription and production entitlements`, 'annual subscription', '1', base],
    ['2', `${skuBase}-SUPPORT`, `${service} support, maintenance and service desk coverage`, 'annual support', '1', support],
    ['3', `${skuBase}-SERVICES`, `${service} implementation, integration and transition services`, 'annual services pool', '1', services],
  ].forEach(([lineNo, sku, description, unit, quantity, lineTotal]) => {
    pricing.push({
      contract_id: contractId,
      line_no: lineNo,
      sku,
      description,
      unit,
      quantity,
      unit_price_usd: lineTotal,
      annual_line_total_usd: lineTotal,
      price_cap_percent: String(risk.priceCap),
    });
    invoices.push({
      contract_id: contractId,
      invoice_id: `INV-${contractId}-${lineNo}`,
      invoice_date: addMonths(effectiveDate, 1),
      sku,
      quantity,
      unit_price_usd: lineTotal,
      line_amount_usd: lineTotal,
      po_number: `PO-${contractId}-${lineNo}`,
    });
  });

  [
    ['Sev 1', 'Production outage affecting all authorised users', '15 minutes', '4 hours', '25'],
    ['Sev 2', 'Material degradation affecting a major workflow', '1 hour', '1 business day', '10'],
    ['Sev 3', 'Non-critical defect or service request', '1 business day', '5 business days', '0'],
  ].forEach(([severity, description, response, restore, credit]) => {
    slas.push({
      contract_id: contractId,
      severity,
      description,
      response_target: response,
      restore_target: restore,
      monthly_availability_percent: risk.availability,
      service_credit_percent: credit,
      credit_cap_percent: String(risk.creditCap),
    });
  });

  [
    ['Engagement Partner', 325],
    ['Solution Architect', 275],
    ['Integration Consultant', 210],
    ['Transition Analyst', 185],
  ].forEach(([role, rate]) => {
    rates.push({
      contract_id: contractId,
      role,
      rate_usd: String(rate),
      unit: 'hour',
      rate_hold_scope: 'Initial Term',
    });
  });
});

fs.mkdirSync(path.resolve(ROOT, args.out), { recursive: true });
const write = (name, rows) => {
  fs.writeFileSync(path.resolve(ROOT, args.out, name), `${Papa.unparse(rows)}\n`);
};

write('contract_register.csv', register);
write('contract_pricing_schedule.csv', pricing);
write('contract_sla_terms.csv', slas);
write('contract_invoice_lines.csv', invoices);
write('contract_rate_card.csv', rates);
fs.writeFileSync(path.resolve(ROOT, args.out, 'fixture_manifest.json'), `${JSON.stringify({
  tenant: args.tenant,
  source: path.relative(ROOT, vendorPath),
  generatedAt: new Date().toISOString(),
  selectedRows: vendors.length,
  safety: [
    'supplier legal entities are synthetic aliases',
    'source vendor names are not emitted into generated legal instruments',
    'fixture is generated output and is not tenant data, canonical data, retrieval data, or runtime state',
  ],
  selection: 'highest annual_spend_usd rows with term/value fields',
}, null, 2)}\n`);

console.log(`tenant          : ${args.tenant}`);
console.log(`source          : ${path.relative(ROOT, vendorPath)}`);
console.log(`contracts       : ${register.length}`);
console.log(`fixture out     : ${args.out}`);
console.log('safety          : synthetic supplier aliases; no source vendor names emitted');
