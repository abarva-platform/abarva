/**
 * propose_assumption — aVa's ONLY way onto a Move's assumptions register.
 *
 * What is pinned:
 *   - a proposal is created as origin `ava_proposal` by actor kind `ava`, and
 *     lands as `proposed` (the store stand-in applies the real
 *     `INITIAL_STATUS_BY_ORIGIN` and `validateNewAssumption`), whatever status
 *     or origin the model puts in its input;
 *   - every required field is refused by name before anything is written: the
 *     statement, the working figure, the source, an owner ROLE (never a
 *     personal name), a confidence of 1, 3 or 5;
 *   - the flag, the Move read and the per-Move write policy all hold;
 *   - the tool cannot accept, reject, answer, edit or supersede: it reaches the
 *     store through `createAssumption` alone.
 */
import * as fs from "node:fs";
import * as path from "node:path";

jest.mock("server-only", () => ({}));

const mockRequireTenancy = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadPolicy = jest.fn();
const mockCreateAssumption = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => {
  class TenancyError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  }
  return {
    __esModule: true,
    TenancyError,
    requireTenancy: () => mockRequireTenancy(),
    tenancyErrorResponse: (err: unknown) => {
      throw err;
    },
  };
});
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (ctx: unknown, key: string) =>
    mockIsFeatureEnabled(ctx, key),
}));
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
}));
jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: async () => ({ supabase: {} }),
}));
jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (ctx: unknown, opts: unknown) =>
    mockLoadPolicy(ctx, opts),
}));
jest.mock("@/lib/programs/assumption-register/store", () => ({
  ...jest.requireActual("@/lib/programs/assumption-register/store"),
  createAssumption: (...args: unknown[]) => mockCreateAssumption(...args),
}));

import { proposeAssumptionTool } from "../program/proposeAssumption";
import { looksLikePersonalName } from "@/lib/programs/assumption-register/owner-role";
import { TenancyError } from "@/app/api/v1/programs/_auth";
import {
  INITIAL_STATUS_BY_ORIGIN,
  validateNewAssumption,
  type NewAssumptionInput,
} from "@/lib/programs/assumption-register/model";
import {
  RegisterHistoryWriteError,
  type RegisterActor,
} from "@/lib/programs/assumption-register/store";
import type { ToolContext } from "../registry";

const MOVE = "11111111-1111-4111-8111-111111111111";
const CTX = { clientId: "client-1", clientKey: "tenant-a", userId: "user-1" };

function toolCtx(accessPolicy?: ToolContext["accessPolicy"]): ToolContext {
  return {
    request: new Request("http://localhost/"),
    surface: "/strategic-moves/move/phase/2",
    accessPolicy,
  };
}

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    program_id: MOVE,
    area: "value",
    statement: "Claims rework takes 30% of analyst time.",
    working_figure: "30%",
    source: "Operations time study",
    owner_role: "Operations Director",
    confidence: 3,
    ...overrides,
  };
}

function propose(input: Record<string, unknown>, ctx = toolCtx()) {
  return proposeAssumptionTool.handler(input as never, ctx);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue(CTX);
  mockIsFeatureEnabled.mockReturnValue(true);
  mockGetProgramById.mockResolvedValue({ id: MOVE });
  mockLoadPolicy.mockResolvedValue({
    accessLevel: "program_member",
    programIdsAllowed: [MOVE],
    canViewFinancialData: true,
  });
  // Applies the real rules the store applies before writing.
  mockCreateAssumption.mockImplementation(
    async (
      _ctx: unknown,
      programId: string,
      input: NewAssumptionInput,
      actor: RegisterActor,
    ) => {
      const valid = validateNewAssumption(input, actor);
      if (!valid.ok) return valid;
      return {
        ok: true,
        record: {
          id: "44444444-4444-4444-8444-444444444444",
          programId,
          registerId: "V4",
          status: INITIAL_STATUS_BY_ORIGIN[input.origin],
          origin: input.origin,
        },
      };
    },
  );
});

describe("propose_assumption tool", () => {
  it("proposes a row as aVa, and it lands as PROPOSED", async () => {
    const result = await propose(
      baseInput({
        working_value: 30,
        unit: "percent",
        why_it_matters: "The savings line rests on it.",
        raised_phase: 2,
      }),
    );
    expect(result).toEqual({
      success: true,
      data: {
        register_id: "V4",
        assumption_id: "44444444-4444-4444-8444-444444444444",
        status: "proposed",
        note: "Proposed as V4. It waits for a person on the Move team to accept or reject it, and reaches no document until accepted.",
      },
    });
    const [ctx, programId, input, actor] = mockCreateAssumption.mock.calls[0];
    expect(ctx).toBe(CTX);
    expect(programId).toBe(MOVE);
    expect(actor).toEqual({ kind: "ava", userId: "user-1" });
    expect(input).toEqual({
      area: "value",
      statement: "Claims rework takes 30% of analyst time.",
      workingFigure: "30%",
      workingValue: 30,
      unit: "percent",
      source: "Operations time study",
      confidence: 3,
      ownerRole: "Operations Director",
      whyItMatters: "The savings line rests on it.",
      raisedPhase: 2,
      origin: "ava_proposal",
    });
  });

  it("cannot be told a status or an origin: a proposal is always proposed", async () => {
    const result = await propose(
      baseInput({ status: "open", origin: "team", owner_name: "Someone" }),
    );
    expect(result).toMatchObject({
      success: true,
      data: { status: "proposed" },
    });
    const input = mockCreateAssumption.mock.calls[0][2];
    expect(input.origin).toBe("ava_proposal");
    expect(input).not.toHaveProperty("status");
    expect(input).not.toHaveProperty("ownerName");
  });

  it.each([
    ["program_id", { program_id: " " }, "missing_program_id"],
    ["area", { area: "cost" }, "invalid_area"],
    ["statement", { statement: "" }, "missing_statement"],
    ["working_figure", { working_figure: undefined }, "missing_working_figure"],
    ["source", { source: "   " }, "missing_source"],
    ["owner_role", { owner_role: undefined }, "missing_owner_role"],
    ["confidence (2)", { confidence: 2 }, "invalid_confidence"],
    ["confidence (missing)", { confidence: undefined }, "invalid_confidence"],
    ["working_value", { working_value: "thirty" }, "invalid_working_value"],
  ])(
    "refuses a proposal without a valid %s, and writes nothing",
    async (_f, patch, error) => {
      const result = await propose(baseInput(patch));
      expect(result).toMatchObject({ success: false, error });
      expect((result as { recovery?: string }).recovery).toEqual(
        expect.any(String),
      );
      expect(mockCreateAssumption).not.toHaveBeenCalled();
      expect(mockRequireTenancy).not.toHaveBeenCalled();
    },
  );

  it.each([
    "Jane Smith",
    "jane.smith@example.com",
    "Dr. Patel",
    "Mary Ann Jones",
  ])("refuses a personal name (%s) as the owner", async (owner) => {
    const result = await propose(baseInput({ owner_role: owner }));
    expect(result).toEqual({
      success: false,
      error: "owner_role_is_a_name",
      recovery:
        "The owner must be a role, such as Finance Director or CFO office, never a person's name. Propose it again with the role.",
    });
    expect(mockCreateAssumption).not.toHaveBeenCalled();
  });

  it.each([
    "Finance Director",
    "CFO office",
    "Head of Revenue Cycle",
    "Procurement",
    "Clinical Operations",
    "VP of Customer Care",
    "Treasury",
    "IT helpdesk",
  ])("accepts a role (%s) as the owner", (owner) => {
    expect(looksLikePersonalName(owner)).toBe(false);
  });

  it("refuses when the register is not turned on, before reading the Move", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const result = await propose(baseInput());
    expect(result).toMatchObject({
      success: false,
      error: "register_not_enabled",
    });
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith(
      CTX,
      "moves_assumption_register_v1",
    );
    expect(mockGetProgramById).not.toHaveBeenCalled();
    expect(mockCreateAssumption).not.toHaveBeenCalled();
  });

  it("refuses a Move this account cannot read", async () => {
    mockGetProgramById.mockResolvedValue(null);
    const result = await propose(baseInput());
    expect(result).toMatchObject({
      success: false,
      error: "program_not_found",
    });
    expect(mockCreateAssumption).not.toHaveBeenCalled();
  });

  it("refuses a viewer: aVa cannot write on behalf of someone who cannot", async () => {
    mockLoadPolicy.mockResolvedValue({
      accessLevel: "program_viewer",
      programIdsAllowed: [MOVE],
      canViewFinancialData: true,
    });
    const result = await propose(baseInput());
    expect(result).toMatchObject({ success: false, error: "forbidden" });
    expect(mockCreateAssumption).not.toHaveBeenCalled();
  });

  it("uses the route's resolved policy when it has one", async () => {
    const result = await propose(
      baseInput(),
      toolCtx({
        accessLevel: "program_member",
        programIdsAllowed: ["another-move"],
        canViewFinancialData: true,
      }),
    );
    expect(result).toMatchObject({ success: false, error: "forbidden" });
    expect(mockLoadPolicy).not.toHaveBeenCalled();
  });

  it("answers a session failure without writing", async () => {
    mockRequireTenancy.mockRejectedValue(new TenancyError("unauthenticated"));
    const result = await propose(baseInput());
    expect(result).toMatchObject({
      success: false,
      error: "auth:unauthenticated",
    });
    expect(mockCreateAssumption).not.toHaveBeenCalled();
  });

  it("passes a store refusal back without claiming the row exists", async () => {
    mockCreateAssumption.mockResolvedValue({
      ok: false,
      refusal: { code: "id_allocation_conflict" },
    });
    const result = await propose(baseInput());
    expect(result).toMatchObject({
      success: false,
      error: "register_refused:id_allocation_conflict",
    });
  });

  it("reports a proposal whose history entry failed as SAVED, so it is not proposed twice", async () => {
    mockCreateAssumption.mockRejectedValue(
      new RegisterHistoryWriteError(
        {
          id: "44444444-4444-4444-8444-444444444444",
          registerId: "V4",
          status: "proposed",
          revision: 1,
        } as never,
        new Error("events insert failed"),
      ),
    );
    const result = await propose(baseInput());
    expect(result).toMatchObject({
      success: true,
      data: { register_id: "V4", status: "proposed", history_recorded: false },
    });
  });

  it("names an unconfirmed proposal instead of claiming either way", async () => {
    mockCreateAssumption.mockRejectedValue(new Error("socket hang up"));
    const result = await propose(baseInput());
    expect(result).toMatchObject({
      success: false,
      error: "proposal_unconfirmed",
    });
  });

  it("offers the model no status, origin or owner-name field", () => {
    const properties = Object.keys(
      (proposeAssumptionTool.input_schema as { properties: object }).properties,
    );
    expect(properties).not.toContain("status");
    expect(properties).not.toContain("origin");
    expect(properties).not.toContain("owner_name");
    expect(
      (proposeAssumptionTool.input_schema as { required: string[] }).required,
    ).toEqual(
      expect.arrayContaining([
        "statement",
        "working_figure",
        "source",
        "owner_role",
        "confidence",
      ]),
    );
  });

  it("reaches the register only through createAssumption: it cannot accept, answer, edit or supersede", () => {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/agent/tools/program/proposeAssumption.ts",
      ),
      "utf8",
    );
    const storeImport = source.match(
      /import\s*\{([^}]*)\}\s*from\s*"@\/lib\/programs\/assumption-register\/store"/,
    );
    expect(storeImport).not.toBeNull();
    const names = storeImport![1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .sort();
    expect(names).toEqual(["RegisterHistoryWriteError", "createAssumption"]);
    expect(source).not.toMatch(
      /transitionAssumption|editAssumption|supersedeAssumption|planTransition|planEdit/,
    );
  });
});
