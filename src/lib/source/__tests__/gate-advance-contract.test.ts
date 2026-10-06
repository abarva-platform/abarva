import {
  evaluateSourceGateAdvanceContract,
  type SourceGateAdvanceContractInput,
} from "../gate-advance-contract";
import type { SourceEventGateCriterion } from "../canvas-substrate";

const REVIEW_REASON =
  "Sponsor reviewed the evidence bundle and approves this gate.";

const WORKED_STAGE_CONFIRMED = {
  evidenceComplete: true,
  exclusionsReviewed: true,
  stageFinal: true,
};
/**
 * C-550 support. Everything from here to READINESS_FAILURE_CASES exists so the
 * suite can assert the contract's readiness invariant without naming the input
 * it is defending against.
 */

/**
 * Every field `SourceGateAdvanceContractInput` declares. The wrappers below pass
 * these through untouched and answer "yes" to every other name, so this list is
 * the allowlist: adding a name here excuses it from the invariant, and that edit
 * is a reviewable line in a diff.
 */
const DECLARED_CONTRACT_INPUT_FIELDS = [
  "currentStage",
  "targetStage",
  "isTerminalClosure",
  "stageOrder",
  "confirmations",
  "criteria",
  "artifacts",
  "evidence",
  "reason",
  "verifiedDelegatedSponsorAcknowledgement",
  "tenantKey",
  "eventId",
  "scorecardRecords",
  "approvalPolicyCode",
] as const satisfies readonly (keyof SourceGateAdvanceContractInput)[];

/**
 * Exhaustiveness in the other direction, checked by `tsc` rather than asserted:
 * a field added to the contract's input type and not listed above fails the
 * typecheck. Without it the list could drift quietly and the wrappers would
 * start answering "yes" for a field that is legitimately declared.
 */
type UnlistedContractInputField = Exclude<
  keyof SourceGateAdvanceContractInput,
  (typeof DECLARED_CONTRACT_INPUT_FIELDS)[number]
>;
const _everyDeclaredFieldIsListed: never[] = [] as UnlistedContractInputField[];
void _everyDeclaredFieldIsListed;

/**
 * An object that is truthy and answers itself to every property, so
 * `input.overrides.readiness` and `input.options?.force` are both truthy. This
 * covers the options-bag and nested shapes; it is deliberately NOT the primitive
 * `true`, because a bag cannot satisfy `=== true` and a flag cannot be walked.
 * The two answers below are therefore complementary, not redundant.
 */
function permissiveBag(): unknown {
  const bag: Record<string, unknown> = {};
  return new Proxy(bag, {
    get(target, property, receiver) {
      if (typeof property !== "string") {
        return Reflect.get(target, property, receiver);
      }
      return permissiveBag();
    },
    has() {
      return true;
    },
  });
}

/**
 * The two shapes a future opt-in could take, driven over the same corpus. A
 * flag read as `input.skipReadiness === true` needs the primitive; a bag read as
 * `input.overrides.readiness` needs the object.
 */
const UNDECLARED_INPUT_ANSWERS: ReadonlyArray<[string, () => unknown]> = [
  ["a boolean flag", () => true],
  ["an options bag", () => permissiveBag()],
];

function answerYesToEveryUndeclaredField(
  declared: SourceGateAdvanceContractInput,
  answer: () => unknown,
  undeclaredFieldsRead: string[],
): SourceGateAdvanceContractInput {
  const allowlist: readonly string[] = DECLARED_CONTRACT_INPUT_FIELDS;
  return new Proxy(declared, {
    get(target, property, receiver) {
      if (typeof property !== "string" || allowlist.includes(property)) {
        return Reflect.get(target, property, receiver);
      }
      undeclaredFieldsRead.push(property);
      return answer();
    },
    has(target, property) {
      return typeof property === "string" || Reflect.has(target, property);
    },
  }) as SourceGateAdvanceContractInput;
}

/**
 * Readiness-failure modes read off `evaluateStagePromotionReadiness`, each with
 * human confirmations satisfied so the run reaches the readiness decision rather
 * than stopping at attestation. A new failure mode belongs in this list.
 */
const READINESS_FAILURE_CASES: ReadonlyArray<
  [string, () => SourceGateAdvanceContractInput]
> = [
  [
    "an open gate criterion",
    () => ({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    }),
  ],
  [
    "a stage with no scaffolded gate criteria",
    () => ({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [],
      reason: REVIEW_REASON,
    }),
  ],
  [
    "a criterion id the catalog cannot resolve",
    () => ({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-NOT-IN-CATALOG",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    }),
  ],
  [
    "a missing approval reason",
    () => ({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: "   ",
    }),
  ],
  [
    "a non-adjacent stage promotion",
    () => ({
      currentStage: "scope",
      targetStage: "evaluation",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    }),
  ],
  [
    "terminal closure with an open criterion",
    () => ({
      currentStage: "value",
      targetStage: null,
      isTerminalClosure: true,
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-VAL-01",
          fromStage: "value",
          toStage: "closed",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    }),
  ],
];

const READINESS_PASSES = (): SourceGateAdvanceContractInput => ({
  currentStage: "scope",
  targetStage: "rfp",
  confirmations: WORKED_STAGE_CONFIRMED,
  criteria: [
    criterion({
      criterionId: "GATE-SCOPE-01",
      fromStage: "scope",
      toStage: "rfp",
      state: "met",
    }),
  ],
  reason: REVIEW_REASON,
});

describe("evaluateSourceGateAdvanceContract", () => {
  const evaluationInput = (scorecardRecords?: unknown) => ({
    currentStage: "evaluation",
    targetStage: "pricing",
    confirmations: WORKED_STAGE_CONFIRMED,
    criteria: [criterion({
      criterionId: "GATE-EVAL-01",
      fromStage: "evaluation",
      toStage: "pricing",
      state: "met",
    })],
    reason: REVIEW_REASON,
    tenantKey: "tenant-a",
    eventId: "event-1",
    scorecardRecords,
  }) as SourceGateAdvanceContractInput;

  const readyScorecard = {
    kind: "available",
    criteria: [{
      tenantKey: "tenant-a",
      sourceEventId: "event-1",
      criterionId: "technical",
      criterionVersion: "v1",
      label: "Technical fit",
      weight: 100,
      weightsFrozen: true,
      approvedCriterionVersion: "v1",
      approvedBy: "owner-1",
      approvedAt: "2026-09-26T00:00:00Z",
    }],
    scores: [{
      tenantKey: "tenant-a",
      sourceEventId: "event-1",
      vendorId: "vendor-1",
      vendorName: "Supplier One",
      criterionId: "technical",
      criterionVersion: "v1",
      evaluatorId: "evaluator-1",
      evaluatorName: "Evaluator One",
      evaluatorScore: 8,
      evidenceReference: "artifact-1",
      overrideReason: null,
      overrideReasonRequired: false,
      lockState: "locked",
      lockedBy: "Evaluator One",
      lockedAt: "2026-09-26T00:05:00Z",
    }],
  } as const;

  it("refuses Evaluation promotion when scorecard authority cannot be read", () => {
    const verdict = evaluateSourceGateAdvanceContract(evaluationInput());
    expect(verdict).toEqual(expect.objectContaining({
      ok: false,
      status: 503,
      error: "scorecard_authority_unavailable",
    }));
  });

  it("refuses an opposite-tenant scorecard instead of accepting its locked score", () => {
    const verdict = evaluateSourceGateAdvanceContract(evaluationInput({
      ...readyScorecard,
      criteria: readyScorecard.criteria.map((row) => ({ ...row, tenantKey: "tenant-b" })),
      scores: readyScorecard.scores.map((row) => ({ ...row, tenantKey: "tenant-b" })),
    }));
    expect(verdict).toEqual(expect.objectContaining({
      ok: false,
      status: 409,
      error: "scorecard_authority_not_ready",
    }));
  });

  it("allows Evaluation promotion only with current locked score authority", () => {
    const verdict = evaluateSourceGateAdvanceContract(evaluationInput(readyScorecard));
    expect(verdict.ok).toBe(true);
  });

  it("rejects a legacy-style promotion with computed readiness but no human confirmations", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: {},
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "met",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(422);
    expect(verdict.error).toBe("confirmations_required");
    expect(verdict.missingConfirmations).toEqual([
      "evidenceComplete",
      "exclusionsReviewed",
      "stageFinal",
    ]);
  });

  it("rejects an analytics-style approval when computed readiness is not met", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(409);
    expect(verdict.error).toBe("gate_criterion_open");
  });

  it("allows a stage advance only when confirmations and computed readiness both pass", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "met",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
    expect(verdict.readiness.ok).toBe(true);
  });

  it("requires computed readiness when closing the terminal stage", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "value",
      targetStage: null,
      isTerminalClosure: true,
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-VAL-01",
          fromStage: "value",
          toStage: "closed",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(409);
    expect(verdict.error).toBe("gate_criterion_open");
  });

  // C-604. The contract used to accept `allowComputedReadinessBypass: true` and
  // return `ok` for a stage whose criteria were still open. No production route
  // ever passed it -- both the stage route and the event approval route call this
  // contract without the field -- so what was removed is the affordance, not a
  // live behaviour. These two cases drive the real contract with the field STILL
  // SET, through a cast, so reinstating the condition goes red rather than
  // silently returning to the old behaviour.
  //
  // What these two cases do NOT prove, said plainly rather than left implied: a
  // bypass reintroduced under a DIFFERENT field name would pass them, because
  // they can only send a name that exists. No test can send a field nobody has
  // written yet. The case above them -- an open criterion with confirmations and
  // no extra input at all -- is the one that catches an unconditional bypass;
  // between them the uncovered shape is exactly "a new opt-in nobody passes".
  it("has no input that converts an open gate criterion into an approval", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: WORKED_STAGE_CONFIRMED,
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
      ...({ allowComputedReadinessBypass: true } as Record<string, unknown>),
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(409);
    expect(verdict.error).toBe("gate_criterion_open");
    expect(verdict.blocker?.code).toBe("gate_criterion_open");
  });

  it("still requires human confirmations when a bypass-shaped input is sent", () => {
    const verdict = evaluateSourceGateAdvanceContract({
      currentStage: "scope",
      targetStage: "rfp",
      confirmations: {},
      criteria: [
        criterion({
          criterionId: "GATE-SCOPE-01",
          fromStage: "scope",
          toStage: "rfp",
          state: "pending",
        }),
      ],
      reason: REVIEW_REASON,
      ...({ allowComputedReadinessBypass: true } as Record<string, unknown>),
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe(422);
    expect(verdict.error).toBe("confirmations_required");
  });

  // C-550, the residual C-604 filed rather than closed. Everything above this
  // point defends the contract by NAMING the input it refuses --
  // `allowComputedReadinessBypass` -- and a test can only send a name that
  // already exists. Measured before this block was written: adding
  // `input.skipReadiness !== true` to the readiness branch of the real contract
  // left all 6 cases in this file green, and 52 tests across the stage route,
  // the approval route and the governance model green with it. So the shape
  // "an input that waives computed readiness" was uncovered under every name
  // but one.
  //
  // The two cases below express the invariant over the RESULT instead of over
  // any input name: when computed readiness fails, the contract's success path
  // is unreachable. They drive the real contract through an input that answers
  // `true` to every field the declared surface does not contain, so a bypass
  // added tomorrow under any name -- `skipReadiness`, `pilotOverride`,
  // `force`, an options bag -- receives its opt-in without this file having to
  // predict what it will be called. Excusing a name now takes an edit to
  // DECLARED_CONTRACT_INPUT_FIELDS, which is a reviewable line in a diff rather
  // than a silent gap.
  // C-550, the residual `C-604` filed rather than closed. Every case above this
  // point defends the contract by NAMING the input it refuses --
  // `allowComputedReadinessBypass` -- and a test can only send a name that
  // already exists. Measured before this block was written: adding
  // `input.skipReadiness !== true` to the readiness branch of the real contract
  // left all 6 cases in this file green, and 52 tests across the stage route,
  // the approval route and the governance model green with it. The shape "an
  // input that waives computed readiness" was uncovered under every name but
  // one.
  //
  // The cases below express the invariant over the RESULT instead of over any
  // input name: when computed readiness fails, the contract's success path is
  // unreachable. They drive the real contract through an input that answers
  // "yes" to every field the declared surface does not contain, so an opt-in
  // added tomorrow receives its consent without this file predicting its name.
  // Excusing a name then costs an edit to DECLARED_CONTRACT_INPUT_FIELDS, which
  // a reviewer sees, instead of costing nothing.
  describe("readiness failure keeps the success path unreachable", () => {
    const matrix = READINESS_FAILURE_CASES.flatMap(([failure, buildInput]) =>
      UNDECLARED_INPUT_ANSWERS.map(
        ([answerLabel, answer]) =>
          [failure, answerLabel, buildInput, answer] as const,
      ),
    );

    it.each(matrix)(
      "refuses %s when every undeclared input field answers with %s",
      (_failure, _answerLabel, buildInput, answer) => {
        const undeclaredFieldsRead: string[] = [];
        const verdict = evaluateSourceGateAdvanceContract(
          answerYesToEveryUndeclaredField(
            buildInput(),
            answer,
            undeclaredFieldsRead,
          ),
        );

        // Guards the corpus itself: a case whose readiness passes would make the
        // assertion below vacuous, so each one has to fail readiness to count.
        expect(verdict.readiness.ok).toBe(false);
        // Two assertions in one object, both name-independent, and the pairing
        // is deliberate: `ok: false` is the result invariant, and an empty read
        // list is the stronger statement that the contract consulted no field
        // outside its declared surface at all. A renamed opt-in fails the second
        // even in a path where it did not manage to flip the first, and the diff
        // prints the name this file could not have predicted.
        expect({
          ok: verdict.ok,
          undeclaredFieldsTheContractRead: undeclaredFieldsRead,
        }).toEqual({ ok: false, undeclaredFieldsTheContractRead: [] });
      },
    );

    // The positive controls, and they are not optional: without them a wrapper
    // that happened to break the contract outright would redden nothing and pass
    // every case above for the wrong reason.
    it.each(UNDECLARED_INPUT_ANSWERS)(
      "still approves a ready stage when undeclared fields answer with %s",
      (_answerLabel, answer) => {
        const undeclaredFieldsRead: string[] = [];
        const verdict = evaluateSourceGateAdvanceContract(
          answerYesToEveryUndeclaredField(
            READINESS_PASSES(),
            answer,
            undeclaredFieldsRead,
          ),
        );

        expect(verdict.ok).toBe(true);
        expect(verdict.readiness.ok).toBe(true);
        expect(undeclaredFieldsRead).toEqual([]);
      },
    );
  });
});

function criterion(
  overrides: Partial<SourceEventGateCriterion> &
    Pick<SourceEventGateCriterion, "criterionId">,
): SourceEventGateCriterion {
  const { criterionId, ...rest } = overrides;
  return {
    id: `state-${criterionId}`,
    sourceEventId: "event-1",
    tenantKey: "apex-retail",
    criterionId,
    fromStage: "scope",
    toStage: "rfp",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: REVIEW_REASON,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...rest,
  };
}
