import fs from "node:fs";
import path from "node:path";

describe("Source contract depth package loader", () => {
  it("reuses one package load run across Layer 2 and Layer 3 phases", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const migration = fs.readFileSync(
      path.join(
        repoRoot,
        "supabase/migrations/20260828184000_source_contract_depth_package_layer2.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("UNIQUE (tenant_key, dataset_version, load_run_id)");
    expect(loader).toContain("ON CONFLICT (tenant_key, dataset_version, load_run_id)");
    expect(loader).not.toContain(
      "ON CONFLICT (tenant_key, dataset_version, idempotency_key, mode)",
    );
  });
});
