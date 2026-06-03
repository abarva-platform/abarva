import {
  decideParserFallback,
  describeParserFallbackDecision,
} from "../parser-fallback-policy";

const baseInput = {
  documentKind: "pdf" as const,
  primaryOutcome: "garbled" as const,
  sensitivity: "none_detected" as const,
  dataClass: "confidential" as const,
  malwareScan: "passed" as const,
  templateState: "validated" as const,
  operatorApprovedFallback: true,
  customerApprovedThirdPartyProcessing: true,
};

describe("parser fallback policy", () => {
  it("does not choose a fallback when the primary parser succeeds", () => {
    expect(
      decideParserFallback({
        ...baseInput,
        primaryOutcome: "success",
      }),
    ).toMatchObject({
      route: "none",
      allowed: false,
      reason: "primary_parser_succeeded",
      commitAllowed: true,
    });
  });

  it("blocks fallback parsing until malware scan passes", () => {
    expect(
      decideParserFallback({
        ...baseInput,
        malwareScan: "pending",
      }),
    ).toMatchObject({
      route: "manual-review",
      allowed: false,
      reason: "malware_scan_not_passed",
      commitAllowed: false,
    });
  });

  it("pauses for template mapping before trying fallback parsers", () => {
    const result = decideParserFallback({
      ...baseInput,
      templateState: "needs_mapping",
    });

    expect(result).toMatchObject({
      route: "manual-review",
      reason: "template_mapping_required",
      requiresHumanApproval: true,
      commitAllowed: false,
    });
    expect(describeParserFallbackDecision(result)).toContain(
      "maps or validates the template metadata",
    );
  });

  it("requires operator approval before any fallback parser", () => {
    expect(
      decideParserFallback({
        ...baseInput,
        operatorApprovedFallback: false,
      }),
    ).toMatchObject({
      route: "manual-review",
      reason: "operator_approval_required",
      parserId: null,
      commitAllowed: false,
    });
  });

  it("uses Marker for sensitive or restricted documents", () => {
    expect(
      decideParserFallback({
        ...baseInput,
        sensitivity: "suspected_sensitive",
        customerApprovedThirdPartyProcessing: true,
      }),
    ).toMatchObject({
      route: "marker-self-hosted",
      allowed: true,
      parserId: "marker-self-hosted",
      reason: "sensitive_or_restricted_data_requires_private_parser",
      requiresCustomerConsent: false,
      commitAllowed: false,
    });
  });

  it("uses Marker when third-party processing has not been approved", () => {
    expect(
      decideParserFallback({
        ...baseInput,
        customerApprovedThirdPartyProcessing: false,
      }),
    ).toMatchObject({
      route: "marker-self-hosted",
      allowed: true,
      reason: "third_party_consent_required",
      requiresCustomerConsent: true,
      commitAllowed: false,
    });
  });

  it("allows LlamaParse only for non-sensitive documents with explicit consent", () => {
    const result = decideParserFallback(baseInput);

    expect(result).toMatchObject({
      route: "llamaparse-third-party",
      allowed: true,
      parserId: "llamaparse-third-party",
      reason: "third_party_allowed_for_non_sensitive_document",
      requiresHumanApproval: true,
      requiresCustomerConsent: true,
      commitAllowed: false,
    });
    expect(result.ledgerEvent).toBe(
      "parser_fallback_decision:llamaparse-third-party:third_party_allowed_for_non_sensitive_document:llamaparse-third-party:commit_blocked_pending_review",
    );
  });
});
