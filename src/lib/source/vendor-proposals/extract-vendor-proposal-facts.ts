// Minimal, honest extractor for candidate VendorProposalFacts from a vendor
// proposal document's already-extracted text (the output of
// extractSourceUploadText — this module never touches a Buffer or mime type
// directly). Deliberately narrow: a small allowlist of commercial-proposal
// labels, mirroring the existing labeled-line convention in
// artifact-registry/text-parser.ts, not a general-purpose NLP extractor.
//
// Confidence is derived from HOW the candidate was captured
// (extractionMethod), not a free-floating per-row literal — see the
// migration header for why this differs from the legacy parser's five
// hardcoded confidence constants.

import type {
  VendorProposalFactConfidence,
  VendorProposalFactExtractionMethod,
} from "./types";

export interface ExtractedVendorProposalFactCandidate {
  factKey: string;
  sectionKey: string | null;
  pageOrLocation: string | null;
  valueNumeric: number | null;
  valueText: string | null;
  unit: string | null;
  currency: string | null;
  sourceQuote: string;
  confidence: VendorProposalFactConfidence;
  extractionMethod: VendorProposalFactExtractionMethod;
}

const PROPOSAL_FACT_LABEL_RE =
  /^(price|rate|discount|sla|uptime|term|payment|warranty|support|penalty)\s*[:\-]\s*(.+)$/i;

const DOLLAR_AMOUNT_RE = /(?:USD|\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i;
const PERCENT_RE = /(\d{1,3}(?:\.\d{1,2})?)\s*%/;

function stripMarkdownBullet(line: string): string {
  return line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").trim();
}

function confidenceForMethod(
  method: VendorProposalFactExtractionMethod,
): VendorProposalFactConfidence {
  // Structure implies reliability: a table cell is a more reliable capture
  // than a free-text line match; manual entry is a human transcription.
  switch (method) {
    case "parsed_xlsx_cell":
      return "med";
    case "manual_entry":
      return "high";
    case "parsed_pdf_table":
      return "med";
    case "parsed_text":
      return "low";
  }
}

/**
 * Extract candidate facts from proposal text. Never throws — malformed,
 * empty, or garbled text simply yields zero candidates. `extractionMethod`
 * lets a caller mark text pulled from a structured source (e.g. an xlsx
 * cell) as more reliable than a free-text line match; defaults to
 * 'parsed_text'.
 */
export function extractVendorProposalFacts(
  text: string | null | undefined,
  options: {
    extractionMethod?: VendorProposalFactExtractionMethod;
    sectionKey?: string | null;
  } = {},
): ExtractedVendorProposalFactCandidate[] {
  if (!text) return [];
  const extractionMethod = options.extractionMethod ?? "parsed_text";
  const confidence = confidenceForMethod(extractionMethod);
  const candidates: ExtractedVendorProposalFactCandidate[] = [];

  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  lines.forEach((rawLine, index) => {
    const line = stripMarkdownBullet(rawLine);
    if (!line) return;
    const match = line.match(PROPOSAL_FACT_LABEL_RE);
    if (!match) return;

    const factKey = match[1].toLowerCase();
    const body = match[2].trim();
    if (!body) return;

    const dollarMatch = body.match(DOLLAR_AMOUNT_RE);
    const percentMatch = body.match(PERCENT_RE);

    let valueNumeric: number | null = null;
    let valueText: string | null = null;
    let unit: string | null = null;
    let currency: string | null = null;

    if (dollarMatch) {
      const parsed = Number(dollarMatch[1].replace(/,/g, ""));
      if (Number.isFinite(parsed)) {
        valueNumeric = parsed;
        currency = "USD";
        unit = /hour|hr\b/i.test(body)
          ? "hour"
          : /month/i.test(body)
            ? "month"
            : /year|annual/i.test(body)
              ? "year"
              : null;
      }
    } else if (percentMatch) {
      const parsed = Number(percentMatch[1]);
      if (Number.isFinite(parsed)) {
        valueNumeric = parsed;
        unit = "percent";
      }
    }

    if (valueNumeric === null) {
      valueText = body;
    }

    candidates.push({
      factKey,
      sectionKey: options.sectionKey ?? null,
      pageOrLocation: `line ${index + 1}`,
      valueNumeric,
      valueText,
      unit,
      currency,
      sourceQuote: line,
      confidence,
      extractionMethod,
    });
  });

  return candidates;
}
