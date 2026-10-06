/**
 * Backlog item C-510 — the table branch of the compact rebuild must
 * neutralise the same dash class `normalizeAssemblyArtifacts` matches.
 *
 * `tableToCompactLines` joins a row's cells with `" — "` and the table branch
 * of the first rebuild turns that separator into `": "`. The branch matched
 * the em dash alone while the artifact rule one function away matches a
 * hyphen, an en dash AND an em dash. `tableToCompactLines` reads
 * `normalized`, the one text feeding the rebuild that is not re-run through
 * `normalizeAssemblyArtifacts` after `replaceLabels` has substituted
 * caller-supplied label text, so the hyphen and en-dash forms arrived live
 * and inserted a line break into a table entry at rebuild time.
 *
 * Measured through the public entry point on the C-505 fixture BEFORE the
 * change: hyphen 382 chars / 3 lines, en dash 382 / 3, em dash 536 / 4. The
 * two narrow forms lost the entire table summary to the harsher second
 * rebuild; the em dash kept it. Same answer, same labels, 154 characters of
 * content decided by which dash character a caller happened to use.
 *
 * WHAT THIS CHANGE COSTS THE C-505 SUITE, recorded here rather than left
 * for the next reader to rediscover. C-505 pins that the line half of the
 * first rebuild gate is REACHABLE and decides the outcome. The path it
 * measured — a label-injected artifact breaking a table entry across two
 * lines — is the path this change closes, and it was the only one. Searched
 * before landing over 24,900 constructed inputs (every dash character, five
 * label shapes including repeated and trailing artifacts, 0-8 table rows,
 * 0-5 prose sentences, with and without bullets, four character targets and
 * five line budgets), with the gate instrumented to record both operands:
 * ZERO inputs drive the first rebuild over its line budget while under its
 * character target. The identical search against the narrow rule finds
 * 3,904, over an identical 17,331 gate evaluations — so the search can see
 * the state it reports missing, which is the only reason its zero means
 * anything.
 *
 * The operand therefore has no reachable FALSE case after this change. That
 * is C-505's outcome arriving by the route C-510 sanctioned (removing the
 * defect) rather than the one it forbade (deleting the operand). C-510's
 * acceptance asked for a second still-reachable fixture as the price of
 * landing; the search says none exists, so THAT PRECONDITION IS FALSIFIED
 * RATHER THAN MET, and the residual decision — keep an unreachable guard or
 * delete it — is filed back to the backlog instead of being taken here. The
 * operand is KEPT and the C-505 suite is updated in place with the reason,
 * not deleted.
 *
 * An earlier draft of this suite tried to replace the lost fixture with an
 * invariant: every returned answer obeys its `maxParagraphs` budget in
 * LINES. Over the same space 5,757 of 24,900 answers do not, and they are
 * right not to — the early return is measured in paragraphs and the entry
 * point runs `normalizeAssemblyArtifacts` once more AFTER the gate, so the
 * returned text is not the text the gate judged. It is recorded because it
 * is the shape of mistake this backlog exists to stop: an assertion that
 * states a contract the code never had, passing on whichever fixtures were
 * checked first.
 */

import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";

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

const TARGET_CHARS = 900;
const MAX_PARAGRAPHS = 5;

function shapeWithDash(dash: string) {
  return shapeSharedAdvisorResponse({
    text: TABLE_ANSWER,
    targetChars: TARGET_CHARS,
    maxParagraphs: MAX_PARAGRAPHS,
    labels: [
      { id: "NW-VAL-0001", label: `$1.2M ${dash} Breakdown: modules idle` },
      { id: "NW-VAL-0002", label: `$0.9M ${dash} Breakdown: seats spare` },
    ],
  });
}

// Item C-511 — the three dash characters folded to one, so a difference that
// is only the character the CALLER supplied inside a table cell is not read as
// the shaper's output depending on it.
function foldDashes(text: string): string {
  return text.replace(/[\u2013\u2014]/g, "-");
}

function visibleLines(text: string): string[] {
  return text.split("\n").filter((line) => line.trim().length > 0);
}

describe("C-510 — the table branch neutralises the artifact rule's dash class", () => {
  it("the hyphen form is neutralised rather than carried into the rebuild", () => {
    // RED FIRST. Against the narrow rule this reads
    // "Northwind: $1.2M" followed by a line break, the table summary is
    // rejected by the line half of the gate, and the answer the reader gets
    // is the second rebuild with no summary at all.
    const shaped = shapeWithDash("-");

    expect(shaped.text).toContain(
      "Northwind: $1.2M: Breakdown: modules idle: renewal March",
    );
    // The label really was substituted, so this is the neutralisation
    // working and not an id that failed to resolve and took the artifact
    // with it.
    expect(shaped.replacements.map((entry) => entry.from).sort()).toEqual([
      "NW-VAL-0001",
      "NW-VAL-0002",
    ]);
  });

  it("which dash character a label carries no longer decides what the reader gets", () => {
    // The defect stated as an equality. Three answers, identical inputs
    // apart from one character inside a label, and the em-dash answer is the
    // one that was always correct — so this asserts the two broken forms
    // were raised to it, not that all three were levelled down.
    const hyphen = shapeWithDash("-");
    const enDash = shapeWithDash("–");
    const emDash = shapeWithDash("—");

    expect(hyphen.text).toEqual(emDash.text);
    expect(enDash.text).toEqual(emDash.text);
    // 536 → 526 when item C-511 landed, and the reason is recorded here
    // rather than the number quietly re-pinned. C-510 fixed the table
    // SUMMARY line; the support bullet under it was still the split table
    // row this fixture's labels produce, shipped as prose with eight `|`
    // characters in it. C-511 reordered the two passes that build
    // `proseOnly` so a row is filtered before the cleanup can split it, and
    // the bullet is now the first real prose sentence of the answer — ten
    // characters shorter and the pipe markup gone. This suite's own subject
    // is unchanged: all three dash forms still agree, which is what the two
    // assertions above measure, and the em-dash form is still the one the
    // other two were raised to.
    expect(emDash.text.length).toBe(526);
    expect(emDash.text).not.toMatch(/\|/);
    expect(visibleLines(emDash.text)).toHaveLength(4);
  });

  it("rewrites dash-shaped text inside a cell too, and that cost is the fix", () => {
    // PINNED DELIBERATELY, not discovered later. The artifact the branch has
    // to stop lives INSIDE the cell, so a rule that leaves cell content
    // alone leaves the line break in place. A spaced range inside a cell
    // therefore reads as ": " in the compacted summary. The narrow rule was
    // not narrower in kind — it did exactly this to em-dash ranges already,
    // for one character out of three.
    //
    // Measured before landing: of 3,328 non-empty markdown table cells in
    // `src`, ZERO render differently under the widened class. The only
    // differing string found anywhere in `src` is a fiscal-year range in a
    // setup-data markdown file that no shaper caller reads, and it is the
    // shape reproduced here.
    const shaped = shapeSharedAdvisorResponse({
      text: TABLE_ANSWER,
      targetChars: TARGET_CHARS,
      maxParagraphs: MAX_PARAGRAPHS,
      labels: [
        { id: "NW-VAL-0001", label: "$1.2M FY2026 (Feb 2026 – Jan 2027)" },
        { id: "NW-VAL-0002", label: "$0.9M across two modules" },
      ],
    });

    expect(shaped.text).toContain("FY2026 (Feb 2026: Jan 2027)");
  });

  it("a hyphen inside a word is not a separator and survives untouched", () => {
    // FOUND BY A SURVIVING MUTATION, not by design. Replacing the rule with
    // the bare class `/[-–—]/g` passed all four cases above: the fixture
    // corpus had no cell containing an internal hyphen, and
    // `normalizeAssemblyArtifacts` strips whitespace before punctuation
    // downstream, so `" — "` and `" : "` both settle to `": "` and the
    // mutation looked like a no-op. It is not one — it renders
    // `"multi-year"` as `"multi: year"`.
    //
    // The whitespace on both sides of the class is the entire boundary
    // between a cell separator and a hyphenated word, and widening the
    // class from one character to three makes that boundary carry more
    // weight than it used to. It is pinned here rather than trusted.
    const shaped = shapeSharedAdvisorResponse({
      text: [
        "The renewal position is worth opening before the March call because the run rate has moved and nobody has re-read the terms since the last extension was signed.",
        "",
        "| Vendor | Value | Note |",
        "| --- | --- | --- |",
        "| Northwind | $1.2M | multi-year renewal March |",
        "| Crestline | $0.9M | co-term renewal May |",
        "| Halden | $0.7M | renewal August |",
        "",
        "My read is that this is a scope problem rather than a price problem, and the vendor will open on price because that is the only lever they control in this cycle.",
        "Evidence for that read is the usage export, which shows zero sessions against the reporting module and the forecasting module for the last four months of the term.",
        "A second concentration sits behind it: the same owner signed three of the four renewals in this portfolio, so the negotiating position is weaker than the spend suggests.",
        "What I would do next: pull the usage export for those two modules and put the owner who signed for them in the first call.",
      ].join("\n"),
      targetChars: TARGET_CHARS,
      maxParagraphs: MAX_PARAGRAPHS,
    });

    expect(shaped.text).toContain("Northwind: $1.2M: multi-year renewal March");
    expect(shaped.text).toContain("Crestline: $0.9M: co-term renewal May");
    expect(shaped.text).not.toContain("multi: year");
    expect(shaped.text).not.toContain("co: term");
  });

  it("no answer in a 6,640-input space depends STRUCTURALLY on which dash a label carries", () => {
    // The fix stated as an invariant over a space rather than over one
    // fixture, and this is what defends the change: restoring the narrow
    // rule fails it thousands of times over, so the branch cannot quietly
    // narrow again.
    //
    // RELAXED BY MEASUREMENT WHEN ITEM C-511 LANDED, and relaxed in exactly
    // one direction. This test asserted byte equality across the three dash
    // characters. That held only because the artifact rewrite reached inside
    // a table row and rewrote all three the same way — and rewriting inside
    // a row is the C-511 defect: it split the row, and the halves shipped to
    // the reader as raw pipe markup. With the rewrites now skipping a row,
    // a table cell keeps the label text its caller supplied, so a hyphen
    // label and an em-dash label differ by that one character. They are
    // DIFFERENT LABELS; the old equality came from destroying the
    // distinction, not from respecting it.
    //
    // So the comparison folds the three dash characters together and the
    // invariant becomes structural, which is what C-510 was about — whether
    // 154 characters of table summary survive should not depend on a dash.
    // Both counts are pinned, so the relaxation is bounded rather than open:
    // 1,355 answers differ before folding and ZERO differ after. The
    // relaxation does not retire the guard, which is the thing worth
    // checking when a fix touches another item's evidence. Narrowing
    // `TABLE_CELL_SEPARATOR_RE` back to the em dash alone — C-510 undone —
    // still fails this test on the folded comparison 2,509 times, measured
    // over the same space with C-511's fix in place.
    //
    // WHAT THIS DELIBERATELY DOES NOT ASSERT, because it is not true. An
    // earlier draft asserted that every returned answer obeys its
    // `maxParagraphs` budget in LINES. Over this same space 5,757 of 24,900
    // answers do not, and they are right not to: the early return is
    // measured in paragraphs (C-503 made that distinction on purpose) and
    // the entry point runs `normalizeAssemblyArtifacts` once more AFTER the
    // rebuild gate, so the returned text is not the text the gate judged.
    // A line-budget assertion here would have been a false statement of the
    // contract that happened to pass on the fixtures anyone checked first.
    const dashes = ["-", "–", "—"];
    const prose = [
      "My read is that this is a scope problem rather than a price problem, and the vendor will open on price because that is the only lever they control in this cycle.",
      "Evidence for that read is the usage export, which shows zero sessions against the reporting module and the forecasting module for the last four months of the term.",
      "A second concentration sits behind it: the same owner signed three of the four renewals in this portfolio, so the negotiating position is weaker than the spend suggests.",
      "The renewal position is worth opening before the March call because the run rate has moved and nobody has re-read the terms since the last extension was signed.",
      "What I would do next: pull the usage export for those two modules and put the owner who signed for them in the first call.",
    ];
    const bullets = [
      "- Northwind — $1.2M — renewal March",
      "- Crestline — $0.9M — renewal May",
      "- Halden — $0.7M — renewal August",
    ];
    const tableBlock = (rows: number) =>
      [
        "| Vendor | Value | Note |",
        "| --- | --- | --- |",
        ...Array.from(
          { length: rows },
          (_, i) =>
            `| Vendor${i} | NW-VAL-000${i} | renewal note ${i} with enough words to carry the row past a trivial length and into the compactor's working range |`,
        ),
      ].join("\n");
    const labelShapes = [
      (dash: string, i: number) => `$1.${i}M ${dash} Breakdown: detail ${i}`,
      (dash: string, i: number) => `$1.${i}M ${dash} Breakdown: ${dash} detail ${i}`,
      (dash: string, i: number) => `detail ${i} ${dash} Breakdown:`,
      (dash: string, i: number) =>
        `$1.${i}M ${dash} Breakdown: a ${dash} Breakdown: b ${dash} Breakdown: c`,
    ];

    let comparisons = 0;
    const differing: string[] = [];
    const differingBeforeFolding: string[] = [];
    for (const shape of labelShapes) {
      for (const rows of [0, 1, 2, 3, 4, 6, 8]) {
        for (const proseCount of [0, 1, 2, 3, 4, 5]) {
          for (const withBullets of [false, true]) {
            for (const targetChars of [320, 650, 900, 1100]) {
              for (const maxParagraphs of [2, 3, 4, 5, 6]) {
                const parts: string[] = [];
                if (proseCount > 0) parts.push(prose.slice(0, proseCount).join("\n"));
                if (rows > 0) parts.push(tableBlock(rows));
                if (withBullets) parts.push(bullets.join("\n"));
                const text = parts.join("\n\n");
                if (!text) continue;
                const byDash = dashes.map(
                  (dash) =>
                    shapeSharedAdvisorResponse({
                      text,
                      targetChars,
                      maxParagraphs,
                      labels: Array.from({ length: 6 }, (_, i) => ({
                        id: `NW-VAL-000${i}`,
                        label: shape(dash, i),
                      })),
                    }).text,
                );
                comparisons += 2;
                const where = `rows=${rows} prose=${proseCount} bullets=${withBullets} target=${targetChars} max=${maxParagraphs}`;
                if (byDash[0] !== byDash[2] || byDash[1] !== byDash[2]) {
                  differingBeforeFolding.push(where);
                }
                const folded = byDash.map(foldDashes);
                if (folded[0] !== folded[2] || folded[1] !== folded[2]) {
                  differing.push(where);
                }
              }
            }
          }
        }
      }
    }

    // The space is asserted, not assumed: a refactor that silently stopped
    // generating cases would otherwise make an empty `differing` vacuous.
    expect(comparisons).toBe(13_280);
    expect(differing).toEqual([]);
    // And the relaxation is asserted in both directions. If this count went
    // to zero, a table cell would have stopped carrying the caller's own
    // text — the C-511 rewrite reaching back inside a row — and an empty
    // `differing` above would no longer mean what it says.
    expect(differingBeforeFolding).toHaveLength(1_355);
  });
});
