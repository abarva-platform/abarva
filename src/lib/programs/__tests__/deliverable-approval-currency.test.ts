// An unevaluable approval-currency check must not veto a recorded human sign-off.
//
// The defect this pins: `isSignedOff` resolved a deliverable's phase from
// `DELIVERABLE_REGISTRY` and treated "no phase" as "the approval is stale". The
// `origination_brief` is not a registry key, the deliverable sign-off route
// accepts it, and its file-upload approval path sets `approved_artifact_id` — so
// the three HARD P0 -> P1 criteria that all read that one row reported failed
// with the brief sitting there signed off, permanently.
//
// Two of these cases are written as literal key lists rather than derived from the
// module under test, because a derived expectation cannot see the thing that went
// wrong: `origination_brief` being absent from the registry is exactly the input,
// so reading the registry to build the expectation would restate the bug as the
// rule (cf. an expectation read off the declaration under test).

import {
  __resetUnevaluableApprovalCurrencyReports,
  DELIVERABLE_APPROVAL_CURRENCY_PHASES,
  describeUnevaluableApprovalCurrency,
  reportUnevaluableApprovalCurrencyOnce,
  resolveDeliverableApprovalCurrencyScope,
} from "@/lib/programs/deliverable-approval-currency";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import { isApprovedMoveEvidenceBasisCurrent } from "@/lib/programs/approved-move-evidence-snapshot";
import { ALLOWED_PROGRAM_DELIVERABLE_TYPES } from "@/lib/agent/tools/program/completeDeliverable";

/**
 * The alias groups `governance.ts` reads through `isSignedOff` for a criterion
 * that has NO capture-text fallback, with the gate and severity each one carries.
 * Written out rather than imported: `isSignedOff` is a closure inside
 * `evaluateGate` and these joins are inline literals in its switch, so this list
 * is the only place the pairing is stated in a form a test can check.
 */
const SIGN_OFF_BACKED_CRITERIA: ReadonlyArray<{
  gate: string;
  severity: "hard" | "soft";
  criterion: string;
  keys: readonly string[];
}> = [
  {
    gate: "P0->P1",
    severity: "hard",
    criterion: "program_seed_recorded",
    keys: ["origination_brief", "program_seed_brief", "program_seed"],
  },
  {
    gate: "P0->P1",
    severity: "hard",
    criterion: "value_hypothesis_seed",
    keys: ["origination_brief", "program_seed_brief", "program_seed"],
  },
  {
    gate: "P1->P2",
    severity: "hard",
    criterion: "charter_signed_off",
    keys: ["charter"],
  },
  {
    gate: "P5->P6",
    severity: "hard",
    criterion: "handoff_package_signed_off",
    keys: ["handoff_package", "mobilization_handoff_package", "mobilization_package"],
  },
  {
    gate: "P5->P6",
    severity: "hard",
    criterion: "value_measurement_contract_signed_off",
    keys: ["value_measurement_contract", "benefits_realization_plan", "value_contract"],
  },
];

describe("deliverable approval currency scope", () => {
  it("resolves an evaluable phase for a registered deliverable", () => {
    const scope = resolveDeliverableApprovalCurrencyScope("charter");
    expect(scope).toEqual({ evaluable: true, phase: 1 });
  });

  it("reports the registry gap for a key the registry does not carry", () => {
    const scope = resolveDeliverableApprovalCurrencyScope("origination_brief");
    expect(scope).toEqual({
      evaluable: false,
      phase: null,
      reason: "unregistered_deliverable_key",
    });
  });

  it("separates an out-of-range phase from an absent registration", () => {
    // A future registration could land a deliverable at P0 or P6. That is a
    // different gap from an unregistered key, and the reason has to say which.
    const scope = resolveDeliverableApprovalCurrencyScope("p0_seed", {
      registry: [{ deliverableTypeKey: "p0_seed", phase: 0 }],
    });
    expect(scope).toEqual({
      evaluable: false,
      phase: null,
      reason: "phase_outside_evidence_basis_range",
    });
  });

  it("holds every registry phase inside the evaluable range", () => {
    const outside = DELIVERABLE_REGISTRY.filter(
      (spec) =>
        spec.phase < DELIVERABLE_APPROVAL_CURRENCY_PHASES.min ||
        spec.phase > DELIVERABLE_APPROVAL_CURRENCY_PHASES.max,
    ).map((spec) => spec.deliverableTypeKey);
    expect(outside).toEqual([]);
    for (const spec of DELIVERABLE_REGISTRY) {
      expect(resolveDeliverableApprovalCurrencyScope(spec.deliverableTypeKey)).toEqual(
        { evaluable: true, phase: spec.phase },
      );
    }
  });

  it("agrees with what isApprovedMoveEvidenceBasisCurrent can actually answer", () => {
    // Do not restate 1 and 5 — ask the function. Inside the range it is reachable
    // (a null snapshot still refuses, so assert it is not refused BY THE BOUND by
    // using an input that would otherwise pass); outside it, nothing can pass.
    const callAt = (phase: number) =>
      isApprovedMoveEvidenceBasisCurrent({
        snapshot: {
          revision: "rev-1",
          revisionByPhase: { [phase]: "rev-1" },
          latestEvidenceActivityAtByPhase: { [phase]: null },
        } as never,
        phase,
        recordedRevision: "rev-1",
        generatedAt: "2026-10-06T00:00:00.000Z",
      });
    expect(callAt(DELIVERABLE_APPROVAL_CURRENCY_PHASES.min)).toBe(true);
    expect(callAt(DELIVERABLE_APPROVAL_CURRENCY_PHASES.max)).toBe(true);
    expect(callAt(DELIVERABLE_APPROVAL_CURRENCY_PHASES.min - 1)).toBe(false);
    expect(callAt(DELIVERABLE_APPROVAL_CURRENCY_PHASES.max + 1)).toBe(false);
  });

  it("names the key and refuses to claim the approval was verified", () => {
    const detail = describeUnevaluableApprovalCurrency(
      "origination_brief",
      "unregistered_deliverable_key",
    );
    expect(detail).toContain("origination_brief");
    expect(detail).toContain("sign-off stands");
    expect(detail).toContain("was not");
    expect(detail).not.toMatch(/\bcurrent\b(?!cy)/);
  });
});

describe("reporting the gap", () => {
  beforeEach(() => {
    __resetUnevaluableApprovalCurrencyReports();
  });

  it("reports a deliverable type once, not once per gate evaluation", () => {
    const log = jest.fn();
    const first = reportUnevaluableApprovalCurrencyOnce(
      "origination_brief",
      "unregistered_deliverable_key",
      log,
    );
    const second = reportUnevaluableApprovalCurrencyOnce(
      "origination_brief",
      "unregistered_deliverable_key",
      log,
    );
    expect([first, second]).toEqual([true, false]);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][1]).toMatchObject({
      deliverableTypeKey: "origination_brief",
      reason: "unregistered_deliverable_key",
    });
  });

  it("separates one deliverable type from another", () => {
    // The gap is per type. Deduping on the reason alone would hide the second
    // type entirely, which is the opposite of what this report is for.
    const log = jest.fn();
    reportUnevaluableApprovalCurrencyOnce(
      "origination_brief",
      "unregistered_deliverable_key",
      log,
    );
    reportUnevaluableApprovalCurrencyOnce(
      "tower_handoff_plan",
      "unregistered_deliverable_key",
      log,
    );
    expect(log.mock.calls.map((call) => call[1].deliverableTypeKey)).toEqual([
      "origination_brief",
      "tower_handoff_plan",
    ]);
  });
});

describe("the P0 dead end this scope exists to prevent", () => {
  it("leaves every P0 -> P1 hard criterion reading one unregistered key", () => {
    // The defect's severity came from there being no second row to fall back on:
    // all three P0 hard criteria read the SAME alias group, and the only member of
    // it the sign-off route accepts is the one the registry cannot phase-resolve.
    const p0Groups = SIGN_OFF_BACKED_CRITERIA.filter((g) => g.gate === "P0->P1");
    expect(p0Groups.length).toBeGreaterThan(1);
    for (const group of p0Groups) {
      expect(group.severity).toBe("hard");
      const signOffable = group.keys.filter(
        (key) =>
          ALLOWED_PROGRAM_DELIVERABLE_TYPES.has(key) ||
          DELIVERABLE_REGISTRY.some((spec) => spec.deliverableTypeKey === key),
      );
      expect(signOffable).toEqual(["origination_brief"]);
      expect(
        resolveDeliverableApprovalCurrencyScope("origination_brief").evaluable,
      ).toBe(false);
    }
  });

  it("enumerates which sign-off-backed hard criteria can be currency-checked", () => {
    const rows = SIGN_OFF_BACKED_CRITERIA.map((group) => ({
      criterion: group.criterion,
      evaluableKeys: group.keys.filter(
        (key) => resolveDeliverableApprovalCurrencyScope(key).evaluable,
      ),
    }));
    // Literal, so a registration or an alias rename moves a row here instead of
    // passing silently. Every group except P0's has at least one evaluable key —
    // that asymmetry is the whole reason P0 was the gate that dead-ended.
    expect(rows).toEqual([
      { criterion: "program_seed_recorded", evaluableKeys: [] },
      { criterion: "value_hypothesis_seed", evaluableKeys: [] },
      { criterion: "charter_signed_off", evaluableKeys: ["charter"] },
      {
        criterion: "handoff_package_signed_off",
        evaluableKeys: ["handoff_package"],
      },
      {
        criterion: "value_measurement_contract_signed_off",
        evaluableKeys: ["value_measurement_contract"],
      },
    ]);
  });
});
