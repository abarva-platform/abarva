import {
  PHASE_BUILD_BLOCK_ORDER,
  resolvePhaseBuildBlock,
  type PhaseBuildBlockInput,
} from "@/lib/programs/phase-build-action-state";

const OFFERABLE: PhaseBuildBlockInput = {
  building: false,
  anyRunning: false,
  parentBlockerText: null,
  requiredEvidenceGapCount: 0,
  phaseLabel: "P3 Design Future State",
};

function block(overrides: Partial<PhaseBuildBlockInput>) {
  return resolvePhaseBuildBlock({ ...OFFERABLE, ...overrides });
}

describe("resolvePhaseBuildBlock", () => {
  it("returns null when nothing holds the build", () => {
    expect(resolvePhaseBuildBlock(OFFERABLE)).toBeNull();
  });

  it("names the in-flight hold while this control's own submit is running", () => {
    const held = block({ building: true });
    expect(held?.key).toBe("build_in_flight");
    expect(held?.actionLabel).toBe("Building P3 Design Future State…");
    expect(held?.statusLine).toBe(
      "Building P3 Design Future State. Keep this page open while the governed batch finishes.",
    );
  });

  // `building` alone used to leave the LABEL reading "Approve & Build" on a
  // control the same render disabled: the label ladder read `anyRunning` only.
  it("names the in-flight hold for an own submit as well as a running batch", () => {
    expect(block({ building: true })?.key).toBe("build_in_flight");
    expect(block({ anyRunning: true })?.key).toBe("build_in_flight");
    expect(block({ building: true })?.actionLabel).toBe(
      block({ anyRunning: true })?.actionLabel,
    );
  });

  it("reuses the parent's own sentence for the phase-inputs hold", () => {
    const held = block({
      parentBlockerText:
        "Select the solution option that architecture should implement before Approve & Build.",
    });
    expect(held?.key).toBe("phase_inputs_incomplete");
    expect(held?.actionLabel).toBe("Complete phase inputs before build");
    expect(held?.statusLine).toBe(
      "Select the solution option that architecture should implement before Approve & Build.",
    );
  });

  // `Boolean(disabledReason)` was the control's own test, so a blank sentence
  // never held the build. Keeping that reading is what stops an empty string
  // disabling the control with nothing to say.
  it("treats a blank parent sentence as no hold at all", () => {
    expect(block({ parentBlockerText: "" })).toBeNull();
    expect(block({ parentBlockerText: "   " })).toBeNull();
  });

  it("counts the open required evidence in its sentence", () => {
    expect(block({ requiredEvidenceGapCount: 1 })).toEqual({
      key: "required_evidence_open",
      actionLabel: "Final build blocked by required evidence",
      statusLine:
        "1 required evidence item must be covered before final build.",
    });
    expect(block({ requiredEvidenceGapCount: 3 })?.statusLine).toBe(
      "3 required evidence items must be covered before final build.",
    );
  });

  // The defect this module exists for: the one hold whose state the control
  // styled as LIVE. A hold is a hold, whichever cause it is.
  it("holds the build for open required evidence with no other cause standing", () => {
    const held = block({ requiredEvidenceGapCount: 2 });
    expect(held).not.toBeNull();
    expect(held?.key).toBe("required_evidence_open");
  });

  // The label and the status sentence used to resolve these two in OPPOSITE
  // orders, so with both open the button and the line beside it prescribed
  // different work. The write path finalizes the capture before it enqueues
  // the build set, so the inputs are what refuses first.
  it("names the phase inputs before the required evidence when both are open", () => {
    const held = block({
      parentBlockerText: "Complete 7 phase inputs before Approve & Build.",
      requiredEvidenceGapCount: 4,
    });
    expect(held?.key).toBe("phase_inputs_incomplete");
    expect(held?.actionLabel).toBe("Complete phase inputs before build");
    expect(held?.statusLine).toBe(
      "Complete 7 phase inputs before Approve & Build.",
    );
  });

  it("names the in-flight hold ahead of every other cause", () => {
    expect(
      block({
        anyRunning: true,
        parentBlockerText: "Complete 7 phase inputs before Approve & Build.",
        requiredEvidenceGapCount: 4,
      })?.key,
    ).toBe("build_in_flight");
  });

  it("resolves each cause in the declared order", () => {
    expect([...PHASE_BUILD_BLOCK_ORDER]).toEqual([
      "build_in_flight",
      "phase_inputs_incomplete",
      "required_evidence_open",
    ]);
  });

  // Every declared cause must be reachable and must carry both sentences:
  // a cause with an empty label would style the control as held and say
  // nothing, which is the shape of the defect one slot over.
  it("gives every declared cause a label and a sentence", () => {
    const inputsPerKey: Record<
      (typeof PHASE_BUILD_BLOCK_ORDER)[number],
      Partial<PhaseBuildBlockInput>
    > = {
      build_in_flight: { anyRunning: true },
      phase_inputs_incomplete: { parentBlockerText: "Save your answers." },
      required_evidence_open: { requiredEvidenceGapCount: 1 },
    };
    for (const key of PHASE_BUILD_BLOCK_ORDER) {
      const held = block(inputsPerKey[key]);
      expect(held?.key).toBe(key);
      expect(held?.actionLabel.length).toBeGreaterThan(0);
      expect(held?.statusLine.length).toBeGreaterThan(0);
    }
  });

  // The two slots read the same value, so they can differ in wording but
  // never in which cause they are about.
  it("gives the label and the sentence distinct wording per cause", () => {
    for (const held of [
      block({ anyRunning: true }),
      block({ parentBlockerText: "Save your answers." }),
      block({ requiredEvidenceGapCount: 1 }),
    ]) {
      expect(held).not.toBeNull();
      expect(held?.actionLabel).not.toBe(held?.statusLine);
    }
  });
});
