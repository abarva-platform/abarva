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
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet()],
      2,
      null,
      "move-1",
    );

    // Still closed, and closed on the artifact that would open it — reported
    // the way the P1 branch below reports the same condition.
    expect(currentPhaseRequiredEvidenceGaps(adjusted, 2)).toHaveLength(1);
    expect(adjusted.at(-1)).toMatchObject({
      phase: 2,
      status: "missing",
      familyId: "stage_readiness_p2_p3",
      evidenceSlot: "P2 to P3 readiness workbook",
    });
    expect(adjusted[0]?.nextAction).toMatch(/readiness workbook/i);
  });

  it("counts an unreviewed transition workbook once, not once per approved family", () => {
    const families = [
      "data_governance_ownership",
      "semantic_layer_certification",
      "data_lineage_audit_trail",
      "data_quality_rules",
      "source_system_data_access",
      "platform_architecture_readiness",
      "master_identity_resolution",
      "privacy_security_controls",
      "model_risk_responsible_ai_controls",
      "measurement_owner_cadence",
      "finance_baseline_value_plan",
    ];
    const packets = families.map((familyId) =>
      packet({ familyId, status: "covered", evidenceIds: [`ev-${familyId}`] }),
    );

    const adjusted = applyStageReadinessToEvidencePackets(
      packets,
      2,
      null,
      "move-1",
    );
    const gaps = currentPhaseRequiredEvidenceGaps(adjusted, 2);

    // Eleven of eleven families approved and present; the only open item is the
    // review. Reporting a gap per family told the Move that eleven evidence
    // items were still open and never named the workbook.
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.familyId).toBe("stage_readiness_p2_p3");
    expect(
      adjusted.filter((entry) => families.includes(entry.familyId)),
    ).toHaveLength(11);
    for (const entry of adjusted.filter((e) => families.includes(e.familyId))) {
      expect(entry.status).toBe("covered");
    }
  });

  it("treats a workbook with nothing required as an absent review, not a family gap", () => {
    // `proposals` is non-null here, so the condition cannot be "no workbook
    // was loaded": what matters is that the transition has no REQUIRED review
    // to satisfy, which is the same absence from the gate's point of view.
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet()],
      2,
      [proposal({ requirement: "recommended" })],
      "move-1",
    );

    expect(adjusted.at(-1)).toMatchObject({
      familyId: "stage_readiness_p2_p3",
      status: "missing",
    });
    expect(adjusted[0]?.status).toBe("covered");
    expect(currentPhaseRequiredEvidenceGaps(adjusted, 2)).toHaveLength(1);
  });

  it("still refuses to draft from evidence whose transition review is absent", () => {
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet()],
      2,
      null,
      "move-1",
    );

    // Leaving the status alone must not let anything be drafted from it.
    expect(adjusted[0]).toMatchObject({
      status: "covered",
      canDraftBoundary: expect.objectContaining({ canDraft: false }),
    });
    expect(adjusted[0]?.preliminaryGenerationCaveat).toMatch(
      /P2 to P3 readiness review is incomplete/,
    );
  });

  it("keeps a family gap per family once the workbook has been reviewed at all", () => {
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet({ familyId: "unreviewed_family" })],
      2,
      [proposal()],
      "move-1",
    );

    // The workbook exists; this family simply has no answer in it. That is this
    // family's gap, not a missing workbook, so no workbook packet is appended.
    expect(
      adjusted.some((entry) => entry.familyId.startsWith("stage_readiness_")),
    ).toBe(false);
    expect(adjusted[0]?.status).toBe("partial");
    expect(currentPhaseRequiredEvidenceGaps(adjusted, 2)).toHaveLength(1);
  });

  it("opens the phase when the reviewed workbook answers the family", () => {
    const adjusted = applyStageReadinessToEvidencePackets(
      [packet()],
      2,
      [proposal()],
      "move-1",
    );

    expect(
      adjusted.some((entry) => entry.familyId.startsWith("stage_readiness_")),
    ).toBe(false);
    expect(adjusted[0]?.status).toBe("covered");
    expect(currentPhaseRequiredEvidenceGaps(adjusted, 2)).toEqual([]);
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

  describe("a reviewed workbook that does not cover a currently-required family", () => {
    // The workbook's questions are built from the family set at DOWNLOAD time;
    // the gate re-derives required families at EVALUATION time. A declaration
    // landing between the two changes the set, and nothing version-stamps it.

    it("does not tell the reviewer to complete a workbook that has no question for the family", () => {
      const adjusted = applyStageReadinessToEvidencePackets(
        [
          packet(),
          packet({ familyId: "provider_directory", evidenceSlot: "Provider directory baseline" }),
        ],
        2,
        [proposal()],
        "move-1",
      );

      const uncovered = adjusted.find((p) => p.familyId === "provider_directory");
      expect(uncovered?.nextAction).toMatch(/download the current workbook/i);
      expect(uncovered?.nextAction).toContain("Provider directory baseline");
      // Completing, re-reviewing, or accepting every response in the reviewed
      // workbook cannot clear this family, so it must not be the instruction.
      expect(uncovered?.nextAction).not.toMatch(
        /^Complete the P2 to P3 readiness workbook/i,
      );
      expect(uncovered?.canDraftBoundary.canDraft).toBe(false);
    });

    it("leaves a family the review does cover judged on its own merits", () => {
      const adjusted = applyStageReadinessToEvidencePackets(
        [
          packet(),
          packet({ familyId: "provider_directory", evidenceSlot: "Provider directory baseline" }),
        ],
        2,
        [proposal()],
        "move-1",
      );

      const covered = adjusted.find((p) => p.familyId === "contact_center_kpis");
      expect(covered?.status).toBe("covered");
      expect(covered?.canDraftBoundary.canDraft).toBe(true);
      expect(covered?.nextAction).not.toMatch(/download the current workbook/i);
    });

    it("still reports a wholly unreviewed workbook as one missing workbook", () => {
      const adjusted = applyStageReadinessToEvidencePackets(
        [packet()],
        2,
        [proposal({ disposition: "pending" })],
        "move-1",
      );

      const workbook = adjusted.find(
        (p) => p.familyId === "stage_readiness_p2_p3",
      );
      expect(workbook).toBeDefined();
      expect(workbook?.nextAction).toMatch(
        /^Complete the P2 to P3 readiness workbook/i,
      );
      expect(workbook?.nextAction).not.toMatch(/download the current workbook/i);
    });

    it("keeps the Charter phase open when a required family was never asked about", () => {
      const packets = [
        packet({ phase: 2 }),
        packet({
          phase: 2,
          familyId: "provider_directory",
          evidenceSlot: "Provider directory baseline",
        }),
      ];
      const adjusted = applyStageReadinessToEvidencePackets(
        packets,
        1,
        [proposal()],
        "move-1",
      );

      // Every required response in the review on file is accepted, so the
      // review is complete on its own terms and used to close P1 regardless.
      const workbook = adjusted.find(
        (p) => p.familyId === "stage_readiness_p1_p2",
      );
      expect(workbook).toBeDefined();
      expect(workbook?.nextAction).toContain("Provider directory baseline");
      expect(workbook?.nextAction).toMatch(/download the current workbook/i);
    });

    it("closes the Charter review when every required family is covered and accepted", () => {
      const packets = [
        packet({ phase: 2 }),
        packet({
          phase: 2,
          familyId: "provider_directory",
          evidenceSlot: "Provider directory baseline",
        }),
      ];
      const adjusted = applyStageReadinessToEvidencePackets(
        packets,
        1,
        [proposal(), proposal({ dimensionId: "provider_directory", questionId: "q_pd" })],
        "move-1",
      );

      expect(adjusted).toHaveLength(packets.length);
      expect(
        adjusted.some((p) => p.familyId === "stage_readiness_p1_p2"),
      ).toBe(false);
    });

    it("does not demand a workbook question for a family that is not required", () => {
      // Only REQUIRED families need a required response. Demanding one for an
      // optional family would hold every Charter phase shut, since the workbook
      // asks nothing required about them by declaration.
      const packets = [
        packet({ phase: 2 }),
        packet({
          phase: 2,
          familyId: "nice_to_have",
          evidenceSlot: "Nice to have",
          priority: "optional",
        }),
      ];
      const adjusted = applyStageReadinessToEvidencePackets(
        packets,
        1,
        [proposal()],
        "move-1",
      );

      expect(adjusted).toHaveLength(packets.length);
    });

    it("still reports an unaccepted Charter response as a held review, not a stale workbook", () => {
      const adjusted = applyStageReadinessToEvidencePackets(
        [packet({ phase: 2 })],
        1,
        [proposal({ disposition: "needs_validation" })],
        "move-1",
      );

      const workbook = adjusted.find(
        (p) => p.familyId === "stage_readiness_p1_p2",
      );
      expect(workbook?.nextAction).toMatch(
        /^Review all required P1 to P2 workbook responses/i,
      );
      expect(workbook?.nextAction).not.toMatch(/download the current workbook/i);
    });
  });
});
