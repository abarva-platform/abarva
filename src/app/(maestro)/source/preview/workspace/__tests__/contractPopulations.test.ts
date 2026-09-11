import {
  contractPopulations,
  countOrDash,
  isDeclaredArchetypeKey,
} from "../contractPopulations";

/**
 * The defect these guard: a declared count taken from the evidence layer and an
 * unmapped count taken from the register were rendered side by side as though
 * they partitioned one book. They summed past the size of either collection,
 * because the two describe different contracts whenever their identifiers do
 * not match.
 */

const portfolio = (input: {
  register: readonly { id: string; archetype?: string | null }[];
  depth: readonly { id: string; archetype?: string | null }[];
}) =>
  ({
    contracts: input.register.map((row) => ({
      contract_id: row.id,
      contract_archetype: row.archetype ?? null,
      vendor_category: null,
    })),
    impact: {
      evidenceCoverage: input.depth.map((row) => ({
        contract_id: row.id,
        contract_archetype: row.archetype ?? null,
        vendor_category: null,
      })),
    },
  }) as never;

describe("contractPopulations", () => {
  it("partitions the register into declared and undeclared, and they sum to it", () => {
    const p = contractPopulations(
      portfolio({
        register: [
          { id: "CTR-0001", archetype: "cloud_consumption" },
          { id: "CTR-0002" },
          { id: "CTR-0003" },
        ],
        depth: [{ id: "CTR-0001", archetype: "cloud_consumption" }],
      }),
    );

    expect(p.registerCount).toBe(3);
    expect(p.declaredInRegisterCount).toBe(1);
    expect(p.undeclaredInRegisterCount).toBe(2);
    expect(p.declaredInRegisterCount + p.undeclaredInRegisterCount).toBe(
      p.registerCount,
    );
  });

  it("never counts evidence for a contract the book does not contain as coverage of it", () => {
    // The live shape: a generated register, and depth rows in a different id
    // space. Only one row actually joins.
    const p = contractPopulations(
      portfolio({
        register: Array.from({ length: 230 }, (_, i) => ({
          id: `CTR-${String(i + 1).padStart(4, "0")}`,
        })),
        depth: [
          { id: "CTR-0001", archetype: "cloud_consumption" },
          { id: "MER-TECH-DBX-001", archetype: "cloud_consumption_commit" },
          { id: "MER-TECH-LAAMS-001", archetype: "managed_services" },
        ],
      }),
    );

    expect(p.registerCount).toBe(230);
    expect(p.depthCount).toBe(3);
    expect(p.joinedCount).toBe(1);
    expect(p.unjoinedDepthCount).toBe(2);
    expect(p.declaredOutsideRegisterCount).toBe(2);
    expect(p.populationsDisjoint).toBe(true);

    // The partition still sums to the book, and the unjoined rows are not in it.
    expect(p.declaredInRegisterCount + p.undeclaredInRegisterCount).toBe(230);
    expect(p.declaredInRegisterCount).toBe(1);
  });

  it("does not report disjoint populations when the identifiers line up", () => {
    const p = contractPopulations(
      portfolio({
        register: [{ id: "A" }, { id: "B" }, { id: "C" }],
        depth: [
          { id: "A", archetype: "x" },
          { id: "B", archetype: "y" },
        ],
      }),
    );

    expect(p.joinedCount).toBe(2);
    expect(p.unjoinedDepthCount).toBe(0);
    expect(p.populationsDisjoint).toBe(false);
    expect(p.joinRate).toBe(1);
  });

  it("treats placeholder text as undeclared rather than as a classification", () => {
    for (const placeholder of [
      "",
      "   ",
      "unmapped",
      "Not established",
      "UNCLASSIFIED",
      "n/a",
      "—",
    ]) {
      expect(isDeclaredArchetypeKey(placeholder)).toBe(false);
    }
    for (const declared of ["cloud_consumption_commit", "Managed services"]) {
      expect(isDeclaredArchetypeKey(declared)).toBe(true);
    }
  });

  it("scores an empty book without dividing by zero", () => {
    const p = contractPopulations(portfolio({ register: [], depth: [] }));
    expect(p.registerCount).toBe(0);
    expect(p.joinRate).toBe(1);
    expect(p.populationsDisjoint).toBe(false);
  });
});

describe("countOrDash", () => {
  it("distinguishes a loaded zero from an unloaded lane", () => {
    // 0 asserts "we looked and found none"; a dash says "not loaded".
    expect(countOrDash(0)).toBe("0");
    expect(countOrDash(87)).toBe("87");
    expect(countOrDash(null)).toBe("—");
    expect(countOrDash(undefined)).toBe("—");
  });
});
