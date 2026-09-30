import type { NextRequest } from "next/server";
import { homeRecordSourceToken } from "@/lib/home/preview/record-source-token";

const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getHomeEclProjectionBundleOrReviewedSnapshotWithSource = jest.fn();
const renderHomeWalkthroughHtml = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancy(...args),
  tenancyErrorResponse: (...args: unknown[]) => tenancyErrorResponse(...args),
}));

jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: jest.fn(async () => ({
    appClientKey: "meridian",
    displayName: "Meridian Health",
  })),
}));

jest.mock("@/lib/home/preview/ecl-projection-bundle", () => ({
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource: (
    ...args: unknown[]
  ) => getHomeEclProjectionBundleOrReviewedSnapshotWithSource(...args),
}));

jest.mock("@/lib/home/export/walkthrough-export", () => ({
  buildHomeWalkthroughPdf: jest.fn(),
  homeWalkthroughFilename: jest.fn(() => "home-walkthrough.html"),
  renderHomeWalkthroughHtml: (...args: unknown[]) =>
    renderHomeWalkthroughHtml(...args),
}));

jest.mock("@react-pdf/renderer", () => ({
  pdf: jest.fn(),
}));

function request(url: string): NextRequest {
  return { url } as NextRequest;
}

describe("/api/home/walkthrough-export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({
      clientId: "client_meridian",
      clientKey: "meridian",
      userId: "user_1",
    });
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource.mockResolvedValue({
      recordSource: {
        kind: "ecl_serving_projection",
        canonicalSnapshotHash: "ecl:test:serving.home_*:3311",
        contextVersion: {
          assessmentId: "test",
          projectionContentHash: "current-content",
          sourceSetHash: null,
          deterministicPacketHash: "current-packet",
          narrativePacketHash: null,
          narrativeGeneratedAt: null,
          dataAsOf: null,
          coherence: "unverified",
        },
      },
      bundle: {
        provenance: {
          canonical_snapshot_hash: "ecl:test:serving.home_*:3311",
        },
      },
    });
    renderHomeWalkthroughHtml.mockReturnValue("<html>walkthrough</html>");
  });

  it("authorizes canonical Home tenant aliases through the app client key", async () => {
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=meridian-health&provider=ecl&format=html",
      ),
    );

    expect(response.status).toBe(200);
    expect(requireTenancy).toHaveBeenCalledWith({
      requestedClientKey: "meridian",
    });
    expect(
      getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
    ).toHaveBeenCalledWith("meridian-health");
    expect(await response.text()).toBe("<html>walkthrough</html>");
  });

  it("exports only the record version that the reader opened", async () => {
    const { GET } = await import("../route");
    const token = homeRecordSourceToken("meridian-health", {
      kind: "ecl_serving_projection",
      canonicalSnapshotHash: "ecl:test:serving.home_*:3311",
      contextVersion: {
        assessmentId: "test",
        projectionContentHash: "current-content",
        sourceSetHash: null,
        deterministicPacketHash: "current-packet",
        narrativePacketHash: null,
        narrativeGeneratedAt: null,
        dataAsOf: null,
        coherence: "unverified",
      },
    });

    const response = await GET(
      request(
        `https://app.abarva.ai/api/home/walkthrough-export?tenant=meridian-health&format=html&context=${token}`,
      ),
    );

    expect(response.status).toBe(200);
    expect(renderHomeWalkthroughHtml).toHaveBeenCalledTimes(1);
  });

  it("refuses an export when the displayed record marker is stale", async () => {
    const { GET } = await import("../route");
    const token = homeRecordSourceToken("meridian-health", {
      kind: "ecl_serving_projection",
      canonicalSnapshotHash: "ecl:test:serving.home_*:3311",
      contextVersion: {
        assessmentId: "test",
        projectionContentHash: "prior-content",
        sourceSetHash: null,
        deterministicPacketHash: "current-packet",
        narrativePacketHash: null,
        narrativeGeneratedAt: null,
        dataAsOf: null,
        coherence: "unverified",
      },
    });

    const response = await GET(
      request(
        `https://app.abarva.ai/api/home/walkthrough-export?tenant=meridian-health&format=html&context=${token}`,
      ),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "home_context_changed" });
    expect(renderHomeWalkthroughHtml).not.toHaveBeenCalled();
  });
});
