import {
  applyPartialEvidencePolicy,
  buildCurrentStateAdvisory,
  enforceDecisionGradeAnswer,
  isBroadCurrentStateQuestion,
  sanitizeAskSynthesis,
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

    expect(answer).toContain(
      "\n| Use case | Primary benefit |\n|---|---|\n",
    );
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
    expect(answer).toContain("the referenced evidence owns the inventory mart.");
    expect(answer).toContain(
      "the referenced evidence and the referenced evidence carry 358 integrations.",
    );
    expect(answer).not.toContain("the cited record");
    expect(answer).not.toMatch(
      /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\b/,
    );
  });

  it("builds an advisor-style current-state answer instead of a metric dump", () => {
    const answer = buildCurrentStateAdvisory(surfaceSources);

    expect(answer).toContain("My read: Apex Retail is not short on AI ideas.");
    expect(answer).toContain(
      "Business lens: aVa sees Apex Retail priorities",
    );
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

  it("splits long prose and appends a non-fabricating next move when actionability is missing", () => {
    const text = [
      "The loaded tenant sources confirm the active context but do not include the denial-rate extract, overturn-rate table, or specialty-level operating baseline that would be required to approve a tenant-specific number.",
      "I will not fabricate those numbers because they would become a board anchor without evidence.",
      "The pattern answer is that prevention beats rework, but the tenant-specific investment case still needs the missing source table.",
    ].join(" ");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain(
      "The next move is to assign the accountable data owner to validate the missing tenant evidence",
    );
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
    expect(
      answer
        .split(/\n{2,}/)
        .every((paragraph) => paragraph.split(/\s+/).length <= 70),
    ).toBe(true);
  });

  it("reshapes dense consultant prose into readable executive sections", () => {
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
    expect(answer).toContain("The supporting evidence is that");
    expect(answer).toContain("That means");
    expect(answer).toContain("The next move is to assign");
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
    expect(answer).toContain("The next move is to assign");
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
  });

  it("does not duplicate consultant section labels when the model already supplied them", () => {
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
    expect(answer).toContain("The next move is to validate");
    expect(answer).not.toMatch(/^(Read|Evidence|Implication|Next move):/im);
  });

  it("normalizes live consultant section variants into readable paragraphs", () => {
    const text = [
      "Read: Your loaded D&A estate shows eight data products spanning sales, customer, inventory, digital, loss prevention, supply chain, merchandising, and workforce — but the maturity profile is uneven.",
      "Evidence — what's actually in your estate: Implication: Merch planning is your only gold-grade asset, and it is leaking trust through manual overrides.",
      "Next move: assign the accountable owner to validate the cited evidence and decide whether this should move into Source or Moves.",
    ].join(" ");

    const answer = enforceDecisionGradeAnswer(text);

    expect(answer).toContain("Your loaded D&A estate shows eight data products");
    expect(answer).toContain("The supporting evidence is that");
    expect(answer).toContain("That means");
    expect(answer).toContain("The next move is to have");
    expect(answer).not.toMatch(/Evidence\s+—/i);
    expect(answer).not.toContain("validate the cited evidence");
    expect([...answer.matchAll(/^(Read|Evidence|Implication|Next move):/gim)]).toHaveLength(0);
    expect(
      answer
        .split(/\n{2,}/)
        .every((paragraph) => paragraph.split(/\s+/).length <= 70),
    ).toBe(true);
  });
});
