/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import HomePage from "../page";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "@/lib/home/preview/ecl-projection-bundle";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { HomeReviewBundle } from "@/lib/home/preview/types";

jest.mock("next/server", () => ({
  connection: jest.fn(),
}));

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({
    children,
    topBarProps,
  }: {
    children: React.ReactNode;
    topBarProps: { tenantName?: string };
  }) => (
    <div data-testid="home-shell" data-tenant-name={topBarProps.tenantName}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/home/preview/HomePreviewAppRoot", () => ({
  HomePreviewAppRoot: ({
    bundle,
    recordSource,
    tenantKey,
  }: {
    bundle: HomeReviewBundle & { marker?: string };
    recordSource?: { kind: string };
    tenantKey: string;
  }) => (
    <div
      data-testid="home-root"
      data-bundle-marker={bundle.marker ?? ""}
      data-record-source={recordSource?.kind}
      data-tenant-key={tenantKey}
    />
  ),
}));

jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: jest.fn(),
}));

jest.mock("@/lib/home/preview/ecl-projection-bundle", () => ({
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource: jest.fn(),
}));

jest.mock("@/lib/home/preview/golden-snapshot", () => ({
  HOME_PREVIEW_TENANT_KEYS: ["meridian-health", "skyharbor-air"],
  isHomePreviewTenantKey: (value: string) =>
    value === "meridian-health" || value === "skyharbor-air",
  getHomeReviewBundle: jest.fn(),
}));

function bundle(marker: string) {
  return {
    marker,
    tenantKey: marker,
    provenance: {
      canonical_snapshot_hash: `${marker}:hash`,
      generated_at: "2026-09-15T00:00:00.000Z",
    },
    executiveStoryPlan: undefined,
    chapters: [],
    thesis: {
      signalPacket: {
        signals: [],
        contextItems: [],
        sourceSummaries: [],
      },
      publishedGeneration: {},
      verificationLedger: [],
      structuralIssues: [],
    },
  } as unknown as HomeReviewBundle & { marker: string };
}

const mockedResolveTenant = jest.mocked(resolveTenant);
const mockedGetEcl = jest.mocked(
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
);
const mockedGetSnapshot = jest.mocked(getHomeReviewBundle);

async function renderHome(searchParams: { tenant?: string; provider?: string }) {
  render(await HomePage({ searchParams: Promise.resolve(searchParams) }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetSnapshot.mockImplementation((tenantKey) =>
    bundle(`snapshot:${tenantKey}`),
  );
  mockedGetEcl.mockImplementation(async (tenantKey) => ({
    bundle: bundle(`ecl:${tenantKey}`),
    recordSource: {
      kind: "ecl_serving_projection",
      canonicalSnapshotHash: `ecl:${tenantKey}:hash`,
    },
  }));
});

it("uses the governed ECL projection on /home for every reviewed Home tenant", async () => {
  mockedResolveTenant.mockResolvedValue({
    appClientKey: "meridian",
    canonicalKey: "meridian-health",
    brokerKey: "meridian",
    clientId: null,
    displayName: "Meridian Health",
    industryCode: "healthcare",
    aliases: [],
    source: "session",
  });

  await renderHome({ tenant: "skyharbor-air" });

  expect(mockedGetEcl).toHaveBeenCalledWith("skyharbor-air");
  expect(screen.getByTestId("home-root")).toHaveAttribute(
    "data-bundle-marker",
    "ecl:skyharbor-air",
  );
  expect(screen.getByTestId("home-root")).toHaveAttribute(
    "data-record-source",
    "ecl_serving_projection",
  );
});

it("does not show an unsupported active tenant name over the default Home bundle", async () => {
  mockedResolveTenant.mockResolvedValue({
    appClientKey: "lakeshore",
    canonicalKey: "lakeshore-holdings",
    brokerKey: "lakeshore-holdings",
    clientId: null,
    displayName: "Lakeshore Holdings",
    industryCode: "industrial",
    aliases: [],
    source: "session",
  });

  await renderHome({});

  expect(mockedGetEcl).toHaveBeenCalledWith("meridian-health");
  expect(screen.getByTestId("home-root")).toHaveAttribute(
    "data-tenant-key",
    "meridian-health",
  );
  expect(screen.getByTestId("home-shell")).toHaveAttribute(
    "data-tenant-name",
    "Meridian Health",
  );
});

it("keeps the reviewed snapshot path available behind the legacy provider override", async () => {
  const original = process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE;
  process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE = "true";
  mockedResolveTenant.mockResolvedValue({
    appClientKey: "meridian",
    canonicalKey: "meridian-health",
    brokerKey: "meridian",
    clientId: null,
    displayName: "Meridian Health",
    industryCode: "healthcare",
    aliases: [],
    source: "session",
  });

  try {
    await renderHome({ provider: "legacy" });
  } finally {
    process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE = original;
  }

  expect(mockedGetEcl).not.toHaveBeenCalled();
  expect(screen.getByTestId("home-root")).toHaveAttribute(
    "data-bundle-marker",
    "snapshot:meridian-health",
  );
});
