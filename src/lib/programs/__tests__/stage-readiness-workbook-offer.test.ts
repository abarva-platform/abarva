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
