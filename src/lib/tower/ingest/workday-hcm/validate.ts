import type {
  WorkdayFunction,
  WorkdayParseResult,
  WorkdayValidationSummary,
} from './types';

/**
 * Cross-row validation pass. Builds a summary the CLI prints in
 * `--dry-run` and the ingestion path uses to decide whether to commit.
 *
 * Returns:
 *   - rowsValid / rowsRejected counts
 *   - aggregates (functions seen, contractor count, etc.)
 *   - duplicate-employee_id detection (within this extract)
 */
export function validateParseResult(
  parse: WorkdayParseResult,
): WorkdayValidationSummary {
  const errors = [...parse.errors];
  const functionsSeen = new Set<WorkdayFunction>();
  let contractorCount = 0;
  let fteCount = 0;
  let earliestStart: string | null = null;
  let latestAttrition: string | null = null;
  const seenIds = new Map<string, number>();

  for (let i = 0; i < parse.rows.length; i += 1) {
    const row = parse.rows[i];
    const rowIndex = i + 1;
    if (seenIds.has(row.employee_id)) {
      errors.push({
        rowIndex,
        field: 'employee_id',
        message: `duplicate employee_id "${row.employee_id}" (first seen row ${seenIds.get(row.employee_id)})`,
      });
      continue;
    }
    seenIds.set(row.employee_id, rowIndex);
    functionsSeen.add(row.function);
    if (row.contractor_flag) contractorCount += 1;
    else fteCount += 1;
    if (!earliestStart || row.start_date < earliestStart) earliestStart = row.start_date;
    if (row.attrition_date && (!latestAttrition || row.attrition_date > latestAttrition)) {
      latestAttrition = row.attrition_date;
    }
  }

  const rowsValid = parse.rows.length - errors.filter((e) => e.field === 'employee_id' && e.message.startsWith('duplicate')).length;

  return {
    rowsValid,
    rowsRejected: errors.length,
    errors,
    contractorCount,
    fteCount,
    functionsSeen,
    earliestStart,
    latestAttrition,
  };
}
