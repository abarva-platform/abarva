import Papa from 'papaparse';
import {
  ATTRITION_REASON_ENUM,
  WORKDAY_FUNCTION_ENUM,
  type AttritionReason,
  type WorkdayFunction,
  type WorkdayParseError,
  type WorkdayParseResult,
  type WorkdayWorkforceRow,
} from './types';

// Column header aliases — case-insensitive, accepts the canonical name plus
// common Workday RAAS export labels.
const COLUMN_ALIASES: Record<keyof WorkdayWorkforceRow, string[]> = {
  employee_id: ['employee_id', 'employee id', 'worker id', 'worker_id', 'wid'],
  function: ['function', 'organization', 'org function', 'job family group'],
  sub_function: ['sub_function', 'sub function', 'sub-function', 'job family'],
  location: ['location', 'site', 'work location', 'region'],
  level: ['level', 'career level', 'job level', 'grade'],
  contractor_flag: ['contractor_flag', 'contractor flag', 'is_contractor', 'contractor', 'worker type'],
  start_date: ['start_date', 'start date', 'hire date', 'hire_date', 'contract start'],
  attrition_date: ['attrition_date', 'attrition date', 'termination date', 'termination_date', 'end date', 'end_date'],
  attrition_reason: ['attrition_reason', 'attrition reason', 'termination reason', 'reason'],
};

function findHeader(headers: string[], aliases: string[]): string | null {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function normalizeBoolean(input: string): boolean | null {
  const v = input.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes' || v === 'y' || v === 'contractor' || v === 'contingent') return true;
  if (v === 'false' || v === '0' || v === 'no' || v === 'n' || v === 'fte' || v === 'employee' || v === '') return false;
  return null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDate(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (ISO_DATE.test(v)) {
    // Validate that JS Date parses to the same day.
    const d = new Date(`${v}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return null;
    return v;
  }
  // Accept M/D/YYYY -> YYYY-MM-DD
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mm, dd, yyyy] = m;
    const monthNum = Number(mm);
    const dayNum = Number(dd);
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;
    const month = mm.padStart(2, '0');
    const day = dd.padStart(2, '0');
    return `${yyyy}-${month}-${day}`;
  }
  return null;
}

function normalizeFunction(input: string): WorkdayFunction | null {
  const v = input.trim();
  if (!v) return null;
  const match = WORKDAY_FUNCTION_ENUM.find((f) => f.toLowerCase() === v.toLowerCase());
  return match ?? null;
}

function normalizeReason(input: string): AttritionReason | null {
  const v = input.trim().toLowerCase().replace(/\s+/g, '_');
  if (!v) return null;
  return (ATTRITION_REASON_ENUM as readonly string[]).includes(v) ? (v as AttritionReason) : null;
}

/**
 * Parse a Workday HCM CSV extract. Lenient on header aliases, strict on
 * value normalisation. Returns rows + per-cell errors so the caller can
 * present a row-level fix list.
 */
export function parseWorkdayHcmCsv(csvText: string): WorkdayParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const records = parsed.data ?? [];
  const errors: WorkdayParseError[] = [];
  const rows: WorkdayWorkforceRow[] = [];

  if (records.length === 0) {
    return { rows: [], errors: [{ rowIndex: 0, field: '*', message: 'csv has no data rows' }], rowsTotal: 0 };
  }

  const headers = Object.keys(records[0]);
  const resolved: Partial<Record<keyof WorkdayWorkforceRow, string>> = {};
  for (const key of Object.keys(COLUMN_ALIASES) as Array<keyof WorkdayWorkforceRow>) {
    const header = findHeader(headers, COLUMN_ALIASES[key]);
    if (header) resolved[key] = header;
  }

  // Required columns must resolve.
  const required: Array<keyof WorkdayWorkforceRow> = [
    'employee_id',
    'function',
    'contractor_flag',
    'start_date',
  ];
  for (const key of required) {
    if (!resolved[key]) {
      errors.push({
        rowIndex: 0,
        field: key,
        message: `missing required column. accepted aliases: ${COLUMN_ALIASES[key].join(', ')}`,
      });
    }
  }
  if (errors.length > 0) {
    return { rows: [], errors, rowsTotal: records.length };
  }

  records.forEach((rec, i) => {
    const rowIndex = i + 1;
    const employee_id = String(rec[resolved.employee_id!] ?? '').trim();
    if (!employee_id) {
      errors.push({ rowIndex, field: 'employee_id', message: 'empty value' });
      return;
    }

    const rawFunction = String(rec[resolved.function!] ?? '').trim();
    const fn = normalizeFunction(rawFunction);
    if (!fn) {
      errors.push({
        rowIndex,
        field: 'function',
        message: `not in WORKDAY_FUNCTION_ENUM (got "${rawFunction}")`,
        raw: rawFunction,
      });
      return;
    }

    const rawFlag = String(rec[resolved.contractor_flag!] ?? '').trim();
    const flag = normalizeBoolean(rawFlag);
    if (flag === null) {
      errors.push({
        rowIndex,
        field: 'contractor_flag',
        message: `not a boolean (got "${rawFlag}")`,
        raw: rawFlag,
      });
      return;
    }

    const rawStart = String(rec[resolved.start_date!] ?? '').trim();
    const start = normalizeDate(rawStart);
    if (!start) {
      errors.push({
        rowIndex,
        field: 'start_date',
        message: `not a valid date (got "${rawStart}")`,
        raw: rawStart,
      });
      return;
    }

    let attrition: string | null = null;
    if (resolved.attrition_date) {
      const rawAttr = String(rec[resolved.attrition_date] ?? '').trim();
      if (rawAttr) {
        attrition = normalizeDate(rawAttr);
        if (!attrition) {
          errors.push({
            rowIndex,
            field: 'attrition_date',
            message: `not a valid date (got "${rawAttr}")`,
            raw: rawAttr,
          });
          return;
        }
        if (attrition < start) {
          errors.push({
            rowIndex,
            field: 'attrition_date',
            message: `attrition_date (${attrition}) is before start_date (${start})`,
          });
          return;
        }
      }
    }

    let reason: AttritionReason | null = null;
    if (attrition && resolved.attrition_reason) {
      const rawReason = String(rec[resolved.attrition_reason] ?? '').trim();
      if (rawReason) {
        reason = normalizeReason(rawReason);
        if (!reason) {
          errors.push({
            rowIndex,
            field: 'attrition_reason',
            message: `not in ATTRITION_REASON_ENUM (got "${rawReason}")`,
            raw: rawReason,
          });
          return;
        }
      }
    }

    rows.push({
      employee_id,
      function: fn,
      sub_function: resolved.sub_function ? String(rec[resolved.sub_function] ?? '').trim() || null : null,
      location: resolved.location ? String(rec[resolved.location] ?? '').trim() || null : null,
      level: resolved.level ? String(rec[resolved.level] ?? '').trim() || null : null,
      contractor_flag: flag,
      start_date: start,
      attrition_date: attrition,
      attrition_reason: reason,
    });
  });

  return { rows, errors, rowsTotal: records.length };
}
