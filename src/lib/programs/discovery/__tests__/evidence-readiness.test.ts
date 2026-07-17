import {
  evaluateDiscoveryEvidenceReadiness,
  mapEvidenceToDiscoveryFamily,
  type DiscoveryEvidenceReadinessItem,
} from "../evidence-readiness";
import { getDiscoveryBlueprint } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

const blueprint = getDiscoveryBlueprint("AI_OPERATIONS_DECISION_SUPPORT");

function item(
  id: string,
  title: string,
  summary: string,
  evidenceType = "uploaded_artifact",
): DiscoveryEvidenceReadinessItem {
  return {
    id,
    title,
    summary,
    evidenceType,
    phase: 2,
    confidence: 0.8,
    createdAt: "2026-06-12T12:00:00.000Z",
  };
}

describe("discovery evidence readiness", () => {
  it("maps uploads to discovery evidence families", () => {
    expect(
      mapEvidenceToDiscoveryFamily(
        item(
          "ev_1",
          "Data analytics estate",
          "Databricks, CDP profile, batch and real-time data path assessment.",
          "architecture_inventory",
        ),
        blueprint,
      ),
    ).toBe("data_analytics_estate");
    expect(
      mapEvidenceToDiscoveryFamily(
        item(
          "ev_2",
          "Contact center analytics",
          "AHT, call spike, deflectable intent, and CCaaS evidence.",
          "baseline_evidence",
        ),
        blueprint,
      ),
    ).toBe("contact_center_analytics");
  });

  it("builds a gap register for missing required families", () => {
    const readiness = evaluateDiscoveryEvidenceReadiness({
      blueprint,
      evidenceItems: [
        item(
          "ev_1",
          "Disruption ops data",
          "IROP disruption volume, cause, recovery time, and channel mix.",
          "baseline_evidence",
        ),
        item(
          "ev_2",
          "IT systems landscape",
          "System inventory and integration path from enterprise architecture.",
          "architecture_inventory",
        ),
      ],
    });

    expect(readiness.requiredCovered).toBe(2);
    expect(readiness.requiredMissing).toBeGreaterThan(0);
    expect(readiness.readyForP3).toBe(false);
    expect(readiness.gapRegister).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          familyId: "data_analytics_estate",
          required: true,
          remediation: expect.stringContaining("Upload"),
        }),
      ]),
    );
  });

  it("marks readiness green when all required families are covered", () => {
    const evidenceItems = blueprint.evidenceFamilies
      .filter((family) => family.required)
      .map((family, index) =>
        item(
          `ev_${index}`,
          family.label,
          `${family.label} ${family.id.replace(/_/g, " ")} from ${family.likelySource}.`,
        ),
      );
    const readiness = evaluateDiscoveryEvidenceReadiness({
      blueprint,
      evidenceItems,
    });

    expect(readiness.requiredMissing).toBe(0);
    expect(readiness.readyForP3).toBe(true);
    expect(readiness.readinessScore).toBe(100);
  });

  it("uses a healthcare Agent Assist blueprint instead of generic AI operations", () => {
    const agentAssistBlueprint = getDiscoveryBlueprint(
      "Meridian member service contact center agent assist across claims, eligibility, benefits, CRM, and prior authorization",
    );

    expect(agentAssistBlueprint.blueprintId).toBe(
      "healthcare_contact_center_agent_assist",
    );
    expect(agentAssistBlueprint.evidenceFamilies.map((family) => family.id)).toEqual(
      expect.arrayContaining([
        "current_state_workflow_map",
        "contact_center_kpis",
        "crm_contact_center_system_map",
        "claims_eligibility_benefits_data_access",
        "knowledge_base_ownership_freshness",
        "phi_privacy_security_controls",
        "human_in_loop_model",
        "finance_baseline_value_plan",
      ]),
    );

    expect(
      mapEvidenceToDiscoveryFamily(
        item(
          "ev_health_1",
          "Call center metrics baseline",
          "Average handle time, after-call work, first-call resolution, transfer rate, repeat contact, abandonment, and agent occupancy.",
          "baseline_evidence",
        ),
        agentAssistBlueprint,
      ),
    ).toBe("contact_center_kpis");
  });
});
