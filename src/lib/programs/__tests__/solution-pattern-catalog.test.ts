/**
 * Is a Move asked a platform-fit question it can answer honestly?
 *
 * The platform-fit gate writes a named owner's explicit classification to the
 * charter, and `readSolutionPatternFromCharter` returns a value only when it is
 * one of the recognised patterns. So an option set that does not describe the
 * declared kind of work does not degrade gracefully: the owner either picks a
 * label that misdescribes the Move, or records nothing and the gate stays
 * unanswered. Before the catalog, every Move was offered the same five, one of
 * which names a core clinical system — including a Move that declares it is
 * building a governed data foundation.
 *
 * The two halves of validation are deliberately asymmetric and each is pinned
 * here. WRITE is scoped to the resolved set, so an off-archetype classification
 * cannot be recorded. READ spans every set, so a pattern already recorded stays
 * readable if the Move's declaration later changes — otherwise a signed
 * classification would silently vanish from the charter.
 *
 * Resolution is exact-match on the DECLARED archetype id, per the product-wide
 * rule that identity is declared and never inferred. The negative case uses a
 * spelling that would match on any keyword or prose rule, so a resolver that
 * started inferring fails here.
 */
import {
  ALL_SOLUTION_PATTERN_VALUES,
  DEFAULT_SOLUTION_PATTERN_OPTIONS,
  GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS,
  isSolutionPatternAllowedFor,
  SOLUTION_PATTERN_CATALOG,
  SOLUTION_PATTERN_ROUTING_NOTES,
  solutionPatternOptionsFor,
} from "@/lib/programs/solution-pattern-catalog";
import { archetypeForDeclaredId } from "@/lib/programs/archetypes/registry";
import {
  embedSolutionPatternInCharter,
  readSolutionPatternFromCharter,
  SOLUTION_PATTERN_OPTIONS,
} from "@/lib/programs/solution-pattern";

/**
 * Written out as a literal rather than read off the default set: the point of
 * the governed-data-foundation case below is that THIS option is the one a
 * data-foundation Move must not be offered, and deriving it from the module
 * under test would let a rename pass the negative assertion.
 */
const CORE_CLINICAL_SYSTEM_OPTION = "Native to the Core Clinical System";

describe("solutionPatternOptionsFor — declared archetype decides the set", () => {
  it("serves the shipped set, in order, when nothing is declared", () => {
    for (const undeclared of [undefined, null, "", "   "]) {
      expect(solutionPatternOptionsFor(undeclared)).toEqual(
        DEFAULT_SOLUTION_PATTERN_OPTIONS,
      );
    }
  });

  it("keeps the shipped set for a declared archetype with no configured set", () => {
    expect(solutionPatternOptionsFor("contact_center_agent_assist")).toEqual(
      DEFAULT_SOLUTION_PATTERN_OPTIONS,
    );
  });

  it("does NOT infer a set from a near-miss spelling of a configured id", () => {
    // Every one of these would match a keyword, prose or substring rule. Only
    // the exact declared id resolves.
    for (const nearMiss of [
      "governed data foundation",
      "governed-data-foundation",
      "a governed_data_foundation move",
      "governed_data_foundation_value",
    ]) {
      expect(solutionPatternOptionsFor(nearMiss)).toEqual(
        DEFAULT_SOLUTION_PATTERN_OPTIONS,
      );
    }
  });

  it("serves the configured set for a declared governed data foundation", () => {
    expect(solutionPatternOptionsFor("governed_data_foundation")).toEqual(
      GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS,
    );
  });

  it("tolerates the case and surrounding whitespace of a declared id", () => {
    expect(solutionPatternOptionsFor("  Governed_Data_Foundation  ")).toEqual(
      GOVERNED_DATA_FOUNDATION_SOLUTION_PATTERN_OPTIONS,
    );
  });

  it("stops offering a data-foundation Move the core clinical system", () => {
    const values = solutionPatternOptionsFor("governed_data_foundation").map(
      (option) => option.value,
    );
    expect(values).not.toContain(CORE_CLINICAL_SYSTEM_OPTION);
    // The control. Without it the assertion above would also pass if the
    // option had simply been renamed everywhere, or if resolution had started
    // returning an empty set.
    expect(
      DEFAULT_SOLUTION_PATTERN_OPTIONS.map((option) => option.value),
    ).toContain(CORE_CLINICAL_SYSTEM_OPTION);
    expect(values).toHaveLength(DEFAULT_SOLUTION_PATTERN_OPTIONS.length);
  });
});

describe("catalog hygiene", () => {
  const everySet = [
    { label: "default", options: DEFAULT_SOLUTION_PATTERN_OPTIONS },
    ...Object.entries(SOLUTION_PATTERN_CATALOG).map(([key, options]) => ({
      label: key,
      options,
    })),
  ];

  it("keys every configured set by an id that names a known archetype", () => {
    // A typo here resolves nothing and is invisible: the Move silently keeps
    // the shipped set, which is exactly the bug the catalog exists to fix.
    for (const key of Object.keys(SOLUTION_PATTERN_CATALOG)) {
      expect(archetypeForDeclaredId(key)).toBeDefined();
    }
  });

  it("gives every option one of the three recognised routing dispositions", () => {
    // The panel maps the note to a chip tone; an unrecognised note renders a
    // neutral chip that states no disposition at all.
    for (const { label, options } of everySet) {
      for (const option of options) {
        expect(SOLUTION_PATTERN_ROUTING_NOTES).toContain(
          option.routingNote as (typeof SOLUTION_PATTERN_ROUTING_NOTES)[number],
        );
        expect(`${label}: ${option.description}`.trim().length).toBeGreaterThan(
          label.length + 20,
        );
      }
    }
  });

  it("offers no duplicate pattern within a set", () => {
    for (const { options } of everySet) {
      const values = options.map((option) => option.value);
      expect(new Set(values).size).toBe(values.length);
      expect(values.length).toBeGreaterThan(0);
    }
  });

  it("counts every set's patterns in the read-validation union", () => {
    for (const { options } of everySet) {
      for (const option of options) {
        expect(ALL_SOLUTION_PATTERN_VALUES.has(option.value)).toBe(true);
      }
    }
  });

  it("keeps SOLUTION_PATTERN_OPTIONS the shipped set", () => {
    // The re-export every existing consumer still imports.
    expect(SOLUTION_PATTERN_OPTIONS).toEqual(DEFAULT_SOLUTION_PATTERN_OPTIONS);
  });
});

describe("write validation is scoped to the Move's own set", () => {
  const defaultOnly = CORE_CLINICAL_SYSTEM_OPTION;
  const gdfOnly = "Native to the Core System of Record";

  it("accepts a pattern the Move is offered", () => {
    expect(isSolutionPatternAllowedFor(null, defaultOnly)).toBe(true);
    expect(isSolutionPatternAllowedFor("governed_data_foundation", gdfOnly)).toBe(
      true,
    );
  });

  it("refuses a pattern from a set the Move is not asked, in both directions", () => {
    expect(isSolutionPatternAllowedFor("governed_data_foundation", defaultOnly)).toBe(
      false,
    );
    expect(isSolutionPatternAllowedFor(null, gdfOnly)).toBe(false);
  });

  it("refuses a non-string and an unknown pattern", () => {
    for (const bad of [undefined, null, 7, {}, [], "Build on the Moon"]) {
      expect(isSolutionPatternAllowedFor("governed_data_foundation", bad)).toBe(
        false,
      );
    }
  });
});

describe("read validation never orphans a recorded classification", () => {
  it("reads back a pattern recorded under a set the Move is no longer asked", () => {
    // A named owner classified this Move while it declared a governed data
    // foundation. If the declaration is later removed or changed, the signed
    // classification must still be readable — scoping READ to the resolved set
    // would make it disappear from the charter with no record of the loss.
    const charter = embedSolutionPatternInCharter(
      {},
      {
        pattern: "Govern on the Platform",
        rationale: "Certified definitions run on the platform already in place.",
      },
    );
    expect(readSolutionPatternFromCharter(charter)).toEqual({
      pattern: "Govern on the Platform",
      rationale: "Certified definitions run on the platform already in place.",
    });
  });

  it("still refuses a pattern no set offers", () => {
    const charter = {
      p3_solution_pattern_v1: {
        pattern: "Build on the Moon",
        rationale: "Not a recognised pattern.",
      },
    };
    expect(readSolutionPatternFromCharter(charter)).toBeNull();
  });
});
