import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  canonicalWriterOpportunityCount,
  evidenceOnlyPairs,
  expectedOpportunityCounts,
  selectedEvidenceOnlyPairs,
  sourcingExclusionSql,
} from "../contract-depth-projection-ownership";

const manifest = JSON.parse(fs.readFileSync(
  path.resolve(process.cwd(), "datasets/source/opportunity-ownership-manifest.json"), "utf8",
));
const pair = evidenceOnlyPairs(manifest)[0];

describe("contract depth projection opportunity ownership", () => {
  it("uses the manifest to distinguish evidence-only and unrelated packages", () => {
    expect(pair).toBeDefined();
    expect(selectedEvidenceOnlyPairs(manifest, pair.tenantKey, pair.evidenceDatasetVersion)).toEqual([pair]);
    expect(selectedEvidenceOnlyPairs(manifest, pair.tenantKey, pair.writerDatasetVersion)).toEqual([]);

    const baseLayer3 = { source_optimization_opportunity: 4, opportunities_not_finance_confirmed: 4 };
    const baseLayer4 = {
      consumption_sourcing_opportunity_v1_package: 4,
      source_contract_action_candidate_v1_package: 4,
      source_contract_claim_card_v1_package: 4,
      source_ava_grounding_bundle_v1_rows: 4,
      source_contract_360_package: 1,
    };
    const selected = expectedOpportunityCounts(baseLayer3, baseLayer4, [pair], 6);
    expect(selected.layer3).toEqual({ source_optimization_opportunity: 0, opportunities_not_finance_confirmed: 0 });
    expect(selected.layer4).toEqual({
      consumption_sourcing_opportunity_v1_package: 6,
      source_contract_action_candidate_v1_package: 6,
      source_contract_claim_card_v1_package: 6,
      source_ava_grounding_bundle_v1_rows: 6,
      source_contract_360_package: 1,
    });
    expect(expectedOpportunityCounts(baseLayer3, baseLayer4, [], null)).toEqual({ layer3: baseLayer3, layer4: baseLayer4 });
    expect(() => expectedOpportunityCounts(baseLayer3, baseLayer4, [pair], 0)).toThrow("Canonical writer opportunity rows are missing");
  });

  it("excludes only manifest-owned legacy sourcing rows from a UNION ALL projection", () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec("CREATE TABLE sourcing (tenant_key TEXT, contract_id TEXT, opportunity_id TEXT)");
      const insert = db.prepare("INSERT INTO sourcing VALUES (?, ?, ?)");
      insert.run(pair.tenantKey, pair.contractId, "legacy-action");
      insert.run(pair.tenantKey, "other-contract", "unrelated-action");
      insert.run("other-tenant", pair.contractId, "other-tenant-action");
      const rows = db.prepare(`SELECT opportunity_id FROM sourcing WHERE 1=1 ${sourcingExclusionSql([pair])}`).all();
      expect(rows).toEqual([
        { opportunity_id: "unrelated-action" },
        { opportunity_id: "other-tenant-action" },
      ]);
      expect(db.prepare(`SELECT count(*) AS value FROM sourcing WHERE 1=1 ${sourcingExclusionSql([])}`).get()).toEqual({ value: 3 });
    } finally {
      db.close();
    }
  });

  it("uses the writer tuple for projected counts and refuses missing writer rows", async () => {
    const readCount = jest.fn(async (selected: typeof pair) => {
      expect(selected.tenantKey).toBe(pair.tenantKey);
      expect(selected.contractId).toBe(pair.contractId);
      expect(selected.writerDatasetVersion).toBe(pair.writerDatasetVersion);
      return 6;
    });
    expect(await canonicalWriterOpportunityCount([pair], readCount)).toBe(6);
    expect(readCount).toHaveBeenCalledTimes(1);
    expect(await canonicalWriterOpportunityCount([], readCount)).toBeNull();
    expect(readCount).toHaveBeenCalledTimes(1);
    await expect(canonicalWriterOpportunityCount([pair], async () => 0)).rejects.toThrow("Canonical writer opportunity rows are missing");
  });

  it("fails closed on conflicting ownership or mixed package roles", () => {
    const missingWriter = structuredClone(manifest);
    missingWriter.packages = missingWriter.packages.filter((entry: { dataset_version: string }) =>
      entry.dataset_version !== pair.writerDatasetVersion,
    );
    expect(() => evidenceOnlyPairs(missingWriter)).toThrow("no unique canonical writer");
    const mixed = structuredClone(manifest);
    const selected = mixed.packages.find((entry: { dataset_version: string }) =>
      entry.dataset_version === pair.evidenceDatasetVersion,
    );
    selected.contracts.push({ contract_id: "OTHER", role: "canonical_writer" });
    expect(() => selectedEvidenceOnlyPairs(mixed, pair.tenantKey, pair.evidenceDatasetVersion)).toThrow("Mixed opportunity ownership package");
  });
});
