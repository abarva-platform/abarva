import type { NextRequest } from "next/server";
import { getActiveClientRow } from "@/lib/active-client";
import { getSourcingEvent } from "@/lib/source/queries";
import { readSourceScorecardAuthorityRecords } from "@/lib/source/proposal-intelligence/scorecard-authority-store";
import { GET } from "../route";

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({ userId: "user-1" })),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "unauthorized" }, { status: 401 })),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "tenant-1" })),
}));
jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: jest.fn(async () => ({ id: "event-1" })),
}));
jest.mock("@/lib/source/proposal-intelligence/scorecard-authority-store", () => ({
  readSourceScorecardAuthorityRecords: jest.fn(async () => ({
    kind: "available",
    criteria: [],
    scores: [],
  })),
}));

const activeClient = jest.mocked(getActiveClientRow);
const getEvent = jest.mocked(getSourcingEvent);
const readAuthority = jest.mocked(readSourceScorecardAuthorityRecords);

function request() {
  return new Request(
    "https://app.abarva.ai/api/v1/source/events/event-1/scorecard-authority",
  ) as NextRequest;
}

function context(eventId = "event-1") {
  return { params: Promise.resolve({ eventId }) };
}

describe("GET Source event scorecard authority", () => {
  beforeEach(() => {
    activeClient.mockClear();
    getEvent.mockClear();
    readAuthority.mockClear();
    activeClient.mockResolvedValue({ key: "tenant-1" } as never);
    getEvent.mockResolvedValue({ id: "event-1" } as never);
    readAuthority.mockResolvedValue({
      kind: "available",
      criteria: [],
      scores: [],
    });
  });

  it("reads authority only after the requested event resolves in the active tenant", async () => {
    const response = await GET(request(), context());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(getEvent).toHaveBeenCalledWith("event-1");
    expect(readAuthority).toHaveBeenCalledWith("event-1", "tenant-1");
    expect(await response.json()).toEqual(
      expect.objectContaining({
        eventId: "event-1",
        clientKey: "tenant-1",
        authority: expect.objectContaining({ state: "blocked" }),
      }),
    );
  });

  it("does not query authority for an absent or opposite-tenant event", async () => {
    getEvent.mockResolvedValueOnce(null);
    const response = await GET(request(), context("other-event"));
    expect(response.status).toBe(404);
    expect(readAuthority).not.toHaveBeenCalled();
  });

  it("fails closed when the schema or authority read is unavailable", async () => {
    readAuthority.mockResolvedValueOnce({ kind: "unavailable" });
    const response = await GET(request(), context());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "authority_unavailable" });
  });
});
