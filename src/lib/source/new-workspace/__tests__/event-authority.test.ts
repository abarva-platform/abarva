import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { readSourceEventAuthority } from "../event-authority";

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

describe("Source event authority read", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not infer an RFP motion from the legacy stage key", async () => {
    const { from, query } = serve({
      id: "event-1",
      client_key: "tenant-1",
      activation_state: "active_event",
      solicitation_motion: null,
      solicitation_motion_accepted_by_user_id: null,
      solicitation_motion_accepted_at: null,
      current_stage_key: "rfp",
    });

    await expect(readSourceEventAuthority("event-1", "tenant-1")).resolves.toEqual({
      kind: "available",
      activationState: "active_event",
      solicitationMotion: null,
      acceptedByUserId: null,
      acceptedAt: null,
    });
    expect(from).toHaveBeenCalledWith("source_events");
    expect(query.eq).toHaveBeenCalledWith("id", "event-1");
    expect(query.eq).toHaveBeenCalledWith("client_key", "tenant-1");
  });

  it("exposes only a recorded, accepted RFI motion on a pre-active request", async () => {
    serve({
      id: "event-2",
      client_key: "tenant-1",
      activation_state: "request",
      solicitation_motion: "rfi",
      solicitation_motion_accepted_by_user_id: "reviewer-1",
      solicitation_motion_accepted_at: "2026-09-18T18:00:00Z",
      current_stage_key: "rfp",
    });

    await expect(readSourceEventAuthority("event-2", "tenant-1")).resolves.toEqual({
      kind: "available",
      activationState: "request",
      solicitationMotion: "rfi",
      acceptedByUserId: "reviewer-1",
      acceptedAt: "2026-09-18T18:00:00Z",
    });
  });

  it("fails closed when an asserted motion lacks the named acceptance", async () => {
    serve({
      id: "event-3",
      client_key: "tenant-1",
      activation_state: "active_event",
      solicitation_motion: "rfp",
      solicitation_motion_accepted_by_user_id: null,
      solicitation_motion_accepted_at: null,
    });

    await expect(readSourceEventAuthority("event-3", "tenant-1")).resolves.toEqual({
      kind: "unavailable",
    });
  });

  it("distinguishes a successful empty read from an unavailable schema", async () => {
    serve(null);
    await expect(readSourceEventAuthority("missing", "tenant-1")).resolves.toEqual({
      kind: "not_found",
    });

    serve(null, { message: "column activation_state does not exist" });
    await expect(readSourceEventAuthority("event-1", "tenant-1")).resolves.toEqual({
      kind: "unavailable",
    });
  });

  it("does not return a row whose tenant differs from the requested tenant", async () => {
    serve({
      id: "event-4",
      client_key: "tenant-2",
      activation_state: "active_event",
      solicitation_motion: null,
      solicitation_motion_accepted_by_user_id: null,
      solicitation_motion_accepted_at: null,
    });

    await expect(readSourceEventAuthority("event-4", "tenant-1")).resolves.toEqual({
      kind: "not_found",
    });
  });
});
