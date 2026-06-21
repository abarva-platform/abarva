import {
  buildExpertPackReadinessReport,
  buildSharedEngineParityGateReport,
  getSharedEngineFlagPolicyIssues,
  SHARED_ENGINE_SURFACE_FLAGS,
} from "./shared-engine-policy";

describe("Shared Context Brain exposure policy", () => {
  it("keeps every shared-engine surface flag default-off with no pre-enrolled tenants", () => {
    expect(SHARED_ENGINE_SURFACE_FLAGS).toEqual([
      "scb_shared_engine_home",
      "scb_shared_engine_intelligence",
      "scb_shared_engine_tower",
      "scb_shared_engine_source",
      "scb_shared_engine_moves",
    ]);
    expect(getSharedEngineFlagPolicyIssues()).toEqual([]);
  });

  it("marks a pack exposable only when the pack gate and golden eval both pass", () => {
    const report = buildExpertPackReadinessReport();
    const healthcareRevenueCycle = report.rows.find(
      (row) => row.packId === "xp.healthcare-provider.revenue-cycle",
    );
    const packWithoutGoldenEval = report.rows.find(
      (row) => row.reasons.includes("missing_golden_eval"),
    );

    expect(report.total).toBeGreaterThan(0);
    expect(healthcareRevenueCycle).toEqual(
      expect.objectContaining({
        gatePass: true,
        goldenEvalPass: true,
        exposable: true,
        reasons: [],
      }),
    );
    expect(packWithoutGoldenEval).toEqual(
      expect.objectContaining({
        gatePass: true,
        goldenEvalPass: false,
        exposable: false,
      }),
    );
  });

  it("fails parity when the candidate does not clear the incumbent bar", () => {
    const report = buildSharedEngineParityGateReport({
      total: 10,
      passCount: 9,
      results: [],
    });

    expect(report.pass).toBe(false);
    expect(report.reasons).toEqual([
      "below_minimum_pass_rate",
      "does_not_beat_incumbent",
    ]);
  });

  it("fails parity when any answer crossed the tenant fence", () => {
    const report = buildSharedEngineParityGateReport({
      total: 1,
      passCount: 1,
      results: [{ answer: { crossTenantBlocked: true } }],
    });

    expect(report.pass).toBe(false);
    expect(report.reasons).toContain("cross_tenant_blocks_present");
  });
});
