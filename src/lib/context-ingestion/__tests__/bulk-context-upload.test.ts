import {
  parseBulkContextUploadManifest,
  runBulkContextUpload,
} from "../bulk-context-upload";
import { PILOT_UPLOAD_ATTESTATION_VERSION } from "../upload-attestation";

jest.mock("@/lib/data-plane/objectStorage", () => ({
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
});
