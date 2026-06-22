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

  it("removes raw internal record ids from prose while preserving readable labels", () => {
    const answer = sanitizeAskSynthesis(
      "Customer gold record (FC-DATA-001) is on Databricks. APX-IT-004 owns the inventory mart.",
    );

    expect(answer).toContain("Customer gold record is on Databricks.");
    expect(answer).toContain("the cited record owns the inventory mart.");
    expect(answer).not.toMatch(/\b[A-Z]{2,6}-[A-Z0-9]{2,8}-\d{2,4}\b/);
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
      "Next move: assign the accountable data owner to validate the missing tenant evidence",
    );
    expect(
      answer
        .split(/\n{2,}/)
        .every((paragraph) => paragraph.split(/\s+/).length <= 70),
    ).toBe(true);
  });
});
