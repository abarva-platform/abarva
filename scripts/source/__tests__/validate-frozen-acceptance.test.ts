import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const script = path.resolve(process.cwd(), "scripts/source/validate-frozen-acceptance.ts");
const snapshot = {
  datasetId: "synthetic-pack",
  datasetVersion: "v1",
  buildVersion: "build-1",
  migrationLedger: { version: "v1", checksum: `sha256:${"1".repeat(64)}` },
  projectionRuns: { event: "run-1" },
  readModelChecksums: { event: `sha256:${"2".repeat(64)}` },
  reportingCutoff: "2026-09-22T00:00:00Z",
  deploySha: "a".repeat(40),
  deployDigest: `sha256:${"b".repeat(64)}`,
};

describe("frozen Source acceptance CLI", () => {
  it("exits nonzero when a projection changes inside the freeze window", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "source-acceptance-"));
    try {
      const baselinePath = path.join(directory, "baseline.json");
      const observationPath = path.join(directory, "observation.json");
      fs.writeFileSync(baselinePath, JSON.stringify({
        matrixId: "matrix-1",
        windowStart: "2026-09-23T12:00:00Z",
        windowEnd: "2026-09-23T14:00:00Z",
        snapshot,
      }));
      fs.writeFileSync(observationPath, JSON.stringify({
        observedAt: "2026-09-23T13:00:00Z",
        snapshot,
        changes: [{ kind: "projection", occurredAt: "2026-09-23T12:30:00Z" }],
      }));

      const result = spawnSync("npx", ["tsx", script, baselinePath, observationPath], {
        encoding: "utf8",
        cwd: process.cwd(),
      });
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout)).toEqual({
        status: "invalid",
        matrixId: "matrix-1",
        reasons: ["projection_during_freeze"],
      });
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
