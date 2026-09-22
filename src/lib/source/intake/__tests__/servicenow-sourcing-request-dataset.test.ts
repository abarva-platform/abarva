import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { CATEGORY_TO_ARCHETYPE_ID } from "../../archetypes/event-archetype-resolver";
import {
  adaptServiceNowSourcingRequest,
  type ServiceNowSourcingRequestRow,
} from "../servicenow-sourcing-request-adapter";

const datasetPath = path.join(
  process.cwd(),
  "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv",
);

function categoryRoutedArchetypeIds(): Set<string> {
  return new Set(
    Object.values(CATEGORY_TO_ARCHETYPE_ID).filter(
      (id): id is string => Boolean(id),
    ),
  );
}

describe("synthetic ServiceNow sourcing-request pack", () => {
  const csv = fs.readFileSync(datasetPath, "utf8");
  const parsed = Papa.parse<ServiceNowSourcingRequestRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  it("is structurally valid and uses unique source identities", () => {
    expect(parsed.errors).toEqual([]);
    expect(parsed.data).toHaveLength(10);
    const identities = parsed.data.map(
      (row) => `${row.source_table}:${row.sys_id}:${row.extract_version}`,
    );
    expect(new Set(identities).size).toBe(identities.length);
    expect(csv).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  });

  it("covers all four originating domains", () => {
    expect(new Set(parsed.data.map((row) => row.business_domain))).toEqual(
      new Set(["plan", "delivery", "enterprise", "it"]),
    );
  });

  it("maps detailed request input across every category-routed Source archetype", () => {
    const requests = parsed.data.map((row, index) =>
      adaptServiceNowSourcingRequest({
        tenantKey: "internal-golden",
        sourceRow: index + 2,
        row,
        loadedSegments: [],
      }),
    );
    const resolved = new Set(
      requests.map((request) => request.mappingProposal.archetypeId),
    );
    const registered = categoryRoutedArchetypeIds();

    expect(resolved).toEqual(registered);
    for (const request of requests) {
      expect(request.mappingProposal.confidence).not.toBe("low");
      expect(request.mappingProposal.reasons.length).toBeGreaterThan(0);
      expect(request.mappingDecision).toBeNull();
      expect(request.eventLink).toBeNull();
    }
  });
});
