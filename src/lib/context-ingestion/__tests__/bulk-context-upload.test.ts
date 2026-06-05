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
      results: [
        {
          fileName: "enterprise-profile.yaml",
          templateId: "enterprise-profile",
          blob: {
            bucket: "context-uploads",
            staged: false,
          },
        },
      ],
    });
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
        },
      ],
    });
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
        originalFileName: "enterprise-profile.yaml",
      },
    });
  });
});
