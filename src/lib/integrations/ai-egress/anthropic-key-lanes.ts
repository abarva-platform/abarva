/**
 * Anthropic API key lane resolution.
 *
 * WHY THIS EXISTS
 * The Anthropic Admin API can only attribute spend to keys that actually
 * differ. With one shared `ANTHROPIC_API_KEY`, the cost report shows a single
 * undifferentiated bucket — verified 2026-07-22 at $3,227.89 month-to-date with
 * no way to tell Tower answers from Home pack generation. Splitting the key by
 * economic lane makes provider-side attribution work without depending on our
 * own instrumentation being complete.
 *
 * The lanes are ECONOMIC, not organizational. Two workloads share a lane when
 * they would be optimized the same way:
 *   prod-realtime        interactive, latency-sensitive, frontier model
 *   offline-generation   batchable, long-output, Batch API candidate
 *   qa-evaluation        high-volume, cheap-model candidate
 *   engineering-scripts  ad hoc, should never be confused with product spend
 *
 * BACKWARD COMPATIBLE BY DESIGN
 * Every lane falls back to `ANTHROPIC_API_KEY` when its lane-specific variable
 * is unset. Deploying this changes nothing until lane keys are provisioned, and
 * a partially-provisioned rollout is valid — provision one lane at a time and
 * the rest keep working. `describeKeyLaneCoverage()` reports which lanes are
 * actually separated so the cost digest can state its own attribution quality
 * rather than implying a precision it does not have.
 *
 * NEVER log or audit the key value. Audit the lane name only.
 */

import {
  AI_WORKLOADS,
  type AiKeyLane,
  type AiWorkload,
  isAiWorkload,
} from "@/lib/observability/ai-workload-taxonomy";

/** Env var carrying the dedicated key for each lane. */
const LANE_ENV_VARS: Record<AiKeyLane, string> = {
  "prod-realtime": "ANTHROPIC_API_KEY_PROD_REALTIME",
  "offline-generation": "ANTHROPIC_API_KEY_OFFLINE_GENERATION",
  "qa-evaluation": "ANTHROPIC_API_KEY_QA_EVALUATION",
  "engineering-scripts": "ANTHROPIC_API_KEY_ENGINEERING_SCRIPTS",
};

const SHARED_ENV_VAR = "ANTHROPIC_API_KEY";

/**
 * The lane used when a call site has not yet declared its workload. Deliberately
 * `prod-realtime`: an unlabelled call from the running product is far more
 * likely to be product traffic than a script, and mislabelling product spend as
 * script spend would understate the number that matters.
 */
export const DEFAULT_KEY_LANE: AiKeyLane = "prod-realtime";

export function laneForWorkloadOrDefault(workload?: string | null): AiKeyLane {
  if (workload && isAiWorkload(workload)) {
    return AI_WORKLOADS[workload as AiWorkload].lane;
  }
  return DEFAULT_KEY_LANE;
}

export interface ResolvedAnthropicKey {
  apiKey: string;
  lane: AiKeyLane;
  /** Which env var supplied the key. Safe to audit; the value never is. */
  envVar: string;
  /** True when this lane fell back to the shared key (no separation yet). */
  usedSharedFallback: boolean;
}

/**
 * Resolve the API key for a lane. Throws only when neither the lane variable
 * nor the shared variable is set — the same failure mode callers already handle
 * for a missing `ANTHROPIC_API_KEY`.
 */
export function resolveAnthropicKeyForLane(
  lane: AiKeyLane = DEFAULT_KEY_LANE,
): ResolvedAnthropicKey {
  const laneEnvVar = LANE_ENV_VARS[lane];
  const laneKey = process.env[laneEnvVar];
  if (laneKey) {
    return {
      apiKey: laneKey,
      lane,
      envVar: laneEnvVar,
      usedSharedFallback: false,
    };
  }

  const sharedKey = process.env[SHARED_ENV_VAR];
  if (sharedKey) {
    return {
      apiKey: sharedKey,
      lane,
      envVar: SHARED_ENV_VAR,
      usedSharedFallback: true,
    };
  }

  throw new Error(
    `Missing Anthropic API key for lane "${lane}": set ${laneEnvVar} or ${SHARED_ENV_VAR}.`,
  );
}

export interface KeyLaneCoverage {
  lane: AiKeyLane;
  separated: boolean;
  envVar: string;
}

/**
 * Which lanes have their own key. The cost digest should publish this so a
 * reader can tell whether a per-lane breakdown is real provider attribution or
 * an artifact of everything sharing one key.
 */
export function describeKeyLaneCoverage(): {
  lanes: KeyLaneCoverage[];
  separatedCount: number;
  totalCount: number;
  fullySeparated: boolean;
} {
  const lanes = (Object.keys(LANE_ENV_VARS) as AiKeyLane[]).map((lane) => ({
    lane,
    separated: Boolean(process.env[LANE_ENV_VARS[lane]]),
    envVar: LANE_ENV_VARS[lane],
  }));
  const separatedCount = lanes.filter((l) => l.separated).length;
  return {
    lanes,
    separatedCount,
    totalCount: lanes.length,
    fullySeparated: separatedCount === lanes.length,
  };
}

/** Audit-safe descriptor. Contains no secret material. */
export function keyLaneAuditMetadata(resolved: ResolvedAnthropicKey): {
  keyLane: AiKeyLane;
  keyEnvVar: string;
  keyLaneSeparated: boolean;
} {
  return {
    keyLane: resolved.lane,
    keyEnvVar: resolved.envVar,
    keyLaneSeparated: !resolved.usedSharedFallback,
  };
}
