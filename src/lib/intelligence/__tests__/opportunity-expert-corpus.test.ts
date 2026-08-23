import {
  AI_OPPORTUNITY_CORE_PACK_IDS,
  OPPORTUNITY_EXPERT_PACK_CORPUS,
  buildOpportunityExpertContext,
  selectOpportunityExpertPacks,
  validateOpportunityExpertPackCorpus,
} from "@/lib/intelligence/opportunity-expert-corpus";

describe("AI Opportunity Discovery expert pack corpus", () => {
  it("covers every required expert-pack domain with structured records", () => {
    expect(validateOpportunityExpertPackCorpus()).toEqual([]);
    expect(OPPORTUNITY_EXPERT_PACK_CORPUS).toHaveLength(10);
    for (const pack of OPPORTUNITY_EXPERT_PACK_CORPUS) {
      expect(pack.expertPackId).toMatch(/^xp-corpus\./);
      expect(pack.problemSignals.length).toBeGreaterThanOrEqual(5);
      expect(pack.diagnosticQuestions.length).toBeGreaterThanOrEqual(5);
      expect(pack.requiredEvidence.length).toBeGreaterThanOrEqual(3);
      expect(pack.opportunityArchetypes.length).toBeGreaterThanOrEqual(3);
      expect(pack.controls.length).toBeGreaterThanOrEqual(3);
      expect(pack.answerGuidance.length).toBeGreaterThan(0);
      expect(pack.caveats.join(" ")).toMatch(/evidence|tenant|client|validation|pattern/i);
    }
  });

  it("binds the required core packs for AI Opportunity Discovery moves", () => {
    const selection = selectOpportunityExpertPacks({
      moveArchetype: "AI Opportunity Discovery",
      loadedSourceSystems: ["servicenow", "jira", "logs", "process_observation"],
      artifactType: "p3-options",
      question: "What should we automate first?",
    });

    expect(selection.packIds).toEqual(expect.arrayContaining([...AI_OPPORTUNITY_CORE_PACK_IDS]));
    expect(selection.packIds).toEqual(
      expect.arrayContaining([
        "xp-corpus.itsm-servicenow-process-intelligence",
        "xp-corpus.jira-delivery-intelligence",
        "xp-corpus.observability-app-operations",
        "xp-corpus.process-mining-reengineering",
      ]),
    );
  });

  it("selects source-specific packs from loaded evidence", () => {
    expect(
      selectOpportunityExpertPacks({
        loadedSourceSystems: ["servicenow"],
        question: "Which incidents should the service desk automate first?",
      }).packIds,
    ).toContain("xp-corpus.itsm-servicenow-process-intelligence");

    expect(
      selectOpportunityExpertPacks({
        loadedSourceSystems: ["jira"],
        question: "Show delivery bottlenecks in epics and stories.",
      }).packIds,
    ).toContain("xp-corpus.jira-delivery-intelligence");

    expect(
      selectOpportunityExpertPacks({
        loadedSourceSystems: ["observability"],
        question: "Which alerts and logs show recurring app friction?",
      }).packIds,
    ).toContain("xp-corpus.observability-app-operations");

    expect(
      selectOpportunityExpertPacks({
        loadedSourceSystems: ["process_observation"],
        question: "Where are handoffs and queues creating rework?",
      }).packIds,
    ).toContain("xp-corpus.process-mining-reengineering");
  });

  it("binds artifact-specific packs for architecture, business case, roadmap, and handoff", () => {
    expect(
      selectOpportunityExpertPacks({
        artifactType: "p3-architecture",
        question: "Generate the operational evidence architecture.",
      }).packIds,
    ).toContain("xp-corpus.ai-opportunity-architecture");

    expect(
      selectOpportunityExpertPacks({
        artifactType: "p4-business-case",
        question: "Build the ROM business case and finance caveats.",
      }).packIds,
    ).toContain("xp-corpus.value-rom-estimation");

    expect(
      selectOpportunityExpertPacks({
        artifactType: "p4-roadmap",
        question: "Create the 90-day pilot roadmap.",
      }).packIds,
    ).toContain("xp-corpus.pilot-roadmap-90-day");

    expect(
      selectOpportunityExpertPacks({
        artifactType: "p5-handoff",
        question: "Create the execution handoff.",
      }).packIds,
    ).toEqual(
      expect.arrayContaining([
        "xp-corpus.human-agent-operating-model",
        "xp-corpus.ai-governance-risk-control",
      ]),
    );
  });

  it("builds an answer context that preserves the tenant evidence boundary", () => {
    const selection = selectOpportunityExpertPacks({
      moveArchetype: "AI Opportunity Discovery",
      loadedSourceSystems: ["servicenow"],
      question: "What should we automate first?",
    });
    const context = buildOpportunityExpertContext(selection);

    expect(context).toContain("EXPERT PACK CORPUS CONTEXT");
    expect(context).toContain("They interpret tenant evidence but are never client evidence");
    expect(context).toContain("Ticket Intake Agent");
    expect(context).toContain("Value and ROM Estimation");
  });

  it("does not bind a tenant-specific source pack when only generic governance is asked", () => {
    const selection = selectOpportunityExpertPacks({
      question: "What governance controls should an AI pilot include?",
    });

    expect(selection.packIds).toContain("xp-corpus.ai-governance-risk-control");
    expect(selection.packIds).not.toContain("xp-corpus.itsm-servicenow-process-intelligence");
    expect(selection.packIds).not.toContain("xp-corpus.jira-delivery-intelligence");
  });
});
