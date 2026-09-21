import { MODULE_V6_ANSWER_CONTRACT_VERSION } from "@/lib/agent/module-v6-answer-contract";

const mockAnthropicStream = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockBuildV6SourceEventInstanceForTenant = jest.fn();

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
    buildV6SourceEventInstanceForTenant: mockBuildV6SourceEventInstanceForTenant.mockImplementation(
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

// T-517: this suite asserted a single surface-attribution header that the route
// has never emitted — it occurred nowhere in `src` outside these tests, at every
// commit that ever touched them, so the expectation was wrong the day it was
// written. Its name is deliberately not repeated here; a dead header name left
// lying in a comment is how the next scanner concludes the control exists. The
// route does emit surface attribution, under the names below, on success AND on
// every error response via `sourceJsonError`. The
// layer and policy values are asserted as literals because they are the surface
// attribution this suite exists to prove; the contract header is compared with
// the exported constant so a route that stops sourcing it from the canonical
// version fails here.
function expectSourceV6Headers(res: Response) {
  expect(res.headers.get("X-AbarVa-Source-Layer")).toBe("source-current");
  expect(res.headers.get("X-AbarVa-Renderer-Policy")).toBe("placement-only");
  expect(res.headers.get("X-AbarVa-V6-Contract")).toBe(
    MODULE_V6_ANSWER_CONTRACT_VERSION,
  );
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

  // T-517: this case asserted a 200 for `skyharbor-air`, and receives 403. The
  // fixture is behind a deliberate product change, not a regression:
  // `skyharbor-air` is in FOUNDATION_TENANT_KEYS, and foundation tenants are
  // blocked from legacy V6 Source synthesis by design — the last case in this
  // suite already asserts that rule for `airline-demo-new`. No tenant key exists
  // for which this case could still return 200, so rather than flip it to a bare
  // `expect(403)` that any 403 would satisfy, it is re-pointed at the stronger
  // property `airline-demo-new` cannot prove: `skyharbor-air` is a tenant whose
  // V6 pack WOULD resolve, and the block must happen before that pack is ever
  // consulted. This fails if the route 403s for a different reason, or blocks
  // only after reading the pack. The positive contract this case used to carry —
  // a non-Apex tenant is not served the Apex AMS fixture — moves to the
  // Lakeshore case below, which is now the only one that still returns 200.
  it("blocks a foundation tenant before the V6 Source pack is consulted", async () => {
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
    expectSourceV6Headers(res);
    await expect(res.json()).resolves.toEqual({
      error: "governed_foundation_tenant",
      detail:
        "Foundation tenants must render Source synthesis from governed Source operational state. Legacy V6 synthesis packs are unavailable on this tenant.",
    });
    expect(mockBuildV6SourceEventInstanceForTenant).not.toHaveBeenCalled();
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
    expectSourceV6Headers(res);
    await expect(res.text()).resolves.toBe("Industrial Source V6 answer.");
    expect(mockAnthropicStream).toHaveBeenCalledTimes(1);
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain(
      "Corporate ERP and HCM controls modernization vendor and commercial readiness",
    );
    expect(streamArgs.messages[0].content).toContain(
      "vendor-commercial-packet",
    );
    // T-517: the next two guards are inherited from the retired Airline case.
    // Lakeshore Holdings is now the only tenant that reaches a 200 here, so this
    // is the only place the data-thin instruction and the "does not fall back to
    // the Apex AMS fixture" contract can still be proved at all.
    expect(streamArgs.messages[0].content).toContain(
      'include the exact phrase "commercial evidence is DATA-THIN"',
    );
    expect(streamArgs.messages[0].content).not.toContain(
      "apex-retail-ams-outsourcing-2026",
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
    expectSourceV6Headers(res);
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
    expectSourceV6Headers(res);
    await expect(res.json()).resolves.toEqual({
      error: "governed_foundation_tenant",
      detail:
        "Foundation tenants must render Source synthesis from governed Source operational state. Legacy V6 synthesis packs are unavailable on this tenant.",
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
