import {
  parseBulkContextUploadManifest,
  runBulkContextUpload,
} from "../bulk-context-upload";
import { PILOT_UPLOAD_ATTESTATION_VERSION } from "../upload-attestation";

jest.mock("@/lib/data-plane/objectStorage", () => ({
  describeObjectStorageLocation: jest.fn(() => ({
    accountName: "stcontextpilot001",
    containerName: "context-drops",
    blobPath:
      "context-uploads/meridian-health/meridian-phase-0/abc123/enterprise-profile.yaml",
  })),
  getObjectStorageAdapter: jest.fn(() => ({
    upload: jest.fn(),
    remove: jest.fn(),
    download: jest.fn(),
    createSignedUrl: jest.fn(),
  })),
}));

describe("bulk context upload", () => {
  it("parses a Meridian manifest and validates template ids", () => {
    const manifest = parseBulkContextUploadManifest(
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "enterprise-profile.yaml",
            templateId: "enterprise-profile",
          },
          {
            path: "hl7-fhir-integration-topology.json",
            templateId: "hl7-fhir-integration-topology",
          },
        ],
      }),
      "meridian-health",
    );

    expect(manifest).toMatchObject({
      loadName: "meridian-phase-0",
      files: [
        {
          path: "enterprise-profile.yaml",
          templateId: "enterprise-profile",
          dataClassification: "confidential_business",
        },
        {
          path: "hl7-fhir-integration-topology.json",
          templateId: "hl7-fhir-integration-topology",
          dataClassification: "confidential_business",
        },
      ],
    });
  });

  it("rejects manifest files without matching uploaded files", async () => {
    const manifest = parseBulkContextUploadManifest(
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "enterprise-profile.yaml",
            templateId: "enterprise-profile",
          },
        ],
      }),
      "meridian-health",
    );

    await expect(
      runBulkContextUpload({
        clientId: "client-meridian",
        tenantKey: "meridian-health",
        uploadedBy: "user-meridian",
        manifest,
        files: [],
        mode: "validate_only",
        attestation: {
          version: PILOT_UPLOAD_ATTESTATION_VERSION,
          accepted: true,
          acceptedAt: "2026-06-05T22:00:00.000Z",
          authorityConfirmed: true,
          dataUseConfirmed: true,
          sensitiveDataConfirmed: true,
          note: null,
        },
      }),
    ).rejects.toThrow("bulk_upload_missing_files:enterprise-profile.yaml");
  });

  it("validates matching files without staging Blob or writing context", async () => {
    const manifest = parseBulkContextUploadManifest(
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "enterprise-profile.yaml",
            templateId: "enterprise-profile",
          },
        ],
      }),
      "meridian-health",
    );

    const result = await runBulkContextUpload({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-meridian",
      manifest,
      files: [
        {
          name: "enterprise-profile.yaml",
          type: "application/x-yaml",
          bytes: new TextEncoder().encode(
            [
              "enterprise_profile:",
              "  - metric: headquarters",
              "    value: Sacramento, California",
              "    period: FY2026",
              "    source: enterprise-profile",
            ].join("\n"),
          ).buffer,
        },
      ],
      mode: "validate_only",
      attestation: {
        version: PILOT_UPLOAD_ATTESTATION_VERSION,
        accepted: true,
        acceptedAt: "2026-06-05T22:00:00.000Z",
        authorityConfirmed: true,
        dataUseConfirmed: true,
        sensitiveDataConfirmed: true,
        note: "CAB-99",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      mode: "validate_only",
      filesProcessed: 1,
      rowsParsed: 0,
      chunksQueued: 0,
      persistence: {
        status: "validation_only",
      },
      workflow: {
        summary:
          "Validation passed. Nothing was written to Azure Blob or tenant context.",
        status: {
          persisted: false,
          pollable: false,
        },
        steps: [
          { id: "package_received", status: "complete" },
          { id: "attestation_verified", status: "complete" },
          { id: "sensitive_data_scan", status: "complete" },
          { id: "blob_staging", status: "skipped" },
          { id: "tenant_context_commit", status: "skipped" },
        ],
      },
      results: [
        {
          fileName: "enterprise-profile.yaml",
          templateId: "enterprise-profile",
          blob: {
            bucket: "context-uploads",
            staged: false,
          },
          processing: {
            status: "validated_only",
          },
        },
      ],
    });
    expect(result.workflow.jobId).toMatch(/^bulk-[a-f0-9]{16}$/);
  });

  it("stages matching files and queues canonical Azure worker messages", async () => {
    const manifest = parseBulkContextUploadManifest(
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "enterprise-profile.yaml",
            templateId: "enterprise-profile",
          },
        ],
      }),
      "meridian-health",
    );
    const queued: unknown[] = [];

    const result = await runBulkContextUpload({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-meridian",
      manifest,
      files: [
        {
          name: "enterprise-profile.yaml",
          type: "application/x-yaml",
          bytes: new TextEncoder().encode(
            [
              "enterprise_profile:",
              "  - metric: headquarters",
              "    value: Sacramento, California",
              "    period: FY2026",
              "    source: enterprise-profile",
            ].join("\n"),
          ).buffer,
        },
      ],
      mode: "stage_and_enqueue",
      uploadedAt: "2026-06-05T22:00:00.000Z",
      enqueueMessageFn: async (message) => {
        queued.push(message);
        return {
          queueName: "q-context-ingestion-events",
          messageId: "msg-1",
        };
      },
      attestation: {
        version: PILOT_UPLOAD_ATTESTATION_VERSION,
        accepted: true,
        acceptedAt: "2026-06-05T22:00:00.000Z",
        authorityConfirmed: true,
        dataUseConfirmed: true,
        sensitiveDataConfirmed: true,
        note: "CAB-99",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      mode: "stage_and_enqueue",
      rowsParsed: 0,
      chunksQueued: 0,
      persistence: {
        status: "staged_and_enqueued",
      },
      workflow: {
        summary:
          "Files are staged and queued. Azure private-worker processing is the next handoff.",
        status: {
          persisted: true,
          bucket: "context-uploads",
          pollable: true,
        },
        steps: [
          { id: "package_received", status: "complete" },
          { id: "attestation_verified", status: "complete" },
          { id: "sensitive_data_scan", status: "complete" },
          { id: "blob_staging", status: "complete" },
          { id: "worker_queue", status: "complete" },
          { id: "private_worker", status: "active" },
          { id: "operator_review", status: "pending" },
          { id: "tenant_context_commit", status: "pending" },
        ],
      },
      results: [
        {
          fileName: "enterprise-profile.yaml",
          templateId: "enterprise-profile",
          blob: {
            bucket: "context-uploads",
            staged: true,
          },
          queue: {
            queueName: "q-context-ingestion-events",
            messageId: "msg-1",
          },
          loadResult: null,
          processing: {
            status: "staged_for_worker",
          },
        },
      ],
    });
    expect(result.workflow.jobId).toMatch(/^bulk-[a-f0-9]{16}$/);
    expect(result.workflow.status.path).toBe(
      `${result.workflow.jobId}.json`.replace(/^/, "meridian-health/_jobs/"),
    );
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({
      schema: "abarva.ingestion.v1",
      tenantClientKey: "meridian-health",
      segmentKey: "enterprise_profile",
      storage: {
        accountName: "stcontextpilot001",
        containerName: "context-drops",
        blobPath:
          "context-uploads/meridian-health/meridian-phase-0/abc123/enterprise-profile.yaml",
        contentType: "application/x-yaml",
      },
      declaredClassification: "confidential_business",
      metadata: {
        source: "admin_bulk_context_upload",
        sourceSystem: "admin_bulk_context_upload",
        clientId: "client-meridian",
        initiatedByUserId: "user-meridian",
        uploadedBy: "user-meridian",
        attestationVersion: PILOT_UPLOAD_ATTESTATION_VERSION,
        loadName: "meridian-phase-0",
        templateId: "enterprise-profile",
        templateVersion: "unversioned",
        mappingProfileKey: "enterprise-profile",
        mappingProfileVersion: "unversioned",
        bulkJobId: result.workflow.jobId,
        bulkJobStatusPath: `meridian-health/_jobs/${result.workflow.jobId}.json`,
        originalFileName: "enterprise-profile.yaml",
        manifestPath: "enterprise-profile.yaml",
      },
    });
  });

  it("matches duplicate basenames by full manifest path when ZIP entries preserve folders", async () => {
    const manifest = parseBulkContextUploadManifest(
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "reports/context.yaml",
            templateId: "enterprise-profile",
          },
          {
            path: "contracts/context.yaml",
            templateId: "enterprise-profile",
          },
        ],
      }),
      "meridian-health",
    );

    const result = await runBulkContextUpload({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-meridian",
      manifest,
      files: [
        {
          name: "reports/context.yaml",
          type: "application/x-yaml",
          bytes: new TextEncoder().encode("items:\n  - metric: report\n")
            .buffer,
        },
        {
          name: "contracts/context.yaml",
          type: "application/x-yaml",
          bytes: new TextEncoder().encode("items:\n  - metric: contract\n")
            .buffer,
        },
      ],
      mode: "validate_only",
      attestation: {
        version: PILOT_UPLOAD_ATTESTATION_VERSION,
        accepted: true,
        acceptedAt: "2026-06-05T22:00:00.000Z",
        authorityConfirmed: true,
        dataUseConfirmed: true,
        sensitiveDataConfirmed: true,
        note: "CAB-99",
      },
    });

    expect(result.filesProcessed).toBe(2);
    expect(result.results.map((item) => item.fileName)).toEqual([
      "reports/context.yaml",
      "contracts/context.yaml",
    ]);
  });

  it("stages document files for Azure worker processing without local row parsing", async () => {
    const manifest = parseBulkContextUploadManifest(
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "fy26-financial-report.pdf",
            templateId: "annual-quarterly-reports",
          },
        ],
      }),
      "meridian-health",
    );
    const queued: unknown[] = [];

    const result = await runBulkContextUpload({
      clientId: "client-meridian",
      tenantKey: "meridian-health",
      uploadedBy: "user-meridian",
      manifest,
      files: [
        {
          name: "fy26-financial-report.pdf",
          type: "application/pdf",
          bytes: new TextEncoder().encode("%PDF-1.7 placeholder").buffer,
        },
      ],
      mode: "stage_and_enqueue",
      uploadedAt: "2026-06-05T22:00:00.000Z",
      enqueueMessageFn: async (message) => {
        queued.push(message);
        return {
          queueName: "q-context-ingestion-events",
          messageId: "msg-pdf-1",
        };
      },
      attestation: {
        version: PILOT_UPLOAD_ATTESTATION_VERSION,
        accepted: true,
        acceptedAt: "2026-06-05T22:00:00.000Z",
        authorityConfirmed: true,
        dataUseConfirmed: true,
        sensitiveDataConfirmed: true,
        note: "CAB-99",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      mode: "stage_and_enqueue",
      rowsParsed: 0,
      chunksQueued: 0,
      workflow: {
        status: {
          persisted: true,
          pollable: true,
        },
      },
      results: [
        {
          fileName: "fy26-financial-report.pdf",
          templateId: "annual-quarterly-reports",
          queue: {
            queueName: "q-context-ingestion-events",
            messageId: "msg-pdf-1",
          },
          loadResult: null,
          processing: {
            label: "Staged and queued",
            nextAction:
              "Wait for Azure private-worker extraction, then review mapped records.",
          },
        },
      ],
    });
    expect(queued[0]).toMatchObject({
      segmentKey: "enterprise_profile",
      storage: {
        contentType: "application/pdf",
      },
      metadata: {
        templateId: "annual-quarterly-reports",
        originalFileName: "fy26-financial-report.pdf",
        bulkJobId: result.workflow.jobId,
        manifestPath: "fy26-financial-report.pdf",
      },
    });
  });

  it("blocks document files from stage-and-process so unparsed PDFs do not become grounding rows", async () => {
    const manifest = parseBulkContextUploadManifest(
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "fy26-financial-report.pdf",
            templateId: "annual-quarterly-reports",
          },
        ],
      }),
      "meridian-health",
    );

    await expect(
      runBulkContextUpload({
        clientId: "client-meridian",
        tenantKey: "meridian-health",
        uploadedBy: "user-meridian",
        manifest,
        files: [
          {
            name: "fy26-financial-report.pdf",
            type: "application/pdf",
            bytes: new TextEncoder().encode("%PDF-1.7 placeholder").buffer,
          },
        ],
        mode: "stage_and_process",
        attestation: {
          version: PILOT_UPLOAD_ATTESTATION_VERSION,
          accepted: true,
          acceptedAt: "2026-06-05T22:00:00.000Z",
          authorityConfirmed: true,
          dataUseConfirmed: true,
          sensitiveDataConfirmed: true,
          note: "CAB-99",
        },
      }),
    ).rejects.toThrow(
      "bulk_upload_process_requires_structured_file:fy26-financial-report.pdf",
    );
  });
});
