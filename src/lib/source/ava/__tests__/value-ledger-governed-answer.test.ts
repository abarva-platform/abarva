import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import {
  buildValueLedgerGovernedAnswer,
  governedCandidateFromValueLedgerEntry,
  looksLikeValueLedgerQuestion,
  valueConfidenceToConfidenceLevel,
} from "@/lib/source/ava/value-ledger-governed-answer";
import {
  readCommittedValueLevers,
  readRealizedValueLevers,
} from "@/lib/source/facts/event-facts-reader";
import type { ValueLedgerEntry } from "@/lib/source/types";

jest.mock("@/lib/source/facts/event-facts-reader", () => ({
  readCommittedValueLevers: jest.fn(),
  readRealizedValueLevers: jest.fn(),
}));

const mockReadCommittedValueLevers = jest.mocked(readCommittedValueLevers);
const mockReadRealizedValueLevers = jest.mocked(readRealizedValueLevers);

function ledgerEntry(
  overrides: Partial<ValueLedgerEntry> = {},
): ValueLedgerEntry {
  return {
    id: "ledger-1",
    eventId: "event-1",
    eventName: "Apex AMS Sourcing",
    kind: "projected",
    label: "Run-rate sourcing target",
    stageKey: "pricing",
    amountUsd: 2_500_000,
    confidence: "high",
    evidenceCount: 2,
    note: "Accepted pricing workbook and BAFO delta.",
    ...overrides,
  };
}

const NO_SIGNAL = {
  signalPresent: false,
  committedByLeverKey: new Map<string, number>(),
};
const NO_REALIZED_SIGNAL = {
  signalPresent: false,
  realizedByLeverKey: new Map<string, number>(),
};

describe("looksLikeValueLedgerQuestion", () => {
  it("matches value-ledger and value-waterfall questions", () => {
    expect(looksLikeValueLedgerQuestion("Show the value waterfall.")).toBe(
      true,
    );
    expect(
      looksLikeValueLedgerQuestion("What savings are projected vs realized?"),
    ).toBe(true);
    expect(looksLikeValueLedgerQuestion("How much value is at stake?")).toBe(
      true,
    );
  });

  it("does not capture unrelated Source chat questions", () => {
    expect(looksLikeValueLedgerQuestion(undefined)).toBe(false);
    expect(looksLikeValueLedgerQuestion("")).toBe(false);
    expect(
      looksLikeValueLedgerQuestion("Which vendors dodged the response?"),
    ).toBe(false);
    expect(
      looksLikeValueLedgerQuestion("Are the client final files ready?"),
    ).toBe(false);
    expect(
      looksLikeValueLedgerQuestion(
        "Which uploaded evidence is parsed, search-ready, parser-ready, graph-projected, or blocked?",
      ),
    ).toBe(false);
  });
});

describe("valueConfidenceToConfidenceLevel", () => {
  it("maps every ValueConfidence explicitly", () => {
    expect(valueConfidenceToConfidenceLevel("high")).toBe("high");
    expect(valueConfidenceToConfidenceLevel("medium")).toBe("medium");
    expect(valueConfidenceToConfidenceLevel("low")).toBe("low");
  });
});

describe("governedCandidateFromValueLedgerEntry", () => {
  it("maps a ledger row to an honest governed financial candidate", () => {
    const candidate = governedCandidateFromValueLedgerEntry(ledgerEntry(), {
      clientKey: "apex-retail",
      tenantId: "tenant-1",
    });

    expect(candidate.source_layer).toBe("financial");
    expect(candidate.source_basis).toBe(
      "Accepted pricing workbook and BAFO delta.",
    );
    expect(candidate.classification).toBe("confidential");
    expect(candidate.retrievability).toBe("committed_not_indexed");
    expect(candidate.agent_readiness_status).toBe("committed_not_indexed");
    expect(candidate.confidence_level).toBe("high");
    expect(candidate.cited_render_verified_at).toBeNull();
    expect(candidate.citations?.[0]).toContain("Run-rate sourcing target");
  });

  it("stays usable for diagnostics when not agent_ready is explicitly allowed", () => {
    const candidate = governedCandidateFromValueLedgerEntry(ledgerEntry(), {
      clientKey: "apex-retail",
      tenantId: "tenant-1",
    });

    const bundle = buildValidatedAgentContextBundle([candidate], {
      requireAgentReady: false,
    });

    expect(bundle.decision).not.toBe("block");
    expect(bundle.usable).toHaveLength(1);
    expect(bundle.agentReadyCount).toBe(0);
  });
});

describe("buildValueLedgerGovernedAnswer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("reads real committed/realized value facts and emits a governed waterfall chart and table", async () => {
    mockReadCommittedValueLevers.mockResolvedValue({
      signalPresent: true,
      committedByLeverKey: new Map([
        ["AMS.VOLUME_BAND_PRICING", 2_500_000],
        ["AMS.PRODUCTIVITY_CREDITS", 800_000],
      ]),
    });
    mockReadRealizedValueLevers.mockResolvedValue(NO_REALIZED_SIGNAL);

    const answer = await buildValueLedgerGovernedAnswer({
      eventId: "event-1",
      eventName: "Apex AMS Sourcing",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "Show the value waterfall for this event.",
    });

    expect(readCommittedValueLevers).toHaveBeenCalledWith({
      eventId: "event-1",
      clientKey: "apexretail",
    });
    expect(readRealizedValueLevers).toHaveBeenCalledWith({
      eventId: "event-1",
      clientKey: "apexretail",
    });
    expect(answer).not.toBeNull();
    expect(answer!.tenantKey).toBe("apex-retail");
    expect(answer!.intent).toBe("value_ledger_waterfall");
    expect(answer!.status).toBe("answered");
    expect(answer!.artifacts.map((artifact) => artifact.artifact)).toEqual([
      "chart",
      "table",
    ]);
    expect(answer!.artifacts[0]).toMatchObject({
      artifact: "chart",
      kind: "waterfall",
      title: "Source value waterfall",
    });
    expect(answer!.directAnswer).toContain(
      "Apex AMS Sourcing carries $3.3M of projected Source value",
    );
    expect(answer!.directAnswer).toContain("No realized value is registered");
    expect(answer!.directAnswer).not.toMatch(/realized savings/i);
    expect(answer!.citations).toHaveLength(2);
    expect(
      answer!.citations.map((citation) => citation.recordId).sort(),
    ).toEqual(
      [
        "committed:event-1:AMS.PRODUCTIVITY_CREDITS",
        "committed:event-1:AMS.VOLUME_BAND_PRICING",
      ].sort(),
    );
    expect(answer!.safety.tenantFencePassed).toBe(true);
  });

  it("separates a realized value fact into its own band, never collapsed into projected", async () => {
    mockReadCommittedValueLevers.mockResolvedValue({
      signalPresent: true,
      committedByLeverKey: new Map([["AMS.RETAINED_COST", 1_000_000]]),
    });
    mockReadRealizedValueLevers.mockResolvedValue({
      signalPresent: true,
      realizedByLeverKey: new Map([["AMS.RETAINED_COST", 250_000]]),
    });

    const answer = await buildValueLedgerGovernedAnswer({
      eventId: "event-1",
      eventName: "Apex AMS Sourcing",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "What value is at stake?",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("answered");
    expect(answer!.directAnswer).toContain("$250K is registered as realized");
    expect(answer!.citations).toHaveLength(2);
  });

  it("returns an honest no-data packet when the event has no ledger facts", async () => {
    mockReadCommittedValueLevers.mockResolvedValue(NO_SIGNAL);
    mockReadRealizedValueLevers.mockResolvedValue(NO_REALIZED_SIGNAL);

    const answer = await buildValueLedgerGovernedAnswer({
      eventId: "missing-event",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "Show the value waterfall.",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("no_data");
    expect(answer!.citations).toHaveLength(0);
    expect(answer!.gaps[0]?.id).toBe("source-value-ledger-event-rows-missing");
    expect(answer!.directAnswer).toContain(
      "No event-scoped Source value ledger rows",
    );
  });

  it("returns null for a client key that cannot be governed", async () => {
    const answer = await buildValueLedgerGovernedAnswer({
      eventId: "event-1",
      clientKey: "not-a-real-tenant",
      tenantId: null,
      question: "Show the value waterfall.",
    });

    expect(answer).toBeNull();
    expect(readCommittedValueLevers).not.toHaveBeenCalled();
  });
});
