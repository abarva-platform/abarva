/**
 * Tower ingest · Azure Cost validator.
 *
 * Hard rules (rejection):
 *   - currency must equal USD
 *   - dates must be valid YYYY-MM-DD and period_end >= period_start
 *   - monthly_cost_usd must be a finite number >= 0
 *
 * Soft rules (warnings, not rejections):
 *   - more than 5% of rows untagged (tag_program == __untagged__)
 *   - any row with cost > $100,000 (unusually large monthly line item)
 *   - any period_start that is not the 1st of a month (Azure exports are monthly)
 */

import { AZURE_COST_REQUIRED_CURRENCY, type AzureCostRow, type ParseResult } from './parse';

export interface ValidationWarning {
  code: 'untagged_share_high' | 'large_monthly_cost' | 'non_month_start' | 'duplicate_key';
  message: string;
  detail?: Record<string, unknown>;
}

export interface ValidationReport {
  ok: boolean;
  rowCount: number;
  errorCount: number;
  warnings: ValidationWarning[];
  untaggedShare: number;
  totalUsd: number;
  programs: number;
  subscriptions: number;
  months: number;
}

const LARGE_COST_THRESHOLD_USD = 100_000;
const UNTAGGED_WARN_THRESHOLD = 0.05;

export function validateAzureCostRows(rows: AzureCostRow[]): ValidationReport {
  const warnings: ValidationWarning[] = [];

  let totalUsd = 0;
  let untagged = 0;
  const programs = new Set<string>();
  const subs = new Set<string>();
  const months = new Set<string>();
  const dedupe = new Map<string, number>();

  for (const r of rows) {
    if (r.currency !== AZURE_COST_REQUIRED_CURRENCY) {
      // parser should have caught this, but defense in depth
      return {
        ok: false,
        rowCount: rows.length,
        errorCount: 1,
        warnings,
        untaggedShare: 0,
        totalUsd: 0,
        programs: 0,
        subscriptions: 0,
        months: 0,
      };
    }

    totalUsd += r.monthlyCostUsd;
    if (r.tagProgram === '__untagged__') untagged += 1;
    programs.add(r.tagProgram);
    subs.add(r.subscriptionId);
    months.add(r.periodStart);

    if (r.monthlyCostUsd > LARGE_COST_THRESHOLD_USD) {
      warnings.push({
        code: 'large_monthly_cost',
        message: `Row for ${r.resourceName || r.resourceGroup} has monthly cost > $${LARGE_COST_THRESHOLD_USD.toLocaleString()}`,
        detail: { resourceName: r.resourceName, monthlyCostUsd: r.monthlyCostUsd, periodStart: r.periodStart },
      });
    }
    if (!r.periodStart.endsWith('-01')) {
      warnings.push({
        code: 'non_month_start',
        message: `period_start ${r.periodStart} is not the 1st of a month`,
      });
    }
    const key = `${r.subscriptionId}|${r.resourceGroup}|${r.resourceName}|${r.service}|${r.meterCategory}|${r.periodStart}`;
    dedupe.set(key, (dedupe.get(key) ?? 0) + 1);
  }

  for (const [key, count] of dedupe.entries()) {
    if (count > 1) {
      warnings.push({
        code: 'duplicate_key',
        message: `${count} rows share the same (subscription, resource_group, resource, service, meter, period_start) — last write wins on ingest`,
        detail: { key, count },
      });
    }
  }

  const untaggedShare = rows.length > 0 ? untagged / rows.length : 0;
  if (untaggedShare > UNTAGGED_WARN_THRESHOLD) {
    warnings.push({
      code: 'untagged_share_high',
      message: `${(untaggedShare * 100).toFixed(1)}% of rows lack a tag_program — program allocation will be incomplete`,
      detail: { untagged, total: rows.length },
    });
  }

  return {
    ok: true,
    rowCount: rows.length,
    errorCount: 0,
    warnings,
    untaggedShare,
    totalUsd,
    programs: programs.size,
    subscriptions: subs.size,
    months: months.size,
  };
}

export function validateParseResult(result: ParseResult): ValidationReport {
  if (result.issues.length > 0) {
    const r = validateAzureCostRows(result.rows);
    return { ...r, ok: false, errorCount: result.issues.length };
  }
  return validateAzureCostRows(result.rows);
}
