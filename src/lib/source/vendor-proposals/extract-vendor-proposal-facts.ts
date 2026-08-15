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
  /^(price|rate|discount|sla|uptime|term|payment|warranty|support|penalty|scope|delivery model|support model|solution architecture|architecture|integration architecture|data architecture|ai architecture|automation|ai automation|accelerator|accelerators|asset|assets|staffing|location model|transition|governance|security|compliance|assumption|assumptions|exclusion|exclusions|exception|exceptions|evidence)\s*[:\-]\s*(.+)$/i;

const DOLLAR_AMOUNT_RE = /(?:USD|\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i;
const PERCENT_RE = /(\d{1,3}(?:\.\d{1,2})?)\s*%/;
const PAGE_PREFIX_RE =
  /^\s*(?:\[(?:p(?:age)?\.?\s*)?(\d{1,4})\]|p(?:age)?\.?\s*(\d{1,4})\s*[|:—-])\s*/i;

const LABEL_TO_FACT: Record<string, { factKey: string; sectionKey: string }> = {
  price: { factKey: "price", sectionKey: "pricing_structure" },
  rate: { factKey: "rate", sectionKey: "pricing_structure" },
  discount: { factKey: "discount", sectionKey: "commercial_model" },
  sla: { factKey: "sla", sectionKey: "sla_commitments" },
  uptime: { factKey: "uptime", sectionKey: "sla_commitments" },
  term: { factKey: "term", sectionKey: "commercial_model" },
  payment: { factKey: "payment", sectionKey: "commercial_model" },
  warranty: { factKey: "warranty", sectionKey: "risk_positions" },
  support: { factKey: "support", sectionKey: "service_tower_coverage" },
  penalty: { factKey: "penalty", sectionKey: "sla_commitments" },
  scope: { factKey: "scope_coverage", sectionKey: "scope_coverage" },
  "delivery model": {
    factKey: "delivery_model",
    sectionKey: "service_tower_coverage",
  },
  "support model": {
    factKey: "support_model",
    sectionKey: "service_tower_coverage",
  },
  "solution architecture": {
    factKey: "solution_architecture",
    sectionKey: "solution_architecture",
  },
  architecture: {
    factKey: "solution_architecture",
    sectionKey: "solution_architecture",
  },
  "integration architecture": {
    factKey: "integration_architecture",
    sectionKey: "solution_architecture",
  },
  "data architecture": {
    factKey: "data_architecture",
    sectionKey: "solution_architecture",
  },
  "ai architecture": {
    factKey: "ai_architecture",
    sectionKey: "solution_architecture",
  },
  automation: {
    factKey: "automation_productivity",
    sectionKey: "automation_productivity",
  },
  "ai automation": {
    factKey: "automation_productivity",
    sectionKey: "automation_productivity",
  },
  accelerator: {
    factKey: "accelerator",
    sectionKey: "innovation_value_add",
  },
  accelerators: {
    factKey: "accelerator",
    sectionKey: "innovation_value_add",
  },
  asset: {
    factKey: "reusable_asset",
    sectionKey: "innovation_value_add",
  },
  assets: {
    factKey: "reusable_asset",
    sectionKey: "innovation_value_add",
  },
  staffing: { factKey: "staffing_model", sectionKey: "staffing_model" },
  "location model": {
    factKey: "delivery_locations",
    sectionKey: "delivery_locations",
  },
  transition: {
    factKey: "transition_approach",
    sectionKey: "transition_approach",
  },
  governance: { factKey: "governance_model", sectionKey: "governance_model" },
  security: {
    factKey: "security_compliance",
    sectionKey: "security_compliance",
  },
  compliance: {
    factKey: "security_compliance",
    sectionKey: "security_compliance",
  },
  assumption: {
    factKey: "assumption",
    sectionKey: "assumptions_dependencies",
  },
  assumptions: {
    factKey: "assumption",
    sectionKey: "assumptions_dependencies",
  },
  exclusion: {
    factKey: "exclusion",
    sectionKey: "assumptions_dependencies",
  },
  exclusions: {
    factKey: "exclusion",
    sectionKey: "assumptions_dependencies",
  },
  exception: {
    factKey: "exception",
    sectionKey: "exceptions_redlines",
  },
  exceptions: {
    factKey: "exception",
    sectionKey: "exceptions_redlines",
  },
  evidence: { factKey: "evidence_reference", sectionKey: "evidence_quality" },
};

function stripMarkdownBullet(line: string): string {
  return line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "").trim();
}

function stripPagePrefix(line: string): {
  lineWithoutPage: string;
  page: string | null;
} {
  const match = line.match(PAGE_PREFIX_RE);
  if (!match) return { lineWithoutPage: line, page: null };
  const page = match[1] ?? match[2] ?? null;
  return {
    lineWithoutPage: line.slice(match[0].length).trim(),
    page: page ? `page ${page}` : null,
  };
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
    const bulletStripped = stripMarkdownBullet(rawLine);
    const { lineWithoutPage, page } = stripPagePrefix(bulletStripped);
    const line = lineWithoutPage;
    if (!line) return;
    const match = line.match(PROPOSAL_FACT_LABEL_RE);
    if (!match) return;

    const label = match[1].toLowerCase();
    const mapping = LABEL_TO_FACT[label] ?? {
      factKey: label.replace(/\s+/g, "_"),
      sectionKey: label.replace(/\s+/g, "_"),
    };
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
      factKey: mapping.factKey,
      sectionKey: options.sectionKey ?? mapping.sectionKey,
      pageOrLocation: page ? `${page}, line ${index + 1}` : `line ${index + 1}`,
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
