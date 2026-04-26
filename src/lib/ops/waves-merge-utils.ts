/**
 * waves-merge-utils.ts  (OPS11)
 *
 * TypeScript mirror of the merge_build_waves logic in
 * scripts/integration/cherry_resolve.py.
 *
 * All merge rules here must stay in sync with the Python implementation:
 *   - waveId field name (not "id")
 *   - mergedPrs: integer-array union (deduplicate)
 *   - validationStatus: conservative — never upgrade HEAD with a lower-rank src;
 *       "failing" is a special sentinel that is never propagated to HEAD and
 *       never replaced on HEAD
 *   - nextAction: append src if non-empty, different, and not already a
 *       substring of HEAD's nextAction (space-joined, dedup by substring)
 *   - status: never downgrade HEAD's status
 *   - percentComplete: always recomputed as
 *       round(completedSlices.length / plannedSlices.length * 100)
 */

export type WaveValidationStatus =
  | 'not_run'
  | 'tsc_clean'
  | 'tests_green'
  | 'build_green'
  | 'ci_green'
  | 'partial'
  | 'full_pass'
  | 'failing';

export type WaveStatus =
  | 'planned'
  | 'in_progress'
  | 'blocked'
  | 'deferred'
  | 'merged';

export interface WaveEntry {
  waveId: string;
  name?: string;
  goal?: string;
  status: WaveStatus;
  percentComplete: number;
  plannedSlices: string[];
  completedSlices: string[];
  skippedSlices: string[];
  blockedSlices: string[];
  mergedPrs: number[];
  validationStatus: WaveValidationStatus;
  productionReadinessUpdated?: boolean;
  currentBlockers?: unknown[];
  nextAction: string;
  lastUpdated?: string;
  [key: string]: unknown;
}

export interface WavesDoc {
  schemaVersion?: number;
  lastUpdated?: string;
  waves: WaveEntry[];
  [key: string]: unknown;
}

export interface WaveMergeSummaryEntry {
  waveId: string;
  added: boolean;
  percentComplete?: number;
}

export interface WavesMergeSummary {
  merged_waves: WaveMergeSummaryEntry[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Rank tables (must mirror Python constants)
// ---------------------------------------------------------------------------

const WAVE_VALIDATION_RANK: WaveValidationStatus[] = [
  'not_run',
  'tsc_clean',
  'tests_green',
  'build_green',
  'ci_green',
  'partial',
  'full_pass',
];

const WAVE_STATUS_RANK: WaveStatus[] = [
  'planned',
  'in_progress',
  'blocked',
  'deferred',
  'merged',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function waveValidationRank(status: WaveValidationStatus): number {
  const idx = WAVE_VALIDATION_RANK.indexOf(status);
  return idx; // -1 if not found (covers "failing")
}

/**
 * Conservative validationStatus merge.
 *
 * "Conservative" here means pessimistic: HEAD's validationStatus is never
 * upgraded to a higher rank from src. If src has a lower rank, HEAD is
 * demoted (we trust the worse result). If src has a higher rank, HEAD is
 * kept (we do not claim better validation from a cherry branch).
 *
 * "failing" is a special sentinel:
 *   - if HEAD is "failing", preserve it regardless of src.
 *   - if src is "failing", preserve HEAD's status (failing never propagates).
 */
export function conservativeWaveValidation(
  headVs: WaveValidationStatus,
  srcVs: WaveValidationStatus,
): WaveValidationStatus {
  if (headVs === srcVs) return headVs;
  if (headVs === 'failing') return headVs;
  if (srcVs === 'failing') return headVs;
  const hRank = waveValidationRank(headVs);
  const sRank = waveValidationRank(srcVs);
  // Never upgrade HEAD: if src is higher rank, keep HEAD
  if (sRank > hRank) return headVs;
  // src is lower rank → demote HEAD (conservative = take the worse result)
  return srcVs;
}

/**
 * Conservative status merge — never downgrade HEAD.
 * Rank (ascending): planned < in_progress < blocked < deferred < merged
 */
export function conservativeWaveStatus(
  headStatus: WaveStatus,
  srcStatus: WaveStatus,
): WaveStatus {
  if (headStatus === srcStatus) return headStatus;
  const hRank =
    WAVE_STATUS_RANK.indexOf(headStatus) === -1
      ? -1
      : WAVE_STATUS_RANK.indexOf(headStatus);
  const sRank =
    WAVE_STATUS_RANK.indexOf(srcStatus) === -1
      ? -1
      : WAVE_STATUS_RANK.indexOf(srcStatus);
  // Keep HEAD if already at higher or equal rank
  if (hRank >= sRank) return headStatus;
  return srcStatus;
}

/**
 * nextAction handling: append src if non-empty, different, and not already
 * a substring of HEAD's nextAction. Space-joined.
 */
export function mergeWaveNextAction(headNa: string, srcNa: string): string {
  if (!srcNa || srcNa === headNa) return headNa;
  if (headNa.includes(srcNa)) return headNa;
  return `${headNa.trimEnd()} ${srcNa.trimStart()}`.trim();
}

/**
 * Union two integer arrays, deduplicating by value.
 * Preserves HEAD order, then appends unique src entries.
 */
export function unionIntArray(head: number[], src: number[]): number[] {
  const result = [...head];
  const seen = new Set(head);
  for (const pr of src) {
    if (!seen.has(pr)) {
      seen.add(pr);
      result.push(pr);
    }
  }
  return result;
}

/**
 * Union two string arrays, deduplicating by value.
 */
export function unionStringArray(head: string[], src: string[]): string[] {
  const result = [...head];
  const seen = new Set(head);
  for (const item of src) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Core merge
// ---------------------------------------------------------------------------

/**
 * Merge src wave document into head wave document using OPS11 conservative
 * merge rules. Mutates and returns the head document.
 */
export function mergeBuildWaves(
  head: WavesDoc,
  src: WavesDoc,
  today: string,
): { merged: WavesDoc; summary: WavesMergeSummary } {
  const summary: WavesMergeSummary = { merged_waves: [], lastUpdated: today };

  const headMap = new Map<string, WaveEntry>(
    head.waves.map((w) => [w.waveId, w]),
  );

  for (const swave of src.waves) {
    const wid = swave.waveId;
    if (!wid) continue;

    if (!headMap.has(wid)) {
      head.waves.push(swave);
      headMap.set(wid, swave);
      summary.merged_waves.push({ waveId: wid, added: true });
      continue;
    }

    const hwave = headMap.get(wid)!;
    const merged: WaveEntry = { ...hwave };
    let changed = false;

    // Union slice arrays
    for (const arrField of [
      'completedSlices',
      'skippedSlices',
      'blockedSlices',
    ] as const) {
      const unioned = unionStringArray(
        hwave[arrField] ?? [],
        swave[arrField] ?? [],
      );
      if (
        JSON.stringify(unioned) !== JSON.stringify(hwave[arrField] ?? [])
      ) {
        merged[arrField] = unioned;
        changed = true;
      }
    }

    // mergedPrs union
    const unionedPrs = unionIntArray(
      hwave.mergedPrs ?? [],
      swave.mergedPrs ?? [],
    );
    if (
      JSON.stringify(unionedPrs) !== JSON.stringify(hwave.mergedPrs ?? [])
    ) {
      merged.mergedPrs = unionedPrs;
      changed = true;
    }

    // validationStatus: conservative
    const newVs = conservativeWaveValidation(
      hwave.validationStatus,
      swave.validationStatus,
    );
    if (newVs !== hwave.validationStatus) {
      merged.validationStatus = newVs;
      changed = true;
    }

    // status: never downgrade
    const newStatus = conservativeWaveStatus(hwave.status, swave.status);
    if (newStatus !== hwave.status) {
      merged.status = newStatus;
      changed = true;
    }

    // nextAction: append distinct
    const newNa = mergeWaveNextAction(
      hwave.nextAction ?? '',
      swave.nextAction ?? '',
    );
    if (newNa !== (hwave.nextAction ?? '')) {
      merged.nextAction = newNa;
      changed = true;
    }

    // Always recompute percentComplete
    const planned = merged.plannedSlices ?? hwave.plannedSlices ?? [];
    const completed = merged.completedSlices ?? hwave.completedSlices ?? [];
    const pct = planned.length > 0
      ? Math.round((completed.length / planned.length) * 100)
      : 0;
    if (merged.percentComplete !== pct) {
      merged.percentComplete = pct;
      changed = true;
    }

    if (changed) {
      const idx = head.waves.findIndex((w) => w.waveId === wid);
      if (idx !== -1) head.waves[idx] = merged;
      headMap.set(wid, merged);
      summary.merged_waves.push({ waveId: wid, added: false, percentComplete: pct });
    }
  }

  head.lastUpdated = today;
  return { merged: head, summary };
}
