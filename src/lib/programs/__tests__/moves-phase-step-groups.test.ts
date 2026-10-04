import {
  MOVES_PHASE_STEP_GROUPS,
  getPhaseStepGroups,
  phaseSectionKeySet,
} from "../moves-phase-step-groups";
import { getPhaseCaptureSections } from "../phase-capture-contract";

const PHASES = [0, 1, 2, 3, 4, 5] as const;

describe("Moves 3-step phase grouping", () => {
  it("models all six phases with exactly three steps each", () => {
    for (const phase of PHASES) {
      const groups = getPhaseStepGroups(phase);
      expect(groups).toHaveLength(3);
      for (const group of groups) {
        expect(group.title.trim().length).toBeGreaterThan(0);
        expect(group.intro.trim().length).toBeGreaterThan(0);
        expect(group.sectionKeys.length).toBeGreaterThan(0);
      }
    }
  });

  it("references every capture section key for a phase exactly once — no input dropped or duplicated", () => {
    for (const phase of PHASES) {
      const grouped = getPhaseStepGroups(phase).flatMap(
        (group) => group.sectionKeys,
      );
      const contractKeys = phaseSectionKeySet(phase);

      // No duplicates across steps.
      expect(new Set(grouped).size).toBe(grouped.length);

      // Exactly the contract's keys — every one covered, none invented.
      expect(new Set(grouped)).toEqual(contractKeys);
    }
  });

  it("keeps each step to a focused cluster (<= 4 questions; 2-3 is the norm)", () => {
    for (const phase of PHASES) {
      for (const group of getPhaseStepGroups(phase)) {
        expect(group.sectionKeys.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it("orders grouped keys so the first step leads with the phase's first canonical input", () => {
    // Sanity that the grouping is built from the real contract, not a stale copy.
    for (const phase of PHASES) {
      const firstContractKey = getPhaseCaptureSections(phase)[0]?.key;
      const firstGroupedKey = getPhaseStepGroups(phase)[0]?.sectionKeys[0];
      expect(firstGroupedKey).toBe(firstContractKey);
    }
  });

  it("exposes the groups as a frozen-shaped record keyed by phase number", () => {
    expect(Object.keys(MOVES_PHASE_STEP_GROUPS).sort()).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });
});
