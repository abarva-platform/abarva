/**
 * GET /api/v1/programs/:programId/mobilization-plan — the P5 plan workbook.
 *
 * Pinned: the ladder (tenancy → flag → Move → access → approved estimate →
 * recompute on its own rates) with nothing read past a refusal and an authored
 * sentence on every refusal; the workbook carries the Move's own P4
 * milestones, P3 owners and open register rows; a part that cannot be read is
 * named, not filled. Only I/O boundaries are mocked; the engine and the
 * workbook run for real. SYNTHETIC data.
 */
jest.mock("server-only", () => ({}));

const mockRequireTenancy = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockLoadPolicy = jest.fn();
const mockReadApproved = jest.fn();
const mockMatches = jest.fn();
const mockLoaders = jest.fn();
const mockRegister = jest.fn();

jest.mock("@/lib/auth/tenancy", () => {
  class TenancyError extends Error {
    constructor(public readonly code: string) { super(code); }
  }
  return {
    TenancyError,
    requireTenancy: () => mockRequireTenancy(),
    tenancyErrorResponse: (err: unknown) => {
      if (err instanceof TenancyError) return Response.json({ error: err.code }, { status: 401 });
      throw err;
    },
  };
});
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: (ctx: unknown, key: string) => mockIsFeatureEnabled(ctx, key) }));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
  getModuleState: (...args: unknown[]) => mockGetModuleState(...args),
}));
jest.mock("@/lib/programs/programs-auth-mode-server", () => ({ getProgramsRouteSupabase: async () => ({ supabase: {} }) }));
jest.mock("@/lib/auth/program-access-policy", () => ({ loadUserProgramAccessPolicy: (...args: unknown[]) => mockLoadPolicy(...args) }));
jest.mock("@/lib/pricing/moves-workflow/approved-rom-snapshot", () => ({
  readApprovedRomSnapshot: (...args: unknown[]) => mockReadApproved(...args),
  previewMatchesApproval: (...args: unknown[]) => mockMatches(...args),
}));
jest.mock("@/lib/deliverables/orchestrator/reference-deck-workbook", () => ({ approvedRomLoaders: (...args: unknown[]) => mockLoaders(...args) }));
jest.mock("@/app/api/v1/programs/[programId]/assumptions/route", () => ({ GET: (...args: unknown[]) => mockRegister(...args) }));
jest.mock("@/app/api/v1/programs/[programId]/phase-capture/route", () => ({ GET: jest.fn() }));

import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { TenancyError } from "@/lib/auth/tenancy";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { phaseCaptureModuleKey } from "@/lib/programs/phase-capture-contract";
import { P4_ROADMAP_PLAN_KEY } from "@/lib/programs/p4-roadmap-plan";
import { MOBILIZATION_PLAN_REFUSAL } from "@/lib/programs/mobilization-plan/refusals";
import { MOBILIZATION_PLAN_CONTENT_TYPE, MOBILIZATION_PLAN_SHEETS } from "@/lib/programs/mobilization-plan/workbook";
import { golden, LOADERS } from "@/testing/fixtures/synthetic-rom-estimate";

const MOVE = "move-synthetic";
const call = () => GET(new NextRequest(`http://localhost/api/v1/programs/${MOVE}/mobilization-plan`), { params: Promise.resolve({ programId: MOVE }) });
const captured = (phase: number, key: string, value: string) => ({ moduleKey: phaseCaptureModuleKey(phase, key), state: { value } });

const ROADMAP = JSON.stringify({ kind: P4_ROADMAP_PLAN_KEY, version: 1, milestones: [{
  id: "MS-1", name: "Owners briefed", workstream: "Adoption", ownerRole: "Operations lead", plannedWindow: "Weeks 2–3",
  timingBasis: "[A:V1]", dependsOn: [], dependencyNotes: "None apply", dependenciesReviewed: true, reviewed: true,
}] });
const ADOPTION = JSON.stringify({ kind: "operating_adoption", version: 1, ownersAcceptedAt: "2026-10-09T10:00:00Z", answers: [], rows: [
  { rowId: "RC-1", source: "step1", name: "Intake checks", owner: { name: "Intake lead", writtenBy: "you" }, rights: { certifies: { value: true, writtenBy: "you" } } },
] });

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({ clientKey: "synthetic", clientId: "client-1", userId: "user-1" });
  mockIsFeatureEnabled.mockReturnValue(true);
  mockGetProgramById.mockResolvedValue({ id: MOVE, name: "Synthetic claims review" });
  mockLoadPolicy.mockResolvedValue({ accessLevel: "full", programIdsAllowed: null });
  mockReadApproved.mockResolvedValue({ status: "approved", snapshot: {
    id: "synthetic-approved-estimate", approvedAt: "2026-10-10T10:00:00Z", result: {}, workbookHref: "", workbookStructure: golden(),
  } });
  mockMatches.mockReturnValue(true);
  mockLoaders.mockResolvedValue(LOADERS);
  mockGetModuleState.mockResolvedValue([
    captured(4, P4_ROADMAP_PLAN_KEY, ROADMAP),
    captured(3, "operating_adoption", ADOPTION),
    captured(5, "launch_readiness", "Access approved; Owners named"),
  ]);
  mockRegister.mockResolvedValue(Response.json({ ok: true, assumptions: [
    { id: "V1", statement: "Rework rate holds", status: "open", ownerRole: "Finance partner", source: "Synthetic notes" },
    { id: "V2", statement: "Volume is stable", status: "confirmed", ownerRole: "Ops lead", source: "Synthetic notes" },
  ] }));
});

async function workbookOf(response: Response) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook;
}

describe("GET mobilization-plan", () => {
  it("returns the plan workbook built from the Move's own records", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(MOBILIZATION_PLAN_CONTENT_TYPE);
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="move-mobilization-plan.xlsx"');
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const workbook = await workbookOf(response);
    const plan = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.plan)!;
    const ids = [5, 6, 7, 8].map((row) => plan.getCell(row, 1).value);
    expect(ids).toEqual(["EST-F", "EST-R1", "EST-R2", "MS-1"]);
    expect(plan.getCell(8, 3).value).toBe("Owners briefed");
    expect(workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.owners)!.getCell("B5").value).toBe("Intake lead");
    const risks = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.risks)!;
    expect([risks.getCell("A5").value, risks.getCell("A6").value]).toEqual(["[A:V1]", null]);
    expect(workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.checklist)!.getCell("B6").value).toBe("Owners named");
    expect(mockLoaders).toHaveBeenCalledWith("synthetic", undefined);
  });

  it("names a part it could not read instead of filling it", async () => {
    mockRegister.mockResolvedValue(Response.json({ error: "forbidden" }, { status: 403 }));
    mockGetModuleState.mockResolvedValue([captured(4, P4_ROADMAP_PLAN_KEY, "{not json")]);
    const workbook = await workbookOf(await call());
    const sources = workbook.getWorksheet(MOBILIZATION_PLAN_SHEETS.sources)!;
    expect(sources.getCell("C6").value).toBe("Not available: The P4 milestone plan could not be read.");
    expect(sources.getCell("C7").value).toBe("Not available: No P3 owners have been recorded.");
    expect(sources.getCell("C8").value).toBe("Not available: The assumptions register could not be read.");
  });

  it.each([
    ["missing", "estimate_not_approved"],
    ["stale", "estimate_stale"],
    ["failed", "estimate_unreadable"],
  ] as const)("refuses when the approved estimate is %s", async (status, code) => {
    mockReadApproved.mockResolvedValue({ status });
    const response = await call();
    expect(response.status).toBe(MOBILIZATION_PLAN_REFUSAL[code].status);
    expect(await response.json()).toEqual({ error: code, detail: MOBILIZATION_PLAN_REFUSAL[code].detail });
    expect(mockGetModuleState).not.toHaveBeenCalled();
  });

  it("refuses to plan on an estimate that no longer reproduces its approval", async () => {
    mockMatches.mockReturnValue(false);
    expect((await (await call()).json()).error).toBe("estimate_mismatch");
    mockMatches.mockReturnValue(true);
    mockLoaders.mockRejectedValue(new Error("reference_rom_workbook_mismatch"));
    const response = await call();
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("estimate_mismatch");
    expect(mockGetModuleState).not.toHaveBeenCalled();
  });

  it("refuses in ladder order and reads nothing past a refusal", async () => {
    mockRequireTenancy.mockRejectedValueOnce(new TenancyError("unauthenticated"));
    expect((await call()).status).toBe(401);
    expect(mockIsFeatureEnabled).not.toHaveBeenCalled();

    mockIsFeatureEnabled.mockReturnValueOnce(false);
    let response = await call();
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("not_enabled");
    expect(mockGetProgramById).not.toHaveBeenCalled();

    mockGetProgramById.mockResolvedValueOnce(null);
    response = await call();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(moveUnreadableRefusalBody());
    expect(mockLoadPolicy).not.toHaveBeenCalled();

    mockLoadPolicy.mockResolvedValueOnce({ accessLevel: "full", programIdsAllowed: ["another-move"] });
    response = await call();
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("forbidden");
    expect(mockReadApproved).not.toHaveBeenCalled();
  });

  it("asks the flag strictly", async () => {
    mockIsFeatureEnabled.mockReturnValueOnce("true");
    expect((await call()).status).toBe(404);
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith({ clientKey: "synthetic", clientId: "client-1" }, "moves_rom_engine_v1");
  });

  it("gives every refusal a sentence a person can act on", () => {
    for (const [code, refusal] of Object.entries(MOBILIZATION_PLAN_REFUSAL)) {
      expect(refusal.detail.length).toBeGreaterThan(30);
      expect(refusal.detail).not.toContain(code);
    }
  });
});
