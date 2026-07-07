import {
  decideParserFallback,
  type ParserFallbackDataClass,
  type ParserFallbackDecision,
  type ParserFallbackDocumentKind,
  type ParserFallbackOutcome,
  type ParserFallbackScanState,
  type ParserFallbackSensitivity,
  type ParserFallbackTemplateState,
} from "./parser-fallback-policy";

export interface ParserFallbackRuntimeRequest {
  clientId: string;
  artifactId: string;
  filename: string;
  documentKind: ParserFallbackDocumentKind;
  primaryParserId: string;
  primaryOutcome: ParserFallbackOutcome;
  sensitivity: ParserFallbackSensitivity;
  dataClass: ParserFallbackDataClass;
  malwareScan: ParserFallbackScanState;
  templateState: ParserFallbackTemplateState;
  operatorApprovedFallback: boolean;
  customerApprovedThirdPartyProcessing: boolean;
  content: Uint8Array;
}

export interface ParserFallbackParseResult {
  text: string;
  markdown?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ParserFallbackAdapterInput {
  clientId: string;
  artifactId: string;
  filename: string;
  documentKind: ParserFallbackDocumentKind;
  content: Uint8Array;
}

export interface ParserFallbackRuntimeAdapters {
  markerSelfHosted?: (
    input: ParserFallbackAdapterInput,
  ) => Promise<ParserFallbackParseResult>;
  llamaParseThirdParty?: (
    input: ParserFallbackAdapterInput,
  ) => Promise<ParserFallbackParseResult>;
}

export interface ParserFallbackLedgerEvent {
  eventType:
    | "parser_fallback_decision"
    | "parser_fallback_invocation"
    | "parser_fallback_result"
    | "parser_fallback_failure";
  clientId: string;
  artifactId: string;
  parserId: ParserFallbackDecision["parserId"];
  route: ParserFallbackDecision["route"];
  reason:
    | ParserFallbackDecision["reason"]
    | "adapter_unavailable"
    | "parser_failed";
  ledgerKey: string;
  commitAllowed: boolean;
  customerApprovedThirdPartyProcessing: boolean;
  primaryParserId: string;
  primaryOutcome: ParserFallbackOutcome;
}

export interface ParserFallbackLedgerWriter {
  write(event: ParserFallbackLedgerEvent): Promise<void>;
}

export type ParserFallbackRuntimeStatus =
  | "not_needed"
  | "manual_review"
  | "parsed_pending_review"
  | "adapter_unavailable"
  | "parser_failed";

export interface ParserFallbackRuntimeResult {
  status: ParserFallbackRuntimeStatus;
  decision: ParserFallbackDecision;
  parserResult: ParserFallbackParseResult | null;
  commitAllowed: boolean;
}

export async function runParserFallback(
  request: ParserFallbackRuntimeRequest,
  adapters: ParserFallbackRuntimeAdapters,
  ledger: ParserFallbackLedgerWriter,
): Promise<ParserFallbackRuntimeResult> {
  const decision = decideParserFallback(request);

  await ledger.write(
    toLedgerEvent(request, decision, "parser_fallback_decision"),
  );

  if (decision.route === "none") {
    return {
      status: "not_needed",
      decision,
      parserResult: null,
      commitAllowed: decision.commitAllowed,
    };
  }

  if (!decision.allowed || !decision.parserId) {
    return {
      status: "manual_review",
      decision,
      parserResult: null,
      commitAllowed: false,
    };
  }

  const adapter = selectAdapter(decision.parserId, adapters);

  if (!adapter) {
    await ledger.write(
      toLedgerEvent(request, decision, "parser_fallback_failure", {
        reason: "adapter_unavailable",
      }),
    );

    return {
      status: "adapter_unavailable",
      decision,
      parserResult: null,
      commitAllowed: false,
    };
  }

  await ledger.write(
    toLedgerEvent(request, decision, "parser_fallback_invocation"),
  );

  try {
    const parserResult = await adapter({
      clientId: request.clientId,
      artifactId: request.artifactId,
      filename: request.filename,
      documentKind: request.documentKind,
      content: request.content,
    });

    await ledger.write(
      toLedgerEvent(request, decision, "parser_fallback_result"),
    );

    return {
      status: "parsed_pending_review",
      decision,
      parserResult,
      commitAllowed: false,
    };
  } catch {
    await ledger.write(
      toLedgerEvent(request, decision, "parser_fallback_failure", {
        reason: "parser_failed",
      }),
    );

    return {
      status: "parser_failed",
      decision,
      parserResult: null,
      commitAllowed: false,
    };
  }
}

function selectAdapter(
  parserId: NonNullable<ParserFallbackDecision["parserId"]>,
  adapters: ParserFallbackRuntimeAdapters,
) {
  if (parserId === "marker-self-hosted") {
    return adapters.markerSelfHosted;
  }

  return adapters.llamaParseThirdParty;
}

function toLedgerEvent(
  request: ParserFallbackRuntimeRequest,
  decision: ParserFallbackDecision,
  eventType: ParserFallbackLedgerEvent["eventType"],
  overrides: Partial<
    Pick<ParserFallbackLedgerEvent, "reason" | "ledgerKey">
  > = {},
): ParserFallbackLedgerEvent {
  const reason = overrides.reason ?? decision.reason;
  const ledgerKey =
    overrides.ledgerKey ??
    [
      eventType,
      decision.route,
      reason,
      decision.parserId ?? "none",
      decision.commitAllowed
        ? "commit_allowed"
        : "commit_blocked_pending_review",
    ].join(":");

  return {
    eventType,
    clientId: request.clientId,
    artifactId: request.artifactId,
    parserId: decision.parserId,
    route: decision.route,
    reason,
    ledgerKey,
    commitAllowed: decision.commitAllowed,
    customerApprovedThirdPartyProcessing:
      request.customerApprovedThirdPartyProcessing,
    primaryParserId: request.primaryParserId,
    primaryOutcome: request.primaryOutcome,
  };
}
