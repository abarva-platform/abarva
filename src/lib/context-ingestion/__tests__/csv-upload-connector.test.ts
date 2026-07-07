import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  inferCsvSchemaMapping,
  loadCsvUploadToTenantContext,
  parseCsvUpload,
  parseStructuredUpload,
  prepareCsvUploadForTenantContext,
} from "../csv-upload-connector";
import {
  getTemplateById,
  getTemplateForDimension,
  getTemplatesForTenant,
} from "../template-registry";
import type { ContextDimension } from "../types";

type MeridianCatalogTemplate = {
  id: string;
  dimension: ContextDimension;
  file: string;
  required_fields: string[];
  owner_role: string;
  refresh_cadence: string;
};

function createContextPromotionDbMock(
  calls: Array<{ table: string; operation: string; payload: unknown }>,
) {
  const recordIds = new Map<string, string>();
  return {
    from(table: string) {
      return {
        insert(payload: unknown) {
          calls.push({ table, operation: "insert", payload });
          return {
            select() {
              const rows = Array.isArray(payload) ? payload : [payload];
              return Promise.resolve({
                data: rows.map((_, index) => ({
                  id: `row-${index}`,
                  chunk_id: `chunk-${index}`,
                })),
                error: null,
                count: rows.length,
              });
            },
          };
        },
        upsert(payload: unknown) {
          calls.push({ table, operation: "upsert", payload });
          const rows = Array.isArray(payload) ? payload : [payload];
          if (table === "enterprise_context_records") {
            rows.forEach((row, index) => {
              const record = row as { canonical_record_id?: string };
              if (record.canonical_record_id) {
                recordIds.set(record.canonical_record_id, `record-${index}`);
              }
            });
          }
          return {
            select() {
              const idPrefix =
                table === "enterprise_context_sources"
                  ? "source"
                  : table === "enterprise_context_source_files"
                    ? "source-file"
                    : "upsert";
              return Promise.resolve({
                data: rows.map((_, index) => ({ id: `${idPrefix}-${index}` })),
                error: null,
                count: rows.length,
              });
            },
          };
        },
        update(payload: unknown) {
          calls.push({ table, operation: "update", payload });
          const chain = {
            eq() {
              return chain;
            },
            in() {
              return chain;
            },
            select() {
              return Promise.resolve({ data: [], error: null, count: 0 });
            },
          };
          return chain;
        },
        select() {
          return {
            eq() {
              return {
                in() {
                  return Promise.resolve({
                    data: [...recordIds.entries()].map(
                      ([canonical_record_id, id]) => ({
                        canonical_record_id,
                        id,
                      }),
                    ),
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
}

function readMeridianTemplateCatalog(): MeridianCatalogTemplate[] {
  const catalogPath = path.join(
    process.cwd(),
    "datasets/meridian-health-synthetic-v1/17-upload-templates/template-catalog.json",
  );
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
    templates: MeridianCatalogTemplate[];
  };
  return catalog.templates;
}

describe("csv upload connector", () => {
  it("parses quoted CSV values without splitting embedded commas", () => {
    const parsed = parseCsvUpload(
      [
        "app_id,name,owner_role,notes",
        'app-1,"Claims, Core",VP Architecture,"Tier 1, regulated"',
      ].join("\n"),
    );

    expect(parsed.headers).toEqual(["app_id", "name", "owner_role", "notes"]);
    expect(parsed.rows).toEqual([
      {
        app_id: "app-1",
        name: "Claims, Core",
        owner_role: "VP Architecture",
        notes: "Tier 1, regulated",
      },
    ]);
  });

  it("parses Meridian enterprise profile YAML into template rows", () => {
    const yamlText = fs.readFileSync(
      path.join(
        process.cwd(),
        "datasets/meridian-health-synthetic-v1/17-upload-templates/enterprise-profile.yaml",
      ),
      "utf8",
    );
    const parsed = parseStructuredUpload(yamlText, "enterprise-profile.yaml");

    expect(parsed.headers).toEqual(["metric", "value", "period", "source"]);
    expect(parsed.rows).toEqual(
      expect.arrayContaining([
        {
          metric: "headquarters",
          value: "Sacramento, California",
          period: "FY2026",
          source: "enterprise-profile",
        },
        {
          metric: "hospitals",
          value: "30",
          period: "FY2026",
          source: "enterprise-profile",
        },
      ]),
    );
  });

  it("parses Meridian HL7/FHIR topology JSON into template rows", () => {
    const jsonText = fs.readFileSync(
      path.join(
        process.cwd(),
        "datasets/meridian-health-synthetic-v1/17-upload-templates/hl7-fhir-integration-topology.json",
      ),
      "utf8",
    );
    const parsed = parseStructuredUpload(
      jsonText,
      "hl7-fhir-integration-topology.json",
    );

    expect(parsed.headers).toEqual(
      expect.arrayContaining([
        "edge_id",
        "source",
        "target",
        "standard",
        "data_class",
      ]),
    );
    expect(parsed.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          edge_id: "MR-INT-001",
          source: "MR-APP-EPIC",
          standard: "HL7 v2 ORU",
          data_class: "PHI",
        }),
      ]),
    );
  });

  it("infers schema mapping from the selected context template and headers", () => {
    const mapping = inferCsvSchemaMapping({
      fileName: "application-portfolio.csv",
      templateId: "application-portfolio",
      headers: [
        "app_id",
        "name",
        "criticality",
        "owner_role",
        "system_of_record",
      ],
    });

    expect(mapping).toMatchObject({
      templateId: "application-portfolio",
      dimension: "application_portfolio",
      sourceRecordIdColumn: "app_id",
      titleColumn: "name",
      fieldMappings: {
        app_id: "app_id",
        name: "name",
        criticality: "criticality",
        owner_role: "owner_role",
        system_of_record: "system_of_record",
      },
    });
  });

  it("infers DORA required fields from pilot-friendly source headers", () => {
    const mapping = inferCsvSchemaMapping({
      fileName: "dora_productivity_baseline.csv",
      templateId: "dora-baseline",
      headers: [
        "scorecard_id",
        "domain",
        "lead_time_for_change_hours",
        "deploy_frequency_per_week",
        "MTTR_hours",
        "change_failure_rate_pct",
        "last_updated",
        "metric",
      ],
    });

    expect(mapping).toMatchObject({
      templateId: "dora-baseline",
      dimension: "delivery_dora_devex",
      sourceRecordIdColumn: "scorecard_id",
      titleColumn: "metric",
      fieldMappings: {
        team_id: "scorecard_id",
        measured_at: "last_updated",
        deploy_freq_per_week: "deploy_frequency_per_week",
        lead_time_hours: "lead_time_for_change_hours",
        mttr_hours: "MTTR_hours",
        change_failure_rate_pct: "change_failure_rate_pct",
      },
    });
  });

  it("represents Meridian healthcare template catalog entries in the tenant runtime registry", () => {
    const catalogTemplates = readMeridianTemplateCatalog();
    const runtimeTemplates = getTemplatesForTenant("meridian-health");

    for (const catalogTemplate of catalogTemplates) {
      const byId = getTemplateById(catalogTemplate.id, {
        tenantKey: "meridian-health",
      });
      const byDimension = getTemplateForDimension(catalogTemplate.dimension, {
        tenantKey: "meridian-health",
      });

      expect(byId).toMatchObject({
        id: catalogTemplate.id,
        dimension: catalogTemplate.dimension,
        ownerRole: catalogTemplate.owner_role,
        refreshCadence: catalogTemplate.refresh_cadence,
      });
      expect(byId?.requiredFields).toEqual(catalogTemplate.required_fields);
      expect(byDimension?.id).toBe(catalogTemplate.id);
    }
    expect(runtimeTemplates.map((template) => template.id)).toEqual(
      expect.arrayContaining(catalogTemplates.map((template) => template.id)),
    );
    expect(
      getTemplateById("application-portfolio", { tenantKey: "meridian-health" })
        ?.requiredFields,
    ).toContain("clinical_criticality");
  });

  it("prepares tenant-scoped pending context chunks without writing other tenants", () => {
    const prepared = prepareCsvUploadForTenantContext({
      clientId: "client-apex",
      tenantKey: "apex-retail",
      uploadedBy: "user-1",
      fileName: "application-portfolio.csv",
      uploadedAt: "2026-05-30T12:00:00.000Z",
      csvText: [
        "app_id,name,criticality,owner_role,system_of_record",
        "app-1,Claims Core,Tier 1,VP Architecture,true",
        "app-2,Finance Data Mart,Tier 2,Director Finance,true",
      ].join("\n"),
      mapping: { templateId: "application-portfolio" },
    });

    expect(prepared.chunks).toHaveLength(2);
    expect(
      prepared.chunks.every((chunk) => chunk.client_id === "client-apex"),
    ).toBe(true);
    expect(
      prepared.chunks.every((chunk) => chunk.tenant_key === "apex-retail"),
    ).toBe(true);
    expect(
      prepared.chunks.every((chunk) => chunk.embedding_status === "pending"),
    ).toBe(true);
    expect(prepared.chunks[0]).toMatchObject({
      source_segment_id: "it_landscape",
      source_record_id: "app-1",
      source_doc: "application-portfolio.csv",
    });
    expect(prepared.embeddingHandoff.command).toBe(
      "npm run embed:pending-chunks -- --tenant apex-retail",
    );
  });

  it("prepares Meridian/PHS healthcare uploads as template-backed pending loader output with provenance", () => {
    const prepared = prepareCsvUploadForTenantContext({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-phs",
      fileName: "prior-auth-workqueue.csv",
      uploadedAt: "2026-06-05T12:00:00.000Z",
      csvText: [
        "payer,service_line,volume,denial_rate_pct,automation_readiness",
        "BlueCross,Orthopedics,128,14.2,medium",
      ].join("\n"),
      mapping: { templateId: "prior-auth-workqueue" },
    });

    expect(prepared.template).toMatchObject({
      id: "prior-auth-workqueue",
      dimension: "prior_authorization",
      ownerRole: "VP Revenue Cycle",
    });
    expect(prepared.chunks).toEqual([
      expect.objectContaining({
        client_id: "client-meridian",
        tenant_key: "meridian-health",
        source_segment_id: "program_inventory",
        source_record_id: "row-2",
        source_doc: "prior-auth-workqueue.csv",
        source_path:
          "csv-upload://meridian-health/prior-auth-workqueue.csv#row=2",
        embedding_status: "pending",
        embedding_model: null,
        embedding_error: null,
        provenance: expect.objectContaining({
          loader: "c5-csv-upload-connector",
          tenant_key: "meridian-health",
          client_id: "client-meridian",
          source_doc: "prior-auth-workqueue.csv",
          source_row: 2,
          uploaded_by: "user-phs",
          schema_mapping: expect.objectContaining({
            templateId: "prior-auth-workqueue",
            dimension: "prior_authorization",
          }),
        }),
        chunk_metadata: expect.objectContaining({
          template_id: "prior-auth-workqueue",
          context_dimension: "prior_authorization",
          record_kind: "csv_upload_row",
        }),
      }),
    ]);
    expect(prepared.embeddingHandoff).toEqual({
      status: "pending_embed_job",
      command: "npm run embed:pending-chunks -- --tenant meridian-health",
      searchableWhen:
        "after the pending chunk embedding worker marks these rows embedded and upserts vectors",
    });
    expect(prepared.chunks[0]?.chunk_metadata).not.toHaveProperty(
      "agent_ready",
    );
    expect(prepared.chunks[0]?.chunk_metadata).not.toHaveProperty(
      "human_approval_status",
    );
    expect(prepared.chunks[0]?.provenance).not.toHaveProperty(
      "human_approved_at",
    );
  });

  it("prepares Meridian YAML and JSON uploads through the same governed connector", () => {
    const yamlText = fs.readFileSync(
      path.join(
        process.cwd(),
        "datasets/meridian-health-synthetic-v1/17-upload-templates/enterprise-profile.yaml",
      ),
      "utf8",
    );
    const enterpriseProfile = prepareCsvUploadForTenantContext({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-phs",
      fileName: "enterprise-profile.yaml",
      uploadedAt: "2026-06-05T12:00:00.000Z",
      csvText: yamlText,
      mapping: { templateId: "enterprise-profile" },
    });

    expect(enterpriseProfile.rowsParsed).toBeGreaterThanOrEqual(10);
    expect(enterpriseProfile.chunks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source_doc: "enterprise-profile.yaml",
          chunk_text: expect.stringContaining("Sacramento, California"),
          provenance: expect.objectContaining({
            loader: "c5-csv-upload-connector",
            tenant_key: "meridian-health",
          }),
        }),
      ]),
    );

    const jsonText = fs.readFileSync(
      path.join(
        process.cwd(),
        "datasets/meridian-health-synthetic-v1/17-upload-templates/hl7-fhir-integration-topology.json",
      ),
      "utf8",
    );
    const topology = prepareCsvUploadForTenantContext({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-phs",
      fileName: "hl7-fhir-integration-topology.json",
      uploadedAt: "2026-06-05T12:00:00.000Z",
      csvText: jsonText,
      mapping: { templateId: "hl7-fhir-integration-topology" },
    });

    expect(topology.rowsParsed).toBe(2);
    expect(topology.chunks[0]).toMatchObject({
      source_doc: "hl7-fhir-integration-topology.json",
      source_record_id: "MR-INT-001",
      source_segment_id: "it_landscape",
    });
  });

  it("batch inserts prepared chunks without delete or cross-tenant writes", async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> =
      [];
    const db = createContextPromotionDbMock(calls);

    const result = await loadCsvUploadToTenantContext({
      clientId: "client-first-capital",
      tenantKey: "first-capital",
      uploadedBy: "user-2",
      fileName: "vendor-contracts.csv",
      uploadedAt: "2026-05-30T12:00:00.000Z",
      csvText: [
        "vendor_id,vendor_name,annual_value_usd,renewal_date",
        "ven-1,Finzly,1200000,2026-10-01",
      ].join("\n"),
      mapping: { templateId: "vendor-contracts" },
      classificationOverrides: { domainSegment: "DATA_ANALYTICS" },
      db: db as never,
    });

    expect(result.persistence.status).toBe("inserted");
    expect(result.chunksQueued).toBe(1);
    expect(result.enterpriseContextPromotion.recordsPromoted).toBe(1);
    expect(result.enterpriseContextPromotion.factsPromoted).toBeGreaterThan(0);
    expect(result.fileHash).toBe(
      crypto
        .createHash("sha256")
        .update(
          [
            "vendor_id,vendor_name,annual_value_usd,renewal_date",
            "ven-1,Finzly,1200000,2026-10-01",
          ].join("\n"),
        )
        .digest("hex"),
    );
    expect(calls.map((call) => call.operation)).toEqual([
      "insert",
      "upsert",
      "upsert",
      "upsert",
      "upsert",
      "update",
      "upsert",
      "update",
    ]);
    expect(calls.some((call) => call.operation === "delete")).toBe(false);
    const sourceFileUpsert = calls.find(
      (call) => call.table === "enterprise_context_source_files",
    );
    expect(sourceFileUpsert?.payload).toEqual(
      expect.objectContaining({
        source_file: "vendor-contracts.csv",
        file_hash: result.fileHash,
      }),
    );
    const recordUpsert = calls.find(
      (call) => call.table === "enterprise_context_records",
    );
    expect(recordUpsert?.payload).toEqual([
      expect.objectContaining({
        source_id: "source-0",
        source_file_id: "source-file-0",
      }),
    ]);
    const chunkInsert = calls.find(
      (call) => call.table === "enterprise_context_chunks",
    );
    expect(chunkInsert?.payload).toEqual([
      expect.objectContaining({
        client_id: "client-first-capital",
        tenant_key: "first-capital",
        source_record_id: "ven-1",
        domain_segment: "DATA_ANALYTICS",
        classification_source: "OPERATOR_CONFIRMED",
        lifecycle_state: "active",
        embedding_status: "pending",
      }),
    ]);
  });

  it("blocks PHS phase 0 uploads with missing required evidence fields before persistence", async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> =
      [];
    const db = {
      from(table: string) {
        return {
          insert(payload: unknown) {
            calls.push({ table, operation: "insert", payload });
            return {
              select() {
                return Promise.resolve({ data: [], error: null, count: 0 });
              },
            };
          },
        };
      },
    };

    await expect(
      loadCsvUploadToTenantContext({
        clientId: "client-meridian",
        tenantKey: "meridian-health",
        uploadedBy: "user-3",
        fileName: "phs-evidence-register.csv",
        csvText: [
          "title,source_type,owner,evidence_date,sensitivity,confidence,summary,usable_by_surface",
          'Stars baseline,public,Data steward,2026-06-05,public,high,Public Stars measure baseline,"moves,admin"',
        ].join("\n"),
        mapping: { templateId: "phs-evidence-register" },
        db: db as never,
      }),
    ).rejects.toThrow("csv_missing_required_fields:citation_key");

    expect(calls).toHaveLength(0);
  });

  it("appends PHS evidence-register rows to the evidence ledger after context chunks insert", async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> =
      [];
    const evidenceInputs: unknown[] = [];
    const db = createContextPromotionDbMock(calls);

    const result = await loadCsvUploadToTenantContext({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-3",
      fileName: "phs-evidence-register.csv",
      uploadedAt: "2026-06-05T12:00:00.000Z",
      csvText: [
        "citation_key,title,source_type,owner,evidence_date,sensitivity,confidence,summary,usable_by_surface,source_url,source_quote",
        'PHS-STARS-2026,Stars baseline,public,Data steward,2026-06-05,public,high,Public Stars measure baseline,"moves,admin",https://example.test/stars,"3.0 Stars baseline"',
      ].join("\n"),
      mapping: { templateId: "phs-evidence-register" },
      classificationOverrides: { domainSegment: "DATA_ANALYTICS" },
      db: db as never,
      recordEvidenceFn: async (input) => {
        evidenceInputs.push(input);
        return "ledger-1";
      },
    });

    expect(result.persistence.status).toBe("inserted");
    expect(result.evidenceLedger).toEqual({
      status: "inserted",
      rowsRecorded: 1,
      evidenceIds: ["ledger-1"],
      detail:
        "PHS evidence register rows were appended to the evidence ledger.",
    });
    expect(calls.map((call) => call.table)).toEqual([
      "data_ingestion_runs",
      "enterprise_context_chunks",
      "enterprise_context_sources",
      "enterprise_context_source_files",
      "enterprise_context_records",
      "enterprise_context_facts",
      "enterprise_context_facts",
      "data_ingestion_runs",
    ]);
    expect(evidenceInputs).toEqual([
      expect.objectContaining({
        clientId: "client-meridian",
        artifactRef: "PHS-STARS-2026",
        sourceType: "document_extract",
        sourceQuote: "3.0 Stars baseline",
      }),
    ]);
  });
});
