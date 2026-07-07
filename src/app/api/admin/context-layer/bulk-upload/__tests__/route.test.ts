import { NextRequest } from "next/server";
import JSZip from "jszip";

import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";

import { POST } from "../route";

const mockRequireTenancy = jest.fn();
const mockEmitNotification = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () =>
    new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 }),
}));

jest.mock("@/lib/admin/broker/notification-broker", () => ({
  emitNotification: (...args: unknown[]) => mockEmitNotification(...args),
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

function bufferBlobPart(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

describe("/api/admin/context-layer/bulk-upload", () => {
  beforeEach(() => {
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-meridian",
      clientKey: "meridian-health",
      userId: "user-meridian",
    });
    mockEmitNotification.mockResolvedValue({
      eventId: "event-context-refreshed-1",
      enqueuedDeliveries: 1,
    });
  });

  afterEach(() => {
    mockRequireTenancy.mockReset();
    mockEmitNotification.mockReset();
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
      adminNotification: null,
      filesProcessed: 1,
      rowsParsed: 0,
      chunksQueued: 0,
      persistence: {
        status: "validation_only",
      },
      workflow: {
        summary:
          "Validation passed. Nothing was written to Azure Blob or tenant context.",
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
        },
      ],
    });
    expect(mockEmitNotification).not.toHaveBeenCalled();
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
      adminNotification: {
        ok: true,
        eventId: "event-context-refreshed-1",
        enqueuedDeliveries: 1,
      },
      filesProcessed: 1,
      rowsParsed: 0,
      chunksQueued: 0,
      persistence: {
        status: "staged_and_enqueued",
      },
      workflow: {
        summary:
          "Files are staged and queued. Azure private-worker processing is the next handoff.",
        steps: expect.arrayContaining([
          expect.objectContaining({ id: "private_worker", status: "active" }),
          expect.objectContaining({ id: "operator_review", status: "pending" }),
          expect.objectContaining({
            id: "tenant_context_commit",
            status: "pending",
          }),
        ]),
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
    expect(mockEmitNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "meridian-health",
        eventType: "intelligence.context_refreshed",
        actorUserId: "user-meridian",
        payload: expect.objectContaining({
          title: "Context load completed",
          loadName: "meridian-phase-0",
          mode: "stage_and_enqueue",
          filesProcessed: 1,
        }),
      }),
    );
  });

  it("accepts a ZIP package with manifest.json and stages files for private worker processing", async () => {
    const zip = new JSZip();
    zip.file(
      "manifest.json",
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
    zip.file(
      "enterprise-profile.yaml",
      [
        "enterprise_profile:",
        "  - metric: headquarters",
        "    value: Sacramento, California",
        "    period: FY2026",
        "    source: enterprise-profile",
      ].join("\n"),
    );
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    const formData = new FormData();
    formData.set("clientId", "client-meridian");
    formData.set("mode", "stage_and_enqueue");
    addUploadAttestation(formData);
    formData.append(
      "files",
      new File([bufferBlobPart(buffer)], "meridian-phase-0.zip", {
        type: "application/zip",
      }),
    );

    const response = await POST(bulkRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: "stage_and_enqueue",
      adminNotification: {
        ok: true,
        eventId: "event-context-refreshed-1",
      },
      filesProcessed: 1,
      persistence: {
        status: "staged_and_enqueued",
      },
      workflow: {
        steps: expect.arrayContaining([
          expect.objectContaining({ id: "private_worker", status: "active" }),
        ]),
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

  it("does not fail a successful load when notification fanout fails", async () => {
    mockEmitNotification.mockRejectedValueOnce(
      new Error("notification offline"),
    );
    const zip = new JSZip();
    zip.file(
      "manifest.json",
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
    zip.file(
      "enterprise-profile.yaml",
      [
        "enterprise_profile:",
        "  - metric: headquarters",
        "    value: Sacramento, California",
        "    period: FY2026",
        "    source: enterprise-profile",
      ].join("\n"),
    );
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    const formData = new FormData();
    formData.set("clientId", "client-meridian");
    formData.set("mode", "stage_and_enqueue");
    addUploadAttestation(formData);
    formData.append(
      "files",
      new File([bufferBlobPart(buffer)], "meridian-phase-0.zip", {
        type: "application/zip",
      }),
    );

    const response = await POST(bulkRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      adminNotification: {
        ok: false,
        error: "notification offline",
      },
      persistence: {
        status: "staged_and_enqueued",
      },
    });
  });

  it("matches nested ZIP files by full manifest path when basenames repeat", async () => {
    const zip = new JSZip();
    zip.file(
      "manifest.json",
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
    );
    zip.file("reports/context.yaml", "items:\n  - metric: report\n");
    zip.file("contracts/context.yaml", "items:\n  - metric: contract\n");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    const formData = new FormData();
    formData.set("clientId", "client-meridian");
    formData.set("mode", "validate_only");
    addUploadAttestation(formData);
    formData.append(
      "files",
      new File([bufferBlobPart(buffer)], "meridian-phase-0.zip", {
        type: "application/zip",
      }),
    );

    const response = await POST(bulkRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      ok: true,
      filesProcessed: 2,
      results: [
        { fileName: "reports/context.yaml" },
        { fileName: "contracts/context.yaml" },
      ],
    });
  });

  it("rejects ZIP packages with unsafe paths before processing files", async () => {
    const zip = new JSZip();
    zip.file(
      "manifest.json",
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
    zip.file("../enterprise-profile.yaml", "blocked");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    const formData = new FormData();
    formData.set("clientId", "client-meridian");
    formData.set("mode", "validate_only");
    addUploadAttestation(formData);
    formData.append(
      "files",
      new File([bufferBlobPart(buffer)], "meridian-phase-0.zip", {
        type: "application/zip",
      }),
    );

    const response = await POST(bulkRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: "bulk_upload_invalid",
      detail: expect.stringContaining("bulk_zip_unsafe_path"),
    });
  });
});
