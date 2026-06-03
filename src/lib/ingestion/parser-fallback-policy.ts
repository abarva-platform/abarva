export type ParserFallbackDocumentKind =
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "text"
  | "image"
  | "unknown";

export type ParserFallbackOutcome =
  | "success"
  | "failed"
  | "garbled"
  | "low_confidence"
  | "unsupported_layout";

export type ParserFallbackSensitivity =
  | "none_detected"
  | "unknown"
  | "suspected_sensitive"
  | "confirmed_sensitive";

export type ParserFallbackDataClass =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "regulated";

export type ParserFallbackScanState =
  | "passed"
  | "pending"
  | "failed"
  | "not_required";

export type ParserFallbackTemplateState =
  | "validated"
  | "needs_mapping"
  | "missing"
  | "not_required";

export type ParserFallbackRoute =
  | "none"
  | "manual-review"
  | "marker-self-hosted"
  | "llamaparse-third-party";

export interface ParserFallbackDecisionInput {
  documentKind: ParserFallbackDocumentKind;
  primaryOutcome: ParserFallbackOutcome;
  sensitivity: ParserFallbackSensitivity;
  dataClass: ParserFallbackDataClass;
  malwareScan: ParserFallbackScanState;
  templateState: ParserFallbackTemplateState;
  operatorApprovedFallback: boolean;
  customerApprovedThirdPartyProcessing: boolean;
}

export interface ParserFallbackDecision {
  route: ParserFallbackRoute;
  allowed: boolean;
  reason:
    | "primary_parser_succeeded"
    | "unsupported_document_kind"
    | "malware_scan_not_passed"
    | "template_mapping_required"
    | "operator_approval_required"
    | "sensitive_or_restricted_data_requires_private_parser"
    | "third_party_consent_required"
    | "third_party_allowed_for_non_sensitive_document";
  parserId: "marker-self-hosted" | "llamaparse-third-party" | null;
  requiresHumanApproval: boolean;
  requiresCustomerConsent: boolean;
  commitAllowed: boolean;
  ledgerEvent: string;
}

const FALLBACK_ELIGIBLE_DOCUMENT_KINDS = new Set<ParserFallbackDocumentKind>([
  "pdf",
  "docx",
  "xlsx",
  "image",
]);

export function decideParserFallback(
  input: ParserFallbackDecisionInput,
): ParserFallbackDecision {
  if (input.primaryOutcome === "success") {
    return decision({
      route: "none",
      allowed: false,
      reason: "primary_parser_succeeded",
      parserId: null,
      requiresHumanApproval: false,
      requiresCustomerConsent: false,
      commitAllowed: true,
    });
  }

  if (!FALLBACK_ELIGIBLE_DOCUMENT_KINDS.has(input.documentKind)) {
    return manualReview("unsupported_document_kind", false);
  }

  if (input.malwareScan !== "passed" && input.malwareScan !== "not_required") {
    return manualReview("malware_scan_not_passed", true);
  }

  if (
    input.templateState === "needs_mapping" ||
    input.templateState === "missing"
  ) {
    return manualReview("template_mapping_required", true);
  }

  if (!input.operatorApprovedFallback) {
    return manualReview("operator_approval_required", true);
  }

  if (requiresPrivateFallback(input)) {
    return decision({
      route: "marker-self-hosted",
      allowed: true,
      reason: "sensitive_or_restricted_data_requires_private_parser",
      parserId: "marker-self-hosted",
      requiresHumanApproval: true,
      requiresCustomerConsent: false,
      commitAllowed: false,
    });
  }

  if (!input.customerApprovedThirdPartyProcessing) {
    return decision({
      route: "marker-self-hosted",
      allowed: true,
      reason: "third_party_consent_required",
      parserId: "marker-self-hosted",
      requiresHumanApproval: true,
      requiresCustomerConsent: true,
      commitAllowed: false,
    });
  }

  return decision({
    route: "llamaparse-third-party",
    allowed: true,
    reason: "third_party_allowed_for_non_sensitive_document",
    parserId: "llamaparse-third-party",
    requiresHumanApproval: true,
    requiresCustomerConsent: true,
    commitAllowed: false,
  });
}

export function describeParserFallbackDecision(
  decisionResult: ParserFallbackDecision,
): string {
  switch (decisionResult.reason) {
    case "primary_parser_succeeded":
      return "No fallback parser is needed because the primary parser succeeded.";
    case "unsupported_document_kind":
      return "Send to manual review because this file type is not eligible for fallback parser automation.";
    case "malware_scan_not_passed":
      return "Keep the file out of fallback parsing until malware scan state is passed or not required.";
    case "template_mapping_required":
      return "Pause fallback parsing until an operator maps or validates the template metadata.";
    case "operator_approval_required":
      return "Require explicit operator approval before using any fallback parser.";
    case "sensitive_or_restricted_data_requires_private_parser":
      return "Use only the private self-hosted Marker fallback because sensitivity or data-class policy blocks third-party processing.";
    case "third_party_consent_required":
      return "Use the private self-hosted Marker fallback unless the customer gives explicit third-party processing consent.";
    case "third_party_allowed_for_non_sensitive_document":
      return "LlamaParse may be used only for this non-sensitive document after explicit operator approval and customer third-party consent.";
  }
}

function requiresPrivateFallback(input: ParserFallbackDecisionInput): boolean {
  return (
    input.sensitivity === "unknown" ||
    input.sensitivity === "suspected_sensitive" ||
    input.sensitivity === "confirmed_sensitive" ||
    input.dataClass === "restricted" ||
    input.dataClass === "regulated"
  );
}

function manualReview(
  reason: ParserFallbackDecision["reason"],
  requiresHumanApproval: boolean,
): ParserFallbackDecision {
  return decision({
    route: "manual-review",
    allowed: false,
    reason,
    parserId: null,
    requiresHumanApproval,
    requiresCustomerConsent: false,
    commitAllowed: false,
  });
}

function decision(args: Omit<ParserFallbackDecision, "ledgerEvent">) {
  return {
    ...args,
    ledgerEvent: [
      "parser_fallback_decision",
      args.route,
      args.reason,
      args.parserId ?? "none",
      args.commitAllowed ? "commit_allowed" : "commit_blocked_pending_review",
    ].join(":"),
  };
}
