import {
  appendEvidenceFrameworkProvenance,
  resolveEvidenceFrameworkProvenance,
} from "@/lib/programs/evidence-framework-provenance";

/**
 * A phase refusal lists evidence slots and calls them required. The list is
 * correct; the word "required" is only true when a declaration chose the
 * framework the slots came from. These cases pin which inputs earn that word.
 */
describe("the evidence framework a refusal names states what chose it", () => {
  const declaredBases = ["declared", "declared_via_use_case"] as const;

  it.each(declaredBases)(
    "treats basis %s as declared and says so without hedging",
    (basis) => {
      const provenance = resolveEvidenceFrameworkProvenance({
        blueprintBasis: basis,
        archetypeLabel: "Governed Data Foundation",
        unknownDeclaredArchetype: null,
      });
      expect(provenance.declared).toBe(true);
      expect(provenance.origin).toBe("declared");
      expect(provenance.discardedDeclaration).toBeNull();
      expect(provenance.statement).toBe(
        "These evidence slots come from the declared Governed Data Foundation framework.",
      );
      expect(provenance.statement).not.toMatch(/not a declared requirement/);
    },
  );

  it("reports an inferred framework as not declared and names the framework", () => {
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "inferred",
      archetypeLabel: "Contact Center Agent Assist",
      unknownDeclaredArchetype: null,
    });
    expect(provenance.declared).toBe(false);
    expect(provenance.origin).toBe("inferred");
    expect(provenance.statement).toMatch(/not a declared requirement/);
    expect(provenance.statement).toContain("Contact Center Agent Assist");
    expect(provenance.statement).toContain("inferred from the Move's own text");
  });

  it("reports the general-case framework as not declared and not inferred", () => {
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "default",
      archetypeLabel: "General Case",
      unknownDeclaredArchetype: null,
    });
    expect(provenance.declared).toBe(false);
    expect(provenance.origin).toBe("default");
    expect(provenance.statement).toMatch(/none was inferred/);
    expect(provenance.statement).not.toMatch(
      /inferred from the Move's own text/,
    );
  });

  it("names a discarded declaration and does not call the replacement declared", () => {
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "inferred",
      archetypeLabel: "Contact Center Agent Assist",
      unknownDeclaredArchetype: "governed_data_foundaton",
    });
    expect(provenance.declared).toBe(false);
    expect(provenance.origin).toBe("declaration_discarded");
    expect(provenance.discardedDeclaration).toBe("governed_data_foundaton");
    expect(provenance.statement).toMatch(
      /named no framework in the catalog, so it was discarded/,
    );
    // The discarded id is shown, not just counted: it is the one string that
    // tells the operator WHAT was declared and why it resolved nothing.
    expect(provenance.statement).toContain('"governed_data_foundaton"');
  });

  it("lets a discarded declaration outrank even a declared basis", () => {
    // Both facts can be recorded at once: the basis reports how the REPLACEMENT
    // framework was chosen, which answers a different question than whether
    // THIS Move's declaration was honoured. The discard is the honest headline.
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "declared",
      archetypeLabel: "AI Product Development Lifecycle",
      unknownDeclaredArchetype: "governed_data_foundaton",
    });
    expect(provenance.origin).toBe("declaration_discarded");
    expect(provenance.declared).toBe(false);
  });

  /**
   * The negative case the last arm exists for. An enumerated ladder of negative
   * arms would let an unrecognised basis fall through as declared; membership is
   * checked positively so it cannot.
   */
  it.each([
    ["a future basis this build does not know", "declared_via_dataset"],
    ["an empty basis", ""],
    ["a missing basis", undefined],
    ["a non-string basis", 7],
    ["a null basis", null],
  ])("treats %s as not declared", (_label, basis) => {
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: basis,
      archetypeLabel: "Governed Data Foundation",
      unknownDeclaredArchetype: null,
    });
    expect(provenance.declared).toBe(false);
    expect(provenance.origin).toBe("unrecognised_basis");
    expect(provenance.statement).toMatch(/could not be read/);
    // It must not invent a reason the framework was chosen.
    expect(provenance.statement).not.toMatch(/inferred|general-case framework/);
  });

  it("carries the recorded basis through unchanged for the structured reader", () => {
    expect(
      resolveEvidenceFrameworkProvenance({
        blueprintBasis: "declared_via_dataset",
        archetypeLabel: "x",
        unknownDeclaredArchetype: null,
      }).basis,
    ).toBe("declared_via_dataset");
  });

  it("falls back to a neutral label rather than rendering a blank framework", () => {
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "inferred",
      archetypeLabel: "   ",
      unknownDeclaredArchetype: null,
    });
    expect(provenance.archetypeLabel).toBe("general-case");
    expect(provenance.statement).toContain("general-case framework");
  });

  it("bounds an over-long label and declaration rather than echoing them whole", () => {
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "inferred",
      archetypeLabel: "L".repeat(400),
      unknownDeclaredArchetype: `  ${"D".repeat(400)}  `,
    });
    expect(provenance.archetypeLabel).toHaveLength(120);
    expect(provenance.discardedDeclaration).toHaveLength(120);
  });

  it("ignores a blank declaration instead of reporting an empty discard", () => {
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "declared",
      archetypeLabel: "Governed Data Foundation",
      unknownDeclaredArchetype: "   ",
    });
    expect(provenance.discardedDeclaration).toBeNull();
    expect(provenance.origin).toBe("declared");
  });
});

describe("the refusal detail gains a sentence only when it would otherwise be false", () => {
  const detail =
    "Required evidence must be approved, linked to a sourced workbook answer, or formally resolved before this phase can close.";

  it("leaves a declared framework's detail byte-for-byte", () => {
    expect(
      appendEvidenceFrameworkProvenance(
        detail,
        resolveEvidenceFrameworkProvenance({
          blueprintBasis: "declared",
          archetypeLabel: "Governed Data Foundation",
          unknownDeclaredArchetype: null,
        }),
      ),
    ).toBe(detail);
  });

  it("leaves the detail unchanged when no provenance was resolved", () => {
    // `null` means readiness was never read. A refusal must not assert a
    // declaration it did not look at, and must not assert its absence either.
    expect(appendEvidenceFrameworkProvenance(detail, null)).toBe(detail);
    expect(appendEvidenceFrameworkProvenance(detail, undefined)).toBe(detail);
  });

  it.each(["inferred", "default", "declared_via_dataset"])(
    "appends the provenance sentence for basis %s",
    (basis) => {
      const provenance = resolveEvidenceFrameworkProvenance({
        blueprintBasis: basis,
        archetypeLabel: "Contact Center Agent Assist",
        unknownDeclaredArchetype: null,
      });
      const out = appendEvidenceFrameworkProvenance(detail, provenance);
      expect(out).toBe(`${detail} ${provenance.statement}`);
      // The route's own wording is kept as the lead, never replaced.
      expect(out.startsWith(detail)).toBe(true);
    },
  );

  it("keeps the whole message inside the length a refusal reader renders", () => {
    // `describeRequiredEvidenceRefusal` bounds the lead it renders at 600
    // characters, so a message longer than that would lose its own tail on
    // screen — the exact outcome this module exists to prevent.
    const provenance = resolveEvidenceFrameworkProvenance({
      blueprintBasis: "inferred",
      archetypeLabel: "Contact Center Agent Assist",
      unknownDeclaredArchetype: "governed_data_foundaton",
    });
    expect(
      appendEvidenceFrameworkProvenance(detail, provenance).length,
    ).toBeLessThanOrEqual(600);
  });
});
