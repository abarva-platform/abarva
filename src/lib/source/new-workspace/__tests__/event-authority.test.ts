import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { readSourceEventAuthority } from "../event-authority";
import { POST as acceptMotion } from "@/app/api/v1/source/[eventId]/solicitation-motion/accept/route";

const writeClientMock = jest.fn();
const requireTenancyMock = jest.fn();
const activeClientMock = jest.fn();
const policyMock = jest.fn();
const acceptMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
  getAzureWriteFluentClient: () => writeClientMock(),
}));
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () =>
    Response.json({ error: "forbidden" }, { status: 403 }),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => activeClientMock(),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) => policyMock(...args),
}));
jest.mock("@/lib/source/new-workspace/accept-solicitation-motion", () => ({
  acceptSolicitationMotion: (...args: unknown[]) => acceptMock(...args),
}));
jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

const acceptanceService = jest.requireActual(
  "@/lib/source/new-workspace/accept-solicitation-motion",
) as typeof import("@/lib/source/new-workspace/accept-solicitation-motion");

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

  // The case above blanks BOTH acceptance fields, so it is satisfied by either
  // half of the acceptance branch on its own: relaxing only the accepting-user
  // half, or only the acceptance-time half, leaves it green. These two cases
  // pin each half separately, so the gate cannot be half-removed unnoticed.
  it("fails closed when a motion records an acceptance time but no accepting user", async () => {
    serve({
      id: "event-3a",
      client_key: "tenant-1",
      activation_state: "active_event",
      solicitation_motion: "rfp",
      solicitation_motion_accepted_by_user_id: null,
      solicitation_motion_accepted_at: "2026-09-18T18:00:00Z",
    });

    await expect(readSourceEventAuthority("event-3a", "tenant-1")).resolves.toEqual({
      kind: "unavailable",
    });
  });

  it("fails closed when a motion records an accepting user but no acceptance time", async () => {
    serve({
      id: "event-3b",
      client_key: "tenant-1",
      activation_state: "active_event",
      solicitation_motion: "rfi",
      solicitation_motion_accepted_by_user_id: "reviewer-1",
      solicitation_motion_accepted_at: null,
    });

    await expect(readSourceEventAuthority("event-3b", "tenant-1")).resolves.toEqual({
      kind: "unavailable",
    });
  });

  // Whitespace is not acceptance. Without this, a row whose acceptance columns
  // hold a blank string reads as accepted by any check that tests presence
  // rather than content.
  it("does not accept a whitespace-only acceptance field as acceptance", async () => {
    serve({
      id: "event-3c",
      client_key: "tenant-1",
      activation_state: "active_event",
      solicitation_motion: "rfp",
      solicitation_motion_accepted_by_user_id: "   ",
      solicitation_motion_accepted_at: "2026-09-18T18:00:00Z",
    });

    await expect(readSourceEventAuthority("event-3c", "tenant-1")).resolves.toEqual({
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

const motionEventId = "11111111-1111-4111-8111-111111111111";
const motionContext = { params: Promise.resolve({ eventId: motionEventId }) };

function motionRequest(
  body: Record<string, unknown> = { motion: "rfp", confirmed: true },
): Request {
  return new Request(
    "https://app.example.test/api/v1/source/event/solicitation-motion/accept",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

describe("solicitation motion acceptance route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancyMock.mockResolvedValue({
      clientKey: "meridian-health",
      userId: "actor-1",
    });
    activeClientMock.mockResolvedValue({ key: "meridian" });
    policyMock.mockResolvedValue({
      canApproveSourceStages: true,
      accessLevel: "client_admin",
    });
    acceptMock.mockResolvedValue({
      ok: true,
      motion: "rfp",
      acceptedAt: "2026-10-06T20:00:00Z",
    });
  });

  it("takes the tenant and actor from the signed-in session, not the request body", async () => {
    const response = await acceptMotion(
      motionRequest({
        motion: "rfp",
        confirmed: true,
        clientKey: "other",
        actorUserId: "forged",
      }),
      motionContext,
    );
    expect(response.status).toBe(201);
    expect(acceptMock).toHaveBeenCalledWith({
      eventId: motionEventId,
      clientKey: "meridian",
      actorUserId: "actor-1",
      isClientAdmin: true,
      motion: "rfp",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/source/new/${motionEventId}`,
    );
  });

  it("requires an explicit confirmation and a valid motion", async () => {
    expect(
      (await acceptMotion(motionRequest({ motion: "rfp" }), motionContext))
        .status,
    ).toBe(400);
    expect(
      (
        await acceptMotion(
          motionRequest({ motion: "rfx", confirmed: true }),
          motionContext,
        )
      ).status,
    ).toBe(400);
    expect(acceptMock).not.toHaveBeenCalled();
  });

  it("refuses a different active tenant or missing approval right", async () => {
    activeClientMock.mockResolvedValue({ key: "lakeshore" });
    expect((await acceptMotion(motionRequest(), motionContext)).status).toBe(
      403,
    );
    activeClientMock.mockResolvedValue({ key: "meridian" });
    policyMock.mockResolvedValue({
      canApproveSourceStages: false,
      accessLevel: "source_member",
    });
    expect((await acceptMotion(motionRequest(), motionContext)).status).toBe(
      403,
    );
    expect(acceptMock).not.toHaveBeenCalled();
  });

  it("returns a conflict without implying that a motion was accepted", async () => {
    acceptMock.mockResolvedValue({ ok: false, code: "already_accepted" });
    const response = await acceptMotion(motionRequest(), motionContext);
    expect(response.status).toBe(409);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("solicitation motion conditional persistence", () => {
  const event = {
    id: motionEventId,
    client_key: "meridian",
    activation_state: "active_event",
    current_stage_key: "rfp",
    created_by_user_id: "actor-1",
    solicitation_motion: null,
    solicitation_motion_accepted_by_user_id: null,
    solicitation_motion_accepted_at: null,
  };
  let chain: {
    select: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
    is: jest.Mock;
    update: jest.Mock;
    maybeSingle: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    chain = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      is: jest.fn(),
      update: jest.fn(),
      maybeSingle: jest.fn(),
    };
    for (const key of ["select", "eq", "in", "is", "update"] as const)
      chain[key].mockReturnValue(chain);
    chain.maybeSingle
      .mockResolvedValueOnce({ data: event, error: null })
      .mockResolvedValueOnce({
        data: {
          solicitation_motion: "rfp",
          solicitation_motion_accepted_by_user_id: "actor-1",
          solicitation_motion_accepted_at: "2026-10-06T20:00:00Z",
        },
        error: null,
      });
    writeClientMock.mockReturnValue({ from: jest.fn(() => chain) });
  });

  const input = {
    eventId: motionEventId,
    clientKey: "meridian-health",
    actorUserId: "actor-1",
    isClientAdmin: true,
    motion: "rfp" as const,
  };

  it("accepts an alias-keyed event once using a null-motion compare-and-set", async () => {
    await expect(
      acceptanceService.acceptSolicitationMotion(input),
    ).resolves.toMatchObject({ ok: true, motion: "rfp" });
    expect(chain.in).toHaveBeenCalledWith(
      "client_key",
      expect.arrayContaining(["meridian"]),
    );
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        solicitation_motion: "rfp",
        solicitation_motion_accepted_by_user_id: "actor-1",
      }),
    );
    expect(chain.is).toHaveBeenCalledWith("solicitation_motion", null);
    expect(chain.eq).toHaveBeenCalledWith("client_key", "meridian");
    expect(chain.eq).toHaveBeenCalledWith("current_stage_key", "rfp");
  });

  it("refuses wrong tenant, stage, inactive event, prior acceptance and a non-owner member", async () => {
    for (const changed of [
      { client_key: "lakeshore" },
      { current_stage_key: "strategy" },
      { activation_state: "closed_request" },
      { solicitation_motion: "rfi" },
    ]) {
      chain.maybeSingle
        .mockReset()
        .mockResolvedValueOnce({ data: { ...event, ...changed }, error: null });
      expect((await acceptanceService.acceptSolicitationMotion(input)).ok).toBe(
        false,
      );
    }
    chain.maybeSingle.mockReset().mockResolvedValueOnce({
      data: { ...event, created_by_user_id: "another-user" },
      error: null,
    });
    await expect(
      acceptanceService.acceptSolicitationMotion({
        ...input,
        isClientAdmin: false,
      }),
    ).resolves.toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("refuses a lost conditional-write race", async () => {
    chain.maybeSingle
      .mockReset()
      .mockResolvedValueOnce({ data: event, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    await expect(
      acceptanceService.acceptSolicitationMotion(input),
    ).resolves.toEqual({
      ok: false,
      code: "stale_decision",
    });
  });
});
