import {
  proposeCaptureValuesFromNotes,
  type CaptureNotesTarget,
} from "@/lib/programs/capture-notes-proposal";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

const section = (
  key: string,
  label: string,
  description: string,
  extra: Partial<PhaseCaptureSection> = {},
): PhaseCaptureSection => ({
  key,
  label,
  description,
  required: true,
  ...extra,
});

const SPONSOR = section(
  "sponsor_commitment",
  "Sponsor commitment",
  "The named executive sponsor, their cadence of progress updates, and what they have committed.",
);
const SCOPE_OUT = section(
  "scope_boundary",
  "Scope boundary",
  "The boundary of this Move: which queues, systems, and cohorts are excluded.",
);
const METRICS = section(
  "success_criteria",
  "Success criteria",
  "The measurable outcome that decides whether this Move succeeded.",
);

const target = (s: PhaseCaptureSection, value = ""): CaptureNotesTarget => ({
  section: s,
  value,
});

const NOTES = [
  "Sponsor is the COO; she committed to a fortnightly cadence of progress updates.",
  "",
  "Excluded queues: the billing systems and the offshore cohorts stay outside the boundary this year.",
  "",
  "The measurable outcome is a 30% cut in manual touches, which decides whether we proceed.",
].join("\n");

describe("proposeCaptureValuesFromNotes", () => {
  it("proposes one field per note block, in capture order", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: NOTES,
      targets: [target(SPONSOR), target(SCOPE_OUT), target(METRICS)],
    });

    expect(result.proposals.map((p) => p.sectionKey)).toEqual([
      "sponsor_commitment",
      "scope_boundary",
      "success_criteria",
    ]);
  });

  it("quotes the pasted notes verbatim — every excerpt is a substring of the input", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: NOTES,
      targets: [target(SPONSOR), target(SCOPE_OUT), target(METRICS)],
    });

    expect(result.proposals.length).toBeGreaterThan(0);
    for (const proposal of result.proposals) {
      expect(NOTES).toContain(proposal.excerpt);
      expect(proposal.sourceLine).toBeGreaterThan(0);
      // The cited line is the line the excerpt actually starts on.
      const lines = NOTES.split("\n");
      expect(lines[proposal.sourceLine - 1]).toContain(
        proposal.excerpt.split(" ")[0],
      );
    }
  });

  it("records a note-derived fill as an assertion, never as approved evidence", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: NOTES,
      targets: [target(SPONSOR), target(SCOPE_OUT), target(METRICS)],
    });

    expect(result.proposals.length).toBeGreaterThan(0);
    for (const proposal of result.proposals) {
      expect(proposal.basis).toBe("workspace_assertion");
    }
    expect(JSON.stringify(result)).not.toContain("approved_evidence");
  });

  it("never proposes into a field that already holds a value", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: NOTES,
      targets: [
        target(SPONSOR, "The CFO sponsors this, monthly."),
        target(SCOPE_OUT),
        target(METRICS),
      ],
    });

    expect(result.skippedAnswered).toEqual(["sponsor_commitment"]);
    expect(result.proposals.map((p) => p.sectionKey)).not.toContain(
      "sponsor_commitment",
    );
  });

  it("treats a whitespace-only value as unanswered", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: NOTES,
      targets: [target(SPONSOR, "   \n  ")],
    });

    expect(result.skippedAnswered).toEqual([]);
    expect(result.proposals.map((p) => p.sectionKey)).toEqual([
      "sponsor_commitment",
    ]);
  });

  it("never proposes prose into a structured (JSON) field", () => {
    const facts = section(
      "diagnosis_facts",
      "Diagnosis facts",
      "The measurable outcome facts and progress updates for the excluded queues.",
      { structured: "facts" },
    );

    const result = proposeCaptureValuesFromNotes({
      notes: NOTES,
      targets: [target(facts)],
    });

    expect(result.skippedStructured).toEqual(["diagnosis_facts"]);
    expect(result.proposals).toEqual([]);
  });

  it("proposes nothing when a block shares only one term with a section", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: "Sponsor.\nThe weather in the office was unremarkable today.",
      targets: [target(SPONSOR)],
    });

    expect(result.proposals).toEqual([]);
    expect(result.unmatchedSections).toEqual(["sponsor_commitment"]);
  });

  it("returns an empty result for empty notes without claiming a skip", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: "   \n\n  ",
      targets: [target(SPONSOR), target(METRICS)],
    });

    expect(result.proposals).toEqual([]);
    expect(result.unusedBlocks).toBe(0);
    expect(result.unmatchedSections).toEqual([
      "sponsor_commitment",
      "success_criteria",
    ]);
  });

  it("uses one block at most once, so no two fields get the same excerpt", () => {
    // One block that scores against both sponsor and metrics.
    const notes =
      "The sponsor committed to a measurable outcome with fortnightly progress updates that decides the cadence.";

    const result = proposeCaptureValuesFromNotes({
      notes,
      targets: [target(SPONSOR), target(METRICS)],
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.unusedBlocks).toBe(0);
  });

  it("splits bullets into their own blocks so one excerpt is one fact", () => {
    const notes = [
      "- Sponsor is the COO, committed to fortnightly progress updates.",
      "- Excluded: the billing systems and offshore cohorts are outside the boundary.",
    ].join("\n");

    const result = proposeCaptureValuesFromNotes({
      notes,
      targets: [target(SPONSOR), target(SCOPE_OUT)],
    });

    expect(result.proposals).toHaveLength(2);
    for (const proposal of result.proposals) {
      // The bullet marker is stripped, but the words are the pasted words.
      expect(proposal.excerpt.startsWith("-")).toBe(false);
      expect(notes).toContain(proposal.excerpt);
    }
  });

  it("is deterministic across repeated runs", () => {
    const targets = [target(SPONSOR), target(SCOPE_OUT), target(METRICS)];
    const first = proposeCaptureValuesFromNotes({ notes: NOTES, targets });
    const second = proposeCaptureValuesFromNotes({ notes: NOTES, targets });

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it("shows which words earned the match, so the reviewer can judge it", () => {
    const result = proposeCaptureValuesFromNotes({
      notes: NOTES,
      targets: [target(SPONSOR)],
    });

    const proposal = result.proposals[0];
    expect(proposal).toBeDefined();
    expect(proposal.matchedTerms.length).toBeGreaterThanOrEqual(2);
    for (const term of proposal.matchedTerms) {
      expect(proposal.excerpt.toLowerCase()).toContain(term);
    }
  });
});
