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

it("summarizes risk controls as risks, not applications", () => {
  const record: TechRecordType = {
    ...applications,
    objectType: "risk_control",
    label: "Risks & Controls",
    columns: ["riskOrControlName", "severity", "controlStatus"],
    rows: [
      { riskOrControlName: "Risk A", severity: "critical", controlStatus: "unknown" },
      { riskOrControlName: "Risk B", severity: "high", controlStatus: "partially_effective" },
      { riskOrControlName: "Risk C", severity: "medium", controlStatus: "effective" },
    ],
    primaryDimension: "severity",
    dimensionCounts: [],
  };
  const { container } = render(<RecordBrowser recordType={record} />);
  const summary = container.querySelector("[data-record-metrics]");
  expect(summary).toHaveTextContent("3risks");
  expect(summary).toHaveTextContent("2high or critical");
  expect(summary).toHaveTextContent("1partial control");
  expect(summary).toHaveTextContent("1control state unknown");
  expect(summary).not.toHaveTextContent("applications");
});

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

describe("the field count counts the same thing twice", () => {
  it("never shows more fields than it says the record has", () => {
    // It read "20 of 15 fields" live: the numerator counted the fields shown, from the row, and the
    // denominator counted the DECLARED columns -- and a row can carry keys the declaration omits.
    // Two different populations either side of "of" is a bug in front of the reader whether or not
    // it is one behind the screen.
    const undeclared: TechRecordType = {
      ...applications,
      columns: ["systemName"],
      rows: applications.rows.slice(0, 3),
    };
    render(<RecordBrowser recordType={undeclared} />);
    const meta = document.body.textContent ?? "";
    const match = /(\d+) of (\d+) fields on this record/.exec(meta);
    expect(match).not.toBeNull();
    const [, shown, carried] = match!.map(Number);
    expect(shown).toBeLessThanOrEqual(carried);
    expect(carried).toBe(Object.keys(undeclared.rows[0]).length);
  });
});

describe("selected-record headings", () => {
  it.each([
    ["business_segment", "segmentName"],
    ["business_function", "functionName"],
    ["workforce_role", "personaOrRole"],
    ["operational_process", "processName"],
    ["application_system", "systemName"],
    ["vendor_contract", "contractName"],
    ["infrastructure_platform", "platformName"],
    ["data_asset_or_integration", "dataAssetName"],
    ["metric_outcome", "metricName"],
    ["risk_control", "riskOrControlName"],
    ["program_initiative", "programName"],
    ["organization_ownership", "orgUnit"],
    ["ai_use_case", "useCaseName"],
    ["executive_interview", "question"],
  ] as Array<[TechRecordType["objectType"], string]>)(
    "names a selected %s from its declared %s field",
    (objectType, field) => {
      const record: TechRecordType = {
        ...applications,
        objectType,
        columns: [field],
        rows: [{ [field]: "Current record name" }],
        primaryDimension: null,
        dimensionCounts: [],
      };
      const { container } = render(<RecordBrowser recordType={record} />);
      expect(
        container.querySelector("[data-detail-pane] h2"),
      ).toHaveTextContent("Current record name");
    },
  );

  it("names a declared relationship by both endpoints", () => {
    const record: TechRecordType = {
      ...applications,
      objectType: "relationship_edge",
      columns: ["fromObjectName", "toObjectName"],
      rows: [
        { fromObjectName: "Claims platform", toObjectName: "Data warehouse" },
      ],
      primaryDimension: null,
      dimensionCounts: [],
    };
    const { container } = render(<RecordBrowser recordType={record} />);
    expect(container.querySelector("[data-detail-pane] h2")).toHaveTextContent(
      "Claims platform to Data warehouse",
    );
  });

  it("uses a declared row ID when the name is blank, then states when neither exists", () => {
    const record: TechRecordType = {
      ...applications,
      objectType: "ai_use_case",
      columns: ["useCaseName", "originalRowId"],
      rows: [{ useCaseName: null, originalRowId: "AI-001" }],
      primaryDimension: null,
      dimensionCounts: [],
    };
    const { container, rerender } = render(
      <RecordBrowser recordType={record} />,
    );
    expect(container.querySelector("[data-detail-pane] h2")).toHaveTextContent(
      "AI-001",
    );
    rerender(
      <RecordBrowser
        recordType={{ ...record, rows: [{ useCaseName: null }] }}
      />,
    );
    expect(container.querySelector("[data-detail-pane] h2")).toHaveTextContent(
      "Unnamed record",
    );
  });
});
