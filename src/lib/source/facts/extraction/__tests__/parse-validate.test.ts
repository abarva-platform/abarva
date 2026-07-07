// Parse-and-validate correctness: a locatable value becomes a cited, catalog-typed
// candidate; an unlocatable value is NOT proposed; an unknown/mistyped key is
// rejected; only confirmed/edited candidates commit (rejected/proposed dropped);
// and a model proposal cannot smuggle in a number that isn't in the document.

import {
  applyValidationDecisions,
  commitValidatedCandidates,
  groundModelProposals,
  parseDocumentToCandidates,
  selectCommittableInserts,
  type CandidateFact,
  type FactLocatorRule,
  type ParsedDocument,
} from "../parse-validate";
import { factSpecByKey } from "../../fact-catalog";

const CTX = { sourceEventId: "event-uuid-1", clientKey: "lakeshore" };

const DOC: ParsedDocument = {
  doc: "Acme AMS Proposal.pdf",
  blocks: [
    {
      text: "The one-time transition fee is $250,000, payable on signature.",
      locator: "page 4, §Transition",
    },
    {
      text: "Annual change-order spend under the incumbent averaged $1,200,000.",
      locator: "page 2, §Current State",
    },
    {
      text: "The vendor commits a productivity credit of 8% per year.",
      locator: "page 6, §Credits",
    },
  ],
};

// Rules: vendor transition fee (needs entityRef), event change-order spend, and a
// vendor productivity credit %.
const TRANSITION_RULE: FactLocatorRule = {
  factKey: "transition_fee",
  patterns: [/transition fee is \$([\d,]+)/i],
  entityRef: "vendor-acme",
};
const CHANGE_ORDER_RULE: FactLocatorRule = {
  factKey: "annual_change_order_spend",
  patterns: [/change-order spend .*?averaged \$([\d,]+)/i],
};
const CREDIT_RULE: FactLocatorRule = {
  factKey: "committed_credit_pct",
  patterns: [/productivity credit of ([\d.]+)%/i],
  entityRef: "vendor-acme",
};

describe("parseDocumentToCandidates — a locatable value → a cited, typed candidate", () => {
  it("proposes a candidate with a citation {doc, locator} and correct catalog typing", () => {
    const { candidates, rejected } = parseDocumentToCandidates(
      DOC,
      [TRANSITION_RULE],
      CTX,
    );
    expect(rejected).toHaveLength(0);
    expect(candidates).toHaveLength(1);

    const c = candidates[0];
    expect(c.validationState).toBe("proposed");
    expect(c.insert.fact_key).toBe("transition_fee");
    expect(c.insert.source_method).toBe("parsed");
    expect(c.insert.value_numeric).toBe(250000);
    expect(c.insert.value_text).toBeNull();
    // Typed against the catalog: unit + entity_kind mirror the spec.
    expect(c.insert.unit).toBe(factSpecByKey("transition_fee")!.unit);
    expect(c.insert.entity_kind).toBe("vendor");
    expect(c.insert.entity_ref).toBe("vendor-acme");
    // Cited to the exact block it was located in.
    expect(c.insert.source_citation?.doc).toBe("Acme AMS Proposal.pdf");
    expect(c.insert.source_citation?.locator).toBe("page 4, §Transition");
    expect(c.locator).toBe("page 4, §Transition");
    expect(c.locatedSnippet).toContain("transition fee is $250,000");
    // Scope stamped.
    expect(c.insert.source_event_id).toBe(CTX.sourceEventId);
    expect(c.insert.client_key).toBe(CTX.clientKey);
  });

  it("attaches an event-level fact with a null entity_ref", () => {
    const { candidates } = parseDocumentToCandidates(DOC, [CHANGE_ORDER_RULE], CTX);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].insert.fact_key).toBe("annual_change_order_spend");
    expect(candidates[0].insert.entity_kind).toBe("event");
    expect(candidates[0].insert.entity_ref).toBeNull();
    expect(candidates[0].insert.value_numeric).toBe(1200000);
  });

  it("coerces a percentage token to a numeric value", () => {
    const { candidates } = parseDocumentToCandidates(DOC, [CREDIT_RULE], CTX);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].insert.value_numeric).toBe(8);
    expect(candidates[0].insert.unit).toBe("pct");
  });
});

describe("parseDocumentToCandidates — a value that cannot be located is NOT proposed", () => {
  it("rejects (does not propose) a fact whose pattern matches nothing in the document", () => {
    const rule: FactLocatorRule = {
      factKey: "at_risk_fee_pool",
      patterns: [/at-risk fee pool of \$([\d,]+)/i],
      entityRef: "vendor-acme",
    };
    const { candidates, rejected } = parseDocumentToCandidates(DOC, [rule], CTX);
    expect(candidates).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].factKey).toBe("at_risk_fee_pool");
    expect(rejected[0].reason).toMatch(/no value could be located/i);
  });

  it("rejects a located token that is not a valid number for its unit", () => {
    const doc: ParsedDocument = {
      doc: "bad.pdf",
      blocks: [{ text: "transition fee is $unknown", locator: "p1" }],
    };
    const rule: FactLocatorRule = {
      factKey: "transition_fee",
      patterns: [/transition fee is \$(\w+)/i],
      entityRef: "vendor-acme",
    };
    const { candidates, rejected } = parseDocumentToCandidates(doc, [rule], CTX);
    expect(candidates).toHaveLength(0);
    expect(rejected[0].reason).toMatch(/not a valid number/i);
  });

  it("rejects an entity-level fact rule with no entityRef", () => {
    const rule: FactLocatorRule = {
      factKey: "transition_fee", // vendor-level → needs entityRef
      patterns: [/transition fee is \$([\d,]+)/i],
    };
    const { candidates, rejected } = parseDocumentToCandidates(DOC, [rule], CTX);
    expect(candidates).toHaveLength(0);
    expect(rejected[0].reason).toMatch(/requires an entityRef/i);
  });
});

describe("parseDocumentToCandidates — unknown / mistyped fact keys are rejected", () => {
  it("rejects a fact key that is not in the catalog", () => {
    const rule: FactLocatorRule = {
      factKey: "totally_made_up_key",
      patterns: [/\$([\d,]+)/],
    };
    const { candidates, rejected } = parseDocumentToCandidates(DOC, [rule], CTX);
    expect(candidates).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/not in the catalog/i);
  });
});

describe("applyValidationDecisions + commit — only confirmed/edited are committed", () => {
  function proposeAll(): CandidateFact[] {
    const { candidates } = parseDocumentToCandidates(
      DOC,
      [TRANSITION_RULE, CHANGE_ORDER_RULE, CREDIT_RULE],
      CTX,
    );
    expect(candidates).toHaveLength(3);
    return candidates;
  }

  it("confirm keeps the located value; edit overrides it and preserves the citation", () => {
    const candidates = proposeAll();
    const transition = candidates.find(
      (c) => c.insert.fact_key === "transition_fee",
    )!;
    const change = candidates.find(
      (c) => c.insert.fact_key === "annual_change_order_spend",
    )!;

    const { validated, unapplied } = applyValidationDecisions(candidates, [
      { candidateId: transition.candidateId, action: "confirm" },
      { candidateId: change.candidateId, action: "edit", valueNumeric: 999 },
    ]);
    expect(unapplied).toHaveLength(0);

    const confirmed = validated.find((v) => v.state === "confirmed")!;
    expect(confirmed.candidate.insert.value_numeric).toBe(250000);

    const edited = validated.find((v) => v.state === "edited")!;
    expect(edited.candidate.insert.value_numeric).toBe(999);
    // The citation survives the edit (evidence stays attached).
    expect(edited.candidate.insert.source_citation?.doc).toBe(
      "Acme AMS Proposal.pdf",
    );
    expect(edited.candidate.insert.source_citation?.edited_from).toBe(1200000);
  });

  it("selectCommittableInserts drops rejected AND still-proposed candidates", () => {
    const candidates = proposeAll();
    const [a, b, c] = candidates;

    // Only decide two of the three; the third remains 'proposed'.
    const { validated } = applyValidationDecisions(candidates, [
      { candidateId: a.candidateId, action: "confirm" },
      { candidateId: b.candidateId, action: "reject" },
    ]);
    // c was never decided → not in `validated` → never committed.
    void c;

    const inserts = selectCommittableInserts(validated, CTX);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].fact_key).toBe(a.insert.fact_key);
  });

  it("commitValidatedCandidates writes only confirmed/edited and reports dropped", async () => {
    const candidates = proposeAll();
    const [a, b] = candidates;
    const { validated } = applyValidationDecisions(candidates, [
      { candidateId: a.candidateId, action: "confirm" },
      { candidateId: b.candidateId, action: "reject" },
    ]);

    const insertFacts = jest.fn(async (facts: readonly unknown[]) => ({
      ok: true as const,
      data: { inserted: facts.length },
    }));
    const result = await commitValidatedCandidates(validated, CTX, {
      insertFacts,
    });

    expect(result.ok).toBe(true);
    expect(result.committed).toBe(1);
    expect(result.dropped).toBe(1); // the rejected one
    expect(insertFacts).toHaveBeenCalledTimes(1);
    const written = insertFacts.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(written).toHaveLength(1);
    expect(written[0].source_method).toBe("parsed");
  });

  it("commits nothing (no-op success) when every candidate is rejected", async () => {
    const candidates = proposeAll();
    const { validated } = applyValidationDecisions(
      candidates,
      candidates.map((c) => ({ candidateId: c.candidateId, action: "reject" as const })),
    );
    const insertFacts = jest.fn(async () => ({ ok: true as const, data: { inserted: 0 } }));
    const result = await commitValidatedCandidates(validated, CTX, { insertFacts });
    expect(result.ok).toBe(true);
    expect(result.committed).toBe(0);
    expect(result.dropped).toBe(candidates.length);
    expect(insertFacts).not.toHaveBeenCalled();
  });

  it("surfaces a decision that references an unknown candidate", () => {
    const candidates = proposeAll();
    const { unapplied } = applyValidationDecisions(candidates, [
      { candidateId: "does-not-exist", action: "confirm" },
    ]);
    expect(unapplied).toHaveLength(1);
    expect(unapplied[0].candidateId).toBe("does-not-exist");
  });
});

describe("groundModelProposals — the model locates, it never invents", () => {
  it("accepts a proposal whose token is literally present in the cited block (event fact)", () => {
    // An event-level fact grounds cleanly (no entityRef needed). A vendor-level
    // fact would reject under grounding because the seam supplies no entityRef —
    // that's intentional: the model locates a value, it does not decide entity
    // attachment, so entity-level facts still require the deterministic path.
    const { candidates, rejected } = groundModelProposals(
      DOC,
      [
        {
          factKey: "annual_change_order_spend",
          locator: "page 2, §Current State",
          rawToken: "1,200,000",
        },
      ],
      CTX,
    );
    expect(rejected).toHaveLength(0);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].insert.value_numeric).toBe(1200000);
    expect(candidates[0].insert.entity_kind).toBe("event");
    expect(candidates[0].insert.entity_ref).toBeNull();
  });

  it("rejects a proposal whose token is NOT present in the cited block (no hallucination)", () => {
    const { candidates, rejected } = groundModelProposals(
      DOC,
      [
        {
          factKey: "annual_change_order_spend",
          locator: "page 2, §Current State",
          rawToken: "9,999,999", // not in the block text
        },
      ],
      CTX,
    );
    expect(candidates).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/not present in block|refusing to invent/i);
  });

  it("rejects a proposal pointing at a locator that does not exist", () => {
    const { rejected } = groundModelProposals(
      DOC,
      [
        {
          factKey: "annual_change_order_spend",
          locator: "page 99, §Nowhere",
          rawToken: "1,200,000",
        },
      ],
      CTX,
    );
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/does not exist/i);
  });
});
