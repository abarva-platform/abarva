import {
  applyPartialEvidencePolicy,
  buildCurrentStateAdvisory,
  classifyAbarvaAnswerMode,
  CHART_OUTPUT_CONTRACT,
  CXO_ANSWER_QUALITY_CONTRACT,
  enforceDecisionGradeAnswer,
  INDUSTRY_TREND_TO_AI_BETS_CONTRACT,
  isBroadCurrentStateQuestion,
  isIndustryTrendToAiBetsAsk,
  isStrategyToAbarvaSolutionAsk,
  isStrategyToMovesExecutionAsk,
  needsAbarvaSolutionGuidance,
  sanitizeAskSynthesis,
  STRATEGY_TO_ABARVA_SOLUTION_CONTRACT,
  STRATEGY_TO_MOVES_EXECUTION_CONTRACT,
} from "./response-policy";
import type { AskSource } from "./types";

const surfaceSources: AskSource[] = [
  {
    type: "SURFACE",
    name: "Apex Retail live Intelligence surface",
    id: "brief",
    confidence: 0.99,
    detail: [
      "Active Intelligence surface: brief.",
      "- Active client: Apex Retail.",
      "- Brief: 3 ranked bets above the line, 5 below the line, 3 triggered patterns.",
      "- Brief synthesis: aVa sees Apex Retail priorities above the line: fix customer identity before scaling loyalty AI, sequence demand sensing through data readiness, and make the AI roadmap honest about platform prerequisites.",
    ].join("\n"),
  },
  {
    type: "TENANT",
    name: "Apex Retail 360 Intelligence substrate",
    id: "apexretail",
    confidence: 0.96,
    detail: [
      "Tenant 360: Apex Retail.",
      "- Executive posture: CMO wants loyalty and personalization outcomes, CTO owns platform/CDP plumbing, CFO wants cost-takeout evidence, CIO is sequencing platform modernization.",
      "- Current strategic center: resolve customer identity and consent, decide the integration hub, sequence demand sensing through item-location readiness, and prevent AI pilots from outrunning data readiness.",
    ].join("\n"),
  },
];

describe("Ask Intelligence response policy", () => {
  it("codifies the CXO answer bar for visuals, caveats, next moves, and no model deflection", () => {
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain(
      "Never imply that the user should go to Claude",
    );
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain(
      "direct_fact, strategy_insight, industry_trend",
    );
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain(
      "Include a compact table, chart, graph, scorecard, or 2x2",
    );
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain("what evidence is needed");
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain("AbarVa Pyramid Brief");
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain("Target 90-160 words");
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain(
      "broad prioritization question",
    );
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain("top-N");
    expect(CXO_ANSWER_QUALITY_CONTRACT).toContain(
      "queue exactly 3 short follow-up questions",
    );
  });

  it("requires explicit chart asks to be authored by Claude, not invented by the renderer", () => {
    expect(CHART_OUTPUT_CONTRACT).toContain(
      "Claude owns the advisory judgment and exhibit content",
    );
    expect(CHART_OUTPUT_CONTRACT).toContain(
      "Do not rely on the renderer to invent summaries, tables, charts, matrices, titles, caveats, or business language",
    );
    expect(CHART_OUTPUT_CONTRACT).toContain(
      "```decision-table JSON fence",
    );
    expect(CHART_OUTPUT_CONTRACT).toContain("```chart JSON fence");
    expect(CHART_OUTPUT_CONTRACT).toContain(
      "The first table must be the actual requested exhibit, not a Theme / Executive read / Decision use summary",
    );
  });

  it("recognizes broad current-state questions", () => {
    expect(
      isBroadCurrentStateQuestion(
        "Can you give me a perspective of our current state?",
      ),
    ).toBe(true);
    expect(isBroadCurrentStateQuestion("Where do we stand right now?")).toBe(
      true,
    );
    expect(
      isBroadCurrentStateQuestion("Compare Snowflake and Databricks"),
    ).toBe(false);
  });

  it("classifies strategy-to-execution questions as Moves execution mode", () => {
    const strategyQuestions = [
      "If I run this through Moves for 8 weeks, what would the plan look like by phases?",
      "If I run the supply-chain AI top bets through Moves for 8 weeks, what would the plan look like by phases?",
      "Create a Data & AI strategy with the top 5 bets, business case, solution, and roadmap for the executive council.",
      "Help me decide the top 5 AI use cases for supply chain and how we would execute.",
      "What implementation plan should we use for this transformation sprint?",
      "Describe the correct Moves model for taking a supply-chain AI idea from strategy through execution. Use the canonical phases.",
      "Is the AbarVa Moves model Charter / Diagnose / Decide / Commit, or P0-P5 plus Tower? Explain the difference.",
      "For a banking AI risk-control Move, what belongs in P0, P1, P2, P3, P4, P5, and Tower?",
      "Can a Meridian clinical AI Move skip P2 if Intelligence already has a strong hypothesis?",
      "What does Moves need before it can move an Apex Retail inventory optimization idea from P3 to P4?",
      "What should Moves refuse to decide by itself in an airline workforce planning transformation?",
      "How should Moves connect a regulatory AI governance strategy to implementation without claiming the workflow is already approved?",
      "How should Tower connect evidence from Home, strategy from Intelligence, execution from Moves, and vendor actions from Source?",
      "If Intelligence identifies top 5 AI supply-chain bets, how should Home, Moves, Source, and Tower each participate without overclaiming live artifacts?",
      "For SkyHarbor IROPS AI, explain how Intelligence frames the bet, Moves executes, Source supports vendors, Tower tracks value, and Home exposes evidence.",
      "For healthcare administrative AI, how should AbarVa avoid clinical overclaim while connecting strategy to execution and value?",
      "If Source finds a vendor renewal risk, how should it hand off to Moves and Tower without saying the Move or KPI tracker already exists?",
      "What is the safest executive answer pattern when the user wants strategy, visuals, tables, source evidence, and downstream Moves/Tower actions in one response?",
      "What are the phase-gate evidence requirements for a Contract Intelligence Move?",
      "If Claude writes a good strategy answer but forgets the P0-P5 table, what should the AbarVa runtime guarantee?",
      "How should Source connect a sourcing issue to Moves and Tower without overclaiming that downstream artifacts already exist?",
    ];

    for (const question of strategyQuestions) {
      expect(isStrategyToMovesExecutionAsk(question)).toBe(true);
      expect(classifyAbarvaAnswerMode(question)).toBe(
        "strategy_to_moves_execution",
      );
    }

    expect(isStrategyToMovesExecutionAsk("What is our IT budget?")).toBe(false);
    expect(classifyAbarvaAnswerMode("What is our IT budget?")).toBe("general");
    expect(
      classifyAbarvaAnswerMode("Write a funny poem about AI procurement."),
    ).toBe("general");
    expect(
      classifyAbarvaAnswerMode(
        "Give me the top 5 AI use cases for supply chain and rank them in a 2x2 matrix across value and complexity.",
      ),
    ).toBe("industry_trend_to_ai_bets");
  });

  it("classifies AI trend and use-case investment asks as industry AI bets mode", () => {
    const questions = [
      "What are the AI trends in financial services and which bets should FS Demo prioritize?",
      "For FS Demo, rank five AI investment use cases by business value and implementation complexity.",
      "Give me the top 5 AI use cases for healthcare with a 2x2 value complexity matrix.",
    ];

    for (const question of questions) {
      expect(isIndustryTrendToAiBetsAsk(question)).toBe(true);
      expect(classifyAbarvaAnswerMode(question)).toBe(
        "industry_trend_to_ai_bets",
      );
      expect(needsAbarvaSolutionGuidance(question)).toBe(true);
    }

    expect(INDUSTRY_TREND_TO_AI_BETS_CONTRACT).toContain(
      "tenant's actual current-state evidence",
    );
    expect(INDUSTRY_TREND_TO_AI_BETS_CONTRACT).toContain(
      "current systems, data assets",
    );
  });

  it("classifies broad strategy-to-solution prompts as AbarVa solution mode", () => {
    const solutionQuestions = [
      "How would we solve this through AbarVa?",
      "Which vendor or sourcing implications should Source handle?",
      "What should Tower measure?",
      "What do we already know about the current state?",
    ];

    for (const question of solutionQuestions) {
      expect(isStrategyToAbarvaSolutionAsk(question)).toBe(true);
      expect(needsAbarvaSolutionGuidance(question)).toBe(true);
      expect(classifyAbarvaAnswerMode(question)).toBe(
        "strategy_to_abarva_solution",
      );
    }
  });

  it("codifies holistic AbarVa product knowledge for strategy answers", () => {
    expect(STRATEGY_TO_ABARVA_SOLUTION_CONTRACT).toContain(
      "How AbarVa would solve this",
    );
    for (const surface of [
      "Intelligence",
      "Home",
      "Moves",
      "Source",
      "Tower",
    ]) {
      expect(STRATEGY_TO_ABARVA_SOLUTION_CONTRACT).toContain(surface);
    }
    expect(STRATEGY_TO_ABARVA_SOLUTION_CONTRACT).toContain(
      "Do not claim artifacts, Moves, Source events, Tower ledgers, or Home evidence packs have been created",
    );
    expect(STRATEGY_TO_ABARVA_SOLUTION_CONTRACT).toContain(
      "Do not say Claude or another model can do better",
    );
    expect(STRATEGY_TO_ABARVA_SOLUTION_CONTRACT).toContain(
      "Do not expose internal IDs, schema names, route names, raw packet fields, or debug terms",
    );
  });

  it("codifies the AbarVa operating model for strategy-to-Moves execution", () => {
    expect(STRATEGY_TO_MOVES_EXECUTION_CONTRACT).toContain(
      "Moves portfolio sprint",
    );
    expect(STRATEGY_TO_MOVES_EXECUTION_CONTRACT).toContain(
      "Intelligence framing the bets",
    );
    expect(STRATEGY_TO_MOVES_EXECUTION_CONTRACT).toContain(
      "Source validating vendor/commercial levers",
    );
    expect(STRATEGY_TO_MOVES_EXECUTION_CONTRACT).toContain(
      "Tower tracking realized value",
    );
    for (const phase of [
      "P0 Originate",
      "P1 Charter",
      "P2 Discover & Diagnose",
      "P3 Design Future State",
      "P4 Roadmap & Business Case",
      "P5 Approval & Mobilization",
      "Tower Track Outcomes",
    ]) {
      expect(STRATEGY_TO_MOVES_EXECUTION_CONTRACT).toContain(phase);
    }
    expect(STRATEGY_TO_MOVES_EXECUTION_CONTRACT).toContain(
      "procurement intelligence",
    );
    expect(STRATEGY_TO_MOVES_EXECUTION_CONTRACT).toContain(
      "Finance or treasury may be a dependency or value lens, but must not replace the supply-chain answer",
    );
  });

  it("strips markdown control characters before plain-text dock rendering", () => {
    expect(sanitizeAskSynthesis("Apex has **3 bets** and `F200` active.")).toBe(
      "Apex has 3 bets and F200 active.",
    );
  });

  it("preserves markdown table layout when capping long ask answers", () => {
    const answer = sanitizeAskSynthesis(
      [
        "Planning ranges from the cited context:",
        "",
        "| Use case | Primary benefit |",
        "|---|---|",
        "| Demand forecasting | Inventory turn and lost-sale reduction |",
        "",
        "Next move: validate tenant-specific benefit ranges before putting a number in front of the board. The rest of this sentence is intentionally long enough to force a cap.",
      ].join("\n"),
      24,
    );

    expect(answer).toContain("\n| Use case | Primary benefit |\n|---|---|\n");
    expect(answer).toContain(
      "| Demand forecasting | Inventory turn and lost-sale reduction |",
    );
    expect(answer).not.toContain(
      "| Use case | Primary benefit | |---|---| | Demand forecasting |",
    );
  });

  it("removes raw internal record ids from prose while preserving readable labels", () => {
    const answer = sanitizeAskSynthesis(
      "Customer gold record (FC-DATA-001) is on Databricks. APX-IT-004 owns the inventory mart. APP-00002 and APP-00003 carry 358 integrations.",
    );

    expect(answer).toContain("Customer gold record is on Databricks.");
    expect(answer).toContain("owns the inventory mart.");
    expect(answer).toContain("and carry 358 integrations.");
    expect(answer).not.toContain("the referenced evidence");
    expect(answer).not.toContain("the cited record");
    expect(answer).not.toMatch(
      /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\b/,
    );
  });

  it("builds an advisor-style current-state answer instead of a metric dump", () => {
    const answer = buildCurrentStateAdvisory(surfaceSources);

    expect(answer).toContain("My read: Apex Retail is not short on AI ideas.");
    expect(answer).toContain("Business lens: aVa sees Apex Retail priorities");
    expect(answer).toContain("Technical lens: resolve customer identity");
    expect(answer).toContain("CFO value lens");
    expect(answer).not.toContain("3 ranked bets");
    expect(answer).not.toContain("**");
  });

  it("turns tenant-backed missing sub-fields into partial-evidence wording", () => {
    const text = [
      "The loaded sources give you the structural picture but don't contain a specific EDP commitment tranche or true-up delta figure — that number would live in the AWS contract schedule itself, which hasn't been ingested. Here's what I can ground firmly.",
      "AWS is at $180M/yr with a February 2027 renewal, and SHA-MOD-001 has $2.32M disputed.",
    ].join(" ");

    const answer = applyPartialEvidencePolicy(text, [
      {
        type: "TENANT",
        name: "Structured vendor contracts (skyharbor-air)",
        id: "skyharbor-air:structured:vendor_contracts",
        confidence: 0.97,
        detail: "SHA-VEND-002 AWS — annual_value $180.0M, renewal 2027-02-01.",
      },
    ]);

    expect(answer).toContain(
      "The loaded sources show the exposure shape and decision context; the remaining field to confirm is the specific EDP commitment tranche or true-up delta figure.",
    );
    expect(answer).toContain("AWS is at $180M/yr");
    expect(answer).toContain("$2.32M disputed");
    expect(answer).not.toMatch(/hasn'?t been ingested|don't contain/i);
  });

  it("neutralizes unavailable-detector false positives when tenant evidence is present", () => {
    const text = [
      "No specific MOD record loaded, so I'm treating this as a pattern-informed call, not a ledger-only claim.",
      "No airline in a rational posture touches this mid-program.",
      "The backlog has no realized value signal before the board ledger review.",
      "There is no SHA-MOD entry is explicitly flagged as rolled back to Z.",
      "The move has no controversy.",
      "The IBM work has no dispute before the modernization ledger review.",
      "The workload has no contested ground before the inventory review.",
      "The critical workloads have no clean exit path before the inventory review.",
    ].join(" ");

    const answer = applyPartialEvidencePolicy(text, [
      {
        type: "TENANT",
        name: "SkyHarbor modernization ledger",
        id: "skyharbor-air:structured:modernization_ledger",
        confidence: 0.97,
        detail:
          "SHA-MOD-002 delivered $4.76M against $6.1M with zero disputed value.",
      },
    ]);

    expect(answer).toContain(
      "The loaded sources do not include a specific MOD record",
    );
    expect(answer).toContain(
      "pattern-informed rather than ledger-confirmed-only claim",
    );
    expect(answer).toContain(
      "A rational airline posture leaves this mid-program.",
    );
    expect(answer).toContain("zero realized value signal");
    expect(answer).toContain(
      "the loaded SHA-MOD entries are not explicitly flagged",
    );
    expect(answer).toContain("zero controversy");
    expect(answer).toContain("zero dispute");
    expect(answer).toContain("zero contested ground");
    expect(answer).toContain("lack a clean exit path");
    expect(answer).not.toMatch(
      /\b(no record|no .* ledger|no .* inventory|not available|not ingested|hasn'?t been ingested)\b/i,
    );
  });

  it("does not rewrite missing-data honesty when no tenant evidence is loaded", () => {
    const text =
      "I don't have the exact EDP floor in the loaded sources. Ask AWS for the schedule.";

    expect(applyPartialEvidencePolicy(text, [])).toBe(text);
  });

  it("splits long prose without appending app-authored next moves", () => {
    const text = [
      "The loaded tenant sources confirm the active context but do not include the denial-rate extract, overturn-rate table, or specialty-level operating baseline that would be required to approve a tenant-specific number.",
      "I will not fabricate those numbers because they would become a board anchor without evidence.",
      "The pattern answer is that prevention beats rework, but the tenant-specific investment case still needs the missing source table.",
    ].join(" ");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).not.toContain("Next, assign");
    expect(answer).not.toContain("accountable data owner");
    expect(answer).not.toContain("Source, Tower, or Moves");
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
    expect(
      answer
        .split(/\n{2,}/)
        .every((paragraph) => paragraph.split(/\s+/).length <= 70),
    ).toBe(true);
  });

  it("preserves model-authored consultant prose without synthetic reshaping", () => {
    const text = [
      "Honest read first: I don't have your IT landscape or data platform inventory loaded in this session, so I can't list the actual vendors, versions, owners, and costs for Apex's analytics stack.",
      "What the loaded context does tell me is the strategic shape, and that's worth being direct about.",
      "What we know from loaded sources about Apex's analytics technology: Retail Lakehouse & Customer Inventory Graph: $95M committed, $12M realized, mobilize stage.",
      "This is the consolidation bet — the platform meant to replace the fragmented banner-level analytics estate.",
      "Demand Forecasting platform sits inside the lakehouse program, currently on a contain posture, gated by item-location accuracy.",
      "Inventory truth is the blocker across the analytics stack — confident-wrong signals at holiday volume is the risk.",
      "Next move: assign the accountable data owner to validate the missing tenant evidence before approving a number or using it in a board artifact.",
    ].join(" ");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain(
      "I don't have your IT landscape or data platform inventory loaded",
    );
    expect(answer).toContain("Retail Lakehouse & Customer Inventory Graph");
    expect(answer).toContain("This is the consolidation bet");
    expect(answer).toContain("Next, assign");
    expect(answer).toContain(
      "What the loaded context does tell me is the strategic shape",
    );
    expect(answer).not.toContain("The supporting evidence is that");
    expect(answer).not.toContain("That means");
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
    expect(answer).not.toMatch(/Honest read first:/i);
    expect(
      answer
        .split(/\n{2,}/)
        .every((paragraph) => paragraph.split(/\s+/).length <= 70),
    ).toBe(true);
  });

  it("keeps short visual answers readable when they already include a next move", () => {
    const text = [
      "The loaded sources give us two KPI families that are both CIO-owned and both off-target. 9% | +7.",
      "Next move: assign the accountable owner to validate the KPI owner and decide whether this should move into Source or Moves.",
    ].join("\n");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain("The loaded sources give us two KPI families");
    expect(answer).toContain("Next, assign");
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
  });

  it("naturalizes consultant section labels only when the model supplied them", () => {
    const text = [
      "Read: The loaded evidence points to inventory truth as the gating issue.",
      "Evidence: Retail Lakehouse is committed but not fully realized.",
      "Next move: assign the CDO to validate item-location accuracy before approving the holiday AI scale path.",
    ].join("\n");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain("The loaded evidence");
    expect(answer).not.toMatch(/\bRead:\s*Read:/i);
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
  });

  it("preserves markdown tables while adding readable consultant framing", () => {
    const text = [
      "The loaded sources point to IBM transition-rights friction as the decision risk.",
      "",
      "| Risk | Basis |",
      "|---|---|",
      "| Transition rights | Contract schedule |",
      "",
      "Next move: validate the contract schedule before approving the renewal position.",
    ].join("\n");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain("| Risk | Basis |");
    expect(answer).toContain("| Transition rights | Contract schedule |");
    expect(answer).toContain("Next, validate");
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
  });

  it("normalizes live consultant section variants into readable paragraphs", () => {
    const text = [
      "Read: Your loaded D&A estate shows eight data products spanning sales, customer, inventory, digital, loss prevention, supply chain, merchandising, and workforce — but the maturity profile is uneven.",
      "Evidence — what's actually in your estate: Implication: Merch planning is your only gold-grade asset, and it is leaking trust through manual overrides.",
      "Next move: assign the accountable owner to validate the cited evidence and decide whether this should move into Source or Moves.",
    ].join(" ");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain(
      "Your loaded D&A estate shows eight data products",
    );
    expect(answer).toContain("Merch planning is your only gold-grade asset");
    expect(answer).toContain("Next, assign");
    expect(answer).not.toContain("The supporting evidence is that");
    expect(answer).not.toContain("That means");
    expect(answer).not.toMatch(/Evidence\s+—/i);
    expect(answer).not.toContain("validate the cited evidence");
    expect([
      ...answer.matchAll(/^(Read|Evidence|Implication|Next move):/gim),
    ]).toHaveLength(0);
    expect(
      answer
        .split(/\n{2,}/)
        .every((paragraph) => paragraph.split(/\s+/).length <= 70),
    ).toBe(true);
  });

  it("does not invent read evidence implication sections for a SkyHarbor answer", () => {
    const text = [
      "My answer is IROPS agentic recovery, but only after the operational data readiness gate is funded and owned.",
      "The three value pools in the SkyHarbor context are IROPS recovery at $270M, Customer AI / Digital Concierge at $180M, and data estate rationalization at $122M.",
      "The reason I would not put customer AI first is that the identity and consent substrate is still fragmented, while IROPS has the clearest operational leverage once certified crew, aircraft, and disruption feeds are in place.",
      "For the investment committee, frame the decision as an AI-enablement bet with a hard readiness gate, not as a generic data project.",
    ].join(" ");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain("My answer is IROPS agentic recovery");
    expect(answer).toContain("For the investment committee");
    expect(answer).not.toContain("Here's the logic");
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
  });
});
