jest.mock("server-only", () => ({}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
  hasLockedTenantSession: jest.fn(),
}));
jest.mock("@/lib/tenant/resolveTenant", () => ({ resolveTenant: jest.fn() }));
jest.mock("@/lib/intelligence/home-context-handoff", () => ({
  resolveIntelligenceHomeHandoff: jest.fn(),
}));
jest.mock("@/lib/intelligence/canonical-landscape-sections", () => ({
  buildCanonicalLandscapeSections: jest.fn(async () => null),
}));
jest.mock("@/lib/intelligence/eclContextPackPreview", () => ({
  readIntelligenceEclContextPackPreview: jest.fn(),
}));
jest.mock("@/lib/home/enterprise-landscape-view-model", () => ({
  getEnterpriseLandscapeViewModel: jest.fn(() => ({
    clientKey: "meridian",
    sections: {},
  })),
}));
jest.mock("@/components/shell/AppShell", () => ({ AppShell: () => null }));
jest.mock("@/components/ecl/EclDemoFindingsPanel", () => ({
  EclDemoFindingsPanel: () => null,
}));
jest.mock("@/components/ecl/EclServingSurfaceCoverage", () => ({
  EclServingSurfaceCoverage: () => null,
}));
jest.mock(
  "@/components/intelligence-advisory/AdvisoryIntelligencePage",
  () => ({ AdvisoryIntelligencePage: () => null }),
);

import IntelligencePage from "@/app/(maestro)/intelligence/page";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { resolveIntelligenceHomeHandoff } from "../home-context-handoff";

beforeEach(() => {
  jest.clearAllMocks();
  (hasLockedTenantSession as jest.Mock).mockResolvedValue(false);
  (getActiveClientRow as jest.Mock).mockResolvedValue({
    key: "meridian",
    name: "Reference enterprise",
  });
  (resolveTenant as jest.Mock).mockResolvedValue({
    canonicalKey: "meridian-health",
    appClientKey: "meridian",
  });
  (resolveIntelligenceHomeHandoff as jest.Mock).mockResolvedValue({
    state: { status: "ready" },
  });
});

it("lets the existing tenant resolver authorize an explicit Home continuation for an admin", async () => {
  await IntelligencePage({
    searchParams: Promise.resolve({
      client: "meridian-health",
      homeContext: "a".repeat(64),
      homeChapter: "technology_data",
    }),
  });
  expect(resolveTenant).toHaveBeenCalledWith({
    requestedClient: "meridian-health",
  });
  expect(getActiveClientRow).toHaveBeenCalledWith("meridian-health");
  expect(resolveIntelligenceHomeHandoff).toHaveBeenCalledWith(
    {
      tenantKey: "meridian-health",
      recordToken: "a".repeat(64),
      chapterId: "technology_data",
    },
    "meridian-health",
  );
});

it("uses the resolved tenant rather than the URL as the authorization identity", async () => {
  (getActiveClientRow as jest.Mock).mockResolvedValueOnce({
    key: "apexretail",
    name: "Other reference enterprise",
  });
  (resolveTenant as jest.Mock).mockResolvedValueOnce({
    canonicalKey: "apex-retail",
    appClientKey: "apexretail",
  });
  await IntelligencePage({
    searchParams: Promise.resolve({
      client: "meridian-health",
      homeContext: "a".repeat(64),
    }),
  });
  expect(resolveIntelligenceHomeHandoff).toHaveBeenCalledWith(
    { tenantKey: "meridian-health", recordToken: "a".repeat(64) },
    "apex-retail",
  );
});

it("does not widen standalone Intelligence navigation", async () => {
  await IntelligencePage({
    searchParams: Promise.resolve({ client: "meridian-health" }),
  });
  expect(resolveTenant).toHaveBeenCalledWith({ requestedClient: null });
  expect(resolveIntelligenceHomeHandoff).not.toHaveBeenCalled();
});
