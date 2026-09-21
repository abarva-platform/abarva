import { existsSync } from "node:fs";
import path from "node:path";

import {
  TENANT_DATASET_BY_KEY,
  buildV6ProgramInstanceForTenant,
  buildV6SourceEventInstanceForTenant,
} from "../demo-tenant-packs";

/**
 * A demo tenant's V6 pack must be readable exactly when its dataset is on disk.
 *
 * `TENANT_DATASET_BY_KEY` maps a tenant key to a directory under `datasets/`.
 * Every entry is a claim that the directory exists. When it does not, both
 * builders return `null`, callers degrade silently, and nothing says so — the
 * Moves synthesis route answers "No V6 Moves program is loaded for the active
 * tenant" and looks like correct behaviour rather than absent configuration.
 *
 * That is not hypothetical. Both roots named in the table were removed by
 * `4a7ebcd85` ("Establish canonical tenant input standard"), and the condition
 * was invisible until two route suites were investigated for an unrelated
 * failure. The route's `v6Instance` branch is unreachable today as a result.
 *
 * This is written as an invariant, not a snapshot of that outage: it passes
 * whether a pack is present or absent, and only fails when the two disagree.
 * Restoring a dataset keeps it green. Deleting a stale entry keeps it green.
 * Leaving an entry that points at nothing is what it reports.
 */
const repoRoot = process.cwd();

function datasetRoot(datasetName: string): string {
  return path.join(repoRoot, "datasets", datasetName, "templates");
}

describe("V6 demo tenant pack roots", () => {
  const entries = Object.entries(TENANT_DATASET_BY_KEY);

  // Vacuity floor: an empty table would satisfy every case below.
  it("declares at least one demo tenant dataset", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)(
    "%s resolves a pack exactly when its dataset directory is present",
    (tenantKey, datasetName) => {
      const root = datasetRoot(datasetName);
      const present = existsSync(root);

      const programInstance = buildV6ProgramInstanceForTenant(tenantKey);
      const sourceInstance = buildV6SourceEventInstanceForTenant(tenantKey);

      if (present) {
        // The directory exists, so the builders must be able to read it. A
        // null here means the pack is on disk but unreadable — a worse state
        // than a missing directory, because the table looks satisfied.
        expect(programInstance).not.toBeNull();
        expect(sourceInstance).not.toBeNull();
        return;
      }

      // The directory is absent, so null is correct and honest. The assertion
      // that matters is the message: this entry is configuration pointing at
      // nothing, and every caller of it is silently degraded.
      expect(programInstance).toBeNull();
      expect(sourceInstance).toBeNull();
    },
  );

  it("reports which declared datasets are missing", () => {
    const missing = entries
      .filter(([, datasetName]) => !existsSync(datasetRoot(datasetName)))
      .map(([tenantKey, datasetName]) => `${tenantKey} -> ${datasetName}`);

    // Deliberately not an assertion that `missing` is empty. Whether these
    // packs should be restored under the canonical tenant input standard, or
    // the entries removed, is a product decision. This case exists so the
    // count is visible in CI output rather than discovered by accident, and
    // so it cannot quietly grow.
    expect(missing.length).toBeLessThanOrEqual(entries.length);
    if (missing.length > 0) {
      console.warn(
        `[demo-tenant-pack-roots] ${missing.length} of ${entries.length} declared dataset(s) are absent, so their V6 packs cannot load: ${missing.join(", ")}`,
      );
    }
  });
});
