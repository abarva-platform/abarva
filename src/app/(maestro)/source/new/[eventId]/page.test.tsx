import SourceNewEventPage from "./page";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";

jest.mock("next/navigation", () => ({
  notFound: () => { throw new Error("not_found"); },
}));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: jest.fn() }));
jest.mock("@/lib/auth/tenancy", () => ({ requireTenancy: jest.fn() }));
jest.mock("@/lib/source/queries", () => ({ getSourcingEventForResolvedClient: jest.fn() }));
jest.mock("@/lib/source/file-cabinet/repository", () => ({ listSourceArtifacts: jest.fn() }));
jest.mock("@/components/source/new-workspace/SourceNewWorkspace", () => ({
  SourceNewWorkspace: () => null,
}));

const client = { id: "client-id", key: "tenant-a", name: "Example client" };
const tenancy = { clientId: "client-id", clientKey: "tenant-a", userId: "user-id" };
const params = { params: Promise.resolve({ eventId: "event-1" }) };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getActiveClientRow).mockResolvedValue(client as never);
  jest.mocked(requireTenancy).mockResolvedValue(tenancy as never);
  jest.mocked(getSourcingEventForResolvedClient).mockResolvedValue(null);
  jest.mocked(listSourceArtifacts).mockResolvedValue([]);
});

describe("Source New event route authorization", () => {
  it("does not look up an event or files when tenant contexts disagree", async () => {
    jest.mocked(requireTenancy).mockResolvedValue({ ...tenancy, clientKey: "tenant-b" } as never);
    await expect(SourceNewEventPage(params)).rejects.toThrow("not_found");
    expect(getSourcingEventForResolvedClient).not.toHaveBeenCalled();
    expect(listSourceArtifacts).not.toHaveBeenCalled();
  });

  it("does not read files when the event policy declines the record", async () => {
    await expect(SourceNewEventPage(params)).rejects.toThrow("not_found");
    expect(getSourcingEventForResolvedClient).toHaveBeenCalledWith("event-1", {
      activeClientKey: "tenant-a",
      activeClientName: "Example client",
      tenancy,
    });
    expect(listSourceArtifacts).not.toHaveBeenCalled();
  });

  it("reads only the authorized event file cabinet", async () => {
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
    await SourceNewEventPage(params);
    expect(listSourceArtifacts).toHaveBeenCalledWith("event-1", "tenant-a", { includeHistory: true });
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
