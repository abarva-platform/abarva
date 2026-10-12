jest.mock("server-only", () => ({}));
jest.mock("node:fs/promises", () => ({ readFile: jest.fn() }));
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: jest.fn() },
}));
jest.mock("@/lib/ecl/insights/home-admission", () => ({
  attachHomeInsightAdmission: jest.fn(),
}));

import { readFile } from "node:fs/promises";
import { azureRead } from "@/lib/data-plane/azureRead";
import { attachHomeInsightAdmission } from "@/lib/ecl/insights/home-admission";
import { insightHash } from "@/lib/ecl/insights/engine";
import { readHomeIntegratedInsights } from "../integrated-insight-reader";
import type { HomeRecordRenderSource, HomeReviewBundle } from "../types";

const served = {
  bundle: { tenantKey: "meridian-health" } as HomeReviewBundle,
  recordSource: {
    kind: "ecl_serving_projection",
    canonicalSnapshotHash: "test",
    contextVersion: {
      assessmentId: "test-assessment",
      coherence: "coherent",
      sourceSetHash: "a".repeat(64),
    },
  } as HomeRecordRenderSource,
};
const admission = {
  manifest: { dataset_id: "test-insights", serving_approval: { test: true } },
};
beforeEach(() => {
  jest.clearAllMocks();
  (azureRead.query as jest.Mock).mockResolvedValue([]);
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
});

it.each(["reviewed_snapshot", "reviewed_snapshot_fallback"] as const)(
  "does not read candidates for %s",
  async (kind) => {
    const old = { ...served, recordSource: { ...served.recordSource, kind } };
    expect(await readHomeIntegratedInsights(old)).toBe(old);
    expect(azureRead.query).not.toHaveBeenCalled();
  },
);
it("does not enrich an incoherent live narrative", async () => {
  const old = {
    ...served,
    recordSource: {
      ...served.recordSource,
      contextVersion: {
        ...served.recordSource.contextVersion!,
        coherence: "unverified" as const,
      },
    },
  };
  expect(await readHomeIntegratedInsights(old)).toBe(old);
  expect(azureRead.query).not.toHaveBeenCalled();
});
it("keeps the base record when the additive view is absent or has no admission", async () => {
  expect(await readHomeIntegratedInsights(served)).toBe(served);
  expect(azureRead.query).toHaveBeenCalledWith(
    expect.stringContaining("base_home_record_token=$3"),
    [
      "meridian-health",
      "test-assessment",
      expect.stringMatching(/^[a-f0-9]{64}$/),
    ],
    { missingTable: "empty" },
  );
});
it("revalidates the currently committed declaration before enriching the common reader", async () => {
  (azureRead.query as jest.Mock).mockResolvedValue([
    { admission_hash: insightHash(admission), admission_json: admission },
  ]);
  (readFile as jest.Mock).mockResolvedValue(JSON.stringify(admission.manifest));
  (attachHomeInsightAdmission as jest.Mock).mockReturnValue({ enriched: true });
  expect(await readHomeIntegratedInsights(served)).toEqual({ enriched: true });
  expect(attachHomeInsightAdmission).toHaveBeenCalledWith(
    served.bundle,
    served.recordSource,
    expect.stringMatching(/^[a-f0-9]{64}$/),
    admission,
  );
});
it("refuses a revoked or changed declaration", async () => {
  (azureRead.query as jest.Mock).mockResolvedValue([
    { admission_hash: insightHash(admission), admission_json: admission },
  ]);
  (readFile as jest.Mock).mockResolvedValue(
    JSON.stringify({ ...admission.manifest, serving_approval: null }),
  );
  expect(await readHomeIntegratedInsights(served)).toBe(served);
  expect(console.warn).toHaveBeenCalled();
  expect(attachHomeInsightAdmission).not.toHaveBeenCalled();
});
it("refuses admission content drift before reading a declaration", async () => {
  (azureRead.query as jest.Mock).mockResolvedValue([
    { admission_hash: "f".repeat(64), admission_json: admission },
  ]);
  expect(await readHomeIntegratedInsights(served)).toBe(served);
  expect(readFile).not.toHaveBeenCalled();
  expect(console.warn).toHaveBeenCalled();
});
