/**
 * The stage-readiness workbook's question set is the resolved archetype's
 * evidence families. These cases hold the workbook to saying which archetype
 * shaped it and who chose it — on the sheet a human reads, not only in the
 * veryHidden metadata sheet — and to never calling an inferred or general-case
 * archetype "declared".
 */

import {
  buildStageReadinessArchetypeBasis,
  isDeclaredArchetypeBasis,
  DECLARED_ARCHETYPE_MARKER,
} from "@/lib/programs/stage-readiness-workbooks/archetype-basis";
import type { DiscoveryBlueprintBasis } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

const ALL_BASES: DiscoveryBlueprintBasis[] = [
  "declared",
  "declared_via_use_case",
  "inferred",
  "default",
];

describe("stage-readiness workbook archetype basis", () => {
  it("covers every basis the resolver can return", () => {
    // Guards the switch against a new basis arriving with no clause: a basis
    // this module does not handle would return undefined and render an empty
    // sentence on the operator's sheet.
    for (const basis of ALL_BASES) {
      const built = buildStageReadinessArchetypeBasis({
        archetype: "Governed Data Foundation",
        blueprintBasis: basis,
        unknownDeclaredArchetype: null,
      });
      expect(typeof built.statement).toBe("string");
      expect(built.statement.trim().length).toBeGreaterThan(0);
      expect(built.basis).toBe(basis);
    }
  });

  it("claims a declaration only for the two declared bases", () => {
    // The whole point: identity is declared, never inferred. An inferred or
    // general-case archetype must not be presented as somebody's choice.
    const declaring = ALL_BASES.filter((basis) =>
      buildStageReadinessArchetypeBasis({
        archetype: "Governed Data Foundation",
        blueprintBasis: basis,
        unknownDeclaredArchetype: null,
      }).statement.includes(DECLARED_ARCHETYPE_MARKER),
    );
    expect(declaring).toEqual(["declared", "declared_via_use_case"]);

    for (const basis of ALL_BASES) {
      expect(
        buildStageReadinessArchetypeBasis({
          archetype: "Governed Data Foundation",
          blueprintBasis: basis,
          unknownDeclaredArchetype: null,
        }).declared,
      ).toBe(isDeclaredArchetypeBasis(basis));
    }
  });

  it("names the archetype that shaped the questions", () => {
    for (const basis of ALL_BASES) {
      expect(
        buildStageReadinessArchetypeBasis({
          archetype: "Regulated Claims Automation",
          blueprintBasis: basis,
          unknownDeclaredArchetype: null,
        }).statement,
      ).toContain("Regulated Claims Automation");
    }
  });

  it("says a general-case question set is not archetype-specific", () => {
    // The demo path today: nothing is declared on the Move, so the resolver
    // returns `default` and the general blueprint. The workbook has to say the
    // questions are not the archetype's.
    const built = buildStageReadinessArchetypeBasis({
      archetype: "General (default)",
      blueprintBasis: "default",
      unknownDeclaredArchetype: null,
    });
    expect(built.declared).toBe(false);
    expect(built.statement).toBe(
      "No archetype has been declared on this Move, so these questions come " +
        "from the General (default) question set rather than an " +
        "archetype-specific one.",
    );
    // The denial must not satisfy a check for the declaration. This is the
    // assertion that caught the first phrasing, where the affirmative clause
    // was a substring of this sentence.
    expect(built.statement).not.toContain(DECLARED_ARCHETYPE_MARKER);
  });

  it("says an inferred archetype was matched from wording and unconfirmed", () => {
    const built = buildStageReadinessArchetypeBasis({
      archetype: "Governed Data Foundation",
      blueprintBasis: "inferred",
      unknownDeclaredArchetype: null,
    });
    expect(built.declared).toBe(false);
    expect(built.statement).toContain("rather than declared");
    expect(built.statement).toContain("No one has confirmed it");
  });

  it("reports a supplied declaration that was discarded, and leads with it", () => {
    // Measured on the real resolver: a `functionPackKey` or charter archetype
    // that names no catalog archetype yields basis `default` with the supplied
    // value carried as `unknownDeclaredArchetype`. The operator who supplied it
    // would otherwise see a general-case workbook and no sign it was dropped.
    const built = buildStageReadinessArchetypeBasis({
      archetype: "General (default)",
      blueprintBasis: "default",
      unknownDeclaredArchetype: "finance",
    });
    expect(built.discardedDeclaration).toBe("finance");
    expect(built.declared).toBe(false);
    expect(built.statement).toContain('"finance" was supplied');
    expect(built.statement).toContain("was discarded");
    // Leads with the discard, then still explains what shaped the questions.
    expect(built.statement.indexOf("finance")).toBeLessThan(
      built.statement.indexOf("No archetype has been declared"),
    );
  });

  it("treats a blank discarded declaration as none", () => {
    expect(
      buildStageReadinessArchetypeBasis({
        archetype: "General (default)",
        blueprintBasis: "default",
        unknownDeclaredArchetype: "   ",
      }).discardedDeclaration,
    ).toBeNull();
  });

  it("falls back to a readable archetype when the label is blank", () => {
    const built = buildStageReadinessArchetypeBasis({
      archetype: "   ",
      blueprintBasis: "default",
      unknownDeclaredArchetype: null,
    });
    expect(built.archetype).toBe("general");
    expect(built.statement).toContain("general");
  });
});
