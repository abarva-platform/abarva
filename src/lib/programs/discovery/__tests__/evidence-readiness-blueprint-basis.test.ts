import fs from "node:fs";
import path from "node:path";
import {
  buildDiscoveryBlueprintInputFromProgram,
  evaluateDiscoveryEvidenceReadiness,
  resolveDeclaredProgramArchetypeId,
} from "../evidence-readiness";
import { resolveDiscoveryBlueprintWithBasis } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

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
