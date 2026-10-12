import { createHash } from "node:crypto";
import { parseCaptureTextStepRecord } from "./capture-text-step-record";
import { computeCaptureRevision } from "./phase-capture-integrity";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "./phase-capture-contract";
import { phaseStepRecordSections } from "./phase-workflow-registry";
import type { PhaseSnapshot } from "./types.db";

export const P0_RETAINED_CAPTURE_FIELDS = [
  {
    key: "business_trigger",
    sourceKey: "business_trigger",
    recordKey: "p0_signal_step",
  },
  {
    key: "stakeholder_owner_view",
    sourceKey: "sponsor_candidate",
    recordKey: "p0_owner_evidence_step",
  },
  {
    key: "known_evidence",
    sourceKey: "known_evidence",
    recordKey: "p0_owner_evidence_step",
  },
  {
    key: "recommendation_to_advance",
    sourceKey: "recommendation_to_advance",
    recordKey: null,
  },
] as const;

export type P0CorrectionModule = {
  id: string;
  moduleKey: string;
  status: string;
  state: Record<string, unknown> | null;
};
export type P0ReviewedCapturePreview =
  | { state: "consistent" | "ineligible" | "unavailable"; reason?: string }
  | {
      state: "available";
      snapshotId: string;
      captureRevision: string;
      sourceRevision: string;
      snapshotRevision: string;
      signatureRevision: string;
      fields: Array<{
        key: string;
        label: string;
        moduleId: string;
        current: string;
        retained: string;
      }>;
    };

function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  return value;
}

export function p0CorrectionRecordRevision(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)) ?? "null")
    .digest("hex");
}

export function p0CaptureValues(
  modules: readonly P0CorrectionModule[],
): Record<string, string> {
  const rows = new Map(modules.map((row) => [row.moduleKey, row]));
  const values: Record<string, string> = {};
  for (const section of getPhaseCaptureSections(0)) {
    const raw = rows.get(phaseCaptureModuleKey(0, section.key))?.state?.value;
    if (raw != null && typeof raw !== "string")
      throw new Error("Captured input could not be read.");
    values[section.key] = typeof raw === "string" ? raw : "";
  }
  for (const section of phaseStepRecordSections(0)) {
    const raw = rows.get(phaseCaptureModuleKey(0, section.key))?.state?.value;
    if (raw != null && typeof raw !== "string")
      throw new Error("Capture record could not be read.");
    if (typeof raw === "string" && raw) values[section.key] = raw;
  }
  return values;
}

export function p0SignatureRevision(row: Record<string, unknown>): string {
  return p0CorrectionRecordRevision(
    Object.fromEntries(
      [
        "id",
        "engagement_id",
        "deliverable_type_key",
        "status",
        "current_version",
        "signed_off_version",
        "signed_off_by",
        "signed_off_at",
        "approved_artifact_id",
        "structured_data",
        "cited_input_ids",
        "requires_revalidation",
        "authoritative_lifecycle_state",
        "authoritative_flag_source",
        "updated_at",
      ].map((key) => [key, row[key] ?? null]),
    ),
  );
}

/** Restore declared retained capture only; no scaffold or generated defaults. */
export function previewP0ReviewedCaptureCorrection(input: {
  program: {
    id: string;
    currentPhase: number | null;
    charter: Record<string, unknown> | null;
  };
  actorId: string;
  modules: readonly P0CorrectionModule[];
  snapshots: readonly PhaseSnapshot[];
  signedBrief: Record<string, unknown> | null;
}): P0ReviewedCapturePreview {
  const { program, actorId, modules, snapshots } = input;
  const latest = snapshots.find((row) => row.phaseNumber === 0);
  if (
    program.currentPhase !== 1 ||
    !latest ||
    latest.engagementId !== program.id ||
    latest.approvalStatus !== "approved" ||
    latest.lockedByUserId !== actorId ||
    !latest.id
  )
    return { state: "ineligible" };
  const signed = input.signedBrief;
  if (
    !signed ||
    typeof signed.id !== "string" ||
    !signed.id ||
    !["origination_brief", "program_seed_brief", "program_seed"].includes(
      String(signed.deliverable_type_key),
    ) ||
    signed.engagement_id !== program.id ||
    signed.status !== "signed_off" ||
    signed.current_version !== 1 ||
    signed.signed_off_version !== 1 ||
    signed.signed_off_by !== actorId ||
    signed.requires_revalidation !== false
  )
    return {
      state: "unavailable",
      reason: "The signed origination version binding could not be verified.",
    };
  const rows = new Map(modules.map((row) => [row.moduleKey, row]));
  if (rows.size !== modules.length)
    return {
      state: "unavailable",
      reason: "Captured input has ambiguous module records.",
    };
  let values: Record<string, string>;
  try {
    values = p0CaptureValues(modules);
  } catch {
    return {
      state: "unavailable",
      reason: "Captured input could not be read.",
    };
  }
  const source: Record<string, string> = {};
  const fields: Extract<
    P0ReviewedCapturePreview,
    { state: "available" }
  >["fields"] = [];
  for (const field of P0_RETAINED_CAPTURE_FIELDS) {
    const retained = program.charter?.[field.sourceKey];
    const row = rows.get(phaseCaptureModuleKey(0, field.key));
    if (
      typeof retained !== "string" ||
      !retained.trim() ||
      !row?.id ||
      typeof row.state?.value !== "string"
    )
      return {
        state: "unavailable",
        reason: "The retained capture source could not be verified.",
      };
    source[field.key] = retained;
    if (row.state.value === retained) continue;
    if (field.recordKey) {
      const recordValue = rows.get(phaseCaptureModuleKey(0, field.recordKey))
        ?.state?.value;
      const entry = parseCaptureTextStepRecord(
        typeof recordValue === "string" ? recordValue : "",
      ).entries[field.key];
      if (!entry || entry.status !== "accepted" || entry.text !== retained)
        return {
          state: "unavailable",
          reason:
            "The retained source and accepted capture record do not agree.",
        };
    }
    fields.push({
      key: field.key,
      label: getPhaseCaptureSections(0).find(
        (section) => section.key === field.key,
      )!.label,
      moduleId: row.id,
      current: row.state.value,
      retained,
    });
  }
  if (!fields.length) return { state: "consistent" };
  const sourceRevision = createHash("sha256")
    .update(JSON.stringify(source))
    .digest("hex");
  return {
    state: "available",
    snapshotId: latest.id,
    captureRevision: computeCaptureRevision(values),
    sourceRevision,
    snapshotRevision: p0CorrectionRecordRevision(latest),
    signatureRevision: p0SignatureRevision(signed),
    fields,
  };
}

export class P0CaptureCorrectionRefusal extends Error {
  constructor(
    public code: string,
    public detail: string,
    public status = 409,
  ) {
    super(detail);
    this.name = "P0CaptureCorrectionRefusal";
  }
}
