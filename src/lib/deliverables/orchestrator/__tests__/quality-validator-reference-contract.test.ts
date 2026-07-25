// REF_EXECUTIVE_ROADMAP pilot (2026-07-25): the first real checks that a
// QualityBar's requiredExhibitElementsByKind / forbiddenContentPatterns
// actually get validated, not just read into the prompt (prompt-builder.ts
// already did that for requiredElements — this is the new part).

import { validateDeliverableQuality } from "../quality-validator";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import { resolveQualityBar } from "../quality-bar-registry";
import { EXECUTIVE_ROADMAP_REFERENCE } from "@/lib/deliverables/shared/reference-library/executive-roadmap-reference";

function roadmapReq() {
  return amsRfpRequest({
    module: "moves",
    deliverableType: "roadmap",
    qualityBar: {
      ...amsRfpRequest().qualityBar,
      ...resolveQualityBar("moves", "roadmap"),
      minBodyWords: 0,
    },
  });
}

describe("quality validator — requiredExhibitElementsByKind (REF_EXECUTIVE_ROADMAP)", () => {
  it("warns (does not block) when a roadmap exhibit is missing required elements", () => {
    const doc = goodDocument();
    doc.exhibits = [
      {
        key: "executive_roadmap",
        title: "Roadmap",
        kind: "roadmap",
        description: "A generic sequencing diagram.",
        targetFormat: "docx",
      },
    ];
    const res = validateDeliverableQuality(doc, roadmapReq());
    expect(res.pass).toBe(true);
    expect(
      res.warnings.some((w) => w.includes("missing required elements")),
    ).toBe(true);
    expect(res.warnings.join(" ")).toMatch(/Mobilize/);
  });

  it("does not warn when the roadmap exhibit states the required elements", () => {
    const doc = goodDocument();
    doc.exhibits = [
      {
        key: "executive_roadmap",
        title: "Executive Transition Roadmap",
        kind: "roadmap",
        description:
          "Mobilize, Establish Foundation, Deliver Priority Outcomes, and Scale and Optimize horizons, each with a decision gate, named owner, dependency, and success measure.",
        targetFormat: "docx",
      },
    ];
    const res = validateDeliverableQuality(doc, roadmapReq());
    expect(
      res.warnings.some((w) => w.includes("missing required elements")),
    ).toBe(false);
  });

  it("does not check exhibits of a different kind against roadmap's required elements", () => {
    const doc = goodDocument(); // ships a 'matrix' exhibit, not 'roadmap'
    const res = validateDeliverableQuality(doc, roadmapReq());
    expect(
      res.warnings.some((w) => w.includes("missing required elements")),
    ).toBe(false);
  });
});

describe("quality validator — forbiddenContentPatterns (REF_EXECUTIVE_ROADMAP)", () => {
  it("warns (does not block) when the body reads like an implementation schedule", () => {
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown +=
      "\n\nSprint 3 delivers the integration; Day 45 is the cutover date.";
    const res = validateDeliverableQuality(doc, roadmapReq());
    expect(res.pass).toBe(true);
    expect(
      res.warnings.some((w) => w.includes("implementation schedule")),
    ).toBe(true);
  });

  it("does not warn on clean executive sequencing language", () => {
    const doc = goodDocument();
    const res = validateDeliverableQuality(doc, roadmapReq());
    expect(
      res.warnings.some((w) => w.includes("implementation schedule")),
    ).toBe(false);
  });

  it("uses the same forbidden patterns as the shared reference contract", () => {
    const qb = resolveQualityBar("moves", "roadmap");
    expect(qb.forbiddenContentPatterns).toBe(
      EXECUTIVE_ROADMAP_REFERENCE.forbiddenPatterns,
    );
  });
});
