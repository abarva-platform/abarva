import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("Source cloud to Tower bridge", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const scriptPath = path.join(repoRoot, "scripts/tower/apply-source-cloud-tower-bridge.mjs");

  it("plans the Tower projection bridge from the governed cloud package", () => {
    const proofDir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-source-cloud-bridge-plan-"));
    const result = spawnSync(
      "node",
      ["scripts/tower/apply-source-cloud-tower-bridge.mjs", "--mode=plan", `--proof-dir=${proofDir}`],
      { cwd: repoRoot, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    const summary = JSON.parse(fs.readFileSync(path.join(proofDir, "summary.json"), "utf8"));
    expect(summary.quality_gate.status).toBe("PASS");
    expect(summary.source_expected_readback.contracts).toBe(2);
    expect(summary.source_expected_readback.opportunities).toBe(8);
    expect(summary.source_expected_readback.cloud_usage_rows).toBe(192);
    expect(summary.source_expected_readback.resource_inventory_rows).toBe(84);
    expect(summary.tower_expected_delta.tower_recommended_actions_rows).toBe(8);
    expect(summary.tower_expected_delta.tower_value_proof_rows).toBe(8);
    expect(summary.tower_expected_delta.tower_cost_lens_rows).toBe(8);
    expect(summary.tower_expected_delta.tower_evidence_rows).toBe(8);
    expect(summary.tower_expected_delta.tower_risk_lens_rows).toBe(8);
    expect(summary.tower_expected_delta.cube_slice_rows).toBe(16);
  });

  it("keeps the bridge scoped, idempotent, and explicitly approved for writes", () => {
    const script = fs.readFileSync(scriptPath, "utf8");

    expect(script).toContain("TOWER_SOURCE_CLOUD_BRIDGE_APPLY_APPROVED");
    expect(script).toContain("serving.tower_active_assessment_keys()");
    expect(script).toContain("consumption.sourcing_opportunity_v1");
    expect(script).toContain("consumption.sourcing_cloud_usage_monthly_v1");
    expect(script).toContain("tower_spend_value_cube");
    expect(script).toContain("tower_evidence_cube");
    expect(script).toContain("INSERT INTO ecl_context.metric_definition");
    expect(script).toContain("source_cloud_candidate_value_usd");
    expect(script).toContain("source_cloud_evidence_gate");
    expect(script).toContain("row_key LIKE 'source_cloud:%'");
    expect(script).toContain("COALESCE(v.legal_name, c.vendor_ref, o.vendor_id) AS vendor_name");
    expect(script).toContain("ELSE c.end_date - c.notice_period_days::int");
    expect(script).not.toContain("c.vendor_id");
    expect(script).not.toContain("c.renewal_notice_date");
    expect(script).not.toContain("projection_entry_source_record_ref");
  });
});
