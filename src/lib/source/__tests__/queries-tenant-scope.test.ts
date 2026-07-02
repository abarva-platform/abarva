import {
  getSourcingEvent,
  getSourcingEventArtifact,
  listSourcingEvents,
} from "../queries";

const mockSourceEventsAdapter = {
  getPendingEventsForClient: jest.fn(),
  getActiveEventsForClient: jest.fn(),
  getEventByIdForClient: jest.fn(),
  getEventByCodeForClient: jest.fn(),
};

const mockSourceCanvasAdapter = {
  listArtifactStateRows: jest.fn(),
  listGateCriterionStateRows: jest.fn(),
  listEvidenceStateRows: jest.fn(),
};

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  allowedSourceEventIdsForUser: jest.fn(),
  canReadSourceEvent: jest.fn(),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/data-plane/read-adapters/sourceEventsReadAdapter", () => ({
  selectSourceEventsReadAdapter: jest.fn(() => mockSourceEventsAdapter),
}));

jest.mock("@/lib/data-plane/read-adapters/sourceCanvasSubstrateReadAdapter", () => ({
  selectSourceCanvasSubstrateReadAdapter: jest.fn(() => mockSourceCanvasAdapter),
}));

jest.mock("../artifact-registry", () => ({
  getSourceArtifactRegistryRecord: jest.fn(),
}));

jest.mock("@/lib/supabase-server", () => ({
  getServerSupabase: jest.fn(),
}));

const { getActiveClientRow } = jest.requireMock("@/lib/active-client") as {
  getActiveClientRow: jest.Mock;
};
const { requireTenancy } = jest.requireMock("@/lib/auth/tenancy") as {
  requireTenancy: jest.Mock;
};
const { canReadSourceEvent } = jest.requireMock(
  "@/lib/auth/source-access-policy",
) as {
  canReadSourceEvent: jest.Mock;
};
const { getCurrentUser } = jest.requireMock("@/lib/auth/current-user") as {
  getCurrentUser: jest.Mock;
};
const { getServerSupabase } = jest.requireMock("@/lib/supabase-server") as {
  getServerSupabase: jest.Mock;
};
const { getSourceArtifactRegistryRecord } = jest.requireMock(
  "../artifact-registry",
) as {
  getSourceArtifactRegistryRecord: jest.Mock;
};

function mockEmptySourceEventsTable() {
  mockSourceEventsAdapter.getPendingEventsForClient.mockResolvedValue([]);
  mockSourceEventsAdapter.getActiveEventsForClient.mockResolvedValue([]);
  mockSourceEventsAdapter.getEventByIdForClient.mockResolvedValue(null);
  mockSourceEventsAdapter.getEventByCodeForClient.mockResolvedValue(null);

  const order = jest.fn().mockResolvedValue({ data: [], error: null });
  const neq = jest.fn(() => ({ order }));
  const eq = jest.fn(() => ({ neq }));
  const select = jest.fn(() => ({ eq }));
  getServerSupabase.mockReturnValue({ from: jest.fn(() => ({ select })) });
}

function mockApexPersistedGoldenEvent() {
  mockSourceEventsAdapter.getEventByCodeForClient.mockImplementation(
    async (eventCode: string) => {
      if (eventCode === "SRC-004") {
        return {
          id: "522eedf2-ff6b-4307-b312-3e0903c6fd42",
          client_key: "apexretail",
          event_code: "SRC-004",
          event_name: "AMS Outsourcing 2026",
          event_type: "managed_service",
          current_stage_key: "bafo",
          lifecycle_state: "active",
          linked_program_id: null,
          estimated_value_usd: 35000000,
          trigger_description: "Renewal and run-cost pressure.",
          scope_description: "SAP, OMS, WMS, POS, finance legacy support.",
          decision_owner: "Carlos Rivera",
          created_by_user_id: "user-apex",
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: new Date("2026-06-02T00:00:00.000Z"),
        };
      }
      return null;
    },
  );
}

describe("listSourcingEvents tenant scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockRejectedValue(
      new Error("no request tenancy in unit test"),
    );
    mockEmptySourceEventsTable();
    mockSourceCanvasAdapter.listArtifactStateRows.mockResolvedValue([]);
    mockSourceCanvasAdapter.listGateCriterionStateRows.mockResolvedValue([]);
    mockSourceCanvasAdapter.listEvidenceStateRows.mockResolvedValue([]);
  });

  it("only returns Apex seed events for an Apex active client", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-apex",
      name: "Apex Retail Group",
      industry_code: "RETAIL",
      key: "apexretail",
    });

    const events = await listSourcingEvents();

    expect(events).toHaveLength(1);
    expect(events.every((event) => event.accountName.includes("Apex"))).toBe(
      true,
    );
    expect(events.map((event) => event.accountName)).not.toContain(
      "Northstar Holdings",
    );
  });

  it("returns no shared seed events for a First Capital active client until First Capital seeds exist", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-first-capital",
      name: "First Capital",
      industry_code: "FINSERV",
      key: "arcturus",
    });

    const events = await listSourcingEvents();

    expect(events).toEqual([]);
  });

  it("returns no shared Apex seed events for a Lakeshore active client", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-lakeshore",
      name: "Lakeshore Holdings",
      industry_code: "DIVERSIFIED",
      key: "lakeshore",
    });

    const events = await listSourcingEvents();

    expect(events).toEqual([]);
  });

  it("uses the same tenant-scoped seed fallback if the persisted overlay query fails", async () => {
    const order = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "relation does not exist" },
    });
    const neq = jest.fn(() => ({ order }));
    const eq = jest.fn(() => ({ neq }));
    const select = jest.fn(() => ({ eq }));
    getServerSupabase.mockReturnValue({ from: jest.fn(() => ({ select })) });
    getActiveClientRow.mockResolvedValue({
      id: "client-apex",
      name: "Apex Retail Group",
      industry_code: "RETAIL",
      key: "apexretail",
    });

    const events = await listSourcingEvents();

    expect(events).toHaveLength(1);
    expect(events[0]?.accountName).toBe("Apex Retail");
  });
});

describe("getSourcingEvent tenant scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmptySourceEventsTable();
    getCurrentUser.mockResolvedValue(null);
    canReadSourceEvent.mockResolvedValue(true);
  });

  it("does not return an Apex seed event for a Meridian active client", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-meridian",
      name: "Meridian Health",
      industry_code: "HEALTHCARE_IDN",
      key: "meridian",
    });
    requireTenancy.mockResolvedValue({
      clientId: "client-meridian",
      clientKey: "meridian",
      userId: "clerk:meridian-cdio",
      role: "client_admin",
      email: "cdio@meridian-health.example.com",
    });
    canReadSourceEvent.mockResolvedValue(false);

    await expect(
      getSourcingEvent("apex-retail-ams-outsourcing-2026"),
    ).resolves.toBeNull();
    expect(canReadSourceEvent).not.toHaveBeenCalled();
  });

  it("returns a persisted Lakeshore Source row only for the Lakeshore active client", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-lakeshore",
      name: "Lakeshore Holdings",
      industry_code: "DIVERSIFIED",
      key: "lakeshore",
    });
    requireTenancy.mockResolvedValue({
      clientId: "client-lakeshore",
      clientKey: "lakeshore",
      userId: "clerk:lakeshore-cio",
      role: "client_admin",
      email: "cio@lakeshore-holdings.example.com",
    });
    mockSourceEventsAdapter.getEventByCodeForClient.mockImplementation(
      async (eventCode: string, clientKey: string) => {
        if (
          eventCode === "LSH-KYRIBA-TREASURY-2026" &&
          clientKey === "lakeshore"
        ) {
          return {
            id: "5f42db55-ed01-4cb5-8c95-5ca0ddaa02aa",
            client_key: "lakeshore",
            event_code: "LSH-KYRIBA-TREASURY-2026",
            event_name: "Kyriba Treasury Rollout Commercial Readiness",
            event_type: "software",
            current_stage_key: "executive_decision",
            lifecycle_state: "active",
            linked_program_id: null,
            estimated_value_usd: 42000000,
            trigger_description: "Treasury controls and cash visibility.",
            scope_description: "Kyriba treasury rollout and ERP integration.",
            decision_owner: "Daniel Whitaker / Meera Rao",
            created_by_user_id: "lakeshore-product-substrate-v1",
            created_at: "2026-06-04T00:00:00.000Z",
            updated_at: "2026-06-04T00:00:00.000Z",
          };
        }
        return null;
      },
    );

    const event = await getSourcingEvent("LSH-KYRIBA-TREASURY-2026");

    expect(event?.accountName).toBe("Lakeshore Holdings");
    expect(event?.code).toBe("LSH-KYRIBA-TREASURY-2026");
    expect(event?.currentStageKey).toBe("executive_decision");
    expect(canReadSourceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "lakeshore" }),
      "lakeshore",
      "5f42db55-ed01-4cb5-8c95-5ca0ddaa02aa",
    );
  });

  it("returns a persisted Source row when the active client and row use same-tenant aliases", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      name: "SkyHarbor Air",
      industry_code: "GLOBAL_NETWORK_AIRLINE",
      key: "skyharbor-air",
    });
    requireTenancy.mockResolvedValue({
      clientId: "client-skyharbor",
      clientKey: "skyharbor-air",
      userId: "clerk:skyharbor-agent",
      role: "client_admin",
      email: "skyharbor-agent@abarva.example.com",
    });
    mockSourceEventsAdapter.getEventByCodeForClient.mockImplementation(
      async (eventCode: string, clientKey: string) => {
        if (
          eventCode === "SKYH-AMS-CONTRACT-OPT-2026" &&
          clientKey === "skyharbor"
        ) {
          return {
            id: "2e3e5152-017c-49f6-a2b6-83385907dfc4",
            client_key: "skyharbor",
            event_code: "SKYH-AMS-CONTRACT-OPT-2026",
            event_name: "SkyHarbor AMS Contract Optimization and Renewal Decision",
            event_type: "managed_service",
            current_stage_key: "responses",
            lifecycle_state: "active",
            linked_program_id: null,
            estimated_value_usd: 18500000,
            trigger_description: "Renewal, invoice leakage, and SLA pressure.",
            scope_description: "AMS contract optimization and renewal decision.",
            decision_owner: "Procurement commercial lead",
            created_by_user_id: "skyharbor-contract-optimization",
            created_at: "2026-07-01T00:00:00.000Z",
            updated_at: "2026-07-01T00:00:00.000Z",
          };
        }
        return null;
      },
    );

    const event = await getSourcingEvent("SKYH-AMS-CONTRACT-OPT-2026");

    expect(event?.id).toBe("2e3e5152-017c-49f6-a2b6-83385907dfc4");
    expect(event?.accountName).toBe("SkyHarbor Air");
    expect(canReadSourceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "skyharbor-air" }),
      "skyharbor-air",
      "2e3e5152-017c-49f6-a2b6-83385907dfc4",
    );
  });

  it("still returns the Apex seed event for an Apex active client when policy allows it", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-apex",
      name: "Apex Retail Group",
      industry_code: "RETAIL",
      key: "apexretail",
    });
    requireTenancy.mockResolvedValue({
      clientId: "client-apex",
      clientKey: "apexretail",
      userId: "clerk:apex-cio",
      role: "client_admin",
      email: "cio@apex-retail.example.com",
    });

    const event = await getSourcingEvent("apex-retail-ams-outsourcing-2026");

    expect(event?.name).toBe("AMS Outsourcing 2026");
    expect(event?.accountName).toBe("Apex Retail");
    expect(canReadSourceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "apexretail" }),
      "apexretail",
      "apex-retail-ams-outsourcing-2026",
    );
  });

  it("prefers the persisted Apex row when the golden slug maps to a seeded event code", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-apex",
      name: "Apex Retail Group",
      industry_code: "RETAIL",
      key: "apexretail",
    });
    requireTenancy.mockResolvedValue({
      clientId: "client-apex",
      clientKey: "apexretail",
      userId: "clerk:apex-cio",
      role: "client_admin",
      email: "cio@apex-retail.example.com",
    });
    mockApexPersistedGoldenEvent();

    const event = await getSourcingEvent("apex-retail-ams-outsourcing-2026");

    expect(event?.id).toBe("522eedf2-ff6b-4307-b312-3e0903c6fd42");
    expect(event?.code).toBe("SRC-004");
    expect(event?.currentStageKey).toBe("bafo");
    expect(event?.valueLedger.updatedAt).toBe("2026-06-02T00:00:00.000Z");
    expect(event?.artifacts[0]?.updatedAt).toBe(
      "2026-06-02T00:00:00.000Z",
    );
    expect(canReadSourceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "apexretail" }),
      "apexretail",
      "522eedf2-ff6b-4307-b312-3e0903c6fd42",
    );
  });

  it("does not return seed events without an active client boundary", async () => {
    getActiveClientRow.mockResolvedValue(null);
    requireTenancy.mockRejectedValue(new Error("no client"));

    await expect(
      getSourcingEvent("apex-retail-ams-outsourcing-2026"),
    ).resolves.toBeNull();
  });

  it("resolves canonical artifact-code document links for event-code URLs", async () => {
    getActiveClientRow.mockResolvedValue({
      id: "client-apex",
      name: "Apex Retail Group",
      industry_code: "RETAIL",
      key: "apexretail",
    });
    requireTenancy.mockResolvedValue({
      clientId: "client-apex",
      clientKey: "apexretail",
      userId: "clerk:apex-cio",
      role: "client_admin",
      email: "cio@apex-retail.example.com",
    });
    mockApexPersistedGoldenEvent();

    const artifact = await getSourcingEventArtifact(
      "apex-retail-ams-outsourcing-2026",
      "d01_strategy_memo",
    );

    expect(artifact?.eventId).toBe("522eedf2-ff6b-4307-b312-3e0903c6fd42");
    expect(artifact?.title).toBe("Sourcing Strategy Memo");
    expect(artifact?.sections.length).toBeGreaterThan(0);
    expect(artifact?.governanceNotes.join(" ")).toContain("d01_strategy_memo");
    expect(getSourceArtifactRegistryRecord).not.toHaveBeenCalledWith(
      "d01_strategy_memo",
    );
  });
});
