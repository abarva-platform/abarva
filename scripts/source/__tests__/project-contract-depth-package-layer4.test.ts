import fs from "node:fs";
import path from "node:path";

const scriptPath = path.resolve(
  process.cwd(),
  "scripts/source/project-contract-depth-package-layer4.ts",
);

describe("contract depth package Layer 4 overlay job", () => {
  const source = fs.readFileSync(scriptPath, "utf8");

  it("projects the depth package as an overlay instead of replacing the active base cube", () => {
    expect(source).toContain("source.l4_cube_active_load_run_overlay");
    expect(source).toContain("UNION");
    expect(source).toContain("source.l4_cube_active_load_run");
    expect(source).toContain("source_contract_360_total regressed");
    expect(source).not.toMatch(/\bDROP VIEW\b/i);
  });

  it("requires repaired canonical alternatives before product projection", () => {
    expect(source).toContain("contracts_with_assessed_alternatives");
    expect(source).toContain("FROM source.contract WHERE tenant_key = $1 AND load_run_id = $3 AND COALESCE(raw_payload->>'alternatives_available', '') <> ''");
    expect(source).not.toContain("FROM source.contract WHERE tenant_key = $1 AND dataset_version = $2");
    expect(source).toContain("not_assessed");
    expect(source).toContain("limited_alternatives_flag");
    expect(source).toContain("THEN false");
  });

  it("projects governed optimization and consumption rows into product views", () => {
    expect(source).toContain("source.optimization_opportunity");
    expect(source).toContain("consumption.sourcing_spend_monthly_v1");
    expect(source).toContain("consumption.sourcing_performance_v1");
    expect(source).toContain("finance_confirmation_required");
    expect(source).toContain(`SELECT * FROM sourcing
    WHERE source.can_read_sourcing_tenant(tenant_key)
    UNION ALL
    SELECT * FROM optimization
    WHERE source.can_read_sourcing_tenant(tenant_key)`);
  });
});
