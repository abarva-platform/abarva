import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { currentPhaseRequiredEvidenceGaps } from "@/lib/programs/phase-progress-readiness";
import {
  applyStageReadinessToEvidencePackets,
  assessStageReadinessGate,
  type StageReadinessGateProposal,
} from "../gate-readiness";

function packet(overrides: Partial<MoveEvidenceNeedPacket> = {}): MoveEvidenceNeedPacket {
  return {
    moveId: "move-1",
    phase: 2,
    artifactType: "discovery_report",
    evidenceSlot: "Contact center KPI baseline",
    familyId: "contact_center_kpis",
    priority: "required",
    ownerSource: "Operations and Finance",
    acceptedFormats: ["CSV", "XLSX"],
    exampleTemplate: "KPI baseline",
    exampleContent: ["Metric, period, population, source"],
    whyItMatters: "The discovery report needs evidence-backed baseline facts.",
    guidanceBasis: "generic",
    blockedArtifacts: [
      {
        artifactType: "discovery_report",
        title: "Discovery Report",
        phase: 3,
        reason: "Required evidence",
      },
    ],
    canDraftBoundary: {
      canDraft: true,
      canDraftLabel: "Can draft",
      cannotDraftLabel: "Do not claim unsupported facts",
    },
    preliminaryGenerationCaveat: null,
    waiverOption: null,
    nextAction: "Review the approved baseline file.",
    status: "covered",
    evidenceTitles: ["contact-center-kpis.csv"],
    ...overrides,
  };
}

function proposal(
  overrides: Partial<StageReadinessGateProposal> = {},
): StageReadinessGateProposal {
  return {
    questionId: "q_kpis_baseline",
    dimensionId: "contact_center_kpis",
    requirement: "required",
    answerState: "answered",
    disposition: "accepted",
    evidenceOrSource: "contact-center-kpis.csv",
    ...overrides,
  };
}

describe("stage readiness gate", () => {
  it("does not treat a mapped approved file as sufficient when the workbook says unknown", () => {
    const packets = [packet()];
    const adjusted = applyStageReadinessToEvidencePackets(
      packets,
      2,
      [proposal({ answerState: "unknown", evidenceOrSource: "" })],
    );

    expect(packets[0]?.status).toBe("covered");
    expect(adjusted[0]?.status).toBe("partial");
    expect(adjusted[0]?.nextAction).toMatch(/evidence-backed answer/i);
  });

  it("requires every required response to be accepted, answered, and sourced", () => {
    expect(
      assessStageReadinessGate([
        proposal(),
        proposal({ questionId: "q_kpis_period", evidenceOrSource: " " }),
      ]),
    ).toMatchObject({
      ready: false,
      requiredCount: 2,
      readyCount: 1,
      blockers: [
        expect.objectContaining({ reason: "source_not_named" }),
      ],
    });
  });

  it("fails closed when the current transition workbook has no accepted review", () => {
    const adjusted = applyStageReadinessToEvidencePackets([packet()], 2, null);

    expect(adjusted[0]?.status).toBe("partial");
    expect(adjusted[0]?.nextAction).toMatch(/readiness workbook/i);
  });

  it("keeps P1 discovery-onramp gaps out of the P1 gate", () => {
    const packets = [packet({ phase: 2 })];
    const adjusted = applyStageReadinessToEvidencePackets(
      packets,
      1,
      [proposal({ answerState: "unknown", evidenceOrSource: "" })],
    );

    expect(currentPhaseRequiredEvidenceGaps(adjusted, 1)).toEqual([]);
  });

  it("blocks P1 close until every required workbook response is reviewed", () => {
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet({ phase: 2 })],
      1,
      [proposal({ disposition: "pending" })],
      "move-1",
    );
    expect(adjusted).toHaveLength(2);
    expect(adjusted.at(-1)).toMatchObject({
      phase: 1,
      status: "missing",
      evidenceSlot: "P1 to P2 readiness workbook",
    });
    expect(currentPhaseRequiredEvidenceGaps(adjusted, 1)).toHaveLength(1);
  });

  it("does not let rejection of a required P1 response close the phase", () => {
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet({ phase: 2 })],
      1,
      [proposal({ disposition: "rejected" })],
      "move-1",
    );

    expect(adjusted.at(-1)).toMatchObject({
      phase: 1,
      status: "missing",
      evidenceSlot: "P1 to P2 readiness workbook",
    });
    expect(currentPhaseRequiredEvidenceGaps(adjusted, 1)).toHaveLength(1);
  });

  it("keeps covered evidence covered when the required workbook response is sourced", () => {
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet()],
      2,
      [proposal()],
    );
    expect(adjusted[0]?.status).toBe("covered");
  });

  it("fails closed when a phase has no configured evidence packets", () => {
    const adjusted = applyStageReadinessToEvidencePackets([], 3, null, "move-1");
    expect(adjusted).toHaveLength(1);
    expect(adjusted[0]).toMatchObject({
      moveId: "move-1",
      phase: 3,
      status: "missing",
      priority: "required",
    });
  });

  it("does not accept a named source unless it resolves to an approved file in that family", () => {
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet()],
      2,
      [proposal({ evidenceOrSource: "Operations said this is true" })],
    );
    expect(adjusted[0]?.status).toBe("partial");
    expect(adjusted[0]?.nextAction).toMatch(/approved uploaded evidence item/i);
  });
});
