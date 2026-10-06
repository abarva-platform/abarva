import fs from "node:fs";
import path from "node:path";

import { buildCandidateSupplierRegistryValidation } from "../../../scripts/source/validate-candidate-supplier-registry-package";

describe("candidate supplier archetype coverage", () => {
  it("reports registered archetypes that the classifier cannot route", () => {
    const inputPath = path.join(
      process.cwd(),
      "datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv",
    );
    const result = buildCandidateSupplierRegistryValidation({
      csvText: fs.readFileSync(inputPath, "utf8"),
      inputPath,
    });

    expect(result.status).toBe("pass");
    expect(result.summary.registeredArchetypeCount).toBe(11);
    expect(result.summary.routedArchetypeCount).toBe(10);
    expect(result.summary.expectedArchetypeCount).toBe(10);
    expect(result.summary.unroutedArchetypeCount).toBe(1);
    expect(result.unroutedRegisteredArchetypes.map((item) => item.archetypeId)).toEqual([
      "DIGITAL_PRODUCT_ENGINEERING",
    ]);
    expect(result.coverageMatrix).toHaveLength(10);
  });
});
