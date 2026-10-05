import {
  buildPortfolioReconciliationSummary,
  countOf,
  formatDeclaredAmount,
  hasDeclaredAmount,
  UNDECLARED_AMOUNT,
  type PortfolioReconciliationFacts,
} from "@/lib/programs/portfolio-reconciliation-summary";

/** Stands in for the landing's compact-currency formatter. */
const usd = (amount: number) => `$${amount}`;

const facts: PortfolioReconciliationFacts = {
  declaredCount: 4,
  trackedCount: 3,
  declaredBudgetUsd: 1_200_000,
  declaredValueUsd: 450_000,
};

describe("portfolio-reconciliation-summary", () => {
  describe("count/noun agreement", () => {
    it("makes a count of one read singular", () => {
      expect(countOf(1, "programme")).toBe("1 programme");
      expect(countOf(1, "record")).toBe("1 record");
    });

    it("makes every other count read plural, including zero", () => {
      expect(countOf(0, "record")).toBe("0 records");
      expect(countOf(2, "programme")).toBe("2 programmes");
      expect(countOf(17, "record")).toBe("17 records");
    });

    // The defect this module was extracted for: the strip said "1 programmes"/"1 records".
    it("never renders a count of one against a plural noun", () => {
      const single = buildPortfolioReconciliationSummary(
        { ...facts, declaredCount: 1, trackedCount: 1 },
        usd,
      );
      expect(single?.declaredPrograms).toBe("1 programme");
      expect(single?.trackedRecords).toBe("1 record");
    });

    it("reads plural for a multi-programme inventory", () => {
      const many = buildPortfolioReconciliationSummary(facts, usd);
      expect(many?.declaredPrograms).toBe("4 programmes");
      expect(many?.trackedRecords).toBe("3 records");
    });

    it("pluralises a declared inventory against an empty tracked portfolio", () => {
      const none = buildPortfolioReconciliationSummary(
        { ...facts, declaredCount: 1, trackedCount: 0 },
        usd,
      );
      expect(none?.declaredPrograms).toBe("1 programme");
      expect(none?.trackedRecords).toBe("0 records");
    });
  });

  describe("declared amounts", () => {
    it("treats an absent figure as undeclared", () => {
      expect(hasDeclaredAmount(null)).toBe(false);
      expect(hasDeclaredAmount(undefined)).toBe(false);
    });

    // A projection total can arrive non-finite; Intl renders NaN as a currency ("$NaN"),
    // which puts a figure-shaped string in a slot that is read as money.
    it("treats a non-finite figure as undeclared rather than formatting it", () => {
      expect(hasDeclaredAmount(Number.NaN)).toBe(false);
      expect(hasDeclaredAmount(Number.POSITIVE_INFINITY)).toBe(false);
      expect(formatDeclaredAmount(Number.NaN, usd)).toBe(UNDECLARED_AMOUNT);
    });

    it("treats a declared zero as a figure, not as an absence", () => {
      expect(hasDeclaredAmount(0)).toBe(true);
      expect(formatDeclaredAmount(0, usd)).toBe("$0");
    });

    it("formats a declared figure through the host's formatter", () => {
      expect(formatDeclaredAmount(1_200_000, usd)).toBe("$1200000");
    });

    // Copy and predicate are one derivation: the token the predicate's false branch
    // yields is the same constant the strip's contract names.
    it("renders the undeclared token for both amounts when neither is declared", () => {
      const summary = buildPortfolioReconciliationSummary(
        { ...facts, declaredBudgetUsd: null, declaredValueUsd: null },
        usd,
      );
      expect(summary?.declaredBudget).toBe(UNDECLARED_AMOUNT);
      expect(summary?.declaredValue).toBe(UNDECLARED_AMOUNT);
    });

    // Each amount is read independently: one undeclared must not blank the other.
    it("declares one amount while the other is absent", () => {
      const summary = buildPortfolioReconciliationSummary(
        { ...facts, declaredValueUsd: null },
        usd,
      );
      expect(summary?.declaredBudget).toBe("$1200000");
      expect(summary?.declaredValue).toBe(UNDECLARED_AMOUNT);

      const mirrored = buildPortfolioReconciliationSummary(
        { ...facts, declaredBudgetUsd: null },
        usd,
      );
      expect(mirrored?.declaredBudget).toBe(UNDECLARED_AMOUNT);
      expect(mirrored?.declaredValue).toBe("$450000");
    });
  });

  describe("nothing to reconcile", () => {
    it("returns null so the strip does not render", () => {
      expect(buildPortfolioReconciliationSummary(null, usd)).toBeNull();
      expect(buildPortfolioReconciliationSummary(undefined, usd)).toBeNull();
    });
  });

  it("reads each count from its own field", () => {
    const summary = buildPortfolioReconciliationSummary(
      { ...facts, declaredCount: 9, trackedCount: 2 },
      usd,
    );
    expect(summary?.declaredPrograms).toBe("9 programmes");
    expect(summary?.trackedRecords).toBe("2 records");
  });
});
