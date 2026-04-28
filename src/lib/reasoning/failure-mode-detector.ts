// src/lib/reasoning/failure-mode-detector.ts
//
// Deterministic failure-mode detector — Layer 3 pattern application.
// Given a LifecyclePatternSeed's `failureModes: FailureMode[]` and an instance
// evidence map, detects which typical failure modes the current state matches
// and returns typed FailureModeDetection[].
//
// Mirrors `LifecycleContradictionDetector` exactly:
//   - Pure: same inputs → same outputs.
//   - No LLM calls, no network, no randomness, no Date.now usage.
//   - Keyword-match against the failure mode `description` field, fires when
//     ≥2 keywords match, confidence = min(0.3 + (matchCount - 2) * 0.1, 0.9).
//
// REASON-19.

import type { FailureModeDetection, FailureModeDetector } from './types';
import type { FailureMode, LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

// ─── Internal helpers ──────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'vs', 'or', 'and', 'but', 'for', 'nor', 'yet', 'so', 'in', 'on', 'at', 'to', 'from', 'with',
  'of', 'by', 'this', 'that', 'when', 'which', 'who', 'than', 'more', 'less', 'not', 'no', 'any',
  'all', 'both', 'each', 'few', 'most', 'other', 'some', 'such',
]);

/**
 * Extract meaningful keywords from a text string.
 * Strips stop-words and short tokens so keyword matching is signal-rich.
 *
 * Algorithm matches `contradiction-detector.ts` exactly so that detection
 * thresholds line up across the two detectors.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i); // dedupe
}

/**
 * Evaluate a single FailureMode against the evidence map.
 * Returns a FailureModeDetection if the mode fires (≥2 keyword matches), or
 * null if the evidence is insufficient.
 */
function detectFailureMode(
  failureMode: FailureMode,
  evidenceMap: Record<string, unknown>,
): FailureModeDetection | null {
  const descriptionKeywords = extractKeywords(failureMode.description);

  // Track matched keywords (deduped) and the keys that triggered each match.
  const matchedKeywordSet = new Set<string>();
  const detectedFromKeySet = new Set<string>();
  let matchCount = 0;

  for (const [key, value] of Object.entries(evidenceMap)) {
    const keyLower = key.toLowerCase();
    const valueLower = String(value ?? '').toLowerCase();

    const keyMatches = descriptionKeywords.filter(
      (kw) => keyLower.includes(kw) || valueLower.includes(kw),
    );
    if (keyMatches.length > 0) {
      matchCount += keyMatches.length;
      detectedFromKeySet.add(key);
      for (const kw of keyMatches) matchedKeywordSet.add(kw);
    }
  }

  // Threshold: need ≥2 keyword matches (counts duplicates across keys) to fire.
  if (matchCount < 2) return null;

  // Confidence: 0.3 base + 0.1 per additional match above threshold, cap at 0.9.
  const confidence = Math.min(0.3 + (matchCount - 2) * 0.1, 0.9);

  // Sort the matched keyword + key arrays so detection output is order-stable.
  const matchedKeywords = Array.from(matchedKeywordSet).sort();
  const detectedFromKeys = Array.from(detectedFromKeySet).sort();

  return {
    id: failureMode.id,
    failureModeId: failureMode.id,
    label: failureMode.label,
    description: failureMode.description,
    stages: [...failureMode.stages],
    mitigations: [...failureMode.mitigations],
    confidence,
    matchedKeywords,
    detectedFromKeys,
  };
}

// ─── LifecycleFailureModeDetector ─────────────────────────────────────────────

/**
 * Detects failure modes from a LifecyclePatternSeed's `failureModes` array
 * against a flat instance evidence map.
 *
 * Detection strategy: keyword-match the failure mode's `description` against
 * the evidence map keys and values. Modes fire when ≥2 keywords match.
 * Confidence scales with match density (0.3 base + 0.1/match, cap 0.9).
 */
export class LifecycleFailureModeDetector
  implements FailureModeDetector<LifecyclePatternSeed>
{
  private readonly pattern: LifecyclePatternSeed;

  constructor(pattern: LifecyclePatternSeed) {
    this.pattern = pattern;
  }

  /**
   * Detect all failure modes that fire against the given evidence map.
   * Returns only modes with ≥2 keyword matches. Output order matches the
   * pattern's failureModes declaration order, so callers see deterministic
   * ordering across invocations.
   */
  detect(evidenceMap: Record<string, unknown>): FailureModeDetection[] {
    const results: FailureModeDetection[] = [];

    for (const failureMode of this.pattern.failureModes) {
      const detection = detectFailureMode(failureMode, evidenceMap);
      if (detection !== null) {
        results.push(detection);
      }
    }

    return results;
  }

  /**
   * Detect failure modes relevant to a specific stage. A failure mode is
   * stage-relevant when its declared `stages` array includes `stageId`.
   */
  detectForStage(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): FailureModeDetection[] {
    const allDetected = this.detect(evidenceMap);
    return allDetected.filter((detection) => detection.stages.includes(stageId));
  }
}

// ─── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a LifecycleFailureModeDetector for the given lifecycle pattern.
 * Prefer this over `new LifecycleFailureModeDetector(...)` so consumers don't
 * need to import the class directly.
 */
export function createFailureModeDetector(
  pattern: LifecyclePatternSeed,
): LifecycleFailureModeDetector {
  return new LifecycleFailureModeDetector(pattern);
}

/**
 * Convenience: detect failure modes for an evidence map against a pattern.
 * Returns typed FailureModeDetection[] ready for synthesis context building.
 */
export function detectFailureModes(
  pattern: LifecyclePatternSeed,
  evidenceMap: Record<string, unknown>,
): FailureModeDetection[] {
  return createFailureModeDetector(pattern).detect(evidenceMap);
}
