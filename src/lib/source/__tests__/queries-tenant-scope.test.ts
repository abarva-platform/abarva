import { getSourcingEvent, listSourcingEvents } from "../queries";

const mockSourceEventsAdapter = {
  getPendingEventsForClient: jest.fn(),
  getActiveEventsForClient: jest.fn(),
  getEventByIdForClient: jest.fn(),
  getEventByCodeForClient: jest.fn(),
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

describe("listSourcingEvents tenant scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockRejectedValue(
      new Error("no request tenancy in unit test"),
    );
    mockEmptySourceEventsTable();
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

  it("uses the same tenant-scoped seed fallback if the persisted overlay query fails", async () => {
    const order = jest
      .fn()
      .mockResolvedValue({
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
    expect(canReadSourceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "meridian" }),
      "meridian",
      "apex-retail-ams-outsourcing-2026",
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
            updated_at: "2026-06-02T00:00:00.000Z",
          };
        }
        return null;
      },
    );

    const event = await getSourcingEvent("apex-retail-ams-outsourcing-2026");

    expect(event?.id).toBe("522eedf2-ff6b-4307-b312-3e0903c6fd42");
    expect(event?.code).toBe("SRC-004");
    expect(event?.currentStageKey).toBe("bafo");
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
});
