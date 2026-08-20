// Proof that the shared executive story spine and the deterministic-numbers
// mandate actually reach the generated prompt — the audit's recurring failure
// mode was well-written contracts that no prompt ever saw.

import { buildPassPrompt } from "../prompt-builder";
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
