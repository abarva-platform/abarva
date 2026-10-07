/**
 * The CALLER half of the declared-archetype fix.
 *
 * `resolveProgramArchetype` can honor a declaration only if someone passes it
 * one. `resolveMoveArchetypeForProgram` is the single helper eleven call sites
 * (the phase page and ten API routes) use to answer "what kind of Move is
 * this", and it is server-only with no suite of its own — so dropping the
 * `declaredArchetypeId` argument would leave every registry-side test green
 * while the fix became inert. These cases read the wiring through the exported
 * function, with the data layer mocked.
 *
 * The sibling `playbook/__tests__/route.test.ts` records the same hazard from
 * the other side: `program.archetype` is "a coarse 5-value UI label
 * (`strategic_transformation`, etc.), not the fine-grained framework archetype
 * id" — which is exactly why it must not be read as a declaration here.
 */

const mockGetProgramById = jest.fn();
const mockGetModuleState = jest.fn();

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (ctx: unknown, id: string) => mockGetProgramById(ctx, id),
  getModuleState: (ctx: unknown, id: string) => mockGetModuleState(ctx, id),
}));

jest.mock("@/lib/programs/phase-capture-contract", () => ({
  getPhaseCaptureSections: () => [],
  phaseCaptureModuleKey: (phase: number, key: string) => `p${phase}:${key}`,
}));

import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";
import { DEFAULT_ARCHETYPE_ID } from "@/lib/programs/archetypes/registry";

const CTX = { tenantKey: "demo" } as never;

/**
 * Healthcare data-foundation prose. A Move of this kind MUST name the systems
 * it governs and the identities it resolves, and that vocabulary belongs to
 * other archetypes — so this text is what the inference path mis-reads.
 */
const FOUNDATION_TEXT = {
  problemStatement:
    "Certify a governed data foundation before any AI/LLM automation is claimed",
  targetOutcome:
    "Source system data access (EMR, claims, pharmacy, marts) governed; patient, member and provider identity resolved",
};

function program(overrides: Record<string, unknown>) {
  return {
    id: "move-1",
    name: "Governed Data Foundation for AI Automation",
    archetype: "platform_modernization",
    functionPackKey: null,
    charter: null,
    ...FOUNDATION_TEXT,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetModuleState.mockResolvedValue([]);
});

describe("resolveMoveArchetypeForProgram — a declaration reaches the registry", () => {
  it("honors charter.classification.archetype (where the job writes it)", async () => {
    mockGetProgramById.mockResolvedValue(
      program({
        charter: { classification: { archetype: "governed_data_foundation" } },
      }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("honors functionPackKey", async () => {
    mockGetProgramById.mockResolvedValue(
      program({ functionPackKey: "governed_data_foundation" }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("reads the charter declaration past a pack key that names no archetype", async () => {
    // Both declaration fields populated. `functionPackKey` holds a
    // function-pack key, a different id space that the bridge answers null
    // for; reading it unconditionally sent that null-naming value to the
    // registry's declared arm and dropped the Move onto keyword inference,
    // which answers AI_PRODUCT_DEVELOPMENT_LIFECYCLE for this prose.
    mockGetProgramById.mockResolvedValue(
      program({
        functionPackKey: "healthcare_member_services",
        charter: { classification: { archetype: "governed_data_foundation" } },
      }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("still prefers a pack key that DOES name an archetype", async () => {
    mockGetProgramById.mockResolvedValue(
      program({
        functionPackKey: "governed_data_foundation",
        charter: {
          classification: { archetype: "healthcare_contact_center_agent_assist" },
        },
      }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("leaves a Move whose pack key names nothing and declares nothing alone", async () => {
    // The unchanged half: with no charter declaration the pack key is still
    // the inference seed, so this Move resolves exactly as it did before.
    mockGetProgramById.mockResolvedValue(
      program({ functionPackKey: "healthcare_member_services" }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).not.toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("tolerates a charter whose classification is a bare string", async () => {
    // `charter.classification` is a string on older Moves. Reading `.archetype`
    // off it must not throw — resolution falls back to inference.
    mockGetProgramById.mockResolvedValue(
      program({ charter: { classification: "governed data foundation" } }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).not.toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("does NOT read the coarse legacy archetype column as a declaration", async () => {
    // `program.archetype` is one of five legacy UI labels. None names a
    // registry archetype, and treating it as a declaration would make every
    // Move's identity depend on a column nobody declared anything in.
    mockGetProgramById.mockResolvedValue(
      program({ archetype: "platform_modernization" }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).not.toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("leaves an UNDECLARED Move on the inference path", async () => {
    mockGetProgramById.mockResolvedValue(program({}));
    const undeclared = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(undeclared.id).not.toBe("GOVERNED_DATA_FOUNDATION");

    // And the same Move WITH the declaration resolves differently — the pair is
    // what proves the argument is actually threaded through.
    mockGetProgramById.mockResolvedValue(
      program({
        charter: { classification: { archetype: "governed_data_foundation" } },
      }),
    );
    const declared = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(declared.id).toBe("GOVERNED_DATA_FOUNDATION");
    expect(declared.id).not.toBe(undeclared.id);
  });

  it("falls back to the default when there is no program at all", async () => {
    mockGetProgramById.mockResolvedValue(null);
    const resolved = await resolveMoveArchetypeForProgram(CTX, "missing");
    expect(resolved.id).toBe(DEFAULT_ARCHETYPE_ID);
  });

  it("still resolves when capture text cannot be loaded", async () => {
    mockGetModuleState.mockRejectedValue(new Error("db down"));
    mockGetProgramById.mockResolvedValue(
      program({
        charter: { classification: { archetype: "governed_data_foundation" } },
      }),
    );
    const resolved = await resolveMoveArchetypeForProgram(CTX, "move-1");
    expect(resolved.id).toBe("GOVERNED_DATA_FOUNDATION");
  });
});
