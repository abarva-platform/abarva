import { evaluateFrozenDatasetAcceptance } from "../frozen-dataset-protocol";

const snapshot = {
  datasetId: "synthetic-event-pack",
  datasetVersion: "v3",
  buildVersion: "build-17",
  migrationLedger: { version: "20260923", checksum: `sha256:${"1".repeat(64)}` },
  projectionRuns: { events: "run-11", contracts: "run-12" },
  readModelChecksums: { event: `sha256:${"2".repeat(64)}`, contract: `sha256:${"3".repeat(64)}` },
  reportingCutoff: "2026-09-22T00:00:00Z",
  deploySha: "a".repeat(40),
  deployDigest: `sha256:${"b".repeat(64)}`,
};

const baseline = {
  matrixId: "matrix-1",
  windowStart: "2026-09-23T12:00:00Z",
  windowEnd: "2026-09-23T14:00:00Z",
  snapshot,
};

const observation = {
  observedAt: "2026-09-23T13:00:00Z",
  snapshot,
  changes: [] as Array<{ kind: "reload" | "migration" | "deploy" | "projection"; occurredAt: string }>,
};

describe("frozen Source acceptance", () => {
  it("accepts an unchanged, complete observation inside the freeze window", () => {
    expect(evaluateFrozenDatasetAcceptance(baseline, observation)).toEqual({
      status: "valid",
      matrixId: "matrix-1",
      reasons: [],
    });
  });

  it.each([
    ["datasetVersion", { datasetVersion: "v4" }],
    ["buildVersion", { buildVersion: "build-18" }],
    ["migrationLedger", { migrationLedger: { version: "20260924", checksum: `sha256:${"4".repeat(64)}` } }],
    ["projectionRuns", { projectionRuns: { events: "run-11", contracts: "run-13" } }],
    ["readModelChecksums", { readModelChecksums: { event: `sha256:${"5".repeat(64)}`, contract: `sha256:${"3".repeat(64)}` } }],
    ["reportingCutoff", { reportingCutoff: "2026-09-23T00:00:00Z" }],
    ["deploySha", { deploySha: "c".repeat(40) }],
    ["deployDigest", { deployDigest: `sha256:${"d".repeat(64)}` }],
  ])("invalidates the matrix when %s changes", (field, difference) => {
    const result = evaluateFrozenDatasetAcceptance(baseline, {
      ...observation,
      snapshot: { ...snapshot, ...difference },
    });
    expect(result.status).toBe("invalid");
    expect(result.reasons).toContain(`${field}_changed`);
  });

  it.each(["reload", "migration", "deploy", "projection"] as const)(
    "invalidates a matrix on %s during the window",
    (kind) => {
      const result = evaluateFrozenDatasetAcceptance(baseline, {
        ...observation,
        changes: [{ kind, occurredAt: "2026-09-23T12:30:00Z" }],
      });
      expect(result.status).toBe("invalid");
      expect(result.reasons).toContain(`${kind}_during_freeze`);
    },
  );

  it("fails closed on missing checksums and observations outside the window", () => {
    const result = evaluateFrozenDatasetAcceptance(baseline, {
      ...observation,
      observedAt: "2026-09-23T15:00:00Z",
      snapshot: { ...snapshot, readModelChecksums: {} },
    });
    expect(result.status).toBe("invalid");
    expect(result.reasons).toContain("invalid_observation");
    expect(result.reasons).toContain("outside_freeze_window");
  });

  it("rejects ambiguous timestamps and non-cryptographic checksum labels", () => {
    const result = evaluateFrozenDatasetAcceptance(
      { ...baseline, windowStart: "2026-09-23T12:00:00" },
      { ...observation, snapshot: { ...snapshot, readModelChecksums: { event: "same" } } },
    );
    expect(result.status).toBe("invalid");
    expect(result.reasons).toContain("invalid_baseline");
    expect(result.reasons).toContain("invalid_observation");
  });
});
