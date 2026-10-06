import SourceNewEventPage from "./page";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import { readSourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

jest.mock("next/navigation", () => ({
  notFound: () => { throw new Error("not_found"); },
}));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: jest.fn() }));
jest.mock("@/lib/auth/tenancy", () => ({ requireTenancy: jest.fn() }));
jest.mock("@/lib/source/queries", () => ({ getSourcingEventForResolvedClient: jest.fn() }));
jest.mock("@/lib/source/file-cabinet/repository", () => ({ listSourceArtifacts: jest.fn() }));
jest.mock("@/lib/source/new-workspace/stage05-nda-coverage", () => ({
  readSourceNewStage05NdaCoverage: jest.fn(),
}));
// The authority read itself is NOT mocked: the point of the case below is that
// the real `resolveAuthority` decides, and the page carries its decision.
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));
jest.mock("@/components/source/new-workspace/SourceNewWorkspace", () => ({
  SourceNewWorkspace: () => null,
}));

// A chainable stand-in for the read client. The page reads several tables
// through it; only `source_events` is the subject here, so every other table
// answers an empty, successful read rather than throwing and turning an
// unrelated reader into this case's failure.
function serveAuthorityRow(row: Record<string, unknown> | null) {
  const chain = (result: { data: unknown; error: null }) => {
    const self: Record<string, unknown> = {};
    const passthrough = () => self;
    for (const method of [
      "select",
      "eq",
      "in",
      "neq",
      "is",
      "order",
      "limit",
      "range",
      "filter",
      "not",
      "gte",
      "lte",
    ]) {
      self[method] = jest.fn(passthrough);
    }
    self.maybeSingle = jest.fn().mockResolvedValue(result);
    self.single = jest.fn().mockResolvedValue(result);
    // Awaiting the builder itself is how the list reads resolve.
    self.then = (
      resolve: (value: { data: unknown; error: null }) => unknown,
    ) => Promise.resolve(result).then(resolve);
    return self;
  };

  jest.mocked(getAzureReadFluentClient).mockReturnValue({
    from: jest.fn((table: string) =>
      table === "source_events"
        ? chain({ data: row, error: null })
        : chain({ data: [], error: null }),
    ),
  } as never);
}

const governedEvent = {
  id: "event-1",
  code: "SRC-1",
  name: "Example event",
  eventType: "managed_service",
  archetype: "Managed service",
  classifiedCategory: null,
  currentStageKey: "rfp",
  status: "active",
  triggerDescription: null,
  scopeDescription: null,
  decisionOwner: null,
  valueLedger: {
    updatedAt: "2026-03-10T00:00:00Z",
    projected: [],
    realized: [],
  },
};

const client = { id: "client-id", key: "tenant-a", name: "Example client" };
const tenancy = { clientId: "client-id", clientKey: "tenant-a", userId: "user-id" };
const params = { params: Promise.resolve({ eventId: "event-1" }) };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getActiveClientRow).mockResolvedValue(client as never);
  jest.mocked(requireTenancy).mockResolvedValue(tenancy as never);
  jest.mocked(getSourcingEventForResolvedClient).mockResolvedValue(null);
  jest.mocked(listSourceArtifacts).mockResolvedValue([]);
  // Default: no authority row. Every pre-existing case ran against a read that
  // could not answer, and must keep doing so — only the two cases that set a
  // row below are asking the authority anything.
  serveAuthorityRow(null);
  jest.mocked(readSourceNewStage05NdaCoverage).mockResolvedValue({
    status: "empty",
    asOf: "2026-03-10",
    suppliers: [],
    nextAction: {
      label: "Accept candidate panel",
      detail: "No accepted suppliers.",
    },
  });
});

describe("Source New event route authorization", () => {
  it("does not look up an event or files when tenant contexts disagree", async () => {
    jest.mocked(requireTenancy).mockResolvedValue({ ...tenancy, clientKey: "tenant-b" } as never);
    await expect(SourceNewEventPage(params)).rejects.toThrow("not_found");
    expect(getSourcingEventForResolvedClient).not.toHaveBeenCalled();
    expect(listSourceArtifacts).not.toHaveBeenCalled();
    expect(readSourceNewStage05NdaCoverage).not.toHaveBeenCalled();
  });

  it("does not read files when the event policy declines the record", async () => {
    await expect(SourceNewEventPage(params)).rejects.toThrow("not_found");
    expect(getSourcingEventForResolvedClient).toHaveBeenCalledWith("event-1", {
      activeClientKey: "tenant-a",
      activeClientName: "Example client",
      tenancy,
    });
    expect(listSourceArtifacts).not.toHaveBeenCalled();
    expect(readSourceNewStage05NdaCoverage).not.toHaveBeenCalled();
  });

  it("reads only the authorized event file cabinet", async () => {
    const todayUtc = new Date().toISOString().slice(0, 10);
    jest.mocked(getSourcingEventForResolvedClient).mockResolvedValue({
      id: "event-1",
      code: "SRC-1",
      name: "Example event",
      eventType: "managed_service",
      archetype: "Managed service",
      classifiedCategory: null,
      currentStageKey: "strategy",
      status: "waiting_on_client",
      triggerDescription: null,
      scopeDescription: null,
      decisionOwner: null,
      valueLedger: {
        updatedAt: "2026-03-10T00:00:00Z",
        projected: [],
        realized: [],
      },
    } as never);
    const demoPage = await SourceNewEventPage({
      ...params,
      searchParams: Promise.resolve({ demo: "1" }),
    });
    expect(demoPage.props.demoMode).toBe(true);
    const governedPage = await SourceNewEventPage(params);
    expect(governedPage.props.demoMode).toBe(false);
    expect(governedPage.props.event.asOfDate).toBe("2026-03-10");
    expect(listSourceArtifacts).toHaveBeenCalledWith(
      "event-1",
      { tenantKey: "tenant-a" },
      { includeHistory: true },
    );
    expect(readSourceNewStage05NdaCoverage).toHaveBeenCalledWith({
      clientKey: "tenant-a",
      eventId: "event-1",
      asOf: todayUtc,
    });
  });

  // C-580: `sourceNewMarketPackageLabel` now requires the acceptance fields,
  // but the reason the component never sees an unaccepted motion in production
  // is this mapping. Asserted here so the fence and the mapping are proven on
  // the real page rather than left as an argument about two other files.
  it("hands the workspace no solicitation motion when the recorded one was never accepted", async () => {
    jest.mocked(getSourcingEventForResolvedClient).mockResolvedValue(
      governedEvent as never,
    );
    serveAuthorityRow({
      id: "event-1",
      client_key: "tenant-a",
      activation_state: "active_event",
      solicitation_motion: "rfp",
      solicitation_motion_accepted_by_user_id: null,
      solicitation_motion_accepted_at: "2026-03-12T00:00:00Z",
    });

    const page = await SourceNewEventPage(params);

    expect(page.props.event.solicitationMotion).toBeNull();
    expect(page.props.event.solicitationMotionAcceptedAt).toBeNull();
    expect(page.props.event.solicitationMotionAcceptedByUserId).toBeNull();
  });

  // The negative control for the case above: with the acceptance recorded, the
  // same mapping passes the motion through. Without this, a page that dropped
  // every motion unconditionally would satisfy the assertion above.
  it("hands the workspace an accepted solicitation motion with the acceptance that qualified it", async () => {
    jest.mocked(getSourcingEventForResolvedClient).mockResolvedValue(
      governedEvent as never,
    );
    serveAuthorityRow({
      id: "event-1",
      client_key: "tenant-a",
      activation_state: "active_event",
      solicitation_motion: "rfp",
      solicitation_motion_accepted_by_user_id: "reviewer-1",
      solicitation_motion_accepted_at: "2026-03-12T00:00:00Z",
    });

    const page = await SourceNewEventPage(params);

    expect(page.props.event.solicitationMotion).toBe("rfp");
    expect(page.props.event.solicitationMotionAcceptedAt).toBe(
      "2026-03-12T00:00:00Z",
    );
    expect(page.props.event.solicitationMotionAcceptedByUserId).toBe(
      "reviewer-1",
    );
  });

  it("does not turn an artifact read failure into an empty folder", async () => {
    jest.mocked(getSourcingEventForResolvedClient).mockResolvedValue({
      id: "event-1",
      code: "SRC-1",
      name: "Example event",
      eventType: "managed_service",
      archetype: "Managed service",
      classifiedCategory: null,
      currentStageKey: "strategy",
      status: "waiting_on_client",
      triggerDescription: null,
      scopeDescription: null,
      decisionOwner: null,
      valueLedger: {
        updatedAt: "2026-03-10T00:00:00Z",
        projected: [],
        realized: [],
      },
    } as never);
    jest.mocked(listSourceArtifacts).mockRejectedValue(new Error("artifact_read_failed"));
    await expect(SourceNewEventPage(params)).rejects.toThrow("artifact_read_failed");
  });
});
