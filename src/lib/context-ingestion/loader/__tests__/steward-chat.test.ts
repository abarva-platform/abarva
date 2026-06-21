import {
  buildStewardChatPrompt,
  makeStewardChat,
  type StewardChatModel,
  type StewardChatTurn,
} from "@/lib/context-ingestion/loader/steward-chat";
import type {
  MappingProposal,
  StewardFinding,
} from "@/lib/context-ingestion/loader/contract";

function makeProposal(
  overrides: Partial<MappingProposal> = {},
): MappingProposal {
  return {
    source: {
      tenantKey: "apex-retail",
      filename: "org-chart.csv",
      container: "context-landing",
      objectKey: "landing/apex-retail/inbox/abc-org-chart.csv",
      blobUrl: "https://blob.example/abc-org-chart.csv",
      fileHash: "deadbeefcafe0000",
      bytes: 2048,
      ingestedAt: "2026-06-07T00:00:00.000Z",
    },
    dimension: "leadership_org",
    dimensionConfidence: 0.72,
    fieldMappings: [
      { sourceColumn: "Name", canonicalField: "person.name", confidence: 0.9 },
      {
        sourceColumn: "Title",
        canonicalField: "person.title",
        confidence: 0.81,
      },
    ],
    sampleRows: [{ Name: "Dana Lee", Title: "CFO" }],
    reviewRequired: false,
    ...overrides,
  };
}

describe("buildStewardChatPrompt", () => {
  it("includes the dimension, the question, and prior history", () => {
    const history: StewardChatTurn[] = [
      { author: "operator", body: "Why is this leadership?" },
      { author: "steward", body: "Because the columns are names and titles." },
    ];
    const prompt = buildStewardChatPrompt({
      proposal: makeProposal(),
      history,
      question: "Should Title map to role instead?",
    });

    expect(prompt).toContain("leadership_org");
    expect(prompt).toContain("Should Title map to role instead?");
    expect(prompt).toContain("Why is this leadership?");
    expect(prompt).toContain("Because the columns are names and titles.");
    // System framing is present.
    expect(prompt).toContain("You are Ava");
    expect(prompt).toContain("never invent data");
  });

  it("renders open findings into the prompt", () => {
    const findings: StewardFinding[] = [
      {
        kind: "conflict",
        severity: "warn",
        message: "Two people titled CFO",
        rowRef: "row 3",
        source: "agent",
      },
    ];
    const prompt = buildStewardChatPrompt({
      proposal: makeProposal(),
      findings,
      history: [],
      question: "Which CFO is current?",
    });
    expect(prompt).toContain("Two people titled CFO");
    expect(prompt).toContain("row 3");
  });

  it("bounds history to the most recent turns", () => {
    const history: StewardChatTurn[] = Array.from({ length: 40 }, (_, i) => ({
      author: i % 2 === 0 ? ("operator" as const) : ("steward" as const),
      body: `turn-${i}`,
    }));
    const prompt = buildStewardChatPrompt({
      proposal: makeProposal(),
      history,
      question: "latest?",
    });
    // Earliest turns are dropped; recent turns survive.
    expect(prompt).not.toContain("turn-0");
    expect(prompt).toContain("turn-39");
  });
});

describe("makeStewardChat", () => {
  it("returns the stub model reply", async () => {
    const model: StewardChatModel = {
      reply: async () => "Map Title to person.title; it is correct.",
    };
    const chat = makeStewardChat(model);
    const reply = await chat({
      proposal: makeProposal(),
      history: [],
      question: "Is Title mapped right?",
    });
    expect(reply).toBe("Map Title to person.title; it is correct.");
  });

  it("passes the built prompt to the model", async () => {
    let seen = "";
    const model: StewardChatModel = {
      reply: async (prompt) => {
        seen = prompt;
        return "ok";
      },
    };
    await makeStewardChat(model)({
      proposal: makeProposal(),
      history: [],
      question: "unique-marker-question",
    });
    expect(seen).toContain("unique-marker-question");
  });

  it("returns the calm fallback on model throw and never throws", async () => {
    const model: StewardChatModel = {
      reply: async () => {
        throw new Error("upstream 503");
      },
    };
    const chat = makeStewardChat(model);
    await expect(
      chat({ proposal: makeProposal(), history: [], question: "anything?" }),
    ).resolves.toContain("your file and proposal are preserved");
  });

  it("returns the calm fallback when the model returns empty text", async () => {
    const model: StewardChatModel = { reply: async () => "   " };
    const reply = await makeStewardChat(model)({
      proposal: makeProposal(),
      history: [],
      question: "anything?",
    });
    expect(reply).toContain("your file and proposal are preserved");
  });
});
