import ExcelJS from 'exceljs';

import {
  CMDB_CI_COLUMNS,
  CMDB_CRITICALITY_LEVELS,
  CMDB_DEPENDENCY_COLUMNS,
  CMDB_DEPENDENCY_TYPES,
  CMDB_LIFECYCLE_STATES,
  CMDB_SHEET_CIS,
  CMDB_SHEET_DEPS,
  type CmdbCiRow,
  type CmdbCriticality,
  type CmdbDependencyRow,
  type CmdbDependencyType,
  type CmdbLifecycleState,
} from './schema';

export interface CmdbParseIssue {
  sheet: typeof CMDB_SHEET_CIS | typeof CMDB_SHEET_DEPS;
  row: number;
  column: string;
  message: string;
}

export interface CmdbParseResult {
  cis: CmdbCiRow[];
  dependencies: CmdbDependencyRow[];
  issues: CmdbParseIssue[];
}

function readCell(row: ExcelJS.Row, columnIndex: number): string {
  const cell = row.getCell(columnIndex);
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  // ExcelJS rich text / hyperlink / formula objects
  if (typeof value === 'object') {
    if ('text' in value && typeof (value as { text: unknown }).text === 'string') {
      return (value as { text: string }).text.trim();
    }
    if (
      'result' in value &&
      (typeof (value as { result: unknown }).result === 'string' ||
        typeof (value as { result: unknown }).result === 'number')
    ) {
      return String((value as { result: string | number }).result).trim();
    }
    if (
      'richText' in value &&
      Array.isArray((value as { richText: unknown }).richText)
    ) {
      return ((value as { richText: Array<{ text?: string }> }).richText)
        .map((part) => part.text ?? '')
        .join('')
        .trim();
    }
  }
  return String(value).trim();
}

function readRowAsStrings(row: ExcelJS.Row): Map<string, number> {
  const headerIndex = new Map<string, number>();
  row.eachCell((cell, colNumber) => {
    const text =
      typeof cell.value === 'string'
        ? cell.value.trim()
        : String(cell.value ?? '').trim();
    if (text) headerIndex.set(text.toLowerCase(), colNumber);
  });
  return headerIndex;
}

/**
 * Locate the header row inside a sheet that may have a synthetic-data
 * banner in row 1. We scan the first {@link MAX_BANNER_ROWS} rows for the
 * first row that contains all required headers; that becomes the header
 * row and data starts at the row immediately after.
 */
const MAX_BANNER_ROWS = 5;

function locateHeaderRow(
  sheet: ExcelJS.Worksheet,
  expectedHeaders: ReadonlyArray<string>,
): { headerRowNumber: number; headerIndex: Map<string, number>; missing: string[] } {
  const expectedLower = expectedHeaders.map((h) => h.toLowerCase());
  let bestMatch: { rowNumber: number; index: Map<string, number>; missing: string[] } | null = null;
  for (let r = 1; r <= MAX_BANNER_ROWS; r += 1) {
    const headerIndex = readRowAsStrings(sheet.getRow(r));
    const missing = expectedLower.filter((h) => !headerIndex.has(h));
    if (missing.length === 0) {
      return { headerRowNumber: r, headerIndex, missing };
    }
    if (!bestMatch || missing.length < bestMatch.missing.length) {
      bestMatch = { rowNumber: r, index: headerIndex, missing: expectedHeaders.filter((h) => !headerIndex.has(h.toLowerCase())) };
    }
  }
  // Fall back to row 1 so error messages reference the right row.
  return {
    headerRowNumber: bestMatch?.rowNumber ?? 1,
    headerIndex: bestMatch?.index ?? new Map(),
    missing: bestMatch?.missing ?? Array.from(expectedHeaders),
  };
}

function isLifecycleState(value: string): value is CmdbLifecycleState {
  return (CMDB_LIFECYCLE_STATES as readonly string[]).includes(value);
}

function isCriticality(value: string): value is CmdbCriticality {
  return (CMDB_CRITICALITY_LEVELS as readonly string[]).includes(value);
}

function isDependencyType(value: string): value is CmdbDependencyType {
  return (CMDB_DEPENDENCY_TYPES as readonly string[]).includes(value);
}

/**
 * Parse a ServiceNow CMDB ingest workbook produced from the template.
 * Tolerant to extra columns and out-of-order columns (matched by header
 * name). Rows that fail validation are skipped and recorded as issues —
 * the caller decides whether to fail the run or continue with the good
 * rows.
 */
export async function parseServiceNowCmdbWorkbook(
  input: Buffer | Uint8Array,
): Promise<CmdbParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    input instanceof Buffer
      ? (input.buffer.slice(
          input.byteOffset,
          input.byteOffset + input.byteLength,
        ) as ArrayBuffer)
      : (input.buffer as ArrayBuffer),
  );

  const issues: CmdbParseIssue[] = [];
  const cis: CmdbCiRow[] = [];
  const dependencies: CmdbDependencyRow[] = [];

  // --- Configuration Items --------------------------------------------------
  const ciSheet = workbook.getWorksheet(CMDB_SHEET_CIS);
  if (!ciSheet) {
    issues.push({
      sheet: CMDB_SHEET_CIS,
      row: 0,
      column: '',
      message: `Missing required sheet "${CMDB_SHEET_CIS}".`,
    });
  } else {
    const expectedHeaders = CMDB_CI_COLUMNS.map((col) => col.header);
    const { headerRowNumber, headerIndex, missing } = locateHeaderRow(
      ciSheet,
      expectedHeaders,
    );
    for (const header of missing) {
      issues.push({
        sheet: CMDB_SHEET_CIS,
        row: headerRowNumber,
        column: header,
        message: `Missing required column "${header}".`,
      });
    }
    if (missing.length === 0) {
      const cols = Object.fromEntries(
        CMDB_CI_COLUMNS.map((col) => [
          col.key,
          headerIndex.get(col.header.toLowerCase())!,
        ]),
      ) as Record<keyof CmdbCiRow, number>;

      const lastRow = ciSheet.actualRowCount ?? ciSheet.rowCount;
      for (let rowNumber = headerRowNumber + 1; rowNumber <= lastRow; rowNumber += 1) {
        const row = ciSheet.getRow(rowNumber);
        const ciSysId = readCell(row, cols.ciSysId);
        const ciName = readCell(row, cols.ciName);
        // Skip blank rows entirely — common when users delete a row and
        // leave its grid lines.
        if (!ciSysId && !ciName) continue;

        const lifecycleStateRaw = readCell(row, cols.lifecycleState).toLowerCase();
        const criticalityRaw = readCell(row, cols.criticality).toLowerCase();

        const requiredErrors: string[] = [];
        if (!ciSysId) requiredErrors.push('ci_sys_id');
        if (!ciName) requiredErrors.push('ci_name');
        if (!readCell(row, cols.ciType)) requiredErrors.push('ci_type');
        if (!readCell(row, cols.ciClass)) requiredErrors.push('ci_class');
        if (!readCell(row, cols.ownerTeam)) requiredErrors.push('owner_team');
        if (!readCell(row, cols.businessService))
          requiredErrors.push('business_service');
        if (!readCell(row, cols.environment)) requiredErrors.push('environment');

        if (requiredErrors.length > 0) {
          issues.push({
            sheet: CMDB_SHEET_CIS,
            row: rowNumber,
            column: requiredErrors.join(', '),
            message: `Missing required value(s): ${requiredErrors.join(', ')}.`,
          });
          continue;
        }

        if (!isLifecycleState(lifecycleStateRaw)) {
          issues.push({
            sheet: CMDB_SHEET_CIS,
            row: rowNumber,
            column: 'lifecycle_state',
            message: `Invalid lifecycle_state "${lifecycleStateRaw}". Allowed: ${CMDB_LIFECYCLE_STATES.join(', ')}.`,
          });
          continue;
        }
        if (!isCriticality(criticalityRaw)) {
          issues.push({
            sheet: CMDB_SHEET_CIS,
            row: rowNumber,
            column: 'criticality',
            message: `Invalid criticality "${criticalityRaw}". Allowed: ${CMDB_CRITICALITY_LEVELS.join(', ')}.`,
          });
          continue;
        }

        cis.push({
          ciSysId,
          ciName,
          ciType: readCell(row, cols.ciType),
          ciClass: readCell(row, cols.ciClass),
          lifecycleState: lifecycleStateRaw,
          ownerTeam: readCell(row, cols.ownerTeam),
          businessService: readCell(row, cols.businessService),
          criticality: criticalityRaw,
          environment: readCell(row, cols.environment),
        });
      }
    }
  }

  // --- Dependencies ---------------------------------------------------------
  const depSheet = workbook.getWorksheet(CMDB_SHEET_DEPS);
  if (!depSheet) {
    issues.push({
      sheet: CMDB_SHEET_DEPS,
      row: 0,
      column: '',
      message: `Missing required sheet "${CMDB_SHEET_DEPS}".`,
    });
  } else {
    const expectedHeaders = CMDB_DEPENDENCY_COLUMNS.map((col) => col.header);
    const { headerRowNumber, headerIndex, missing } = locateHeaderRow(
      depSheet,
      expectedHeaders,
    );
    for (const header of missing) {
      issues.push({
        sheet: CMDB_SHEET_DEPS,
        row: headerRowNumber,
        column: header,
        message: `Missing required column "${header}".`,
      });
    }
    if (missing.length === 0) {
      const cols = Object.fromEntries(
        CMDB_DEPENDENCY_COLUMNS.map((col) => [
          col.key,
          headerIndex.get(col.header.toLowerCase())!,
        ]),
      ) as Record<keyof CmdbDependencyRow, number>;

      const lastRow = depSheet.actualRowCount ?? depSheet.rowCount;
      for (let rowNumber = headerRowNumber + 1; rowNumber <= lastRow; rowNumber += 1) {
        const row = depSheet.getRow(rowNumber);
        const source = readCell(row, cols.sourceCiSysId);
        const target = readCell(row, cols.targetCiSysId);
        if (!source && !target) continue;

        const depTypeRaw = readCell(row, cols.dependencyType).toLowerCase();

        const requiredErrors: string[] = [];
        if (!source) requiredErrors.push('source_ci_sys_id');
        if (!target) requiredErrors.push('target_ci_sys_id');
        if (requiredErrors.length > 0) {
          issues.push({
            sheet: CMDB_SHEET_DEPS,
            row: rowNumber,
            column: requiredErrors.join(', '),
            message: `Missing required value(s): ${requiredErrors.join(', ')}.`,
          });
          continue;
        }
        if (!isDependencyType(depTypeRaw)) {
          issues.push({
            sheet: CMDB_SHEET_DEPS,
            row: rowNumber,
            column: 'dependency_type',
            message: `Invalid dependency_type "${depTypeRaw}". Allowed: ${CMDB_DEPENDENCY_TYPES.join(', ')}.`,
          });
          continue;
        }
        if (source === target) {
          issues.push({
            sheet: CMDB_SHEET_DEPS,
            row: rowNumber,
            column: 'source_ci_sys_id, target_ci_sys_id',
            message: 'Self-referential dependency (source equals target).',
          });
          continue;
        }
        dependencies.push({
          sourceCiSysId: source,
          targetCiSysId: target,
          dependencyType: depTypeRaw,
        });
      }
    }
  }

  return { cis, dependencies, issues };
}
