/**
 * Tower ingest · Azure Cost Management
 *
 * Source: Azure Cost Management — cloud spend per workload/program.
 * Export path: Azure Portal → Cost Management + Billing → Exports → CSV in Blob;
 *              or Cost Management REST API.
 *
 * The headline feature of this connector is tag-based program allocation.
 * `tag_program` is a first-class column — every cost row is allocatable
 * to an AbarVa program (or rolls up to `__untagged__`).
 *
 * Shape of one row (Data sheet of template.xlsx, or CSV):
 *   subscription_id, resource_group, resource_name, service,
 *   tag_program, tag_environment, period_start, period_end,
 *   monthly_cost_usd, currency, meter_category, location
 */

export const AZURE_COST_SOURCE_KEY = 'azure-cost' as const;
export const AZURE_COST_TEMPLATE_VERSION = '1.0' as const;
export const AZURE_COST_REQUIRED_CURRENCY = 'USD' as const;

export interface AzureCostRowRaw {
  subscription_id?: string | null;
  resource_group?: string | null;
  resource_name?: string | null;
  service?: string | null;
  tag_program?: string | null;
  tag_environment?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  monthly_cost_usd?: string | number | null;
  currency?: string | null;
  meter_category?: string | null;
  location?: string | null;
}

export interface AzureCostRow {
  subscriptionId: string;
  resourceGroup: string;
  resourceName: string;
  service: string;
  tagProgram: string;
  tagEnvironment: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  monthlyCostUsd: number;
  currency: 'USD';
  meterCategory: string;
  location: string;
}

export interface ParseIssue {
  row: number; // 1-indexed in the data range
  field: keyof AzureCostRow | 'currency' | 'monthly_cost_usd' | 'period_start' | 'period_end' | 'subscription_id' | 'resource_group';
  message: string;
}

export interface ParseResult {
  rows: AzureCostRow[];
  issues: ParseIssue[];
  source: typeof AZURE_COST_SOURCE_KEY;
  templateVersion: typeof AZURE_COST_TEMPLATE_VERSION;
}

const REQUIRED_HEADERS = [
  'subscription_id',
  'resource_group',
  'resource_name',
  'service',
  'tag_program',
  'tag_environment',
  'period_start',
  'period_end',
  'monthly_cost_usd',
  'currency',
  'meter_category',
  'location',
] as const;

export const AZURE_COST_HEADERS: readonly string[] = REQUIRED_HEADERS;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function trimOrEmpty(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value).trim();
}

function parseDate(value: string | null | undefined): string | null {
  const v = trimOrEmpty(value);
  if (!v) return null;
  if (!DATE_RE.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Round-trip to be safe (catches e.g. 2026-02-30)
  const round = d.toISOString().slice(0, 10);
  return round === v ? v : null;
}

function parseNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const v = String(value).trim().replace(/,/g, '');
  if (!v) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a row map (column key → raw value) into a typed Azure cost row.
 * Returns either {ok: true, row} or {ok: false, issues}.
 */
export function parseAzureCostRow(
  raw: AzureCostRowRaw,
  rowNumber: number,
): { ok: true; row: AzureCostRow } | { ok: false; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];

  const subscriptionId = trimOrEmpty(raw.subscription_id);
  if (!subscriptionId) issues.push({ row: rowNumber, field: 'subscription_id', message: 'subscription_id is required' });

  const resourceGroup = trimOrEmpty(raw.resource_group);
  if (!resourceGroup) issues.push({ row: rowNumber, field: 'resource_group', message: 'resource_group is required' });

  const resourceName = trimOrEmpty(raw.resource_name);
  const service = trimOrEmpty(raw.service);

  // tag_program is the load-bearing allocation column. Empty is permitted but
  // we coerce to a sentinel so downstream rollups don't drop the row.
  const tagProgram = trimOrEmpty(raw.tag_program) || '__untagged__';
  const tagEnvironment = trimOrEmpty(raw.tag_environment) || 'unspecified';

  const periodStart = parseDate(raw.period_start);
  if (!periodStart) issues.push({ row: rowNumber, field: 'period_start', message: 'period_start must be YYYY-MM-DD' });

  const periodEnd = parseDate(raw.period_end);
  if (!periodEnd) issues.push({ row: rowNumber, field: 'period_end', message: 'period_end must be YYYY-MM-DD' });

  if (periodStart && periodEnd && periodEnd < periodStart) {
    issues.push({ row: rowNumber, field: 'period_end', message: 'period_end must be on/after period_start' });
  }

  const cost = parseNumber(raw.monthly_cost_usd);
  if (cost == null) {
    issues.push({ row: rowNumber, field: 'monthly_cost_usd', message: 'monthly_cost_usd must be a number' });
  } else if (cost < 0) {
    issues.push({ row: rowNumber, field: 'monthly_cost_usd', message: 'monthly_cost_usd must be >= 0' });
  }

  const currency = trimOrEmpty(raw.currency).toUpperCase();
  if (currency !== AZURE_COST_REQUIRED_CURRENCY) {
    issues.push({
      row: rowNumber,
      field: 'currency',
      message: `currency must be ${AZURE_COST_REQUIRED_CURRENCY} (got "${currency || '<empty>'}")`,
    });
  }

  const meterCategory = trimOrEmpty(raw.meter_category);
  const location = trimOrEmpty(raw.location);

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    row: {
      subscriptionId,
      resourceGroup,
      resourceName,
      service,
      tagProgram,
      tagEnvironment,
      periodStart: periodStart!,
      periodEnd: periodEnd!,
      monthlyCostUsd: cost!,
      currency: 'USD',
      meterCategory,
      location,
    },
  };
}

/**
 * Parse a batch of raw rows (e.g. CSV record objects, or row maps from an
 * xlsx sheet read). Bad rows are collected as issues; good rows are returned.
 */
export function parseAzureCostRows(rawRows: AzureCostRowRaw[]): ParseResult {
  const rows: AzureCostRow[] = [];
  const issues: ParseIssue[] = [];
  rawRows.forEach((raw, idx) => {
    const result = parseAzureCostRow(raw, idx + 1);
    if (result.ok) rows.push(result.row);
    else issues.push(...result.issues);
  });
  return {
    rows,
    issues,
    source: AZURE_COST_SOURCE_KEY,
    templateVersion: AZURE_COST_TEMPLATE_VERSION,
  };
}

/**
 * Parse a CSV string with a header row matching AZURE_COST_HEADERS.
 * Tolerant of extra columns; missing required columns produce a header issue.
 */
export function parseAzureCostCsv(csv: string): ParseResult {
  const lines = csv.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.trim().startsWith('#'));
  if (lines.length === 0) {
    return { rows: [], issues: [{ row: 0, field: 'subscription_id', message: 'CSV is empty' }], source: AZURE_COST_SOURCE_KEY, templateVersion: AZURE_COST_TEMPLATE_VERSION };
  }
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const headerIndex = new Map<string, number>();
  headers.forEach((h, i) => headerIndex.set(h, i));

  const missing = REQUIRED_HEADERS.filter((h) => !headerIndex.has(h));
  if (missing.length > 0) {
    return {
      rows: [],
      issues: missing.map((h) => ({ row: 0, field: h as ParseIssue['field'], message: `missing required header: ${h}` })),
      source: AZURE_COST_SOURCE_KEY,
      templateVersion: AZURE_COST_TEMPLATE_VERSION,
    };
  }

  const rawRows: AzureCostRowRaw[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    for (const h of REQUIRED_HEADERS) {
      const idx = headerIndex.get(h)!;
      obj[h] = cells[idx] ?? '';
    }
    rawRows.push(obj as AzureCostRowRaw);
  }
  return parseAzureCostRows(rawRows);
}

/** Minimal CSV splitter — handles quoted fields with commas and "" escapes. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}
