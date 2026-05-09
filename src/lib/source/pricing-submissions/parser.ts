// Source · vendor pricing-submission parser
//
// Reads a vendor's filled-in copy of the d19a Pricing Template xlsx
// and produces a structured payload + parse-status receipt. Robust to
// vendor edits that don't break the contract (extra rows, reordered
// columns within a sheet, free-form pricing notes), but flags any
// mutation of locked content (assumption set rows changed).
//
// Parse strategy by sheet:
//   1. Cover            — extract Vendor name from the labeled cell
//   2. Pricing Detail   — for each row, line id (col A) → unit price
//                          (col F) + vendor note (col H). Skip header,
//                          skip TOTAL row.
//   3. Pricing Notes    — every non-empty (Topic, Vendor narrative)
//                          pair becomes a candidate assumption deviation.
//                          Severity inferred from keywords.
//
// We don't validate the assumption set hash here (Slice 2c.4 might add
// a tamper check). For now, locked sheets are treated as advisory.
//
// Returns a normalized insert shape ready for the DAO. Never throws on
// recoverable issues — instead populates parse_warnings + sets
// parse_status = 'partial' or 'failed'.

import 'server-only';

import ExcelJS from 'exceljs';

import type {
  AssumptionDeviation,
  ParseStatus,
  ParseWarning,
  VendorPricingSubmissionInsert,
} from './types';

export interface ParseInput {
  /** Raw xlsx bytes. */
  bytes: Uint8Array | ArrayBuffer | Buffer;
  /** Original upload filename (for audit). */
  filename: string;
  /** Source event id. */
  sourceEventId: string;
  /** Tenant key for RLS scoping. */
  tenantKey: string;
  /** Optional vendor name override (from upload form). */
  vendorNameOverride?: string;
  /** Optional uploader Clerk user id. */
  uploadedByUserId?: string | null;
}

export interface ParseResult {
  insert: VendorPricingSubmissionInsert;
  /** Convenience copy of insert.parseStatus. */
  status: ParseStatus;
  /** Convenience copy of insert.parseWarnings. */
  warnings: ParseWarning[];
}

/**
 * Parse a vendor pricing-submission xlsx. Tolerant: returns a row even
 * when fields are missing, but flags every gap in parseWarnings.
 */
export async function parseVendorPricingSubmission(
  input: ParseInput,
): Promise<ParseResult> {
  const warnings: ParseWarning[] = [];
  const wb = new ExcelJS.Workbook();
  // ExcelJS's load() accepts Buffer / ArrayBuffer / Uint8Array.
  const buffer =
    input.bytes instanceof Buffer
      ? input.bytes
      : input.bytes instanceof ArrayBuffer
        ? Buffer.from(input.bytes)
        : Buffer.from(input.bytes.buffer, input.bytes.byteOffset, input.bytes.byteLength);
  try {
    // ExcelJS's load() ships with older Buffer typings; the modern Node
    // Buffer<ArrayBufferLike> is structurally compatible but requires a cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wb.xlsx.load(buffer as any);
  } catch (err) {
    return {
      insert: failedInsert(input, [
        {
          code: 'xlsx_load_failed',
          message: `Could not parse the uploaded file as xlsx: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
      ]),
      status: 'failed',
      warnings: [],
    };
  }

  // ── Vendor name ───────────────────────────────────────────────────────────
  const vendorName =
    input.vendorNameOverride?.trim() || extractVendorName(wb, warnings) || '';
  if (!vendorName) {
    warnings.push({
      code: 'missing_vendor_name',
      message:
        'Could not determine vendor name from the Cover sheet, and no override was provided.',
    });
  }

  // ── Pricing Detail ────────────────────────────────────────────────────────
  const pricingDetail = wb.getWorksheet('Pricing Detail');
  if (!pricingDetail) {
    warnings.push({
      code: 'missing_pricing_detail_sheet',
      message:
        'No "Pricing Detail" sheet found. The submission is unusable for normalization.',
    });
    return {
      insert: failedInsert(input, warnings, vendorName),
      status: 'failed',
      warnings,
    };
  }

  const { unitPricesById, vendorNotesById, sheetWarnings } =
    extractPricingDetail(pricingDetail);
  warnings.push(...sheetWarnings);

  // ── Pricing Notes ─────────────────────────────────────────────────────────
  const pricingNotesSheet = wb.getWorksheet('Pricing Notes');
  let pricingNotes = '';
  let assumptionDeviations: AssumptionDeviation[] = [];
  if (pricingNotesSheet) {
    const extracted = extractPricingNotes(pricingNotesSheet);
    pricingNotes = extracted.pricingNotes;
    assumptionDeviations = extracted.deviations;
  } else {
    warnings.push({
      code: 'missing_pricing_notes_sheet',
      message:
        'No "Pricing Notes" sheet found. Assumption deviations will not be flagged for this vendor.',
    });
  }

  // Status is 'parsed' only when all critical fields are present:
  //   - vendor name is known
  //   - at least one unit price was extracted
  //   - no warnings flagged 'incomplete_pricing' or 'missing_*' fields
  // Anything weaker drops to 'partial'.
  const blockingWarning = warnings.some(
    (w) =>
      w.code === 'incomplete_pricing' ||
      w.code === 'missing_vendor_name' ||
      w.code === 'missing_pricing_notes_sheet',
  );
  const status: ParseStatus =
    !vendorName ||
    Object.keys(unitPricesById).length === 0 ||
    blockingWarning
      ? 'partial'
      : 'parsed';

  return {
    insert: {
      sourceEventId: input.sourceEventId,
      tenantKey: input.tenantKey,
      vendorName: vendorName || '(unknown vendor)',
      uploadedByUserId: input.uploadedByUserId ?? null,
      uploadedFilename: input.filename,
      unitPricesById,
      vendorNotesById,
      pricingNotes,
      assumptionDeviations,
      parseStatus: status,
      parseWarnings: warnings,
    },
    status,
    warnings,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function failedInsert(
  input: ParseInput,
  warnings: ParseWarning[],
  vendorName?: string,
): VendorPricingSubmissionInsert {
  return {
    sourceEventId: input.sourceEventId,
    tenantKey: input.tenantKey,
    vendorName: vendorName || input.vendorNameOverride?.trim() || '(unparseable)',
    uploadedByUserId: input.uploadedByUserId ?? null,
    uploadedFilename: input.filename,
    unitPricesById: {},
    vendorNotesById: {},
    pricingNotes: '',
    assumptionDeviations: [],
    parseStatus: 'failed',
    parseWarnings: warnings,
  };
}

function extractVendorName(
  wb: ExcelJS.Workbook,
  warnings: ParseWarning[],
): string | null {
  const cover = wb.getWorksheet('Cover');
  if (!cover) {
    warnings.push({
      code: 'missing_cover_sheet',
      message: 'No "Cover" sheet found; vendor name fallback will be used.',
    });
    return null;
  }
  // Walk the cover sheet looking for a row whose A-cell text contains
  // "vendor name" (case-insensitive). Read its B cell.
  let found: string | null = null;
  cover.eachRow({ includeEmpty: false }, (row) => {
    if (found) return;
    const labelCell = row.getCell(1).value;
    if (typeof labelCell !== 'string') return;
    if (!/^vendor\s*name\b/i.test(labelCell.trim())) return;
    const valueCell = row.getCell(2).value;
    const v = stringFromCell(valueCell);
    if (v && v.length > 0 && v.length < 200) found = v;
  });
  return found;
}

function extractPricingDetail(sheet: ExcelJS.Worksheet): {
  unitPricesById: Record<string, number>;
  vendorNotesById: Record<string, string>;
  sheetWarnings: ParseWarning[];
} {
  const unitPricesById: Record<string, number> = {};
  const vendorNotesById: Record<string, string> = {};
  const sheetWarnings: ParseWarning[] = [];
  let dataRowCount = 0;
  let unitPriceRowCount = 0;

  sheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return; // header
    const lineId = stringFromCell(row.getCell(1).value);
    if (!lineId) return;
    if (/^total\b/i.test(lineId)) return;
    if (!/^L[0-9A-Z-]+/i.test(lineId)) return;
    dataRowCount += 1;
    const unitPriceCell = row.getCell(6).value; // column F
    const unitPrice = numberFromCell(unitPriceCell);
    if (unitPrice == null) {
      sheetWarnings.push({
        code: 'missing_unit_price',
        message: `Line ${lineId}: no unit price provided.`,
      });
    } else if (unitPrice < 0) {
      sheetWarnings.push({
        code: 'negative_unit_price',
        message: `Line ${lineId}: unit price ${unitPrice} is negative; ignored.`,
      });
    } else {
      unitPricesById[lineId] = unitPrice;
      unitPriceRowCount += 1;
    }
    const noteCell = row.getCell(8).value; // column H
    const note = stringFromCell(noteCell);
    if (note) vendorNotesById[lineId] = note;
  });

  if (dataRowCount === 0) {
    sheetWarnings.push({
      code: 'pricing_detail_empty',
      message:
        'Pricing Detail sheet has no recognizable line-id rows. Either the template was modified or the wrong sheet was filled.',
    });
  } else if (unitPriceRowCount < dataRowCount) {
    sheetWarnings.push({
      code: 'incomplete_pricing',
      message: `${unitPriceRowCount}/${dataRowCount} line items priced. Submission will be flagged 'partial'.`,
    });
  }

  return { unitPricesById, vendorNotesById, sheetWarnings };
}

function extractPricingNotes(sheet: ExcelJS.Worksheet): {
  pricingNotes: string;
  deviations: AssumptionDeviation[];
} {
  const lines: string[] = [];
  const deviations: AssumptionDeviation[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return; // header
    const topic = stringFromCell(row.getCell(1).value);
    const narrative = stringFromCell(row.getCell(2).value);
    if (!narrative) return;
    if (topic) lines.push(`${topic}: ${narrative}`);
    else lines.push(narrative);

    // Best-effort deviation extraction. The d19a template's Sheet 5 has
    // seed topics like "Assumption challenge — which row in Sheet 2 do
    // you contest? (state row + your alternative)" — when the vendor
    // fills the narrative, we treat it as a deviation.
    if (topic && /assumption\s+challenge/i.test(topic)) {
      deviations.push({
        assumptionKey: extractAssumptionKey(narrative) ?? 'unspecified',
        proposedAlternative: narrative,
        severity: inferSeverity(narrative),
      });
    } else if (topic && /alternative\s+pricing\s+model/i.test(topic)) {
      deviations.push({
        assumptionKey: 'Pricing model',
        proposedAlternative: narrative,
        severity: inferSeverity(narrative),
      });
    } else if (topic && /(volume|term)\s+sensitivit/i.test(topic)) {
      deviations.push({
        assumptionKey: extractAssumptionKey(narrative) ?? 'Volume / term sensitivity',
        proposedAlternative: narrative,
        severity: 'low',
      });
    } else if (topic && /(inclusions|exclusions)/i.test(topic)) {
      deviations.push({
        assumptionKey: 'Scope inclusions / exclusions',
        proposedAlternative: narrative,
        severity: 'medium',
      });
    }
  });

  return {
    pricingNotes: lines.join('\n\n'),
    deviations,
  };
}

const ASSUMPTION_KEYWORDS: Array<[RegExp, string]> = [
  [/term\s+horizon/i, 'Term horizon'],
  [/escalator/i, 'Annual escalator'],
  [/fte\s+blended/i, 'FTE blended rate'],
  [/currency/i, 'Currency'],
  [/support\s+coverage|24[\s\D]*7/i, 'Support coverage'],
  [/sla\s+tier/i, 'SLA tier expectation'],
  [/pricing\s+model/i, 'Pricing model'],
  [/travel\s+(?:&|and)\s+expenses?|t&e/i, 'Travel & expenses'],
  [/annual\s+envelope/i, 'Indicative annual envelope'],
];

function extractAssumptionKey(text: string): string | null {
  for (const [re, key] of ASSUMPTION_KEYWORDS) {
    if (re.test(text)) return key;
  }
  return null;
}

const HIGH_SEVERITY_WORDS = /\b(must|cannot|reject|reject|deal[-\s]?breaker|won't|won't|unable|impossible|red[-\s]?line)\b/i;
const MEDIUM_SEVERITY_WORDS = /\b(strongly|propose|alternative|prefer|require|substantial)\b/i;

function inferSeverity(text: string): 'low' | 'medium' | 'high' {
  if (HIGH_SEVERITY_WORDS.test(text)) return 'high';
  if (MEDIUM_SEVERITY_WORDS.test(text)) return 'medium';
  return 'low';
}

function stringFromCell(v: ExcelJS.CellValue): string {
  if (v == null) return '';
  if (typeof v === 'string') {
    // ExcelJS's safeCell prefixes user-supplied strings with `'` to
    // disarm formula injection. Strip that on read.
    return v.startsWith("'") ? v.slice(1) : v;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    if ('text' in v && typeof v.text === 'string') return v.text;
    if ('richText' in v && Array.isArray(v.richText)) {
      return v.richText.map((r) => r.text).join('');
    }
    if ('result' in v && typeof v.result === 'string') return v.result;
    if ('result' in v && typeof v.result === 'number') return String(v.result);
  }
  return '';
}

function numberFromCell(v: ExcelJS.CellValue): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // Strip currency / commas.
    const cleaned = v.replace(/[^0-9.\-eE]/g, '');
    if (cleaned.length === 0) return null;
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === 'object') {
    if ('result' in v && typeof v.result === 'number') return v.result;
  }
  return null;
}
