import { commitSourceEventTool } from "../tools/source/commitSourceEvent";
import { createSourcingEvent, isUuid } from "@/lib/source/queries";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";

jest.mock("@/lib/source/queries", () => ({
  createSourcingEvent: jest.fn(),
  isUuid: (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
}));
jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(),
}));

const insertParticipant = jest.fn();
const input = {
  event_name: "Synthetic source request",
  event_type: "software" as const,
  trigger_description: "Review an upcoming renewal",
};
const context = {
  request: new Request("http://localhost/source"),
  surface: "/source",
  clientKey: "synthetic",
  userId: "00000000-0000-4000-8000-000000000001",
  accessPolicy: {
    accessLevel: "source_member",
    programIdsAllowed: null,
    canViewFinancialData: false,
    canCreateSourceEvents: true,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(createSourcingEvent).mockResolvedValue({
    id: "event-1",
    event_code: "SRC-1",
    event_name: input.event_name,
    lifecycle_state: "request",
  } as Awaited<ReturnType<typeof createSourcingEvent>>);
  insertParticipant.mockResolvedValue({ ok: true });
  jest.mocked(selectSourceWriteAdapter).mockReturnValue({
    insertParticipant,
  } as unknown as ReturnType<typeof selectSourceWriteAdapter>);
});

it("assigns the named event creator through the tenant-selected participant adapter", async () => {
  expect(isUuid(context.userId)).toBe(true);
  const result = await commitSourceEventTool.handler(input, context);

  expect(result).toEqual({ success: true, data: expect.anything() });
  expect(selectSourceWriteAdapter).toHaveBeenCalledWith(undefined, "synthetic");
  expect(insertParticipant).toHaveBeenCalledWith({
    clientKey: "synthetic",
    sourceEventId: "event-1",
    userId: "00000000-0000-4000-8000-000000000001",
  });
  if (result.success) {
    expect(result.data.approval_authority).toMatch(/Event Owner/);
    expect(result.data.approval_authority).not.toMatch(/co-sign|tenant admin/i);
  }
});

it("does not create an ownerless event", async () => {
  const result = await commitSourceEventTool.handler(input, {
    ...context,
    userId: undefined,
  });

  expect(result.success).toBe(false);
  expect(createSourcingEvent).not.toHaveBeenCalled();
  expect(insertParticipant).not.toHaveBeenCalled();
});

it("does not persist a Clerk fallback id as an unreadable owner", async () => {
  const result = await commitSourceEventTool.handler(input, {
    ...context,
    userId: "clerk:unprovisioned",
  });

  expect(result.success).toBe(false);
  expect(createSourcingEvent).not.toHaveBeenCalled();
  expect(insertParticipant).not.toHaveBeenCalled();
});

it("does not create an event without a resolved tenant", async () => {
  const result = await commitSourceEventTool.handler(input, {
    ...context,
    clientKey: undefined,
  });

  expect(result.success).toBe(false);
  expect(createSourcingEvent).not.toHaveBeenCalled();
  expect(insertParticipant).not.toHaveBeenCalled();
});

it("does not report success when the creator assignment fails", async () => {
  insertParticipant.mockResolvedValueOnce({ ok: false, error: "write failed" });

  const result = await commitSourceEventTool.handler(input, context);

  expect(result.success).toBe(false);
  expect(insertParticipant).toHaveBeenCalledTimes(1);
});
