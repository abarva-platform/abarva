import {
  CXO_BASE_PROMPT_PACKET_KEYS,
  MOVES_SOLUTION_BUSINESS_CASE_STORY_CONTRACT,
  SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT,
  validateCxoStoryContract,
  type CxoArtifactStorytellingContract,
} from "../cxo-storytelling-contract";

function completePayload(contract: CxoArtifactStorytellingContract) {
  return {
    contract,
    storyElements: contract.requiredStoryElements,
    businessImpacts: contract.requiredBusinessImpacts,
    exhibits: contract.requiredExhibits,
    promptPacketKeys: [...CXO_BASE_PROMPT_PACKET_KEYS],
  };
}

describe("CXO artifact storytelling contract", () => {
  it("accepts the complete Source contract optimization advisory spine", () => {
    const result = validateCxoStoryContract(
      completePayload(SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT),
    );

    expect(result.ok).toBe(true);
    expect(SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT.firstFivePages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Where Money Is Leaking",
          requiredExhibits: expect.arrayContaining([
            "value_tree",
            "exposure_bridge",
            "trend_chart",
          ]),
        }),
        expect.objectContaining({
          name: "What Should Happen",
          requiredExhibits: expect.arrayContaining(["timeline"]),
        }),
        expect.objectContaining({
          name: "Commercial Negotiation Strategy",
          requiredExhibits: expect.arrayContaining([
            "opportunity_map",
            "business_impact_scorecard",
          ]),
        }),
      ]),
    );
  });

  it("fails Source contract optimization when it only has facts and not the advisory story", () => {
    const result = validateCxoStoryContract({
      contract: SOURCE_CONTRACT_OPTIMIZATION_STORY_CONTRACT,
      storyElements: [
        "executive_message",
        "where_value_is_moving",
        "evidence_and_caveats",
      ],
      businessImpacts: ["cost"],
      exhibits: ["decision_card", "exposure_bridge", "trend_chart"],
      promptPacketKeys: ["executiveMessage", "visualExhibits", "evidenceBasis"],
    });

    expect(result.ok).toBe(false);
    expect(result.missingStoryElements).toEqual(
      expect.arrayContaining([
        "why_it_happened",
        "what_should_happen",
        "commercial_opportunity_map",
        "if_we_do_nothing",
        "business_impact",
      ]),
    );
    expect(result.missingBusinessImpacts).toEqual(
      expect.arrayContaining(["risk", "speed", "compliance"]),
    );
    expect(result.missingExhibits).toEqual(
      expect.arrayContaining([
        "value_tree",
        "root_cause_map",
        "timeline",
        "opportunity_map",
        "scenario_comparison",
        "business_impact_scorecard",
      ]),
    );
    expect(result.missingPromptPacketKeys).toEqual(
      expect.arrayContaining([
        "decisionAsk",
        "storySpine",
        "businessImpact",
        "knownGaps",
        "forbiddenClaims",
      ]),
    );
  });

  it("requires Moves solution and business-case artifacts to include architecture, roadmap, scenario and do-nothing logic", () => {
    const result = validateCxoStoryContract(
      completePayload(MOVES_SOLUTION_BUSINESS_CASE_STORY_CONTRACT),
    );

    expect(result.ok).toBe(true);
    expect(MOVES_SOLUTION_BUSINESS_CASE_STORY_CONTRACT.requiredExhibits).toEqual(
      expect.arrayContaining([
        "architecture_diagram",
        "roadmap_swimlane",
        "scenario_comparison",
        "business_impact_scorecard",
      ]),
    );
    expect(MOVES_SOLUTION_BUSINESS_CASE_STORY_CONTRACT.firstFivePages[4]).toEqual(
      expect.objectContaining({
        name: "What Happens If We Do Nothing",
        requiredStoryElement: "if_we_do_nothing",
      }),
    );
  });
});
