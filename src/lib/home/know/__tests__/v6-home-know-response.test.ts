import { shapeHomeKnowResponseForRender } from "@/lib/home/know/home-render-layer-shaper";
import { answerHomeKnowFromV6 } from "@/lib/home/know/v6-home-ask";
import { toHomeKnowResponseFromV6 } from "@/lib/home/know/v6-home-know-response";

describe("Home V6 KNOW response contract", () => {
  it("adapts the V6 dataset contract into the HomeKnowResponse shape without legacy fallback", () => {
    const result = answerHomeKnowFromV6({
      tenantKey: "skyharbor",
      question: "What AI footprint do we have loaded?",
      includeTrace: true,
    });

    const response = toHomeKnowResponseFromV6(result, {
      question: "What AI footprint do we have loaded?",
    });

    expect(response.mode).toBe("KNOW");
    expect(response.tenantKey).toBe("skyharbor");
    expect(response.prose).toBe(result.answer.directAnswer);
    expect(response.tables).toHaveLength(1);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.safety.composerTrace?.composer).toBe(
      "home_v6_dataset_contract",
    );
    expect(response.safety.composerTrace?.fallbackUsed).toBe(false);
    expect(response.safety.composerTrace?.reason).toContain(
      "oldSemanticLayersSunset=true",
    );
    expect(response.safety.composerTrace?.reason).toContain(
      "datasetDir=skyharbor-air-synthetic-v6",
    );
  });

  it("keeps V6-visible sections byte-stable through the Home render shaper", () => {
    const result = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
      question: "How is our IT organization structured today?",
      includeTrace: true,
    });
    const response = toHomeKnowResponseFromV6(result, {
      question: "How is our IT organization structured today?",
    });
    const before = JSON.stringify({
      prose: response.prose,
      tables: response.tables,
      gaps: response.gaps,
      citations: response.citations,
    });

    const shaped = shapeHomeKnowResponseForRender(response);

    const after = JSON.stringify({
      prose: shaped.prose,
      tables: shaped.tables,
      gaps: shaped.gaps,
      citations: shaped.citations,
    });
    expect(after).toBe(before);
  });

  it("adds answerability and context quality without changing visible render content", () => {
    const result = answerHomeKnowFromV6({
      tenantKey: "skyharbor",
      question:
        "Should Tower evaluate the spend and value proof for these AI initiatives?",
      includeTrace: true,
    });
    const response = toHomeKnowResponseFromV6(result, {
      question:
        "Should Tower evaluate the spend and value proof for these AI initiatives?",
    });

    expect(response.answerability).toBe("requires_tower");
    expect(response.contextQuality?.recommendedHandoff?.target).toBe("tower");
    expect(response.contextQuality?.summary).toContain(
      result.tenant.displayName,
    );
    expect(response.safety.composerTrace?.reason).toContain(
      "answerability=requires_tower",
    );
    expect(response.safety.composerTrace?.reason).toContain("contextQuality=");

    const shaped = shapeHomeKnowResponseForRender(response);
    expect(shaped.prose).toBe(response.prose);
    expect(shaped.contextQuality).toEqual(response.contextQuality);
    expect(shaped.answerability).toBe("requires_tower");
  });

  it("classifies spend and value questions as planning-grade when V6 evidence is thin", () => {
    const response = toHomeKnowResponseFromV6(
      answerHomeKnowFromV6({
        tenantKey: "skyharbor",
        question:
          "What budget, spend, or value can be claimed today versus what needs Finance signoff?",
        includeTrace: true,
      }),
      {
        question:
          "What budget, spend, or value can be claimed today versus what needs Finance signoff?",
      },
    );

    expect(response.answerability).toBe("planning_grade_only");
    expect(response.contextQuality?.thinDimensions.length).toBeGreaterThan(0);
    expect(response.contextQuality?.dimensions[0].blockedAnswerTypes).toContain(
      "board-grade value claim",
    );
  });

  it("classifies explicit data-thin questions as data-thin rather than confident", () => {
    const response = toHomeKnowResponseFromV6(
      answerHomeKnowFromV6({
        tenantKey: "lakeshore",
        question: "What is data-thin and should be caveated?",
        includeTrace: true,
      }),
      { question: "What is data-thin and should be caveated?" },
    );

    expect(response.answerability).toBe("data_thin");
    expect(response.contextQuality?.overall).toBe("thin");
    expect(response.contextQuality?.dimensions[0].blockedAnswerTypes).toContain(
      "confident answer",
    );
  });

  it("routes vendor commercial questions to Source as a first-class Home handoff", () => {
    const response = toHomeKnowResponseFromV6(
      answerHomeKnowFromV6({
        tenantKey: "lakeshore",
        question: "What vendor and contract evidence should Source take over?",
        includeTrace: true,
      }),
      {
        question: "What vendor and contract evidence should Source take over?",
      },
    );

    expect(response.answerability).toBe("requires_source");
    expect(response.handoff?.target).toBe("source");
    expect(response.contextQuality?.recommendedHandoff?.target).toBe("source");
  });

  it("blocks general-knowledge trivia instead of answering or using loaded context", () => {
    const result = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
      question: "What is the capital of Uganda?",
      includeTrace: true,
    });
    const response = toHomeKnowResponseFromV6(result, {
      question: "What is the capital of Uganda?",
    });

    expect(result.proof.questionIntent).toBe("unsupported");
    expect(result.answer.answerability).toBe("unsupported");
    expect(response.prose).toContain("Home is a context browser");
    expect(response.prose).toContain("does not answer general knowledge");
    expect(response.prose).not.toMatch(/Kampala/i);
  });

  it("hands generic use-case investment judgment to Intelligence", () => {
    const result = answerHomeKnowFromV6({
      tenantKey: "lakeshore",
      question: "Which AI use cases should we fund and scale first?",
      includeTrace: true,
    });
    const response = toHomeKnowResponseFromV6(result, {
      question: "Which AI use cases should we fund and scale first?",
    });

    expect(result.proof.questionIntent).toBe("handoff_intelligence");
    expect(response.answerability).toBe("requires_intelligence");
    expect(response.handoff?.target).toBe("intelligence");
    expect(response.prose).toContain("Intelligence owns");
  });

  it("resolves Financial Services demo aliases to the canonical V6 dataset", () => {
    for (const tenantKey of ["arcturus", "firstcapital", "first-capital"]) {
      const result = answerHomeKnowFromV6({
        tenantKey,
        question:
          "What business context is available for Financial Services Demo?",
        includeTrace: true,
      });

      expect(result.tenant.appClientKey).toBe("arcturus");
      expect(result.tenant.displayName).toBe("Financial Services Demo");
      expect(result.tenant.datasetDir).toBe(
        "first-capital-financial-synthetic-v6",
      );
      expect(result.proof.datasetDir).toBe(
        "first-capital-financial-synthetic-v6",
      );
    }
  });

  it("keeps visible V6 data-estate and source-trail fields free of raw ids and file paths", () => {
    const dataEstate = toHomeKnowResponseFromV6(
      answerHomeKnowFromV6({
        tenantKey: "apexretail",
        question: "What data estate and integration evidence is loaded?",
        includeTrace: true,
      }),
      { question: "What data estate and integration evidence is loaded?" },
    );
    const sourceTrail = toHomeKnowResponseFromV6(
      answerHomeKnowFromV6({
        tenantKey: "skyharbor",
        question: "What source trail supports these Home answers?",
        includeTrace: true,
      }),
      { question: "What source trail supports these Home answers?" },
    );

    const visible = JSON.stringify({
      dataEstateProse: dataEstate.prose,
      dataEstateTables: dataEstate.tables,
      sourceTrailProse: sourceTrail.prose,
      sourceTrailTables: sourceTrail.tables,
    });

    expect(visible).not.toMatch(/\b[A-Z]{2,}-IT-\d+\b/);
    expect(visible).not.toMatch(/\bAPP-\d+\b/);
    expect(visible).not.toMatch(/\.csv\b|datasets\//i);
    expect(visible).toContain("Technology owner reference");
    expect(visible).toContain("Data-thin");
  });

  it("uses explicit surface ownership language for Home handoffs", () => {
    const response = toHomeKnowResponseFromV6(
      answerHomeKnowFromV6({
        tenantKey: "skyharbor",
        question: "Which facts are relevant to a strategic Move?",
        includeTrace: true,
      }),
      { question: "Which facts are relevant to a strategic Move?" },
    );

    expect(response.prose).toContain("Moves owns");
    expect(response.prose).toContain(
      "Home should only ground the loaded V6 facts and evidence gaps.",
    );
  });

  it("routes common Home question types to the intended V6 topics", () => {
    const cases = [
      {
        question:
          "What relationships between systems, vendors, and business areas are loaded?",
        expectedDimension: "relationships",
        expectedText: "relationship",
      },
      {
        question: "What should Intelligence take over from Home?",
        expectedDimension: "ai_initiatives",
        expectedText: "Intelligence owns",
      },
      {
        question: "What should Tower evaluate from this context?",
        expectedDimension: "ai_initiatives",
        expectedText: "Tower owns",
      },
      {
        question:
          "Give me a board-ready summary of what Home knows and cannot prove yet.",
        expectedDimension: "board_summary",
        expectedText: "board",
      },
      {
        question:
          "What business context is available for Financial Services Demo?",
        expectedDimension: "enterprise_profile",
        expectedText: "Loaded profile context",
      },
    ];

    for (const testCase of cases) {
      const result = answerHomeKnowFromV6({
        tenantKey: "arcturus",
        question: testCase.question,
        includeTrace: true,
      });

      expect(result.answer.primaryDimension).toBe(testCase.expectedDimension);
      expect(result.answer.directAnswer.toLowerCase()).toContain(
        testCase.expectedText.toLowerCase(),
      );
    }
  });
});
