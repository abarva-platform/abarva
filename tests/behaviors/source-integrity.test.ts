import {
  checkNumericDistribution,
  checkReferences,
  checkRelationshipColumns,
  checkVocabularyDrift,
  type Row,
} from "../../src/lib/enterprise-data/intake/source-integrity";

/**
 * Each test corresponds to a defect found in a real dataset by this checker, which every other
 * gate passed: the file parses, columns are populated, no value is malformed.
 */

describe("references that resolve against the wrong key", () => {
  const estate: Row[] = [
    { system_name: "Reservations Platform", original_row_id: "APP-0001", system_id: "SYS-a" },
    { system_name: "Inventory Platform", original_row_id: "APP-0002", system_id: "SYS-b" },
  ];

  it("names the provenance column rather than reporting missing data", () => {
    // "Nothing resolves" reads as missing data. The truth was that the data was all present,
    // under a key nobody declared.
    const findings = checkReferences({
      tenantKey: "t1",
      file: "05.csv",
      rows: [{ source_system: "APP-0001", target_system: "APP-0002" }],
      referenceColumns: ["source_system", "target_system"],
      target: { file: "04.csv", identityColumn: "system_name", provenanceColumns: ["original_row_id", "system_id"], rows: estate },
    });
    expect(findings[0].code).toBe("reference_key_is_provenance");
    expect(findings[0].message).toMatch(/reports an empty topology rather than an error/);
    expect(findings[0].detail?.resolvedVia).toBe("original_row_id");
  });

  it("reports genuinely dangling references as dangling", () => {
    const findings = checkReferences({
      tenantKey: "t1",
      file: "05.csv",
      rows: [{ source_system: "Reservations Platform", target_system: "A System Nobody Listed" }],
      referenceColumns: ["source_system", "target_system"],
      target: { file: "04.csv", identityColumn: "system_name", provenanceColumns: ["original_row_id"], rows: estate },
    });
    expect(findings[0].code).toBe("unresolvable_reference");
    expect(findings[0].detail?.unresolvedCount).toBe(1);
  });

  it("stays quiet when everything resolves on the declared key", () => {
    expect(
      checkReferences({
        tenantKey: "t1",
        file: "05.csv",
        rows: [{ source_system: "Reservations Platform", target_system: "Inventory Platform" }],
        referenceColumns: ["source_system", "target_system"],
        target: { file: "04.csv", identityColumn: "system_name", provenanceColumns: ["original_row_id"], rows: estate },
      }),
    ).toEqual([]);
  });
});

describe("a file that looks populated and carries no relationships", () => {
  const rows: Row[] = Array.from({ length: 40 }, (_, i) => ({
    data_asset_name: `Genuinely distinct asset ${i}`,
    source_system: "standard_2026_07_v3",
    target_system: "",
    integration_type: "",
  }));

  it("names a template identifier written into a reference column", () => {
    const findings = checkRelationshipColumns({
      tenantKey: "t1",
      file: "05.csv",
      rows,
      referenceColumns: ["source_system"],
      nonDataTokens: ["standard_2026_07_v3"],
    });
    expect(findings[0].code).toBe("constant_reference_column");
    expect(findings[0].message).toMatch(/template or packet identifier/);
    // The reason nothing else catches it: the value is a perfectly valid string.
    expect(findings[0].message).toMatch(/the value is a valid string/);
  });

  it("reports a wholly blank relationship column", () => {
    const findings = checkRelationshipColumns({
      tenantKey: "t1",
      file: "05.csv",
      rows,
      referenceColumns: ["target_system", "integration_type"],
    });
    expect(findings.map((f) => f.code)).toEqual(["empty_relationship_column", "empty_relationship_column"]);
    expect(findings[0].message).toMatch(/built from nothing/);
  });

  it("flags a constant that is not obviously metadata, in plainer terms", () => {
    const findings = checkRelationshipColumns({
      tenantKey: "t1",
      file: "05.csv",
      rows: rows.map((r) => ({ ...r, source_system: "Mainframe" })),
      referenceColumns: ["source_system"],
      nonDataTokens: ["standard_2026_07_v3"],
    });
    expect(findings[0].code).toBe("constant_reference_column");
    expect(findings[0].message).toMatch(/is a constant that landed there, not a reference/);
  });

  it("does not judge a small file", () => {
    expect(
      checkRelationshipColumns({ tenantKey: "t1", file: "05.csv", rows: rows.slice(0, 5), referenceColumns: ["target_system"] }),
    ).toEqual([]);
  });
});

describe("a numeric column that is really a tier label", () => {
  it("flags a cost repeating across hundreds of rows", () => {
    // Each row is plausible and the total is plausible. Only the distribution shows that no
    // per-row figure was ever recorded.
    const rows: Row[] = [
      ...Array.from({ length: 339 }, () => ({ annual_cost_usd: "1880000" })),
      ...Array.from({ length: 100 }, () => ({ annual_cost_usd: "3949000" })),
      ...Array.from({ length: 64 }, () => ({ annual_cost_usd: "7898000" })),
    ];
    const findings = checkNumericDistribution({ tenantKey: "t1", file: "04.csv", column: "annual_cost_usd", rows });
    expect(findings[0].code).toBe("degenerate_numeric_distribution");
    expect(findings[0].detail?.distinct).toBe(3);
    expect(findings[0].message).toMatch(/confident answer about a value that was never recorded/);
  });

  it("accepts a genuinely varied column", () => {
    const rows: Row[] = Array.from({ length: 200 }, (_, i) => ({ annual_cost_usd: String(100000 + i * 3137) }));
    expect(checkNumericDistribution({ tenantKey: "t1", file: "04.csv", column: "annual_cost_usd", rows })).toEqual([]);
  });

  it("does not judge a column with too few rows to have a distribution", () => {
    const rows: Row[] = Array.from({ length: 12 }, () => ({ annual_cost_usd: "500000" }));
    expect(checkNumericDistribution({ tenantKey: "t1", file: "04.csv", column: "annual_cost_usd", rows })).toEqual([]);
  });
});

describe("vocabulary drift is a warning, not an error", () => {
  it("flags tenants whose value spaces do not overlap at all", () => {
    const findings = checkVocabularyDrift({
      file: "05.csv",
      column: "integration_type",
      byTenant: {
        a: [{ integration_type: "REST API" }, { integration_type: "SOAP" }],
        b: [{ integration_type: "real-time API" }, { integration_type: "HL7v2 interface" }],
      },
    });
    expect(findings).toHaveLength(2);
    expect(findings[0].severity).toBe("warning");
    // Forcing a shared vocabulary onto recorded data would put our schema ahead of the client's.
    expect(findings[0].message).toMatch(/ahead of what the client said/);
    expect(findings[0].message).toMatch(/classify into a declared vocabulary/);
  });

  it("stays quiet when the spaces overlap", () => {
    expect(
      checkVocabularyDrift({
        file: "05.csv",
        column: "integration_type",
        byTenant: { a: [{ integration_type: "REST API" }], b: [{ integration_type: "REST API" }, { integration_type: "SOAP" }] },
      }),
    ).toEqual([]);
  });
});
