/**
 * GET /api/v1/programs/:programId/financial-model — the P4 value case as a
 * live workbook. Pinned: the ladder with nothing read past a refusal; the
 * value case's own refusals pass through unchanged; withheld figures, a
 * blocked case, an unreadable model and a model that changed between reads
 * each refuse with their own sentence; the workbook is built from the case
 * the value-case route returned. SYNTHETIC case.
 */
jest.mock("server-only", () => ({}));

const mockRequireTenancy = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockLoadPolicy = jest.fn();
const mockValueCase = jest.fn();

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
jest.mock("@/app/api/v1/programs/[programId]/value-case/route", () => ({ GET: (...args: unknown[]) => mockValueCase(...args) }));

import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { TenancyError } from "@/lib/auth/tenancy";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { phaseCaptureModuleKey, VALUE_MODEL_SECTION_KEY } from "@/lib/programs/phase-capture-contract";
import { evaluateValueCase } from "@/lib/programs/value-engine";
import { FINANCIAL_MODEL_REFUSAL } from "@/lib/programs/value-engine/financial-model-refusals";
import { FINANCIAL_MODEL_CONTENT_TYPE, FINANCIAL_MODEL_SHEETS } from "@/lib/programs/value-engine/financial-model-workbook";
import { VALUE_CASE_REFUSAL, VALUE_ENGINE_FLAG } from "@/lib/programs/value-engine/value-case-view";
import type { ValueCase } from "@/lib/programs/value-engine/types";
import { goldenCase } from "@/testing/fixtures/synthetic-value-case";

const MOVE = "move-synthetic";
const call = (query = "") => GET(new NextRequest(`http://localhost/api/v1/programs/${MOVE}/financial-model${query}`), { params: Promise.resolve({ programId: MOVE }) });
const savedModel = (model: ValueCase) => [{ moduleKey: phaseCaptureModuleKey(4, VALUE_MODEL_SECTION_KEY), state: { value: JSON.stringify({ kind: "value_model", version: 1, case: model }) } }];
const caseBody = (model: ValueCase, extra: Record<string, unknown> = {}) => ({
  ok: true, programId: MOVE, figuresRedacted: false, case: evaluateValueCase(model),
  costBasis: { status: "resolved", basis: "rom_snapshot", source: "rom:synthetic-approved-estimate" }, ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({ clientKey: "synthetic", clientId: "client-1", userId: "user-1" });
  mockIsFeatureEnabled.mockReturnValue(true);
  mockGetProgramById.mockResolvedValue({ id: MOVE, name: "Synthetic hospital flow" });
  mockLoadPolicy.mockResolvedValue({ accessLevel: "full", programIdsAllowed: null });
  mockValueCase.mockImplementation(async () => Response.json(caseBody(goldenCase())));
  mockGetModuleState.mockResolvedValue(savedModel(goldenCase()));
});

describe("GET financial-model", () => {
  it("returns the workbook built from the case the value-case route returned", async () => {
    const response = await call("?delivery=vendor");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(FINANCIAL_MODEL_CONTENT_TYPE);
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="move-financial-model.xlsx"');
    const forwarded = mockValueCase.mock.calls[0]![0] as NextRequest;
    expect(forwarded.nextUrl.pathname).toBe(`/api/v1/programs/${MOVE}/value-case`);
    expect(forwarded.nextUrl.searchParams.get("delivery")).toBe("vendor");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const econ = workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.economics)!;
    expect(econ.getCell("C6").value).toBe("the approved delivery estimate (synthetic-approved-estimate)");
    expect(workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.levers)!.getCell("B5").value).toBe("Premium labour");
  });

  it("models the AI-assisted scenario when the value case evaluated one, and only then", async () => {
    const cheaper = goldenCase();
    cheaper.cost = { kind: "estimate", baseCents: 180_000_000 };
    mockValueCase.mockImplementationOnce(async () => Response.json(caseBody(goldenCase(), { aiAssisted: {
      label: "Synthetic coding agents", fundingBasis: false, status: "evaluated", economics: evaluateValueCase(cheaper).economics,
    } })));
    const read = async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(await (await call()).arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      return workbook.getWorksheet(FINANCIAL_MODEL_SHEETS.inputs)!.getCell("F11").value;
    };
    expect(await read()).toBe("Synthetic coding agents: a comparison, not the funding basis");
    // A scenario marked as the funding basis is never modelled as a comparison.
    mockValueCase.mockImplementationOnce(async () => Response.json(caseBody(goldenCase(), { aiAssisted: {
      label: "Wrong", fundingBasis: true, status: "evaluated", economics: evaluateValueCase(cheaper).economics,
    } })));
    expect(await read()).toBeNull();
  });

  it("passes the value case's own refusal through unchanged", async () => {
    const refusal = { ok: false, error: "value_model_absent", detail: VALUE_CASE_REFUSAL.value_model_absent.detail };
    mockValueCase.mockResolvedValue(Response.json(refusal, { status: 404 }));
    const response = await call();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(refusal);
    expect(mockGetModuleState).not.toHaveBeenCalled();
  });

  it("refuses when figures are withheld or the case is blocked", async () => {
    mockValueCase.mockResolvedValueOnce(Response.json({ ok: true, programId: MOVE, figuresRedacted: true, case: {} }));
    let response = await call();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "figures_withheld", detail: FINANCIAL_MODEL_REFUSAL.figures_withheld.detail });
    const blocked = goldenCase();
    blocked.levers[0]!.attribution = { kind: "register", registerId: "V99" };
    mockValueCase.mockResolvedValueOnce(Response.json(caseBody(blocked)));
    response = await call();
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("case_blocked");
    expect(mockGetModuleState).not.toHaveBeenCalled();
  });

  it("refuses a model it cannot read, and one that changed after the case was read", async () => {
    mockGetModuleState.mockResolvedValueOnce([]);
    expect((await (await call()).json()).error).toBe("model_unreadable");
    const moved = goldenCase();
    moved.levers[0]!.timing = { ...moved.levers[0]!.timing, rampMonths: moved.levers[0]!.timing.rampMonths + 2 };
    mockGetModuleState.mockResolvedValueOnce(savedModel(moved));
    const response = await call();
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "model_changed", detail: FINANCIAL_MODEL_REFUSAL.model_changed.detail });
  });

  it("refuses in ladder order and reads nothing past a refusal", async () => {
    mockRequireTenancy.mockRejectedValueOnce(new TenancyError("unauthenticated"));
    expect((await call()).status).toBe(401);
    expect(mockIsFeatureEnabled).not.toHaveBeenCalled();

    mockIsFeatureEnabled.mockReturnValueOnce("true");
    let response = await call();
    expect(response.status).toBe(VALUE_CASE_REFUSAL.value_engine_not_enabled.status);
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith({ clientKey: "synthetic", clientId: "client-1" }, VALUE_ENGINE_FLAG);
    expect(mockGetProgramById).not.toHaveBeenCalled();

    mockGetProgramById.mockResolvedValueOnce(null);
    response = await call();
    expect(await response.json()).toEqual(moveUnreadableRefusalBody());
    expect(mockLoadPolicy).not.toHaveBeenCalled();

    mockLoadPolicy.mockResolvedValueOnce({ accessLevel: "no_program_access", programIdsAllowed: null });
    response = await call();
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("forbidden");
    expect(mockValueCase).not.toHaveBeenCalled();
  });

  it("gives every refusal a sentence a person can act on", () => {
    for (const [code, refusal] of Object.entries(FINANCIAL_MODEL_REFUSAL)) {
      expect(refusal.detail.length).toBeGreaterThan(30);
      expect(refusal.detail).not.toContain(code);
    }
  });
});
