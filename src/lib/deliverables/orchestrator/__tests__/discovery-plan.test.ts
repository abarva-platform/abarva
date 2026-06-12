// PR-i: Discovery Plan deliverable folds into the engine — blueprint catalog,
// archetype-driven brief, and policy tier.

import { getArtifactBrief } from "../artifact-brief-registry";
import { getDiscoveryBlueprint } from "../briefs/discovery-blueprint";
import { tierForDeliverable } from "@/lib/ai/document-generation-policy";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

function movesDiscoveryReq(archetype: string): DeliverableIntelligenceRequest {
  return {
    ...amsRfpRequest(),
    module: "moves",
    useCaseArchetype: archetype,
    deliverableType: "discovery_plan",
  };
}

describe("discovery blueprint", () => {
  it("resolves ops/IROPS archetypes to the AI-Operations blueprint", () => {
    for (const a of [
      "AI_OPERATIONS_DECISION_SUPPORT",
      "operational_optimization",
      "IROPS recovery",
    ]) {
      const bp = getDiscoveryBlueprint(a);
      expect(bp.archetypeLabel).toMatch(/AI Operations/i);
      expect(bp.evidenceFamilies.length).toBeGreaterThanOrEqual(8);
      // both business and IT interview tracks present
      expect(bp.interviewRoster.some((r) => r.side === "business")).toBe(true);
      expect(bp.interviewRoster.some((r) => r.side === "it")).toBe(true);
      // the data-estate / real-time-profile question is asked of IT
      const itQs = bp.interviewRoster
        .filter((r) => r.side === "it")
        .flatMap((r) => r.questions)
        .join(" ");
      expect(itQs).toMatch(/real-time|CDP|profile|batch/i);
    }
  });

  it("falls back to a sane default for non-ops archetypes", () => {
    const bp = getDiscoveryBlueprint("workflow_automation");
    expect(bp.archetypeLabel).toMatch(/default/i);
    expect(bp.evidenceFamilies.length).toBeGreaterThan(0);
    expect(bp.interviewRoster.some((r) => r.side === "it")).toBe(true);
  });

  it("every evidence family states what it grounds", () => {
    for (const f of getDiscoveryBlueprint("AI_OPERATIONS_DECISION_SUPPORT")
      .evidenceFamilies) {
      expect(f.grounds.length).toBeGreaterThan(3);
      expect(f.likelySource.length).toBeGreaterThan(2);
    }
  });
});

describe("discovery_plan brief", () => {
  it("resolves a dedicated discovery-plan brief (not the default)", () => {
    const brief = getArtifactBrief(
      movesDiscoveryReq("AI_OPERATIONS_DECISION_SUPPORT"),
    );
    expect(brief.deliverableType).toBe("discovery_plan");
    expect(brief.requiredSections).toEqual(
      expect.arrayContaining(["evidence_request_list", "interview_guide"]),
    );
    // structure carries both the request list and the interview guide
    const keys = brief.recommendedStructure.map((s) => s.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "evidence_request_list",
        "interview_guide",
        "evidence_readiness",
      ]),
    );
    // expected tables include the request table + business and IT interview tables
    const tableKeys = brief.expectedTables.map((t) => t.key);
    expect(tableKeys).toEqual(
      expect.arrayContaining([
        "evidence_request_table",
        "interview_business",
        "interview_it",
      ]),
    );
  });

  it("embeds the archetype catalog into the section intents", () => {
    const brief = getArtifactBrief(
      movesDiscoveryReq("AI_OPERATIONS_DECISION_SUPPORT"),
    );
    const reqSection = brief.recommendedStructure.find(
      (s) => s.key === "evidence_request_list",
    );
    // the AI-Ops families flow into the brief and the data-estate family is present
    expect(reqSection?.intent).toMatch(
      /Data & analytics estate|systems landscape/i,
    );
    expect(reqSection?.expectedEvidenceFamilies).toContain(
      "data_analytics_estate",
    );
    const interview = brief.recommendedStructure.find(
      (s) => s.key === "interview_guide",
    );
    expect(interview?.intent).toMatch(/BUSINESS|IT/);
  });

  it("`evidence_request_pack` resolves to the same brief", () => {
    const req = {
      ...movesDiscoveryReq("AI_OPERATIONS_DECISION_SUPPORT"),
      deliverableType: "evidence_request_pack",
    };
    expect(getArtifactBrief(req).deliverableType).toBe("discovery_plan");
  });
});

describe("discovery_plan policy tier", () => {
  it("is a board-grade deliverable", () => {
    expect(tierForDeliverable("discovery_plan")).toBe("tier3_board_grade");
    expect(tierForDeliverable("evidence_request_pack")).toBe(
      "tier3_board_grade",
    );
  });
});
