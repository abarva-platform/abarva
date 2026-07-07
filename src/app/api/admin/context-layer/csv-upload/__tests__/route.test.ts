import { NextRequest } from "next/server";

import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";

import { POST } from "../route";

const mockRequireTenancy = jest.fn();
const mockSensitiveUploadResponse = jest.fn();
const mockBlobUpload = jest.fn();
const mockDbCalls: Array<{
  table: string;
  operation: string;
  payload: unknown;
}> = [];
const mockRecordIds = new Map<string, string>();

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

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from(table: string) {
      return {
        insert(payload: unknown) {
          mockDbCalls.push({ table, operation: "insert", payload });
          return {
            select() {
              const rows = Array.isArray(payload) ? payload : [payload];
              return Promise.resolve({
                data: rows.map((_, index) => ({
                  id: `id-${index}`,
                  chunk_id: `chunk-${index}`,
                })),
                error: null,
                count: rows.length,
              });
            },
          };
        },
        upsert(payload: unknown) {
          mockDbCalls.push({ table, operation: "upsert", payload });
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
  }),
}));

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: () => ({
    upload: (...args: unknown[]) => mockBlobUpload(...args),
  }),
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

describe("/api/admin/context-layer/csv-upload", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    mockDbCalls.length = 0;
    mockRecordIds.clear();
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
    const chunkInsert = mockDbCalls.find(
      (call) => call.table === "enterprise_context_chunks",
    );
    expect(chunkInsert?.payload).toEqual([
      expect.objectContaining({
        client_id: "client-apex",
        tenant_key: "apex-retail",
        source_record_id: "app-1",
        embedding_status: "pending",
        lifecycle_state: "review",
        classification_source: "NEEDS_CLASSIFICATION",
        domain_segment: null,
        load_batch_id: expect.stringMatching(/^csv:/),
        source_path: expect.stringContaining("azure-blob://context-uploads/"),
        provenance: expect.objectContaining({
          source_basis: "azure_blob_admin_upload",
          source_blob: expect.objectContaining({
            bucket: "context-uploads",
          }),
          upload_attestation: expect.objectContaining({
            version: PILOT_UPLOAD_ATTESTATION_VERSION,
            accepted: true,
            note: "CAB approval CAB-42",
          }),
        }),
      }),
    ]);
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
    const chunkInsert = mockDbCalls.find(
      (call) => call.table === "enterprise_context_chunks",
    );
    expect(chunkInsert?.payload).toEqual([
      expect.objectContaining({
        tenant_key: "meridian-health",
        source_doc: "hl7-fhir-integration-topology.json",
        source_record_id: "MR-INT-001",
        embedding_status: "pending",
        source_path: expect.stringContaining("azure-blob://context-uploads/"),
      }),
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
