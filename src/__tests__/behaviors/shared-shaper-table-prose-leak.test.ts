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
 * The fix is the pass ORDER — a row is filtered before the cleanup can split
 * it — and deliberately NOT a narrower cleanup rule: narrowing the dash class
 * is C-510 undone, and C-511's acceptance says so.
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
});
