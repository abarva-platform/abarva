import { createHash } from "node:crypto";

import { reviewOperationalInventory } from "../operational-inventory";

const csv = [
  "Service ID,Service Name,Scope Boundary,Criticality,Lifecycle State,Service Owner,Source Basis,As Of Date",
  "SVC-001,L1/L2 service desk,Intake triage and escalation,high,active,IT operations,Synthetic service catalog,2026-09-29",
  "SVC-002,Endpoint management,Device build patch and lifecycle,medium,active,Endpoint operations,Synthetic service catalog,2026-09-29",
].join("\n");

function artifact(bytes: Buffer, overrides: Record<string, string> = {}) {
  return {
    originalName: "service_catalog_scope.csv",
    mimeType: "text/csv",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    ...overrides,
  };
}

describe("operational inventory review", () => {
  it("accepts a source-bound service inventory without inventing cost facts", async () => {
    const bytes = Buffer.from(csv);
    const result = await reviewOperationalInventory({ artifact: artifact(bytes), bytes });
    expect(result).toEqual({ ok: true, rowCount: 2, sourceSha256: artifact(bytes).sha256 });
  });

  it.each([
    ["wrong byte hash", csv, { sha256: "0".repeat(64) }],
    ["missing stable identity", csv.replace("SVC-002", ""), {}],
    ["duplicate identity", csv.replace("SVC-002", "SVC-001"), {}],
    ["missing source basis", csv.replace("Synthetic service catalog", ""), {}],
    ["missing owner", csv.replace("Endpoint operations", ""), {}],
    ["missing lifecycle", csv.replace(",active,Endpoint operations", ",,Endpoint operations"), {}],
    ["invalid criticality", csv.replace(",medium,", ",unknown,"), {}],
    ["invalid as-of date", csv.replace("2026-09-29", "not-a-date"), {}],
    ["impossible as-of date", csv.replace("2026-09-29", "2026-02-30"), {}],
    ["empty data", csv.split("\n")[0], {}],
    ["duplicate header", csv.replace("Service Name,", "Service ID,"), {}],
  ])("refuses %s", async (_label, content, overrides) => {
    const bytes = Buffer.from(content);
    const result = await reviewOperationalInventory({ artifact: artifact(bytes, overrides), bytes });
    expect(result.ok).toBe(false);
  });

  it("rejects a mislabeled or non-CSV artifact instead of trusting its extension", async () => {
    const bytes = Buffer.from(csv);
    expect((await reviewOperationalInventory({
      artifact: artifact(bytes, { mimeType: "application/pdf" }), bytes,
    })).ok).toBe(false);
  });
});
