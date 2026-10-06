import {
  MOVES_PHASE_STEP_GROUPS,
  getPhaseStepGroups,
  phaseSectionKeySet,
  phaseStepQuestionCounts,
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

/**
 * `U-567`. The signed-in wave family used to carry the mount set across all
 * three steps (`3 + 2 + 2 = 7` for P1) as its structural non-regression figure
 * for the `moves_capture_v2` path. That reading is no longer obtainable by an
 * unattended walk: step 1's *Continue* is now correctly gated on saved answers,
 * and the step bar only navigates backwards, so steps 2 and 3 cannot be reached
 * without writing. These cases move the figure off the walk and onto the
 * contract — the per-step counts are DERIVED here, and the rendered step-1 count
 * is pinned against this derivation in the component suite, so one reachable
 * step still falsifies a change to the mount set.
 */
describe("phaseStepQuestionCounts — the contract-derived mount set", () => {
  it("returns one count per step and partitions the phase's canonical questions", () => {
    for (const phase of PHASES) {
      const counts = phaseStepQuestionCounts(phase);
      expect(counts).toHaveLength(getPhaseStepGroups(phase).length);
      expect(counts.reduce((total, n) => total + n, 0)).toBe(
        getPhaseCaptureSections(phase).length,
      );
      for (const n of counts) expect(n).toBeGreaterThan(0);
    }
  });

  it("counts only the keys the supplied contract declares, so dropping a question drops it from exactly its own step", () => {
    // The grouping's key list is NOT the mount set: the capture flow renders a
    // step's keys filtered through the sections it was given, so a key the
    // contract no longer declares mounts nothing. A derivation that returned
    // `group.sectionKeys.length` would over-count here and would then disagree
    // with what the component renders.
    const full = getPhaseCaptureSections(1);
    const firstStepKey = getPhaseStepGroups(1)[0].sectionKeys[1];
    const trimmed = full.filter((section) => section.key !== firstStepKey);

    const before = phaseStepQuestionCounts(1, full);
    const after = phaseStepQuestionCounts(1, trimmed);

    expect(after[0]).toBe(before[0] - 1);
    expect(after.slice(1)).toEqual(before.slice(1));
    expect(after.reduce((total, n) => total + n, 0)).toBe(trimmed.length);
  });

  it("is empty for a phase the 3-step model does not cover", () => {
    expect(phaseStepQuestionCounts(9)).toEqual([]);
  });
});
