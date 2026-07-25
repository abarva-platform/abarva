// Reconciliation proof (2026-07-25): before this date, golden-bar's
// DEPTH_BY_ARTIFACT and the orchestrator's quality-bar-registry.ts had
// CONTRADICTORY word ranges for target_state_architecture, business_case,
// and execution_roadmap/roadmap (one pipeline's floor sat above or equal to
// the other's ceiling), and no golden-bar entry at all for
// financial_model/tower_metrics_plan (the orchestrator's estimate_model/
// value_model). This test inspects each pipeline's real resolved values —
// not just imported constants — to confirm they now agree, mirroring the
// pattern in charter-contract-reconciliation.test.ts.

import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import {
  maximumWordCountForArtifact,
  premiumGoldenBarOptionsForArtifact,
} from "@/lib/deliverables/strategic-moves-artifact-standard";
import { P3_P4_WORD_BAND_CONTRACTS } from "@/lib/deliverables/shared/artifact-contracts";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";

describe("P3/P4 word-band reconciliation — real runtime output, both pipelines", () => {
  it.each([
    ["target_state_architecture", "target_state_architecture"],
    ["solution_design", "solution_design"],
    ["operating_model_design", "operating_model_design"],
    ["sourcing_strategy", "sourcing_strategy"],
    ["business_case", "business_case"],
    ["roadmap", "execution_roadmap"],
    ["estimate_model", "financial_model"],
    ["value_model", "tower_metrics_plan"],
  ] as const)(
    "orchestrator's %s and golden-bar's %s agree on the ceiling",
    (orchestratorKey, goldenBarKey: DeliverableKey) => {
      const qb = resolveQualityBar("moves", orchestratorKey);
      const contract = P3_P4_WORD_BAND_CONTRACTS[orchestratorKey];

      expect(qb.targetBodyWordsMax).toBe(contract.targetWordsMax);
      expect(qb.advisoryBandMax).toBe(contract.advisoryMaxWords);
      expect(qb.enforceMaxAsBlocker).toBe(contract.enforceMaxAsBlocker);

      // golden-bar's own maximumWordCountForArtifact must land on the SAME
      // ceiling as the orchestrator's targetBodyWordsMax — this is exactly
      // the number that used to contradict for target_state_architecture/
      // business_case/roadmap.
      expect(maximumWordCountForArtifact(goldenBarKey)).toBe(
        contract.targetWordsMax,
      );

      const options = premiumGoldenBarOptionsForArtifact(goldenBarKey);
      expect(Boolean(options.enforceMaximumWordCount)).toBe(
        contract.enforceMaxAsBlocker,
      );
      // target_state_architecture never enforces the ceiling (warn-only on
      // both pipelines), so its advisory band is informational only and
      // golden-bar's branch deliberately omits wiring it — nothing to assert.
      if (contract.enforceMaxAsBlocker) {
        expect(options.advisoryMaximumWordCount).toBe(
          contract.advisoryMaxWords,
        );
      }
    },
  );

  it("target_state_architecture's floor is deliberately NOT reconciled (single-pass vs multi-pass generation)", () => {
    // The orchestrator's decomposed multi-pass generator can reliably reach
    // a 9,000-word floor; golden-bar's single-pass prompt cannot yet (forcing
    // it broke generate-artifact.test.ts's real generation test). Only the
    // ceiling was reconciled for this type.
    const qb = resolveQualityBar("moves", "target_state_architecture");
    expect(qb.minBodyWords).toBe(9_000);
    // golden-bar's real minimum stays at its own realistic value.
    expect(
      premiumGoldenBarOptionsForArtifact("target_state_architecture")
        .minimumWordCount,
    ).toBe(2_500);
  });

  it("every reconciled type's advisory band sits above its target ceiling (never below)", () => {
    for (const contract of Object.values(P3_P4_WORD_BAND_CONTRACTS)) {
      expect(contract.advisoryMaxWords).toBeGreaterThan(
        contract.targetWordsMax,
      );
    }
  });
});
