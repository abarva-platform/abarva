import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(repo, file), "utf8");

describe("Source Contract Content Proof data contract", () => {
  it("resolves archetype identity from the canonical contract payload", () => {
    const migration = read(
      "supabase/migrations/20260915110000_source_contract_intelligence_archetype_projection.sql",
    );
    expect(migration).toContain("canonical.raw_payload ->> 'contract_archetype'");
    expect(migration).toContain("canonical.load_run_id = c.load_run_id");
    expect(migration).toContain("'cloud_consumption_commit'");
    expect(migration).toContain("'explicit_contract_mapping'");
    expect(migration).not.toContain("v.supplier_category");
  });

  it("does not promote an authored opportunity amount without a governed sizing claim", () => {
    const adapter = read("src/lib/source/data-model/read-adapter.ts");
    const projection = read("scripts/source/project-contract-depth-package-layer4.ts");
    const portfolio = read(
      "src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts",
    );

    expect(adapter).toContain("sizingClaim: claimsRead");
    expect(adapter).toContain('governedSizing.basis');
    expect(adapter).toContain('"calculated", "benchmark"');
    expect(projection).toContain("accepted_sizing AS (");
    expect(projection).toContain("claim.claim_role = 'sizing'");
    expect(projection).toContain("claim.basis IN ('calculated', 'benchmark')");
    expect(portfolio).toContain("sizing_claim.claim_role = 'sizing'");
    expect(portfolio).toContain("THEN COALESCE(sizing_claim.amount_usd, sizing_claim.amount_high_usd)");
  });

  it("filters evidence references to resolvable canonical snapshots", () => {
    for (const file of [
      "scripts/source/load-contract-depth-package.ts",
      "scripts/source/load-cloud-consumption-package.mjs",
    ]) {
      const loader = read(file);
      expect(loader).toContain("FROM source.source_record_snapshot snapshot");
      expect(loader).toContain("snapshot.source_record_id = evidence_row.source_record_id");
      expect(loader).toContain("resolved_ref_count");
      expect(loader).toContain("COALESCE(e.resolved_ref_count, 0)");
    }
  });

  it("keeps document evidence attached across equivalent active package versions", () => {
    const adapter = read("src/lib/source/data-model/read-adapter.ts");
    expect(adapter).toContain("file.metadata_json ->> 'dataset_version'");
    expect(adapter).toContain("current_contract.raw_payload ->> 'dataset_version'");
  });
});
