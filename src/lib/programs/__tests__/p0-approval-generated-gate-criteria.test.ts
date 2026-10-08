import {
  P0_APPROVAL_GENERATED_CRITERION_KEYS,
  isP0ApprovalGeneratedCriterion,
  partitionOpenHardGateCriteria,
} from "@/lib/programs/p0-approval-generated-gate-criteria";
import { gateCriteriaForPhase } from "@/lib/programs/governance";

type Criterion = { id: string; label: string };

const seed: Criterion = {
  id: "program_seed_recorded",
  label: "Origination brief signed off with archetype classification",
};
const hypothesis: Criterion = {
  id: "value_hypothesis_seed",
  label: "Value hypothesis seed names problem trigger and target outcome",
};
const sponsor: Criterion = {
  id: "sponsor_assigned",
  label: "Sponsor progress contact listed",
};
const evidence: Criterion = {
  id: "p0_source_evidence",
  label: "One uploaded P0 source file reviewed",
};

describe("P0 approval-generated gate criteria — the declared set", () => {
  // The carve-out is only defensible if every key in it is really a hard
  // check of the P0 -> P1 rule. If governance renames one, this fails rather
  // than silently letting a real blocker be hidden.
  it("names only hard checks that the P0 -> P1 rule actually declares", () => {
    const p0 = gateCriteriaForPhase(0);
    expect(p0).not.toBeNull();
    const hardKeys = (p0 ?? [])
      .filter((check) => check.severity === "hard")
      .map((check) => check.key);
    expect(hardKeys.length).toBeGreaterThan(0);
    for (const key of P0_APPROVAL_GENERATED_CRITERION_KEYS) {
      expect(hardKeys).toContain(key);
    }
  });

  // The guard that makes the set non-vacuous: at least one hard P0 check must
  // stay OUT of it, or "actionable" would always be empty and the blocked
  // state could never be reported at P0 at all.
  it("leaves at least one hard P0 check actionable", () => {
    const p0 = gateCriteriaForPhase(0);
    const hardKeys = (p0 ?? [])
      .filter((check) => check.severity === "hard")
      .map((check) => check.key);
    const left = hardKeys.filter((key) => !isP0ApprovalGeneratedCriterion(key));
    expect(left.length).toBeGreaterThan(0);
  });

  it("does not claim sponsor_assigned — it passes on a recorded sponsor alone", () => {
    expect(isP0ApprovalGeneratedCriterion("sponsor_assigned")).toBe(false);
  });

  it("claims both brief-dependent checks", () => {
    expect(isP0ApprovalGeneratedCriterion("program_seed_recorded")).toBe(true);
    expect(isP0ApprovalGeneratedCriterion("value_hypothesis_seed")).toBe(true);
  });

  it("claims nothing it was not given", () => {
    expect(isP0ApprovalGeneratedCriterion("p0_source_evidence")).toBe(false);
    expect(isP0ApprovalGeneratedCriterion("charter_signed_off")).toBe(false);
    expect(isP0ApprovalGeneratedCriterion("")).toBe(false);
  });
});

describe("partitionOpenHardGateCriteria", () => {
  it("at P0, routes each criterion to the side that matches its own id", () => {
    const { actionable, approvalGenerated } = partitionOpenHardGateCriteria({
      phase: 0,
      openHardCriteria: [seed, sponsor, hypothesis, evidence],
    });
    expect(actionable.map((c) => c.id)).toEqual([
      "sponsor_assigned",
      "p0_source_evidence",
    ]);
    expect(approvalGenerated.map((c) => c.id)).toEqual([
      "program_seed_recorded",
      "value_hypothesis_seed",
    ]);
  });

  it("at P0 with only brief-dependent checks open, nothing is actionable", () => {
    const { actionable, approvalGenerated } = partitionOpenHardGateCriteria({
      phase: 0,
      openHardCriteria: [seed, hypothesis],
    });
    expect(actionable).toEqual([]);
    expect(approvalGenerated).toHaveLength(2);
  });

  it("at P0 with a real blocker open, that blocker survives as actionable", () => {
    const { actionable } = partitionOpenHardGateCriteria({
      phase: 0,
      openHardCriteria: [seed, evidence, hypothesis],
    });
    expect(actionable.map((c) => c.id)).toEqual(["p0_source_evidence"]);
    expect(actionable[0]?.label).toBe("One uploaded P0 source file reviewed");
  });

  // The carve-out's basis is the brief the P0 close signs, so it must not
  // reach any later phase: a same-named check at P1+ stays blocking.
  it.each([1, 2, 3, 4, 5])(
    "at P%i it is a no-op — every open hard criterion stays actionable",
    (phase) => {
      const { actionable, approvalGenerated } = partitionOpenHardGateCriteria({
        phase,
        openHardCriteria: [seed, hypothesis, sponsor],
      });
      expect(actionable.map((c) => c.id)).toEqual([
        "program_seed_recorded",
        "value_hypothesis_seed",
        "sponsor_assigned",
      ]);
      expect(approvalGenerated).toEqual([]);
    },
  );

  it("returns empty sides for an empty input", () => {
    expect(
      partitionOpenHardGateCriteria({ phase: 0, openHardCriteria: [] }),
    ).toEqual({ actionable: [], approvalGenerated: [] });
  });

  it("does not alias the caller's array", () => {
    const input = [seed, sponsor];
    const { actionable } = partitionOpenHardGateCriteria({
      phase: 3,
      openHardCriteria: input,
    });
    actionable.push(evidence);
    expect(input).toHaveLength(2);
  });
});
