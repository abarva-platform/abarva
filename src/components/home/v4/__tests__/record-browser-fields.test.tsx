/** @jest-environment jsdom */
/**
 * What the record browser lets a reader reach.
 *
 * The detail panel enumerated the fields it would show, so every column the intake added
 * afterwards was invisible until somebody remembered the list. On the current record twelve fields
 * that are declared, populated and varying were reachable from no surface at all -- not the table,
 * not a filter, not the detail panel. Among them the recovery objective, the technical-debt score
 * and the user count, which is most of the rationalisation argument.
 *
 * So the panel now derives its fields from the row and denies bookkeeping, rather than listing what
 * it will admit. This suite pins both halves of that: the business fields appear, and the loader's
 * own tracking does not.
 */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser } from "../RecordBrowser";

const snapshot = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "src/lib/home/preview/golden-snapshots/meridian-health.json",
    ),
    "utf8",
  ),
);
const applications: TechRecordType = snapshot.technologyEstate.recordTypes.find(
  (r: { objectType: string }) => r.objectType === "application_system",
);

/**
 * A second record, because only one of the two carries the loader's bookkeeping on its rows.
 *
 * The provenance cases below are meaningless against a record that has none -- they would pass by
 * having nothing to hide. One of the fields on this one is an absolute filesystem path carrying a
 * home directory, which is the concrete reason the denylist exists.
 */
const withProvenance: TechRecordType = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "src/lib/home/preview/golden-snapshots/skyharbor-air.json",
    ),
    "utf8",
  ),
).technologyEstate.recordTypes.find(
  (r: { objectType: string }) => r.objectType === "application_system",
);

/** The labels the detail panel itself renders -- not the page, which also carries facet names. */
function detailLabels(record: TechRecordType = applications): string[] {
  render(<RecordBrowser recordType={record} />);
  return [...document.querySelectorAll("dl dt")].map(
    (dt) => dt.textContent ?? "",
  );
}

/**
 * The fields a reader can slice by, read from the dimension picker's own options.
 *
 * The control is two generic pickers -- "Slice by", "Dice by" -- so the fields are options inside
 * them, not labelled selects of their own. Asserting against page text instead would pass whether
 * or not the facet exists, because the detail panel names these same fields.
 */
function facetLabels(record: TechRecordType = applications): string[] {
  render(<RecordBrowser recordType={record} />);
  return [...document.querySelectorAll("select")].flatMap((select) =>
    [...select.querySelectorAll("option")].map(
      (option) => option.textContent ?? "",
    ),
  );
}

describe("the detail panel shows what the record carries", () => {
  it.each([
    ["technicalDebtScore", "Technical Debt Score"],
    ["userCount", "User Count"],
    ["rtoHours", "Rto Hours"],
    ["licenseModel", "License Model"],
    ["integrationPattern", "Integration Pattern"],
    ["contractCoverage", "Contract Coverage"],
  ])("reaches %s, which no surface exposed before", (field, label) => {
    // Guard the premise: a field absent from the record would make this pass for the wrong reason.
    expect(
      applications.rows.some((row) => String(row[field] ?? "").trim()),
    ).toBe(true);
    expect(detailLabels()).toContain(label);
  });
});

describe("the detail panel hides how the row got here", () => {
  it.each([
    "originalSourceFile",
    "sourceFingerprint",
    "originalPacket",
    "consolidationRuleUsed",
  ])("does not show %s", (field) => {
    // One of these on the current snapshot is an absolute path carrying a home directory. A reader
    // opening a business record should not be shown the loader's bookkeeping, let alone that.
    const label = field
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    // Guard the premise: a field the record does not carry would pass this for the wrong reason.
    expect(withProvenance.rows.some((row) => row[field] !== undefined)).toBe(
      true,
    );
    expect(detailLabels(withProvenance)).not.toContain(label);
  });

  it("keeps the reference a reader follows", () => {
    // originalRowId takes a row back to the file it came from. That is the reader's identifier,
    // not the loader's bookkeeping, so it survives the denylist.
    expect(withProvenance.rows.some((r) => r.originalRowId)).toBe(true);
    expect(detailLabels(withProvenance)).toContain("Original Row Id");
  });
});

describe("facets a reader can slice by", () => {
  it.each([
    "dataClassification",
    "replacementCandidate",
    "technicalDebtScore",
    "rtoHours",
  ])("offers %s, which the findings already talk about", (field) => {
    const distinct = new Set(
      applications.rows.map((row) => String(row[field] ?? "")).filter(Boolean),
    );
    // A facet is only offered where the record varies it; pin that it does, then that it is offered.
    expect(distinct.size).toBeGreaterThan(1);
    const label = field
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    // Read from the selects, never from page text: the detail panel names these fields too, so a
    // body-text assertion passes whether or not the facet exists.
    expect(facetLabels()).toContain(label);
  });

  it("does not offer a facet the record does not vary", () => {
    const flat: TechRecordType = {
      ...applications,
      rows: applications.rows.map((row) => ({ ...row, rtoHours: "8" })),
    };
    // Every row reading 8 makes the filter return everything; offering it implies a choice.
    expect(facetLabels(flat)).not.toContain("Rto Hours");
  });
});
