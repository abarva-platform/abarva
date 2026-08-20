import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { buildStageReadinessWorkbookSpec } from "../resolver";

const readiness: DiscoveryEvidenceReadiness = {
  blueprintId: "test_blueprint",
  blueprintVersion: "2026-08-20",
  archetypeLabel: "Regulated Agent Assist",
  requiredTotal: 2,
  requiredCovered: 1,
  requiredMissing: 1,
  optionalCovered: 0,
  readinessScore: 50,
  readyForP3: false,
  families: [
    {
      familyId: "current_state_workflow_map",
      label: "Current-state workflow map",
      required: true,
      status: "covered",
      evidenceIds: ["ev_workflow"],
      evidenceTitles: ["Approved workflow notes"],
    },
    {
      familyId: "phi_privacy_security_controls",
      label: "PHI, privacy, security, and audit controls",
      required: true,
      status: "missing",
      evidenceIds: [],
      evidenceTitles: [],
    },
    {
      familyId: "change_adoption_owner",
      label: "Operational change and adoption owner",
      required: false,
      status: "missing",
      evidenceIds: [],
      evidenceTitles: [],
    },
  ],
  gapRegister: [
    {
      familyId: "phi_privacy_security_controls",
      label: "PHI, privacy, security, and audit controls",
      required: true,
      likelySource: "Security / Privacy / Compliance",
      format: "Controls matrix",
      grounds: "Risk Controls",
      remediation:
        "Upload Controls matrix from Security / Privacy / Compliance.",
    },
  ],
};

describe("buildStageReadinessWorkbookSpec", () => {
  it("builds a tailored deterministic workbook spec from readiness packets", () => {
    const packets = buildMoveEvidenceNeedPackets({
      moveId: "move-1",
      moveName: "Member Service Agent Assist",
      currentPhase: 1,
      readiness,
    });
    const spec = buildStageReadinessWorkbookSpec({
      moveId: "move-1",
      moveName: "Member Service Agent Assist",
      phase: 1,
      nextPhase: 2,
      archetype: readiness.archetypeLabel,
      readiness,
      evidenceNeedPackets: packets,
      generatedAt: "2026-08-20T00:00:00.000Z",
    });

    expect(spec.artifactName).toBe(
      "Discovery Workbook — Member Service Agent Assist",
    );
    expect(spec.startHere.alreadyPrefilled).toBe(1);
    expect(spec.startHere.needsInput).toBe(2);
    expect(spec.dimensionPlan.dimensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimensionId: "phi_privacy_security_controls",
          requirement: "required",
          status: "insufficient_evidence",
          evidenceSourceClass: "evidence_gap",
        }),
        expect.objectContaining({
          dimensionId: "current_state_workflow_map",
          status: "prefilled_confirmed",
          evidenceSourceClass: "client_fact",
        }),
      ]),
    );
    expect(spec.tabs.map((tab) => tab.title)).toEqual(
      expect.arrayContaining([
        "Business & Process",
        "Risk, Security & Controls",
        "People & Change",
      ]),
    );
    expect(spec.evidenceAndOpenItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimensionId: "phi_privacy_security_controls",
          blocksNextPhase: true,
        }),
      ]),
    );
    expect(spec.metadata.workbookContentHash).toHaveLength(24);
  });

  it("does not ask covered evidence families as blank questions", () => {
    const packets = buildMoveEvidenceNeedPackets({
      moveId: "move-1",
      moveName: "Member Service Agent Assist",
      currentPhase: 1,
      readiness,
    });
    const spec = buildStageReadinessWorkbookSpec({
      moveId: "move-1",
      moveName: "Member Service Agent Assist",
      phase: 1,
      nextPhase: 2,
      archetype: readiness.archetypeLabel,
      readiness,
      evidenceNeedPackets: packets,
      generatedAt: "2026-08-20T00:00:00.000Z",
    });
    const workflowQuestion = spec.tabs
      .flatMap((tab) => tab.questions)
      .find(
        (question) => question.dimensionId === "current_state_workflow_map",
      );

    expect(workflowQuestion).toMatchObject({
      state: "prefilled_confirmed",
      prefilledResponse: "Available evidence: Approved workflow notes",
      evidenceRefs: ["ev_workflow"],
    });
  });
});
