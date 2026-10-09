/**
 * GET /api/v1/programs/:programId/value-case — the Move's value case,
 * evaluated with register inputs against its cost basis. SYNTHETIC numbers.
 *
 * What is pinned:
 *   - the ladder, in order: tenancy → flag (`moves_value_engine_v1`, strictly
 *     `=== true`) → Move (the shared cause-blind 404) → program grants, with
 *     nothing read past a refusal;
 *   - every refusal carries an authored `detail`;
 *   - the golden case: spend base from a confirmed row, reduction from an open
 *     row, a corrected discount rate, the reviewed estimate as the cost —
 *     levers, statuses, formula terms, NPV, payback, breakeven, sensitivity;
 *   - an unresolved input blocks the case with a sentence naming the row and
 *     its status, and no figure anywhere;
 *   - figures follow the register's rule: anyone who can change the register
 *     or has financial visibility sees them; a read-only viewer without
 *     financial visibility gets the shape and no number.
 *
 * Only I/O boundaries are mocked (tenancy, flag, Move read, module state,
 * access policy, register store). The engine, the register rule, the cost
 * basis and the viewer projection all run for real.
 */
jest.mock("server-only", () => ({}));

const mockRequireTenancy = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();
const mockLoadPolicy = jest.fn();
const mockListAssumptions = jest.fn();
const mockRouteFamilies: string[] = [];

jest.mock("@/app/api/v1/programs/_auth", () => {
  class TenancyError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  }
  return {
    TenancyError,
    requireTenancy: () => mockRequireTenancy(),
    tenancyErrorResponse: (err: unknown) => {
      if (err instanceof TenancyError) {
        return Response.json({ error: err.code }, { status: 401 });
      }
      throw err;
    },
  };
});
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (ctx: unknown, key: string) =>
    mockIsFeatureEnabled(ctx, key),
}));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
  getModuleState: (...args: unknown[]) => mockGetModuleState(...args),
}));
jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: async (family: string) => {
    mockRouteFamilies.push(family);
    return { supabase: { marker: "route-supabase" } };
  },
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) =>
    mockLoadPolicy(ctx, opts),
}));
jest.mock("@/lib/programs/assumption-register/store", () => ({
  ...jest.requireActual("@/lib/programs/assumption-register/store"),
  listAssumptions: (...args: unknown[]) => mockListAssumptions(...args),
}));

import { NextRequest } from "next/server";
import { GET } from "../route";
import { TenancyError } from "@/app/api/v1/programs/_auth";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { describeCostBasisBlock } from "@/lib/programs/value-engine/cost-basis";
import {
  FIGURES_WITHHELD_DETAIL,
  VALUE_CASE_REFUSAL,
  type ValueCaseRefusalCode,
} from "@/lib/programs/value-engine/value-case-view";
import { evaluateValueFormulaTerms } from "@/lib/programs/value-engine/formula-terms";
import type {
  AssumptionRecord,
  AssumptionStatus,
  RegisterConfidence,
} from "@/lib/programs/assumption-register/model";
import type { ValueCase } from "@/lib/programs/value-engine/types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOVE = "11111111-1111-4111-8111-111111111111";
const CTX = { clientId: "client-1", clientKey: "tenant-a", userId: "user-1" };

function policy(
  overrides: Partial<{
    accessLevel: string;
    programIdsAllowed: string[] | null;
    canViewFinancialData: boolean;
  }> = {},
) {
  return {
    accessLevel: "program_member",
    programIdsAllowed: [MOVE],
    canViewFinancialData: true,
    ...overrides,
  };
}

function row(
  registerId: string,
  status: AssumptionStatus,
  values: {
    workingValue?: number | null;
    answerValue?: number | null;
    confidence?: RegisterConfidence;
  },
): AssumptionRecord {
  return {
    id: `row-${registerId}`,
    tenantKey: "tenant-a",
    programId: MOVE,
    area: "value",
    seq: Number(registerId.slice(1)),
    registerId,
    statement: `Synthetic ${registerId}`,
    whyItMatters: null,
    workingFigure: null,
    workingValue: values.workingValue ?? null,
    unit: null,
    source: "Synthetic workshop",
    confidence: values.confidence ?? 3,
    ownerRole: "Finance office",
    ownerName: null,
    ownerPersonId: null,
    status,
    origin: "team",
    answer: null,
    answerFigure: null,
    answerValue: values.answerValue ?? null,
    answerSource: null,
    answeredByUserId: null,
    answeredAt: null,
    acceptedByUserId: null,
    acceptedAt: null,
    supersededBy: null,
    raisedPhase: 4,
    raisedStepId: null,
    evidenceIds: [],
    charterSectionKey: null,
    charterValueRevision: null,
    revision: 1,
    createdByUserId: "user-1",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
}

// V1 confirmed 8,000,000 (conf 5 → ±10%); V2 open 0.12 (conf 3 → ±25%);
// V3 corrected 0.08 (working 0.10 was wrong; conf 1 → ±50%).
//   annual base = 8,000,000 × 0.12 × 0.6 × 0.8 = 460,800 dollars = 46,080,000 cents
//   low  = 7,200,000 × 0.09 × 0.48 = 31,104,000 cents
//   high = 8,800,000 × 0.15 × 0.48 = 63,360,000 cents
function goldenRows(): AssumptionRecord[] {
  return [
    row("V1", "confirmed", {
      workingValue: 7_500_000,
      answerValue: 8_000_000,
      confidence: 5,
    }),
    row("V2", "open", { workingValue: 0.12, confidence: 3 }),
    row("V3", "corrected", {
      workingValue: 0.1,
      answerValue: 0.08,
      confidence: 1,
    }),
  ];
}

const lit = (value: number) => ({
  kind: "literal" as const,
  value,
  source: "synthetic",
});

function goldenCase(): ValueCase {
  return {
    levers: [
      {
        id: "L1",
        name: "Premium labour",
        conversion: "cost_reduction",
        driver: {
          name: "premium labour spend reduced",
          unit: "share of spend",
          direction: "increase",
          baseline: lit(0),
          target: { kind: "register", registerId: "V2" },
        },
        terms: [
          {
            role: "base",
            label: "annual premium labour spend ($)",
            ref: { kind: "register", registerId: "V1" },
          },
          { role: "driver_delta", label: "share of spend no longer bought" },
        ],
        attribution: lit(0.6),
        probability: lit(0.8),
        timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
      },
    ],
    horizonYears: 1,
    discountRate: { kind: "register", registerId: "V3" },
    // The author's typed figure: superseded by the reviewed estimate.
    cost: { kind: "estimate", baseCents: 1 },
  };
}

function valuePlan(model: ValueCase = goldenCase()): string {
  return JSON.stringify({ kind: "value_model", version: 1, case: model });
}

// internal: 900/1,000/1,200 h × $150 = $135,000 / $150,000 / $180,000
// vendor:   800/  900/1,000 h × $200 = $160,000 / $180,000 / $200,000
function estimateLine(overrides: Record<string, unknown>) {
  return {
    pairId: "P1",
    workPackage: "Scheduling build",
    role: "Engineer",
    deliveryModel: "internal",
    lowHours: 900,
    baseHours: 1_000,
    highHours: 1_200,
    ratePerHour: 150,
    rateSource: "Synthetic internal rate",
    inputBasis: "assumption",
    evidenceReference: "",
    assumption: "Synthetic sizing",
    confidence: "medium",
    aiEligiblePct: 0,
    aiToolAssumption: "",
    humanReviewHours: 0,
    ...overrides,
  };
}
const ESTIMATE = JSON.stringify({
  currency: "USD",
  reviewer: "Synthetic estimate reviewer",
  reviewConfirmed: true,
  sourceNotes: "",
  rows: [
    estimateLine({}),
    estimateLine({
      deliveryModel: "vendor",
      lowHours: 800,
      baseHours: 900,
      highHours: 1_000,
      ratePerHour: 200,
    }),
  ],
});

function modules(values: { valuePlan?: string; estimate?: string }) {
  return [
    {
      moduleKey: "phase_4_value_plan",
      state: { value: values.valuePlan ?? valuePlan() },
    },
    {
      moduleKey: "phase_4_estimates_capacity",
      state: { value: values.estimate ?? ESTIMATE },
    },
  ];
}

function request(query = "?delivery=internal") {
  return new NextRequest(
    `http://localhost/api/v1/programs/${MOVE}/value-case${query}`,
  );
}

async function get(query?: string) {
  const res = await GET(request(query), {
    params: Promise.resolve({ programId: MOVE }),
  });
  return { status: res.status, body: await res.json() };
}

/** Every number in a JSON body, recursively. */
function numbersIn(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (Array.isArray(value)) return value.flatMap(numbersIn);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(numbersIn);
  }
  return [];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteFamilies.length = 0;
  mockRequireTenancy.mockResolvedValue(CTX);
  mockIsFeatureEnabled.mockReturnValue(true);
  mockGetProgramById.mockResolvedValue({ id: MOVE });
  mockGetModuleState.mockResolvedValue(modules({}));
  mockLoadPolicy.mockResolvedValue(policy());
  mockListAssumptions.mockResolvedValue(goldenRows());
});

function expectRefusal(
  result: { status: number; body: Record<string, unknown> },
  code: ValueCaseRefusalCode,
) {
  expect(result.status).toBe(VALUE_CASE_REFUSAL[code].status);
  expect(result.body).toMatchObject({
    ok: false,
    error: code,
    detail: VALUE_CASE_REFUSAL[code].detail,
  });
}

// ── The ladder ───────────────────────────────────────────────────────────────

describe("the access ladder", () => {
  it("an unsigned caller is answered by tenancy before anything else", async () => {
    mockRequireTenancy.mockRejectedValue(new TenancyError("unauthenticated"));
    const result = await get();
    expect(result).toEqual({
      status: 401,
      body: { error: "unauthenticated" },
    });
    expect(mockIsFeatureEnabled).not.toHaveBeenCalled();
    expect(mockGetProgramById).not.toHaveBeenCalled();
  });

  it("the flag is checked for the caller's tenant, before any Move is read", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    expectRefusal(await get(), "value_engine_not_enabled");
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith(
      { clientKey: "tenant-a", clientId: "client-1" },
      "moves_value_engine_v1",
    );
    expect(mockGetProgramById).not.toHaveBeenCalled();
    expect(mockRouteFamilies).toEqual([]);
  });

  it("a truthy non-boolean flag reading never turns the engine on", async () => {
    mockIsFeatureEnabled.mockReturnValue("yes");
    expectRefusal(await get(), "value_engine_not_enabled");
  });

  it("an unreadable Move is the shared cause-blind 404, and nothing past it is read", async () => {
    mockGetProgramById.mockResolvedValue(null);
    const result = await get();
    expect(result.status).toBe(404);
    expect(result.body).toEqual(moveUnreadableRefusalBody());
    expect(mockLoadPolicy).not.toHaveBeenCalled();
    expect(mockGetModuleState).not.toHaveBeenCalled();
    expect(mockListAssumptions).not.toHaveBeenCalled();
  });

  it("reads the Move on the read family, then loads the grants for that Move", async () => {
    await get();
    expect(mockRouteFamilies).toEqual(["program_read"]);
    expect(mockGetProgramById).toHaveBeenCalledWith(CTX, MOVE, {
      supabase: { marker: "route-supabase" },
    });
    expect(mockLoadPolicy).toHaveBeenCalledWith(CTX, { programId: MOVE });
    expect(mockGetModuleState).toHaveBeenCalledWith(CTX, MOVE, {
      supabase: { marker: "route-supabase" },
    });
    expect(mockListAssumptions).toHaveBeenCalledWith(CTX, MOVE);
  });

  it("a delivery model other than internal or vendor is refused, nothing evaluated", async () => {
    expectRefusal(await get("?delivery=hybrid"), "bad_delivery_model");
    expect(mockGetModuleState).not.toHaveBeenCalled();
  });
});

describe("the saved value model", () => {
  it("absent", async () => {
    mockGetModuleState.mockResolvedValue(modules({ valuePlan: "  " }));
    expectRefusal(await get(), "value_model_absent");
    expect(mockListAssumptions).not.toHaveBeenCalled();
  });

  it("absent when no P4 value plan module exists at all", async () => {
    mockGetModuleState.mockResolvedValue([
      { moduleKey: "phase_3_value_plan", state: { value: valuePlan() } },
      { moduleKey: "phase_4_value_plan", state: { value: 42 } },
    ]);
    expectRefusal(await get(), "value_model_absent");
  });

  it("free text", async () => {
    mockGetModuleState.mockResolvedValue(
      modules({ valuePlan: "We expect savings from scheduling." }),
    );
    expectRefusal(await get(), "value_model_not_structured");
    expect(mockListAssumptions).not.toHaveBeenCalled();
  });

  it("invalid, with the issues named", async () => {
    mockGetModuleState.mockResolvedValue(
      modules({
        valuePlan: JSON.stringify({
          kind: "value_model",
          version: 1,
          case: {},
        }),
      }),
    );
    const result = await get();
    expectRefusal(result, "value_model_invalid");
    expect(result.body.issues).toEqual(
      expect.arrayContaining([expect.stringMatching(/^case\.levers/)]),
    );
    expect(mockListAssumptions).not.toHaveBeenCalled();
  });
});

// ── The golden case ──────────────────────────────────────────────────────────

describe("golden case, for a viewer who sees figures", () => {
  it("returns the full result with register inputs and the estimate as the cost", async () => {
    const { status, body } = await get();
    expect(status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      programId: MOVE,
      status: "evaluated",
      readyForApproval: true,
      figuresRedacted: false,
      blockedInputs: [],
      costBasis: {
        status: "resolved",
        basis: "estimate_model",
        source: "estimate_model:internal",
        cents: { low: 13_500_000, base: 15_000_000, high: 18_000_000 },
      },
    });
    const l1 = body.case.levers[0];
    expect(l1).toMatchObject({
      leverId: "L1",
      status: "counted",
      annualCents: { low: 31_104_000, base: 46_080_000, high: 63_360_000 },
      mustValidate: ["L1.driver.target", "L1.driver"],
    });
    for (const scenario of ["low", "base", "high"] as const) {
      expect(evaluateValueFormulaTerms(l1.terms[scenario])).toBe(
        l1.annualCents[scenario],
      );
    }
    expect(l1.terms.base.map((t: { source: string }) => t.source)).toContain(
      "register:V1",
    );

    const economics = body.case.economics;
    expect(economics.discountRate).toBe(0.08);
    expect(economics.costCents).toEqual({
      low: 18_000_000,
      base: 15_000_000,
      high: 13_500_000,
    });
    expect(economics.paybackMonth).toEqual({ low: 7, base: 4, high: 3 });
    let discounted = 0;
    for (let m = 1; m <= 12; m += 1) discounted += 3_840_000 / 1.08 ** (m / 12);
    expect(economics.npvCents.base).toBe(Math.round(discounted - 15_000_000));
    expect(evaluateValueFormulaTerms(economics.npvTerms.base)).toBe(
      economics.npvCents.base,
    );

    // 8,000,000 × d × 0.48 × 100 = 15,000,000 → d = 0.0390625.
    expect(body.case.breakeven[0]).toMatchObject({
      leverId: "L1",
      status: "solved",
    });
    expect(body.case.breakeven[0].breakevenDelta).toBeCloseTo(0.0390625, 9);
    expect(
      body.case.sensitivity.some(
        (r: { key: string }) => r.key === "case.discount_rate",
      ),
    ).toBe(true);

    expect(
      body.registerInputs.map((r: { registerId: string; outcome: string }) => [
        r.registerId,
        r.outcome,
      ]),
    ).toEqual([
      ["V2", "must_validate"],
      ["V1", "counted"],
      ["V3", "counted"],
    ]);
  });

  it("the vendor delivery model prices the case on the vendor total", async () => {
    const { body } = await get("?delivery=vendor");
    expect(body.costBasis).toMatchObject({
      source: "estimate_model:vendor",
      cents: { base: 18_000_000 },
    });
    expect(body.case.economics.costCents.base).toBe(18_000_000);
  });

  it("without a delivery model the cost is blocked: no figure, and the reason named", async () => {
    const { status, body } = await get("");
    expect(status).toBe(200);
    expect(body.status).toBe("blocked");
    expect(body.case.economics).toBeNull();
    expect(body.costBasis).toMatchObject({
      status: "blocked",
      reason: "estimate_delivery_model_unselected",
    });
    expect(body.blockedInputs).toEqual([
      {
        key: "case.cost",
        reason: "unresolved",
        registerId: null,
        detail: describeCostBasisBlock("estimate_delivery_model_unselected"),
      },
    ]);
  });
});

describe("an unresolved input blocks with a reason, never a number", () => {
  it("a proposed spend base blocks the lever and names the row's status", async () => {
    mockListAssumptions.mockResolvedValue(
      goldenRows().map((r) =>
        r.registerId === "V1" ? { ...r, status: "proposed" as const } : r,
      ),
    );
    const { status, body } = await get();
    expect(status).toBe(200);
    expect(body.status).toBe("blocked");
    expect(body.readyForApproval).toBe(false);
    expect(body.case.economics).toBeNull();
    expect(body.case.levers[0]).toMatchObject({
      status: "blocked_unresolved_input",
      annualCents: null,
    });
    expect(body.blockedInputs).toEqual([
      {
        key: "L1.term[0]",
        reason: "not_counted",
        registerId: "V1",
        detail:
          "L1.term[0] reads register row V1: it is only proposed, so it does not count until a person accepts it.",
      },
    ]);
  });
});

// ── Figures ──────────────────────────────────────────────────────────────────

describe("figures follow the register rule", () => {
  it.each([
    [
      "a member who can change the register, without financial visibility",
      policy({ canViewFinancialData: false }),
    ],
    [
      "a read-only viewer WITH financial visibility",
      policy({ accessLevel: "program_viewer" }),
    ],
    [
      "a client admin over every Move",
      policy({
        accessLevel: "client_admin",
        programIdsAllowed: null,
        canViewFinancialData: false,
      }),
    ],
  ])("%s sees every figure", async (_label, viewer) => {
    mockLoadPolicy.mockResolvedValue(viewer);
    const { body } = await get();
    expect(body.figuresRedacted).toBe(false);
    expect(body.case.levers[0].annualCents.base).toBe(46_080_000);
    expect(body.costBasis.cents.base).toBe(15_000_000);
  });

  it.each([
    [
      "a read-only viewer without financial visibility",
      policy({ accessLevel: "program_viewer", canViewFinancialData: false }),
    ],
    [
      "a member whose grants exclude this Move, without financial visibility",
      policy({
        programIdsAllowed: ["another-move"],
        canViewFinancialData: false,
      }),
    ],
  ])("%s gets the shape and no number", async (_label, viewer) => {
    mockLoadPolicy.mockResolvedValue(viewer);
    const { status, body } = await get();
    expect(status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      status: "evaluated",
      readyForApproval: true,
      figuresRedacted: true,
      figuresRedactedDetail: FIGURES_WITHHELD_DETAIL,
      costBasis: {
        status: "resolved",
        basis: "estimate_model",
        source: "estimate_model:internal",
        deliveryModel: "internal",
      },
    });
    expect(body.case.levers).toEqual([
      {
        leverId: "L1",
        name: "Premium labour",
        conversion: "cost_reduction",
        status: "counted",
        inCash: true,
        countedInsteadBy: null,
        mustValidate: ["L1.driver.target", "L1.driver"],
        inputIssues: [],
        ruleViolations: [],
      },
    ]);
    expect(body.case.breakeven).toEqual([{ leverId: "L1", status: "solved" }]);
    expect(body.case).not.toHaveProperty("economics");
    expect(body.case).not.toHaveProperty("sensitivity");
    expect(body.costBasis).not.toHaveProperty("cents");
    expect(body.costBasis).not.toHaveProperty("planningBenchmark");
    // The only numbers left are the horizon in years.
    expect(numbersIn(body)).toEqual([1]);
    expect(body.case.horizonYears).toBe(1);
  });

  it("a withheld blocked basis keeps its reason and sentence", async () => {
    mockLoadPolicy.mockResolvedValue(
      policy({ accessLevel: "program_viewer", canViewFinancialData: false }),
    );
    const { body } = await get("");
    expect(body.costBasis).toEqual({
      status: "blocked",
      reason: "estimate_delivery_model_unselected",
      detail: describeCostBasisBlock("estimate_delivery_model_unselected"),
    });
    expect(body.blockedInputs[0].detail).toBe(
      describeCostBasisBlock("estimate_delivery_model_unselected"),
    );
  });
});

// ── Failures ─────────────────────────────────────────────────────────────────

describe("a failed read is a named refusal, never an unbodied 500", () => {
  it.each([
    [
      "the register",
      () => mockListAssumptions.mockRejectedValue(new Error("db")),
    ],
    [
      "the module state",
      () => mockGetModuleState.mockRejectedValue(new Error("db")),
    ],
    ["the grants", () => mockLoadPolicy.mockRejectedValue(new Error("db"))],
  ])("%s", async (_label, fail) => {
    fail();
    expectRefusal(await get(), "value_case_read_failed");
  });
});

describe("refusal sentences", () => {
  it("every refusal has its own sentence", () => {
    const details = Object.values(VALUE_CASE_REFUSAL).map((r) => r.detail);
    expect(new Set(details).size).toBe(details.length);
    for (const detail of details) expect(detail.length).toBeGreaterThan(40);
  });
});
