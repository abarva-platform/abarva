import {
  scrubPublicAvaAnswerText,
  scrubPublicAvaSourceText,
} from "@/lib/ava-answer/public-answer-scrub";

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

  it("cleans across-session answer history and dangling conditional closers", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The answer hasn't changed across this session, and the business context keeps making it concrete: certified operational data products is the single best AI investment SkyHarbor can make next. Here's why the evidence is this clean.\n\nThe loaded sources show three distinct value pools. 5M events daily and is flagged for migration.\n\nIf it's the latter, that's the single thing to fix before any other AI investment conversation is worth having.\n\nThe CDAO and EVP Operations need to own this jointly.",
    );

    expect(cleaned).toContain(
      "certified operational data products is the single best AI investment SkyHarbor can make next.",
    );
    expect(cleaned).toContain("The business context shows three distinct value pools");
    expect(cleaned).toContain(
      "The integration handles 5M daily events and is flagged for migration.",
    );
    expect(cleaned).toContain(
      "The CDAO and EVP Operations need to own this jointly.",
    );
    expect(cleaned).not.toMatch(
      /answer hasn't changed|this session|loaded sources|evidence is this clean|If it's the latter/i,
    );
  });

  it("cleans bare same-answer preambles from live answers", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "Same answer, and the business context keeps making it airtight: certified operational data products is the single best AI investment SkyHarbor can make next.",
    );

    expect(cleaned).toBe(
      "certified operational data products is the single best AI investment SkyHarbor can make next.",
    );
    expect(cleaned).not.toMatch(/same answer|keeps making it airtight/i);
  });

  it("removes data-layer and Move trace language from CXO-visible answers", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The V7 substrate and candidate_move packet show move_id, phase_id, artifact_id, evidence_id, tenant_id, and source_record_id values for the agent assist case.",
    );

    expect(cleaned).toContain("active enterprise context");
    expect(cleaned).toContain("candidate opportunity");
    expect(cleaned).not.toMatch(
      /V7|substrate|candidate_move|move_id|phase_id|artifact_id|evidence_id|tenant_id|source_record_id|packet/i,
    );
  });

  it("cleans internal data-layer source text before it reaches the browser", () => {
    const cleaned = scrubPublicAvaSourceText(
      "Meridian Health System V7 executive dossier from Azure Postgres intelligence_v7. Revenue Basis: not_loaded. Loaded substrate: 442 business records, 11,507 field facts, 97 graph nodes, 69 relationship edges, and 118 retrieval chunks. Selected for this question: V7_02_business_functions.csv candidate_move planning context. Boundary: synthetic_demo_manifest_gated.",
    );

    expect(cleaned).toContain("Meridian Health System executive business file");
    expect(cleaned).toContain("Revenue Basis: not yet available");
    expect(cleaned).toContain("available source material");
    expect(cleaned).toContain("candidate opportunity planning context");
    expect(cleaned).not.toMatch(
      /V7|intelligence_v7|not_loaded|substrate|business records|field facts|graph nodes|relationship edges|retrieval chunks|candidate_move|synthetic_demo_manifest_gated/i,
    );
  });

  it("cleans all-session answer history and loaded tenant source phrasing", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The answer is the same one the evidence has supported all session: certified operational data products is the single best AI investment SkyHarbor can make next.\n\nThe loaded tenant sources show three distinct value pools.\n\nIf it's the latter, that single gap is the only thing worth fixing before any other AI conversation is worth the meeting time.",
    );

    expect(cleaned).toContain(
      "certified operational data products is the single best AI investment SkyHarbor can make next.",
    );
    expect(cleaned).toContain(
      "The business context shows three distinct value pools.",
    );
    expect(cleaned).not.toMatch(
      /answer is the same|all session|loaded tenant sources|If it's the latter/i,
    );
  });

  it("cleans answer-has-not-moved session wording from live SkyHarbor answers", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The answer hasn't moved across this session, and the evidence keeps making it cleanly: certified operational data products — real-time crew, aircraft, and gate feeds with governed freshness and lineage — is the single best AI investment SkyHarbor can make next. The business context shows three value pools.",
    );

    expect(cleaned).toBe(
      "certified operational data products — real-time crew, aircraft, and gate feeds with governed freshness and lineage — is the single best AI investment SkyHarbor can make next. The business context shows three value pools.",
    );
    expect(cleaned).not.toMatch(
      /answer hasn't moved|this session|evidence keeps making it cleanly/i,
    );
  });

  it("cleans airtight session wording and earns-meeting-time closer", () => {
    const cleaned = scrubPublicAvaAnswerText(
      "The answer hasn't moved across this session, and the business context keeps making it airtight: certified operational data products is the single best AI investment SkyHarbor can make next.\n\nIf it's the latter, that's the only gap worth closing before any other AI investment conversation earns meeting time.",
    );

    expect(cleaned).toBe(
      "certified operational data products is the single best AI investment SkyHarbor can make next.",
    );
    expect(cleaned).not.toMatch(
      /answer hasn't moved|this session|keeps making it airtight|If it's the latter|earns meeting time/i,
    );
  });
});
