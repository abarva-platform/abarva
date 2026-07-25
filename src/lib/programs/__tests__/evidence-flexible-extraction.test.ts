import { getAuditedAnthropicClient } from "@/lib/agent/stream";

import {
  extractFlexibleEvidenceEnvelope,
  enrichWithFlexibleEvidenceEnvelope,
  type ExtractedProgramEvidence,
} from "../evidence-ingestion";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const getAuditedAnthropicClientMock =
  getAuditedAnthropicClient as jest.MockedFunction<
    typeof getAuditedAnthropicClient
  >;
const createMock = jest.fn();

function fakeAnthropicResponse(json: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(json) }],
  };
}

describe("extractFlexibleEvidenceEnvelope", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    createMock.mockReset();
    getAuditedAnthropicClientMock.mockReset();
    getAuditedAnthropicClientMock.mockResolvedValue({
      client: { messages: { create: createMock } },
      auditId: "audit-1",
      dataClass: "confidential",
    } as never);
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("returns null when there is no API key configured — never blocks ingestion", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await extractFlexibleEvidenceEnvelope({
      tenantId: "tenant-1",
      filename: "notes.txt",
      text: "Some real content here.",
    });
    expect(result).toBeNull();
    expect(getAuditedAnthropicClientMock).not.toHaveBeenCalled();
  });

  it("returns null for empty text without calling the model", async () => {
    const result = await extractFlexibleEvidenceEnvelope({
      tenantId: "tenant-1",
      filename: "notes.txt",
      text: "   ",
    });
    expect(result).toBeNull();
    expect(getAuditedAnthropicClientMock).not.toHaveBeenCalled();
  });

  it("parses a well-formed model response into the flexible envelope shape", async () => {
    createMock.mockResolvedValue(
      fakeAnthropicResponse({
        observations: ["Call volume spikes on Mondays."],
        tables: [
          {
            title: "Call reasons",
            headers: ["Reason", "Count"],
            rows: [["Billing", "120"]],
          },
        ],
        assumptions: ["Data covers Q1 only."],
        openQuestions: ["Is this volume seasonal?"],
        citations: [{ quote: "Monday call volume is highest", locator: "row 3" }],
      }),
    );

    const result = await extractFlexibleEvidenceEnvelope({
      tenantId: "tenant-1",
      userId: "user-1",
      filename: "P2_call_reason_intent_taxonomy.csv",
      text: "Reason,Count\nBilling,120\nClaims,80",
    });

    expect(result).not.toBeNull();
    expect(result?.observations).toEqual(["Call volume spikes on Mondays."]);
    expect(result?.tables).toEqual([
      { title: "Call reasons", headers: ["Reason", "Count"], rows: [["Billing", "120"]] },
    ]);
    expect(result?.assumptions).toEqual(["Data covers Q1 only."]);
    expect(result?.openQuestions).toEqual(["Is this volume seasonal?"]);
    expect(result?.citations).toEqual([
      { quote: "Monday call volume is highest", locator: "row 3" },
    ]);
  });

  it("degrades gracefully to null when the model call throws", async () => {
    createMock.mockRejectedValue(new Error("model unavailable"));
    const result = await extractFlexibleEvidenceEnvelope({
      tenantId: "tenant-1",
      filename: "notes.txt",
      text: "Some real content here.",
    });
    expect(result).toBeNull();
  });

  it("degrades gracefully to null on malformed JSON", async () => {
    createMock.mockResolvedValue(fakeAnthropicResponse("not-an-object"));
    createMock.mockResolvedValueOnce({
      content: [{ type: "text", text: "not valid json at all {" }],
    });
    const result = await extractFlexibleEvidenceEnvelope({
      tenantId: "tenant-1",
      filename: "notes.txt",
      text: "Some real content here.",
    });
    expect(result).toBeNull();
  });
});

describe("enrichWithFlexibleEvidenceEnvelope", () => {
  const baseEvidence: ExtractedProgramEvidence = {
    evidenceType: "uploaded_artifact",
    title: "P2_monthly_call_center_metrics.csv",
    summary: "Monthly call center metrics.",
    extractedText: "Month,Volume\nJan,1000",
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: [],
      attendees: [],
      parse_method: "csv-line-parser",
      warnings: [],
    },
    confidence: 0.7,
  };

  beforeEach(() => {
    createMock.mockReset();
    getAuditedAnthropicClientMock.mockReset();
    getAuditedAnthropicClientMock.mockResolvedValue({
      client: { messages: { create: createMock } },
      auditId: "audit-1",
      dataClass: "confidential",
    } as never);
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns evidence unchanged when there is no extracted text", async () => {
    const evidence = { ...baseEvidence, extractedText: null };
    const result = await enrichWithFlexibleEvidenceEnvelope(evidence, {
      tenantId: "tenant-1",
    });
    expect(result).toBe(evidence);
    expect(getAuditedAnthropicClientMock).not.toHaveBeenCalled();
  });

  it("adds the flexible field on success without altering the deterministic fields", async () => {
    createMock.mockResolvedValue(
      fakeAnthropicResponse({
        observations: ["Volume grew steadily each month."],
        tables: [],
        assumptions: [],
        openQuestions: [],
        citations: [],
      }),
    );
    const result = await enrichWithFlexibleEvidenceEnvelope(baseEvidence, {
      tenantId: "tenant-1",
      userId: "user-1",
    });
    expect(result.extractedStructured.decisions).toEqual(
      baseEvidence.extractedStructured.decisions,
    );
    expect(result.extractedStructured.flexible?.observations).toEqual([
      "Volume grew steadily each month.",
    ]);
  });

  it("returns evidence unchanged when enrichment fails", async () => {
    createMock.mockRejectedValue(new Error("down"));
    const result = await enrichWithFlexibleEvidenceEnvelope(baseEvidence, {
      tenantId: "tenant-1",
    });
    expect(result).toEqual(baseEvidence);
  });
});
