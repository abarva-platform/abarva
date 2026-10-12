jest.mock("server-only", () => ({}));
jest.mock("@/lib/auth/platform-admin-session", () => ({
  isPlatformAdminSession: jest.fn(),
}));
jest.mock("@/lib/auth/foundation-preview-session", () => ({
  isFoundationPreviewOperatorSession: jest.fn(),
}));
jest.mock("@/lib/home/preview/resolve-home-record", () => ({
  resolveHomeRecord: jest.fn(),
}));

import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { isFoundationPreviewOperatorSession } from "@/lib/auth/foundation-preview-session";
import { resolveHomeRecord } from "@/lib/home/preview/resolve-home-record";
import {
  getHomeReviewBundle,
  HOME_PREVIEW_TENANT_KEYS,
} from "@/lib/home/preview/golden-snapshot";
import { resolveIntelligenceHomeHandoff } from "../home-context-handoff";
import {
  buildHomeRecordSources,
  homeRecordTenantMatches,
} from "../ask/home-record-context";
import { prepareExecutiveContext } from "../ask/executive-context";

const tenantKey = HOME_PREVIEW_TENANT_KEYS[0];
const request = {
  tenantKey,
  recordToken: "a".repeat(64),
  chapterId: "technology_data" as const,
};
const bundle = getHomeReviewBundle(tenantKey)!;
const recordSource = {
  kind: "reviewed_snapshot" as const,
  canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
};

beforeEach(() => {
  jest.clearAllMocks();
  (isPlatformAdminSession as jest.Mock).mockResolvedValue(true);
  (isFoundationPreviewOperatorSession as jest.Mock).mockResolvedValue(false);
  (resolveHomeRecord as jest.Mock).mockResolvedValue({
    bundle,
    recordSource,
    recordToken: request.recordToken,
  });
});

describe("server-resolved Home evidence for Intelligence", () => {
  it("keeps source state, all chapter evidence and exact record row counts", async () => {
    const result = await resolveIntelligenceHomeHandoff(request, tenantKey);
    expect(result.state.status).toBe("ready");
    expect(result.state.sourceLabel).toBe("Reviewed stored record");
    expect(
      result.context!.sources.some((source) =>
        source.name.includes("Performance"),
      ),
    ).toBe(true);
    expect(result.context!.sources[0].structured!.tables[0].rows).toEqual(
      bundle.technologyEstate!.recordTypes.map((family) => ({
        family: family.label,
        count: family.rows.length,
      })),
    );
    expect(
      result.context!.sources.every((source) =>
        source.id?.startsWith(`home:${request.recordToken}:`),
      ),
    ).toBe(true);
  });
  it("rejects a different tenant before any record read", async () => {
    const result = await resolveIntelligenceHomeHandoff(
      request,
      "another-enterprise",
    );
    expect(result.state.status).toBe("not_authorized");
    expect(result.context).toBeUndefined();
    expect(resolveHomeRecord).not.toHaveBeenCalled();
  });
  it("does not treat the equality marker as an access credential", async () => {
    (isPlatformAdminSession as jest.Mock).mockResolvedValue(false);
    const result = await resolveIntelligenceHomeHandoff(request, tenantKey);
    expect(result.state.status).toBe("not_authorized");
    expect(resolveHomeRecord).not.toHaveBeenCalled();
  });
  it("refuses a changed record rather than silently answering from a new version", async () => {
    (resolveHomeRecord as jest.Mock).mockResolvedValue({
      bundle,
      recordSource,
      recordToken: "b".repeat(64),
    });
    const result = await resolveIntelligenceHomeHandoff(request, tenantKey);
    expect(result.state.status).toBe("changed");
    expect(result.context).toBeUndefined();
  });
  it("reports a missing bundle without source invention", async () => {
    (resolveHomeRecord as jest.Mock).mockResolvedValue(null);
    const result = await resolveIntelligenceHomeHandoff(request, tenantKey);
    expect(result.state.status).toBe("unavailable");
    expect(result.context).toBeUndefined();
  });
  it("does not upgrade Home publication to agent-ready evidence", () => {
    const sources = buildHomeRecordSources(
      bundle,
      recordSource,
      request.recordToken,
    );
    const result = prepareExecutiveContext(sources, tenantKey, "test-tenant");
    expect(result.bundle.agentReadyCount).toBe(0);
    expect(result.decisionGuard).toContain("provisional");
    expect(result.sources.length).toBeGreaterThan(0);
    expect(
      homeRecordTenantMatches(
        { tenantKey, recordToken: request.recordToken, sources },
        "another-enterprise",
      ),
    ).toBe(false);
    expect(prepareExecutiveContext(sources, tenantKey, null).sources).toEqual(
      [],
    );
  });
});
