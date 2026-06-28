#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKAGE_ROOT = path.join(ROOT, 'tower-standardized-v1');
const REPORT_DIR = path.join(ROOT, 'reports', 'tower-fy2025-trend');
const OUTPUT_FILE = 'tower_financial_amounts_fy2025_trend.csv';
const FORMULA_VERSION = 'tower_synthetic_fy2025_trend_v1';

const tenantTrendFactors = {
  'apex-retail': { budget: 0.935, initiative: 0.58, value: 0.42, vendor: 0.91 },
  'first-capital-financial': { budget: 0.945, initiative: 0.61, value: 0.46, vendor: 0.93 },
  'lakeshore-industries': { budget: 0.925, initiative: 0.52, value: 0.38, vendor: 0.9 },
  'meridian-health': { budget: 0.94, initiative: 0.55, value: 0.4, vendor: 0.92 },
  'skyharbor-air': { budget: 0.915, initiative: 0.5, value: 0.36, vendor: 0.89 },
};

const columns = [
  'tenant_key',
  'source_file',
  'source_row',
  'source_record_id',
  'source_label',
  'view',
  'amount_type',
  'basis',
  'period',
  'amount_usd',
  'is_rollup_of',
  'component_of',
  'formula',
  'formula_version',
  'value_source',
  'reconciles_to_view',
  'reconciles_to_record_id',
  'reconciliation_envelope_usd',
  'notes',
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function toCsv(rows) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => quote(row[column] ?? '')).join(',')),
  ].join('\n') + '\n';
}

function quote(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function roundUsd(value) {
  return String(Math.round(Number(value || 0) / 1000) * 1000);
}

function multiplierFor(row, factors) {
  if (row.view === 'it_budget') return factors.budget;
  if (row.view === 'initiative_budget') return factors.initiative;
  if (row.view === 'vendor_contract') return factors.vendor;
  if (row.view === 'value') return factors.value;
  return 0.75;
}

function basisFor(row) {
  if (row.view === 'value') return 'baseline';
  if (row.basis === 'actual') return 'baseline';
  return 'actual';
}

function shouldBackcast(row) {
  if (row.period !== 'fy26' && row.period !== 'ytd') return false;
  if (!row.amount_usd || row.amount_usd === 'not_loaded') return false;
  if (!Number.isFinite(Number(row.amount_usd))) return false;
  return Number(row.amount_usd) > 0;
}

function backcastRow(row, tenantKey, factors) {
  const amount = roundUsd(Number(row.amount_usd) * multiplierFor(row, factors));
  const sourceRecordId = `${row.source_record_id || row.source_row}-FY2025`;
  const formulaInput = `${row.source_record_id || row.source_file}:${row.source_row}`;
  const hash = crypto.createHash('sha1').update(`${tenantKey}|${sourceRecordId}|${amount}`).digest('hex').slice(0, 10);
  return {
    tenant_key: tenantKey,
    source_file: `derived/${OUTPUT_FILE}`,
    source_row: '',
    source_record_id: `${sourceRecordId}-${hash}`,
    source_label: `${row.source_label || row.source_record_id} FY2025 trend baseline`,
    view: row.view,
    amount_type: row.amount_type || 'none',
    basis: basisFor(row),
    period: 'fy25',
    amount_usd: amount,
    is_rollup_of: row.is_rollup_of || '',
    component_of: row.component_of || '',
    formula: `synthetic_backcast_from_fy26:${formulaInput}; multiplier=${multiplierFor(row, factors)}`,
    formula_version: FORMULA_VERSION,
    value_source: 'synthetic',
    reconciles_to_view: row.view,
    reconciles_to_record_id: row.source_record_id || '',
    reconciliation_envelope_usd: row.reconciliation_envelope_usd || '',
    notes: 'Synthetic FY2025 trend baseline for demo trend views. Not client-attested; replace with client actuals when provided.',
  };
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const tenants = fs.readdirSync(PACKAGE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((tenant) => tenantTrendFactors[tenant])
    .sort();

  const summary = [];
  for (const tenantKey of tenants) {
    const inputPath = path.join(PACKAGE_ROOT, tenantKey, 'derived', 'tower_financial_amounts.csv');
    const outputPath = path.join(PACKAGE_ROOT, tenantKey, 'derived', OUTPUT_FILE);
    const rows = parseCsv(fs.readFileSync(inputPath, 'utf8'));
    const generated = rows
      .filter(shouldBackcast)
      .map((row) => backcastRow(row, tenantKey, tenantTrendFactors[tenantKey]));
    generated.forEach((row, index) => {
      row.source_row = String(index + 2);
    });
    fs.writeFileSync(outputPath, toCsv(generated));

    const totalsByView = generated.reduce((acc, row) => {
      if (row.amount_type !== 'none' || row.component_of) return acc;
      acc[row.view] = (acc[row.view] ?? 0) + Number(row.amount_usd || 0);
      return acc;
    }, {});
    const componentRows = generated.filter((row) => row.component_of || row.amount_type !== 'none').length;
    summary.push({
      tenant_key: tenantKey,
      generated_rows: generated.length,
      headline_rows: generated.length - componentRows,
      component_rows: componentRows,
      output_file: path.relative(ROOT, outputPath),
      ...Object.fromEntries(Object.entries(totalsByView).map(([key, value]) => [`fy25_${key}_usd`, value])),
    });
  }

  const reportPath = path.join(REPORT_DIR, 'fy2025-trend-summary.json');
  fs.writeFileSync(reportPath, JSON.stringify({ formula_version: FORMULA_VERSION, tenants: summary }, null, 2));
  const csvColumns = Array.from(new Set(summary.flatMap((row) => Object.keys(row))));
  fs.writeFileSync(
    path.join(REPORT_DIR, 'fy2025-trend-summary.csv'),
    [
      csvColumns.join(','),
      ...summary.map((row) => csvColumns.map((column) => quote(row[column] ?? '')).join(',')),
    ].join('\n') + '\n',
  );
  console.log(JSON.stringify({ formula_version: FORMULA_VERSION, tenants: summary }, null, 2));
}

main();
