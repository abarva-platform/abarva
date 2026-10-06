import { resolvePhaseCaptureHold } from "@/lib/programs/phase-capture-hold";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";

describe("resolvePhaseCaptureHold", () => {
  it("names the unfinished capture when questions are still unanswered", () => {
    const hold = resolvePhaseCaptureHold({
      unansweredCount: 3,
      evidenceHeldCount: 0,
      openRequiredEvidenceSlots: [],
    });
    expect(hold).toEqual({
      kind: "inputs",
      count: 3,
      message: "Complete 3 phase inputs before Approve & Build.",
    });
  });

  it("keeps the singular wording for one unanswered question", () => {
    expect(
      resolvePhaseCaptureHold({
        unansweredCount: 1,
        evidenceHeldCount: 0,
        openRequiredEvidenceSlots: [],
      })?.message,
    ).toBe("Complete 1 phase input before Approve & Build.");
  });

  // THE DEFECT. Every question answered and saved, sections reported
  // incomplete only by the phase evidence verdict. The old sentence told the
  // person to complete inputs that are already complete and never mentioned
  // evidence, so at P4 there was nothing on the screen that could clear it.
  it("blames the open evidence, not the captured inputs, when nothing is left to type", () => {
    const hold = resolvePhaseCaptureHold({
      unansweredCount: 0,
      evidenceHeldCount: 7,
      openRequiredEvidenceSlots: [
        "Data governance ownership",
        "Semantic layer certification",
      ],
    });
    expect(hold?.kind).toBe("evidence");
    expect(hold?.message).toContain("Phase inputs are captured.");
    expect(hold?.message).toContain("2 required evidence items");
    expect(hold?.message).toContain("Data governance ownership");
    expect(hold?.message).toContain("Files & Evidence");
    // The seven held sections are complete; the sentence must not count them.
    expect(hold?.message).not.toContain("7");
    expect(hold?.message).not.toMatch(/Complete \d+ phase input/);
  });

  it("counts the open evidence, not the held sections", () => {
    expect(
      resolvePhaseCaptureHold({
        unansweredCount: 0,
        evidenceHeldCount: 7,
        openRequiredEvidenceSlots: ["Data governance ownership"],
      })?.count,
    ).toBe(1);
  });

  it("summarises past three open evidence items instead of listing all of them", () => {
    const message = resolvePhaseCaptureHold({
      unansweredCount: 0,
      evidenceHeldCount: 7,
      openRequiredEvidenceSlots: ["A one", "B two", "C three", "D four", "E five"],
    })?.message;
    expect(message).toContain("5 required evidence items");
    expect(message).toContain("A one, B two, C three, +2 more");
    expect(message).not.toContain("D four");
  });

  it("uses singular verb and pronoun for a single open evidence item", () => {
    const message = resolvePhaseCaptureHold({
      unansweredCount: 0,
      evidenceHeldCount: 4,
      openRequiredEvidenceSlots: ["Data lineage audit trail"],
    })?.message;
    // The noun is asserted with the character that follows it. "1 required
    // evidence item" alone is also a substring of the ungrammatical "1
    // required evidence items", so a pluralisation regression would read as a
    // pass. Here the named-slot parenthesis sits between the noun and "is".
    expect(message).toContain("1 required evidence item (Data lineage audit trail) is still open");
    expect(message).toContain("approve it in Files & Evidence");
  });

  // An evidence hold whose open items are known only as a count must not
  // invent a name for them.
  it("states an evidence hold with no named item when no slot label is supplied", () => {
    const hold = resolvePhaseCaptureHold({
      unansweredCount: 0,
      evidenceHeldCount: 2,
      openRequiredEvidenceSlots: [],
    });
    expect(hold?.kind).toBe("evidence");
    expect(hold?.count).toBe(2);
    expect(hold?.message).not.toContain("(");
  });

  it("ignores blank slot labels rather than naming an empty item", () => {
    const message = resolvePhaseCaptureHold({
      unansweredCount: 0,
      evidenceHeldCount: 1,
      openRequiredEvidenceSlots: ["   ", ""],
    })?.message;
    expect(message).not.toContain("(");
    expect(message).toContain("1 required evidence item");
  });

  // Unfinished typing is on the same screen, so it is the more actionable
  // reason and must win over the evidence hold.
  it("prefers the unanswered capture when both holds apply", () => {
    expect(
      resolvePhaseCaptureHold({
        unansweredCount: 2,
        evidenceHeldCount: 5,
        openRequiredEvidenceSlots: ["Data governance ownership"],
      })?.kind,
    ).toBe("inputs");
  });

  it("holds nothing when the phase is fully captured and its evidence is covered", () => {
    expect(
      resolvePhaseCaptureHold({
        unansweredCount: 0,
        evidenceHeldCount: 0,
        openRequiredEvidenceSlots: ["ignored when nothing is held"],
      }),
    ).toBeNull();
  });

  it("treats a negative or fractional count as no hold of that kind", () => {
    expect(
      resolvePhaseCaptureHold({
        unansweredCount: -4,
        evidenceHeldCount: 0,
        openRequiredEvidenceSlots: [],
      }),
    ).toBeNull();
    expect(
      resolvePhaseCaptureHold({
        unansweredCount: 0.5,
        evidenceHeldCount: 0,
        openRequiredEvidenceSlots: [],
      }),
    ).toBeNull();
  });

  // The hold is reachable for every phase the redesigned capture serves, and
  // P4/P5 is where it bites: those sections declare no `evidenceFamily` of
  // their own, so they are the ones the blanket phase verdict holds.
  it.each([3, 4, 5])(
    "P%i capture declares no per-section evidence family, so the blanket verdict is what holds it",
    (phase) => {
      const sections = getPhaseCaptureSections(phase);
      expect(sections.length).toBeGreaterThan(0);
      expect(sections.every((section) => !section.evidenceFamily)).toBe(true);
    },
  );
});
