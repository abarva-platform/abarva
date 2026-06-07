import {
  applyPartialEvidencePolicy,
  buildCurrentStateAdvisory,
  buildCurrentStateTechnologyAdvisory,
  chunkAskText,
  enforceCxoSectionBreaks,
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
      "- Brief synthesis: Sentinel sees Apex Retail priorities above the line: fix customer identity before scaling loyalty AI, sequence demand sensing through data readiness, and make the AI roadmap honest about platform prerequisites.",
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

  it("preserves paragraph breaks when chunking streamed Ask text", () => {
    const text = [
      "My read: Meridian should stay in controlled pilot mode.",
      "",
      "Evidence: Enterprise Context has loaded records and evidence rows.",
      "",
      "Risk / gate: Do not claim full pilot readiness until artifacts are persisted.",
    ].join("\n");

    expect(chunkAskText(text).join("")).toBe(text);
  });

  it("builds an advisor-style current-state answer instead of a metric dump", () => {
    const answer = buildCurrentStateAdvisory(surfaceSources);

    expect(answer).toContain("My read: Apex Retail is not short on AI ideas.");
    expect(answer).toContain(
      "Business lens: Sentinel sees Apex Retail priorities",
    );
    expect(answer).toContain("Technical lens: resolve customer identity");
    expect(answer).toContain("CFO value lens");
    expect(answer).not.toContain("3 ranked bets");
    expect(answer).not.toContain("**");
  });

  it("answers current-state data analytics questions from concrete technology context first", () => {
    const answer = buildCurrentStateTechnologyAdvisory([
      ...surfaceSources,
      {
        type: "TENANT",
        name: "IT landscape (meridian-health)",
        id: "meridian-health:it_landscape",
        confidence: 0.94,
        detail: [
          "IT landscape records for meridian-health.",
          "- CMDB extract: Epic Clarity reporting database supports clinical and finance analytics.",
          "- CMDB extract: SQL Server hosts operational marts used by finance and analytics teams.",
          "- systems_inventory.csv: Tableau is the governed BI layer; SAS remains in actuarial and finance analytics.",
        ].join("\n"),
      },
    ]);

    expect(answer).toContain("current-state data and technology baseline");
    expect(answer).toContain("Epic Clarity");
    expect(answer).toContain("SQL Server");
    expect(answer).toContain("Tableau");
    expect(answer).toContain("SAS");
    expect(answer).not.toContain("not short on AI ideas");
    expect(answer).not.toContain("CFO value lens");
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

  it("enforces CXO section breaks when the model compresses labels into one block", () => {
    const text = [
      "My read: Meridian is ready for a controlled CDAO/CFO walkthrough, not a full pilot claim.",
      "Evidence: Enterprise Context has 3,503 records and 38,640 facts.",
      "Decision fork: If the CFO wants MLR proof, hold value claims at forecast; if the CDAO wants architecture proof, show Databricks data products.",
      "Risk/gate: Do not advance until artifacts and approvals are stored for retrieval.",
    ].join(" ");

    expect(enforceCxoSectionBreaks(text)).toBe(
      [
        "My read: Meridian is ready for a controlled CDAO/CFO walkthrough, not a full pilot claim.",
        "",
        "Evidence: Enterprise Context has 3,503 records and 38,640 facts.",
        "",
        "Decision fork: If the CFO wants MLR proof, hold value claims at forecast; if the CDAO wants architecture proof, show Databricks data products.",
        "",
        "Risk / gate: Do not advance until artifacts and approvals are stored for retrieval.",
      ].join("\n"),
    );
  });

  it("adds evidence-heading breaks for long CXO answers that still compress substructure", () => {
    const text = [
      "My read: In the loaded context, Meridian Health System is a synthetic/demo integrated health system tenant, modeled as a sizable multi-facility enterprise with a strong Epic-based clinical footprint, Azure Databricks as the target analytics platform, and an AI-enabled Population Health and Clinical Performance Command Center as the core frame.",
      "Geography detail is not explicitly named in the evidence; what we can prove is scale, footprint shape, and technology posture.",
      "The loaded domains include org decision rights, facilities/business units, CMDB applications and services, CI relationships and dependencies, vendors and contracts, renewal calendar, spend baseline, policies and procedures, incidents, problems, changes, SLAs, initiative portfolio, data domains, stewardship, and risk/compliance signals.",
      "This breadth indicates an enterprise-scale health-system context layer rather than a small single-facility demo note.",
      "What I can prove from evidence 1) Identity and geography signal Tenant 360 explicitly flags the synthetic/demo health-system tenant.",
      "2) Scale and complexity Enterprise context proof: 3,503 records, 38,640 facts, 820 relationships, 3,503 evidence rows, 13 sources, and 0 open quality gaps.",
      "This gives enough evidence for a controlled CDAO/CFO walkthrough, but it still should not be overstated as confidential PHS production data or realized operating performance.",
      "Evidence checked: intake.tenant_context, selection_memo.decision_rationale, intake.question_scope, telemetry.answer_trace.",
    ].join(" ");

    const shaped = enforceCxoSectionBreaks(text);

    expect((shaped.match(/\n\s*\n/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(shaped).toContain("\n\nWhat I can prove from evidence");
    expect(shaped).toContain("\n\n2) Scale and complexity");
    expect(shaped).toContain("\n\nEvidence checked:");
  });
});
