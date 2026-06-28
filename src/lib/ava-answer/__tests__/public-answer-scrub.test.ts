import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";

describe("scrubPublicAvaAnswerText", () => {
  it("removes SkyHarbor packet chrome, generic routing closer, and evidence appendix text", () => {
    const cleaned = scrubPublicAvaAnswerText(`aVa · intelligence
answered
high confidence
The leading edge in airline IROPS right now is the shift from decision-support tools to agentic recovery.

Next, have the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves.

Tables
evidence
Source	Type	Confidence	How IT Supports The Answer
SkyHarbor Air live Intelligence surface	tenant material	high	Active Intelligence surface: intelligence.
This panel lists the material used for the answer. It does not invent missing values or relationships.
SkyHarbor Air live Intelligence surface
·
Tenant evidence`);

    expect(cleaned).toBe(
      "The leading edge in airline IROPS right now is the shift from decision-support tools to agentic recovery.",
    );
    expect(cleaned).not.toContain("aVa · intelligence");
    expect(cleaned).not.toContain("Source, Tower, or Moves");
    expect(cleaned).not.toContain("Tables");
    expect(cleaned).not.toContain("How IT Supports The Answer");
    expect(cleaned).not.toContain("Tenant evidence");
  });

  it("removes internal supporting-material ledger wording from advisor prose", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "Here's the logic: the supporting material ledger shows three distinct value pools — IROPS agentic recovery ($270M), customer AI/Digital Concierge ($180M), and data estate rationalization ($122M).",
    );

    expect(cleaned).toContain("business context shows three distinct value pools");
    expect(cleaned).not.toMatch(/supporting material|evidence ledger|source signals/i);
  });

  it("does not rewrite normal executive evidence or fact language", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The evidence is strong enough to make a decision, but the facts do not support scaling every AI pilot at once.",
    );

    expect(cleaned).toBe(
      "The evidence is strong enough to make a decision, but the facts do not support scaling every AI pilot at once.",
    );
    expect(cleaned).toContain("evidence");
    expect(cleaned).toContain("facts");
    expect(cleaned).not.toContain("business context is strong enough");
  });

  it("preserves natural read language", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "My read is simple: scale the IROPS bet only after the data gate is owned.",
    );

    expect(cleaned).toBe(
      "My read is simple: scale the IROPS bet only after the data gate is owned.",
    );
  });

  it("cleans live SkyHarbor orphan fragments without changing the answer", () => {
    const cleaned = scrubPublicAvaAnswerText(
      [
        'The single best AI investment SkyHarbor should make next is certified operational data products.',
        '" Here\'s why this is the right answer: the business context shows three distinct value pools. The $270M IROPS pool is the largest single bet, and the explicit loaded constraint is uncertified operational data, not model capability or vendor availability. 6 vs.',
      ].join("\n\n"),
    );

    expect(cleaned).toContain("Here's why this is the right answer");
    expect(cleaned).toContain("the explicit constraint is uncertified operational data");
    expect(cleaned).not.toContain('" Here');
    expect(cleaned).not.toContain("6 vs.");
    expect(cleaned).not.toContain("explicit loaded constraint");
  });

  it("cleans live SkyHarbor session-memory and logic preambles", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The answer hasn't changed from the last two turns, and I want to be direct about Why: certified operational data products. Here's the logic in plain terms. The loaded tenant evidence shows an evidence base gap.",
    );

    expect(cleaned).toBe(
      "certified operational data products. The business context shows an operational-data gap.",
    );
    expect(cleaned).not.toMatch(/last two turns|Here's the logic|loaded tenant evidence|evidence base gap/i);
  });

  it("cleans repeated-session evidence phrasing from production SkyHarbor answers", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The answer is the same one I've given the last three times this session, and the tenant evidence keeps supporting it: certified operational data products — real-time crew, aircraft, and gate feeds with governed freshness and lineage — is the single best AI investment SkyHarbor can make next. Here's why this keeps being the right answer.\n\nThe loaded evidence shows three value pools: IROPS agentic recovery at $270M, customer AI / Digital Concierge at $180M, and data estate rationalization at $122M (all from the business context). Every one of those pools is gated on the same substrate gap.\n\nIf it's the latter, that's the single thing to change before any other AI conversation is worth the meeting time.",
    );

    expect(cleaned).toContain(
      "certified operational data products — real-time crew, aircraft, and gate feeds with governed freshness and lineage — is the single best AI investment SkyHarbor can make next.",
    );
    expect(cleaned).toContain("The business context shows three value pools");
    expect(cleaned).not.toMatch(
      /last three times|this session|tenant evidence|loaded evidence|keeps being the right answer|If it's the latter/i,
    );
  });

  it("cleans same-answer turn history and substrate jargon from live SkyHarbor answers", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "Same answer as the last four turns, and the business context keeps making the case cleanly: certified operational data products — real-time crew, aircraft, and gate feeds with governed freshness and lineage — is the single best AI investment SkyHarbor can make next. Here's why the evidence keeps pointing here.\n\nEvery one of those pools is gated on the same substrate gap. Fix the substrate and you unlock it.\n\nThe priority table, for the investment committee: The decision the CDAO and EVP Operations need to make jointly, this quarter.",
    );

    expect(cleaned).toContain(
      "certified operational data products — real-time crew, aircraft, and gate feeds with governed freshness and lineage — is the single best AI investment SkyHarbor can make next.",
    );
    expect(cleaned).toContain("same operational-data gap");
    expect(cleaned).toContain("Fix the operational-data foundation");
    expect(cleaned).toContain("For the investment committee: The decision");
    expect(cleaned).not.toMatch(
      /Same answer|last four turns|evidence keeps pointing here|substrate|priority table/i,
    );
  });
});
