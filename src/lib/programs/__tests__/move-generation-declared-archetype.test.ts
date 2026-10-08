// A Move's DECLARED archetype must reach the deliverable-generation path.
//
// `POST /api/v1/deliverables/generate-phase` is handed `useCaseArchetype` by the
// client, and the value the client has to give is `StrategicMove.archetype` —
// the coarse `program.archetype` column, one of five legacy `ArchetypeKey`
// values. None of those five names a discovery blueprint, so for every Move
// built through Approve & Build, blueprint selection fell through to keyword
// inference over a single coarse token and the Move's declaration contributed
// nothing. `unknownDeclaration` stayed null too, so nothing downstream could
// even report that a declaration had been discarded.
//
// `createMoveContextExtract` now takes `declaredArchetypeId` and passes it to
// the blueprint resolver, and the route resolves it with the same rule the
// upload / solution-pattern / risk-assessment routes already apply.
//
// J1 pins the PRECONDITION that makes this a defect rather than a preference:
//     no value `useCaseArchetype` can carry on this path is a declaration.
// J2 pins the fix: a declaration selects its blueprint whatever coarse archetype
//     the request carried.
// J3 pins that nothing else moved: no declaration, or one that names no catalog
//     archetype, reproduces today's selection exactly.
// J4 drives J2 through the real declaration CHANNELS (a program row), not a
//     hand-passed id, so the rule under test is the one production applies.
//
// The route's own pass-through is pinned in
// `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`; a rule
// proven only at the callee would stay green if the wiring were dropped.

const queryContext = jest.fn();
const saveArtifact = jest.fn();
const recordEvidence = jest.fn();
const existingExtract = jest.fn();
const loadMoveEvidence = jest.fn();

jest.mock("@/lib/azure-search/tenant-context-retriever", () => ({
  queryTenantContext: (...args: unknown[]) => queryContext(...args),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (...args: unknown[]) => saveArtifact(...args),
}));

jest.mock("@/lib/programs/evidence-ingestion", () => ({
  recordProgramEvidence: (...args: unknown[]) => recordEvidence(...args),
}));

import { createMoveContextExtract } from "../move-context-extract";
import { resolveDeclaredProgramArchetypeId } from "@/lib/programs/discovery/evidence-readiness";
import {
  DISCOVERY_BLUEPRINT_CATALOG,
  resolveDiscoveryBlueprintWithBasis,
} from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import { resolveConfiguredArchetypePack } from "@/lib/deliverables/orchestrator/briefs/archetype-config-source";

/**
 * Every value `StrategicMove.archetype` can hold — the `ArchetypeKey` union in
 * `src/lib/programs/types.ui.ts`, which is the only archetype the Approve &
 * Build control has to send. Spelled out rather than imported because the claim
 * is about this exact closed set; if the union gains a member, J1 should be
 * re-measured deliberately rather than silently widened.
 */
const PROGRAM_ARCHETYPE_KEYS = [
  "strategic_transformation",
  "workflow_automation",
  "platform_modernization",
  "ai_product_enablement",
  "operational_optimization",
] as const;

const ctx = {
  clientId: "client-uuid",
  clientKey: "demo-tenant",
  userId: "user-1",
};

const baseInput = {
  ctx,
  moveId: "11111111-1111-1111-1111-111111111111",
  tenantKey: "demo-tenant",
  phase: 2,
  targetPhase: 2,
  moveName: "Governed data platform",
  phaseLabel: "P2 Discover",
  phasePurpose: "Establish the current-state evidence base.",
};

beforeEach(() => {
  queryContext.mockReset();
  saveArtifact.mockReset();
  recordEvidence.mockReset();
  existingExtract.mockReset();
  loadMoveEvidence.mockReset();
  queryContext.mockResolvedValue([]);
  existingExtract.mockResolvedValue(null);
  loadMoveEvidence.mockResolvedValue([]);
  saveArtifact.mockResolvedValue({
    artifactId: "artifact-1",
    version: 1,
    blobPath: "moves/demo-tenant/extract.md",
    blobStored: true,
  });
  recordEvidence.mockResolvedValue("evidence-1");
});

async function blueprintIdFor(input: {
  useCaseArchetype: string;
  declaredArchetypeId?: string | null;
}): Promise<string> {
  const result = await createMoveContextExtract(
    { ...baseInput, ...input },
    { queryContext, saveArtifact, recordEvidence, loadMoveEvidence, existingExtract },
  );
  return result.freshness.blueprintId;
}

describe("J1 — no coarse program archetype is a declaration", () => {
  it("not one ArchetypeKey value names a discovery blueprint", () => {
    const catalogKeys = Object.keys(DISCOVERY_BLUEPRINT_CATALOG);
    // Self-guard: a catalog with nothing declarable would make J2 vacuous.
    expect(catalogKeys.length).toBeGreaterThanOrEqual(2);
    expect(
      PROGRAM_ARCHETYPE_KEYS.filter((key) => catalogKeys.includes(key)),
    ).toEqual([]);
  });

  it("not one ArchetypeKey value resolves an archetype pack", () => {
    for (const key of PROGRAM_ARCHETYPE_KEYS) {
      const pack = resolveConfiguredArchetypePack(key);
      expect({ key, archetypeId: pack.archetypeId, origin: pack.origin }).toEqual({
        key,
        archetypeId: null,
        origin: "unresolved",
      });
    }
  });

  it("every ArchetypeKey value resolves on a NON-declared basis, and reports no discarded declaration", () => {
    for (const key of PROGRAM_ARCHETYPE_KEYS) {
      const resolution = resolveDiscoveryBlueprintWithBasis(key);
      expect(["inferred", "default"]).toContain(resolution.basis);
      // The reason this was invisible: nothing was reported as discarded,
      // because nothing was ever passed to discard.
      expect(resolution.unknownDeclaration).toBeNull();
    }
  });
});

describe("J2 — a declaration selects its blueprint whatever the request carried", () => {
  const declarable = Object.keys(DISCOVERY_BLUEPRINT_CATALOG);

  it("the table is not vacuous: at least one declarable archetype differs from what inference picks", () => {
    const differing = declarable.filter((declared) =>
      PROGRAM_ARCHETYPE_KEYS.some(
        (key) =>
          resolveDiscoveryBlueprintWithBasis(key).blueprint.blueprintId !==
          declared,
      ),
    );
    expect(differing.length).toBeGreaterThan(0);
  });

  for (const declared of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
    for (const carried of PROGRAM_ARCHETYPE_KEYS) {
      it(`declared ${declared} wins over carried ${carried}`, async () => {
        expect(
          await blueprintIdFor({
            useCaseArchetype: carried,
            declaredArchetypeId: declared,
          }),
        ).toBe(declared);
      });
    }
  }
});

describe("J3 — nothing else moved", () => {
  for (const carried of PROGRAM_ARCHETYPE_KEYS) {
    it(`no declaration reproduces today's selection for ${carried}`, async () => {
      const today = resolveDiscoveryBlueprintWithBasis(carried).blueprint
        .blueprintId;
      expect(await blueprintIdFor({ useCaseArchetype: carried })).toBe(today);
      expect(
        await blueprintIdFor({
          useCaseArchetype: carried,
          declaredArchetypeId: null,
        }),
      ).toBe(today);
    });

    it(`a declaration that names no catalog archetype changes nothing for ${carried}`, async () => {
      const today = resolveDiscoveryBlueprintWithBasis(carried).blueprint
        .blueprintId;
      // A real shape: function-pack keys live in a different id space and name
      // no archetype, so they are carried as the inference seed and discarded.
      expect(
        await blueprintIdFor({
          useCaseArchetype: carried,
          declaredArchetypeId: "CLAIMS_OPERATIONS",
        }),
      ).toBe(today);
    });
  }
});

describe("J5 — the declaration also decides what family the Move's evidence lands in", () => {
  // `getDiscoveryBlueprint` is called at TWO sites in the extract: once for the
  // reported blueprint, and once per evidence row to map it to a family. The
  // reported blueprint is observable with no evidence at all, so a case without
  // an evidence row leaves the per-row site unpinned — dropping the declaration
  // there alone would stay green.
  const lineageRow = {
    id: "ev-lineage",
    tenantKey: "demo-tenant",
    programId: baseInput.moveId,
    attachmentId: "att-lineage",
    phase: 2,
    evidenceType: "uploaded_evidence",
    title: "data-lineage-audit-trail-standard.txt",
    // Names the id phrase of a family in EACH blueprint, so the row is anchored
    // under both and the family it lands in is decided by the blueprint alone
    // rather than by one of them failing to match.
    summary:
      "Covers data lineage audit trail and current state process end to end.",
    extractedText:
      "Covers data lineage audit trail and current state process end to end.",
    extractedStructured: {
      source_type: "real_upload",
      citation: "data-lineage-audit-trail-standard.txt",
    },
    confidence: 0.9,
    createdAt: "2026-10-07T11:00:00Z",
  };

  async function familyFor(declaredArchetypeId: string | null) {
    loadMoveEvidence.mockResolvedValue([lineageRow]);
    const result = await createMoveContextExtract(
      {
        ...baseInput,
        useCaseArchetype: "platform_modernization",
        declaredArchetypeId,
      },
      { queryContext, saveArtifact, recordEvidence, loadMoveEvidence, existingExtract },
    );
    expect(result.attachedEvidenceItems).toHaveLength(1);
    return result.attachedEvidenceItems[0]?.evidenceFamily;
  }

  it("a declared Move's evidence lands in the DECLARED blueprint's family", async () => {
    expect(await familyFor("governed_data_foundation")).toBe(
      "data_lineage_audit_trail",
    );
  });

  it("the same row lands elsewhere when nothing is declared — so the two readings are distinguishable", async () => {
    expect(await familyFor(null)).toBe("current_state_process");
  });
});

describe("J4 — the declaration is honored through each real declaration channel", () => {
  // The channels `resolveDeclaredProgramArchetypeId` reads. The route resolves a
  // program ROW, so these are the shapes that actually reach it.
  const declared = "governed_data_foundation";
  const channels: { name: string; program: Record<string, unknown> }[] = [
    {
      name: "functionPackKey",
      program: { functionPackKey: declared, archetype: "platform_modernization" },
    },
    {
      name: "charter.classification.archetype",
      program: {
        archetype: "platform_modernization",
        charter: { classification: { archetype: declared } },
      },
    },
    {
      name: "charter.classification.archetype beside a pack key that names no archetype",
      program: {
        functionPackKey: "CLAIMS_OPERATIONS",
        archetype: "platform_modernization",
        charter: { classification: { archetype: declared } },
      },
    },
  ];

  it("the declarable id used here is in the catalog", () => {
    expect(Object.keys(DISCOVERY_BLUEPRINT_CATALOG)).toContain(declared);
  });

  for (const channel of channels) {
    it(`a Move declaring via ${channel.name} is graded against ${declared}`, async () => {
      const declaredArchetypeId = resolveDeclaredProgramArchetypeId(
        channel.program,
      );
      expect(declaredArchetypeId).toBe(declared);
      expect(
        await blueprintIdFor({
          // What the client sends for this Move, verbatim.
          useCaseArchetype: String(channel.program.archetype),
          declaredArchetypeId,
        }),
      ).toBe(declared);
    });
  }

  it("a Move that declares nothing is unchanged", async () => {
    const program = { archetype: "platform_modernization" };
    const declaredArchetypeId = resolveDeclaredProgramArchetypeId(program);
    // `program.archetype` is the only candidate, so it is returned as the
    // inference seed — and it names no catalog archetype.
    expect(declaredArchetypeId).toBe("platform_modernization");
    expect(
      await blueprintIdFor({
        useCaseArchetype: "platform_modernization",
        declaredArchetypeId,
      }),
    ).toBe(
      resolveDiscoveryBlueprintWithBasis("platform_modernization").blueprint
        .blueprintId,
    );
  });
});
