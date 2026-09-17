import {
  getAskSessionContextById,
  getAskSessionForMove,
  prepareAskSessionMemory,
} from "../session-memory";

const fromMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: (...args: unknown[]) => fromMock(...args) }),
}));

function mockSessionRows(
  turns: Array<Record<string, unknown>>,
  summary: string | null = null,
  turnFailure: "error" | "throw" | null = null,
) {
  fromMock.mockImplementation((table: string) => {
    const builder = {
      upsert: () => builder,
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      limit: () => builder,
      single: async () => ({ data: { id: "session-1", summary }, error: null }),
      maybeSingle: async () => ({ data: { id: "session-1", summary }, error: null }),
      then: (resolve: (value: unknown) => void, reject: (error: Error) => void) => {
        if (table === "intelligence_ask_turns" && turnFailure === "throw") {
          reject(new Error("read unavailable"));
          return;
        }
        resolve({
          data: table === "intelligence_ask_turns" && turnFailure !== "error" ? turns : null,
          error: table === "intelligence_ask_turns" && turnFailure === "error"
            ? { message: "read unavailable" }
            : null,
        });
      },
    };
    return builder;
  });
}

const oldUnverifiedTurn = {
  role: "user",
  content: "Review this contract.",
  created_at: "2026-01-01T00:00:00Z",
  metadata_jsonb: {
    surfaceContext: {
      module: "intelligence",
      sourceV4: { selectedContract: { annualValueUsd: 9_900_000 } },
    },
  },
};

beforeEach(() => fromMock.mockReset());

describe("Intelligence session contract-history boundary", () => {
  it("withholds older summary and recent turns when an earlier packet was unverified", async () => {
    mockSessionRows([
      oldUnverifiedTurn,
      ...Array.from({ length: 11 }, (_, index) => ({
        role: "assistant",
        content: `Ordinary turn ${index}`,
        created_at: "2026-01-01T00:00:00Z",
        metadata_jsonb: {},
      })),
    ], "Forged candidate is worth $9.9M.");

    const memory = await prepareAskSessionMemory({
      tenantId: "client-1",
      userId: "user-1",
      tabId: "tab-12345",
      query: "Continue.",
    });

    expect(memory?.priorTurnCount).toBe(12);
    expect(memory?.contextBlock).toBe("");
    expect((await getAskSessionContextById({
      tenantId: "client-1",
      sessionId: "session-1",
    }))?.contextBlock).toBe("");
    expect((await getAskSessionForMove({
      tenantId: "client-1",
      moveId: "move-1",
    }))?.contextBlock).toBe("");
  });

  it("keeps ordinary session context available", async () => {
    mockSessionRows([{
      role: "user",
      content: "Summarize the available records.",
      created_at: "2026-01-01T00:00:00Z",
      metadata_jsonb: { surfaceContext: { module: "intelligence" } },
    }]);

    const memory = await prepareAskSessionMemory({
      tenantId: "client-1",
      userId: "user-1",
      tabId: "tab-12345",
      query: "Continue.",
    });

    expect(memory?.contextBlock).toContain("Summarize the available records.");
  });

  it("distinguishes a successful empty turn read from a failed read", async () => {
    mockSessionRows([]);

    const memory = await prepareAskSessionMemory({
      tenantId: "client-1",
      userId: "user-1",
      tabId: "tab-12345",
      query: "Start.",
    });

    expect(memory?.sessionId).toBe("session-1");
    expect(memory?.priorTurnCount).toBe(0);
    expect(memory?.contextBlock).toBe("");
  });

  it("withholds a newly marked contract session", async () => {
    mockSessionRows([{
      ...oldUnverifiedTurn,
      metadata_jsonb: { unverifiedContractContext: true },
    }]);

    const memory = await prepareAskSessionMemory({
      tenantId: "client-1",
      userId: "user-1",
      tabId: "tab-12345",
      query: "Continue.",
    });

    expect(memory?.contextBlock).toBe("");
  });

  it.each(["error", "throw"] as const)(
    "withholds an existing summary when the turn read has a %s",
    async (turnFailure) => {
      mockSessionRows([], "Unverified contract value was $9.9M.", turnFailure);

      expect(await prepareAskSessionMemory({
        tenantId: "client-1",
        userId: "user-1",
        tabId: "tab-12345",
        query: "Continue.",
      })).toBeNull();
      expect(await getAskSessionContextById({
        tenantId: "client-1",
        sessionId: "session-1",
      })).toBeNull();
      expect(await getAskSessionForMove({
        tenantId: "client-1",
        moveId: "move-1",
      })).toBeNull();
    },
  );
});
