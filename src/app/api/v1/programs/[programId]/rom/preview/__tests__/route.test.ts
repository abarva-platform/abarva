// POST /api/v1/programs/:programId/rom/preview — fences, flag, refusals.
//
// The ROM engine, the workbook builder and the committed reference pack run
// for real here; only tenancy, the Move read and the access policy are
// mocked. The flag is the real registry entry: the synthetic demo tenant is
// enrolled and another tenant is not.

import ExcelJS from "exceljs";
import { NextRequest } from "next/server";

const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadPolicy = jest.fn();
const mockCreateLoaders = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    if (err && typeof err === "object" && "tenancyStatus" in err) {
      return Response.json(
        { error: "unauthorized", detail: "Sign in again." },
        { status: 401 },
      );
    }
    throw err;
  },
}));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) =>
    mockLoadPolicy(ctx, opts),
}));
jest.mock("@/lib/pricing/moves-workflow/rom-reference", () => {
  const actual = jest.requireActual(
    "@/lib/pricing/moves-workflow/rom-reference",
  );
  return {
    ...actual,
    createCommittedRomReferenceLoaders: (...args: unknown[]) =>
      mockCreateLoaders(...args),
  };
});

import { POST } from "../route";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { computeRom } from "@/lib/pricing/moves-workflow/rom-service";

const actualReference = jest.requireActual(
  "@/lib/pricing/moves-workflow/rom-reference",
) as typeof import("@/lib/pricing/moves-workflow/rom-reference");

const DEMO_CTX = {
  clientId: "client-1",
  clientKey: "meridian",
  userId: "11111111-1111-4111-8111-111111111111",
};
const OTHER_CTX = { ...DEMO_CTX, clientKey: "apexretail" };
const params = Promise.resolve({ programId: "prog-1" });

const UNIT = (value: number) => ({
  value,
  source: "test: invented unit hours",
  confidence: "low",
});

function structure(): Record<string, unknown> {
  return {
    useCases: [
      {
        code: "UC-A",
        name: "A",
        counts: {
          data_source_count: 2,
          source_table_count: 10,
          dashboard_view_count: 1,
        },
      },
      {
        code: "UC-B",
        name: "B",
        counts: { data_source_count: 1, design_row_count: 80 },
      },
    ],
    unitHours: {
      data_source_count: UNIT(16),
      source_table_count: UNIT(3),
      dashboard_view_count: UNIT(20),
      design_row_count: UNIT(0.5),
    },
    releases: [
      {
        code: "R1",
        name: "One",
        designStatus: "not_designed",
        useCaseCodes: ["UC-A"],
      },
      {
        code: "R2",
        name: "Two",
        designStatus: "not_designed",
        useCaseCodes: ["UC-B"],
      },
    ],
    foundation: {
      code: "F",
      name: "Foundation",
      designStatus: "not_designed",
      counts: { data_source_count: 3 },
    },
    pod: {
      members: [
        { roleCode: "ROL-029", levelCode: "LVL-07", fte: 1 },
        { roleCode: "ROL-037", levelCode: "LVL-07", fte: 2 },
      ],
      locationCode: "LOC-CHICAGO",
      rateBasis: "loaded_cost",
    },
    friction: { value: 1.1, source: "test: invented friction" },
    productiveShare: { value: 0.8, source: "test: invented share" },
    hoursPerFteWeek: { value: 40, source: "test: invented week" },
  };
}

function req(body: unknown, query = ""): NextRequest {
  return new NextRequest(
    `http://test/api/v1/programs/prog-1/rom/preview${query}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(DEMO_CTX);
  mockGetProgramById.mockResolvedValue({ id: "prog-1", name: "Move" });
  mockLoadPolicy.mockResolvedValue({
    accessLevel: "program_member",
    programIdsAllowed: ["prog-1"],
  });
  mockCreateLoaders.mockImplementation(() =>
    actualReference.createCommittedRomReferenceLoaders(),
  );
});

describe("POST .../rom/preview — success", () => {
  it("returns the computed ROM and writes nothing", async () => {
    const res = await POST(req(structure()), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    const expected = computeRom(
      structure(),
      actualReference.createCommittedRomReferenceLoaders(),
    );
    if (!expected.ok) throw new Error(expected.message);
    expect(body).toMatchObject({
      ok: true,
      programId: "prog-1",
      writes: false,
    });
    expect(body.rom.total.planCents).toBe(expected.total.planCents);
    expect(body.rom.total.naiveSumCents - body.rom.total.planCents).toBe(
      expected.foundation!.priced.range.planCents,
    );
    expect(body.rom.productivityCreditApplied).toBe(false);
    expect(mockLoadPolicy).toHaveBeenCalledWith(DEMO_CTX, {
      programId: "prog-1",
    });
  });

  it("returns the live-formula workbook with ?format=xlsx", async () => {
    const res = await POST(req(structure(), "?format=xlsx"), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="rom-preview-prog-1.xlsx"',
    );
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await res.arrayBuffer());
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      "Estimate",
      "Component Library",
      "Pod & Rates",
      "Releases",
      "Assumptions",
    ]);
  });
});

describe("POST .../rom/preview — fences", () => {
  it("maps a tenancy failure through the tenancy responder before anything else", async () => {
    mockRequireTenancy.mockRejectedValue({ tenancyStatus: 401 });
    const res = await POST(req(structure()), { params });
    expect(res.status).toBe(401);
    expect(mockGetProgramById).not.toHaveBeenCalled();
  });

  it("is off for a tenant the flag does not enrol, before the Move is read", async () => {
    mockRequireTenancy.mockResolvedValue(OTHER_CTX);
    const res = await POST(req(structure()), { params });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: "not_enabled",
      detail: "ROM previews are not enabled for this workspace.",
    });
    expect(mockGetProgramById).not.toHaveBeenCalled();
  });

  it("answers an unreadable Move with the cause-blind refusal, before the policy", async () => {
    mockGetProgramById.mockResolvedValue(null);
    const res = await POST(req(structure()), { params });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(moveUnreadableRefusalBody());
    expect(mockGetProgramById).toHaveBeenCalledWith(DEMO_CTX, "prog-1");
    expect(mockLoadPolicy).not.toHaveBeenCalled();
  });

  it.each([
    [
      "no program access",
      { accessLevel: "no_program_access", programIdsAllowed: null },
    ],
    [
      "a grant list without this Move",
      { accessLevel: "program_member", programIdsAllowed: ["prog-2"] },
    ],
  ])("refuses %s with a sentence", async (_label, policy) => {
    mockLoadPolicy.mockResolvedValue(policy);
    const res = await POST(req(structure()), { params });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
    expect(body.detail).toMatch(/does not include ROM previews/);
  });

  it("admits an all-Moves grant", async () => {
    mockLoadPolicy.mockResolvedValue({
      accessLevel: "client_admin",
      programIdsAllowed: null,
    });
    expect((await POST(req(structure()), { params })).status).toBe(200);
  });
});

describe("POST .../rom/preview — refusals carry a sentence", () => {
  it("refuses a body that is not JSON", async () => {
    const res = await POST(req("{not json"), { params });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "invalid_body",
      detail: "The request body must be a JSON ROM structure.",
    });
  });

  it("refuses an unknown format", async () => {
    const res = await POST(req(structure(), "?format=csv"), { params });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "invalid_format",
      detail: "The format must be json or xlsx.",
    });
  });

  it("refuses missing unit hours with the engine's own sentence", async () => {
    const s = structure();
    delete (s.unitHours as Record<string, unknown>).design_row_count;
    const res = await POST(req(s), { params });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("unit_hours_missing");
    expect(body.detail).toContain(
      "No unit hours were given for design_row_count",
    );
  });

  it("reports a missing reference pack as such", async () => {
    // A fresh module instance, so no loader set is cached from earlier cases.
    let freshPOST: typeof POST = POST;
    jest.isolateModules(() => {
      freshPOST = (jest.requireActual("../route") as { POST: typeof POST })
        .POST;
    });
    mockCreateLoaders.mockImplementation(() =>
      actualReference.createCommittedRomReferenceLoaders(
        "/nonexistent/rom-pack",
      ),
    );
    jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await freshPOST(req(structure()), { params });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("reference_unavailable");
    expect(body.detail).toMatch(
      /cost foundation reference data could not be read/,
    );
    // The failed loader set is not cached: the next request reads the pack again.
    mockCreateLoaders.mockImplementation(() =>
      actualReference.createCommittedRomReferenceLoaders(),
    );
    expect((await freshPOST(req(structure()), { params })).status).toBe(200);
    expect(mockCreateLoaders).toHaveBeenCalledTimes(2);
  });

  it("answers an unexpected failure with a sentence, not a bare code", async () => {
    mockGetProgramById.mockRejectedValue(new Error("connection reset"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req(structure()), { params });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "internal_error",
      detail:
        "The ROM preview failed unexpectedly. Nothing was saved. Try again.",
    });
  });
});
