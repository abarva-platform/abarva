import { NextRequest } from "next/server";

import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";

import { POST } from "../route";

const mockRequireTenancy = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () =>
    new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }),
}));

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

jest.mock("@/lib/ingestion/service-bus-producer", () => ({
  enqueueAzureLandingZoneMessage: jest.fn(async () => ({
    queueName: "q-context-ingestion-events",
    messageId: "msg-route-1",
  })),
}));

function bulkRequest(formData: FormData) {
  return new NextRequest(
    "http://localhost/api/admin/context-layer/bulk-upload",
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

describe("/api/admin/context-layer/bulk-upload", () => {
  beforeEach(() => {
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-meridian",
      clientKey: "meridian-health",
      userId: "user-meridian",
    });
  });

  afterEach(() => {
    mockRequireTenancy.mockReset();
  });

  it("rejects cross-tenant bulk uploads before manifest processing", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-other");
    formData.set("manifestJson", JSON.stringify({ loadName: "x", files: [] }));
    addUploadAttestation(formData);

    const response = await POST(bulkRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "forbidden_cross_tenant" });
  });

  it("validates manifest and files without staging Blob when validate-only", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-meridian");
    formData.set("mode", "validate_only");
    formData.set(
      "manifestJson",
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "enterprise-profile.yaml",
            templateId: "enterprise-profile",
          },
        ],
      }),
    );
    addUploadAttestation(formData);
    formData.append(
      "files",
      new File(
        [
          [
            "enterprise_profile:",
            "  - metric: headquarters",
            "    value: Sacramento, California",
            "    period: FY2026",
            "    source: enterprise-profile",
          ].join("\n"),
        ],
        "enterprise-profile.yaml",
        { type: "application/x-yaml" },
      ),
    );

    const response = await POST(bulkRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
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

  it("stages and queues files for private worker processing", async () => {
    const formData = new FormData();
    formData.set("clientId", "client-meridian");
    formData.set("mode", "stage_and_enqueue");
    formData.set(
      "manifestJson",
      JSON.stringify({
        loadName: "meridian-phase-0",
        files: [
          {
            path: "enterprise-profile.yaml",
            templateId: "enterprise-profile",
          },
        ],
      }),
    );
    addUploadAttestation(formData);
    formData.append(
      "files",
      new File(
        [
          [
            "enterprise_profile:",
            "  - metric: headquarters",
            "    value: Sacramento, California",
            "    period: FY2026",
            "    source: enterprise-profile",
          ].join("\n"),
        ],
        "enterprise-profile.yaml",
        { type: "application/x-yaml" },
      ),
    );

    const response = await POST(bulkRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: "stage_and_enqueue",
      filesProcessed: 1,
      rowsParsed: 0,
      chunksQueued: 0,
      persistence: {
        status: "staged_and_enqueued",
      },
      results: [
        {
          fileName: "enterprise-profile.yaml",
          templateId: "enterprise-profile",
          queue: {
            queueName: "q-context-ingestion-events",
            messageId: "msg-route-1",
          },
        },
      ],
    });
  });
});
