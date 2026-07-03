import { buildMoveEvidenceNeedPackets } from "../move-evidence-need-packet";
import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";

function readiness(): DiscoveryEvidenceReadiness {
  return {
    archetypeLabel: "General",
    requiredTotal: 4,
    requiredCovered: 0,
    requiredMissing: 4,
    optionalCovered: 0,
    readinessScore: 0,
    readyForP3: false,
    families: [
      {
        familyId: "current_state_process",
        label: "Current-state process / operating documentation",
        required: true,
        status: "missing",
        evidenceIds: [],
        evidenceTitles: [],
      },
      {
        familyId: "kpi_baseline",
        label: "KPI baseline / outcome evidence",
        required: true,
        status: "missing",
        evidenceIds: [],
        evidenceTitles: [],
      },
    ],
    gapRegister: [
      {
        familyId: "current_state_process",
        label: "Current-state process / operating documentation",
        required: true,
        likelySource: "Process owner",
        format: "Doc",
        grounds: "Current-State Assessment",
        remediation: "Upload Doc from Process owner.",
      },
      {
        familyId: "kpi_baseline",
        label: "KPI baseline / outcome evidence",
        required: true,
        likelySource: "Finance / Analytics",
        format: "XLSX",
        grounds: "Value Model",
        remediation: "Upload XLSX from Finance / Analytics.",
      },
    ],
  };
}

describe("buildMoveEvidenceNeedPackets", () => {
  it("turns AP invoice readiness gaps into AP-specific client actions", () => {
    const packets = buildMoveEvidenceNeedPackets({
      moveId: "move-1",
      moveName: "Finance back-office invoice exception automation",
      currentPhase: 2,
      readiness: readiness(),
    });

    expect(packets).toHaveLength(2);
    expect(packets[0]?.nextAction).toMatch(/AP workflow notes/i);
    expect(
      packets[0]?.blockedArtifacts.map((artifact) => artifact.artifactType),
    ).toContain("discovery_report");
    expect(packets[0]?.canDraftBoundary.canDraft).toBe(false);
    expect(packets[0]?.canDraftBoundary.canDraftLabel).toMatch(
      /Final generation is blocked/i,
    );
    expect(packets[0]?.preliminaryGenerationCaveat).toMatch(
      /preliminary draft lane is not active/i,
    );
    expect(packets[1]?.exampleContent.join(" ")).toMatch(
      /duplicate payment rate/i,
    );
  });

  it("turns Kyriba treasury readiness gaps into treasury-specific client actions", () => {
    const packets = buildMoveEvidenceNeedPackets({
      moveId: "move-1",
      moveName: "Kyriba treasury rollout value realization",
      currentPhase: 0,
      readiness: readiness(),
    });

    expect(packets).toHaveLength(2);
    expect(packets[0]?.nextAction).toMatch(/bank connectivity plan/i);
    expect(packets[0]?.exampleContent.join(" ")).toMatch(/cash positioning/i);
    expect(packets[0]?.exampleContent.join(" ")).toMatch(/SOX evidence/i);
    expect(packets[1]?.exampleContent.join(" ")).toMatch(/forecast accuracy/i);
    expect(packets[1]?.exampleContent.join(" ")).not.toMatch(/duplicate payment rate/i);
  });

  it("keeps generic finance moves out of AP invoice language unless the move is AP/invoice-specific", () => {
    const packets = buildMoveEvidenceNeedPackets({
      moveId: "move-1",
      moveName: "Finance reporting evidence readiness",
      currentPhase: 2,
      readiness: readiness(),
    });

    expect(packets[0]?.nextAction).toMatch(/current-state process document/i);
    expect(packets[0]?.exampleContent.join(" ")).not.toMatch(/AP invoice/i);
    expect(packets[1]?.exampleContent.join(" ")).not.toMatch(/duplicate payment rate/i);
  });
});
