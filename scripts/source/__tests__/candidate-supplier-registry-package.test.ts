import fs from "node:fs";
import path from "node:path";

import {
  buildCandidateSupplierRegistryValidation,
  type CandidateSupplierRegistryValidation,
} from "../validate-candidate-supplier-registry-package";

const packageRoot = path.join(
  process.cwd(),
  "datasets/source/candidate-supplier-registry-synthetic-v1",
);
const csvPath = path.join(packageRoot, "candidate_supplier_registry.csv");

function validate(csvText: string): CandidateSupplierRegistryValidation {
  return buildCandidateSupplierRegistryValidation({
    csvText,
    inputPath: csvPath,
  });
}

describe("synthetic candidate-supplier registry package", () => {
  it("proves two eligible synthetic legal entities for every registered Source archetype", () => {
    const result = validate(fs.readFileSync(csvPath, "utf8"));

    expect(result.status).toBe("pass");
    expect(result.summary.expectedArchetypeCount).toBe(10);
    expect(result.summary.coveredArchetypeCount).toBe(10);
    expect(result.summary.eligibleCandidateRows).toBe(20);
    expect(result.summary.negativeControlRows).toBe(5);
    expect(result.summary.contactPolicies.length).toBeGreaterThanOrEqual(4);
    expect(result.summary.existingContractStatuses).toEqual(
      expect.arrayContaining([
        "no_existing_contract",
        "incumbent_reference_only",
        "registered_contract_counterparty",
      ]),
    );
    expect(result.coverageMatrix.every((item) => item.eligibleRows.length >= 2)).toBe(
      true,
    );
    expect(result.failClosedControls.map((item) => item.expectedReason).sort()).toEqual([
      "draft_authority",
      "duplicate_identity",
      "mismatched_eligibility",
      "missing_contact_authority",
      "missing_lineage",
    ]);
  });

  it("fails closed when an archetype loses its second eligible candidate", () => {
    const lines = fs.readFileSync(csvPath, "utf8").trimEnd().split(/\r?\n/u);
    const header = lines[0];
    const mutated = [
      header,
      ...lines
        .slice(1)
        .filter((line) => !line.startsWith("SYN-SUP-AMS-002,")),
    ].join("\n");

    const result = validate(`${mutated}\n`);

    expect(result.status).toBe("fail");
    expect(
      result.coverageMatrix.find(
        (item) => item.archetypeId === "AMS_MANAGED_SERVICES",
      )?.eligibleRows,
    ).toHaveLength(1);
    expect(result.errors).toContain(
      "Archetype AMS_MANAGED_SERVICES has 1 eligible candidate row(s); expected at least 2.",
    );
  });

  it("fails closed when a negative control is accidentally accepted", () => {
    const csv = fs
      .readFileSync(csvPath, "utf8")
      .replace(
        "SYN-SUP-NEG-DRAFT,negative_control,Fictional Draftmark ERP Delivery LLC",
        "SYN-SUP-NEG-DRAFT,candidate,Fictional Draftmark ERP Delivery LLC",
      )
      .replace(",draft_review,", ",candidate_authority_reviewed,")
      .replace(",fail_closed,draft_authority",
        ",eligible,draft_authority",
      );

    const result = validate(csv);

    expect(result.status).toBe("fail");
    expect(result.errors).toContain(
      "Missing fail-closed control for draft_authority.",
    );
  });
});
