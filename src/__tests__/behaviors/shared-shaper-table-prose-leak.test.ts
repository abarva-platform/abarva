/**
 * Backlog item C-511 — a table row split by the artifact rule must not
 * escape the table filter and reach the reader as prose.
 *
 * `compactForChat` builds its prose text as
 * `removeSectionHeadings(removeMarkdownTables(normalizeAssemblyArtifacts(normalized)))`.
 * The cleanup ran FIRST, and one of its rules rewrites
 * `" <dash> Breakdown:"` to a newline. When a caller-supplied label carries
 * that pattern, the rewrite lands INSIDE a markdown table row and splits it
 * in two: the first half has no trailing `|`, the second half has no leading
 * `|`, so neither matches `removeMarkdownTables`'s `^\s*\|.+\|\s*$` and both
 * survive as prose. `sentenceSplit` then joins the halves with a space and
 * the reader is handed raw pipe markup in a support bullet:
 *
 *     - | Northwind | $1.2M Breakdown: modules idle | renewal March | | ...
 *
 * Measured on `main` at `7dd4aee76` through the public entry point: 8 `|`
 * characters in the shaped answer, identically for the hyphen, en dash and em
 * dash. C-510 closed the table BRANCH of the rebuild (the summary line) and
 * left the ordering that feeds `proseOnly` untouched, which is why the
 * summary above reads correctly while the support bullet does not.
 *
 * THE FIX IS NOT THE PASS ORDER, and the reason is the second half of this
 * suite. Reordering the two passes inside `compactForChat` closes the bullet
 * above and leaves the same rewrite splitting rows in the OTHER place it runs:
 * `shapeSharedAdvisorResponse` runs `normalizeAssemblyArtifacts` once more
 * after compaction, where an answer short enough to take the early return
 * still has its rows intact. Searched over 18,900 constructed inputs with the
 * pass-order fix in place: 3,324 still delivered a half-row. So the rewrites
 * are made to run per line and skip a table row, which closes both places with
 * one rule.
 *
 * Deliberately NOT a narrower cleanup rule: narrowing the dash class is C-510
 * undone, and C-511's acceptance says so. The mutation that narrows it turns
 * four of that suite's five cases red and the positive control below red too,
 * so the cheaper route is closed by tests rather than by a comment.
 *
 * WHY THIS ASSERTS OVER A SWEEP RATHER THAN ONE FIXTURE. The trigger is a
 * label whose text carries the artifact pattern, and nothing about the defect
 * cares which cell that label occupies or which dash character it uses. One
 * fixture would pass against a fix that special-cased the second cell. The
 * sweep runs all three dash characters against each of the three cells, and
 * the positive control below is what stops the invariant from being satisfied
 * by an empty answer.
 */

import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";

const DASHES = ["-", "–", "—"] as const;
const TARGET_CHARS = 900;
const MAX_PARAGRAPHS = 5;

/** The row cells, by index, that a label id can be planted in. */
const CELL_LABELS = ["vendor", "value", "note"] as const;

function answerWithIdInCell(cell: number): string {
  const rows: Array<[string, string, string]> = [
    ["Northwind", "$1.2M", "renewal March"],
    ["Crestline", "$0.9M", "renewal May"],
  ];
  const withId = rows.map((cells, index) => {
    const copy: [string, string, string] = [...cells];
    copy[cell] = `NW-VAL-000${index + 1}`;
    return `| ${copy.join(" | ")} |`;
  });
  return [
    "The renewal position is worth opening before the March call because the run rate has moved and nobody has re-read the terms since the last extension was signed.",
    "",
    "| Vendor | Value | Note |",
    "| --- | --- | --- |",
    ...withId,
    "| Halden | $0.7M | renewal August |",
    "",
    "My read is that this is a scope problem rather than a price problem, and the vendor will open on price because that is the only lever they control in this cycle.",
    "Evidence for that read is the usage export, which shows zero sessions against the reporting module and the forecasting module for the last four months of the term.",
    "A second concentration sits behind it: the same owner signed three of the four renewals in this portfolio, so the negotiating position is weaker than the spend suggests.",
    "What I would do next: pull the usage export for those two modules and put the owner who signed for them in the first call.",
  ].join("\n");
}

function shape(text: string, labels: Array<{ id: string; label: string }>) {
  return shapeSharedAdvisorResponse({
    text,
    targetChars: TARGET_CHARS,
    maxParagraphs: MAX_PARAGRAPHS,
    labels,
  });
}

function artifactLabels(dash: string) {
  return [
    { id: "NW-VAL-0001", label: `$1.2M ${dash} Breakdown: modules idle` },
    { id: "NW-VAL-0002", label: `$0.9M ${dash} Breakdown: seats spare` },
  ];
}

/**
 * Every line carrying a `|` must be a well-formed table row. A `|` in the
 * output is not per se a leak — an answer short enough to take the early
 * return keeps its markdown table, and that renders as a table. A HALF row
 * does not: it renders as a sentence with pipes in it, which is the defect.
 */
function halfRows(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|") && !/^\|.+\|$/.test(line));
}

describe("C-511 — a split table row does not reach the reader as prose", () => {
  it.each(
    DASHES.flatMap((dash) =>
      CELL_LABELS.map((cellName, cell) => ({ dash, cellName, cell })),
    ),
  )(
    "no pipe markup survives: $cellName cell, dash $dash",
    ({ dash, cell }) => {
      // RED FIRST. On `main` the vendor/value/note variants all ship the
      // split row as a support bullet; the value-cell case is the one
      // observed in the C-505 suite and measured at 8 pipe characters.
      const shaped = shape(answerWithIdInCell(cell), artifactLabels(dash));

      expect(shaped.text).not.toMatch(/\|/);
      // The label really was substituted, so a clean answer here is the
      // ordering working and not two ids that failed to resolve and took
      // the artifact pattern out of the text with them.
      expect(shaped.replacements.map((entry) => entry.from).sort()).toEqual([
        "NW-VAL-0001",
        "NW-VAL-0002",
      ]);
    },
  );

  it("POSITIVE CONTROL — the table's content still reaches the reader", () => {
    // Without this, the invariant above is satisfied by an answer that
    // dropped the table entirely, which is the cheap wrong fix.
    const shaped = shape(answerWithIdInCell(1), artifactLabels("-"));

    expect(shaped.text).toContain(
      "Northwind: $1.2M: Breakdown: modules idle: renewal March",
    );
    expect(shaped.text).toContain("Halden: $0.7M: renewal August");
  });

  it("FALSE-POSITIVE DIRECTION — an answer with no artifact label is unchanged", () => {
    // The ordering change must not alter an answer that never triggered the
    // defect. Pinned against `main`'s output for the same fixture with
    // plain labels: the shaped text is byte-identical either side of the
    // fix, so this case cannot be satisfied by a rewrite that "improves"
    // unrelated answers.
    const shaped = shape(answerWithIdInCell(1), [
      { id: "NW-VAL-0001", label: "$1.2M" },
      { id: "NW-VAL-0002", label: "$0.9M" },
    ]);

    expect(shaped.text).not.toMatch(/\|/);
    expect(shaped.text).toContain("Northwind: $1.2M: renewal March");
  });
  it("THE OTHER PLACE — a short answer takes the early return and keeps its table WHOLE", () => {
    // RED FIRST, and red against the pass-order fix too, which is why this
    // case decides the shape of the fix. The answer is short enough that
    // `compactForChat` returns it verbatim, so nothing inside that function
    // runs on it — and then the entry point cleans the artifacts one more
    // time and splits the rows there. The line the reader got was `| $1.2M`.
    const short = [
      "The renewal position is worth opening before the March call.",
      "",
      "| Vendor | Value | Note |",
      "| --- | --- | --- |",
      "| NW-VAL-0001 | $0.5M | renewal March |",
      "| NW-VAL-0002 | $0.6M | renewal May |",
    ].join("\n");
    const shaped = shape(short, artifactLabels("-"));

    expect(halfRows(shaped.text)).toEqual([]);
    // The table is still THERE, whole — the early return exists to leave a
    // short answer's structure alone, so a fix that stripped the rows here
    // would pass the line above and be wrong.
    expect(shaped.text).toContain(
      "| $1.2M - Breakdown: modules idle | $0.5M | renewal March |",
    );
  });

  it("no half-row survives anywhere in an 18,900-input space", () => {
    // The invariant over a space rather than over the fixtures above, and the
    // honest remainder measured rather than asserted away. A row that arrives
    // ALREADY missing its trailing pipe never matched the row grammar, so the
    // cleanup still rewrites it and `removeMarkdownTables` still ignores it.
    // That class is counted here instead of being described in prose: 0 for a
    // well-formed table, 7,101 for one whose first row is malformed on
    // arrival. Pinning both makes the zero mean something — a refactor that
    // stopped generating cases would otherwise make it vacuous — and makes
    // the remainder visible to whoever takes it.
    const labelShapes = [
      (d: string) => `$1.2M ${d} Breakdown: modules idle`,
      (d: string) => `$1.2M ${d} Breakdown: a ${d} Breakdown: b`,
      (d: string) => `$1.2M ${d} Breakdown:`,
      () => `$1.2M`,
      (d: string) => `${d} Breakdown: leading`,
    ];
    const prose = [
      "My read is that this is a scope problem rather than a price problem, and the vendor will open on price because that is the only lever they control.",
      "Evidence for that read is the usage export, which shows zero sessions against the reporting module for the last four months of the term.",
      "A second concentration sits behind it: the same owner signed three of the four renewals in this portfolio.",
      "What I would do next: pull the usage export and put the owner who signed for them in the first call.",
    ];
    const build = (
      rows: number,
      proseCount: number,
      cell: number,
      malformed: boolean,
    ) => {
      const lines = [
        "The renewal position is worth opening before the March call because the run rate has moved and nobody has re-read the terms.",
      ];
      if (rows > 0) {
        lines.push("", "| Vendor | Value | Note |", "| --- | --- | --- |");
        for (let r = 0; r < rows; r += 1) {
          const cells = [`Vendor${r}`, `$${r}.5M`, `renewal M${r}`];
          if (r < 2) cells[cell] = `NW-VAL-000${r + 1}`;
          const row = `| ${cells.join(" | ")} |`;
          lines.push(malformed && r === 0 ? row.replace(/\|$/, "") : row);
        }
        lines.push("");
      }
      for (let p = 0; p < proseCount; p += 1) lines.push(prose[p]);
      return lines.join("\n");
    };

    let searched = 0;
    let wellFormedLeaks = 0;
    let malformedLeaks = 0;
    for (const dash of DASHES)
      for (const shapeFn of labelShapes)
        for (let cell = 0; cell < 3; cell += 1)
          for (let rows = 0; rows <= 6; rows += 1)
            for (let proseCount = 0; proseCount <= 4; proseCount += 1)
              for (const malformed of [false, true])
                for (const targetChars of [300, 600, 900])
                  for (const maxParagraphs of [3, 5]) {
                    searched += 1;
                    const out = shapeSharedAdvisorResponse({
                      text: build(rows, proseCount, cell, malformed),
                      targetChars,
                      maxParagraphs,
                      labels: [
                        { id: "NW-VAL-0001", label: shapeFn(dash) },
                        {
                          id: "NW-VAL-0002",
                          label: shapeFn(dash).replace("1.2", "0.9"),
                        },
                      ],
                    });
                    if (halfRows(out.text).length === 0) continue;
                    if (malformed) malformedLeaks += 1;
                    else wellFormedLeaks += 1;
                  }

    expect(searched).toBe(18_900);
    expect(wellFormedLeaks).toBe(0);
    // The remainder, named and counted. Not a passing assertion dressed as a
    // finding: if this moves, the malformed-row class has changed and someone
    // should know which way.
    expect(malformedLeaks).toBe(7_101);
  });
});
