import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  buildSourceEventStagePlanSnapshot,
  readSourceEventStagePlanSnapshot,
} from "./stage-plan-snapshot";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const getClient = getAzureReadFluentClient as jest.Mock;

function serve(data: Record<string, unknown> | null, error: { message: string } | null = null) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  const from = jest.fn().mockReturnValue(query);
  getClient.mockReturnValue({ from });
  return { from, query };
}

describe("Source event stage-plan snapshot", () => {
  beforeEach(() => jest.clearAllMocks());

  it("projects an event-owned immutable stage plan without a database write", async () => {
    const { from, query } = serve({
      id: "event-1",
      client_key: "tenant-1",
      current_stage_key: "rfp_rfi_package",
      lifecycle_state: "active",
      sourcing_motion: "contract_optimization",
      event_type: "renewal",
      classified_category: "saas_renewal",
      event_name: "Contract renewal",
      event_code: "EVT-1",
      trigger_description: "Renewal window",
    });

    const result = await readSourceEventStagePlanSnapshot("event-1", "tenant-1");

    expect(result.kind).toBe("available");
    if (result.kind !== "available") return;
    expect(result.snapshot.owner).toEqual({
      sourceEventId: "event-1",
      clientKey: "tenant-1",
    });
    expect(result.snapshot.currentStageKey).toBe("rfp");
    expect(result.snapshot.journey.id).toBe("contract_optimization");
    expect(result.snapshot.stages.map((stage) => stage.key)).toEqual([
      "strategy",
      "scope",
      "pricing",
      "bafo",
      "executive_decision",
      "transition",
      "value",
    ]);
    expect(result.snapshot.stages[2]).toEqual(
      expect.objectContaining({
        key: "pricing",
        status: "current",
      }),
    );
    expect(Object.isFrozen(result.snapshot)).toBe(true);
    expect(Object.isFrozen(result.snapshot.stages)).toBe(true);
    expect(Object.isFrozen(result.snapshot.stages[0])).toBe(true);
    expect(result.snapshot.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(from).toHaveBeenCalledWith("source_events");
    expect(query.eq).toHaveBeenCalledWith("id", "event-1");
    expect(query.eq).toHaveBeenCalledWith("client_key", "tenant-1");
    expect(query).not.toHaveProperty("insert");
    expect(query).not.toHaveProperty("update");
  });

  it("refuses to project a row from another tenant", async () => {
    serve({
      id: "event-1",
      client_key: "tenant-2",
      current_stage_key: "strategy",
      lifecycle_state: "active",
      sourcing_motion: "competitive_rfp",
      event_type: "sourcing",
      classified_category: "ams",
      event_name: "Market event",
      event_code: "EVT-1",
      trigger_description: null,
    });

    await expect(readSourceEventStagePlanSnapshot("event-1", "tenant-1")).resolves.toEqual({
      kind: "not_found",
    });
  });

  it("is deterministic for the same event state and changes when the plan changes", () => {
    const base = {
      id: "event-1",
      client_key: "tenant-1",
      current_stage_key: "scope",
      lifecycle_state: "active",
      sourcing_motion: "competitive_rfp",
      event_type: "sourcing",
      classified_category: "ams",
      event_name: "Market event",
      event_code: "EVT-1",
      trigger_description: "Competitive sourcing",
    };

    const first = buildSourceEventStagePlanSnapshot(base, "tenant-1");
    const second = buildSourceEventStagePlanSnapshot({ ...base }, "tenant-1");
    const changed = buildSourceEventStagePlanSnapshot(
      { ...base, sourcing_motion: "contract_optimization" },
      "tenant-1",
    );

    expect(first.kind).toBe("available");
    expect(second.kind).toBe("available");
    expect(changed.kind).toBe("available");
    if (first.kind !== "available" || second.kind !== "available" || changed.kind !== "available") {
      return;
    }
    expect(first.snapshot.contentHash).toBe(second.snapshot.contentHash);
    expect(changed.snapshot.contentHash).not.toBe(first.snapshot.contentHash);
  });

  it("fails closed when the row lacks event ownership or a valid stage", () => {
    expect(
      buildSourceEventStagePlanSnapshot(
        {
          id: "event-1",
          client_key: "",
          current_stage_key: "strategy",
          lifecycle_state: "active",
          sourcing_motion: "competitive_rfp",
          event_type: "sourcing",
          classified_category: "ams",
          event_name: "Market event",
          event_code: "EVT-1",
          trigger_description: null,
        },
        "tenant-1",
      ),
    ).toEqual({ kind: "unavailable" });

    expect(
      buildSourceEventStagePlanSnapshot(
        {
          id: "event-1",
          client_key: "tenant-1",
          current_stage_key: "not_a_stage",
          lifecycle_state: "active",
          sourcing_motion: "competitive_rfp",
          event_type: "sourcing",
          classified_category: "ams",
          event_name: "Market event",
          event_code: "EVT-1",
          trigger_description: null,
        },
        "tenant-1",
      ),
    ).toEqual({ kind: "unavailable" });
  });
});
