import fs from "node:fs";
import path from "node:path";
const mockGetProgramById = jest.fn();
const mockQuery = jest.fn();
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: (...args: unknown[]) => mockQuery(...args) },
}));
import {
  buildDiscoveryBlueprintInputFromProgram,
  evaluateDiscoveryEvidenceReadiness,
  resolveDeclaredProgramArchetypeId,
  loadDiscoveryEvidenceReadiness,
} from "../evidence-readiness";
import { resolveDiscoveryBlueprintWithBasis } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

describe("discovery readiness shares the page's authorized program", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue([]);
  });
  const ctx = { clientId: "client-1", clientKey: "tenant-a", userId: "user-a" };
  it("retains the declared blueprint without repeating the program read", async () => {
    const loadProgram = jest.fn(
      async () =>
        ({
          id: "move-a",
          name: "A move",
          functionPackKey: "governed_data_foundation",
        }) as never,
    );
    const pack = await loadDiscoveryEvidenceReadiness(ctx, "move-a", {
      loadProgram,
    });
    expect(pack.blueprintId).toBe("governed_data_foundation");
    expect(pack.blueprintBasis).toBe("declared");
    expect(loadProgram).toHaveBeenCalledWith(ctx, "move-a");
    expect(mockGetProgramById).not.toHaveBeenCalled();
  });
  it("propagates an unavailable shared program instead of using a fallback blueprint", async () => {
    const error = new Error("Move read unavailable");
    const loadProgram = jest.fn(async () => {
      throw error;
    });
    await expect(
      loadDiscoveryEvidenceReadiness(ctx, "move-a", { loadProgram }),
    ).rejects.toBe(error);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockGetProgramById).not.toHaveBeenCalled();
  });

  it("starts the approved and backlog readbacks together after the authorized program resolves", async () => {
    let finish!: (rows: unknown[]) => void;
    const approved = new Promise<unknown[]>((resolve) => {
      finish = resolve;
    });
    mockQuery.mockImplementation((sql: string) =>
      sql.includes("INNER JOIN") ? approved : Promise.resolve([]),
    );
    const loadProgram = jest.fn(
      async () =>
        ({
          id: "move-a",
          functionPackKey: "governed_data_foundation",
        }) as never,
    );
    const options = { loadProgram, parallelReadbacks: true };
    const reading = loadDiscoveryEvidenceReadiness(ctx, "move-a", options);
    await new Promise<void>((resolve) => setImmediate(resolve));
    try {
      expect(mockQuery).toHaveBeenCalledTimes(2);
      for (const [, params] of mockQuery.mock.calls)
        expect(params[0]).toBe("move-a");
    } finally {
      finish([]);
      await reading;
    }
  });

  it.each(["approved", "backlog"])(
    "keeps a failed %s flagged readback unavailable",
    async (read) => {
      const error = new Error(`${read} unavailable`);
      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes("INNER JOIN") === (read === "approved")) throw error;
        return [];
      });
      const loadProgram = jest.fn(
        async () =>
          ({
            id: "move-a",
            functionPackKey: "governed_data_foundation",
          }) as never,
      );
      const options = { loadProgram, parallelReadbacks: true };
      await expect(
        loadDiscoveryEvidenceReadiness(ctx, "move-a", options),
      ).rejects.toBe(error);
    },
  );

  it("does not read evidence for an unreadable program during flagged prefetch", async () => {
    const options = {
      loadProgram: jest.fn(async () => null),
      parallelReadbacks: true,
    };
    await expect(
      loadDiscoveryEvidenceReadiness(ctx, "move-a", options),
    ).rejects.toThrow("Move unavailable");
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

/** Resolve a program exactly as `loadDiscoveryEvidenceReadiness` does. */
function resolveForProgram(program: Record<string, unknown>) {
  return resolveDiscoveryBlueprintWithBasis(
    buildDiscoveryBlueprintInputFromProgram(program),
    resolveDeclaredProgramArchetypeId(program),
  );
}

function packFor(program: Record<string, unknown>) {
  const resolution = resolveForProgram(program);
  return evaluateDiscoveryEvidenceReadiness({
    blueprint: resolution.blueprint,
    blueprintBasis: resolution.basis,
    unknownDeclaredArchetype: resolution.unknownDeclaration,
    evidenceItems: [],
  });
}

describe("the readiness pack says whether its archetype was declared", () => {
  it("reports a declared archetype as declared", () => {
    const pack = packFor({
      name: "A move",
      functionPackKey: "governed_data_foundation",
    });
    expect(pack.blueprintId).toBe("governed_data_foundation");
    expect(pack.blueprintBasis).toBe("declared");
    expect(pack.unknownDeclaredArchetype).toBeNull();
  });

  it("does not report an inferred archetype as declared, and names the discarded declaration", () => {
    // A program whose declared key is NOT a catalog archetype. The declared key
    // is also the first token of the inference blob, so inference can still
    // land on a specific blueprint -- and the pack would otherwise present that
    // blueprint's gap register as if somebody had chosen it.
    const pack = packFor({
      name: "Recovery operations move",
      functionPackKey: "ai_ops_custmer_digital",
      problemStatement: "irops recovery during disruption operations",
    });
    expect(pack.blueprintId).toBe("ai_operations_customer_digital");
    expect(pack.blueprintBasis).not.toBe("declared");
    expect(pack.blueprintBasis).not.toBe("declared_via_use_case");
    expect(pack.unknownDeclaredArchetype).toBe("ai_ops_custmer_digital");
  });

  it("reports nothing-declared as not-declared with no discarded token", () => {
    const pack = packFor({
      name: "Recovery operations move",
      problemStatement: "irops recovery during disruption operations",
    });
    expect(pack.blueprintBasis).toBe("inferred");
    expect(pack.unknownDeclaredArchetype).toBeNull();
  });

  it("falls back to not-declared for a caller that supplies no basis", () => {
    const resolution = resolveForProgram({
      functionPackKey: "governed_data_foundation",
    });
    const pack = evaluateDiscoveryEvidenceReadiness({
      blueprint: resolution.blueprint,
      evidenceItems: [],
    });
    expect(pack.blueprintBasis).toBe("inferred");
    expect(pack.unknownDeclaredArchetype).toBeNull();
  });
});

// `loadDiscoveryEvidenceReadiness` is the only caller that puts the basis on a
// pack a person reads, and it is `server-only` over two live reads, so the
// cases above resolve-and-pass by hand instead. That means deleting the two
// lines that pass the basis through leaves every case above green while the
// live pack reports every program -- declared ones included -- as inferred.
// This reads the host and pins the call site.
describe("the loader's own call site passes the resolved basis through", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "evidence-readiness.ts"),
    "utf8",
  );

  it("resolves through the basis-aware resolver", () => {
    expect(source).toContain("resolveDiscoveryBlueprintWithBasis(");
  });

  it("hands the pack builder the basis and the discarded declaration", () => {
    // Anchor on the CALL, not on `return ...` preceding it: the loader may
    // wrap the pack to add non-grading fields, and this case is about the
    // arguments handed to the evaluator, not the statement shape around it.
    const callAt = source.indexOf("evaluateDiscoveryEvidenceReadiness({");
    expect(callAt).toBeGreaterThan(-1);
    const call = source.slice(callAt);
    const args = call.slice(0, call.indexOf("evidenceItems:"));
    expect(args).toContain("blueprintBasis: resolution.basis");
    expect(args).toContain(
      "unknownDeclaredArchetype: resolution.unknownDeclaration",
    );
  });
});
