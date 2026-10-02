// Proof that the shared executive story spine and the deterministic-numbers
// mandate actually reach the generated prompt — the audit's recurring failure
// mode was well-written contracts that no prompt ever saw.

import {
  buildPassPrompt,
  deckLengthInstruction,
  requiredExhibitsInstruction,
} from "../prompt-builder";
import { getArtifactBrief } from "../artifact-brief-registry";
import { resolveQualityBar } from "../quality-bar-registry";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

function movesRequest(deliverableType: string): DeliverableIntelligenceRequest {
  const base = amsRfpRequest();
  return {
    ...base,
    module: "moves",
    deliverableType,
    qualityBar: resolveQualityBar("moves", deliverableType),
  };
}

function promptFor(deliverableType: string): string {
  const req = movesRequest(deliverableType);
  const brief = getArtifactBrief(req);
  return buildPassPrompt("full_draft", {
    req,
    brief,
    evidence: req.governedEvidenceBundle,
    approvedPlanJson: "{}",
  }).user;
}

describe("executive story spine reaches the prompt", () => {
  it("injects the P4 investment-case beats, in order, for a business case", () => {
    const prompt = promptFor("business_case");
    expect(prompt).toContain("EXECUTIVE STORY SPINE");
    for (const beat of [
      "Decision",
      "Why now",
      "What we are funding",
      "Investment",
      "Value",
      "Economics",
      "Delivery",
      "Roadmap and gates",
      "Risks and controls",
      "Recommendation",
    ]) {
      expect(prompt).toContain(beat);
    }
    expect(prompt.indexOf("3. What we are funding")).toBeLessThan(
      prompt.indexOf("4. Investment"),
    );
  });

  it("injects the P3 solution-decision beats for a solution design", () => {
    const prompt = promptFor("solution_design");
    expect(prompt).toContain("EXECUTIVE STORY SPINE");
    expect(prompt).toContain("Approaches considered");
    expect(prompt).toContain("End-to-end data flow");
    expect(prompt).toContain("Runtime and activation flow");
  });

  it("forbids reordering the spine", () => {
    expect(promptFor("business_case")).toMatch(/NOT reorder/);
  });

  it("omits the spine for an instrument with no narrative arc", () => {
    expect(promptFor("charter")).not.toContain("EXECUTIVE STORY SPINE");
  });

  it("omits the spine entirely for a non-Moves module", () => {
    const req = amsRfpRequest(); // module: "source"
    const brief = getArtifactBrief(req);
    const prompt = buildPassPrompt("full_draft", {
      req,
      brief,
      evidence: req.governedEvidenceBundle,
      approvedPlanJson: "{}",
    }).user;
    expect(prompt).not.toContain("EXECUTIVE STORY SPINE");
  });
});

describe("deterministic-numbers mandate", () => {
  it("forbids the model from computing any figure in a P4 artifact", () => {
    const prompt = promptFor("business_case");
    expect(prompt).toContain("NUMBERS ARE NOT YOURS TO COMPUTE");
    expect(prompt).toMatch(/deterministic pricing and value model/);
    // The specific failure this closes: "I was given the parts, so I may total
    // them." Arithmetic on supplied numbers is still the model computing.
    expect(prompt).toMatch(/not\s+even arithmetic on supplied numbers/i);
    expect(prompt).toMatch(/open input/i);
  });

  it("does not attach the mandate to artifacts that carry no economics", () => {
    for (const type of ["solution_design", "charter", "discovery_report"]) {
      expect(promptFor(type)).not.toContain("NUMBERS ARE NOT YOURS TO COMPUTE");
    }
  });
});

describe("required evidence signal prompting", () => {
  it("tells the model to preserve selected high-signal metrics", () => {
    const req = movesRequest("business_case");
    req.requiredEvidenceSignals = [
      {
        key: "closure-rate",
        label: "Overall care-gap closure rate",
        statement: "Overall care-gap closure rate: 41.2 % (as of FY2026)",
        citationNumber: 6,
      },
    ];
    const brief = getArtifactBrief(req);
    const prompt = buildPassPrompt("full_draft", {
      req,
      brief,
      evidence: req.governedEvidenceBundle,
      approvedPlanJson: "{}",
    }).user;

    expect(prompt).toContain("REQUIRED EVIDENCE SIGNALS TO CARRY FORWARD");
    expect(prompt).toContain("Overall care-gap closure rate");
    expect(prompt).toContain("41.2");
    expect(prompt).toMatch(/Preserve the exact number\/value/i);
  });
});

describe("size discipline reflects how length is actually measured", () => {
  it("tells the model tables are free when the band counts prose only", () => {
    const prompt = promptFor("business_case");
    expect(prompt).toMatch(/body words of PROSE/);
    expect(prompt).toMatch(/do not count toward this, so use them freely/);
  });

  it("keeps the plain wording for bands that count the whole body", () => {
    const prompt = promptFor("solution_design");
    expect(prompt).toMatch(/body words for this artifact type/);
    expect(prompt).not.toMatch(/body words of PROSE/);
  });
});

// The slide band is enforced by the quality gate. These pin that the pass
// which authors the deck is told the band it will be judged against.
describe("deck length reaches the pass that authors the deck", () => {
  function synthesisPrompt(req: DeliverableIntelligenceRequest): string {
    return buildPassPrompt("synthesis", {
      req,
      brief: getArtifactBrief(req),
      evidence: req.governedEvidenceBundle,
      sectionSummaries: [],
    } as never).user;
  }

  it("states the band for a deck deliverable built as PPTX", () => {
    const req = {
      ...movesRequest("target_state_architecture"),
      outputFormats: ["docx", "pptx"],
    } as DeliverableIntelligenceRequest;
    const instruction = deckLengthInstruction(req);
    expect(instruction).toContain("between 10 and 16 slides");
    expect(instruction).toContain("the design and its control points");
    expect(synthesisPrompt(req)).toContain(instruction);
  });

  it("says nothing when no deck is being built, or the deliverable is not a deck", () => {
    expect(
      deckLengthInstruction({
        ...movesRequest("target_state_architecture"),
        outputFormats: ["docx"],
      } as DeliverableIntelligenceRequest),
    ).toBe("");
    expect(
      deckLengthInstruction({
        ...movesRequest("charter"),
        outputFormats: ["docx", "pptx"],
      } as DeliverableIntelligenceRequest),
    ).toBe("");
  });
});

// The quality contract identifies an exhibit by its key. These pin that the
// pass which authors exhibits is told the keys it will be checked against.
describe("required exhibit keys reach the pass that authors exhibits", () => {
  it("names the contract's keys for a roadmap, spelled exactly", () => {
    const req = movesRequest("roadmap");
    const instruction = requiredExhibitsInstruction(req);
    expect(instruction).toContain(
      "roadmap_lanes, dependency_map, decision_calendar",
    );
    const synthesis = buildPassPrompt("synthesis", {
      req,
      brief: getArtifactBrief(req),
      evidence: req.governedEvidenceBundle,
      sectionDrafts: [],
    } as never).user;
    expect(synthesis).toContain(instruction);
  });

  it("states the rule an exhibit must meet to be kept", () => {
    // An authored exhibit is discarded unless it has typed data and a
    // description of at least three statements. The writer was told neither.
    const instruction = requiredExhibitsInstruction(movesRequest("roadmap"));
    expect(instruction).toContain("at least two nodes and one edge");
    expect(instruction).toContain("at least two cells");
    expect(instruction).toContain("at least three distinct statements");
    expect(instruction).toContain("a RACI");
  });

  it("leaves out exhibits another step produces", () => {
    // The open-inputs exhibit is the open-inputs table and checklist.
    const businessCase = requiredExhibitsInstruction(
      movesRequest("business_case"),
    );
    expect(businessCase).toContain("value_tree, decision_box.");
    expect(businessCase).not.toContain("open_inputs_required");
    // Architecture exhibits come from the structured architecture model.
    expect(
      requiredExhibitsInstruction(movesRequest("target_state_architecture")),
    ).toBe("");
    // Discovery exhibits are projected from the fixed deck outline.
    expect(requiredExhibitsInstruction(movesRequest("discovery_report"))).toBe(
      "",
    );
  });

  it("says nothing for a deliverable the contract does not cover", () => {
    expect(
      requiredExhibitsInstruction(movesRequest("requirements_traceability")),
    ).toBe("");
    expect(
      requiredExhibitsInstruction({
        ...movesRequest("roadmap"),
        module: "source",
      } as DeliverableIntelligenceRequest),
    ).toBe("");
  });
});
