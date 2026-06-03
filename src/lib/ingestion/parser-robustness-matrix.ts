import {
  decideParserFallback,
  type ParserFallbackDecision,
  type ParserFallbackScanState,
} from "./parser-fallback-policy";

export type ParserRobustnessCaseId =
  | "corrupted_pdf"
  | "encrypted_pdf"
  | "oversized_pdf"
  | "scanned_only_pdf"
  | "multilingual_pdf"
  | "executable_wrapped_pdf";

export type ParserRobustnessAction =
  | "reject"
  | "quarantine"
  | "manual_review"
  | "private_ocr"
  | "private_fallback"
  | "primary_parser";

export type ParserRobustnessReason =
  | "pdf_structure_invalid"
  | "password_required"
  | "document_too_large"
  | "ocr_required"
  | "language_review_required"
  | "malware_or_disguised_executable"
  | "primary_parser_allowed";

export interface ParserRobustnessDocument {
  caseId: ParserRobustnessCaseId;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  structuralIntegrity: "valid" | "corrupted";
  encrypted: boolean;
  hasExtractableText: boolean;
  scannedOnly: boolean;
  languages: string[];
  malwareScan: ParserFallbackScanState;
  embeddedExecutableDetected: boolean;
  operatorApprovedFallback: boolean;
  customerApprovedThirdPartyProcessing: boolean;
}

export interface ParserRobustnessDecision {
  caseId: ParserRobustnessCaseId;
  action: ParserRobustnessAction;
  reason: ParserRobustnessReason;
  commitAllowed: boolean;
  fallbackDecision: ParserFallbackDecision | null;
  operatorMessage: string;
  ledgerEvent: string;
}

export const PARSER_ROBUSTNESS_LIMITS = {
  maxPdfPages: 500,
  maxPdfBytes: 100 * 1024 * 1024,
  supportedLanguageReviewSet: new Set(["en", "es", "fr"]),
} as const;

export const PARSER_ROBUSTNESS_FIXTURES: readonly ParserRobustnessDocument[] = [
  {
    caseId: "corrupted_pdf",
    fileName: "corrupted-contract.pdf",
    mimeType: "application/pdf",
    sizeBytes: 240_000,
    pageCount: null,
    structuralIntegrity: "corrupted",
    encrypted: false,
    hasExtractableText: false,
    scannedOnly: false,
    languages: ["en"],
    malwareScan: "passed",
    embeddedExecutableDetected: false,
    operatorApprovedFallback: true,
    customerApprovedThirdPartyProcessing: false,
  },
  {
    caseId: "encrypted_pdf",
    fileName: "locked-board-pack.pdf",
    mimeType: "application/pdf",
    sizeBytes: 780_000,
    pageCount: 18,
    structuralIntegrity: "valid",
    encrypted: true,
    hasExtractableText: false,
    scannedOnly: false,
    languages: ["en"],
    malwareScan: "passed",
    embeddedExecutableDetected: false,
    operatorApprovedFallback: true,
    customerApprovedThirdPartyProcessing: false,
  },
  {
    caseId: "oversized_pdf",
    fileName: "thousand-page-export.pdf",
    mimeType: "application/pdf",
    sizeBytes: 82_000_000,
    pageCount: 1_000,
    structuralIntegrity: "valid",
    encrypted: false,
    hasExtractableText: true,
    scannedOnly: false,
    languages: ["en"],
    malwareScan: "passed",
    embeddedExecutableDetected: false,
    operatorApprovedFallback: true,
    customerApprovedThirdPartyProcessing: false,
  },
  {
    caseId: "scanned_only_pdf",
    fileName: "scanned-invoice-bundle.pdf",
    mimeType: "application/pdf",
    sizeBytes: 12_400_000,
    pageCount: 42,
    structuralIntegrity: "valid",
    encrypted: false,
    hasExtractableText: false,
    scannedOnly: true,
    languages: ["en"],
    malwareScan: "passed",
    embeddedExecutableDetected: false,
    operatorApprovedFallback: true,
    customerApprovedThirdPartyProcessing: false,
  },
  {
    caseId: "multilingual_pdf",
    fileName: "global-renewal-pack.pdf",
    mimeType: "application/pdf",
    sizeBytes: 4_500_000,
    pageCount: 76,
    structuralIntegrity: "valid",
    encrypted: false,
    hasExtractableText: true,
    scannedOnly: false,
    languages: ["en", "ja", "de"],
    malwareScan: "passed",
    embeddedExecutableDetected: false,
    operatorApprovedFallback: true,
    customerApprovedThirdPartyProcessing: false,
  },
  {
    caseId: "executable_wrapped_pdf",
    fileName: "pricing-model.pdf",
    mimeType: "application/pdf",
    sizeBytes: 980_000,
    pageCount: 4,
    structuralIntegrity: "valid",
    encrypted: false,
    hasExtractableText: true,
    scannedOnly: false,
    languages: ["en"],
    malwareScan: "failed",
    embeddedExecutableDetected: true,
    operatorApprovedFallback: true,
    customerApprovedThirdPartyProcessing: false,
  },
] as const;

export function decideParserRobustness(
  input: ParserRobustnessDocument,
): ParserRobustnessDecision {
  if (input.embeddedExecutableDetected || input.malwareScan === "failed") {
    return decision(input, {
      action: "quarantine",
      reason: "malware_or_disguised_executable",
      commitAllowed: false,
      fallbackDecision: null,
      operatorMessage:
        "Quarantine before parsing because malware scan or wrapper inspection indicates executable content.",
    });
  }

  if (input.structuralIntegrity === "corrupted") {
    return decision(input, {
      action: "manual_review",
      reason: "pdf_structure_invalid",
      commitAllowed: false,
      fallbackDecision: fallback(input, "unsupported_layout"),
      operatorMessage:
        "Reject automated parsing and ask an operator for a clean source file or manual evidence extraction.",
    });
  }

  if (input.encrypted) {
    return decision(input, {
      action: "manual_review",
      reason: "password_required",
      commitAllowed: false,
      fallbackDecision: null,
      operatorMessage:
        "Pause processing until the client supplies the password or an unlocked replacement through the governed upload flow.",
    });
  }

  if (
    input.pageCount !== null &&
    input.pageCount > PARSER_ROBUSTNESS_LIMITS.maxPdfPages
  ) {
    return decision(input, {
      action: "manual_review",
      reason: "document_too_large",
      commitAllowed: false,
      fallbackDecision: fallback(input, "unsupported_layout"),
      operatorMessage:
        "Split or batch the document before parsing so queue fairness, cost limits, and review quality remain controlled.",
    });
  }

  if (input.sizeBytes > PARSER_ROBUSTNESS_LIMITS.maxPdfBytes) {
    return decision(input, {
      action: "manual_review",
      reason: "document_too_large",
      commitAllowed: false,
      fallbackDecision: fallback(input, "unsupported_layout"),
      operatorMessage:
        "Reject automated parsing until the file is compressed, split, or approved for a special processing run.",
    });
  }

  if (input.scannedOnly || !input.hasExtractableText) {
    return decision(input, {
      action: "private_ocr",
      reason: "ocr_required",
      commitAllowed: false,
      fallbackDecision: fallback(input, "low_confidence"),
      operatorMessage:
        "Use private OCR or private self-hosted fallback first; do not commit parsed facts until OCR confidence and source locators are reviewed.",
    });
  }

  if (requiresLanguageReview(input.languages)) {
    return decision(input, {
      action: "private_fallback",
      reason: "language_review_required",
      commitAllowed: false,
      fallbackDecision: fallback(input, "low_confidence"),
      operatorMessage:
        "Route through private fallback and require language-aware review before facts are approved.",
    });
  }

  return decision(input, {
    action: "primary_parser",
    reason: "primary_parser_allowed",
    commitAllowed: true,
    fallbackDecision: null,
    operatorMessage:
      "Primary parser may proceed under the standard upload controls.",
  });
}

export function runParserRobustnessMatrix(
  fixtures: readonly ParserRobustnessDocument[] = PARSER_ROBUSTNESS_FIXTURES,
): readonly ParserRobustnessDecision[] {
  return fixtures.map(decideParserRobustness);
}

function fallback(
  input: ParserRobustnessDocument,
  primaryOutcome:
    | "failed"
    | "garbled"
    | "low_confidence"
    | "unsupported_layout",
): ParserFallbackDecision {
  return decideParserFallback({
    documentKind: "pdf",
    primaryOutcome,
    sensitivity: "unknown",
    dataClass: "confidential",
    malwareScan: input.malwareScan,
    templateState: "validated",
    operatorApprovedFallback: input.operatorApprovedFallback,
    customerApprovedThirdPartyProcessing:
      input.customerApprovedThirdPartyProcessing,
  });
}

function requiresLanguageReview(languages: readonly string[]): boolean {
  return languages.some(
    (language) =>
      !PARSER_ROBUSTNESS_LIMITS.supportedLanguageReviewSet.has(language),
  );
}

function decision(
  input: ParserRobustnessDocument,
  args: Omit<ParserRobustnessDecision, "caseId" | "ledgerEvent">,
): ParserRobustnessDecision {
  return {
    caseId: input.caseId,
    ...args,
    ledgerEvent: [
      "parser_robustness_decision",
      input.caseId,
      args.action,
      args.reason,
      args.commitAllowed ? "commit_allowed" : "commit_blocked",
    ].join(":"),
  };
}
