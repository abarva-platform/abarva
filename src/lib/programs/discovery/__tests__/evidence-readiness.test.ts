import {
  buildDiscoveryBlueprintInputFromProgram,
  discoveryInferenceReach,
  declaredDiscoveryFamilies,
  evaluateDiscoveryEvidenceReadiness,
  mapEvidenceToDiscoveryFamily,
  resolveDeclaredEvidenceFamily,
  resolveDeclaredProgramArchetypeId,
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
  it("honors a declared charter archetype without replacing legacy program fields", () => {
    const program = {
      functionPackKey: null,
      archetype: "ai_product_enablement",
      name: "Governed data initiative",
      problemStatement: "Establish a governed data foundation.",
      charter: {
        classification: { archetype: "governed_data_foundation" },
      },
    };
    const declaredId = resolveDeclaredProgramArchetypeId(program);
    const resolved = getDiscoveryBlueprint(
      buildDiscoveryBlueprintInputFromProgram(program),
      declaredId,
    );

    expect(program.archetype).toBe("ai_product_enablement");
    expect(program.functionPackKey).toBeNull();
    expect(declaredId).toBe("governed_data_foundation");
    expect(resolved.blueprintId).toBe("governed_data_foundation");
    expect(
      resolved.evidenceFamilies.filter((family) => family.required).map((family) => family.id),
    ).toEqual([
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
    ]);
  });

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

  it("does not infer P1 charter evidence into a P2 discovery family", () => {
    const charterMetrics = {
      ...item(
        "charter-metrics",
        "Charter success criteria",
        "Contact center AHT, first contact resolution, baseline KPI targets and CSAT measures.",
      ),
      phase: 1,
      declaredFamilyKey: "charter_success_metrics",
    };
    const readiness = evaluateDiscoveryEvidenceReadiness({
      blueprint: memberService,
      evidenceItems: [charterMetrics],
    });

    expect(
      readiness.families.find(
        (family) => family.familyId === "contact_center_kpis",
      )?.status,
    ).toBe("missing");
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

describe("a family declared at upload", () => {
  const memberService = getDiscoveryBlueprint(
    "healthcare member service contact center agent assist",
  );

  it("accepts a family this Move's discovery requires", () => {
    expect(
      resolveDeclaredEvidenceFamily(
        "model_risk_responsible_ai_controls",
        memberService,
      ),
    ).toEqual({ ok: true, familyKey: "model_risk_responsible_ai_controls" });
  });

  it("treats empty input as nothing declared", () => {
    for (const raw of ["", "   ", null, undefined]) {
      expect(resolveDeclaredEvidenceFamily(raw, memberService)).toEqual({
        ok: true,
        familyKey: null,
      });
    }
  });

  it("refuses a family this Move does not require instead of ignoring it", () => {
    const result = resolveDeclaredEvidenceFamily("cost_pools", memberService);
    expect(result.ok).toBe(false);
  });

  it("a declared blueprint family is credited whatever the file's text says", () => {
    // The observed case: a controls file whose opening rows mention knowledge
    // and freshness is scored into the knowledge family by keywords.
    const controls: DiscoveryEvidenceReadinessItem = {
      ...item(
        "mr",
        "controls.csv",
        "control,guardrail,evaluation test,owner Stale knowledge article presented as authoritative; show source and freshness; knowledge owner; test policy",
      ),
    };
    expect(mapEvidenceToDiscoveryFamily(controls, memberService)).toBe(
      "knowledge_base_ownership_freshness",
    );
    const readiness = evaluateDiscoveryEvidenceReadiness({
      blueprint: memberService,
      evidenceItems: [
        { ...controls, declaredFamilyKey: "model_risk_responsible_ai_controls" },
      ],
    });
    expect(
      readiness.families
        .filter((family) => family.status === "covered")
        .map((family) => family.familyId),
    ).toEqual(["model_risk_responsible_ai_controls"]);
  });
});

describe("resolveDeclaredProgramArchetypeId prefers a known catalog archetype", () => {
  it("a non-archetype functionPackKey does NOT shadow a charter-declared archetype", () => {
    const program = {
      functionPackKey: "some_function_pack", // not a catalog archetype id
      charter: { classification: { archetype: "governed_data_foundation" } },
    };
    expect(resolveDeclaredProgramArchetypeId(program)).toBe(
      "governed_data_foundation",
    );
  });

  it("does not require overloading program.archetype (phase logic) to declare", () => {
    const program = {
      archetype: "ai_operations_customer_digital", // phase archetype, kept as-is
      charter: { classification: { archetype: "governed_data_foundation" } },
    };
    // both are catalog ids; the FIRST matching candidate wins by field order
    // (functionPackKey -> charter.classification -> program.archetype), so the
    // charter declaration is honored ahead of program.archetype.
    expect(resolveDeclaredProgramArchetypeId(program)).toBe(
      "governed_data_foundation",
    );
  });

  it("honors a catalog archetype placed in functionPackKey", () => {
    expect(
      resolveDeclaredProgramArchetypeId({
        functionPackKey: "governed_data_foundation",
      }),
    ).toBe("governed_data_foundation");
  });

  it("falls back to the first non-empty value as the inference seed", () => {
    expect(
      resolveDeclaredProgramArchetypeId({
        functionPackKey: "some_function_pack",
        name: "ignored",
      }),
    ).toBe("some_function_pack");
    expect(resolveDeclaredProgramArchetypeId({})).toBeNull();
    expect(resolveDeclaredProgramArchetypeId(null)).toBeNull();
  });
});

describe("anchoring keyword inference", () => {
  const gdf = getDiscoveryBlueprint(
    "governed_data_foundation",
    "governed_data_foundation",
  );

  function doc(title: string, summary: string, evidenceType = "document") {
    return item("e1", title, summary, evidenceType);
  }

  it("reports how little of a governed-data-foundation blueprint inference can reach", () => {
    const reach = discoveryInferenceReach(gdf);
    expect(reach.phraseOnlyRequiredFamilyIds).toEqual([
      "data_governance_ownership",
      "semantic_layer_certification",
      "data_lineage_audit_trail",
      "data_quality_rules",
      "source_system_data_access",
      "platform_architecture_readiness",
      "master_identity_resolution",
      "privacy_security_controls",
    ]);
    expect(reach.keywordedRequiredFamilyIds).toEqual([
      "model_risk_responsible_ai_controls",
      "measurement_owner_cadence",
      "finance_baseline_value_plan",
    ]);
    expect(reach.mixed).toBe(true);
  });

  it("refuses to file a semantic-layer document under measurement owners on the word 'owner'", () => {
    // The word that did it: `measurement_owner_cadence` lists `owner`, and the
    // family this document is about has no authored list, so it could not
    // compete. Placing nothing is remediable by declaring the family; placing
    // it here read as covered and could never be corrected.
    expect(
      mapEvidenceToDiscoveryFamily(
        doc(
          "Certified metric definitions",
          "Certified metrics, entity definitions, and the steward who is the owner of each.",
        ),
        gdf,
      ),
    ).toBeNull();
  });

  it("still places a document that names its own family", () => {
    expect(
      mapEvidenceToDiscoveryFamily(
        doc(
          "Data governance ownership and decision rights",
          "Council, policies, decision rights, stewardship.",
        ),
        gdf,
      ),
    ).toBe("data_governance_ownership");
  });

  it("places a document named after the family LABEL the upload surface shows", () => {
    // The id-as-words phrase (`semantic layer certification`) does not appear
    // here; the label does. A file named after the label the picker displays is
    // the likeliest shape of all, so the label must anchor on its own.
    const family = gdf.evidenceFamilies.find(
      (candidate) => candidate.id === "semantic_layer_certification",
    );
    expect(family).toBeDefined();
    expect(family?.label).not.toContain("semantic layer certification");
    expect(
      mapEvidenceToDiscoveryFamily(doc(family?.label ?? "", "Workbook."), gdf),
    ).toBe("semantic_layer_certification");
  });

  it("still places a document on a multi-word keyword of its family", () => {
    expect(
      mapEvidenceToDiscoveryFamily(
        doc(
          "Boundary note",
          "Covers model risk for the downstream automation.",
        ),
        gdf,
      ),
    ).toBe("model_risk_responsible_ai_controls");
  });

  it("still places a document corroborated by two keywords of its family", () => {
    expect(
      mapEvidenceToDiscoveryFamily(
        doc("Value note", "The finance baseline for this work."),
        gdf,
      ),
    ).toBe("finance_baseline_value_plan");
  });

  it("does not let an unanchored higher scorer shut out an anchored family behind it", () => {
    // `cost_pools` matches the single generic word `cost` and takes a +2
    // evidence-type bonus on baseline evidence, scoring 4 on no specific
    // signal. `model_risk_responsible_ai_controls` matches the multi-word
    // `model risk` and scores only 2. The anchored family must win: an
    // unanchored match is not a candidate, rather than a winner that is
    // discarded afterwards and takes the placement down with it.
    const blueprint = {
      ...gdf,
      evidenceFamilies: [
        {
          id: "cost_pools",
          label: "Cost pools",
          grounds: "value case",
          required: true,
          likelySource: "finance",
          format: "CSV",
        },
        {
          id: "model_risk_responsible_ai_controls",
          label: "Responsible-AI / model-risk controls",
          grounds: "controls",
          required: true,
          likelySource: "risk",
          format: "doc",
        },
      ],
    };
    expect(
      mapEvidenceToDiscoveryFamily(
        doc("Note", "Model risk and the cost of it.", "baseline_evidence"),
        blueprint,
      ),
    ).toBe("model_risk_responsible_ai_controls");
  });

  it("leaves every family it does place correct for the real discovery pack", () => {
    // The eleven titles the committed governed-data-foundation discovery pack
    // actually carries, one per required family. Before anchoring, three of
    // these were filed under `measurement_owner_cadence` on the word `owner`
    // and a fourth under it on `measurement`; the family then listed four
    // files, three of them about something else, and read as covered. Now
    // every placement that is made is the right one, and the rest are MISSING
    // — which is what an undeclared upload honestly is for a blueprint whose
    // families inference cannot reach.
    const titles: Array<[string, string | null]> = [
      [
        "Data governance ownership and decision rights",
        "data_governance_ownership",
      ],
      ["Semantic layer and certified measure definitions", null],
      ["Source-to-measure lineage and AI/model audit trail", null],
      ["04_data_quality_rules.csv", null],
      ["05_source_system_data_access.csv", null],
      ["Platform and architecture readiness", null],
      ["Patient, member, and provider identity resolution", null],
      ["Privacy and security control questions (PHI)", null],
      [
        "Responsible AI and model-risk boundary",
        "model_risk_responsible_ai_controls",
      ],
      [
        "Measurement owners and operating cadence",
        "measurement_owner_cadence",
      ],
      [
        "Finance baseline and value-measurement plan",
        "finance_baseline_value_plan",
      ],
    ];
    for (const [title, expected] of titles) {
      expect(mapEvidenceToDiscoveryFamily(doc(title, title), gdf)).toBe(
        expected,
      );
    }
  });
});
