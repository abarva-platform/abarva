/**
 * The route is the authority on a Move's platform-fit set.
 *
 * The five options are per-DECLARED-archetype, and both halves of that decision
 * live here: the GET says which set the panel renders, and the POST says which
 * set may be recorded. `solution-pattern-catalog.test.ts` proves the resolver
 * and the two validators in isolation; nothing proved the route calls them with
 * the Move's own declaration. Without these cases the declared id could be
 * dropped from either call site and every other suite would stay green — the
 * panel would fall back to the shipped set and the write check would widen to
 * every pattern the catalog knows.
 *
 * `resolveDeclaredProgramArchetypeId` and the catalog are deliberately NOT
 * mocked. Only auth, the feature flag, the Supabase handle and the program read
 * are, so what runs through here is the real join from a charter to a set.
 */
const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => mockRequireTenancy(),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, programId: string) =>
    mockGetProgramById(ctx, programId),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (ctx: unknown, key: string) =>
    mockIsFeatureEnabled(ctx, key),
}));

jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  getProgramsRouteSupabase: () => ({
    supabase: {
      from: () => ({
        update: (values: unknown) => {
          mockUpdate(values);
          return { eq: () => Promise.resolve({ error: null }) };
        },
      }),
    },
  }),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import {
  DEFAULT_SOLUTION_PATTERN_OPTIONS,
  GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS,
} from "@/lib/programs/solution-pattern-catalog";

const PARAMS = { params: Promise.resolve({ programId: "move-1" }) };

/** A program whose charter declares the archetype the declaration job writes. */
function program(declaredArchetype?: string) {
  return {
    id: "move-1",
    charter: declaredArchetype
      ? { classification: { archetype: declaredArchetype } }
      : {},
  };
}

function postRequest(body: unknown) {
  return new NextRequest("https://example.test/api", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireTenancy.mockResolvedValue({ clientId: "c1" });
  mockIsFeatureEnabled.mockReturnValue(true);
});

describe("GET — serves the declared archetype's set", () => {
  it("serves the configured set for a Move that declares one", async () => {
    mockGetProgramById.mockResolvedValue(program("governed_data_foundation"));
    const body = await (await GET(postRequest({}), PARAMS)).json();
    expect(body.options).toEqual(
      GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS,
    );
    expect(
      body.options.map((option: { value: string }) => option.value),
    ).not.toContain("Native to the Core Clinical System");
  });

  it("serves the shipped set for a Move that declares nothing", async () => {
    mockGetProgramById.mockResolvedValue(program());
    const body = await (await GET(postRequest({}), PARAMS)).json();
    expect(body.options).toEqual(DEFAULT_SOLUTION_PATTERN_OPTIONS);
  });
});

describe("POST — validates against the declared archetype's set", () => {
  it("records a pattern the Move is offered", async () => {
    mockGetProgramById.mockResolvedValue(program("governed_data_foundation"));
    const res = await POST(
      postRequest({
        pattern: "Govern on the Platform",
        rationale: "Certified definitions on the platform already in place.",
      }),
      PARAMS,
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      charter: {
        classification: { archetype: "governed_data_foundation" },
        p3_solution_pattern_v1: {
          pattern: "Govern on the Platform",
          rationale: "Certified definitions on the platform already in place.",
        },
      },
    });
  });

  it("refuses a pattern from a set this Move is not asked, and writes nothing", async () => {
    mockGetProgramById.mockResolvedValue(program("governed_data_foundation"));
    const res = await POST(
      postRequest({
        pattern: "Native to the Core Clinical System",
        rationale: "A pattern that does not describe this Move.",
      }),
      PARAMS,
    );
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses a configured-set pattern on a Move that declares nothing", async () => {
    // The mirror of the case above. Together they prove the route reads the
    // Move's own declaration rather than validating against the whole catalog.
    mockGetProgramById.mockResolvedValue(program());
    const res = await POST(
      postRequest({
        pattern: "Govern on the Platform",
        rationale: "A pattern this Move was never offered.",
      }),
      PARAMS,
    );
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("still records a shipped pattern on a Move that declares nothing", async () => {
    mockGetProgramById.mockResolvedValue(program());
    const res = await POST(
      postRequest({
        pattern: "Build on the Platform",
        rationale: "Runs inside the tenant's own boundary.",
      }),
      PARAMS,
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});
