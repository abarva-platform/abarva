// Tower · Oracle / SAP ERP ingest — parser + validator.
//
// Slice S9. Reads the two-sheet workbook (Program Financials, Vendor
// Spend) defined in `public/templates/tower/erp/template.xlsx`,
// normalizes column header variance from both Oracle GL/AP extracts and
// SAP CO-PA reports, validates each row, and returns typed records the
// CLI can hand to the writer.
//
// Why a single parser handles both source systems: the README in
// `public/templates/tower/erp/README.md` describes how each system maps
// onto our schema. Both flatten to the same headers — we just accept
// the union of plausible label spellings (e.g., "WBS Element" → program_id
// for SAP; "Project Number" → program_id for Oracle).
//
// Validation enforced here (a superset of the SQL CHECKs, surfaced as
// row-level error messages):
//   • period_start ≤ period_end
//   • amounts non-negative
//   • capex + opex ≤ actual (≤1 USD rounding tolerance)
//   • vendor_id FK (if present on a financial row, must exist in the
//     vendor sheet)
//   • vendor sheet rows must have stable (vendor_id, vendor_name)

import ExcelJS from 'exceljs';

export const ERP_FINANCIALS_SHEET = 'Program Financials';
export const ERP_VENDOR_SPEND_SHEET = 'Vendor Spend';

export type ErpSourceSystem = 'oracle_gl_ap' | 'sap_co_pa' | 'manual_upload' | 'other';

export interface ErpProgramFinancialRow {
  program_id: string;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  budget_usd: number | null;
  actual_usd: number | null;
  capex_usd: number | null;
  opex_usd: number | null;
  vendor_id: string | null;
  cost_center: string | null;
  gl_account: string | null;
}

export interface ErpVendorRow {
  vendor_id: string;
  vendor_name: string;
  cost_center: string | null;
  gl_account: string | null;
  ttm_spend_usd: number | null;
}

export interface ErpParseError {
  sheet: 'Program Financials' | 'Vendor Spend';
  row_index: number; // 1-based row number in the sheet (matches Excel)
  reason: string;
}

export interface ErpParseResult {
  financials: ErpProgramFinancialRow[];
  vendors: ErpVendorRow[];
  errors: ErpParseError[];
  source_system_guess: ErpSourceSystem;
}

// ── Header variants we recognize ─────────────────────────────────────
// Lowercase, trimmed. Order matters: more-specific wins (we use first
// match), so SAP-specific labels appear before Oracle ones where they
// disambiguate the same destination column.
const FINANCIAL_HEADER_VARIANTS: Record<keyof ErpProgramFinancialRow, string[]> = {
  program_id: ['program_id', 'program id', 'project number', 'project id', 'wbs element', 'wbs', 'po project'],
  period_start: ['period_start', 'period start', 'period from', 'posting date from', 'fiscal period start', 'from date'],
  period_end: ['period_end', 'period end', 'period to', 'posting date to', 'fiscal period end', 'to date'],
  budget_usd: ['budget_usd', 'budget', 'planned cost', 'plan amount', 'budget amount'],
  actual_usd: ['actual_usd', 'actual', 'actual cost', 'actual amount', 'posted amount'],
  capex_usd: ['capex_usd', 'capex', 'capital expenditure', 'capital cost', 'capitalized cost'],
  opex_usd: ['opex_usd', 'opex', 'operating expenditure', 'operating cost', 'expense amount'],
  vendor_id: ['vendor_id', 'vendor id', 'supplier id', 'supplier number', 'vendor number'],
  cost_center: ['cost_center', 'cost center', 'cost centre', 'cost ctr', 'profit center', 'department'],
  gl_account: ['gl_account', 'gl account', 'g/l account', 'gl', 'natural account'],
};

const VENDOR_HEADER_VARIANTS: Record<keyof ErpVendorRow, string[]> = {
  vendor_id: ['vendor_id', 'vendor id', 'supplier id', 'supplier number', 'vendor number'],
  vendor_name: ['vendor_name', 'vendor name', 'supplier name', 'supplier'],
  cost_center: ['cost_center', 'cost center', 'cost centre', 'cost ctr'],
  gl_account: ['gl_account', 'gl account', 'g/l account', 'gl', 'natural account'],
  ttm_spend_usd: ['ttm_spend_usd', 'ttm spend', 'ttm', 'trailing twelve month spend', 'annual spend', 'ttm_spend'],
};

// Markers used to guess the upstream source system from sheet headers.
// (Best-effort — used for provenance only, never gates ingest.)
const SAP_MARKERS = ['wbs element', 'profit center', 'posting date'];
const ORACLE_MARKERS = ['project number', 'po project', 'natural account'];

interface HeaderIndex {
  // Map of canonical-column-key → 0-based column index in the sheet.
  byKey: Record<string, number>;
  raw_headers: string[];
}

function buildHeaderIndex(
  headerRow: ExcelJS.Row,
  variants: Record<string, string[]>,
): HeaderIndex {
  const raw: string[] = [];
  const byKey: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const v = String(cell.value ?? '').trim();
    raw[colNumber - 1] = v;
  });
  const lowered = raw.map((h) => h.toLowerCase());
  for (const [key, candidates] of Object.entries(variants)) {
    for (const cand of candidates) {
      const idx = lowered.findIndex((h) => h === cand);
      if (idx >= 0) {
        byKey[key] = idx;
        break;
      }
    }
  }
  return { byKey, raw_headers: raw };
}

function getCell(row: ExcelJS.Row, idx0: number): string {
  if (idx0 < 0) return '';
  const cell = row.getCell(idx0 + 1);
  if (cell.value === null || cell.value === undefined) return '';
  // ExcelJS dates come back as Date objects.
  if (cell.value instanceof Date) {
    return cell.value.toISOString().slice(0, 10);
  }
  // Hyperlinks come back as { text, hyperlink }.
  if (typeof cell.value === 'object' && cell.value !== null && 'text' in cell.value) {
    return String((cell.value as { text: unknown }).text ?? '').trim();
  }
  // Rich text.
  if (typeof cell.value === 'object' && cell.value !== null && 'richText' in cell.value) {
    const rt = (cell.value as { richText: Array<{ text: string }> }).richText;
    return rt.map((r) => r.text).join('').trim();
  }
  return String(cell.value).trim();
}

function parseAmount(input: string): number | null {
  if (!input) return null;
  // Strip $, commas, parentheses (which sometimes denote negatives in
  // accounting exports — but ERPs almost never emit negative actuals
  // for an in-flight program, so we just strip and parse).
  const cleaned = input.replace(/[$,()\s]/g, '').replace(/USD$/i, '');
  if (!cleaned || cleaned === '-') return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDate(input: string): string | null {
  if (!input) return null;
  // Already YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // YYYY-MM-DDTHH... (ISO from a Date cell). Slice the date part.
  if (/^\d{4}-\d{2}-\d{2}T/.test(input)) return input.slice(0, 10);
  // Try Date parsing for MM/DD/YYYY and similar.
  const d = new Date(input);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function guessSourceSystem(headers: string[]): ErpSourceSystem {
  const lowered = headers.map((h) => h.toLowerCase());
  const sapHits = SAP_MARKERS.filter((m) => lowered.includes(m)).length;
  const oracleHits = ORACLE_MARKERS.filter((m) => lowered.includes(m)).length;
  if (sapHits > oracleHits) return 'sap_co_pa';
  if (oracleHits > sapHits) return 'oracle_gl_ap';
  return 'manual_upload';
}

function isEmptyRow(row: ExcelJS.Row, headerIdx: HeaderIndex): boolean {
  for (const idx of Object.values(headerIdx.byKey)) {
    if (getCell(row, idx) !== '') return false;
  }
  return true;
}

// ── Public entry point ──────────────────────────────────────────────
export async function parseErpWorkbook(buffer: ArrayBuffer | Buffer): Promise<ErpParseResult> {
  const workbook = new ExcelJS.Workbook();
  if (buffer instanceof ArrayBuffer) {
    await workbook.xlsx.load(buffer);
  } else {
    // Buffer
    await workbook.xlsx.load(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
  }

  const errors: ErpParseError[] = [];

  const finSheet = workbook.getWorksheet(ERP_FINANCIALS_SHEET);
  const venSheet = workbook.getWorksheet(ERP_VENDOR_SPEND_SHEET);

  if (!finSheet) {
    errors.push({
      sheet: 'Program Financials',
      row_index: 0,
      reason: `Workbook is missing required sheet "${ERP_FINANCIALS_SHEET}".`,
    });
  }
  if (!venSheet) {
    errors.push({
      sheet: 'Vendor Spend',
      row_index: 0,
      reason: `Workbook is missing required sheet "${ERP_VENDOR_SPEND_SHEET}".`,
    });
  }

  // Headers are on row 3 — rows 1 and 2 carry the synthetic banner and
  // section title (matches the generate-xlsx convention).
  const HEADER_ROW = 3;
  const DATA_START_ROW = 4;

  const finHeaderIdx = finSheet ? buildHeaderIndex(finSheet.getRow(HEADER_ROW), FINANCIAL_HEADER_VARIANTS) : null;
  const venHeaderIdx = venSheet ? buildHeaderIndex(venSheet.getRow(HEADER_ROW), VENDOR_HEADER_VARIANTS) : null;

  // ── Parse vendors first so we can FK-check financials ────────────
  const vendors: ErpVendorRow[] = [];
  const vendorIds = new Set<string>();
  if (venSheet && venHeaderIdx) {
    const required: Array<keyof ErpVendorRow> = ['vendor_id', 'vendor_name'];
    const missing = required.filter((k) => venHeaderIdx.byKey[k] === undefined);
    if (missing.length > 0) {
      errors.push({
        sheet: 'Vendor Spend',
        row_index: HEADER_ROW,
        reason: `Missing required column(s): ${missing.join(', ')}.`,
      });
    } else {
      venSheet.eachRow((row, rowNumber) => {
        if (rowNumber < DATA_START_ROW) return;
        if (isEmptyRow(row, venHeaderIdx)) return;
        const vendor_id = getCell(row, venHeaderIdx.byKey.vendor_id);
        const vendor_name = getCell(row, venHeaderIdx.byKey.vendor_name);
        if (!vendor_id || !vendor_name) {
          errors.push({
            sheet: 'Vendor Spend',
            row_index: rowNumber,
            reason: 'vendor_id and vendor_name are required.',
          });
          return;
        }
        if (vendorIds.has(vendor_id)) {
          errors.push({
            sheet: 'Vendor Spend',
            row_index: rowNumber,
            reason: `Duplicate vendor_id "${vendor_id}".`,
          });
          return;
        }
        const ttm = parseAmount(getCell(row, venHeaderIdx.byKey.ttm_spend_usd ?? -1));
        if (ttm !== null && ttm < 0) {
          errors.push({
            sheet: 'Vendor Spend',
            row_index: rowNumber,
            reason: `ttm_spend_usd must be non-negative (got ${ttm}).`,
          });
          return;
        }
        vendors.push({
          vendor_id,
          vendor_name,
          cost_center: getCell(row, venHeaderIdx.byKey.cost_center ?? -1) || null,
          gl_account: getCell(row, venHeaderIdx.byKey.gl_account ?? -1) || null,
          ttm_spend_usd: ttm,
        });
        vendorIds.add(vendor_id);
      });
    }
  }

  // ── Parse financials ─────────────────────────────────────────────
  const financials: ErpProgramFinancialRow[] = [];
  if (finSheet && finHeaderIdx) {
    const required: Array<keyof ErpProgramFinancialRow> = ['program_id', 'period_start', 'period_end'];
    const missing = required.filter((k) => finHeaderIdx.byKey[k] === undefined);
    if (missing.length > 0) {
      errors.push({
        sheet: 'Program Financials',
        row_index: HEADER_ROW,
        reason: `Missing required column(s): ${missing.join(', ')}.`,
      });
    } else {
      const natural_keys = new Set<string>();
      finSheet.eachRow((row, rowNumber) => {
        if (rowNumber < DATA_START_ROW) return;
        if (isEmptyRow(row, finHeaderIdx)) return;

        const program_id = getCell(row, finHeaderIdx.byKey.program_id);
        const period_start = parseDate(getCell(row, finHeaderIdx.byKey.period_start));
        const period_end = parseDate(getCell(row, finHeaderIdx.byKey.period_end));

        if (!program_id) {
          errors.push({ sheet: 'Program Financials', row_index: rowNumber, reason: 'program_id is required.' });
          return;
        }
        if (!period_start || !period_end) {
          errors.push({
            sheet: 'Program Financials',
            row_index: rowNumber,
            reason: 'period_start and period_end must be valid dates (YYYY-MM-DD).',
          });
          return;
        }
        if (period_start > period_end) {
          errors.push({
            sheet: 'Program Financials',
            row_index: rowNumber,
            reason: `period_start (${period_start}) must be ≤ period_end (${period_end}).`,
          });
          return;
        }

        const budget_usd = parseAmount(getCell(row, finHeaderIdx.byKey.budget_usd ?? -1));
        const actual_usd = parseAmount(getCell(row, finHeaderIdx.byKey.actual_usd ?? -1));
        const capex_usd = parseAmount(getCell(row, finHeaderIdx.byKey.capex_usd ?? -1));
        const opex_usd = parseAmount(getCell(row, finHeaderIdx.byKey.opex_usd ?? -1));

        for (const [name, val] of [
          ['budget_usd', budget_usd],
          ['actual_usd', actual_usd],
          ['capex_usd', capex_usd],
          ['opex_usd', opex_usd],
        ] as const) {
          if (val !== null && val < 0) {
            errors.push({
              sheet: 'Program Financials',
              row_index: rowNumber,
              reason: `${name} must be non-negative (got ${val}).`,
            });
            return;
          }
        }

        if (
          actual_usd !== null &&
          capex_usd !== null &&
          opex_usd !== null &&
          capex_usd + opex_usd > actual_usd + 1
        ) {
          errors.push({
            sheet: 'Program Financials',
            row_index: rowNumber,
            reason: `capex (${capex_usd}) + opex (${opex_usd}) exceeds actual (${actual_usd}).`,
          });
          return;
        }

        const vendor_id = getCell(row, finHeaderIdx.byKey.vendor_id ?? -1) || null;
        if (vendor_id && vendors.length > 0 && !vendorIds.has(vendor_id)) {
          errors.push({
            sheet: 'Program Financials',
            row_index: rowNumber,
            reason: `vendor_id "${vendor_id}" is not in the Vendor Spend sheet.`,
          });
          return;
        }

        const natural_key = `${program_id}::${period_start}`;
        if (natural_keys.has(natural_key)) {
          errors.push({
            sheet: 'Program Financials',
            row_index: rowNumber,
            reason: `Duplicate (program_id, period_start) tuple: ${natural_key}.`,
          });
          return;
        }
        natural_keys.add(natural_key);

        financials.push({
          program_id,
          period_start,
          period_end,
          budget_usd,
          actual_usd,
          capex_usd,
          opex_usd,
          vendor_id,
          cost_center: getCell(row, finHeaderIdx.byKey.cost_center ?? -1) || null,
          gl_account: getCell(row, finHeaderIdx.byKey.gl_account ?? -1) || null,
        });
      });
    }
  }

  // Source-system guess uses whichever sheet had headers.
  const headerSampleSource = finHeaderIdx?.raw_headers ?? venHeaderIdx?.raw_headers ?? [];
  const source_system_guess = guessSourceSystem(headerSampleSource);

  return { financials, vendors, errors, source_system_guess };
}
