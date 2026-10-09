import { shouldOfferStageReadinessWorkbook } from "../stage-readiness-workbook-offer";
import { applyStageReadinessToEvidencePackets } from "../stage-readiness-workbooks/gate-readiness";
import { currentPhaseRequiredEvidenceGaps } from "../phase-progress-readiness";
import type { MoveEvidenceNeedPacket } from "../evidence-readiness/move-evidence-need-packet";

const LEGACY_SUBSTEP_KEYS_BY_PHASE: Record<number, readonly string[]> = {
  0: ["prepare", "decide", "approve"],
  1: ["prepare", "decide", "approve"],
  2: ["prepare", "current", "findings", "approve"],
  3: ["prepare", "options", "decide", "canvas", "approve"],
  4: ["prepare", "value", "workstreams", "approve"],
  5: ["prepare", "workstreams", "approve"],
};

/** The phases that have a P<n> -> P<n+1> workbook at all. */
const WORKBOOK_PHASES = [0, 1, 2, 3, 4] as const;

function offer(args: {
  phase: number;
  substepKey: string;
  captureFlowMounted: boolean;
  hasWorkbookTransition?: boolean;
}): boolean {
  return shouldOfferStageReadinessWorkbook({
    phase: args.phase,
    substepKey: args.substepKey,
    captureFlowMounted: args.captureFlowMounted,
    hasWorkbookTransition: args.hasWorkbookTransition ?? true,
  });
}

describe("shouldOfferStageReadinessWorkbook — the redesigned flow", () => {
  it("offers the workbook on EVERY step of every workbook phase when the 3-step flow is mounted", () => {
    // The defect this pins: the 3-step flow keeps its own step state and never
    // moves `substepIndex`, so a substep-keyed rule left P3 and P4 with no
    // workbook control for the whole phase.
    for (const phase of WORKBOOK_PHASES) {
      for (const substepKey of LEGACY_SUBSTEP_KEYS_BY_PHASE[phase]) {
        expect(
          offer({ phase, substepKey, captureFlowMounted: true }),
        ).toBe(true);
      }
    }
  });

  it("offers it on P3 and P4 at the first substep — the value an ordinary visit actually has", () => {
    expect(offer({ phase: 3, substepKey: "prepare", captureFlowMounted: true })).toBe(
      true,
    );
    expect(offer({ phase: 4, substepKey: "prepare", captureFlowMounted: true })).toBe(
      true,
    );
  });

  it("still withholds it where there is no workbook transition, flow or not", () => {
    for (const captureFlowMounted of [true, false]) {
      expect(
        offer({
          phase: 5,
          substepKey: "approve",
          captureFlowMounted,
          hasWorkbookTransition: false,
        }),
      ).toBe(false);
    }
  });
});

describe("shouldOfferStageReadinessWorkbook — the legacy canvas is unchanged", () => {
  it("defers P3 and P4 to the final Approve & Build substep", () => {
    for (const phase of [3, 4]) {
      for (const substepKey of LEGACY_SUBSTEP_KEYS_BY_PHASE[phase]) {
        expect(offer({ phase, substepKey, captureFlowMounted: false })).toBe(
          substepKey === "approve",
        );
      }
    }
  });

  it("offers it throughout P0, P1 and P2", () => {
    for (const phase of [0, 1, 2]) {
      for (const substepKey of LEGACY_SUBSTEP_KEYS_BY_PHASE[phase]) {
        expect(offer({ phase, substepKey, captureFlowMounted: false })).toBe(true);
      }
    }
  });
});

describe("why the control may not be withheld: the gate counts the missing workbook", () => {
  function requiredFamilyPacket(phase: number): MoveEvidenceNeedPacket {
    return {
      moveId: "move-1",
      phase,
      artifactType: "discovery_report",
      evidenceSlot: "Current-state process",
      familyId: "current_state_process",
      priority: "required",
      ownerSource: "Client owner",
      acceptedFormats: ["DOCX"],
      exampleTemplate: "Process record",
      exampleContent: ["Walkthrough note"],
      whyItMatters: "Needed for a final-quality discovery report.",
      guidanceBasis: "generic",
      blockedArtifacts: [],
      canDraftBoundary: {
        canDraft: true,
        canDraftLabel: "Can draft with current evidence.",
        cannotDraftLabel: "No current block from this evidence slot.",
      },
      preliminaryGenerationCaveat: null,
      waiverOption: null,
      nextAction: "Nothing open.",
      // Fully approved: the family itself is not what holds the phase.
      status: "covered",
      evidenceIds: ["ev-1"],
      evidenceTitles: ["Process walkthrough"],
    };
  }

  it.each([3, 4])(
    "P%s with every evidence family covered still reports one required gap when no workbook review exists",
    (phase) => {
      const packets = applyStageReadinessToEvidencePackets(
        [requiredFamilyPacket(phase)],
        phase,
        null,
        "move-1",
      );
      const gaps = currentPhaseRequiredEvidenceGaps(packets, phase);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].familyId).toBe(`stage_readiness_p${phase}_p${phase + 1}`);
      // And the offer decision must therefore be true on that phase's first
      // step under the flow, or the gap has no producer on screen.
      expect(
        offer({ phase, substepKey: "prepare", captureFlowMounted: true }),
      ).toBe(true);
    },
  );
});

/**
 * The gate reads the stored review AS IT STANDS.
 *
 * It used to read only a FINISHED review (`loadAcceptedStageReadinessContext`
 * returns null unless every proposal is decided), and a null there means the
 * gate sees no workbook at all. Two things followed, both against the gate's
 * own required-only contract in `assessStageReadinessGate`:
 *
 * - One undecided RECOMMENDED response held the phase shut with nothing able
 *   to clear it. A blank response is not reviewable from the review surface at
 *   all, and a recommended question is optional, so an empty optional cell was
 *   a permanent `pending`.
 * - A workbook reviewed down to one held REQUIRED response was reported as a
 *   workbook nobody had reviewed, naming no held response.
 */
describe("the gate's reading of a partly reviewed workbook", () => {
  function familyPacket(
    phase: number,
    overrides: Partial<MoveEvidenceNeedPacket> = {},
  ): MoveEvidenceNeedPacket {
    return {
      moveId: "move-1",
      phase,
      artifactType: "discovery_report",
      evidenceSlot: "Current-state process",
      familyId: "current_state_process",
      priority: "required",
      ownerSource: "Client owner",
      acceptedFormats: ["DOCX"],
      exampleTemplate: "Process record",
      exampleContent: ["Walkthrough note"],
      whyItMatters: "Needed for a final-quality discovery report.",
      guidanceBasis: "generic",
      blockedArtifacts: [],
      canDraftBoundary: {
        canDraft: true,
        canDraftLabel: "Can draft with current evidence.",
        cannotDraftLabel: "No current block from this evidence slot.",
      },
      preliminaryGenerationCaveat: null,
      waiverOption: null,
      nextAction: "Nothing open.",
      status: "covered",
      evidenceIds: ["ev-1"],
      evidenceTitles: ["Process walkthrough"],
      ...overrides,
    };
  }

  /** Accepted, answered, sourced, and linked to the family's approved file. */
  const requiredAnswered = {
    questionId: "q_current_state",
    dimensionId: "current_state_process",
    requirement: "required" as const,
    answerState: "answered" as const,
    disposition: "accepted" as const,
    evidenceOrSource: "Process walkthrough",
  };

  /** Optional, left empty, and therefore undecidable from the review surface. */
  const recommendedBlank = {
    questionId: "q_optional_context",
    dimensionId: "nice_to_have_context",
    requirement: "recommended" as const,
    answerState: "blank" as const,
    disposition: "pending" as const,
    evidenceOrSource: "",
  };

  function gapsFor(
    phase: number,
    proposals: Parameters<typeof applyStageReadinessToEvidencePackets>[2],
  ) {
    return currentPhaseRequiredEvidenceGaps(
      applyStageReadinessToEvidencePackets(
        [familyPacket(phase)],
        phase,
        proposals,
        "move-1",
      ),
      phase,
    );
  }

  it.each([2, 3, 4])(
    "P%s closes once every REQUIRED response is accepted, even with an optional one left blank",
    (phase) => {
      // The dead end: this exact review used to read as no workbook, because
      // one optional cell was empty and no control could decide it.
      expect(gapsFor(phase, null)).toHaveLength(1);

      expect(gapsFor(phase, [requiredAnswered, recommendedBlank])).toEqual([]);
    },
  );

  it("P1 closes on the required responses alone, as its own next action has always said", () => {
    const withRecommendedOpen = applyStageReadinessToEvidencePackets(
      [familyPacket(1)],
      1,
      [requiredAnswered, recommendedBlank],
      "move-1",
    );
    expect(
      withRecommendedOpen.some(
        (packet) => packet.familyId === "stage_readiness_p1_p2",
      ),
    ).toBe(false);

    // A required response still not accepted keeps the Charter phase open.
    const requiredHeld = applyStageReadinessToEvidencePackets(
      [familyPacket(1)],
      1,
      [{ ...requiredAnswered, disposition: "rejected" }, recommendedBlank],
      "move-1",
    );
    expect(
      requiredHeld.some(
        (packet) => packet.familyId === "stage_readiness_p1_p2",
      ),
    ).toBe(true);
  });

  it.each([
    ["rejected", /review and accept each required/i],
    ["pending", /review and accept each required/i],
    ["needs_validation", /review and accept each required/i],
  ] as const)(
    "names the family holding the phase when its required response is %s",
    (disposition, expectedAction) => {
      const gaps = gapsFor(3, [
        { ...requiredAnswered, disposition },
        // A second decided response, so the review is not a fresh upload.
        {
          ...requiredAnswered,
          questionId: "q_other",
          dimensionId: "other_family",
        },
      ]);

      expect(gaps).toHaveLength(1);
      // The family, NOT the "complete the workbook" packet: the workbook was
      // completed, and one named response is what is holding the phase.
      expect(gaps[0].familyId).toBe("current_state_process");
      expect(gaps[0].nextAction).toMatch(expectedAction);
      expect(gaps[0].nextAction).not.toMatch(/complete the p3 to p4 readiness/i);
    },
  );

  it("still reports an uploaded-but-undecided review once, as one missing workbook", () => {
    // Every required response pending is a workbook nobody has reviewed, and
    // reporting that per family is what told a Move with every family approved
    // that every family was open.
    const gaps = gapsFor(3, [
      { ...requiredAnswered, disposition: "pending" },
      {
        ...requiredAnswered,
        questionId: "q_other",
        dimensionId: "other_family",
        disposition: "pending",
      },
      recommendedBlank,
    ]);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].familyId).toBe("stage_readiness_p3_p4");
    expect(gaps[0].nextAction).toMatch(/complete the p3 to p4 readiness/i);
  });

  it("counts a review whose every decision was a rejection as reviewed", () => {
    // A reviewer who rejected everything HAS reviewed the workbook. Reading
    // "reviewed" as "something was accepted" would put this review back on the
    // wholly-unreviewed text, which is the misreading this change removes.
    const gaps = gapsFor(3, [
      { ...requiredAnswered, disposition: "rejected" },
      {
        ...requiredAnswered,
        questionId: "q_other",
        dimensionId: "other_family",
        disposition: "rejected",
      },
    ]);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].familyId).toBe("current_state_process");
    expect(gaps[0].nextAction).toMatch(/review and accept each required/i);
  });

  it("keeps the per-answer refusals a supplied review already earned", () => {
    // Accepted but unresolved, and accepted but unsourced, still hold the
    // family — supplying the review does not relax either.
    expect(
      gapsFor(3, [
        { ...requiredAnswered, answerState: "unknown" },
        { ...requiredAnswered, questionId: "q_other", dimensionId: "other" },
      ])[0]?.nextAction,
    ).toMatch(/replace unknown or insufficient responses/i);

    expect(
      gapsFor(3, [
        { ...requiredAnswered, evidenceOrSource: "  " },
        { ...requiredAnswered, questionId: "q_other", dimensionId: "other" },
      ])[0]?.nextAction,
    ).toMatch(/name the approved source file/i);

    // Accepted, answered and sourced, but the named source is not an approved
    // file in this family.
    expect(
      gapsFor(3, [
        { ...requiredAnswered, evidenceOrSource: "A file nobody uploaded" },
        { ...requiredAnswered, questionId: "q_other", dimensionId: "other" },
      ])[0]?.nextAction,
    ).toMatch(/link each required response/i);
  });
});
