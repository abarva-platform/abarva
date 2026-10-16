// PR-C: truncation + tenant-casing blockers on top of the existing validator.

import { validateDeliverableQuality } from "../quality-validator";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import {
  validatePurposeStory,
  unsupportedPurposeAbsences,
} from "../purpose-story-contract";
import { deckContract } from "../../shared/deck-story-contract";
import { CHARTER_CONTRACT } from "../../shared/artifact-contracts";
import { purposeFixture } from "../__fixtures__/purpose-pages";

describe("fresh purpose storyline contract", () => {
  function complete() {
    const doc = purposeFixture();
    doc.tables = [];
    doc.exhibits = [];
    doc.nextActions = [];
    doc.deckSlides = deckContract("REF_DECK_P2_DISCOVERY_READOUT").slides.map(
      (s) => ({
        key: s.id,
        governingMessage:
          s.id === "executive_answer"
            ? "Hold design until the definitions agree"
            : s.id.replaceAll("_", " "),
        points: ["Owner review is the next step."],
      }),
    );
    return doc;
  }
  it("accepts the P2 spine, then rejects every removed required beat", () => {
    expect(validatePurposeStory(complete(), [])).toEqual([]);
    for (const beat of deckContract(
      "REF_DECK_P2_DISCOVERY_READOUT",
    ).slides.filter((s) => s.required)) {
      const doc = complete();
      doc.deckSlides = doc.deckSlides!.filter((s) => s.key !== beat.id);
      expect(validatePurposeStory(doc, [])).toContain(
        `purpose_story:missing_beat:${beat.id}`,
      );
    }
  });
  it("rejects reordered beats and a P1 ask substituted for the finding", () => {
    const doc = complete();
    [doc.deckSlides![1], doc.deckSlides![2]] = [
      doc.deckSlides![2]!,
      doc.deckSlides![1]!,
    ];
    expect(validatePurposeStory(doc, []).join()).toContain("beat_order");
    doc.deckSlides![0]!.governingMessage =
      "Ask: test whether this opportunity merits Discovery";
    expect(validatePurposeStory(doc, [])).toContain(
      "purpose_story:forbidden_discovery_opener",
    );
  });
  it("counts a visible decision takeaway and distinguishes scope from absence", () => {
    const doc = complete();
    doc.deckSlides![0]!.governingMessage = "Measurement definitions differ";
    doc.deckSlides![0]!.pageIntent = {
      question: "Next decision?",
      scopeNote: "This page establishes no funding approval.",
      takeaway: "Hold design until definitions agree.",
    };
    expect(validatePurposeStory(doc, [])).toEqual([]);
    doc.deckSlides![0]!.pageIntent.scopeNote =
      "Proposed for sponsor decision; records no build approval or funding.";
    expect(validatePurposeStory(doc, [])).toEqual([]);
    doc.deckSlides![0]!.pageIntent.scopeNote =
      "No evidence has been collected.";
    expect(validatePurposeStory(doc, []).join()).toContain(
      "unsupported_absence",
    );
  });
  it("requires the P1 charter contract rather than a separate evidence-plan appendix", () => {
    const doc = complete();
    doc.deliverableType = "charter";
    doc.deckSlides = [];
    doc.generatedSections = CHARTER_CONTRACT.sections.map((s) => ({
      key: s.key,
      title: s.title,
      bodyMarkdown: "Owner review is the next step.",
      groundingMode: "expert_template",
      citationsUsed: [],
    }));
    expect(validatePurposeStory(doc, [])).toEqual([]);
    doc.generatedSections.pop();
    expect(validatePurposeStory(doc, [])).toContain(
      "purpose_story:missing_beat:authorization_conditions",
    );
  });
  it("refuses a draft that purports to grant its own authorization", () => {
    const doc = complete();
    doc.deliverableType = "charter";
    doc.generatedSections = CHARTER_CONTRACT.sections.map((s) => ({
      key: s.key,
      title: s.title,
      bodyMarkdown: "Owner review pending.",
      groundingMode: "expert_template" as const,
      citationsUsed: [],
    }));
    doc.recommendation = "This charter authorizes Discovery.";
    expect(validatePurposeStory(doc, [])).toContain(
      "purpose_story:draft_claims_authorization",
    );
    doc.recommendation = "If approved, this charter authorizes Discovery.";
    expect(validatePurposeStory(doc, [])).toEqual([]);
    doc.recommendation =
      "If approved, the team may proceed. This charter authorizes Discovery.";
    expect(validatePurposeStory(doc, [])).toContain(
      "purpose_story:draft_claims_authorization",
    );
  });
  it("permits distinct appendices only after the complete core spine", () => {
    const doc = complete();
    doc.deckSlides!.push({
      key: "appendix_evidence",
      governingMessage: "Evidence detail",
      points: ["Owner review pending."],
    });
    expect(validatePurposeStory(doc, [])).toEqual([]);
    doc.deckSlides!.push({ ...doc.deckSlides!.at(-1)! });
    expect(validatePurposeStory(doc, []).join()).toContain(
      "beat_order:appendix_evidence",
    );
    const early = complete();
    early.deckSlides!.splice(1, 0, {
      key: "appendix_evidence",
      governingMessage: "Evidence detail",
      points: [],
    });
    expect(validatePurposeStory(early, []).join()).toContain(
      "beat_order:appendix_evidence",
    );
  });
  it("requires an explicit cited absence, not a plan, unrelated absence, or changed citation", () => {
    const claim = "No baseline has been collected. [1]";
    expect(
      unsupportedPurposeAbsences(claim, [
        { citationNumber: 1, statement: "Evidence plan: baseline to collect." },
      ]),
    ).toEqual([claim]);
    const sources = [
      { citationNumber: 1, statement: "No baseline has been collected." },
    ];
    expect(unsupportedPurposeAbsences(claim, sources)).toEqual([]);
    expect(
      unsupportedPurposeAbsences(
        "No baseline has been collected [1].",
        sources,
      ),
    ).toEqual([]);
    expect(
      unsupportedPurposeAbsences(
        "No baseline has been collected [2].",
        sources,
      ),
    ).toHaveLength(1);
    expect(
      unsupportedPurposeAbsences(
        'Source states: "No baseline has been collected." [1]',
        sources,
      ),
    ).toEqual([]);
    expect(
      unsupportedPurposeAbsences(
        'No interviews exist; source states: "No baseline has been collected." [1]',
        sources,
      ),
    ).toHaveLength(1);
    expect(
      unsupportedPurposeAbsences(
        '"No baseline has been collected." [1] and "No interviews were collected." [2]',
        [
          ...sources,
          { citationNumber: 2, statement: "No interviews were collected." },
        ],
      ),
    ).toEqual([]);
    expect(
      unsupportedPurposeAbsences(claim.replace("[1]", "[2]"), sources),
    ).toHaveLength(1);
    expect(
      unsupportedPurposeAbsences("No interviews were collected. [1]", sources),
    ).toHaveLength(1);
    expect(
      unsupportedPurposeAbsences(
        "Confirm whether the baseline is missing.",
        [],
      ),
    ).toEqual([]);
    expect(
      unsupportedPurposeAbsences("Review found no baseline.", []),
    ).toHaveLength(1);
  });
  it("retains spreadsheet array text while removing only citation tokens", () => {
    const source = {
      citationNumber: 4,
      statement:
        'row 7: ["Access owner", "Authorization end dates are missing in legacy entries", "Review pending"]',
    };
    expect(
      unsupportedPurposeAbsences(
        '"Authorization end dates are missing in legacy entries" [4]',
        [source],
      ),
    ).toEqual([]);
    expect(
      unsupportedPurposeAbsences('"No authorizations were received" [4]', [
        source,
      ]),
    ).toHaveLength(1);
  });
  it.each(["synthetic", "invented", "fixture", "demo"])(
    "rejects %s in visible authored text, but not the footer",
    (word) => {
      const doc = complete();
      doc.presentationCover = { classification: "Synthetic scenario" };
      expect(validatePurposeStory(doc, [])).toEqual([]);
      doc.deckSlides![1]!.governingMessage = `A ${word} finding`;
      expect(validatePurposeStory(doc, []).join()).toContain(
        "classification_in_body",
      );
    },
  );
  it("reaches the real quality gate only for enrolled purpose output", () => {
    const req = {
      ...amsRfpRequest(),
      deliverableType: "discovery_report",
      purposePageDesign: true,
    };
    const doc = complete();
    doc.deckSlides!.shift();
    expect(validateDeliverableQuality(doc, req).blockers).toContain(
      "purpose_story:missing_beat:executive_answer",
    );
    expect(
      validateDeliverableQuality(doc, {
        ...req,
        purposePageDesign: false,
      }).blockers.join(),
    ).not.toContain("purpose_story:");
  });
});

describe("quality validator — truncation + tenant casing", () => {
  it("a clean board document still passes", () => {
    const res = validateDeliverableQuality(goodDocument(), amsRfpRequest());
    expect(res.pass).toBe(true);
    expect(res.blockers).toHaveLength(0);
  });

  it("blocks a section that ends mid-sentence (likely truncation)", () => {
    const doc = goodDocument();
    const longUnterminated =
      "This section develops the analysis at length and continues describing the operating model and dependencies across many teams " +
      "without ever reaching a terminal punctuation mark because the model ran out of output tokens partway through the final clause and";
    doc.generatedSections[0].bodyMarkdown = longUnterminated;
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/truncat/i);
  });

  it("does not flag a short section as truncated", () => {
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown = "Brief intro without a period";
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.blockers.join(" ")).not.toMatch(/truncat/i);
  });

  it("does not flag a long section that ends on a markdown table or list (decomposed sections legitimately do)", () => {
    const tableEnding =
      "## Risks, Issues and Dependencies\nThe programme carries the following risks, each with an owner and a mitigation, tracked through the steering cadence and reviewed at every gate as the operating model and dependencies evolve across the delivery teams over time.\n\n" +
      "| Risk | Owner | Mitigation |\n| --- | --- | --- |\n| Transition risk | PMO | Phased cutover with coexistence |\n| Data quality | CDO | Profiling and remediation backlog |";
    const listEnding =
      "## Recommended Next Steps\nWe recommend proceeding to fund the shaping work given the validated scope and the costed range, and to mobilise the first wave at the primary hub while the foundation is established for later waves and reuse across the estate.\n\n" +
      "- Issue the RFP to the shortlisted vendors\n- Brief vendors and open the evaluation window\n- Stand up programme governance and decision rights";
    const d1 = goodDocument();
    d1.generatedSections[0].bodyMarkdown = tableEnding;
    const d2 = goodDocument();
    d2.generatedSections[0].bodyMarkdown = listEnding;
    expect(
      validateDeliverableQuality(d1, amsRfpRequest()).blockers.join(" "),
    ).not.toMatch(/truncat/i);
    expect(
      validateDeliverableQuality(d2, amsRfpRequest()).blockers.join(" "),
    ).not.toMatch(/truncat/i);
  });

  it("blocks a raw tenant slug as the display name", () => {
    const doc = goodDocument();
    doc.clientDisplayName = "skyharbor";
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/raw slug/i);

    doc.clientDisplayName = "apex_retail";
    expect(
      validateDeliverableQuality(doc, amsRfpRequest()).blockers.join(" "),
    ).toMatch(/raw slug/i);
  });

  it("accepts a proper client display name", () => {
    const doc = goodDocument();
    doc.clientDisplayName = "SkyHarbor Air";
    const res = validateDeliverableQuality(doc, amsRfpRequest());
    expect(res.blockers.join(" ")).not.toMatch(/raw slug/i);
  });

  it("blocks visible placeholder labels in client-facing visual sections", () => {
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown +=
      "\n\n## Visual Exhibits\n\nBuild / Buy matrix\n\nplaceholder: matrix";

    const res = validateDeliverableQuality(doc, amsRfpRequest());

    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/visible exhibit placeholder/i);
  });

  it("blocks placeholder exhibit metadata before export", () => {
    const doc = goodDocument();
    doc.exhibits[0] = {
      ...doc.exhibits[0],
      title: "Process diagram placeholder",
      description: "Visual to be inserted after review.",
    };

    const res = validateDeliverableQuality(doc, amsRfpRequest());

    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/visible exhibit placeholder/i);
  });

  it("blocks when a required evidence signal disappears from the artifact", () => {
    const req = amsRfpRequest({
      requiredEvidenceSignals: [
        {
          key: "closure-rate",
          label: "Overall care-gap closure rate",
          statement: "Overall care-gap closure rate: 41.2 % (as of FY2026)",
          citationNumber: 6,
        },
      ],
    });
    const doc = goodDocument();

    const res = validateDeliverableQuality(doc, req);

    expect(res.pass).toBe(false);
    expect(res.blockers.join(" ")).toMatch(/required evidence signal/i);
    expect(res.metrics.requiredEvidenceSignalCount).toBe(1);
    expect(res.metrics.missingRequiredEvidenceSignalCount).toBe(1);
  });

  it("passes when the required evidence signal is carried with its value and meaning", () => {
    const req = amsRfpRequest({
      requiredEvidenceSignals: [
        {
          key: "closure-rate",
          label: "Overall care-gap closure rate",
          statement: "Overall care-gap closure rate: 41.2 % (as of FY2026)",
          citationNumber: 6,
        },
      ],
    });
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown +=
      "\n\nThe overall care-gap closure rate is 41.2% as of FY2026 [6].";
    doc.sourceRegister.push({
      citationNumber: 6,
      label: "Overall care-gap closure rate",
      evidenceFamily: "baseline_metric",
      confidence: "high",
      asOf: "FY2026",
    });

    const res = validateDeliverableQuality(doc, req);

    expect(res.blockers.join(" ")).not.toMatch(/required evidence signal/i);
    expect(res.metrics.missingRequiredEvidenceSignalCount).toBe(0);
  });
});
