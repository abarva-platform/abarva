import {
  __cioTowerAnswerTestHooks,
  buildCioTowerBoundaryAnswer,
  buildCioTowerRepairPrompt,
  buildCioTowerClaudePrompt,
  canonicalCioTowerTenantKey,
  classifyCioTowerBoundary,
  matchContractKey,
  parseVisibleAnswerContract,
  type CioTowerPromptContext,
} from "../answer";
import { buildModuleV6PacketContract } from "../../agent/module-v6-answer-contract";
import {
  canonicalCioTowerTenantDisplayName,
  toCioTowerMetricPacket,
} from "../metric-packet";

function context(
  overrides: Partial<CioTowerPromptContext> = {},
): CioTowerPromptContext {
  const measures = [
    {
      measure_key: "total_it_budget_fy26",
      label: "FY26 IT budget",
      description: "Committed FY26 IT budget envelope.",
      period: "fy26",
      basis: "committed",
      scope: "enterprise_envelope",
      value_numeric: "2578000000",
      value_json: { row_count: 13 },
      source_fact_keys: ["fact-1"],
      formula_version: "cio_tower_v1",
    },
    {
      measure_key: "initiative_budget_fy26",
      label: "Initiative budget",
      description: "Committed FY26 initiative budget.",
      period: "fy26",
      basis: "committed",
      scope: "initiative_portfolio",
      value_numeric: "28300000",
      value_json: { row_count: 1 },
      source_fact_keys: ["fact-1"],
      formula_version: "cio_tower_v1",
    },
    {
      measure_key: "actual_spend_ytd",
      label: "Actual spend YTD",
      description: "Actual initiative spend YTD.",
      period: "ytd",
      basis: "actual",
      scope: "initiative_portfolio",
      value_numeric: "9000000",
      value_json: { row_count: 1 },
      source_fact_keys: ["fact-actual-1"],
      formula_version: "cio_tower_v1",
    },
    {
      measure_key: "promised_value_fy26",
      label: "Promised value FY26",
      description: "Promised FY26 initiative value.",
      period: "fy26",
      basis: "forecast",
      scope: "initiative_portfolio",
      value_numeric: "270000000",
      value_json: { row_count: 1 },
      source_fact_keys: ["fact-value-1"],
      formula_version: "cio_tower_v1",
    },
    {
      measure_key: "measured_value_ytd",
      label: "Measured value YTD",
      description: "Measured value YTD.",
      period: "ytd",
      basis: "actual",
      scope: "initiative_portfolio",
      value_numeric: "91800000",
      value_json: { row_count: 1 },
      source_fact_keys: ["fact-measured-1"],
      formula_version: "cio_tower_v1",
    },
  ];
  return {
    tenantKey: "skyharbor-air",
    tenantName: "SkyHarbor Air",
    question: "give me the list of top 10 IT programs",
    contract: {
      contract_key: "tower_top_it_programs_by_budget",
      intent: "table",
      question_family: "top_it_programs_by_budget",
      measure_key: "initiative_budget_fy26",
      artifact_type: "table",
      examples: [],
    },
    measures,
    metricPackets: measures.map(toCioTowerMetricPacket),
    relevantFacts: [
      {
        fact_key: "fact-1",
        entity_key: "initiative-1",
        entity_type: "initiative",
        entity_display_name: "Crew Recovery & Legality Modernization",
        measure: "budget_fy26_usd",
        scope: "initiative",
        view: "initiative_budget",
        amount_type: "none",
        basis: "committed",
        period: "fy26",
        value_numeric: "28300000",
        value_text: null,
        unit: "usd",
        value_source: "tenant_file",
        confidence: "high",
        source_key: "source-1",
        source_row: "12",
        attributes: {},
      },
      {
        fact_key: "fact-actual-1",
        entity_key: "initiative-1",
        entity_type: "initiative",
        entity_display_name: "Crew Recovery & Legality Modernization",
        measure: "actual_spend_ytd_usd",
        scope: "initiative",
        view: "initiative_budget",
        amount_type: "none",
        basis: "actual",
        period: "ytd",
        value_numeric: "9000000",
        value_text: null,
        unit: "usd",
        value_source: "tenant_file",
        confidence: "high",
        source_key: "source-actual",
        source_row: "12",
        attributes: {
          owner_role: "VP Integration",
          evidence_status: "source cited",
          primary_blocker: "Crew legality and data readiness",
        },
      },
      {
        fact_key: "fact-value-1",
        entity_key: "initiative-1",
        entity_type: "initiative",
        entity_display_name: "Crew Recovery & Legality Modernization",
        measure: "promised_benefit_usd",
        scope: "initiative",
        view: "value",
        amount_type: "none",
        basis: "forecast",
        period: "fy26",
        value_numeric: "270000000",
        value_text: null,
        unit: "usd",
        value_source: "tenant_file",
        confidence: "high",
        source_key: "source-value",
        source_row: "12",
        attributes: {
          owner_role: "VP Integration",
          evidence_status: "source cited",
          primary_blocker: "Crew legality and data readiness",
        },
      },
      {
        fact_key: "fact-measured-1",
        entity_key: "initiative-1",
        entity_type: "initiative",
        entity_display_name: "Crew Recovery & Legality Modernization",
        measure: "measured_value_usd",
        scope: "initiative",
        view: "value",
        amount_type: "none",
        basis: "actual",
        period: "ytd",
        value_numeric: "91800000",
        value_text: null,
        unit: "usd",
        value_source: "tenant_file",
        confidence: "high",
        source_key: "source-value",
        source_row: "12",
        attributes: {
          owner_role: "VP Integration",
          evidence_status: "source cited",
          primary_blocker: "Crew legality and data readiness",
        },
      },
    ],
    relationships: [],
    gaps: ["Actual spend YTD is missing or not separately loaded."],
    v6PacketContract: buildModuleV6PacketContract({
      surface: "tower",
      packetType: "metric-read-model",
      tenantKey: "skyharbor-air",
      tenantName: "SkyHarbor Air",
      question: "give me the list of top 10 IT programs",
      packetSummary: "Test Tower metric packet.",
      requiredEvidenceFamilies: ["cio_tower.measure_results"],
      availableEvidenceFamilies: ["governed metric packets"],
      missingEvidence: [
        "Actual spend YTD is missing or not separately loaded.",
      ],
    }),
    ...overrides,
  };
}

describe("cio tower answer contract", () => {
  it("normalizes app tenant aliases into cio_tower package keys", () => {
    expect(canonicalCioTowerTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(canonicalCioTowerTenantKey("SkyHarbor Air")).toBe("skyharbor-air");
    expect(canonicalCioTowerTenantKey("lakeshore")).toBe(
      "lakeshore-holdings",
    );
    expect(canonicalCioTowerTenantKey("Lakeshore Holdings")).toBe(
      "lakeshore-holdings",
    );
    expect(canonicalCioTowerTenantKey("firstcapital")).toBe(
      "first-capital-financial",
    );
    expect(canonicalCioTowerTenantKey("First Capital Financial")).toBe(
      "first-capital-financial",
    );
    expect(canonicalCioTowerTenantKey("apexretail")).toBe("apex-retail");
    expect(canonicalCioTowerTenantKey("Apex Retail Group")).toBe("apex-retail");
    expect(canonicalCioTowerTenantKey("meridian")).toBe("meridian-health");
    expect(canonicalCioTowerTenantKey("Meridian Health System")).toBe(
      "meridian-health",
    );
  });

  it("renders real tenant names for Tower executive surfaces", () => {
    expect(canonicalCioTowerTenantDisplayName({ key: "skyharbor" })).toBe(
      "SkyHarbor Air",
    );
    expect(canonicalCioTowerTenantDisplayName({ name: "Airline Demo" })).toBe(
      "SkyHarbor Air",
    );
    expect(canonicalCioTowerTenantDisplayName({ key: "lakeshore" })).toBe(
      "Lakeshore Holdings",
    );
    expect(canonicalCioTowerTenantDisplayName({ name: "Industrial Demo" })).toBe(
      "Industrial Demo",
    );
    expect(canonicalCioTowerTenantDisplayName({ key: "firstcapital" })).toBe(
      "First Capital Financial",
    );
    expect(canonicalCioTowerTenantDisplayName({ name: "Retail Demo" })).toBe(
      "Apex Retail Group",
    );
  });

  it("instructs Claude to own every visible word and return the explicit JSON contract", () => {
    const prompt = buildCioTowerClaudePrompt(context());

    expect(prompt).toContain("Return valid JSON only");
    expect(prompt).toContain('"version": "cio_tower_visible_answer_v1"');
    expect(prompt).toContain("You own every user-visible word");
    expect(prompt).toContain(
      "AbarVa will render the strings exactly as returned",
    );
    expect(prompt).toContain(
      "It will not rewrite, summarize, scrub, relabel, infer, or improve them",
    );
    expect(prompt).toContain('Do not use the word "rows" in visible prose');
    expect(prompt).toContain(
      "Tower owns numbers. Claude owns narrative. The renderer owns presentation.",
    );
    expect(prompt).toContain(
      "Do not calculate, infer, extrapolate, smooth, or estimate spend, value, ROI",
    );
    expect(prompt).toContain(
      "Governed metric packets. These are also what the Tower dashboard uses",
    );
    expect(prompt).toContain(
      "Authoritative metric packet for this question: Initiative budget = $28.3M",
    );
    expect(prompt).toContain(
      'You MUST include the exact display value "$28.3M"',
    );
    expect(prompt).toContain("Crew Recovery & Legality Modernization");
    expect(prompt).toContain("$28.3M");
  });

  it("keeps total spend answers from mixing function/platform lines with programs", () => {
    const prompt = buildCioTowerClaudePrompt(
      context({
        question: "what is my IT spend?",
        contract: {
          contract_key: "tower_total_it_spend",
          intent: "lookup",
          question_family: "total_it_spend",
          measure_key: "total_it_budget_fy26",
          artifact_type: "answer",
          examples: [],
        },
        relevantFacts: [
          {
            fact_key: "fact-cloud",
            entity_key: "cloud-and-infrastructure",
            entity_type: "budget_line",
            entity_display_name: "Cloud And Infrastructure",
            measure: "budget_fy26_usd",
            scope: "enterprise_budget_line",
            view: "it_budget",
            amount_type: "none",
            basis: "committed",
            period: "fy26",
            value_numeric: "201200000",
            value_text: null,
            unit: "usd",
            value_source: "tenant_file",
            confidence: "high",
            source_key: "source-budget",
            source_row: "4",
            attributes: {},
          },
        ],
      }),
    );

    expect(prompt).toContain("Dashboard slice discipline");
    expect(prompt).toContain(
      "This question asks for the total IT budget/spend envelope",
    );
    expect(prompt).toContain(
      "relevant facts with view=it_budget are function/platform budget lines",
    );
    expect(prompt).toContain(
      'Do not call function/platform budget lines "programs", "initiatives", or "spending towers"',
    );
    expect(prompt).toContain(
      "Do not pull initiative/program values into this answer",
    );
  });

  it("loads only initiative budget facts for top-program budget rankings", () => {
    expect(
      __cioTowerAnswerTestHooks.factWhereForContract({
        contract_key: "tower_top_it_programs_by_budget",
        intent: "table",
        question_family: "top_it_programs_by_budget",
        measure_key: "initiative_budget_fy26",
        artifact_type: "table",
        examples: [],
      }),
    ).toEqual({ views: ["initiative_budget", "value"], limit: 120 });
    for (const contractKey of [
      "tower_portfolio_value_gap",
      "tower_weak_value_evidence",
      "tower_inspect_this_week",
      "tower_advisor_morning_brief",
    ]) {
      expect(
        __cioTowerAnswerTestHooks.factWhereForContract({
          contract_key: contractKey,
          intent: "table",
          question_family: contractKey,
          measure_key: "initiative_budget_fy26",
          artifact_type: "table",
          examples: [],
        }),
      ).toEqual({ views: ["initiative_budget", "value"], limit: 120 });
    }
  });

  it("routes IT budget slice questions to the IT-budget contract", () => {
    expect(
      matchContractKey(
        "What is the current loaded IT budget for the whole Tower portfolio?",
      ),
    ).toBe("tower_total_it_spend");
    expect(
      matchContractKey(
        "What is the current loaded IT budget for each portfolio company?",
      ),
    ).toBe("tower_total_it_spend");
    expect(
      matchContractKey(
        "What is the current loaded IT budget for each IT function?",
      ),
    ).toBe("tower_total_it_spend");
    expect(matchContractKey("Give me the list of top 10 IT programs")).toBe(
      "tower_top_it_programs_by_budget",
    );
    expect(matchContractKey("Which initiatives have the largest value gap?")).toBe(
      "tower_portfolio_value_gap",
    );
    expect(matchContractKey("Which programs have weak value evidence?")).toBe(
      "tower_weak_value_evidence",
    );
    expect(matchContractKey("What should I inspect this week?")).toBe(
      "tower_inspect_this_week",
    );
    expect(
      matchContractKey(
        "Which investment posture should the CIO take on Engineering Productivity AI, and why?",
      ),
    ).toBe("tower_advisor_morning_brief");
  });

  it("routes the Tower 100Q hardening families to explicit governed contracts", () => {
    expect(matchContractKey("What do we know about run versus change spend?")).toBe(
      "tower_run_change_split",
    );
    expect(matchContractKey("What is the budget trend from FY25 to FY26?")).toBe(
      "tower_trend_it_budget",
    );
    expect(matchContractKey("Which programs are healthy, watched, or at risk?")).toBe(
      "tower_inspect_this_week",
    );
    expect(matchContractKey("Show the programs grouped by business function.")).toBe(
      "tower_inspect_this_week",
    );
    expect(
      matchContractKey(
        "Which programs depend on foundational data or platform work?",
      ),
    ).toBe("tower_inspect_this_week");
    expect(matchContractKey("What is the committed value across the portfolio?")).toBe(
      "tower_value_realization",
    );
    expect(
      matchContractKey(
        "What is the best AI investment story Tower can support from loaded evidence?",
      ),
    ).toBe("tower_top_it_programs_by_budget");
    expect(matchContractKey("Which contracts renew soon?")).toBe(
      "tower_vendor_contract_gap",
    );
    expect(
      matchContractKey("Which vendor relationships are tied to at-risk programs?"),
    ).toBe("tower_vendor_contract_gap");
    expect(matchContractKey("What are the biggest Tower risks right now?")).toBe(
      "tower_evidence_trust",
    );
    expect(
      matchContractKey("Which Tower claims are only directional, not proven?"),
    ).toBe("tower_evidence_trust");
    expect(
      matchContractKey("Which AI initiatives are still missing value proof?"),
    ).toBe("tower_weak_value_evidence");
    expect(
      matchContractKey(
        "Which AI initiatives should leadership hold until evidence improves?",
      ),
    ).toBe("tower_weak_value_evidence");
    expect(
      matchContractKey(
        "Which initiatives have value evidence strong enough for a board discussion?",
      ),
    ).toBe("tower_weak_value_evidence");
  });

  it("does not default unmatched Tower questions to the top-program template", () => {
    expect(matchContractKey("What is the weakest point in Tower today?")).toBe(
      "tower_evidence_trust",
    );
  });

  it("persists fallback route families through live registry-backed contract keys", () => {
    expect(
      __cioTowerAnswerTestHooks.persistableTraceContractKey(
        "tower_vendor_contract_gap",
      ),
    ).toBe("tower_inspect_this_week");
    expect(
      __cioTowerAnswerTestHooks.persistableTraceContractKey(
        "tower_evidence_trust",
      ),
    ).toBe("tower_weak_value_evidence");
    expect(
      __cioTowerAnswerTestHooks.persistableTraceContractKey(
        "tower_total_it_spend",
      ),
    ).toBe("tower_total_it_spend");
  });

  it("asks Claude for a compact table when an IT budget question requests each slice", () => {
    const prompt = buildCioTowerClaudePrompt(
      context({
        question: "What is the current loaded IT budget for each IT function?",
        contract: {
          contract_key: "tower_total_it_spend",
          intent: "lookup",
          question_family: "total_it_spend",
          measure_key: "total_it_budget_fy26",
          artifact_type: "answer",
          examples: [],
        },
        relevantFacts: [
          {
            fact_key: "fact-cloud",
            entity_key: "cloud-and-infrastructure",
            entity_type: "budget_line",
            entity_display_name: "Cloud And Infrastructure",
            measure: "budget_fy26_usd",
            scope: "enterprise_budget_line",
            view: "it_budget",
            amount_type: "none",
            basis: "committed",
            period: "fy26",
            value_numeric: "201200000",
            value_text: null,
            unit: "usd",
            value_source: "tenant_file",
            confidence: "high",
            source_key: "source-budget",
            source_row: "4",
            attributes: {},
          },
        ],
      }),
    );

    expect(prompt).toContain(
      "This question asks for a budget slice, not only the headline",
    );
    expect(prompt).toContain(
      "Include a compact table using the view=it_budget facts",
    );
    expect(prompt).toContain(
      "Use the display name and exact amount from Most relevant facts",
    );
    expect(prompt).toContain("Do not invent run/change or actual-spend fields");
  });

  it("answers exact IT budget slice questions deterministically with a visible table", () => {
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question:
            "What is the current loaded IT budget for each IT function?",
          contract: {
            contract_key: "tower_total_it_spend",
            intent: "lookup",
            question_family: "total_it_spend",
            measure_key: "total_it_budget_fy26",
            artifact_type: "table",
            examples: [],
          },
          relevantFacts: [
            {
              fact_key: "fact-cloud",
              entity_key: "cloud-and-infrastructure",
              entity_type: "budget_line",
              entity_display_name: "Cloud And Infrastructure",
              measure: "budget_fy26_usd",
              scope: "enterprise_budget_line",
              view: "it_budget",
              amount_type: "none",
              basis: "committed",
              period: "fy26",
              value_numeric: "201200000",
              value_text: null,
              unit: "usd",
              value_source: "tenant_file",
              confidence: "high",
              source_key: "source-budget",
              source_row: "4",
              attributes: {},
            },
          ],
        }),
      );

    expect(output?.reason).toContain("Exact budget-slice question");
    expect(output?.output.answer).toContain("$2.6B");
    expect(output?.output.answer).not.toContain("rows");
    expect(output?.output.tables).toEqual([
      {
        id: "it_budget_slices",
        title: "Loaded FY26 IT budget slices",
        columns: ["Slice", "FY26 budget", "Basis", "Confidence"],
        rows: [["Cloud And Infrastructure", "$201.2M", "committed", "high"]],
      },
    ]);
  });

  it("routes IT budget lineage questions to the governed total-budget packet", () => {
    expect(
      matchContractKey("Show metric lineage for the IT budget answer."),
    ).toBe("tower_total_it_spend");
    expect(matchContractKey("Where did the IT budget number come from?")).toBe(
      "tower_total_it_spend",
    );
  });

  it("answers IT budget lineage deterministically from the metric packet", () => {
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question: "Show metric lineage for the IT budget answer.",
          contract: {
            contract_key: "tower_total_it_spend",
            intent: "lookup",
            question_family: "total_it_spend",
            measure_key: "total_it_budget_fy26",
            artifact_type: "answer",
            examples: [],
          },
        }),
      );

    expect(output?.reason).toBe(
      "Exact budget metric lineage answered from governed Tower metric packet.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air's loaded FY26 IT budget is $2.6B",
    );
    expect(output?.output.answer).toContain("governed Tower budget measure");
    expect(output?.output.answer).not.toContain("packet");
    expect(output?.output.answer).toContain("formula version cio_tower_v1");
    expect(output?.output.answer).toContain("1 supporting Tower fact");
    expect(output?.output.tables).toEqual([
      {
        id: "it_budget_metric_lineage",
        title: "IT budget metric lineage",
        columns: [
          "Metric",
          "Value",
          "Period",
          "Basis",
          "Formula version",
          "Supporting facts",
        ],
        rows: [
          ["FY26 IT budget", "$2.6B", "fy26", "committed", "cio_tower_v1", "1"],
        ],
      },
    ]);
  });

  it("answers top program budget rankings deterministically from loaded Tower facts", () => {
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question: "Give me the list of top 10 IT programs by budget.",
        }),
      );

    expect(output?.reason).toBe(
      "Top program budget question answered from loaded Tower program budget facts.",
    );
    expect(output?.output.answer).toContain(
      "Crew Recovery & Legality Modernization",
    );
    expect(output?.output.answer).toContain("$28.3M");
    expect(output?.output.answer).toContain(
      "The full FY26 initiative budget in Tower is $28.3M",
    );
    expect(output?.output.answer).toContain(
      "The loaded FY26 program budget in this ranked cut is $28.3M",
    );
    expect(output?.output.answer).not.toContain("initiative-1");
    expect(output?.output.tables).toEqual([
      {
        id: "top_it_programs_by_budget",
        title: "Top IT programs by budget and value proof",
        columns: [
          "Rank",
          "Program",
          "Owner",
          "FY26 budget",
          "Actual spend YTD",
          "Promised value",
          "Measured value",
          "Value gap",
          "Burn rate",
          "Realization rate",
          "Value per $ spent",
          "Evidence",
          "Inspect because",
        ],
        rows: [
          [
            "1",
            "Crew Recovery & Legality Modernization",
            "VP Integration",
            "$28.3M",
            "$9.0M",
            "$270.0M",
            "$91.8M",
            "$178.2M",
            "32%",
            "34%",
            "10.20x",
            "source cited",
            "Promised value is ahead of measured value.",
          ],
        ],
      },
    ]);
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: context().contract.contract_key,
        metricPackets: context().metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("answers CIO advisor posture from the governed morning brief path", () => {
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question:
            "Which investment posture should the CIO take on Crew Recovery & Legality Modernization, and why?",
          contract: {
            contract_key: "tower_advisor_morning_brief",
            intent: "diagnose",
            question_family: "advisor_morning_brief",
            measure_key: "initiative_budget_fy26",
            artifact_type: "table",
            examples: [],
          },
        }),
      );

    expect(output?.reason).toContain("CIO Morning Brief");
    expect(output?.output.answer).toContain(
      "SkyHarbor Air should inspect before scaling on Crew Recovery & Legality Modernization",
    );
    expect(output?.output.answer).toContain("$28.3M");
    expect(output?.output.answer).toContain("$9.0M");
    expect(output?.output.answer).toContain("$270.0M");
    expect(output?.output.answer).toContain("$91.8M");
    expect(output?.output.answer).not.toContain("rows");
    expect(output?.output.tables?.[0]).toMatchObject({
      id: "cio_morning_brief",
      title: "CIO morning brief",
    });
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: "tower_advisor_morning_brief",
        metricPackets: context().metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("keeps the full initiative budget visible when ranked rows are only a cut", () => {
    const baseContext = context();
    const ctx = context({
      measures: baseContext.measures.map((measure) =>
        measure.measure_key === "initiative_budget_fy26"
          ? { ...measure, value_numeric: "1000000000" }
          : measure,
      ),
      metricPackets: baseContext.measures.map((measure) =>
        toCioTowerMetricPacket(
          measure.measure_key === "initiative_budget_fy26"
            ? { ...measure, value_numeric: "1000000000" }
            : measure,
        ),
      ),
    });
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.output.answer).toContain(
      "The full FY26 initiative budget in Tower is $1.0B",
    );
    expect(output?.output.answer).toContain(
      "The loaded FY26 program budget in this ranked cut is $28.3M",
    );
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: ctx.contract.contract_key,
        metricPackets: ctx.metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("answers largest value-gap questions from the portfolio value pack", () => {
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question: "Which initiatives have the largest value gap?",
          contract: {
            contract_key: "tower_portfolio_value_gap",
            intent: "table",
            question_family: "portfolio_value_gap",
            measure_key: "promised_value_fy26",
            artifact_type: "table",
            examples: [],
          },
        }),
      );

    expect(output?.reason).toBe(
      "Largest value gap answered from governed Tower initiative budget and value facts.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air's largest loaded value gap is Crew Recovery & Legality Modernization at $178.2M.",
    );
    expect(output?.output.answer).toContain(
      "promised value $270.0M, measured value $91.8M, actual spend YTD $9.0M",
    );
    expect(output?.output.tables?.[0]?.id).toBe("portfolio_value_value_gap");
    expect(output?.output.tables?.[0]?.rows[0]).toEqual([
      "1",
      "Crew Recovery & Legality Modernization",
      "VP Integration",
      "$28.3M",
      "$9.0M",
      "$270.0M",
      "$91.8M",
      "$178.2M",
      "32%",
      "34%",
      "10.20x",
      "source cited",
      "Promised value is ahead of measured value.",
    ]);
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: "tower_portfolio_value_gap",
        metricPackets: context().metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("answers spend/value proof questions deterministically from governed value facts", () => {
    expect(
      matchContractKey(
        "Where is spend producing value, and where should leadership press for proof?",
      ),
    ).toBe("tower_value_realization");

    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question:
            "Where is spend producing value, and where should leadership press for proof?",
          contract: {
            contract_key: "tower_value_realization",
            intent: "diagnose",
            question_family: "value_realization",
            measure_key: "measured_value_ytd",
            artifact_type: "table",
            examples: [],
          },
        }),
      );

    expect(output?.reason).toBe(
      "Value-realization question answered from governed Tower budget, spend, promised value, and measured value facts.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air should press for value proof first on Crew Recovery & Legality Modernization.",
    );
    expect(output?.output.answer).toContain(
      "promised value $270.0M, measured value $91.8M, actual spend YTD $9.0M",
    );
    expect(output?.output.answer).not.toContain("calculated ROI");
    expect(output?.output.tables?.[0]?.title).toBe(
      "Portfolio items to inspect this week",
    );
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: "tower_value_realization",
        metricPackets: context().metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("answers board-ready value proof questions without old brands or visible scaffolding", () => {
    const baseCtx = context({
      question:
        "Which initiatives have value evidence strong enough for a board discussion?",
      contract: {
        contract_key: "tower_weak_value_evidence",
        intent: "table",
        question_family: "weak_value_evidence",
        measure_key: "measured_value_ytd",
        artifact_type: "table",
        examples: [],
      },
    });
    const metricPackets = baseCtx.measures.map((row) =>
      toCioTowerMetricPacket(
        row.measure_key === "promised_value_fy26"
          ? { ...row, value_numeric: "999000000" }
          : row.measure_key === "measured_value_ytd"
            ? { ...row, value_numeric: "14900000" }
            : row,
      ),
    );
    const ctx = { ...baseCtx, metricPackets };
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.reason).toBe(
      "Value-proof governance question answered from governed Tower initiative and value facts.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air should not treat budget alone as board-ready value proof.",
    );
    expect(output?.output.answer).toContain(
      "Tower totals in view: promised value $999.0M, measured value $14.9M.",
    );
    expect(output?.output.answer).not.toMatch(/Nexus|Moves|Next move|Read:|Evidence:/i);
    expect(output?.output.tables?.[0]?.title).toBe(
      "Initiatives with weakest value evidence",
    );
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: ctx.contract.contract_key,
        metricPackets: ctx.metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("answers no-measured-value-evidence questions without internal contract language", () => {
    const ctx = context({
      question: "Which programs have no measured value evidence?",
      contract: {
        contract_key: "tower_weak_value_evidence",
        intent: "table",
        question_family: "weak_value_evidence",
        measure_key: "measured_value_ytd",
        artifact_type: "table",
        examples: [],
      },
    });
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.reason).toBe(
      "Value-proof governance question answered from governed Tower initiative and value facts.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air should hold additional scale decisions where portfolio spend is ahead of measured value evidence.",
    );
    expect(output?.output.answer).not.toMatch(/read[- ]model|rows?|loaded evidence|Next move|Read:/i);
    expect(output?.output.tables?.[0]?.title).toBe(
      "Initiatives with weakest value evidence",
    );
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: ctx.contract.contract_key,
        metricPackets: ctx.metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("returns a specific AI value-proof gap when governed AI item detail is absent", () => {
    const ctx = context({
      question:
        "Which AI initiatives should leadership hold until evidence improves?",
      contract: {
        contract_key: "tower_weak_value_evidence",
        intent: "table",
        question_family: "weak_value_evidence",
        measure_key: "measured_value_ytd",
        artifact_type: "table",
        examples: [],
      },
      relevantFacts: [],
    });
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.reason).toBe(
      "Value-proof governance question answered as a specific governed Tower gap.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air cannot safely rank AI initiatives for this question yet.",
    );
    expect(output?.output.answer).toContain(
      "treat this as a value-proof governance gap, not an investment ranking.",
    );
    expect(output?.output.answer).not.toMatch(
      /Nexus|Moves|Next move|Read:|Evidence:|source table|initiative-\d/i,
    );
    expect(output?.output.tables).toEqual([
      {
        id: "ai_value_proof_required",
        title: "AI value proof needed before scale decisions",
        columns: [
          "Leadership question",
          "Required evidence",
          "Current Tower answer",
        ],
        rows: [
          [
            "Which AI items should be held?",
            "Named initiative, owner, budget, promised value, measured value, and evidence quality",
            "Not enough governed value proof to rank safely",
          ],
          [
            "Can value be claimed?",
            "Finance-accepted measured value tied to the initiative",
            "Treat missing measured value as a proof gap",
          ],
          [
            "Can funding continue?",
            "Budget burn, blocker, owner, and next funding gate",
            "Inspect the value proof before approving more spend",
          ],
        ],
      },
    ]);
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: ctx.contract.contract_key,
        metricPackets: ctx.metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("answers inspect-this-week questions with an inspection reason", () => {
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question: "What should I inspect this week?",
          contract: {
            contract_key: "tower_inspect_this_week",
            intent: "table",
            question_family: "inspect_this_week",
            measure_key: "initiative_budget_fy26",
            artifact_type: "table",
            examples: [],
          },
        }),
      );

    expect(output?.reason).toBe(
      "Inspection priority answered from governed Tower budget, spend, and value facts.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air should inspect Crew Recovery & Legality Modernization first.",
    );
    expect(output?.output.tables?.[0]?.title).toBe(
      "Portfolio items to inspect this week",
    );
    expect(output?.output.tables?.[0]?.columns).toContain("Inspect because");
    expect(output?.output.tables?.[0]?.rows[0]?.[12]).toBe(
      "Promised value is ahead of measured value.",
    );
  });

  it("answers top AI program questions with an AI-specific ranked table and requested limit", () => {
    const base = context().relevantFacts[0]!;
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(
        context({
          question: "give me the list of top 5 AI programs by spend and value",
          relevantFacts: [
            {
              ...base,
              fact_key: "non-ai-budget",
              entity_key: "initiative-non-ai",
              entity_display_name: "Core Network Refresh",
              value_numeric: "90000000",
              attributes: {
                record_name: "Core Network Refresh",
                portfolio_segment: "infrastructure",
              },
            },
            ...Array.from({ length: 6 }, (_, index) => ({
              ...base,
              fact_key: `ai-budget-${index + 1}`,
              entity_key: `initiative-ai-${index + 1}`,
              entity_display_name: `AI Program ${index + 1}`,
              value_numeric: String(60_000_000 - index * 1_000_000),
              attributes: {
                record_name: `AI Program ${index + 1}`,
                portfolio_segment: "corporate_ai",
                owner_role: "CIO",
              },
            })),
          ],
        }),
      );

    expect(output?.reason).toBe(
      "Top AI program budget question answered from loaded Tower program budget and value facts.",
    );
    expect(output?.output.answer).toContain(
      "SkyHarbor Air's top loaded AI program",
    );
    expect(output?.output.answer).toContain(
      "The full FY26 initiative budget in Tower is $28.3M",
    );
    expect(output?.output.answer).toContain(
      "AI-program budget in this ranked cut",
    );
    expect(output?.output.answer).not.toContain("Core Network Refresh");
    expect(output?.output.tables?.[0]?.id).toBe("top_ai_programs_by_budget");
    expect(output?.output.tables?.[0]?.title).toBe(
      "Top AI programs by budget and value proof",
    );
    expect(output?.output.tables?.[0]?.rows).toHaveLength(5);
    expect(output?.output.tables?.[0]?.rows.map((row) => row[1])).toEqual([
      "AI Program 1",
      "AI Program 2",
      "AI Program 3",
      "AI Program 4",
      "AI Program 5",
    ]);
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: context().contract.contract_key,
        metricPackets: context().metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("scrubs code-shaped loaded program names before visible validation", () => {
    const ctx = context({
      relevantFacts: [
        {
          ...context().relevantFacts[0],
          entity_display_name: "AOG-IRROPS-01",
          attributes: {
            initiative_name: "Crew Recovery Modernization",
          },
        },
      ],
    });
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.output.answer).toContain("Crew Recovery Modernization");
    expect(output?.output.answer).not.toContain("AOG-IRROPS-01");
    expect(output?.output.tables?.[0]?.rows[0]?.[1]).toBe(
      "Crew Recovery Modernization",
    );
    expect(
      __cioTowerAnswerTestHooks.validateParsedVisibleAnswer({
        contractKey: ctx.contract.contract_key,
        metricPackets: ctx.metricPackets,
        parsedOutput: output!.output,
      }),
    ).toEqual([]);
  });

  it("uses V6 business metadata names when entity labels are code-shaped", () => {
    const ctx = context({
      relevantFacts: [
        {
          ...context().relevantFacts[0],
          entity_display_name: "SHA-PROG-CTO-002",
          attributes: {
            record_name: "IROPS Data Foundation",
            program_name: "Do not prefer this when record_name exists",
          },
        },
      ],
    });
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.output.answer).toContain("IROPS Data Foundation");
    expect(output?.output.answer).not.toContain("SHA-PROG-CTO-002");
    expect(output?.output.answer).not.toContain("Loaded program");
    expect(output?.output.tables?.[0]?.rows[0]?.[1]).toBe(
      "IROPS Data Foundation",
    );
  });

  it("uses source labels as a readable fallback for governed Tower amount facts", () => {
    const ctx = context({
      relevantFacts: [
        {
          ...context().relevantFacts[0],
          entity_key: null,
          entity_display_name: null,
          attributes: {
            source_label: "IROPS Agentic Recovery Cockpit",
          },
        },
      ],
    });
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.output.answer).toContain("IROPS Agentic Recovery Cockpit");
    expect(output?.output.answer).not.toContain("Program name not loaded");
    expect(output?.output.tables?.[0]?.rows[0]?.[1]).toBe(
      "IROPS Agentic Recovery Cockpit",
    );
  });

  it("does not invent program labels when no V6 business metadata name is loaded", () => {
    const ctx = context({
      relevantFacts: [
        {
          ...context().relevantFacts[0],
          entity_display_name: "SHA-PROG-CTO-999",
          attributes: {},
        },
      ],
    });
    const output =
      __cioTowerAnswerTestHooks.buildCioTowerDeterministicMetricAnswer(ctx);

    expect(output?.output.answer).toContain("Program name not loaded");
    expect(output?.output.answer).not.toContain("Loaded program");
    expect(output?.output.answer).not.toContain("SHA-PROG-CTO-999");
    expect(output?.output.tables?.[0]?.rows[0]?.[1]).toBe(
      "Program name not loaded",
    );
  });

  it("builds a repair prompt that asks Claude to fix, not the renderer to mutate", () => {
    const originalPrompt = buildCioTowerClaudePrompt(context());
    const repairPrompt = buildCioTowerRepairPrompt({
      originalPrompt,
      rawModelOutput:
        '{"version":"cio_tower_visible_answer_v1","answer":"Budget is $28.3 million across rows."}',
      validationErrors: [
        "metric_packet_value_missing:initiative_budget_fy26:$28.3M",
        "internal_data_plane_language",
      ],
    });

    expect(repairPrompt).toContain("Return one corrected JSON object only");
    expect(repairPrompt).toContain(
      "metric_packet_value_missing:initiative_budget_fy26:$28.3M",
    );
    expect(repairPrompt).toContain(
      "include its display value exactly as written",
    );
    expect(repairPrompt).toContain(
      "The renderer will place the JSON strings exactly as you return them",
    );
    expect(repairPrompt).toContain(
      'Do not use the word "rows" in visible prose',
    );
    expect(repairPrompt).toContain(originalPrompt);
  });

  it("parses the visible answer contract without changing prose or table labels", () => {
    const raw = JSON.stringify({
      version: "cio_tower_visible_answer_v1",
      answer: "SkyHarbor has three material IT programs to inspect first.",
      tables: [
        {
          id: "top_programs",
          title: "Top IT programs",
          columns: ["Program", "Budget"],
          rows: [["Crew Recovery & Legality Modernization", "$28.3M"]],
        },
      ],
      tabs: [
        {
          id: "risk",
          label: "Risk read",
          prose: "The largest risk is spending past value proof.",
          tables: [],
        },
      ],
      followUpQuestion: "Do you want the value-proof view next?",
    });

    expect(parseVisibleAnswerContract(raw)).toEqual({
      version: "cio_tower_visible_answer_v1",
      answer: "SkyHarbor has three material IT programs to inspect first.",
      tables: [
        {
          id: "top_programs",
          title: "Top IT programs",
          columns: ["Program", "Budget"],
          rows: [["Crew Recovery & Legality Modernization", "$28.3M"]],
        },
      ],
      tabs: [
        {
          id: "risk",
          label: "Risk read",
          prose: "The largest risk is spending past value proof.",
          tables: [],
        },
      ],
      followUpQuestion: "Do you want the value-proof view next?",
    });
  });

  it("extracts a JSON answer contract from a Claude preamble without changing visible prose", () => {
    const raw = [
      "Here is the JSON contract:",
      JSON.stringify({
        version: "cio_tower_visible_answer_v1",
        answer:
          "SkyHarbor should inspect the two largest program commitments first.",
        tables: [],
        tabs: [],
        followUpQuestion: null,
      }),
      "No other text should render.",
    ].join("\n");

    expect(parseVisibleAnswerContract(raw)).toEqual({
      version: "cio_tower_visible_answer_v1",
      answer:
        "SkyHarbor should inspect the two largest program commitments first.",
      tables: [],
      tabs: [],
      followUpQuestion: null,
    });
  });

  it("routes non-Tower surface prompts to deterministic boundary contracts before Claude", () => {
    expect(
      classifyCioTowerBoundary(
        "Which AI investments should leadership scale, hold, or stop? If Tower is not the right surface, route me to Intelligence.",
      ),
    ).toEqual({
      target: "Intelligence",
      reason:
        "The question asks for advisory interpretation, patterns, benchmarks, or strategy options.",
    });

    const output = buildCioTowerBoundaryAnswer({
      target: "Intelligence",
      reason:
        "The question asks for advisory interpretation, patterns, benchmarks, or strategy options.",
    });

    expect(output.answer).toContain("That belongs in Intelligence, not Tower");
    expect(output.answer).not.toContain("$28.3M");
    expect(output.answer).not.toContain("rows");
  });

  it("refuses safety prompts without leaking Tower metrics or internal identifiers", () => {
    const route = classifyCioTowerBoundary(
      "Use raw initiative IDs in the executive summary.",
    );
    expect(route).toEqual({
      target: "Safety",
      reason:
        "The question asks Tower to bypass tenant, evidence, or visible-answer guardrails.",
    });

    const output = buildCioTowerBoundaryAnswer(route!);
    expect(output.answer).toContain("I cannot do that.");
    expect(output.answer).not.toContain("T01-R05");
    expect(output.answer).not.toContain("$28.3M");
    expect(output.answer).not.toContain("Atlas");
  });
});
