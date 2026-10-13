import { hasOverstatedConditionalEffects } from "../conditional-effects";

const CONDITIONAL_SOURCE =
  "Alpha and Beta jointly represent 70% of Division revenue, a mix that could make Alpha performance an outsized factor in Division economics.";

describe("hasOverstatedConditionalEffects", () => {
  it.each([
    "Alpha performance is an outsized factor in Division economics.",
    "Alpha performance carries outsized weight in overall economics.",
    "The business has two segments where Alpha performance carries outsized influence on enterprise revenue.",
    "**Economics:** Alpha performance has an outsized impact on Division economics.",
    "Alpha performance is not only an outsized factor in Division economics.",
    "Alpha performance is not an outsized factor in Division economics.",
    "Alpha performance does not carry outsized weight in Division economics.",
    "Alpha performance has no outsized influence on Division economics.",
    "Expanded Alpha performance carries outsized weight in overall economics.",
    "Beta performance carries outsized weight in Division economics.",
  ])("rejects a related categorical effect: %s", (passage) => {
    expect(
      hasOverstatedConditionalEffects([passage], [CONDITIONAL_SOURCE]),
    ).toBe(true);
  });

  it.each(["could", "may", "might"])(
    "recognizes a source conditional introduced by %s",
    (modal) => {
      expect(
        hasOverstatedConditionalEffects(
          ["Alpha performance carries outsized weight in Division economics."],
          [
            `The composition ${modal} make Alpha performance an outsized factor in Division economics.`,
          ],
        ),
      ).toBe(true);
      expect(
        hasOverstatedConditionalEffects(
          ["Alpha performance carries outsized weight in Division economics."],
          [
            `Alpha performance ${modal} have an outsized effect on Division economics.`,
          ],
        ),
      ).toBe(true);
    },
  );

  it.each(["outsized", "disproportionate", "dominant"])(
    "uses the source's exact strong term: %s",
    (strength) => {
      expect(
        hasOverstatedConditionalEffects(
          [`Alpha plays a ${strength} role in Division economics.`],
          [`Alpha might play a ${strength} role in Division economics.`],
        ),
      ).toBe(true);
    },
  );

  it.each([
    "Alpha and Beta jointly represent 70% of Division revenue.",
    "Alpha performance could be an outsized factor in Division economics.",
    "Alpha performance may carry outsized weight in Division economics.",
    "Alpha performance might have an outsized impact on Division economics.",
    "The composition could make Alpha performance an outsized factor in Division economics.",
    "Alpha performance has a potentially outsized effect on Division economics.",
    "The record does not establish that Alpha performance carries outsized weight in overall economics.",
    "No evidence proves Alpha performance is an outsized factor in Division economics.",
    "It is not established whether Alpha performance has an outsized impact on Division economics.",
    "Alpha performance has an outsized share of Division revenue.",
  ])("preserves a safe or unrelated assertion: %s", (passage) => {
    expect(
      hasOverstatedConditionalEffects([passage], [CONDITIONAL_SOURCE]),
    ).toBe(false);
  });

  it("does not borrow modality from a different field or bullet", () => {
    expect(
      hasOverstatedConditionalEffects(
        [
          "Alpha performance carries outsized weight in overall economics.",
          "**Composition:** Alpha and Beta jointly represent 70% of Division revenue.",
          "**Economics:** Alpha performance could be an outsized factor in Division economics.",
        ],
        [CONDITIONAL_SOURCE],
      ),
    ).toBe(true);
    expect(
      hasOverstatedConditionalEffects(
        [
          "Alpha performance could be an outsized factor in Division economics.\n- Alpha performance carries outsized weight in overall economics.",
        ],
        [CONDITIONAL_SOURCE],
      ),
    ).toBe(true);
  });

  it.each([
    "Alpha performance could be an outsized factor in Division economics; Alpha performance carries outsized weight in overall economics.",
    "Alpha performance may have an outsized effect on Division economics, but Alpha performance carries outsized weight in overall economics.",
    "Alpha performance may have an outsized effect on Division economics and Alpha performance carries outsized weight in overall economics.",
    "Alpha performance could be an outsized factor in Division economics and carries outsized weight in overall economics.",
    "The record does not establish that Alpha performance is an outsized factor in Division economics, but Alpha performance carries outsized weight in overall economics.",
    "Alpha performance has no outsized influence on Division economics and carries outsized weight in overall economics.",
    "Alpha performance carries outsized weight in overall economics; Beta might need review.",
  ])("checks local mixed assertions independently: %s", (passage) => {
    expect(
      hasOverstatedConditionalEffects([passage], [CONDITIONAL_SOURCE]),
    ).toBe(true);
  });

  it("admits independently cited categorical support for the same effect", () => {
    const passage =
      "Alpha performance carries outsized weight in overall economics.";
    expect(
      hasOverstatedConditionalEffects([passage], [CONDITIONAL_SOURCE, passage]),
    ).toBe(false);
    expect(
      hasOverstatedConditionalEffects([passage], [CONDITIONAL_SOURCE]),
    ).toBe(true);
  });

  it("does not use a coordinated modal predicate as categorical support", () => {
    expect(
      hasOverstatedConditionalEffects(
        ["Alpha performance carries outsized weight in Division economics."],
        [
          "Alpha performance could have an outsized effect on Division economics and carry outsized weight in Division economics.",
        ],
      ),
    ).toBe(true);
    expect(
      hasOverstatedConditionalEffects(
        [
          "Alpha performance could have an outsized effect on Division economics and carry outsized weight in Division economics.",
        ],
        [CONDITIONAL_SOURCE],
      ),
    ).toBe(false);
  });

  it("requires independent support for a categorical denial", () => {
    const denial =
      "Alpha performance does not carry outsized weight in Division economics.";
    expect(
      hasOverstatedConditionalEffects([denial], [CONDITIONAL_SOURCE, denial]),
    ).toBe(false);
    expect(
      hasOverstatedConditionalEffects([denial], [CONDITIONAL_SOURCE]),
    ).toBe(true);
  });

  it("does not use coordinated negated predicates as positive support", () => {
    const sources = [
      "Alpha performance could carry outsized weight in Division economics.",
      "Alpha performance does not have an outsized effect on Division economics and carry outsized weight in Division economics.",
    ];
    expect(
      hasOverstatedConditionalEffects(
        ["Alpha performance carries outsized weight in Division economics."],
        sources,
      ),
    ).toBe(true);
    expect(
      hasOverstatedConditionalEffects(
        [
          "Alpha performance does not carry outsized weight in Division economics.",
        ],
        sources,
      ),
    ).toBe(false);
  });

  it.each([
    "Beta performance carries outsized weight in overall economics.",
    "Alpha performance carries outsized weight in Division economics.",
    "Alpha performance is an outsized factor in overall economics.",
    "Alpha performance might carry outsized weight in overall economics.",
    "Alpha performance does not carry outsized weight in overall economics.",
  ])(
    "does not borrow assertive support from a different assertion: %s",
    (source) => {
      expect(
        hasOverstatedConditionalEffects(
          ["Alpha performance carries outsized weight in overall economics."],
          [CONDITIONAL_SOURCE, source],
        ),
      ).toBe(true);
    },
  );

  it("keeps categorical and conditional clauses in the same source independent", () => {
    expect(
      hasOverstatedConditionalEffects(
        ["Alpha performance carries outsized weight in Division economics."],
        [
          "Alpha performance carries outsized weight in Division economics, but Alpha performance could be an outsized factor in overall economics.",
        ],
      ),
    ).toBe(false);
  });

  it.each([
    "The composition cannot make Alpha performance an outsized factor in Division economics.",
    "The composition is unlikely to make Alpha performance an outsized factor in Division economics.",
    "The composition could not make Alpha performance an outsized factor in Division economics.",
  ])(
    "does not mistake nonassertive make wording for categorical support: %s",
    (source) => {
      expect(
        hasOverstatedConditionalEffects(
          ["Alpha performance is an outsized factor in Division economics."],
          [CONDITIONAL_SOURCE, source],
        ),
      ).toBe(true);
    },
  );

  it("requires categorical support without inventing component or alias mapping", () => {
    const source =
      "Alpha and Beta could have an outsized effect on Division economics.";
    expect(
      hasOverstatedConditionalEffects(
        ["Alpha and Beta have an outsized effect on Division economics."],
        [source],
      ),
    ).toBe(true);
    expect(
      hasOverstatedConditionalEffects(
        ["Beta has an outsized effect on Division economics."],
        [source],
      ),
    ).toBe(true);
    expect(
      hasOverstatedConditionalEffects(
        ["AP carries outsized weight in Division economics."],
        [CONDITIONAL_SOURCE],
      ),
    ).toBe(true);
  });

  it("admits a different subject when its categorical effect is independently cited", () => {
    const assertion = "Beta carries outsized weight in Division economics.";
    expect(
      hasOverstatedConditionalEffects(
        [assertion],
        [CONDITIONAL_SOURCE, assertion],
      ),
    ).toBe(false);
  });

  it("does not perform a general scope or synonym entailment check", () => {
    expect(
      hasOverstatedConditionalEffects(
        [
          "Alpha performance could carry outsized weight in overall economics.",
          "Alpha performance dominates enterprise economics.",
        ],
        [CONDITIONAL_SOURCE],
      ),
    ).toBe(false);
  });

  it("keeps unrecognized explicit effect scopes outside coverage", () => {
    expect(
      hasOverstatedConditionalEffects(
        [
          "Alpha performance carries outsized weight in scheduling flexibility.",
        ],
        [CONDITIONAL_SOURCE],
      ),
    ).toBe(false);
    expect(
      hasOverstatedConditionalEffects(
        ["Alpha performance carries outsized weight."],
        [
          "Alpha performance could carry outsized weight in scheduling flexibility.",
        ],
      ),
    ).toBe(false);
  });

  it("does not treat an unknown scope as unscoped categorical support", () => {
    expect(
      hasOverstatedConditionalEffects(
        ["Alpha performance carries outsized weight."],
        [
          "Alpha performance could carry outsized weight.",
          "Alpha performance carries outsized weight in scheduling flexibility.",
        ],
      ),
    ).toBe(true);
  });

  it("does not infer a conditional effect from absent or unrecognized sources", () => {
    const passage = "Alpha performance carries outsized weight in economics.";
    for (const sources of [
      [],
      ["Alpha and Beta jointly represent 70% of Division revenue."],
      ["Alpha performance is an outsized factor in Division economics."],
      ["Alpha performance could improve Division economics."],
      ["Alpha performance could not be an outsized factor in economics."],
    ]) {
      expect(hasOverstatedConditionalEffects([passage], sources)).toBe(false);
    }
    expect(hasOverstatedConditionalEffects([], [CONDITIONAL_SOURCE])).toBe(
      false,
    );
  });
});
