import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import {
  buildValueLedgerGovernedAnswer,
  governedCandidateFromValueLedgerEntry,
  looksLikeValueLedgerQuestion,
  valueConfidenceToConfidenceLevel,
} from "@/lib/source/ava/value-ledger-governed-answer";
import { getSourceValueLedger } from "@/lib/source/queries";
import type { SourceValueLedgerSnapshot, ValueLedgerEntry } from "@/lib/source/types";

jest.mock("@/lib/source/queries", () => ({
  getSourceValueLedger: jest.fn(),
}));

const mockGetSourceValueLedger = jest.mocked(getSourceValueLedger);

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

function snapshot(
  overrides: Partial<SourceValueLedgerSnapshot> = {},
): SourceValueLedgerSnapshot {
  return {
    updatedAt: "2026-07-23T00:00:00.000Z",
    projected: [
      ledgerEntry(),
      ledgerEntry({
        id: "ledger-2",
        label: "Transformation productivity estimate",
        amountUsd: 800_000,
        confidence: "low",
        evidenceCount: 0,
        note: "Needs measurement window and owner attestation.",
      }),
      ledgerEntry({
        id: "unrelated",
        eventId: "other-event",
        eventName: "Other Event",
        amountUsd: 9_000_000,
      }),
    ],
    realized: [],
    ...overrides,
  };
}

describe("looksLikeValueLedgerQuestion", () => {
  it("matches value-ledger and value-waterfall questions", () => {
    expect(looksLikeValueLedgerQuestion("Show the value waterfall.")).toBe(true);
    expect(looksLikeValueLedgerQuestion("What savings are projected vs realized?")).toBe(
      true,
    );
    expect(looksLikeValueLedgerQuestion("How much value is at stake?")).toBe(true);
  });

  it("does not capture unrelated Source chat questions", () => {
    expect(looksLikeValueLedgerQuestion(undefined)).toBe(false);
    expect(looksLikeValueLedgerQuestion("")).toBe(false);
    expect(looksLikeValueLedgerQuestion("Which vendors dodged the response?")).toBe(
      false,
    );
    expect(looksLikeValueLedgerQuestion("Are the client final files ready?")).toBe(
      false,
    );
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
    expect(candidate.source_basis).toBe("Accepted pricing workbook and BAFO delta.");
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

  it("emits a governed value-waterfall chart and line-item table without calling projected value realized", async () => {
    mockGetSourceValueLedger.mockResolvedValue(snapshot());

    const answer = await buildValueLedgerGovernedAnswer({
      eventId: "event-1",
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "Show the value waterfall for this event.",
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
    expect(answer!.directAnswer).toContain("$3.3M of projected Source value");
    expect(answer!.directAnswer).toContain("No realized value is registered");
    expect(answer!.directAnswer).not.toMatch(/realized savings/i);
    expect(answer!.citations.map((citation) => citation.recordId)).toEqual([
      "ledger-1",
      "ledger-2",
    ]);
    expect(answer!.safety.tenantFencePassed).toBe(true);
  });

  it("matches event aliases so route slugs and persisted row ids both work", async () => {
    mockGetSourceValueLedger.mockResolvedValue(snapshot());

    const answer = await buildValueLedgerGovernedAnswer({
      eventId: "source-row-id",
      eventAliases: ["event-1"],
      clientKey: "apexretail",
      tenantId: "tenant-1",
      question: "What value is at stake?",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("answered");
    expect(answer!.citations).toHaveLength(2);
  });

  it("returns an honest no-data packet when the event has no ledger rows", async () => {
    mockGetSourceValueLedger.mockResolvedValue(snapshot());

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
});
