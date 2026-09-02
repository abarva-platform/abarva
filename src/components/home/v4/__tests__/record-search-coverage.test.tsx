/** @jest-environment jsdom */
/**
 * What a reader can find by typing it.
 *
 * The served path builds a record type's `columns` from a hand-maintained order, and search read
 * that list. So a field the mapper emits but the order does not name was carried on every row and
 * findable by nothing — seven of the nine families were in that state, including the parent link
 * the reporting structure is built from, the register's own residual score, and what a programme is
 * for.
 *
 * A reader who can see a value in the detail panel and cannot find it by typing it has been told
 * the search is broken, and they are right.
 */
import "@testing-library/jest-dom";
// Must precede the served-path builder import below; see the module for why.
import "../test-support/text-encoder-polyfill";

import { render, fireEvent } from "@testing-library/react";
import {
  buildHomeReviewBundleFromEclProjectionRows,
  type HomeProjectionRow,
} from "@/lib/home/preview/ecl-projection-bundle";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser } from "../RecordBrowser";

/** Builds the served record type for one family, the way the product does. */
function servedRecordType(
  pageKey: string,
  rowType: string,
  objectType: string,
  payloads: Array<Record<string, string>>,
): TechRecordType {
  const base = getHomeReviewBundle("meridian-health");
  if (!base) throw new Error("stored copy missing");
  const rows: HomeProjectionRow[] = payloads.map((payload, index) => ({
    page_key: pageKey,
    row_key: `${pageKey}-${index}`,
    row_type: rowType,
    title: Object.values(payload)[0] ?? "",
    summary: null,
    display_payload_json: payload,
  })) as HomeProjectionRow[];
  const bundle = buildHomeReviewBundleFromEclProjectionRows(
    base,
    rows,
    "search-coverage",
  );
  const found = (
    bundle as unknown as {
      technologyEstate?: { recordTypes: TechRecordType[] };
    }
  ).technologyEstate?.recordTypes.find((r) => r.objectType === objectType);
  if (!found) throw new Error(`no served record type for ${objectType}`);
  return found;
}

/** The organisation family: `parent_org_unit` is emitted by the mapper and absent from the order. */
const orgRecord = () =>
  servedRecordType("org_ownership", "org", "organization_ownership", [
    {
      org_unit: "Health Plan Operations",
      parent_org_unit: "Office of the CEO",
      role_level: "C-suite",
      decision_rights: "Approves plan design",
    },
    {
      org_unit: "Claims Operations",
      parent_org_unit: "Health Plan Operations",
      role_level: "VP",
      decision_rights: "Approves adjudication rules",
    },
  ]);

describe("the served record carries every field the mapper emits", () => {
  it("declares a column for a key the hand-maintained order omits", () => {
    const record = orgRecord();
    // Guard the premise: if the order ever names this, the case proves nothing.
    expect(record.rows.some((row) => row.parentOrgUnit)).toBe(true);
    expect(record.columns).toContain("parentOrgUnit");
  });

  it("keeps the curated order leading, with the undeclared tail after it", () => {
    const record = orgRecord();
    expect(record.columns[0]).toBe("orgUnit");
    expect(record.columns.indexOf("parentOrgUnit")).toBeGreaterThan(
      record.columns.indexOf("orgUnit"),
    );
  });

  it("declares no column for a field no row populates", () => {
    const record = orgRecord();
    expect(record.columns).not.toContain("headcount");
  });
});

describe("search reaches what the record carries", () => {
  function searchFor(record: TechRecordType, term: string) {
    render(<RecordBrowser recordType={record} />);
    const box = document.querySelector(
      "input[type='search'], input[type='text']",
    );
    if (!box) throw new Error("no search box");
    fireEvent.change(box, { target: { value: term } });
    return document.querySelectorAll("table[data-records] tbody tr").length;
  }

  it("finds a row by a field the declared order never named", () => {
    // Typing a parent unit's name has to select the units reporting to it.
    expect(searchFor(orgRecord(), "Office of the CEO")).toBe(1);
  });

  it("still finds a row by a declared field", () => {
    expect(searchFor(orgRecord(), "Claims Operations")).toBe(1);
  });

  it("returns nothing for a term the record does not contain", () => {
    expect(searchFor(orgRecord(), "zzz-not-in-this-record")).toBe(0);
  });

  it("does not match on the loader's bookkeeping", () => {
    // Provenance is hidden from the detail panel; matching it in search would let a reader select
    // rows by a value they are never shown, and one such value is a local filesystem path.
    const record = orgRecord();
    const withProvenance: TechRecordType = {
      ...record,
      columns: [...record.columns, "sourceFingerprint"],
      rows: record.rows.map((row) => ({
        ...row,
        sourceFingerprint: "abc123fingerprint",
      })),
    };
    expect(searchFor(withProvenance, "abc123fingerprint")).toBe(0);
  });
});
