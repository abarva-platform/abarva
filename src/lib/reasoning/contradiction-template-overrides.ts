/**
 * Contradiction template overrides — local in-memory store.
 *
 * The reasoning layer's contradiction detector is driven by hand-authored
 * `ContradictionTemplate[]` lists on each `LifecyclePatternSeed`. To let
 * operators iterate on detection hints without editing source, this module
 * records optional overrides keyed by `(patternId, templateId)`.
 *
 * Persistence is intentionally out of scope: a server restart wipes the
 * store. Consumers (the contradiction detector, the admin editor, and the
 * override REST API) treat it as a best-effort experiment surface.
 *
 * Override semantics:
 *   - When an override is present for `(patternId, templateId)`, the
 *     detector uses the overridden template *instead of* the baseline.
 *   - Templates without overrides pass through unchanged.
 *   - The override's `id` always equals the baseline `id` (the key) so
 *     resolution-state ids and provenance stay stable.
 */

import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';

// ─── Internal state ───────────────────────────────────────────────────────────

const OVERRIDES: Map<string, Map<string, ContradictionTemplate>> = new Map();

// ─── Public surface ───────────────────────────────────────────────────────────

/**
 * Set (or replace) the override for a given `(patternId, templateId)` pair.
 * The override's `id` is forced to match `templateId` so callers cannot
 * accidentally rename a template via the override path.
 */
export function setTemplateOverride(
  patternId: string,
  templateId: string,
  override: ContradictionTemplate,
): void {
  if (!patternId || !templateId) return;
  let perPattern = OVERRIDES.get(patternId);
  if (!perPattern) {
    perPattern = new Map();
    OVERRIDES.set(patternId, perPattern);
  }
  perPattern.set(templateId, { ...override, id: templateId });
}

/**
 * Returns the override stored for a given `(patternId, templateId)` pair,
 * or `null` if no override has been recorded.
 */
export function getTemplateOverride(
  patternId: string,
  templateId: string,
): ContradictionTemplate | null {
  const perPattern = OVERRIDES.get(patternId);
  if (!perPattern) return null;
  const override = perPattern.get(templateId);
  return override ?? null;
}

/**
 * Returns true if any template under the given `patternId` has an override.
 */
export function hasOverridesForPattern(patternId: string): boolean {
  const perPattern = OVERRIDES.get(patternId);
  return perPattern !== undefined && perPattern.size > 0;
}

/**
 * Returns the full template list for the given `patternId` with overrides
 * applied — baseline templates whose ids are overridden are replaced; the
 * rest pass through unchanged. Order is preserved from the baseline.
 *
 * Returns `[]` if `patternId` does not resolve to a known lifecycle pattern.
 */
export function getOverridesForPattern(patternId: string): ContradictionTemplate[] {
  const pattern = findLifecyclePattern(patternId);
  if (!pattern) return [];
  const perPattern = OVERRIDES.get(patternId);
  if (!perPattern || perPattern.size === 0) {
    return pattern.contradictionTemplates;
  }
  return pattern.contradictionTemplates.map((tpl) => {
    const override = perPattern.get(tpl.id);
    return override ?? tpl;
  });
}

/**
 * Clear the override for a given `(patternId, templateId)` pair, if any.
 * No-op if the override does not exist.
 */
export function clearTemplateOverride(patternId: string, templateId: string): void {
  const perPattern = OVERRIDES.get(patternId);
  if (!perPattern) return;
  perPattern.delete(templateId);
  if (perPattern.size === 0) OVERRIDES.delete(patternId);
}

/**
 * Clear every recorded override across every pattern.
 */
export function clearAllOverrides(): void {
  OVERRIDES.clear();
}

/**
 * Test-only: reset the store. Not part of the public surface.
 */
export function _resetForTests(): void {
  OVERRIDES.clear();
}
