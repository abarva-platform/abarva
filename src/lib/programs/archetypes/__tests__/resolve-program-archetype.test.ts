import {
  resolveProgramArchetype,
  getArchetype,
  DEFAULT_ARCHETYPE_ID,
  AI_OPERATIONS_DECISION_SUPPORT,
  ANALYTICS_CAPABILITY_REPATRIATION,
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  COMMERCIAL_LENDING_AGENT_ASSIST,
  CONTACT_CENTER_AGENT_ASSIST,
  IT_SOURCING_EVENT,
} from "../registry";
import { resolveArchetypeRequirements } from "../resolver";
import { emptyProfile } from "@/lib/programs/current-state-readiness";

describe("resolveProgramArchetype — per-Move archetype resolution", () => {
  it("routes an IROPS move name to the operations decision-support archetype", () => {
    const a = resolveProgramArchetype({
      archetype: "operational_optimization",
      classification: null,
      name: "IROPS Recovery Decision Support",
    });
    expect(a.id).toBe("AI_OPERATIONS_DECISION_SUPPORT");
  });

  it("routes operations/disruption language to the operations archetype", () => {
    expect(
      resolveProgramArchetype({ name: "Claims operations exception handling" })
        .id,
    ).toBe("AI_OPERATIONS_DECISION_SUPPORT");
    expect(
      resolveProgramArchetype({
        classification: "disruption recovery and re-accommodation",
      }).id,
    ).toBe("AI_OPERATIONS_DECISION_SUPPORT");
  });

  it("routes healthcare agent-assist origination text to the contact-center archetype even when the row archetype is product enablement", () => {
    expect(
      resolveProgramArchetype({
        archetype: "ai_product_enablement",
        classification:
          "Contact Center Agent Assist - AI-assisted member-service workflow for claims, benefits, eligibility, prior authorization, CRM, and knowledge lookup.",
        name: "Member Service Agent Assist",
      }).id,
    ).toBe("CONTACT_CENTER_AGENT_ASSIST");
  });

  it("routes terse Meridian member AI assist naming to the contact-center archetype", () => {
    expect(
      resolveProgramArchetype({
        archetype: "ai_product_enablement",
        name: "MEMBER AI ASSIST",
      }).id,
    ).toBe("CONTACT_CENTER_AGENT_ASSIST");
  });

  it("routes commercial lending Agent Assist capture text to the banking archetype even with incidental source/vendor wording", () => {
    expect(
      resolveProgramArchetype({
        archetype: "ai_product_enablement",
        classification:
          "Commercial Lending Agent Assist for loan onboarding, KYC evidence collection, credit memo support, policy knowledge, core banking handoffs, source files, vendor/contract cost lines, and human credit approval.",
        name: "Codex Proof First Capital E2E 20260721",
      }).id,
    ).toBe("COMMERCIAL_LENDING_AGENT_ASSIST");
  });

  it("routes pdlc/sdlc/software language to AI-PDLC", () => {
    expect(resolveProgramArchetype({ name: "AI-led SDLC uplift" }).id).toBe(
      "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    );
    expect(
      resolveProgramArchetype({
        classification: "ai across product development",
      }).id,
    ).toBe("AI_PRODUCT_DEVELOPMENT_LIFECYCLE");
  });

  it("routes sourcing/vendor language to IT_SOURCING_EVENT", () => {
    expect(
      resolveProgramArchetype({ name: "AMS vendor renegotiation" }).id,
    ).toBe("IT_SOURCING_EVENT");
    expect(resolveProgramArchetype({ archetype: "it sourcing event" }).id).toBe(
      "IT_SOURCING_EVENT",
    );
  });

  it("routes managed analytics exit language to analytics capability repatriation before generic sourcing", () => {
    expect(
      resolveProgramArchetype({
        classification:
          "Managed analytics provider exit to internal Databricks with data return, parity, contract transition, and vendor support in scope.",
      }).id,
    ).toBe("ANALYTICS_CAPABILITY_REPATRIATION");
    expect(
      resolveProgramArchetype({
        name: "Analytics capability repatriation from managed provider",
      }).id,
    ).toBe("ANALYTICS_CAPABILITY_REPATRIATION");
  });

  it("sourcing signals win over operations signals (declared precedence)", () => {
    expect(
      resolveProgramArchetype({ name: "Sourcing event for operations tools" })
        .id,
    ).toBe("IT_SOURCING_EVENT");
  });

  it("an exact registry id resolves directly", () => {
    expect(
      resolveProgramArchetype({ archetype: "AI_OPERATIONS_DECISION_SUPPORT" })
        .id,
    ).toBe(AI_OPERATIONS_DECISION_SUPPORT.id);
    expect(
      resolveProgramArchetype({
        archetype: "ANALYTICS_CAPABILITY_REPATRIATION",
        name: "generic vendor sourcing", // exact id wins over heuristics
      }).id,
    ).toBe(ANALYTICS_CAPABILITY_REPATRIATION.id);
    expect(
      resolveProgramArchetype({
        archetype: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
        name: "IROPS recovery", // exact id wins over heuristics
      }).id,
    ).toBe(AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id);
  });

  it("unknown/empty input falls back to the AI-PDLC default (back-compat)", () => {
    expect(resolveProgramArchetype({}).id).toBe(DEFAULT_ARCHETYPE_ID);
    expect(
      resolveProgramArchetype({
        archetype: "strategic_transformation",
        classification: null,
        name: "Enterprise data platform",
      }).id,
    ).toBe(DEFAULT_ARCHETYPE_ID);
    expect(resolveProgramArchetype({ archetype: null, name: null }).id).toBe(
      DEFAULT_ARCHETYPE_ID,
    );
  });
});

describe("AI_OPERATIONS_DECISION_SUPPORT — registry shape", () => {
  it("is registered and resolvable by id", () => {
    expect(getArchetype("AI_OPERATIONS_DECISION_SUPPORT")?.name).toBe(
      "AI Operations Decision Support",
    );
  });

  it("does NOT require DORA or product/platform operating model", () => {
    const familyKeys = AI_OPERATIONS_DECISION_SUPPORT.evidenceFamilies.map(
      (f) => f.key,
    );
    expect(familyKeys).not.toContain("eng_performance_dora");
    expect(familyKeys).not.toContain("product_platform_operating_model");
    for (const phase of AI_OPERATIONS_DECISION_SUPPORT.phaseModel) {
      const required = phase.requiredEvidence.map((r) => r.family);
      expect(required).not.toContain("eng_performance_dora");
      expect(required).not.toContain("product_platform_operating_model");
    }
  });

  it("requires the operations baselines hard at charter", () => {
    const charter = AI_OPERATIONS_DECISION_SUPPORT.phaseModel.find(
      (p) => p.phase === "charter",
    )!;
    const bySeverity = Object.fromEntries(
      charter.requiredEvidence.map((r) => [r.family, r.severity]),
    );
    expect(bySeverity["ops_process_baseline"]).toBe("hard");
    expect(bySeverity["ops_event_cost_baseline"]).toBe("hard");
    expect(bySeverity["ops_change_readiness"]).toBe("soft");
  });

  it("every required family at every phase is declared in evidenceFamilies", () => {
    const declared = new Set(
      AI_OPERATIONS_DECISION_SUPPORT.evidenceFamilies.map((f) => f.key),
    );
    for (const phase of AI_OPERATIONS_DECISION_SUPPORT.phaseModel) {
      for (const r of phase.requiredEvidence) {
        expect(declared.has(r.family)).toBe(true);
      }
    }
  });

  it("reuses the AI-PDLC deliverable keys (routes look up by key)", () => {
    const pdlcKeys = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.deliverablePack
      .map((d) => d.key)
      .sort();
    const opsKeys = AI_OPERATIONS_DECISION_SUPPORT.deliverablePack
      .map((d) => d.key)
      .sort();
    expect(opsKeys).toEqual(pdlcKeys);
  });

  it("the sourcing archetype remains intact", () => {
    expect(IT_SOURCING_EVENT.id).toBe("IT_SOURCING_EVENT");
  });
});

describe("ANALYTICS_CAPABILITY_REPATRIATION — registry shape", () => {
  it("is registered and resolvable by id", () => {
    expect(getArchetype("ANALYTICS_CAPABILITY_REPATRIATION")?.name).toBe(
      "Analytics Capability Repatriation",
    );
  });

  it("keeps P1 as Discovery authorization rather than full repatriation approval", () => {
    const originate = ANALYTICS_CAPABILITY_REPATRIATION.phaseModel.find(
      (p) => p.phase === "originate",
    )!;
    const charter = ANALYTICS_CAPABILITY_REPATRIATION.deliverablePack.find(
      (d) => d.key === "program_charter",
    )!;

    expect(originate.gateRequirements.map((g) => g.key)).toContain(
      "discovery_only_scope",
    );
    expect(charter.qualityBar.rubric.join(" ")).toMatch(
      /Authorizes Discovery only/,
    );
    expect(charter.sections.join(" ")).not.toMatch(/roadmap|architecture/i);
  });

  it("declares every required evidence family and includes contract/parity/platform coverage", () => {
    const declared = new Set(
      ANALYTICS_CAPABILITY_REPATRIATION.evidenceFamilies.map((f) => f.key),
    );
    for (const phase of ANALYTICS_CAPABILITY_REPATRIATION.phaseModel) {
      for (const requirement of phase.requiredEvidence) {
        expect(declared.has(requirement.family)).toBe(true);
      }
    }
    expect(declared.has("business_rules_measure_logic")).toBe(true);
    expect(declared.has("internal_databricks_readiness")).toBe(true);
    expect(declared.has("contract_ip_data_return_exit")).toBe(true);
    expect(ANALYTICS_CAPABILITY_REPATRIATION.analysisMethods).toEqual(
      expect.arrayContaining([
        "strategic_control_repatriation_readiness",
        "capability_parity_traceability",
      ]),
    );
  });

  it("business case prohibits simplistic vendor-spend-minus-platform-cost savings", () => {
    const businessCase = ANALYTICS_CAPABILITY_REPATRIATION.deliverablePack.find(
      (d) => d.key === "business_case",
    )!;
    expect(businessCase.qualityBar.rubric.join(" ")).toMatch(
      /Never uses vendor spend minus internal platform cost/,
    );
    expect(
      ANALYTICS_CAPABILITY_REPATRIATION.agentGuidance.systemFraming,
    ).toMatch(/Migrate provider-delivered analytics capabilities/);
  });
});

describe("CONTACT_CENTER_AGENT_ASSIST — registry shape", () => {
  it("is registered and resolvable by id", () => {
    expect(getArchetype("CONTACT_CENTER_AGENT_ASSIST")?.name).toBe(
      "Contact Center Agent Assist",
    );
  });

  it("does NOT require DORA, CI/CD, or engineering SDLC evidence for P2", () => {
    const familyKeys = CONTACT_CENTER_AGENT_ASSIST.evidenceFamilies.map(
      (f) => f.key,
    );
    expect(familyKeys).not.toContain("eng_performance_dora");
    expect(familyKeys).not.toContain("delivery_quality_itsm");
    const diagnose = CONTACT_CENTER_AGENT_ASSIST.phaseModel.find(
      (p) => p.phase === "diagnose",
    )!;
    const required = diagnose.requiredEvidence.map((r) => r.family);
    expect(required).not.toContain("eng_performance_dora");
    expect(required).not.toContain("delivery_quality_itsm");
    expect(required).toEqual(
      expect.arrayContaining([
        "member_service_process_map",
        "member_service_metrics_baseline",
        "contact_center_transcripts_intents",
        "member_service_systems_data_landscape",
        "knowledge_policy_content_inventory",
        "phi_controls_and_human_approval",
      ]),
    );
  });

  it("keeps delivery-estimation context optional, not a P2 hard blocker", () => {
    const diagnose = CONTACT_CENTER_AGENT_ASSIST.phaseModel.find(
      (p) => p.phase === "diagnose",
    )!;
    const byFamily = Object.fromEntries(
      diagnose.requiredEvidence.map((r) => [r.family, r.severity]),
    );
    expect(byFamily["solution_delivery_estimation_context"]).toBe("soft");
  });

  it("renders soft P2 delivery-estimation rationale as optional, not required", () => {
    const resolved = resolveArchetypeRequirements(
      CONTACT_CENTER_AGENT_ASSIST,
      "diagnose",
      emptyProfile(),
    );
    const byFamily = Object.fromEntries(resolved.map((r) => [r.family.key, r]));

    expect(byFamily["member_service_process_map"].severity).toBe("hard");
    expect(byFamily["member_service_process_map"].rationale).toContain(
      "requires Member-service process and escalation map",
    );
    expect(byFamily["solution_delivery_estimation_context"].severity).toBe(
      "soft",
    );
    expect(
      byFamily["solution_delivery_estimation_context"].rationale,
    ).toContain("as optional context");
    expect(
      byFamily["solution_delivery_estimation_context"].rationale,
    ).not.toContain("requires Solution delivery estimation context");
  });

  it("every required family at every phase is declared in evidenceFamilies", () => {
    const declared = new Set(
      CONTACT_CENTER_AGENT_ASSIST.evidenceFamilies.map((f) => f.key),
    );
    for (const phase of CONTACT_CENTER_AGENT_ASSIST.phaseModel) {
      for (const r of phase.requiredEvidence) {
        expect(declared.has(r.family)).toBe(true);
      }
    }
  });
});

describe("COMMERCIAL_LENDING_AGENT_ASSIST — registry shape", () => {
  it("is registered and resolvable by id", () => {
    expect(getArchetype("COMMERCIAL_LENDING_AGENT_ASSIST")?.name).toBe(
      "Commercial Lending Agent Assist",
    );
  });

  it("does NOT require DORA, CI/CD, ITSM, or engineering SDLC evidence for P2", () => {
    const familyKeys = COMMERCIAL_LENDING_AGENT_ASSIST.evidenceFamilies.map(
      (f) => f.key,
    );
    expect(familyKeys).not.toContain("eng_performance_dora");
    expect(familyKeys).not.toContain("delivery_quality_itsm");
    const diagnose = COMMERCIAL_LENDING_AGENT_ASSIST.phaseModel.find(
      (p) => p.phase === "diagnose",
    )!;
    const required = diagnose.requiredEvidence.map((r) => r.family);
    expect(required).not.toContain("eng_performance_dora");
    expect(required).not.toContain("delivery_quality_itsm");
    expect(required).toEqual(
      expect.arrayContaining([
        "commercial_lending_process_map",
        "commercial_lending_metrics_baseline",
        "kyc_document_defect_log",
        "lending_systems_data_landscape",
        "credit_policy_knowledge_inventory",
        "banking_controls_human_approval",
      ]),
    );
  });

  it("keeps delivery-estimation context optional, not a P2 hard blocker", () => {
    const diagnose = COMMERCIAL_LENDING_AGENT_ASSIST.phaseModel.find(
      (p) => p.phase === "diagnose",
    )!;
    const byFamily = Object.fromEntries(
      diagnose.requiredEvidence.map((r) => [r.family, r.severity]),
    );
    expect(byFamily["solution_delivery_estimation_context"]).toBe("soft");
  });

  it("every required family at every phase is declared in evidenceFamilies", () => {
    const declared = new Set(
      COMMERCIAL_LENDING_AGENT_ASSIST.evidenceFamilies.map((f) => f.key),
    );
    for (const phase of COMMERCIAL_LENDING_AGENT_ASSIST.phaseModel) {
      for (const r of phase.requiredEvidence) {
        expect(declared.has(r.family)).toBe(true);
      }
    }
  });
});
