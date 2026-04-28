// src/lib/reasoning/contradiction-detector.ts
//
// Deterministic contradiction detector — Layer 3 pattern application.
// Given a ContradictionTemplate[] and an instance evidence map,
// detects which templates fire and returns typed ContradictionDetection[].
//
// Like the gate evaluator, this is pure: same inputs → same outputs.
// No LLM calls, no network, no randomness.

import type { ContradictionDetection, EvidencePointer, PatternRef } from './types';
import type { ContradictionTemplate, LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

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
 * Evaluate a single ContradictionTemplate against the evidence map.
 * Returns a ContradictionDetection if the template fires (≥2 keyword matches),
 * or null if the evidence is insufficient.
 */
function detectTemplate(
  template: ContradictionTemplate,
  evidenceMap: Record<string, unknown>,
  patternRef: PatternRef,
): ContradictionDetection | null {
  // Extract keywords from the template's detection hint (primary signal source)
  const hintKeywords = extractKeywords(template.detectionHint);

  const triggeringEvidence: EvidencePointer[] = [];
  let matchCount = 0;

  for (const [key, value] of Object.entries(evidenceMap)) {
    const keyLower = key.toLowerCase();
    const valueLower = String(value ?? '').toLowerCase();

    // Check for keyword matches in evidence map keys and values
    const keyMatches = hintKeywords.filter(
      (kw) => keyLower.includes(kw) || valueLower.includes(kw),
    );
    if (keyMatches.length > 0) {
      matchCount += keyMatches.length;
      triggeringEvidence.push({
        field: key,
        value: String(value ?? ''),
      });
    }
  }

  // Threshold: need ≥2 keyword matches to fire
  if (matchCount < 2) return null;

  // Confidence: 0.3 base + 0.1 per additional match above threshold, cap at 0.9
  const confidence = Math.min(0.3 + (matchCount - 2) * 0.1, 0.9);

  return {
    templateId: template.id,
    label: template.label,
    severity: template.severity,
    confidence,
    partyA: template.partyA,
    partyB: template.partyB,
    triggeringEvidence: triggeringEvidence.slice(0, 5), // max 5 evidence pointers
    resolutionPath: template.resolutionPath,
    patternRef: { ...patternRef, section: `§ Contradiction — ${template.id}` },
    detectedAt: Date.now(),
  };
}

// ─── LifecycleContradictionDetector ───────────────────────────────────────────

/**
 * Detects contradictions from a LifecyclePatternSeed's contradiction templates
 * against a flat instance evidence map.
 *
 * Detection strategy: keyword-match the template's detectionHint against the
 * evidence map keys and values. Templates fire when ≥2 keywords match.
 * Confidence scales with match density (0.3 base + 0.1/match, cap 0.9).
 */
export class LifecycleContradictionDetector {
  private readonly pattern: LifecyclePatternSeed;
  private readonly patternRef: PatternRef;

  constructor(pattern: LifecyclePatternSeed) {
    this.pattern = pattern;
    this.patternRef = {
      patternId: pattern.patternId,
      patternVersion: pattern.version,
      section: '§ Contradiction templates',
    };
  }

  /**
   * Detect all contradictions that fire against the given evidence map.
   * Returns only contradictions with confidence > 0 (i.e. ≥2 keyword matches).
   */
  detect(evidenceMap: Record<string, unknown>): ContradictionDetection[] {
    const results: ContradictionDetection[] = [];

    for (const template of this.pattern.contradictionTemplates) {
      const detection = detectTemplate(template, evidenceMap, this.patternRef);
      if (detection !== null) {
        results.push(detection);
      }
    }

    return results;
  }

  /**
   * Detect contradictions relevant to a specific stage.
   * A template is stage-relevant when its id contains the stage name (case-insensitive),
   * or when evidence keys in the map relate to the stage.
   */
  detectForStage(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): ContradictionDetection[] {
    const stageIdLower = stageId.toLowerCase();
    const allDetected = this.detect(evidenceMap);

    return allDetected.filter((detection) => {
      // Check if the templateId contains the stage name
      if (detection.templateId.toLowerCase().includes(stageIdLower)) return true;

      // Check if any triggering evidence field relates to the stage
      if (
        detection.triggeringEvidence.some(
          (ev) => ev.field.toLowerCase().includes(stageIdLower),
        )
      ) {
        return true;
      }

      return false;
    });
  }
}

// ─── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a LifecycleContradictionDetector for the given lifecycle pattern.
 * Prefer this over `new LifecycleContradictionDetector(...)` so consumers don't
 * need to import the class directly.
 */
export function createContradictionDetector(
  pattern: LifecyclePatternSeed,
): LifecycleContradictionDetector {
  return new LifecycleContradictionDetector(pattern);
}

/**
 * Convenience: detect contradictions for an evidence map against a pattern.
 * Returns typed ContradictionDetection[] ready for synthesis context building.
 */
export function detectContradictions(
  pattern: LifecyclePatternSeed,
  evidenceMap: Record<string, unknown>,
): ContradictionDetection[] {
  return createContradictionDetector(pattern).detect(evidenceMap);
}
