/**
 * Governed metric values. Home consumes metric observations through the
 * consumption layer and (later) Cube-backed measures — never a direct browser
 * Cube connection. `value` may always be null; no component may assume presence.
 *
 * SOURCE: front-end brief GovernedMetricValue + CUBE_SEMANTIC_MODEL_CONTRACT.md
 *         + consumption.metric_observation_v1 (HOME_KNOWLEDGE_READ_MODEL_DDL.sql).
 */

import type { AvailabilityState } from "./states";

export interface GovernedMetricValue {
  metricKey: string;
  /** Never coerce null to zero — PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md. */
  value: number | null;
  unit: string | null;
  period: string | null;
  availabilityState: AvailabilityState;
  /** Semantic model version when a Cube measure produced the value. */
  semanticModelVersion: string | null;
  /** Reconciled Cube/Postgres measure query reference. */
  metricQueryHash: string | null;
  evidenceRefs: string[];
  /** Human-readable label for the metric (display name). */
  label?: string;
  /** Reader-facing reason when value is null (e.g. "source not yet provided"). */
  unavailableReason?: string | null;
}

/** True when this metric should render a real number rather than a "no value" state. */
export const metricHasValue = (m: GovernedMetricValue): m is GovernedMetricValue & {
  value: number;
} => m.value !== null && m.availabilityState === "available";
