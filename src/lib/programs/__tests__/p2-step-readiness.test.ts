import {
  P2_HARD_CHECK_IDS,
  citableP2RegisterIds,
  numberedP2EvidenceReferences,
  p2CheckState,
  p2EvidencePlanReady,
  uncitedP2BaselineReasons,
} from "../p2-step-readiness";
import type { GateCriterionView } from "../gate-readiness-step";
import type { MoveEvidenceNeedPacket } from "../evidence-readiness/move-evidence-need-packet";
import type { ReadinessReport } from "../current-state-readiness";
import type { AssumptionView } from "../assumption-register/register-request";

const checks = (open?: string): GateCriterionView[] =>
  P2_HARD_CHECK_IDS.map((id) => ({
    id,
    label: id,
    severity: "hard",
    completed: id !== open,
    verified: true,
  }));

const packet = (
  status: MoveEvidenceNeedPacket["status"],
): MoveEvidenceNeedPacket =>
  ({
    phase: 2,
    priority: "required",
    status,
    familyId: "baseline",
    evidenceSlot: "Baseline",
  }) as MoveEvidenceNeedPacket;

const readiness = (hardGaps: string[] = []): ReadinessReport =>
  ({ hardGaps }) as ReadinessReport;

describe("P2 step readiness is governed by the current evaluator", () => {
  it.each(P2_HARD_CHECK_IDS)(
    "does not claim %s met when it is open or unreadable",
    (id) => {
      expect(p2CheckState(checks(id), id)).toBe("open");
      expect(
        p2CheckState(
          checks().map((check) =>
            check.id === id ? { ...check, verified: false } : check,
          ),
          id,
        ),
      ).toBe("unavailable");
      expect(
        p2CheckState(
          checks().filter((check) => check.id !== id),
          id,
        ),
      ).toBe("unavailable");
      expect(p2CheckState(checks(), id)).toBe("met");
    },
  );

  it("keeps packet coverage distinct from the signed-report readiness criterion", () => {
    expect(
      p2EvidencePlanReady({
        packets: [packet("covered")],
        readiness: readiness(),
        readable: true,
        criteria: checks("p2_readiness_cleared"),
      }),
    ).toBe(false);
    expect(
      p2EvidencePlanReady({
        packets: [packet("covered")],
        readiness: readiness(),
        readable: true,
        criteria: checks(),
      }),
    ).toBe(true);
  });

  it("fails closed for missing, waived, unreadable, undeclared or hard-gap evidence", () => {
    const base = {
      packets: [packet("covered")],
      readiness: readiness(),
      readable: true,
      criteria: checks(),
    };
    expect(p2EvidencePlanReady({ ...base, packets: [packet("missing")] })).toBe(
      false,
    );
    expect(p2EvidencePlanReady({ ...base, packets: [packet("waived")] })).toBe(
      false,
    );
    expect(p2EvidencePlanReady({ ...base, packets: [] })).toBe(false);
    expect(p2EvidencePlanReady({ ...base, readiness: null })).toBe(false);
    expect(p2EvidencePlanReady({ ...base, readable: false })).toBe(false);
    expect(
      p2EvidencePlanReady({
        ...base,
        readiness: readiness(["No reviewed source"]),
      }),
    ).toBe(false);
  });
});

describe("P2 baseline citation hold", () => {
  const base = { registerIds: ["B1"], approvedEvidenceIds: ["evidence-uuid"] };
  it("rejects draft, redacted and figureless register rows as numeric sources", () => {
    const row = {
      id: "row-1",
      registerId: "B1",
      status: "confirmed",
      workingFigure: "30%",
      answerFigure: null,
      figuresRedacted: false,
    } as AssumptionView;
    expect(citableP2RegisterIds(null)).toBeNull();
    expect(citableP2RegisterIds([row])).toEqual(["B1", "row-1"]);
    for (const disallowed of [
      { ...row, status: "open" },
      { ...row, status: "proposed" },
      { ...row, figuresRedacted: true },
      { ...row, workingFigure: null },
    ] as AssumptionView[]) {
      const registerIds = citableP2RegisterIds([disallowed]);
      expect(registerIds).toEqual([]);
      expect(
        uncitedP2BaselineReasons({
          findings: "12 of 40 [A:B1].",
          baseline: "",
          registerIds,
          approvedEvidenceIds: [],
        }),
      ).toHaveLength(1);
    }
    expect(
      citableP2RegisterIds([
        { ...row, status: "corrected", answerFigure: "31%" },
      ]),
    ).toEqual(["B1", "row-1"]);
  });
  it("numbers approved references in the exact order used by [E:n] resolution", () => {
    expect(
      numberedP2EvidenceReferences([
        { evidenceId: "first", title: "First source" },
        { evidenceId: "second", title: "Second source" },
      ]),
    ).toEqual([
      { evidenceId: "first", title: "First source", citation: "[E:1]" },
      { evidenceId: "second", title: "Second source", citation: "[E:2]" },
    ]);
  });
  it("accepts a register row or an approved evidence citation", () => {
    expect(
      uncitedP2BaselineReasons({
        ...base,
        findings: "12 of 40 [E:1].",
        baseline: '[{"metric":"Coverage","value":"30%","source":"[A:B1]"}]',
      }),
    ).toEqual([]);
    expect(
      uncitedP2BaselineReasons({
        ...base,
        findings: "",
        baseline:
          '[{"metric":"Coverage","value":"30%","source":"[E:evidence-uuid]"}]',
      }),
    ).toEqual([]);
  });

  it("holds uncited, unknown, unapproved and unreadable-register figures", () => {
    expect(
      uncitedP2BaselineReasons({
        ...base,
        findings: "12 of 40.",
        baseline: "",
      }),
    ).toHaveLength(1);
    expect(
      uncitedP2BaselineReasons({
        ...base,
        findings: "12 of 40 [A:missing].",
        baseline: "",
      }),
    ).toHaveLength(1);
    expect(
      uncitedP2BaselineReasons({
        ...base,
        findings: "12 of 40 [E:2].",
        baseline: "",
      }),
    ).toHaveLength(1);
    expect(
      uncitedP2BaselineReasons({
        ...base,
        registerIds: null,
        findings: "12 of 40 [A:B1].",
        baseline: "",
      }),
    ).toEqual([
      "Finding 1: The assumptions register could not be read, so its citation cannot be checked.",
    ]);
    expect(
      uncitedP2BaselineReasons({
        ...base,
        registerIds: null,
        findings: "",
        baseline: '[{"metric":"Coverage","value":"30%","source":"[A:B1]"}]',
      }),
    ).toEqual([
      "Baseline row 1: The assumptions register could not be read, so its citation cannot be checked.",
    ]);
    expect(
      uncitedP2BaselineReasons({
        ...base,
        findings: "",
        baseline: '[{"metric":"Coverage","value":"30%","source":"workshop"}]',
      }),
    ).toHaveLength(1);
  });
});
