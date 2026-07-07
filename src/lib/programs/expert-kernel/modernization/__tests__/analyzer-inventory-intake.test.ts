import {
  getModernizationTemplateByObjectType,
  MODERNIZATION_TEMPLATE_DEFINITIONS,
} from "../analyzer-inventory-templates";
import {
  parseAnalyzerInventoryRows,
  validateAnalyzerInventoryRows,
  type AnalyzerInventoryRow,
} from "../analyzer-inventory-intake";

describe("modernization analyzer inventory template", () => {
  it("registers a tenant-scoped Lakebridge/Analyzer inventory object", () => {
    expect(MODERNIZATION_TEMPLATE_DEFINITIONS).toHaveLength(1);
    expect(
      getModernizationTemplateByObjectType("lakebridge_analyzer_inventory"),
    ).toMatchObject({
      tenantScoped: true,
      segmentFamily: "modernization_workload_inventory",
      ownerRole: "CDAO / Data platform modernization lead",
    });
  });

  it("keeps the template metadata-only and structured-file friendly", () => {
    const template = MODERNIZATION_TEMPLATE_DEFINITIONS[0];

    expect(template.acceptedFormats).toEqual(["csv", "xlsx", "json"]);
    expect(template.requiredFields).toEqual(
      expect.arrayContaining([
        "tenant_workload_id",
        "source_platform",
        "artifact_type",
        "disposition",
        "automation_confidence",
        "source",
        "as_of",
        "confidence",
      ]),
    );
    expect(template.requiredFields).not.toContain("sql_text");
    expect(template.requiredFields).not.toContain("source_code");
  });
});

describe("Lakebridge/Analyzer inventory parser", () => {
  it("normalizes human workbook headers into canonical workload rows", () => {
    const parsed = parseAnalyzerInventoryRows([
      {
        "Workload ID": "PHS-DS-001",
        "Workload Name": "Epic Clarity ADT to DB2 landing",
        Domain: "Clinical operations",
        Owner: "Data Platform Lead",
        Platform: "datastage",
        Category: "etl",
        "Object Type": "job",
        Complexity: "complex",
        "7R": "re-architect",
        "Automation Confidence": "medium",
        LOC: "12,450",
        Dependencies: "18",
        "Automation Low": "40%",
        "Automation High": "75%",
        Source: "Lakebridge Analyzer export",
        "As Of": "2026-06-03",
        Confidence: "high",
        "Source File": "phs-analyzer-export.xlsx",
        "Source Row": 7,
      },
    ]);

    expect(parsed.validation.valid).toBe(true);
    expect(parsed.objectType).toBe("lakebridge_analyzer_inventory");
    expect(parsed.rows[0]).toMatchObject({
      tenantWorkloadId: "PHS-DS-001",
      sourcePlatform: "DataStage",
      sourceType: "etl",
      artifactType: "etl_job",
      complexity: "high",
      disposition: "refactor",
      automationConfidence: "medium",
      loc: 12450,
      dependencyCount: 18,
      automationRateLow: 0.4,
      automationRateHigh: 0.75,
      sourceFile: "phs-analyzer-export.xlsx",
      sourceRow: 7,
    });
  });

  it("supports SQL Server stored logic metadata without accepting code", () => {
    const parsed = parseAnalyzerInventoryRows([
      {
        tenant_workload_id: "PHS-SQL-044",
        workload_name: "Revenue cycle denials proc family",
        source_platform: "SQL Server",
        source_type: "stored_logic",
        artifact_type: "stored_procedure",
        complexity: "medium",
        disposition: "refactor",
        automation_confidence: "low",
        object_count: 14,
        loc: 8200,
        source: "Lakebridge Analyzer metadata export",
        as_of: "2026-06-03",
        confidence: "medium",
      },
    ]);

    expect(parsed.validation.valid).toBe(true);
    expect(parsed.rows[0]).toMatchObject({
      artifactType: "stored_procedure",
      objectCount: 14,
      loc: 8200,
    });
  });

  it("rejects raw SQL or script bodies so AbarVa does not rescan code", () => {
    const parsed = parseAnalyzerInventoryRows([
      {
        tenant_workload_id: "PHS-SQL-045",
        workload_name: "Raw SQL body should not be uploaded",
        source_platform: "SQL Server",
        source_type: "stored_logic",
        artifact_type: "stored_procedure",
        complexity: "medium",
        disposition: "refactor",
        automation_confidence: "low",
        source: "Lakebridge Analyzer metadata export",
        as_of: "2026-06-03",
        confidence: "medium",
        sql_text: "SELECT * FROM patients",
      },
    ]);

    expect(parsed.validation.valid).toBe(false);
    expect(parsed.validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "sql_text",
          message: expect.stringContaining("Analyzer metadata only"),
        }),
      ]),
    );
  });

  it("enforces tenant-owned workload identity uniqueness", () => {
    const first = row({ tenantWorkloadId: "DUP-1", workloadName: "First" });
    const second = row({ tenantWorkloadId: "DUP-1", workloadName: "Second" });

    const validation = validateAnalyzerInventoryRows([first, second]);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rowIndex: 1,
          field: "tenantWorkloadId",
          message: expect.stringContaining("Duplicate"),
        }),
      ]),
    );
  });

  it("warns rather than fabricates when complexity and size signals are absent", () => {
    const validation = validateAnalyzerInventoryRows([
      row({
        tenantWorkloadId: "PHS-UNK-1",
        complexity: "unknown",
        loc: undefined,
        objectCount: undefined,
        dependencyCount: undefined,
      }),
    ]);

    expect(validation.valid).toBe(true);
    expect(validation.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "complexity",
          message: expect.stringContaining("low-confidence planning range"),
        }),
      ]),
    );
  });

  it("rejects invalid 7R dispositions, confidence values, and bad ranges", () => {
    const validation = validateAnalyzerInventoryRows([
      row({
        disposition: "modernize" as AnalyzerInventoryRow["disposition"],
        automationConfidence:
          "certain" as AnalyzerInventoryRow["automationConfidence"],
        automationRateLow: 0.8,
        automationRateHigh: 0.4,
        volumeGb: Number.NaN,
      }),
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining([
        "disposition",
        "automationConfidence",
        "automationRateHigh",
        "volumeGb",
      ]),
    );
  });
});

function row(
  overrides: Partial<AnalyzerInventoryRow> = {},
): AnalyzerInventoryRow {
  return {
    tenantWorkloadId: "PHS-DS-001",
    workloadName: "Epic Clarity ADT to DB2 landing",
    sourcePlatform: "DataStage",
    sourceType: "etl",
    artifactType: "etl_job",
    complexity: "high",
    disposition: "refactor",
    automationConfidence: "medium",
    source: "Lakebridge Analyzer metadata export",
    asOf: "2026-06-03",
    confidence: "high",
    ...overrides,
  };
}
