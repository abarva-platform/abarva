import {
  gateChecks,
  gateDocumentSignState,
  resolveGateStep,
  type GateCriterionView,
  type GateDocumentView,
  type GateStepInput,
} from "@/lib/programs/gate-readiness-step";

const criterion = (
  id: string,
  overrides: Partial<GateCriterionView> = {},
): GateCriterionView => ({
  id,
  label: `Label ${id}`,
  severity: "hard",
  completed: true,
  verified: true,
  ...overrides,
});

const doc = (
  key: string,
  overrides: Partial<GateDocumentView> = {},
): GateDocumentView => ({
  key,
  title: `Doc ${key}`,
  build: "built",
  currentVersion: 1,
  signedOffVersion: 1,
  deliverableId: `d-${key}`,
  ...overrides,
});

const input = (overrides: Partial<GateStepInput> = {}): GateStepInput => ({
  criteria: [
    criterion("solution_route_validated"),
    criterion("design_approved"),
    criterion("phase_3_findings_written", {
      severity: "soft",
      completed: false,
    }),
  ],
  documents: [doc("a"), doc("b")],
  signOffReadable: true,
  canApprove: true,
  approverName: "The gate approver",
  rationaleWritten: true,
  phaseName: "Design",
  nextPhaseLabel: "P4 Roadmap",
  ...overrides,
});

describe("gateDocumentSignState", () => {
  it.each([
    [{ build: "none" as const }, "not_built"],
    [{ build: "queued" as const }, "building"],
    [{ build: "building" as const }, "building"],
    [{ build: "failed" as const }, "failed"],
    [{ signedOffVersion: null }, "unsigned"],
    [{}, "signed"],
    [{ currentVersion: 3, signedOffVersion: 2 }, "superseded"],
    [{ deliverableId: null }, "unknown"],
    [{ currentVersion: null }, "unknown"],
  ])("%o reads as %s", (overrides, expected) => {
    expect(gateDocumentSignState(doc("x", overrides), true)).toBe(expected);
  });

  it("does not claim signed or unsigned when the sign-off read failed", () => {
    expect(gateDocumentSignState(doc("x"), false)).toBe("unknown");
    expect(
      gateDocumentSignState(doc("x", { signedOffVersion: null }), false),
    ).toBe("unknown");
  });
});

describe("gateChecks", () => {
  it("carries the evaluator's reason on an unmet check and links document-backed ones", () => {
    const [route, design] = gateChecks([
      criterion("solution_route_validated", {
        completed: false,
        reason: "Route not validated.",
      }),
      criterion("design_approved", { completed: false, reason: "Not signed." }),
    ]);
    expect(route).toMatchObject({
      met: false,
      unknown: false,
      note: "Route not validated.",
    });
    expect(route.targetRowId).toBeUndefined();
    expect(design.targetRowId).toBe("DOCS");
  });

  it("reads every check as not evaluated when any criterion could not be read", () => {
    const checks = gateChecks([
      criterion("a"),
      criterion("b", { verified: false, completed: false }),
    ]);
    expect(
      checks.every((c) => c.unknown && !c.met && c.note === "not evaluated"),
    ).toBe(true);
  });
});

describe("resolveGateStep", () => {
  it("ready: every required check met and the rationale written enables submission", () => {
    const model = resolveGateStep(input());
    expect(model.canSubmit).toBe(true);
    expect(model.countLabel).toBe("2 of 2 required checks met");
    expect(model.nextAction).toMatchObject({
      state: "ready",
      continueEnabled: true,
    });
    expect(model.nextAction.sentence).toBe(
      "Every required check passes and the rationale is written. Approve and submit Design.",
    );
  });

  it("an advisory check never holds submission", () => {
    expect(
      resolveGateStep(input()).checks.find((c) => c.level === "soft")?.met,
    ).toBe(false);
    expect(resolveGateStep(input()).canSubmit).toBe(true);
  });

  it("an unwritten rationale holds submission and is named", () => {
    const model = resolveGateStep(input({ rationaleWritten: false }));
    expect(model.canSubmit).toBe(false);
    expect(model.nextAction.sentence).toBe("Write the approval rationale.");
  });

  it("names the documents first: build, then sign", () => {
    const notBuilt = resolveGateStep(
      input({
        criteria: [criterion("design_approved", { completed: false })],
        documents: [doc("a", { build: "none" }), doc("b", { build: "none" })],
        rationaleWritten: false,
      }),
    );
    expect(notBuilt.nextAction.sentence).toBe(
      "Build the 2 gate documents and write the approval rationale.",
    );
    const toSign = resolveGateStep(
      input({
        criteria: [criterion("design_approved", { completed: false })],
        documents: [
          doc("a"),
          doc("b", { currentVersion: 3, signedOffVersion: 2 }),
        ],
      }),
    );
    expect(toSign.nextAction.sentence).toBe("Sign off 1 gate document.");
  });

  it("names a single failed document by title", () => {
    const model = resolveGateStep(
      input({
        criteria: [criterion("design_approved", { completed: false })],
        documents: [
          doc("a"),
          doc("b", {
            build: "failed",
            title: "Requirements Traceability Matrix",
          }),
        ],
      }),
    );
    expect(model.nextAction.sentence).toBe(
      "Build the Requirements Traceability Matrix again.",
    );
  });

  it("points to the checks list for an unmet required check no row here settles", () => {
    const model = resolveGateStep(
      input({
        criteria: [criterion("solution_route_validated", { completed: false })],
      }),
    );
    expect(model.canSubmit).toBe(false);
    expect(model.nextAction.sentence).toBe(
      "Close the 1 open required check in the checks list.",
    );
  });

  it("blocked: an unreadable gate shows no check as met and offers nothing", () => {
    const model = resolveGateStep(
      input({
        criteria: [
          criterion("design_approved", { verified: false, completed: false }),
        ],
      }),
    );
    expect(model.nextAction).toMatchObject({
      state: "blocked",
      continueEnabled: false,
    });
    expect(model.countLabel).toBe(
      "Not evaluated · gate state could not be read",
    );
    expect(model.canSubmit).toBe(false);
  });

  it("a non-approver is told who approves and is never offered submission", () => {
    const ready = resolveGateStep(input({ canApprove: false }));
    expect(ready.canSubmit).toBe(false);
    expect(ready.nextAction.continueEnabled).toBe(false);
    expect(ready.footerNote).toBe("The gate approver approves this gate.");
    expect(ready.nextAction.sentence).toBe(
      "Every required check passes. The gate approver can approve and submit Design.",
    );
    const unsigned = resolveGateStep(
      input({
        canApprove: false,
        criteria: [criterion("design_approved", { completed: false })],
        documents: [doc("a", { signedOffVersion: null })],
      }),
    );
    expect(unsigned.nextAction.sentence).toBe(
      "Nothing here needs you. The gate approver signs the gate documents and approves this gate.",
    );
  });

  it("a non-approver can still be asked to build", () => {
    const model = resolveGateStep(
      input({
        canApprove: false,
        criteria: [criterion("design_approved", { completed: false })],
        documents: [doc("a", { build: "none" })],
      }),
    );
    expect(model.nextAction.sentence).toBe(
      "Build the gate document. The gate approver signs the gate documents and approves this gate.",
    );
  });

  it("submitted: done, no forward action", () => {
    const model = resolveGateStep(input({ submittedOn: "Oct 20" }));
    expect(model.nextAction).toMatchObject({
      state: "done",
      eyebrow: "✓ Submitted · Oct 20",
    });
    expect(model.footerNote).toBe("Submitted Oct 20");
    expect(model.canSubmit).toBe(false);
  });

  it("no required checks at all is not ready", () => {
    expect(resolveGateStep(input({ criteria: [] })).canSubmit).toBe(false);
  });
});
