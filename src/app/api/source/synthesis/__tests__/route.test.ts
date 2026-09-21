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

jest.mock("@/lib/module-v6/demo-tenant-packs", () => {
  const actual = jest.requireActual("@/lib/module-v6/demo-tenant-packs");
  const sourceInstances = jest.requireActual(
    "@/lib/source/source-event-instances",
  );
  const baseInstance = sourceInstances.AMS_VENDOR_CONSOLIDATION_2026_INSTANCE;

  return {
    ...actual,
    buildV6SourceEventInstanceForTenant: jest.fn(
      (tenantKeyInput: string, requestedInstanceId?: string | null) => {
        const tenantKey = actual.canonicalV6DemoTenantKey(tenantKeyInput);
        if (!["skyharbor-air", "lakeshore-holdings"].includes(tenantKey)) {
          return null;
        }

        const eventId = `${tenantKey}-v6-source-commercial-review`;
        if (
          requestedInstanceId &&
          ![eventId, "v6-source-commercial-review"].includes(
            requestedInstanceId,
          )
        ) {
          return null;
        }

        return {
          ...baseInstance,
          id: eventId,
          displayId:
            tenantKey === "skyharbor-air"
              ? "SRC-AIR-V6-2026"
              : "SRC-IND-V6-2026",
          tenantSlug: tenantKey,
          tenantId: tenantKey,
          name:
            tenantKey === "skyharbor-air"
              ? "OCC Modernization vendor and commercial readiness"
              : "Corporate ERP and HCM controls modernization vendor and commercial readiness",
        };
      },
    ),
  };
});

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

  /**
   * This case expected 200 and now asserts 403, because the behaviour it
   * describes changed deliberately: `skyharbor-air` joined
   * FOUNDATION_TENANT_KEYS, and the route refuses legacy V6 synthesis packs
   * for foundation tenants so Source renders from governed operational state
   * instead. The 403 is the control working, not a regression, and this is an
   * expectation refresh rather than a deleted control.
   *
   * It is kept rather than folded into the `airline-demo-new` case below:
   * skyharbor-air is the tenant this route used to serve and the one demos
   * still reach for, so it is the case that would notice if the refusal were
   * relaxed for it specifically.
   *
   * What it can no longer assert is the prompt body — the previous version
   * checked that the Airline pack, not the Apex fixture, reached the model.
   * A refused request never reaches the model, so that proof now lives only
   * in the Lakeshore case below.
   */
  it("refuses the legacy V6 pack for skyharbor-air, now a governed foundation tenant", async () => {
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

    expect(res.status).toBe(403);
    expect(res.headers.get("x-abarva-source-layer")).toBe("source-current");
    await expect(res.json()).resolves.toEqual({
      error: "governed_foundation_tenant",
      detail:
        "Foundation tenants must render Source synthesis from governed Source operational state. Legacy V6 synthesis packs are unavailable on this tenant.",
    });
    // Refused before the model is reached: a blocked tenant must not cost an
    // egress call, and must not have its context sent out on the way to being
    // refused.
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });

  it("uses the active Lakeshore Holdings V6 Source pack with loaded commercial facts", async () => {
    mockAnthropicStream.mockReturnValue(
      claudeTextStream("Industrial Source V6 answer."),
    );
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-lakeshore",
      name: "Lakeshore Holdings",
      industry_code: "industrial",
      key: "lakeshore-holdings",
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
    expect(res.headers.get("x-abarva-source-layer")).toBe("source-current");
    await expect(res.text()).resolves.toBe("Industrial Source V6 answer.");
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain(
      "Corporate ERP and HCM controls modernization vendor and commercial readiness",
    );
    expect(streamArgs.messages[0].content).toContain(
      "vendor-commercial-packet",
    );
  });

  it("blocks explicit Apex Source event access for a different active tenant", async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-lakeshore",
      name: "Lakeshore Holdings",
      industry_code: "industrial",
      key: "lakeshore-holdings",
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
    expect(res.headers.get("x-abarva-source-layer")).toBe("source-current");
    await expect(res.json()).resolves.toEqual({
      error: "wrong_client",
      detail: "Requested Source event does not belong to the active tenant.",
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });

  it("blocks governed foundation tenants before legacy V6 Source synthesis", async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-airline-new",
      name: "Airline Demo New",
      industry_code: "airline",
      key: "airline-demo-new",
    });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://test/api/source/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(403);
    expect(res.headers.get("x-abarva-source-layer")).toBe("source-current");
    await expect(res.json()).resolves.toEqual({
      error: "governed_foundation_tenant",
      detail:
        "Foundation tenants must render Source synthesis from governed Source operational state. Legacy V6 synthesis packs are unavailable on this tenant.",
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
