import { NextRequest } from "next/server";

import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";

import { POST } from "../route";

const mockRequireTenancy = jest.fn();
const mockSensitiveUploadResponse = jest.fn();
const mockBlobUpload = jest.fn();
const mockGetAzureWriteFluentClient = jest.fn();
const mockGetObjectStorageAdapter = jest.fn();
const mockRunInsightEvaluation = jest.fn();
const mockDbCalls: Array<{
  table: string;
  operation: string;
  payload: unknown;
  options?: unknown;
}> = [];
const mockRecordIds = new Map<string, string>();
const mockAllowedTables = new Set([
  "data_ingestion_runs",
  "enterprise_context_chunks",
  "enterprise_context_sources",
  "enterprise_context_source_files",
  "enterprise_context_records",
  "enterprise_context_facts",
  "context_refresh_events",
]);

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () =>
    new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }),
}));

jest.mock("@/lib/security/sensitive-upload-guard", () => ({
  evaluateSensitiveUpload: jest.fn(() => ({
    decision: "allow",
    matchedRules: [],
  })),
  sensitiveUploadRejectedResponse: (...args: unknown[]) =>
    mockSensitiveUploadResponse(...args),
}));

jest.mock("@/lib/intelligence/insight-engine", () => ({
  runInsightEvaluation: (...args: unknown[]) => mockRunInsightEvaluation(...args),
}));

function rowsForMutation(table: string, payload: unknown) {
  const rows = Array.isArray(payload) ? payload : [payload];
  if (table === "context_refresh_events") {
    return rows.map((row, index) => {
      const event = row as {
        client_id?: string;
        tenant_key?: string;
        triggered_by?: string;
        source_id?: string | null;
        source_label?: string | null;
        period_label?: string | null;
        rows_seen?: number;
        rows_accepted?: number;
        rows_rejected?: number;
        facts_created?: number;
        facts_updated?: number;
        facts_superseded?: number;
        approval_required?: boolean;
        affected_surfaces?: string[];
        receipt_url?: string | null;
      };
      return {
        id: `refresh-event-${index}`,
        client_id: event.client_id ?? null,
        tenant_key: event.tenant_key ?? null,
        triggered_by: event.triggered_by ?? null,
        source_id: event.source_id ?? null,
        source_label: event.source_label ?? null,
        period_label: event.period_label ?? null,
        rows_seen: event.rows_seen ?? 0,
        rows_accepted: event.rows_accepted ?? 0,
        rows_rejected: event.rows_rejected ?? 0,
        facts_created: event.facts_created ?? 0,
        facts_updated: event.facts_updated ?? 0,
        facts_superseded: event.facts_superseded ?? 0,
        approval_required: event.approval_required ?? false,
        affected_surfaces: event.affected_surfaces ?? [],
        receipt_url: event.receipt_url ?? null,
        created_at: "2026-09-21T00:00:00.000Z",
      };
    });
  }
  const idPrefix =
    table === "enterprise_context_sources"
      ? "source"
      : table === "enterprise_context_source_files"
        ? "source-file"
        : table === "enterprise_context_chunks"
          ? "chunk"
          : table === "data_ingestion_runs"
            ? "ingestion-run"
            : table === "enterprise_context_facts"
              ? "fact"
              : "upsert";
  return rows.map((row, index) => ({
    id: `${idPrefix}-${index}`,
    chunk_id:
      typeof row === "object" && row !== null && "chunk_id" in row
        ? (row as { chunk_id?: string }).chunk_id
        : `chunk-${index}`,
  }));
}

function createMockDbClient() {
  return {
    from(table: string) {
      if (!mockAllowedTables.has(table)) {
        throw new Error(`unmocked_postgres_table:${table}`);
      }
      return {
        insert(payload: unknown, options?: unknown) {
          mockDbCalls.push({ table, operation: "insert", payload, options });
          return {
            select() {
              const rows = rowsForMutation(table, payload);
              return {
                then(resolve: (value: unknown) => void) {
                  resolve({
                    data: rows,
                    error: null,
                    count: rows.length,
                  });
                },
                single() {
                  return Promise.resolve({
                    data: rows[0] ?? null,
                    error: null,
                    count: rows.length,
                  });
                },
              };
            },
          };
        },
        upsert(payload: unknown, options?: unknown) {
          mockDbCalls.push({ table, operation: "upsert", payload, options });
          const rows = Array.isArray(payload) ? payload : [payload];
          if (table === "enterprise_context_records") {
            rows.forEach((row, index) => {
              const record = row as { canonical_record_id?: string };
              if (record.canonical_record_id) {
                mockRecordIds.set(
                  record.canonical_record_id,
                  `record-${index}`,
                );
              }
            });
          }
          return {
            select() {
              const mutationRows = rowsForMutation(table, payload);
              return Promise.resolve({
                data: mutationRows,
                error: null,
                count: rows.length,
              });
            },
          };
        },
        update(payload: unknown) {
          mockDbCalls.push({ table, operation: "update", payload });
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
                    data: [...mockRecordIds.entries()].map(
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

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => mockGetAzureWriteFluentClient(),
}));

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: () => mockGetObjectStorageAdapter(),
}));

function csvRequest(formData: FormData) {
  return new NextRequest(
    "http://localhost/api/admin/context-layer/csv-upload",
    {
      method: "POST",
      body: formData,
    },
  );
}

function addUploadAttestation(formData: FormData) {
  formData.set("operatorAttestationVersion", PILOT_UPLOAD_ATTESTATION_VERSION);
  formData.set("operatorAttestationAccepted", "true");
  formData.set("operatorDataAuthorityConfirmed", "true");
  formData.set("operatorDataUseConfirmed", "true");
  formData.set("operatorSensitiveDataConfirmed", "true");
}

function getMutationPayload(table: string) {
  return mockDbCalls.find((call) => call.table === table)?.payload;
}

function expectPersistedChunkRows(
  payload: unknown,
  expectedRows: Array<Record<string, unknown>>,
) {
  expect(payload).toEqual(expectedRows);
}

function expectTenantMutationToFail(expectedRow: Record<string, unknown>) {
  expect(() =>
    expectPersistedChunkRows(
      [{ ...expectedRow, tenant_key: undefined }],
      [expectedRow],
    ),
  ).toThrow();
  expect(() =>
    expectPersistedChunkRows(
      [
        {
          ...expectedRow,
          provenance: {
            ...(expectedRow.provenance as Record<string, unknown>),
            tenant_key: "wrong-tenant",
          },
        },
      ],
      [expectedRow],
    ),
  ).toThrow();
}

describe("/api/admin/context-layer/csv-upload", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    mockDbCalls.length = 0;
    mockRecordIds.clear();
    mockGetAzureWriteFluentClient.mockReset();
    mockGetAzureWriteFluentClient.mockImplementation(createMockDbClient);
    mockGetObjectStorageAdapter.mockReset();
    mockGetObjectStorageAdapter.mockReturnValue({
      upload: (...args: unknown[]) => mockBlobUpload(...args),
    });
    mockRunInsightEvaluation.mockReset();
    mockRunInsightEvaluation.mockResolvedValue(null);
    mockBlobUpload.mockReset();
    mockBlobUpload.mockResolvedValue(undefined);
    process.env.DATABASE_URL = "postgres://unit-test";
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-apex",
      clientKey: "apexretail",
      userId: "user-1",
    });
  });

  afterEach(() => {
    mockRequireTenancy.mockReset();
    mockSensitiveUploadResponse.mockReset();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("rejects cross-tenant client ids before parsing or persistence", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-other");
    formData.set(
      "file",
      new File(["app_id,name\napp-1,Claims"], "apps.csv", { type: "text/csv" }),
    );
    addUploadAttestation(formData);

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "forbidden_cross_tenant" });
    expect(mockDbCalls).toHaveLength(0);
    expect(mockBlobUpload).not.toHaveBeenCalled();
  });

  it("rejects uploads before processing when operator attestation is missing", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-apex");
    formData.set("templateId", "application-portfolio");
    formData.set("textColumns", JSON.stringify(["app_id", "name"]));
    formData.set(
      "file",
      new File(["app_id,name\napp-1,Claims"], "application-portfolio.csv", {
        type: "text/csv",
      }),
    );

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "upload_attestation_required",
      detail: expect.stringContaining("tenant admin must attest"),
      missing: [
        "operatorAttestationVersion",
        "operatorAttestationAccepted",
        "operatorDataAuthorityConfirmed",
        "operatorDataUseConfirmed",
        "operatorSensitiveDataConfirmed",
      ],
    });
    expect(mockDbCalls).toHaveLength(0);
    expect(mockBlobUpload).not.toHaveBeenCalled();
  });

  it("loads CSV rows as tenant-scoped pending context chunks", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-apex");
    formData.set("templateId", "application-portfolio");
    formData.set("sourceRecordIdColumn", "app_id");
    formData.set("titleColumn", "name");
    formData.set(
      "textColumns",
      JSON.stringify([
        "app_id",
        "name",
        "criticality",
        "owner_role",
        "system_of_record",
      ]),
    );
    addUploadAttestation(formData);
    formData.set("operatorAttestationNote", "CAB approval CAB-42");
    formData.set(
      "file",
      new File(
        [
          [
            "app_id,name,criticality,owner_role,system_of_record",
            "app-1,Claims Core,Tier 1,VP Architecture,true",
          ].join("\n"),
        ],
        "application-portfolio.csv",
        { type: "text/csv" },
      ),
    );

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      rowsParsed: 1,
      chunksQueued: 1,
      persistence: {
        status: "inserted",
        chunkRowsInserted: 1,
      },
      attestation: {
        version: PILOT_UPLOAD_ATTESTATION_VERSION,
        accepted: true,
        authorityConfirmed: true,
        dataUseConfirmed: true,
        sensitiveDataConfirmed: true,
        note: "CAB approval CAB-42",
      },
      embeddingHandoff: {
        command: "npm run embed:pending-chunks -- --tenant apex-retail",
      },
      sourceBlob: {
        bucket: "context-uploads",
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    });
    expect(mockBlobUpload).toHaveBeenCalledWith(
      "context-uploads",
      expect.stringContaining("apex-retail/_direct-csv/"),
      expect.any(Buffer),
      expect.objectContaining({
        contentType: "text/csv",
        upsert: false,
        metadata: expect.objectContaining({
          tenantKey: "apex-retail",
          clientId: "client-apex",
          sourceSystem: "admin_direct_csv_upload",
        }),
      }),
    );
    expect(mockGetObjectStorageAdapter).toHaveBeenCalled();
    expect(mockGetAzureWriteFluentClient).toHaveBeenCalled();
    const sourcePath = String(body.sourceBlob.path);
    const sourceHash = String(body.sourceBlob.sha256);
    expect(sourcePath).toMatch(
      /^apex-retail\/_direct-csv\/[a-f0-9]{12}\/\d{8}T\d{6}\/application-portfolio\.csv$/,
    );
    expect(sourceHash).toMatch(/^[a-f0-9]{64}$/);
    const expectedChunk = {
      business_function: null,
      chunk_id: "ctx:apex-retail:it-landscape:app-1:c0",
      chunk_index: 0,
      chunk_metadata: {
        classification: "confidential",
        confidence: 0.86,
        context_dimension: "application_portfolio",
        csv_headers: [
          "app_id",
          "name",
          "criticality",
          "owner_role",
          "system_of_record",
        ],
        lifecycle_state: "active",
        load_batch_id: expect.stringMatching(
          /^csv:apex-retail:application-portfolio-csv:[a-f0-9]{12}:\d{8}T\d{6}$/,
        ),
        record_kind: "csv_upload_row",
        sensitivity: "confidential",
        source_basis: "client_provided_upload",
        source_blob: {
          bucket: "context-uploads",
          path: sourcePath,
          sha256: sourceHash,
        },
        source_citation: `blob://context-uploads/${sourcePath}#row=2`,
        source_record_id: "app-1",
        template_id: "application-portfolio",
        title: "Claims Core",
      },
      chunk_text: [
        "Template: CMDB / application portfolio",
        "Row: 2",
        "Title: Claims Core",
        "app_id: app-1",
        "name: Claims Core",
        "criticality: Tier 1",
        "owner_role: VP Architecture",
        "system_of_record: true",
      ].join("\n"),
      classification_source: "NEEDS_CLASSIFICATION",
      client_id: "client-apex",
      criticality: "TIER_1",
      domain_segment: null,
      embedding_error: null,
      embedding_model: null,
      embedding_status: "pending",
      lifecycle_state: "review",
      load_batch_id: expect.stringMatching(
        /^csv:apex-retail:application-portfolio-csv:[a-f0-9]{12}:\d{8}T\d{6}$/,
      ),
      provenance: {
        classification: "confidential",
        client_id: "client-apex",
        confidence: 0.86,
        data_classification: "confidential",
        lifecycle_state: "active",
        loader: "c5-csv-upload-connector",
        schema_mapping: {
          dimension: "application_portfolio",
          fieldMappings: {
            app_id: "app_id",
            criticality: "criticality",
            name: "name",
            owner_role: "owner_role",
            system_of_record: "system_of_record",
          },
          sourceRecordIdColumn: "app_id",
          templateId: "application-portfolio",
          textColumns: [
            "app_id",
            "name",
            "criticality",
            "owner_role",
            "system_of_record",
          ],
          titleColumn: "name",
        },
        source_basis: "client_provided_upload",
        source_blob: {
          bucket: "context-uploads",
          path: sourcePath,
          sha256: sourceHash,
        },
        source_citation: `blob://context-uploads/${sourcePath}#row=2`,
        source_doc: "application-portfolio.csv",
        source_path: `blob://context-uploads/${sourcePath}`,
        source_row: 2,
        tenant_key: "apex-retail",
        upload_attestation: {
          accepted: true,
          acceptedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          authorityConfirmed: true,
          dataUseConfirmed: true,
          note: "CAB approval CAB-42",
          sensitiveDataConfirmed: true,
          version: PILOT_UPLOAD_ATTESTATION_VERSION,
        },
        upload_id: expect.stringMatching(
          /^csv:apex-retail:application-portfolio-csv:[a-f0-9]{12}:\d{8}T\d{6}$/,
        ),
        uploaded_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        uploaded_by: "user-1",
      },
      source_doc: "application-portfolio.csv",
      source_path: `blob://context-uploads/${sourcePath}#row=2`,
      source_record_id: "app-1",
      source_segment_id: "it_landscape",
      source_system: "application-portfolio",
      tenant_key: "apex-retail",
      token_count: 42,
    };
    expectPersistedChunkRows(getMutationPayload("enterprise_context_chunks"), [
      expectedChunk,
    ]);
    expectTenantMutationToFail(expectedChunk);
    const runInsert = mockDbCalls.find(
      (call) => call.table === "data_ingestion_runs",
    );
    expect(runInsert?.payload).toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          upload_attestation: expect.objectContaining({
            version: PILOT_UPLOAD_ATTESTATION_VERSION,
            accepted: true,
          }),
        }),
      }),
    );
    expect(mockDbCalls.some((call) => call.operation === "delete")).toBe(false);
  });

  it("loads JSON context rows through the same tenant-scoped upload route", async () => {
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-meridian",
      clientKey: "meridian-health",
      userId: "user-meridian",
    });
    const formData = new FormData();
    formData.set("clientId", "client-meridian");
    formData.set("templateId", "hl7-fhir-integration-topology");
    addUploadAttestation(formData);
    formData.set(
      "file",
      new File(
        [
          JSON.stringify({
            edges: [
              {
                edge_id: "MR-INT-001",
                source: "MR-APP-EPIC",
                target: "MR-APP-LIS",
                standard: "HL7 v2 ORU",
                data_class: "PHI",
              },
            ],
          }),
        ],
        "hl7-fhir-integration-topology.json",
        { type: "application/json" },
      ),
    );

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      rowsParsed: 1,
      chunksQueued: 1,
      embeddingHandoff: {
        command: "npm run embed:pending-chunks -- --tenant meridian-health",
      },
      sourceBlob: {
        bucket: "context-uploads",
      },
    });
    expect(mockBlobUpload).toHaveBeenCalledWith(
      "context-uploads",
      expect.stringContaining("meridian-health/_direct-csv/"),
      expect.any(Buffer),
      expect.objectContaining({
        metadata: expect.objectContaining({
          tenantKey: "meridian-health",
          clientId: "client-meridian",
        }),
      }),
    );
    expect(mockGetObjectStorageAdapter).toHaveBeenCalled();
    expect(mockGetAzureWriteFluentClient).toHaveBeenCalled();
    const sourcePath = String(body.sourceBlob.path);
    const sourceHash = String(body.sourceBlob.sha256);
    expect(sourcePath).toMatch(
      /^meridian-health\/_direct-csv\/[a-f0-9]{12}\/\d{8}T\d{6}\/hl7-fhir-integration-topology\.json$/,
    );
    expect(sourceHash).toMatch(/^[a-f0-9]{64}$/);
    const expectedChunk = {
      business_function: null,
      chunk_id: "ctx:meridian-health:it-landscape:mr-int-001:c0",
      chunk_index: 0,
      chunk_metadata: {
        classification: "confidential",
        confidence: 0.86,
        context_dimension: "interoperability_topology",
        csv_headers: ["edge_id", "source", "target", "standard", "data_class"],
        lifecycle_state: "active",
        load_batch_id: expect.stringMatching(
          /^csv:meridian-health:hl7-fhir-integration-topology-json:[a-f0-9]{12}:\d{8}T\d{6}$/,
        ),
        record_kind: "csv_upload_row",
        sensitivity: "confidential",
        source_basis: "client_provided_upload",
        source_blob: {
          bucket: "context-uploads",
          path: sourcePath,
          sha256: sourceHash,
        },
        source_citation: `blob://context-uploads/${sourcePath}#row=2`,
        source_record_id: "MR-INT-001",
        template_id: "hl7-fhir-integration-topology",
        title: null,
      },
      chunk_text: [
        "Template: HL7/FHIR integration topology",
        "Row: 2",
        "edge_id: MR-INT-001",
        "source: MR-APP-EPIC",
        "target: MR-APP-LIS",
        "standard: HL7 v2 ORU",
        "data_class: PHI",
      ].join("\n"),
      classification_source: "NEEDS_CLASSIFICATION",
      client_id: "client-meridian",
      criticality: null,
      domain_segment: null,
      embedding_error: null,
      embedding_model: null,
      embedding_status: "pending",
      lifecycle_state: "review",
      load_batch_id: expect.stringMatching(
        /^csv:meridian-health:hl7-fhir-integration-topology-json:[a-f0-9]{12}:\d{8}T\d{6}$/,
      ),
      provenance: {
        classification: "confidential",
        client_id: "client-meridian",
        confidence: 0.86,
        data_classification: "confidential",
        lifecycle_state: "active",
        loader: "c5-csv-upload-connector",
        schema_mapping: {
          dimension: "interoperability_topology",
          fieldMappings: {
            data_class: "data_class",
            edge_id: "edge_id",
            source: "source",
            standard: "standard",
            target: "target",
          },
          sourceRecordIdColumn: "edge_id",
          templateId: "hl7-fhir-integration-topology",
          textColumns: ["edge_id", "source", "target", "standard", "data_class"],
          titleColumn: null,
        },
        source_basis: "client_provided_upload",
        source_blob: {
          bucket: "context-uploads",
          path: sourcePath,
          sha256: sourceHash,
        },
        source_citation: `blob://context-uploads/${sourcePath}#row=2`,
        source_doc: "hl7-fhir-integration-topology.json",
        source_path: `blob://context-uploads/${sourcePath}`,
        source_row: 2,
        tenant_key: "meridian-health",
        upload_attestation: {
          accepted: true,
          acceptedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          authorityConfirmed: true,
          dataUseConfirmed: true,
          note: null,
          sensitiveDataConfirmed: true,
          version: PILOT_UPLOAD_ATTESTATION_VERSION,
        },
        upload_id: expect.stringMatching(
          /^csv:meridian-health:hl7-fhir-integration-topology-json:[a-f0-9]{12}:\d{8}T\d{6}$/,
        ),
        uploaded_at: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        uploaded_by: "user-meridian",
      },
      source_doc: "hl7-fhir-integration-topology.json",
      source_path: `blob://context-uploads/${sourcePath}#row=2`,
      source_record_id: "MR-INT-001",
      source_segment_id: "it_landscape",
      source_system: "hl7-fhir-integration-topology",
      tenant_key: "meridian-health",
      token_count: 36,
    };
    expectPersistedChunkRows(getMutationPayload("enterprise_context_chunks"), [
      expectedChunk,
    ]);
  });

  it("stages workbook uploads for review without committing tenant facts", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-apex");
    formData.set("templateId", "dora-baseline");
    addUploadAttestation(formData);
    formData.set(
      "file",
      new File(["not-a-real-workbook"], "dora-baseline.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      ok: false,
      reviewRequired: true,
      readyForCommit: false,
      rowsParsed: 0,
      detail: expect.stringContaining("preserved for review"),
      persistence: {
        status: "needs_operator_review",
        detail: expect.stringContaining("no tenant context rows or facts"),
      },
      sourceBlob: {
        bucket: "context-uploads",
      },
    });
    expect(mockBlobUpload).toHaveBeenCalledWith(
      "context-uploads",
      expect.stringContaining("apex-retail/_review-required/"),
      expect.any(Buffer),
      expect.objectContaining({
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        metadata: expect.objectContaining({
          tenantKey: "apex-retail",
          clientId: "client-apex",
          reviewRequired: "true",
          uploadFormat: "xlsx",
        }),
      }),
    );
    expect(mockDbCalls).toHaveLength(0);
  });

  it("validates Moves rate-card uploads without writing context chunks", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-apex");
    formData.set("templateId", "moves-rate-card-internal");
    addUploadAttestation(formData);
    formData.set(
      "file",
      new File(
        [
          [
            "function_group,specialization,role_level,base_annual_low_usd,base_annual_high_usd,benefits_overhead_pct,source,as_of,confidence",
            "Data/Analytics,Data Engineer (Spark/Python),Senior,$140000,$180000,42.65%,BLS OEWS + ECEC,2026-06-03,medium",
          ].join("\n"),
        ],
        "moves-internal-rate-card.csv",
        { type: "text/csv" },
      ),
    );

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      ok: false,
      mode: "rate_card_validation_preview",
      readyForCommit: true,
      rowsParsed: 1,
      template: {
        id: "moves-rate-card-internal",
        segmentFamily: "resource_rate_card",
      },
      validation: {
        valid: true,
        errors: [],
      },
      persistence: {
        status: "validation_only",
      },
    });
    expect(mockDbCalls).toHaveLength(0);
    expect(mockBlobUpload).not.toHaveBeenCalled();
  });

  it("keeps rate-card validation CSV-only", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-apex");
    formData.set("templateId", "moves-rate-card-internal");
    addUploadAttestation(formData);
    formData.set(
      "file",
      new File([JSON.stringify({ rows: [] })], "moves-rate-card.json", {
        type: "application/json",
      }),
    );

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "unsupported_file_type",
      detail: "Rate-card validation currently requires a .csv file.",
    });
    expect(mockDbCalls).toHaveLength(0);
    expect(mockBlobUpload).not.toHaveBeenCalled();
  });

  it("returns rate-card validation errors before commit", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-apex");
    formData.set("templateId", "moves-rate-card-vendor");
    addUploadAttestation(formData);
    formData.set(
      "file",
      new File(
        [
          [
            "vendor_tier,functional_tower,role_level,sourcing_location,hourly_low_usd,hourly_high_usd,source,as_of,confidence",
            "Made Up,Security,Senior,Onshore,250,200,GSA MAS,2026-06-03,medium",
          ].join("\n"),
        ],
        "moves-vendor-rate-card.csv",
        { type: "text/csv" },
      ),
    );

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      mode: "rate_card_validation_preview",
      readyForCommit: false,
      validation: {
        valid: false,
      },
    });
    expect(
      body.validation.errors.map((error: { field: string }) => error.field),
    ).toEqual(expect.arrayContaining(["vendorTier", "hourlyHighUsd"]));
    expect(mockDbCalls).toHaveLength(0);
    expect(mockBlobUpload).not.toHaveBeenCalled();
  });
});
