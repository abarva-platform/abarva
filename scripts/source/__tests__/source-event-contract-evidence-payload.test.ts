import fs from "node:fs";
import path from "node:path";

type Row = { family: string; payload: Record<string, unknown> };

describe("Source event contract-evidence job payload", () => {
  const payload = JSON.parse(
    fs.readFileSync(
      path.resolve(
        "datasets/source/contract-depth/meridian-laams-new-event-rich-v2-20260908/qa/source-event-contract-evidence-payload.json",
      ),
      "utf8",
    ),
  ) as { sourceType: string; uploadBatchId: string; rows: Row[] };

  it("retains the reconciled evidence-family depth", () => {
    const counts = payload.rows.reduce<Record<string, number>>((result, row) => {
      result[row.family] = (result[row.family] ?? 0) + 1;
      return result;
    }, {});

    expect(payload.sourceType).toBe("synthetic_demo");
    expect(payload.uploadBatchId).toBe("managed-services-new-event-rich-v2-20260908");
    expect(payload.rows).toHaveLength(301);
    expect(counts).toEqual({
      contract_baseline: 1,
      application_inventory: 48,
      invoice_summary: 12,
      invoice_exception: 4,
      sla_performance: 72,
      ticket_volume: 72,
      staffing_model: 30,
      change_order: 12,
      renewal_terms: 5,
      evidence_reference: 45,
    });
  });

  it("keeps the deterministic staffing, demand, and credit values", () => {
    const staffingFte = payload.rows
      .filter((row) => row.family === "staffing_model")
      .reduce((sum, row) => sum + Number(row.payload.observed_fte ?? 0), 0);
    const ticketVolume = payload.rows
      .filter((row) => row.family === "ticket_volume")
      .reduce((sum, row) => sum + Number(row.payload.actual_tickets ?? 0), 0);
    const unclaimedCredit = payload.rows
      .filter(
        (row) => row.family === "sla_performance" && row.payload.credit_claimed === false,
      )
      .reduce((sum, row) => sum + Number(row.payload.credit_owed_usd ?? 0), 0);

    expect(staffingFte).toBeCloseTo(51.8, 6);
    expect(ticketVolume).toBe(4_523);
    expect(unclaimedCredit).toBeCloseTo(24_531.25, 2);
  });
});
