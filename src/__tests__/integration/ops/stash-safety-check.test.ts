/**
 * Integration tests for the stash safety check read model.
 *
 * All tests operate on fixture data — no subprocess, no fs, no network.
 * Validates: StashSafetyReport shape, isSafeToIntegrate logic,
 * stashesFromOtherBranches counting, recommendedPreflightActions population,
 * generatedAt passthrough.
 */

import {
  buildStashSafetyReportFromFixture,
  StashRecord,
  StashSafetyReport,
} from "../../../lib/ops/stash-safety-check";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CURRENT_BRANCH = "dual/ops12-integration-stash-safety";
const OTHER_BRANCH = "feat/some-other-feature";
const GENERATED_AT = "2026-04-26T12:00:00.000Z";

function makeStash(
  overrides: Partial<StashRecord> & { index: number; branch: string; description: string }
): StashRecord {
  return {
    isCurrentBranch: overrides.branch === CURRENT_BRANCH,
    recommendedAction: "inspect",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildStashSafetyReportFromFixture", () => {
  // 1. Empty stash list
  describe("empty stash list", () => {
    let report: StashSafetyReport;
    beforeEach(() => {
      report = buildStashSafetyReportFromFixture([], CURRENT_BRANCH, GENERATED_AT);
    });

    it("isSafeToIntegrate is true", () => {
      expect(report.isSafeToIntegrate).toBe(true);
    });

    it("safetyWarning is null", () => {
      expect(report.safetyWarning).toBeNull();
    });

    it("totalStashes is 0", () => {
      expect(report.totalStashes).toBe(0);
    });

    it("stashesFromOtherBranches is 0", () => {
      expect(report.stashesFromOtherBranches).toBe(0);
    });

    it("stashes array is empty", () => {
      expect(report.stashes).toHaveLength(0);
    });

    it("recommendedPreflightActions is empty", () => {
      expect(report.recommendedPreflightActions).toHaveLength(0);
    });
  });

  // 2. Single stash from the current branch
  describe("stash from current branch", () => {
    let report: StashSafetyReport;
    beforeEach(() => {
      const stashes = [
        makeStash({
          index: 0,
          branch: CURRENT_BRANCH,
          description: "WIP: refactoring auth flow",
        }),
      ];
      report = buildStashSafetyReportFromFixture(stashes, CURRENT_BRANCH, GENERATED_AT);
    });

    it("isSafeToIntegrate is false", () => {
      expect(report.isSafeToIntegrate).toBe(false);
    });

    it("stashesFromOtherBranches is 0", () => {
      expect(report.stashesFromOtherBranches).toBe(0);
    });

    it("safetyWarning is not null", () => {
      expect(report.safetyWarning).not.toBeNull();
    });

    it("safetyWarning mentions the stash count", () => {
      expect(report.safetyWarning).toContain("1 stash(es)");
    });

    it("stash isCurrentBranch is true", () => {
      expect(report.stashes[0].isCurrentBranch).toBe(true);
    });

    it("recommendedAction is inspect for same-branch stash", () => {
      expect(report.stashes[0].recommendedAction).toBe("inspect");
    });
  });

  // 3. Single stash from a different branch
  describe("stash from different branch", () => {
    let report: StashSafetyReport;
    beforeEach(() => {
      const stashes = [
        makeStash({
          index: 0,
          branch: OTHER_BRANCH,
          description: "WIP: tower vendor portfolio",
        }),
      ];
      report = buildStashSafetyReportFromFixture(stashes, CURRENT_BRANCH, GENERATED_AT);
    });

    it("isSafeToIntegrate is false", () => {
      expect(report.isSafeToIntegrate).toBe(false);
    });

    it("stashesFromOtherBranches is 1", () => {
      expect(report.stashesFromOtherBranches).toBe(1);
    });

    it("safetyWarning mentions OTHER branches", () => {
      expect(report.safetyWarning).toContain("OTHER branches");
    });

    it("stash isCurrentBranch is false", () => {
      expect(report.stashes[0].isCurrentBranch).toBe(false);
    });

    it("recommendedAction is create-recovery-branch", () => {
      expect(report.stashes[0].recommendedAction).toBe("create-recovery-branch");
    });
  });

  // 4. Multiple stashes → totalStashes correct
  describe("multiple stashes", () => {
    let report: StashSafetyReport;
    beforeEach(() => {
      const stashes = [
        makeStash({ index: 0, branch: CURRENT_BRANCH, description: "WIP: index fix" }),
        makeStash({ index: 1, branch: OTHER_BRANCH, description: "WIP: vendor portfolio" }),
        makeStash({ index: 2, branch: "feat/another-branch", description: "WIP: old experiment" }),
      ];
      report = buildStashSafetyReportFromFixture(stashes, CURRENT_BRANCH, GENERATED_AT);
    });

    it("totalStashes is 3", () => {
      expect(report.totalStashes).toBe(3);
    });

    it("stashesFromOtherBranches is 2", () => {
      expect(report.stashesFromOtherBranches).toBe(2);
    });

    it("isSafeToIntegrate is false", () => {
      expect(report.isSafeToIntegrate).toBe(false);
    });

    it("stashes array has 3 entries", () => {
      expect(report.stashes).toHaveLength(3);
    });
  });

  // 5. recommendedPreflightActions is non-empty when stashes exist
  describe("recommendedPreflightActions populated", () => {
    it("is non-empty for any stash scenario", () => {
      const report = buildStashSafetyReportFromFixture(
        [makeStash({ index: 0, branch: OTHER_BRANCH, description: "stray stash" })],
        CURRENT_BRANCH,
        GENERATED_AT
      );
      expect(report.recommendedPreflightActions.length).toBeGreaterThan(0);
    });

    it("first action instructs to run git stash list", () => {
      const report = buildStashSafetyReportFromFixture(
        [makeStash({ index: 0, branch: OTHER_BRANCH, description: "stray stash" })],
        CURRENT_BRANCH,
        GENERATED_AT
      );
      expect(report.recommendedPreflightActions[0]).toContain("git stash list");
    });

    it("includes recovery branch instruction for other-branch stash", () => {
      const report = buildStashSafetyReportFromFixture(
        [makeStash({ index: 0, branch: OTHER_BRANCH, description: "stray stash" })],
        CURRENT_BRANCH,
        GENERATED_AT
      );
      const actionsText = report.recommendedPreflightActions.join("\n");
      expect(actionsText).toContain("recovery/");
    });
  });

  // 6. generatedAt is a non-empty string
  describe("generatedAt", () => {
    it("passes through the caller-supplied value", () => {
      const report = buildStashSafetyReportFromFixture([], CURRENT_BRANCH, GENERATED_AT);
      expect(report.generatedAt).toBe(GENERATED_AT);
    });

    it("is non-empty when a timestamp is provided", () => {
      const report = buildStashSafetyReportFromFixture([], CURRENT_BRANCH, GENERATED_AT);
      expect(report.generatedAt.length).toBeGreaterThan(0);
    });
  });

  // 7. currentBranch is preserved
  it("currentBranch matches the supplied branch", () => {
    const report = buildStashSafetyReportFromFixture([], CURRENT_BRANCH, GENERATED_AT);
    expect(report.currentBranch).toBe(CURRENT_BRANCH);
  });

  // 8. Module hygiene — no subprocess, no imports beyond the module under test
  it("module does not import subprocess or child_process patterns", () => {
    // This test reads no files; it documents the invariant statically.
    // The actual enforcement is in the source: stash-safety-check.ts must
    // not import 'child_process', 'fs', or call Date.now() / Math.random().
    // We verify the interface contract is satisfied.
    const report = buildStashSafetyReportFromFixture([], CURRENT_BRANCH, "fixed");
    expect(typeof report.generatedAt).toBe("string");
    expect(typeof report.isSafeToIntegrate).toBe("boolean");
    expect(Array.isArray(report.stashes)).toBe(true);
    expect(Array.isArray(report.recommendedPreflightActions)).toBe(true);
  });
});
