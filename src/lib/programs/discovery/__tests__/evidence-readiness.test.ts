import {
  buildDiscoveryBlueprintInputFromProgram,
  declaredDiscoveryFamilies,
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
    expect(
      agentAssistBlueprint.evidenceFamilies.map((family) => family.id),
    ).toEqual(
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

  it("keeps healthcare member-service context authoritative when stale lending tokens are present", () => {
    const mixedBlueprint = getDiscoveryBlueprint(
      [
        "COMMERCIAL_LENDING_AGENT_ASSIST",
        "Integrated health plan synthetic evidence E2E",
        "Healthcare IDN member service contact center agent assist",
        "claims, benefits, eligibility, CRM, prior authorization, PHI controls",
      ].join(" "),
    );

    expect(mixedBlueprint.blueprintId).toBe(
      "healthcare_contact_center_agent_assist",
    );
    expect(mixedBlueprint.evidenceFamilies.map((family) => family.id)).toEqual(
      expect.arrayContaining([
        "current_state_workflow_map",
        "contact_center_kpis",
        "crm_contact_center_system_map",
        "claims_eligibility_benefits_data_access",
        "phi_privacy_security_controls",
      ]),
    );
    expect(
      mixedBlueprint.evidenceFamilies.map((family) => family.id),
    ).not.toEqual(
      expect.arrayContaining([
        "commercial_lending_workflow_map",
        "los_crm_core_system_map",
        "kyc_sanctions_credit_policy_controls",
      ]),
    );
  });

  it("uses a financial-services lending Agent Assist blueprint before the broad agent-assist matcher", () => {
    const lendingBlueprint = getDiscoveryBlueprint(
      "First Capital commercial lending agent assist for loan onboarding, KYC, sanctions, collateral, credit policy, LOS, CRM, document management, and core banking handoffs",
    );

    expect(lendingBlueprint.blueprintId).toBe(
      "financial_services_commercial_lending_agent_assist",
    );
    expect(
      lendingBlueprint.evidenceFamilies.map((family) => family.id),
    ).toEqual(
      expect.arrayContaining([
        "commercial_lending_workflow_map",
        "loan_onboarding_kpis",
        "los_crm_core_system_map",
        "kyc_sanctions_credit_policy_controls",
        "document_intake_quality",
        "decision_rights_human_review_model",
        "finance_baseline_value_plan",
      ]),
    );
    expect(lendingBlueprint.blueprintId).not.toBe(
      "healthcare_contact_center_agent_assist",
    );
  });

  it("builds blueprint input from plain Move classification and problem context", () => {
    const blueprintInput = buildDiscoveryBlueprintInputFromProgram({
      functionPackKey: null,
      archetype: null,
      name: "Postfix Evidence Agent Assist",
      problemStatement:
        "Meridian member service wants an AI agent assist move for claims, benefits, prior authorization, CRM history, and knowledge lookup.",
      targetOutcome:
        "Shape a governed contact-center Agent Assist move with evidence-backed readiness gates.",
      charter: {
        classification: "Contact Center Agent Assist",
        scope_boundary:
          "Member-service assisted-agent workflows only; no autonomous clinical, coverage, appeals, or payment decisions.",
        evidence_family:
          "contact-center metrics, transcripts, CRM, claims, benefits, prior authorization, knowledge, system inventory, PHI controls, value baseline",
      },
    });

    const agentAssistBlueprint = getDiscoveryBlueprint(blueprintInput);

    expect(agentAssistBlueprint.blueprintId).toBe(
      "healthcare_contact_center_agent_assist",
    );
  });
});

// An upload made against a declared evidence family must be credited to that
// family. The keyword scorer reads the item's title and summary and awards the
// item to the single best-scoring family, so a file is routed by whatever
// words its first rows happen to contain.
describe("declared evidence family outranks keyword inference", () => {
  const memberService = getDiscoveryBlueprint(
    "healthcare member service contact center agent assist",
  );

  // The shape of a real workflow walkthrough: its opening rows name the systems
  // the agent visits, so "claims", "eligibility" and "source" all appear.
  const WALKTHROUGH_SUMMARY =
    "case_id,contact_intent,step,time_seconds,actor,system_or_artifact,effort_or_wait,exception_or_control,evidence_ref " +
    "WF-01,status inquiry,1,42,agent,CRM,agent effort,verify caller in approved workflow,SESSION-01 " +
    "WF-01,status inquiry,2,68,agent,claims status view,agent effort,source timestamp not always visible,SYS-01 " +
    "WF-01,status inquiry,3,53,agent,eligibility view,agent effort,agent confirms effective date,SYS-01";

  function walkthrough(
    declaredFamilyKey: string | null,
  ): DiscoveryEvidenceReadinessItem {
    return {
      ...item("wf", "workflow_walkthrough.csv", WALKTHROUGH_SUMMARY),
      declaredFamilyKey,
    };
  }

  it("the keyword scorer alone files a workflow walkthrough under data access", () => {
    // The defect, pinned: without a declaration this is what inference does.
    expect(mapEvidenceToDiscoveryFamily(walkthrough(null), memberService)).toBe(
      "claims_eligibility_benefits_data_access",
    );
  });

  it("credits the declared family instead", () => {
    const readiness = evaluateDiscoveryEvidenceReadiness({
      blueprint: memberService,
      evidenceItems: [walkthrough("member_service_process_map")],
    });
    const covered = readiness.families
      .filter((family) => family.status === "covered")
      .map((family) => family.familyId);
    expect(covered).toEqual(["current_state_workflow_map"]);
  });

  it("a declaration is not also keyword-scored into a second family", () => {
    const readiness = evaluateDiscoveryEvidenceReadiness({
      blueprint: memberService,
      evidenceItems: [walkthrough("member_service_process_map")],
    });
    expect(
      readiness.families.find(
        (family) =>
          family.familyId === "claims_eligibility_benefits_data_access",
      )?.status,
    ).toBe("missing");
  });

  it("maps a declared family whose label spans two discovery families to both", () => {
    const systems = {
      ...item("sys", "system_inventory.csv", "system_id,domain,system_role"),
      declaredFamilyKey: "member_service_systems_data_landscape",
    };
    expect(declaredDiscoveryFamilies(systems, memberService)).toEqual([
      "crm_contact_center_system_map",
      "claims_eligibility_benefits_data_access",
    ]);
  });

  it("accepts a declared key that is itself a blueprint family id", () => {
    const direct = {
      ...item("k", "anything.csv", "no keywords here"),
      declaredFamilyKey: "knowledge_base_ownership_freshness",
    };
    expect(declaredDiscoveryFamilies(direct, memberService)).toEqual([
      "knowledge_base_ownership_freshness",
    ]);
  });

  it("falls back to keyword inference when nothing recognised is declared", () => {
    for (const declared of [null, undefined, "", "uploaded_move_evidence"]) {
      const undeclared = {
        ...item(
          "kpi",
          "contact center kpi baseline",
          "AHT, transfer, repeat contact and CSAT metric baseline.",
        ),
        declaredFamilyKey: declared,
      };
      expect(declaredDiscoveryFamilies(undeclared, memberService)).toEqual([]);
      const readiness = evaluateDiscoveryEvidenceReadiness({
        blueprint: memberService,
        evidenceItems: [undeclared],
      });
      expect(
        readiness.families.find(
          (family) => family.familyId === "contact_center_kpis",
        )?.status,
      ).toBe("covered");
    }
  });

  it("ignores a crosswalk target the blueprint does not contain", () => {
    const foreign = {
      ...item("wf", "workflow.csv", "workflow"),
      declaredFamilyKey: "member_service_process_map",
    };
    // `blueprint` above is a different archetype with no member-service families.
    expect(declaredDiscoveryFamilies(foreign, blueprint)).toEqual([]);
  });
});
