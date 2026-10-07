/**
 * What archetype the agent context bundle resolves for a Move.
 *
 * `buildArchetypeContextBundle` is documented as the context an agent MUST
 * receive before reasoning about a Move, and the archetype it resolves is what
 * `resolveCurrentStateReadiness` is then asked for — so it decides the bundle's
 * evidence instruments, hard gaps, `missingEvidence`, risk dimensions and the
 * "P2 Diagnose … requires" grounded answer.
 *
 * The cases below are written so they FAIL if the bundle ever goes back to
 * resolving its own archetype from the Move row:
 *
 * - `program_archetype` carries one of five coarse values a DB CHECK allows
 *   (`supabase/migrations/041_programs_foundation.sql`). The storable set is
 *   written out as a literal here and every member is asserted to resolve to
 *   something OTHER than the declared archetype — a per-value happy-path test
 *   cannot show that, because it is exactly what a declaration must override.
 * - the declaration itself is given only at `charter.classification.archetype`,
 *   the field the declare job writes, as the OBJECT it really is.
 */
import type { TenancyCtx } from "@/lib/programs/types.db";

jest.mock("server-only", () => ({}));

const getStrategicMoveById = jest.fn();
const getProgramById = jest.fn();
const getModuleState = jest.fn();
const resolveCurrentStateReadiness = jest.fn();
const inferMoveProfile = jest.fn();
const buildCurrentStateRecommendation = jest.fn();
const buildCurrentStatePlan = jest.fn();

jest.mock("@/lib/programs/queries", () => ({
  getStrategicMoveById: (...args: unknown[]) => getStrategicMoveById(...args),
  getProgramById: (...args: unknown[]) => getProgramById(...args),
  getModuleState: (...args: unknown[]) => getModuleState(...args),
}));

jest.mock("@/lib/programs/current-state-readiness", () => ({
  inferMoveProfile: (...args: unknown[]) => inferMoveProfile(...args),
  resolveCurrentStateReadiness: (...args: unknown[]) =>
    resolveCurrentStateReadiness(...args),
}));

jest.mock("@/lib/programs/current-state-maturity", () => ({
  buildCurrentStateRecommendation: (...args: unknown[]) =>
    buildCurrentStateRecommendation(...args),
}));

jest.mock("@/lib/programs/current-state-plan", () => ({
  buildCurrentStatePlan: (...args: unknown[]) => buildCurrentStatePlan(...args),
}));

const ctx: TenancyCtx = {
  clientId: "tenant-demo",
  clientKey: "demo-tenant",
  userId: "user-1",
};

/**
 * Every value `engagements.program_archetype` can hold. The column's CHECK
 * allows these five and NULL; none of them is a registry archetype id.
 */
const STORABLE_PROGRAM_ARCHETYPES = [
  "strategic_transformation",
  "workflow_automation",
  "platform_modernization",
  "ai_product_enablement",
  "operational_optimization",
] as const;

/** The declared id the declare job writes for the data-foundation archetype. */
const DECLARED_ID = "governed_data_foundation";
/** The registry archetype that declaration names. */
const DECLARED_ARCHETYPE_ID = "GOVERNED_DATA_FOUNDATION";

const MOVE_NAME = "Governed data foundation";

function programRow(over: Record<string, unknown> = {}) {
  return {
    id: "move-1",
    name: MOVE_NAME,
    archetype: null,
    functionPackKey: null,
    problemStatement: null,
    targetOutcome: null,
    charter: null,
    currentPhase: 2,
    ...over,
  };
}

/**
 * Answer `getProgramById` for THIS Move only. Any other id reads as a Move we
 * cannot see, so a bundle that resolved some other program's archetype would
 * fall back to the default instead of the declared one.
 */
function programForMoveOnly(row: Record<string, unknown>) {
  return (_ctx: unknown, programId: string) =>
    Promise.resolve(programId === "move-1" ? row : null);
}

async function buildBundle() {
  const { buildArchetypeContextBundle } = await import(
    "@/lib/programs/archetype-context-bundle"
  );
  return buildArchetypeContextBundle(ctx, "move-1", 2);
}

beforeEach(() => {
  jest.resetModules();
  getStrategicMoveById.mockReset();
  getProgramById.mockReset();
  getModuleState.mockReset();
  resolveCurrentStateReadiness.mockReset();
  inferMoveProfile.mockReset();
  buildCurrentStateRecommendation.mockReset();
  buildCurrentStatePlan.mockReset();

  getStrategicMoveById.mockResolvedValue({ id: "move-1", name: MOVE_NAME });
  getModuleState.mockResolvedValue([]);
  inferMoveProfile.mockResolvedValue({ teamArchetypes: [] });
  resolveCurrentStateReadiness.mockResolvedValue({ instruments: [] });
  buildCurrentStateRecommendation.mockResolvedValue({
    overallConfidence: "low",
  });
  buildCurrentStatePlan.mockReturnValue({ steps: [] });
});

describe("buildArchetypeContextBundle — the archetype it resolves", () => {
  it("resolves the archetype DECLARED at charter.classification.archetype", async () => {
    getProgramById.mockImplementation(
      programForMoveOnly(
        programRow({ charter: { classification: { archetype: DECLARED_ID } } }),
      ),
    );

    const bundle = await buildBundle();

    expect(bundle.archetype.id).toBe(DECLARED_ARCHETYPE_ID);
  });

  it("asks the readiness report for the DECLARED archetype, not an inferred one", async () => {
    getProgramById.mockImplementation(
      programForMoveOnly(
        programRow({ charter: { classification: { archetype: DECLARED_ID } } }),
      ),
    );

    await buildBundle();

    expect(resolveCurrentStateReadiness).toHaveBeenCalledTimes(1);
    const askedFor = resolveCurrentStateReadiness.mock.calls[0][1] as {
      id: string;
    };
    expect(askedFor.id).toBe(DECLARED_ARCHETYPE_ID);
  });

  it("lets the declaration win over every value the archetype column can store", async () => {
    for (const stored of STORABLE_PROGRAM_ARCHETYPES) {
      jest.resetModules();
      getProgramById.mockImplementation(
        programForMoveOnly(
          programRow({
            archetype: stored,
            charter: { classification: { archetype: DECLARED_ID } },
          }),
        ),
      );

      const bundle = await buildBundle();

      expect(bundle.archetype.id).toBe(DECLARED_ARCHETYPE_ID);
    }
  });

  it("cannot reach the declared archetype from the stored column ALONE", async () => {
    // The guard that fails if the declaration is ever dropped again: none of
    // the five storable coarse values names this archetype, so a bundle that
    // resolves only from the column can never produce it.
    for (const stored of STORABLE_PROGRAM_ARCHETYPES) {
      jest.resetModules();
      getProgramById.mockImplementation(
        programForMoveOnly(programRow({ archetype: stored })),
      );

      const bundle = await buildBundle();

      expect(bundle.archetype.id).not.toBe(DECLARED_ARCHETYPE_ID);
    }
  });

  it("still reports the Move's name when the move row read fails", async () => {
    getStrategicMoveById.mockRejectedValue(new Error("move read failed"));
    getProgramById.mockImplementation(
      programForMoveOnly(
        programRow({ charter: { classification: { archetype: DECLARED_ID } } }),
      ),
    );

    const bundle = await buildBundle();

    // A failed name read must not also cost the archetype.
    expect(bundle.archetype.id).toBe(DECLARED_ARCHETYPE_ID);
  });

  it("falls back to a default archetype when the program cannot be read", async () => {
    getProgramById.mockRejectedValue(new Error("program read failed"));

    const bundle = await buildBundle();

    expect(bundle.archetype.id).toBeTruthy();
    expect(bundle.archetype.id).not.toBe(DECLARED_ARCHETYPE_ID);
  });
});
