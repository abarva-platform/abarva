import { createHash } from "node:crypto";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";
import {
  coerceStageToSourceJourney,
  getSourceJourneyForEvent,
  type SourceJourneyDefinition,
  type SourceSourcingMotion,
} from "@/lib/source/sourcing-motion-journeys";

export const SOURCE_STAGE_PLAN_SNAPSHOT_VERSION = "source-stage-plan-v1";

export type SourceStagePlanSnapshotStatus =
  | "completed"
  | "current"
  | "planned";

export interface SourceStagePlanSnapshotStage {
  readonly key: SourceStageKey;
  readonly label: string;
  readonly purpose: string;
  readonly sequence: number;
  readonly status: SourceStagePlanSnapshotStatus;
}

export interface SourceStagePlanSnapshot {
  readonly snapshotVersion: typeof SOURCE_STAGE_PLAN_SNAPSHOT_VERSION;
  readonly owner: {
    readonly sourceEventId: string;
    readonly clientKey: string;
  };
  readonly currentStageKey: SourceStageKey;
  readonly lifecycleState: string;
  readonly journey: {
    readonly id: SourceSourcingMotion;
    readonly label: string;
    readonly skippedStageKeys: readonly SourceStageKey[];
  };
  readonly stages: readonly SourceStagePlanSnapshotStage[];
  readonly contentHash: string;
}

export type SourceStagePlanSnapshotResult =
  | {
      kind: "available";
      snapshot: SourceStagePlanSnapshot;
    }
  | { kind: "not_found" }
  | { kind: "unavailable" };

interface SourceStagePlanRow {
  id: unknown;
  client_key: unknown;
  current_stage_key: unknown;
  lifecycle_state: unknown;
  sourcing_motion: unknown;
  event_type: unknown;
  classified_category: unknown;
  event_name: unknown;
  event_code: unknown;
  trigger_description: unknown;
}

function nonempty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function stageStatus(
  stageIndex: number,
  currentIndex: number,
): SourceStagePlanSnapshotStatus {
  if (stageIndex < currentIndex) return "completed";
  if (stageIndex === currentIndex) return "current";
  return "planned";
}

function buildStages(
  journey: SourceJourneyDefinition,
  currentStageKey: SourceStageKey,
): readonly SourceStagePlanSnapshotStage[] {
  const visibleCurrentStageKey = coerceStageToSourceJourney(
    journey,
    currentStageKey,
    currentStageKey,
  );
  const currentIndex = Math.max(
    0,
    journey.stages.findIndex((stage) => stage.key === visibleCurrentStageKey),
  );

  return journey.stages.map((stage, index) => ({
    key: stage.key,
    label: stage.label,
    purpose: stage.purpose,
    sequence: index + 1,
    status: stageStatus(index, currentIndex),
  }));
}

export function buildSourceEventStagePlanSnapshot(
  row: SourceStagePlanRow,
  requestedClientKey: string,
): SourceStagePlanSnapshotResult {
  const sourceEventId = nonempty(row.id);
  const clientKey = nonempty(row.client_key);
  const requestedTenant = nonempty(requestedClientKey);
  if (!sourceEventId || !clientKey || !requestedTenant) {
    return { kind: "unavailable" };
  }
  if (clientKey !== requestedTenant) return { kind: "not_found" };

  const currentStageKey = normalizeSourceStageKey(row.current_stage_key);
  if (!currentStageKey) return { kind: "unavailable" };

  const lifecycleState = nonempty(row.lifecycle_state);
  if (!lifecycleState) return { kind: "unavailable" };

  const journey = getSourceJourneyForEvent({
    sourcingMotion: nonempty(row.sourcing_motion),
    eventType: nonempty(row.event_type),
    classifiedCategory: nonempty(row.classified_category),
    eventName: nonempty(row.event_name),
    eventCode: nonempty(row.event_code),
    triggerDescription: nonempty(row.trigger_description),
  });
  const stages = buildStages(journey, currentStageKey);
  if (stages.length === 0) return { kind: "unavailable" };

  const payload = {
    snapshotVersion: SOURCE_STAGE_PLAN_SNAPSHOT_VERSION,
    owner: { sourceEventId, clientKey },
    currentStageKey,
    lifecycleState,
    journey: {
      id: journey.id,
      label: journey.label,
      skippedStageKeys: journey.skippedStageKeys,
    },
    stages,
  } satisfies Omit<SourceStagePlanSnapshot, "contentHash">;

  return {
    kind: "available",
    snapshot: deepFreeze({
      ...payload,
      contentHash: sha256(payload),
    }),
  };
}

export async function readSourceEventStagePlanSnapshot(
  eventId: string,
  clientKey: string,
): Promise<SourceStagePlanSnapshotResult> {
  try {
    const { data, error } = await getAzureReadFluentClient()
      .from("source_events")
      .select(
        [
          "id",
          "client_key",
          "current_stage_key",
          "lifecycle_state",
          "sourcing_motion",
          "event_type",
          "classified_category",
          "event_name",
          "event_code",
          "trigger_description",
        ].join(","),
      )
      .eq("id", eventId)
      .eq("client_key", clientKey)
      .maybeSingle();

    if (error) return { kind: "unavailable" };
    if (!data) return { kind: "not_found" };
    return buildSourceEventStagePlanSnapshot(
      data as SourceStagePlanRow,
      clientKey,
    );
  } catch {
    return { kind: "unavailable" };
  }
}
