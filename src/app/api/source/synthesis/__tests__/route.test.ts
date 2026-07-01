const mockAnthropicStream = jest.fn();
const mockGetActiveClientRow = jest.fn();

jest.mock("@/lib/integrations/ai-egress", () => ({
  preflightAnthropicDirectClient: jest.fn(() => ({
    ok: true,
    client: {
      messages: { stream: mockAnthropicStream },
    },
  })),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: mockGetActiveClientRow,
}));

jest.mock("@/lib/agent/userContext", () => ({
  getUserContextPromptBlock: jest.fn().mockResolvedValue("USER CONTEXT"),
}));

jest.mock("@/lib/reasoning/synthesis-telemetry", () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: "evt-1" })),
}));

function claudeTextStream(text: string) {
  return (async function* stream() {
    yield {
      type: "content_block_delta",
      delta: { type: "text_delta", text },
    };
  })();
}

describe("POST /api/source/synthesis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnthropicStream.mockReturnValue(claudeTextStream("Source V6 answer."));
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-apex",
      name: "Retail Demo",
      industry_code: "retail",
      key: "apexretail",
    });
  });

  it("uses the active Airline Demo V6 Source pack instead of defaulting to the Apex AMS fixture", async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      name: "Airline Demo",
      industry_code: "airline",
      key: "skyharbor-air",
    });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://test/api/source/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("x-abarva-v6-surface")).toBe("source");
    await expect(res.text()).resolves.toBe("Source V6 answer.");
    expect(mockAnthropicStream).toHaveBeenCalledTimes(1);
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain(
      "OCC Modernization vendor and commercial readiness",
    );
    expect(streamArgs.messages[0].content).toContain(
      "vendor-commercial-packet",
    );
    expect(streamArgs.messages[0].content).toContain(
      'include the exact phrase "commercial evidence is DATA-THIN"',
    );
    expect(streamArgs.messages[0].content).not.toContain(
      "apex-retail-ams-outsourcing-2026",
    );
  });

  it("uses the active Industrial Demo V6 Source pack with loaded commercial facts", async () => {
    mockAnthropicStream.mockReturnValue(
      claudeTextStream("Industrial Source V6 answer."),
    );
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-lakeshore",
      name: "Industrial Demo",
      industry_code: "industrial",
      key: "lakeshore-industries",
    });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://test/api/source/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("x-abarva-v6-surface")).toBe("source");
    await expect(res.text()).resolves.toBe("Industrial Source V6 answer.");
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain(
      "Kyriba global cash and payments rollout vendor and commercial readiness",
    );
    expect(streamArgs.messages[0].content).toContain(
      "vendor-commercial-packet",
    );
  });

  it("blocks explicit Apex Source event access for a different active tenant", async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-lakeshore",
      name: "Industrial Demo",
      industry_code: "industrial",
      key: "lakeshore-industries",
    });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://test/api/source/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: "ams-vendor-consolidation-2026" }),
      }),
    );

    expect(res.status).toBe(403);
    expect(res.headers.get("x-abarva-v6-surface")).toBe("source");
    await expect(res.json()).resolves.toEqual({
      error: "wrong_client",
      detail: "Requested Source event does not belong to the active tenant.",
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
