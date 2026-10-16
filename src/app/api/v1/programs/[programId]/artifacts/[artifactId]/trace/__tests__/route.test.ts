/**
 * The artifact trace route reads one move_artifacts row by id and then settles
 * tenancy on the row's tenant_key. Rows for one tenant are stored under more
 * than one spelling of its key, so that check must accept the per-tenant alias
 * set: a row under the canonical spelling is served to the app-key caller, and a
 * row from another tenant is still refused.
 */
const tenancy = {
  clientId: "client-1",
  clientKey: "meridian",
  userId: "viewer-1",
  email: "viewer@example.test",
  role: "maestro",
};
let artifactRow: Record<string, unknown> | null = null;

jest.mock("../../../../../_auth", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not a tenancy error");
  }),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(() => ({
    from: () => {
      const api: Record<string, unknown> = {};
      api.select = () => api;
      api.eq = () => api;
      api.maybeSingle = async () => ({ data: artifactRow, error: null });
      return api;
    },
  })),
}));

import { GET } from "../route";

function call() {
  return GET({} as never, {
    params: Promise.resolve({ programId: "move-1", artifactId: "artifact-1" }),
  });
}

const TRACE = { citations: 3, groundingStatus: "grounded" };

beforeEach(() => {
  artifactRow = null;
});

describe("GET /api/v1/programs/:programId/artifacts/:artifactId/trace — whose artifact this is", () => {
  it("serves the trace of a row stored under the canonical spelling of the caller's tenant", async () => {
    artifactRow = {
      artifact_type: "discovery_report",
      title: "Current Work Diagnostic",
      tenant_key: "meridian-health",
      metadata: { contextBundleTrace: TRACE },
    };

    const res = await call();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, trace: TRACE });
  });

  it("serves the trace of a row stored under the app spelling of the caller's tenant", async () => {
    artifactRow = {
      artifact_type: "discovery_report",
      title: "Current Work Diagnostic",
      tenant_key: "meridian",
      metadata: { contextBundleTrace: TRACE },
    };

    const res = await call();

    expect(res.status).toBe(200);
  });

  it("refuses a row that belongs to another tenant", async () => {
    artifactRow = {
      artifact_type: "discovery_report",
      title: "Someone else's diagnostic",
      tenant_key: "apex-retail",
      metadata: { contextBundleTrace: TRACE },
    };

    const res = await call();

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "forbidden" });
  });

  it("reports a missing artifact as not found", async () => {
    const res = await call();

    expect(res.status).toBe(404);
  });
});
