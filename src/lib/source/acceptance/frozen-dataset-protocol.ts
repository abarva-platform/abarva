import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const timestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/)
  .refine((value) => Number.isFinite(Date.parse(value)));
const digest = z.string().regex(/^sha256:[0-9a-f]{64}$/i);
const namedVersions = z.record(nonEmpty, nonEmpty).refine(
  (value) => Object.keys(value).length > 0,
);
const namedChecksums = z.record(nonEmpty, digest).refine(
  (value) => Object.keys(value).length > 0,
);

const snapshotSchema = z.object({
  datasetId: nonEmpty,
  datasetVersion: nonEmpty,
  buildVersion: nonEmpty,
  migrationLedger: z.object({ version: nonEmpty, checksum: digest }).strict(),
  projectionRuns: namedVersions,
  readModelChecksums: namedChecksums,
  reportingCutoff: timestamp,
  deploySha: z.string().regex(/^[0-9a-f]{40}$/i),
  deployDigest: digest,
}).strict();

const baselineSchema = z.object({
  matrixId: nonEmpty,
  windowStart: timestamp,
  windowEnd: timestamp,
  snapshot: snapshotSchema,
}).strict();

const observationSchema = z.object({
  observedAt: timestamp,
  snapshot: snapshotSchema,
  changes: z.array(z.object({
    kind: z.enum(["reload", "migration", "deploy", "projection"]),
    occurredAt: timestamp,
  }).strict()),
}).strict();

function sameMap(left: Record<string, string>, right: Record<string, string>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every(
    (key, index) => key === rightKeys[index] && left[key] === right[key],
  );
}

export function evaluateFrozenDatasetAcceptance(
  baselineInput: unknown,
  observationInput: unknown,
): { status: "valid" | "invalid"; matrixId: string | null; reasons: string[] } {
  const reasons: string[] = [];
  const baselineResult = baselineSchema.safeParse(baselineInput);
  const observationResult = observationSchema.safeParse(observationInput);
  if (!baselineResult.success) reasons.push("invalid_baseline");
  if (!observationResult.success) reasons.push("invalid_observation");
  if (!baselineResult.success || !observationResult.success) {
    if (baselineResult.success && observationInput && typeof observationInput === "object" &&
      "observedAt" in observationInput && typeof observationInput.observedAt === "string") {
      const observedAt = Date.parse(observationInput.observedAt);
      if (Number.isFinite(observedAt) &&
        (observedAt < Date.parse(baselineResult.data.windowStart) ||
          observedAt > Date.parse(baselineResult.data.windowEnd))) {
        reasons.push("outside_freeze_window");
      }
    }
    return { status: "invalid", matrixId: baselineResult.success ? baselineResult.data.matrixId : null, reasons };
  }

  const baseline = baselineResult.data;
  const observation = observationResult.data;
  const start = Date.parse(baseline.windowStart);
  const end = Date.parse(baseline.windowEnd);
  const observedAt = Date.parse(observation.observedAt);
  if (end <= start) reasons.push("invalid_baseline");
  if (observedAt < start || observedAt > end) reasons.push("outside_freeze_window");

  const fixedFields = [
    "datasetId", "datasetVersion", "buildVersion", "reportingCutoff",
    "deploySha", "deployDigest",
  ] as const;
  for (const field of fixedFields) {
    if (baseline.snapshot[field] !== observation.snapshot[field]) {
      reasons.push(`${field}_changed`);
    }
  }
  if (baseline.snapshot.migrationLedger.version !== observation.snapshot.migrationLedger.version ||
    baseline.snapshot.migrationLedger.checksum !== observation.snapshot.migrationLedger.checksum) {
    reasons.push("migrationLedger_changed");
  }
  for (const field of ["projectionRuns", "readModelChecksums"] as const) {
    if (!sameMap(baseline.snapshot[field], observation.snapshot[field])) {
      reasons.push(`${field}_changed`);
    }
  }
  for (const change of observation.changes) {
    const changedAt = Date.parse(change.occurredAt);
    if (changedAt >= start && changedAt <= end) {
      const reason = `${change.kind}_during_freeze`;
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  }
  return {
    status: reasons.length ? "invalid" : "valid",
    matrixId: baseline.matrixId,
    reasons,
  };
}
