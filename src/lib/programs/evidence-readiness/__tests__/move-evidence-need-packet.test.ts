import { buildMoveEvidenceNeedPackets } from "../move-evidence-need-packet";
import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";

function readiness(): DiscoveryEvidenceReadiness {
  return {
    blueprintId: "general_default",
    blueprintVersion: "2026-07-17",
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

  it("turns Contact Center Agent Assist readiness gaps into member-service-specific client actions", () => {
    const contactCenterReadiness: DiscoveryEvidenceReadiness = {
      blueprintId: "healthcare_contact_center_agent_assist",
      blueprintVersion: "2026-07-17",
      archetypeLabel: "Healthcare Contact Center Agent Assist",
      requiredTotal: 2,
      requiredCovered: 0,
      requiredMissing: 2,
      optionalCovered: 0,
      readinessScore: 0,
      readyForP3: false,
      families: [
        {
          familyId: "contact_center_kpis",
          label: "Contact center baseline KPIs",
          required: true,
          status: "missing",
          evidenceIds: [],
          evidenceTitles: [],
        },
        {
          familyId: "call_recording_transcript_availability",
          label: "Call transcript/recording availability",
          required: true,
          status: "missing",
          evidenceIds: [],
          evidenceTitles: [],
        },
      ],
      gapRegister: [
        {
          familyId: "contact_center_kpis",
          label: "Contact center baseline KPIs",
          required: true,
          likelySource: "Operations Analytics / CCaaS reporting",
          format: "CSV/XLSX",
          grounds: "Value Hypothesis · Business Case · Tower Metrics",
          remediation: "Upload CSV/XLSX from Operations Analytics / CCaaS reporting.",
        },
        {
          familyId: "call_recording_transcript_availability",
          label: "Call transcript/recording availability",
          required: true,
          likelySource: "CCaaS / Speech Analytics / Compliance",
          format: "Retention policy + sample inventory",
          grounds: "Intent Taxonomy · Training/Evaluation Data · Compliance",
          remediation: "Upload retention policy + sample inventory from CCaaS / Speech Analytics / Compliance.",
        },
      ],
    };

    const packets = buildMoveEvidenceNeedPackets({
      moveId: "move-1",
      moveName: "Meridian Member Service Agent Assist",
      currentPhase: 2,
      readiness: contactCenterReadiness,
    });

    expect(packets).toHaveLength(2);
    // Real, specific guidance -- not the generic "Evidence packet" fallback.
    expect(packets[0]?.exampleTemplate).toBe("Contact center baseline KPIs");
    expect(packets[0]?.exampleContent.join(" ")).toMatch(/AHT, FCR, transfer rate/i);
    expect(packets[0]?.nextAction).toMatch(/CCaaS\/operations analytics/i);
    expect(
      packets[0]?.blockedArtifacts.map((artifact) => artifact.artifactType),
    ).toContain("business_case");
    expect(packets[1]?.exampleTemplate).toBe(
      "Call transcript/recording availability",
    );
    expect(packets[1]?.exampleContent.join(" ")).toMatch(/redacted call transcripts/i);
    // Never DORA/ITSM/engineering-delivery language for this archetype.
    expect(packets[0]?.exampleContent.join(" ")).not.toMatch(/DORA|CI\/CD|sprint/i);
    expect(packets[1]?.exampleContent.join(" ")).not.toMatch(/DORA|CI\/CD|sprint/i);
  });
});
