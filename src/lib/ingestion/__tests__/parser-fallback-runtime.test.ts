import {
  runParserFallback,
  type ParserFallbackLedgerEvent,
  type ParserFallbackRuntimeRequest,
} from "../parser-fallback-runtime";

const baseRequest: ParserFallbackRuntimeRequest = {
  clientId: "client-alpha",
  artifactId: "artifact-123",
  filename: "supplier-profile.pdf",
  documentKind: "pdf",
  primaryParserId: "azure-document-intelligence",
  primaryOutcome: "garbled",
  sensitivity: "none_detected",
  dataClass: "confidential",
  malwareScan: "passed",
  templateState: "validated",
  operatorApprovedFallback: true,
  customerApprovedThirdPartyProcessing: true,
  content: new Uint8Array([1, 2, 3]),
};

function ledgerRecorder() {
  const events: ParserFallbackLedgerEvent[] = [];

  return {
    events,
    ledger: {
      write: jest.fn(async (event: ParserFallbackLedgerEvent) => {
        events.push(event);
      }),
    },
  };
}

describe("parser fallback runtime", () => {
  it("does not call fallback adapters when malware scan is not clear", async () => {
    const markerSelfHosted = jest.fn();
    const llamaParseThirdParty = jest.fn();
    const { events, ledger } = ledgerRecorder();

    const result = await runParserFallback(
      {
        ...baseRequest,
        malwareScan: "pending",
      },
      {
        markerSelfHosted,
        llamaParseThirdParty,
      },
      ledger,
    );

    expect(result).toMatchObject({
      status: "manual_review",
      commitAllowed: false,
      decision: {
        route: "manual-review",
        reason: "malware_scan_not_passed",
      },
    });
    expect(markerSelfHosted).not.toHaveBeenCalled();
    expect(llamaParseThirdParty).not.toHaveBeenCalled();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventType: "parser_fallback_decision",
      route: "manual-review",
      reason: "malware_scan_not_passed",
    });
  });

  it("uses only Marker for sensitive documents and keeps output uncommitted", async () => {
    const markerSelfHosted = jest.fn(async () => ({
      text: "Sensitive supplier summary",
    }));
    const llamaParseThirdParty = jest.fn();
    const { events, ledger } = ledgerRecorder();

    const result = await runParserFallback(
      {
        ...baseRequest,
        sensitivity: "suspected_sensitive",
      },
      {
        markerSelfHosted,
        llamaParseThirdParty,
      },
      ledger,
    );

    expect(result).toMatchObject({
      status: "parsed_pending_review",
      commitAllowed: false,
      parserResult: {
        text: "Sensitive supplier summary",
      },
      decision: {
        route: "marker-self-hosted",
        parserId: "marker-self-hosted",
      },
    });
    expect(markerSelfHosted).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-alpha",
        artifactId: "artifact-123",
        filename: "supplier-profile.pdf",
      }),
    );
    expect(llamaParseThirdParty).not.toHaveBeenCalled();
    expect(events.map((event) => event.eventType)).toEqual([
      "parser_fallback_decision",
      "parser_fallback_invocation",
      "parser_fallback_result",
    ]);
  });

  it("uses only LlamaParse for non-sensitive documents with customer consent", async () => {
    const markerSelfHosted = jest.fn();
    const llamaParseThirdParty = jest.fn(async () => ({
      text: "Third-party parsed evidence",
      metadata: {
        pageCount: 4,
      },
    }));
    const { events, ledger } = ledgerRecorder();

    const result = await runParserFallback(
      baseRequest,
      {
        markerSelfHosted,
        llamaParseThirdParty,
      },
      ledger,
    );

    expect(result).toMatchObject({
      status: "parsed_pending_review",
      commitAllowed: false,
      parserResult: {
        text: "Third-party parsed evidence",
      },
      decision: {
        route: "llamaparse-third-party",
        parserId: "llamaparse-third-party",
        requiresCustomerConsent: true,
      },
    });
    expect(markerSelfHosted).not.toHaveBeenCalled();
    expect(llamaParseThirdParty).toHaveBeenCalledTimes(1);
    expect(events[0]?.ledgerKey).toBe(
      "parser_fallback_decision:llamaparse-third-party:third_party_allowed_for_non_sensitive_document:llamaparse-third-party:commit_blocked_pending_review",
    );
  });

  it("fails closed when the required fallback adapter is unavailable", async () => {
    const { events, ledger } = ledgerRecorder();

    const result = await runParserFallback(
      {
        ...baseRequest,
        sensitivity: "confirmed_sensitive",
      },
      {
        llamaParseThirdParty: jest.fn(),
      },
      ledger,
    );

    expect(result).toMatchObject({
      status: "adapter_unavailable",
      commitAllowed: false,
      parserResult: null,
    });
    expect(events.map((event) => event.eventType)).toEqual([
      "parser_fallback_decision",
      "parser_fallback_failure",
    ]);
    expect(events.at(-1)).toMatchObject({
      reason: "adapter_unavailable",
      parserId: "marker-self-hosted",
    });
  });

  it("records parser failure and blocks commit when an adapter throws", async () => {
    const { events, ledger } = ledgerRecorder();

    const result = await runParserFallback(
      baseRequest,
      {
        llamaParseThirdParty: jest.fn(async () => {
          throw new Error("parser unavailable");
        }),
      },
      ledger,
    );

    expect(result).toMatchObject({
      status: "parser_failed",
      commitAllowed: false,
      parserResult: null,
    });
    expect(events.map((event) => event.eventType)).toEqual([
      "parser_fallback_decision",
      "parser_fallback_invocation",
      "parser_fallback_failure",
    ]);
    expect(events.at(-1)).toMatchObject({
      reason: "parser_failed",
      parserId: "llamaparse-third-party",
    });
  });
});
