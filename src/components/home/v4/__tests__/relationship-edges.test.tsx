/** @jest-environment jsdom */
/**
 * The declared relationship graph, reaching the product.
 *
 * Every finding on Home lives inside one family: applications about applications, risks about
 * risks. This is the only family that crosses those boundaries — system to org unit, system to
 * system, system to vendor, metric to system — and it reached nothing. The organisation chapter
 * reports that no org unit names a system it owns; this family answers that from the other side.
 *
 * Built on the served path, because that is the one being given a reader. The stored copy carries
 * no relationship rows at all, so a fixture test would prove the wrong thing.
 */
import "@testing-library/jest-dom";
// Must precede the served-path builder import below; see the module for why.
import "../test-support/text-encoder-polyfill";

import { render } from "@testing-library/react";
import {
  buildHomeReviewBundleFromEclProjectionRows,
  type HomeProjectionRow,
} from "@/lib/home/preview/ecl-projection-bundle";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser } from "../RecordBrowser";

const EDGES = [
  {
    from_object_type: "system",
    from_object_name: "Epic Clarity",
    relationship_type: "owned_by",
    to_object_type: "org_unit",
    to_object_name: "Health Plan Operations",
    relationship_strength: "high",
    evidence_basis: "System register",
    current_state_or_target_state: "current_state",
    confidence: "high",
    known_gaps: "",
  },
  {
    from_object_type: "system",
    from_object_name: "Claims Platform",
    relationship_type: "integrates_with",
    to_object_type: "system",
    to_object_name: "Epic Clarity",
    relationship_strength: "medium",
    evidence_basis: "Integration inventory",
    current_state_or_target_state: "current_state",
    confidence: "medium",
    known_gaps: "",
  },
  {
    from_object_type: "metric",
    from_object_name: "Clean claim rate",
    relationship_type: "sourced_from",
    to_object_type: "system",
    to_object_name: "Claims Platform",
    relationship_strength: "high",
    evidence_basis: "Metric definition",
    current_state_or_target_state: "current_state",
    confidence: "high",
    known_gaps: "",
  },
];

function servedEdges(payloads = EDGES): TechRecordType {
  const base = getHomeReviewBundle("meridian-health");
  if (!base) throw new Error("stored copy missing");
  const rows: HomeProjectionRow[] = payloads.map((payload, index) => ({
    page_key: "relationships",
    row_key: `rel-${index}`,
    row_type: "relationship",
    title: payload.from_object_name,
    summary: null,
    display_payload_json: payload,
  })) as HomeProjectionRow[];
  const bundle = buildHomeReviewBundleFromEclProjectionRows(base, rows, "rel");
  const found = (
    bundle as unknown as {
      technologyEstate?: { recordTypes: TechRecordType[] };
    }
  ).technologyEstate?.recordTypes.find(
    (r) => r.objectType === "relationship_edge",
  );
  if (!found)
    throw new Error("the served bundle carries no relationship family");
  return found;
}

describe("the served bundle carries the graph", () => {
  it("builds a relationship record type from rows under the new page key", () => {
    const record = servedEdges();
    expect(record.rows).toHaveLength(3);
    expect(record.label).toBe("Declared Relationships");
  });

  it("groups by the verb, not by either endpoint", () => {
    // What a reader wants of an edge set is what KINDS of connection the record declares, before
    // which objects happen to sit at the ends of them.
    const record = servedEdges();
    expect(record.primaryDimension).toBe("relationshipType");
    expect(record.dimensionCounts.map((d) => d.value).sort()).toEqual([
      "integrates_with",
      "owned_by",
      "sourced_from",
    ]);
  });

  it("keeps the endpoints as the record names them", () => {
    // The intake declares names, not ids, so a join to the estate is a name match and can miss.
    // Resolving it here would turn a near-match into a silent one.
    const record = servedEdges();
    expect(record.rows[0]).toMatchObject({
      fromObjectName: "Epic Clarity",
      relationshipType: "owned_by",
      toObjectName: "Health Plan Operations",
    });
  });

  it("holds out a column the record never varies", () => {
    // Every edge on the current record reads current_state. A column repeated down every row is a
    // default, and the loader marks it so no surface has to work it out again.
    const record = servedEdges();
    expect((record.constantColumns ?? []).map((c) => c.key)).toContain(
      "currentStateOrTargetState",
    );
  });
});

describe("a reader can browse the graph", () => {
  it("reads an edge as a sentence, with the verb between its endpoints", () => {
    render(<RecordBrowser recordType={servedEdges()} />);
    const headers = [
      ...document.querySelectorAll("table[data-records] th"),
    ].map((th) => th.textContent);
    expect(headers.slice(0, 3)).toEqual(["From", "Relationship", "To"]);
  });

  it("does not draw the column the record never varies", () => {
    render(<RecordBrowser recordType={servedEdges()} />);
    const headers = [
      ...document.querySelectorAll("table[data-records] th"),
    ].map((th) => th.textContent);
    expect(headers).not.toContain("Current State Or Target State");
  });

  it("offers the endpoint kinds as filters", () => {
    render(<RecordBrowser recordType={servedEdges()} />);
    const options = [...document.querySelectorAll("select option")].map(
      (o) => o.textContent ?? "",
    );
    expect(options).toContain("From Object Type");
    expect(options).toContain("To Object Type");
  });
});
