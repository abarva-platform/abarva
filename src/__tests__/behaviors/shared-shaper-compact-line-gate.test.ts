/**
 * Backlog item C-505 — the line half of the first rebuild gate in
 * `compactForChat` IS reachable, and it decides the outcome.
 *
 * C-505 was filed out of C-503 with this claim: the second operand of
 *
 *   compact.length <= targetChars && countCompactLines(compact) <= maxParagraphs
 *
 * "cannot be false", because the rebuild is
 * `lines.slice(0, maxParagraphs).join("\n")` and every part is single-line by
 * construction. Its acceptance asked for a decision between deleting the
 * operand as redundant and making it reachable. **Measurement resolved the
 * decision instead of taste**: it is already reachable, so deleting it is a
 * behaviour change and not a tidy-up, and this suite is what stops the next
 * reader making that change on the strength of a comment.
 *
 * THE PATH THE C-503 MEASUREMENT MISSED, and it is two mistakes rather than
 * one:
 *
 *  1. `normalizeAssemblyArtifacts` rewrites `" — Breakdown:"` to a newline,
 *     and C-503 recorded that the pattern is consumed upstream of the
 *     rebuild. It is consumed on the PROSE path — `proseOnly` is re-run
 *     through `normalizeAssemblyArtifacts` inside `compactForChat`, so the
 *     lead, the support bullets and the next line cannot carry it. But
 *     `tableToCompactLines` reads `normalized`, which is the one text
 *     feeding the rebuild that is NOT re-run through it after
 *     `replaceLabels` has substituted caller-supplied label text into the
 *     answer. A label is injected after the entry point's single
 *     `normalizeAssemblyArtifacts` pass and before `compactForChat`.
 *  2. The table branch neutralises the em dash only (`/\s+—\s+/g` becomes
 *     `": "`), while the artifact rule matches a hyphen, an en dash AND an
 *     em dash (`/\s+[-–—]\s+Breakdown\s*:/`). So the hyphen and en-dash
 *     forms survive the branch that was supposed to make them harmless and
 *     insert a line break into an entry at rebuild time.
 *
 * Both cases below are measured, not asserted: the first pins that the
 * rebuild really does exceed the line budget while staying under the
 * character target — which is exactly the state the operand exists to catch
 * — and the second pins that the answer the reader gets is the one the gate
 * chose. Deleting the operand turns the second red.
 *
 * The em-dash asymmetry in (2) is left standing deliberately. Widening the
 * table branch to `[-–—]` would close this path and make the operand
 * unreachable again, which is C-505's deletion option arriving by a longer
 * route; it is a behaviour change on real table answers and belongs to its
 * own reviewed item, not to a test that was written to correct a claim.
 *
 * C-510 UPDATED THIS SUITE IN PLACE, 2026-09-24, and the update is a
 * DEMOTION rather than a repair. The last paragraph above left the em-dash
 * asymmetry standing on purpose and predicted that closing it "would make
 * the operand unreachable again". C-510 closed it, and the prediction was
 * correct: searched over 24,900 constructed inputs with the gate
 * instrumented to record both operands, no input drives the first rebuild
 * over its line budget while under its character target any more. The
 * identical search against the pre-C-510 rule finds 3,904 such inputs over
 * an identical 17,331 gate evaluations, so the zero is a measurement and
 * not a blind spot.
 *
 * What that costs this suite, stated plainly rather than papered over:
 * THIS SUITE NO LONGER PROVES THE OPERAND IS REACHABLE, because it is not.
 * Case one still passes and still asserts something real — the answer obeys
 * its line budget — but it passes for a NEW reason: the rebuild no longer
 * overruns, rather than the operand rescuing an overrun. Case three's
 * "strictly longer" assertion could not survive at all; it is replaced
 * below by the equality that took its place, with the reasoning beside it.
 * Deleting the line operand today fails nothing here.
 *
 * The operand is nonetheless KEPT, and the decision to keep or delete an
 * unreachable guard is filed back to the backlog rather than taken in a
 * test file. Do not read this suite as evidence for either side of that
 * decision; read `shared-shaper-table-dash-class.test.ts`, which carries
 * the search.
 */

import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";

/**
 * A table answer over the 900-character target, so the compactor runs. Two
 * value cells carry ids; the labels that map them carry `" - Breakdown: "`,
 * which is the shape a value label legitimately takes in these answers —
 * `"Breakdown:"` is a real token in assembled advisor prose, which is why
 * `normalizeAssemblyArtifacts` has a rule for it at all.
 */
const TABLE_ANSWER = [
  "The renewal position is worth opening before the March call because the run rate has moved and nobody has re-read the terms since the last extension was signed.",
  "",
  "| Vendor | Value | Note |",
  "| --- | --- | --- |",
  "| Northwind | NW-VAL-0001 | renewal March |",
  "| Crestline | NW-VAL-0002 | renewal May |",
  "| Halden | $0.7M | renewal August |",
  "",
  "My read is that this is a scope problem rather than a price problem, and the vendor will open on price because that is the only lever they control in this cycle.",
  "Evidence for that read is the usage export, which shows zero sessions against the reporting module and the forecasting module for the last four months of the term.",
  "A second concentration sits behind it: the same owner signed three of the four renewals in this portfolio, so the negotiating position is weaker than the spend suggests.",
  "What I would do next: pull the usage export for those two modules and put the owner who signed for them in the first call.",
].join("\n");

const LABELS = [
  { id: "NW-VAL-0001", label: "$1.2M - Breakdown: modules idle" },
  { id: "NW-VAL-0002", label: "$0.9M - Breakdown: seats spare" },
];

const TARGET_CHARS = 900;
const MAX_PARAGRAPHS = 5;

function visibleLines(text: string): string[] {
  return text.split("\n").filter((line) => line.trim().length > 0);
}

describe("C-505 — the compact rebuild's line budget is load-bearing", () => {
  it("the answer the compactor returns obeys the line budget it was given", () => {
    const shaped = shapeSharedAdvisorResponse({
      text: TABLE_ANSWER,
      targetChars: TARGET_CHARS,
      maxParagraphs: MAX_PARAGRAPHS,
      labels: LABELS,
    });

    // The input is genuinely over target, so the compactor runs rather than
    // returning the answer whole.
    expect(TABLE_ANSWER.length).toBeGreaterThan(TARGET_CHARS);

    // This is the assertion the operand carries. The first rebuild of this
    // answer comes in at 534 characters — comfortably under the 900-char
    // target, so the character half of the gate passes it — but at six
    // visible lines against a five-line budget, because two label
    // substitutions each insert a line break into the table entry. With the
    // line operand removed, that six-line rebuild is what is returned and
    // this expectation reads 6.
    expect(visibleLines(shaped.text).length).toBeLessThanOrEqual(
      MAX_PARAGRAPHS,
    );
  });

  it("the label text that caused the overrun still reaches the reader", () => {
    const shaped = shapeSharedAdvisorResponse({
      text: TABLE_ANSWER,
      targetChars: TARGET_CHARS,
      maxParagraphs: MAX_PARAGRAPHS,
      labels: LABELS,
    });

    // Both ids are mapped rather than left raw or scrubbed to the unmapped
    // placeholder: the overrun is caused by real substituted text, not by an
    // artefact of an id that failed to resolve. Without this the first case
    // could pass for the wrong reason — an answer that lost the table
    // entirely also has five lines.
    expect(shaped.replacements.map((entry) => entry.from).sort()).toEqual([
      "NW-VAL-0001",
      "NW-VAL-0002",
    ]);
    expect(shaped.text).toContain("Breakdown: modules idle");
  });

  it("the same answer with artifact-free labels is now the SAME answer", () => {
    // Was the negative control for a rescue that no longer happens, and it
    // is kept rather than deleted because what it measures is still the
    // right question — it is the ANSWER that changed, not the question.
    //
    // Before C-510 this input took the first rebuild while the artifact
    // labels above were pushed to the harsher second one, so it was
    // strictly longer and that gap was the cost the operand existed to
    // impose. C-510 neutralises the artifact in the table branch, both
    // inputs now take the first rebuild, and the gap is gone. Asserting the
    // equality rather than deleting the case keeps the collapse detectable:
    // if a future change sends either input to a later rebuild, these two
    // stop matching.
    const artifactFree = shapeSharedAdvisorResponse({
      text: TABLE_ANSWER,
      targetChars: TARGET_CHARS,
      maxParagraphs: MAX_PARAGRAPHS,
      labels: [
        { id: "NW-VAL-0001", label: "$1.2M across four modules" },
        { id: "NW-VAL-0002", label: "$0.9M across two modules" },
      ],
    });
    const withArtifact = shapeSharedAdvisorResponse({
      text: TABLE_ANSWER,
      targetChars: TARGET_CHARS,
      maxParagraphs: MAX_PARAGRAPHS,
      labels: LABELS,
    });

    expect(visibleLines(artifactFree.text).length).toBeLessThanOrEqual(
      MAX_PARAGRAPHS,
    );
    // Both are the FIRST rebuild now: same line count, and the only
    // difference between the two answers is the label text itself.
    expect(visibleLines(artifactFree.text).length).toBe(
      visibleLines(withArtifact.text).length,
    );
    // The table summary survives in BOTH now. That is the content the
    // artifact used to cost the reader, and it is the whole of what C-510
    // bought.
    expect(artifactFree.text).toContain(
      "Northwind: $1.2M across four modules: renewal March",
    );
    expect(withArtifact.text).toContain(
      "Northwind: $1.2M: Breakdown: modules idle: renewal March",
    );

    // NOT ASSERTED EQUAL BEYOND THIS, and the reason is a defect C-510 does
    // NOT fix. The two answers still differ in their support line: the
    // artifact rule splits the label's table row at line 341 BEFORE
    // `removeMarkdownTables` runs, so neither half matches `^\|.+\|$` any
    // more, the row escapes the table filter, and raw `|` markup reaches the
    // reader as prose. Filed as C-511; pinning it here as expected output
    // would make it look wanted.
  });
});
