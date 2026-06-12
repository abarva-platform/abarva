import {
  buildSourceRegister,
  humanizeSourceLabel,
  scanForInternalLeaks,
} from "../source-register";

describe("source-label hygiene", () => {
  it("maps known internal ids to human source names", () => {
    expect(humanizeSourceLabel("document_extract:stakeholder_map")).toBe(
      "Stakeholder Map",
    );
    expect(humanizeSourceLabel("tower_dora_metrics")).toBe(
      "Engineering Delivery Baseline / DORA Metrics",
    );
    expect(humanizeSourceLabel("tower_cmdb_cis")).toBe(
      "Application and Systems Inventory",
    );
    expect(humanizeSourceLabel("document_extract:value_kpi_baseline")).toBe(
      "Value and KPI Baseline",
    );
  });

  it("de-identifies unmapped internal ids heuristically", () => {
    expect(
      humanizeSourceLabel("document_extract:vendor_contract_summary"),
    ).toBe("Vendor Contract Summary");
    expect(humanizeSourceLabel("tower_incident_volume_4f3a2b1c9d8e")).toBe(
      "Incident Volume",
    );
    expect(humanizeSourceLabel("source_segment_42")).toBe("Source");
  });

  it("keeps already-human labels intact", () => {
    expect(humanizeSourceLabel("FY26 Run-Cost by Tower")).toBe(
      "FY26 Run-Cost by Tower",
    );
    expect(humanizeSourceLabel("")).toBe("Source");
  });

  it("buildSourceRegister humanizes a raw id so it can never leak", () => {
    const { evidence, register } = buildSourceRegister([
      {
        label: "document_extract:stakeholder_map",
        statement: "Five stakeholders identified.",
        evidenceFamily: "stakeholders",
        confidence: "high",
        provenanceRef: "x",
      },
    ]);
    expect(evidence[0].label).toBe("Stakeholder Map");
    expect(register[0].label).toBe("Stakeholder Map");
    // the raw id is gone
    expect(JSON.stringify(register)).not.toMatch(/document_extract:/);
  });

  it("scanForInternalLeaks catches the full forbidden set", () => {
    expect(
      scanForInternalLeaks("see document_extract:stakeholder_map for detail"),
    ).toContain("document_extract");
    expect(scanForInternalLeaks("per tower_dora_metrics baseline")).toContain(
      "tower_ref",
    );
    expect(scanForInternalLeaks("row source_segment_id=7")).toContain(
      "ledger_id",
    );
    expect(scanForInternalLeaks("chunk_id abc and fact_key xyz")).toContain(
      "ledger_id",
    );
    expect(scanForInternalLeaks("enterprise_context_records joined")).toContain(
      "table_ref",
    );
    // clean board prose does not trip
    expect(
      scanForInternalLeaks("The recovery time improved materially [1]."),
    ).toHaveLength(0);
  });
});
