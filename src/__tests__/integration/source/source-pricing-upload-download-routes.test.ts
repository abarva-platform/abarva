/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";

jest.mock("server-only", () => ({}), { virtual: true });

const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn((error?: unknown) => {
  void error;
  return Response.json({ error: "unauthenticated" }, { status: 401 });
});
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (error: unknown) => tenancyErrorResponseMock(error),
}));

const getActiveClientRowMock = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));

const getCurrentUserMock = jest.fn();
jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

jest.mock("@/lib/auth/canonical-auth-roster", () => ({
  CANONICAL_CLIENT_ADMIN_EMAILS: ["admin@abarva.ai"],
}));

const loadUserSourceAccessPolicyMock = jest.fn();
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) =>
    loadUserSourceAccessPolicyMock(...args),
}));

const buildSourceGenerationContextMock = jest.fn();
jest.mock("@/lib/source/agent-generation/server", () => ({
  buildSourceGenerationContext: (...args: unknown[]) =>
    buildSourceGenerationContextMock(...args),
}));

const parseVendorPricingSubmissionMock = jest.fn();
jest.mock("@/lib/source/pricing-submissions/parser", () => ({
  parseVendorPricingSubmission: (...args: unknown[]) =>
    parseVendorPricingSubmissionMock(...args),
}));

const insertSubmissionMock = jest.fn();
const listActiveSubmissionsForEventMock = jest.fn();
jest.mock("@/lib/source/pricing-submissions/dao", () => ({
  insertSubmission: (...args: unknown[]) => insertSubmissionMock(...args),
  listActiveSubmissionsForEvent: (...args: unknown[]) =>
    listActiveSubmissionsForEventMock(...args),
}));

const buildSourceDeliverableSpecMock = jest.fn();
jest.mock("@/lib/source/exports/spec-builder", () => ({
  buildSourceDeliverableSpec: (...args: unknown[]) =>
    buildSourceDeliverableSpecMock(...args),
  kindForArtifactCode: (artifactCode: string, variant?: string) => {
    if (artifactCode !== "d19_pricing_workbook") return null;
    return variant === "comparison" ? "pricing-comparison" : "pricing-template";
  },
}));

const renderSourceDeliverableMock = jest.fn();
jest.mock("@/lib/source/exports/dispatch", () => ({
  renderSourceDeliverable: (...args: unknown[]) =>
    renderSourceDeliverableMock(...args),
}));

import { POST as postVendorSubmission } from "@/app/api/v1/source/[eventId]/artifacts/[artifactCode]/vendor-submission/route";
import { GET as getVendorSubmissions } from "@/app/api/v1/source/[eventId]/artifacts/[artifactCode]/vendor-submissions/route";
import { GET as renderArtifact } from "@/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route";
import { buildPricingComparisonPayloadFromContext } from "@/lib/source/exports/payloads/pricing-comparison-payload";

const EVENT_ID = "apex-retail-ams-outsourcing-2026";
const EVENT_ROW_ID = "event-row-1";

const TENANCY = {
  userId: "user-1",
  clientId: "client-apex",
  role: "admin",
};

const ACTIVE_CLIENT = {
  id: "client-apex",
  key: "apexretail",
  name: "Apex Retail Group",
};

const CURRENT_USER = {
  email: "maestro@apex.example.com",
  clerkUserId: "clerk-user-1",
};

const SOURCE_CONTEXT = {
  tenantKey: "apexretail",
  tenantName: "Apex Retail Group",
  event: {
    id: EVENT_ROW_ID,
    code: "SRC-004",
    name: "AMS Outsourcing 2026",
    owner: "CIO Office",
    archetype: "managed_service",
    estimatedValueUsd: 32_000_000,
  },
  artifactStates: [
    {
      artifactCode: "d05_scope_memo",
      title: "Scope Memo",
      body: [
        "# Scope Memo",
        "## In scope",
        "**Application operations**",
        "- SAP ECC / Sterling OMS / NCR POS AMS support",
        "- 24x7 tier-1 incident response",
        "## Out of scope",
        "- Net-new ERP implementation",
      ].join("\n"),
    },
    {
      artifactCode: "d21_assumption_set",
      title: "Pricing Assumption Set",
      body: [
        "# Pricing Assumption Set",
        "**Term horizon:** 3 years (firm) · Matches the board case.",
        "**Annual escalator:** 3.5% · Applied after year one.",
        "**Currency:** USD · All pricing must be USD.",
      ].join("\n"),
    },
  ],
};

const PARSED_INSERT = {
  sourceEventId: EVENT_ROW_ID,
  tenantKey: "apexretail",
  vendorName: "Northstar Managed Services",
  uploadedByUserId: "clerk-user-1",
  uploadedFilename: "northstar-pricing.xlsx",
  unitPricesById: { "L-CMP-01": 380 },
  vendorNotesById: { "L-CMP-01": "Includes transition support." },
  pricingNotes: "Standard three-year term.",
  assumptionDeviations: [],
  parseStatus: "parsed",
  parseWarnings: [],
};

const STORED_ROW = {
  id: "submission-1",
  sourceEventId: EVENT_ROW_ID,
  tenantKey: "apexretail",
  vendorName: "Northstar Managed Services",
  submittedAt: "2026-06-05T05:55:00.000Z",
  uploadedByUserId: "clerk-user-1",
  uploadedFilename: "northstar-pricing.xlsx",
  unitPricesById: { "L-CMP-01": 380 },
  vendorNotesById: { "L-CMP-01": "Includes transition support." },
  pricingNotes: "Standard three-year term.",
  assumptionDeviations: [],
  parseStatus: "parsed",
  parseWarnings: [],
  supersededBy: null,
  createdAt: "2026-06-05T05:55:00.000Z",
  updatedAt: "2026-06-05T05:55:00.000Z",
};

function routeCtx(artifactCode = "d19_pricing_workbook") {
  return {
    params: Promise.resolve({
      eventId: EVENT_ID,
      artifactCode,
    }),
  };
}

function nextRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest;
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue(TENANCY);
  getActiveClientRowMock.mockResolvedValue(ACTIVE_CLIENT);
  getCurrentUserMock.mockResolvedValue(CURRENT_USER);
  loadUserSourceAccessPolicyMock.mockResolvedValue({
    canUploadSourceArtifacts: true,
    canGenerateSourcingArtifacts: false,
  });
  buildSourceGenerationContextMock.mockResolvedValue(SOURCE_CONTEXT);
  parseVendorPricingSubmissionMock.mockResolvedValue({
    insert: PARSED_INSERT,
    status: "parsed",
    warnings: [],
  });
  insertSubmissionMock.mockResolvedValue({
    ok: true,
    row: STORED_ROW,
    supersededCount: 0,
  });
  listActiveSubmissionsForEventMock.mockResolvedValue([STORED_ROW]);
  buildSourceDeliverableSpecMock.mockResolvedValue({
    kind: "pricing-comparison",
    tenantKey: "Apex Retail Group",
    sourceEventId: EVENT_ROW_ID,
    title: "AMS Outsourcing 2026",
    generatedAt: "2026-06-05T05:55:00.000Z",
    payload: {},
  });
  renderSourceDeliverableMock.mockResolvedValue({
    format: "xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "pricing-comparison.xlsx",
    buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]),
  });
});

describe("Source d19 pricing upload/list/download route binding", () => {
  it("uploads a filled vendor pricing workbook and persists parsed metadata", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([Buffer.from("xlsx-bytes")], "northstar-pricing.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    formData.append("vendorName", "Northstar Managed Services");

    const response = await postVendorSubmission(
      nextRequest(
        `https://app.abarva.ai/api/v1/source/${EVENT_ID}/artifacts/d19_pricing_workbook/vendor-submission`,
        { method: "POST", body: formData },
      ),
      routeCtx(),
    );
    const body = await json<{
      id: string;
      vendorName: string;
      parseStatus: string;
      unitPriceCount: number;
      supersededCount: number;
    }>(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: "submission-1",
      vendorName: "Northstar Managed Services",
      parseStatus: "parsed",
      unitPriceCount: 1,
      supersededCount: 0,
    });
    expect(parseVendorPricingSubmissionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "northstar-pricing.xlsx",
        sourceEventId: EVENT_ROW_ID,
        tenantKey: "apexretail",
        vendorNameOverride: "Northstar Managed Services",
        uploadedByUserId: "clerk-user-1",
      }),
    );
    expect(insertSubmissionMock).toHaveBeenCalledWith(PARSED_INSERT);
  });

  it("lists active parsed vendor submissions for the event", async () => {
    const response = await getVendorSubmissions(
      nextRequest(
        `https://app.abarva.ai/api/v1/source/${EVENT_ID}/artifacts/d19_pricing_workbook/vendor-submissions`,
      ),
      routeCtx(),
    );
    const body = await json<{ submissions: Array<Record<string, unknown>> }>(
      response,
    );

    expect(response.status).toBe(200);
    expect(listActiveSubmissionsForEventMock).toHaveBeenCalledWith(EVENT_ROW_ID);
    expect(body.submissions).toEqual([
      expect.objectContaining({
        id: "submission-1",
        vendorName: "Northstar Managed Services",
        parseStatus: "parsed",
        unitPriceCount: 1,
        deviationCount: 0,
        uploadedFilename: "northstar-pricing.xlsx",
      }),
    ]);
  });

  it("downloads the comparison workbook through the unified render route", async () => {
    const response = await renderArtifact(
      nextRequest(
        `https://app.abarva.ai/api/v1/source/${EVENT_ID}/artifacts/d19_pricing_workbook/render?format=xlsx&variant=comparison`,
      ),
      routeCtx(),
    );
    const bytes = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(response.headers.get("content-type")).toContain(
      "spreadsheetml.sheet",
    );
    expect(response.headers.get("content-disposition")).toContain(
      "pricing-comparison.xlsx",
    );
    expect(response.headers.get("x-source-artifact-code")).toBe(
      "d19_pricing_workbook",
    );
    expect(response.headers.get("x-source-artifact-format")).toBe("xlsx");
    expect(response.headers.get("x-source-artifact-variant")).toBe(
      "comparison",
    );
    expect(buildSourceDeliverableSpecMock).toHaveBeenCalledWith(
      SOURCE_CONTEXT,
      "pricing-comparison",
      expect.any(String),
    );
    expect(renderSourceDeliverableMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "pricing-comparison" }),
      "xlsx",
    );
  });

  it("binds comparison payloads to real vendor submissions, not synthetic rows", async () => {
    const payload = await buildPricingComparisonPayloadFromContext(
      SOURCE_CONTEXT as never,
      "2026-06-05T05:55:00.000Z",
    );

    expect(listActiveSubmissionsForEventMock).toHaveBeenCalledWith(EVENT_ROW_ID);
    expect(payload.demoMode).toBe(false);
    expect(payload.submissions).toEqual([
      expect.objectContaining({
        vendorName: "Northstar Managed Services",
        unitPricesById: { "L-CMP-01": 380 },
        pricingNotes: "Standard three-year term.",
      }),
    ]);
  });

  it("does not expose vendor-submission upload on non-d19 artifacts", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([Buffer.from("xlsx-bytes")], "response.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    const response = await postVendorSubmission(
      nextRequest(
        `https://app.abarva.ai/api/v1/source/${EVENT_ID}/artifacts/d13_vendor_responses/vendor-submission`,
        { method: "POST", body: formData },
      ),
      routeCtx("d13_vendor_responses"),
    );
    const body = await json<{ error: string; detail: string }>(response);

    expect(response.status).toBe(404);
    expect(body.error).toBe("unsupported_artifact");
    expect(body.detail).toContain("d13_vendor_responses");
    expect(parseVendorPricingSubmissionMock).not.toHaveBeenCalled();
  });
});
