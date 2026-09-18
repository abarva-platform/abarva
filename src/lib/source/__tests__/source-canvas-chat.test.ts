/**
 * Behavioral test for the grounding of the Source canvas chat answer.
 *
 * `/api/v1/source/[eventId]/nexus/ask` calls `callSourceCanvasChatModel` for
 * every canvas turn. This drives that real function — only the Anthropic egress
 * client is faked — and asserts what the caller cannot see from the outside:
 * the system prompt the model actually receives carries the loaded evidence and
 * the refusal posture, and the result reports a citation gap instead of
 * presenting an uncited answer as if it were grounded.
 *
 * The prompt assertions are the point. A grounding rule that is composed but
 * never sent is the failure mode this test exists to catch.
 */

jest.mock("@/lib/integrations/ai-egress", () => ({
  preflightAnthropicDirectClient: jest.fn(),
}));

import {
  callSourceCanvasChatModel,
  composeSourceCanvasChatSystemPrompt,
} from "../source-canvas-chat";
import type { SourceLiveTenantContextSnapshot } from "../agent-context";

const { preflightAnthropicDirectClient } = jest.requireMock(
  "@/lib/integrations/ai-egress",
) as { preflightAnthropicDirectClient: jest.Mock };

function snapshot(
  overrides: Partial<SourceLiveTenantContextSnapshot> = {},
): SourceLiveTenantContextSnapshot {
  return {
    clientKey: "apexretail",
    brokerTenantKey: "apex-retail",
    inventoryRecordCount: 12,
    contextChunkCount: 4,
    embeddedContextChunkCount: 4,
    sourceEventFound: true,
    segments: [],
    currentStateAreas: [],
    evidenceBasis: [],
    retrievedEvidence: [
      {
        id: "chunk-1",
        segmentId: "vendor_contracts",
        recordId: "rec-1",
        title: "AMS master services agreement",
        sourceType: "contextChunk",
        sourceDoc: "ams-msa-2023.pdf",
        sourcePath: "contracts/ams-msa-2023.pdf",
        excerpt: "Annual charge of USD 32,000,000 with a 3% uplift each year.",
        confidence: "high",
        score: 0.91,
      },
      {
        id: "chunk-2",
        segmentId: "vendor_contracts",
        recordId: "rec-2",
        title: "Service credit schedule",
        sourceType: "contextChunk",
        sourceDoc: "ams-sla-2023.pdf",
        excerpt: "Service credits cap at 10% of the monthly charge.",
        confidence: "medium",
        score: 0.74,
      },
    ],
    warnings: [],
    ...overrides,
  };
}

let systemPromptsSent: string[] = [];

function mockModelAnswer(answerText: string) {
  systemPromptsSent = [];
  preflightAnthropicDirectClient.mockResolvedValue({
    ok: true,
    client: {
      messages: {
        create: jest.fn(async (args: { system: string }) => {
          systemPromptsSent.push(args.system);
          return { content: [{ type: "text", text: answerText }] };
        }),
      },
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  systemPromptsSent = [];
});

describe("Source canvas chat grounding", () => {
  it("sends the loaded evidence and the citation rule to the model", async () => {
    mockModelAnswer("The AMS baseline is USD 32,000,000 [E1].");

    await callSourceCanvasChatModel({
      prompt: "What is the AMS baseline?",
      briefingContext: "Deterministic briefing.",
      tenantKey: "apexretail",
      tenantId: "tenant-1",
      liveTenantContext: snapshot(),
    });

    expect(systemPromptsSent).toHaveLength(1);
    const systemPrompt = systemPromptsSent[0];

    // The evidence itself must be in the prompt, not merely referenced.
    expect(systemPrompt).toContain("Active evidence chunks loaded");
    expect(systemPrompt).toContain("AMS master services agreement");
    expect(systemPrompt).toContain(
      "Annual charge of USD 32,000,000 with a 3% uplift each year.",
    );
    expect(systemPrompt).toContain("[E2]");

    // ... and so must the posture that makes it answerable honestly.
    expect(systemPrompt).toContain(
      "MUST cite a loaded evidence ID like [E1]",
    );
    expect(systemPrompt).toContain(
      "Never fabricate vendor names, numbers, contract dates, owners, savings, or tool names.",
    );
    expect(systemPrompt).toContain("say what evidence is missing");
  });

  it("tells the model to state what is missing when no evidence is loaded", async () => {
    mockModelAnswer("I cannot answer that from loaded evidence.");

    await callSourceCanvasChatModel({
      prompt: "What is the AMS baseline?",
      briefingContext: "",
      tenantKey: "apexretail",
      tenantId: "tenant-1",
      liveTenantContext: snapshot({ retrievedEvidence: [] }),
    });

    expect(systemPromptsSent[0]).toContain(
      "No event evidence chunks are currently loaded. Say exactly what evidence is missing before making material claims.",
    );
  });

  it("resolves the evidence a cited answer points at", async () => {
    mockModelAnswer(
      "The baseline is USD 32,000,000 [E1] and credits cap at 10% [E2].",
    );

    const result = await callSourceCanvasChatModel({
      prompt: "What is the AMS baseline?",
      briefingContext: "",
      tenantKey: "apexretail",
      tenantId: "tenant-1",
      liveTenantContext: snapshot(),
    });

    expect(result.evidenceCitations.map((c) => c.id)).toEqual(["E1", "E2"]);
    expect(result.evidenceCitations[0].sourceDoc).toBe("ams-msa-2023.pdf");
    expect(result.warnings).toEqual([]);
  });

  it("warns on an uncited answer rather than presenting it as grounded", async () => {
    mockModelAnswer(
      "As a sourcing best practice you should benchmark the run rate.",
    );

    const result = await callSourceCanvasChatModel({
      prompt: "What is the AMS baseline?",
      briefingContext: "",
      tenantKey: "apexretail",
      tenantId: "tenant-1",
      liveTenantContext: snapshot(),
    });

    expect(result.warnings.join(" ")).toContain("Citation gap");
    expect(result.warnings.join(" ")).toContain("Response drift");
  });

  it("still composes the grounding block when no live context was assembled", () => {
    const systemPrompt = composeSourceCanvasChatSystemPrompt({
      tenantKey: "apexretail",
    });
    expect(systemPrompt).toContain(
      "No event evidence chunks are currently loaded.",
    );
    expect(systemPrompt).toContain("MUST cite a loaded evidence ID like [E1]");
  });

  it("throws rather than answering when egress is denied", async () => {
    preflightAnthropicDirectClient.mockResolvedValue({
      ok: false,
      reason: "policy_denied",
    });

    await expect(
      callSourceCanvasChatModel({
        prompt: "What is the AMS baseline?",
        briefingContext: "",
        tenantKey: "apexretail",
        tenantId: "tenant-1",
        liveTenantContext: snapshot(),
      }),
    ).rejects.toThrow("egress blocked: policy_denied");
  });
});
