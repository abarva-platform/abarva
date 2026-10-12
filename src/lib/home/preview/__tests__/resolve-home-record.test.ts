jest.mock("server-only", () => ({}));
jest.mock("@/lib/ecl/product-provider", () => ({
  resolveEclProductProvider: jest.fn(),
  isEclProductProvider: jest.fn(),
}));
jest.mock("../ecl-projection-bundle", () => ({
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource: jest.fn(),
}));
jest.mock("../golden-snapshot", () => ({
  getHomeReviewBundle: jest.fn(),
}));

import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "../ecl-projection-bundle";
import {
  getHomeReviewBundle,
  type HomePreviewTenantKey,
} from "../golden-snapshot";
import { homeRecordSourceToken } from "../record-source-token";
import { resolveHomeRecord } from "../resolve-home-record";
import type { HomeRecordRenderSource } from "../types";

const tenantKey = "meridian-health" as HomePreviewTenantKey;
const snapshot = {
  provenance: { canonical_snapshot_hash: "snapshot-version" },
};

beforeEach(() => {
  jest.clearAllMocks();
  (resolveEclProductProvider as jest.Mock).mockReturnValue("ecl");
  (isEclProductProvider as jest.Mock).mockReturnValue(true);
  (getHomeReviewBundle as jest.Mock).mockReturnValue(snapshot);
});

it("preserves the live reader's bundle and source marker exactly", async () => {
  const served = {
    bundle: { provenance: { canonical_snapshot_hash: "live-version" } },
    recordSource: {
      kind: "ecl_serving_projection",
      canonicalSnapshotHash: "live-version",
    } satisfies HomeRecordRenderSource,
  };
  (
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource as jest.Mock
  ).mockResolvedValueOnce(served);
  const result = await resolveHomeRecord(tenantKey, "ecl");
  expect(result).toEqual({
    ...served,
    recordToken: homeRecordSourceToken(tenantKey, served.recordSource),
  });
  expect(getHomeReviewBundle).not.toHaveBeenCalled();
});

it("keeps the reviewed fallback label supplied by the governed reader", async () => {
  const served = {
    bundle: snapshot,
    recordSource: {
      kind: "reviewed_snapshot_fallback",
      canonicalSnapshotHash: "snapshot-version",
    } satisfies HomeRecordRenderSource,
  };
  (
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource as jest.Mock
  ).mockResolvedValueOnce(served);
  const result = await resolveHomeRecord(tenantKey);
  expect(result?.recordSource).toBe(served.recordSource);
  expect(result?.bundle).toBe(snapshot);
});

it("labels the selected stored record when the live provider is not selected", async () => {
  (isEclProductProvider as jest.Mock).mockReturnValue(false);
  const result = await resolveHomeRecord(tenantKey, "reviewed");
  expect(resolveEclProductProvider).toHaveBeenCalledWith("reviewed");
  expect(result?.recordSource).toEqual({
    kind: "reviewed_snapshot",
    canonicalSnapshotHash: "snapshot-version",
  });
  expect(
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
  ).not.toHaveBeenCalled();
});

it("returns unavailable rather than inventing a missing record", async () => {
  (
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource as jest.Mock
  ).mockResolvedValueOnce(null);
  (getHomeReviewBundle as jest.Mock).mockReturnValueOnce(null);
  expect(await resolveHomeRecord(tenantKey)).toBeNull();
});
