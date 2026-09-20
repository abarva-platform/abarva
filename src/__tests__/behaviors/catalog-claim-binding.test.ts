import { readFileSync } from "node:fs";
import path from "node:path";

interface ClaimCoverage {
  key: string;
  status: "covered" | "deferred";
  surfaceId?: string;
}

const catalog = JSON.parse(
  readFileSync(
    path.resolve(
      __dirname,
      "../../../docs/security/ai-surface-control-catalog.json",
    ),
    "utf8",
  ),
) as { catalogClaimCoverage: ClaimCoverage[] };

describe("legal catalog claims bind only when coverage is real", () => {
  it("requires every covered claim to name the exact catalog surface", () => {
    const unboundCovered = catalog.catalogClaimCoverage.filter(
      (entry) => entry.status === "covered" && !entry.surfaceId,
    );

    expect(unboundCovered).toEqual([]);
  });

  it("permits an unbound legal claim only while it remains explicitly deferred", () => {
    const unboundNonDeferred = catalog.catalogClaimCoverage.filter(
      (entry) => !entry.surfaceId && entry.status !== "deferred",
    );

    expect(unboundNonDeferred).toEqual([]);
  });

  it("binds the consequential gate-waiver claim to its own handler", () => {
    expect(
      catalog.catalogClaimCoverage.find(
        (entry) =>
          entry.key ===
          "consequential|Intelligence|Gate waiver / approval|human-approval-gate",
      ),
    ).toEqual(
      expect.objectContaining({
        status: "covered",
        surfaceId: "intelligence-gate-waiver-route",
      }),
    );
  });
});
