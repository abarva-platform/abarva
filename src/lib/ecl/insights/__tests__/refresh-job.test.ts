jest.mock("server-only", () => ({}));
import {
  runIntegratedInsightRefresh,
  type InsightRefreshRuntime,
} from "../../../../../scripts/ecl/integrated_insight_refresh_job";

const version = "a".repeat(64);
function runtime(approved: boolean): InsightRefreshRuntime {
  return {
    plan: jest
      .fn()
      .mockResolvedValue({
        plan: { loadVersionHash: version, findings: [{}] },
        load_approval: { approved },
        blob_proof_bundle: "private-plan-proof",
      }),
    apply: jest
      .fn()
      .mockResolvedValue({
        plan: { loadVersionHash: version },
        mutation_applied: true,
        blob_proof_bundle: "private-load-proof",
      }),
    admit: jest
      .fn()
      .mockResolvedValue({ blob_proof_bundle: "private-admission-proof" }),
  };
}
const env = {
  ECL_INSIGHT_RUN_ID: "local-test",
  ECL_INSIGHT_EXPECTED_VERSION_HASH: version,
};
it("stops at a missing load approval without any data write", async () => {
  const r = runtime(false);
  expect((await runIntegratedInsightRefresh(env, r)).state).toBe(
    "awaiting_load_approval",
  );
  expect(r.apply).not.toHaveBeenCalled();
  expect(r.admit).not.toHaveBeenCalled();
});
it("never reuses approval for a changed input", async () => {
  const r = runtime(true);
  expect(
    (
      await runIntegratedInsightRefresh(
        { ...env, ECL_INSIGHT_EXPECTED_VERSION_HASH: "b".repeat(64) },
        r,
      )
    ).state,
  ).toBe("input_changed");
  expect(r.apply).not.toHaveBeenCalled();
});
it("persists candidates but does not serve them without a review", async () => {
  const r = runtime(true);
  const proof = await runIntegratedInsightRefresh(env, r);
  expect(proof).toMatchObject({
    state: "awaiting_review_and_serving",
    steps_complete: 2,
    steps_total: 3,
  });
  expect(r.admit).not.toHaveBeenCalled();
});
it("requires persistence of exactly the planned candidate before admission", async () => {
  const r = runtime(true);
  (r.apply as jest.Mock).mockResolvedValue({
    plan: { loadVersionHash: "b".repeat(64) },
    mutation_applied: true,
  });
  await expect(runIntegratedInsightRefresh(env, r)).rejects.toThrow(
    "exact planned candidate",
  );
  expect(r.admit).not.toHaveBeenCalled();
});
it("runs the gated chain with separate proof IDs and does not claim browser readiness", async () => {
  const r = runtime(true);
  const proof = await runIntegratedInsightRefresh(
    {
      ...env,
      ECL_INSIGHT_REVIEW_PROOF_URI: "private-review-proof",
      ECL_INSIGHT_REVIEW_PROOF_HASH: "c".repeat(64),
    },
    r,
  );
  expect(proof).toMatchObject({
    state: "admitted_browser_proof_pending",
    steps_complete: 3,
    home_activation_changed: false,
  });
  expect(r.plan).toHaveBeenCalledWith(
    expect.objectContaining({ ECL_INSIGHT_RUN_ID: "local-test-plan" }),
  );
  expect(r.apply).toHaveBeenCalledWith(
    expect.objectContaining({ ECL_INSIGHT_RUN_ID: "local-test-load" }),
  );
  expect(r.admit).toHaveBeenCalledWith(
    expect.objectContaining({ ECL_INSIGHT_RUN_ID: "local-test-admit" }),
  );
});
