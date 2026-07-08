// Moves — deterministic template inference for uploads.
// Infers which governed template a completed upload corresponds to, from its
// filename, and picks the right upload category. Pure + deterministic — closes
// the loop with the downloaded starters (templateOutlineFilename). NO model.

import { templatesForPhase } from './catalog';
import type { MovePhaseCode, MovePhaseTemplateDefinition, UploadCategory } from './types';

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '') // drop extension
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Infer the template a completed upload maps to, from its filename. */
export function inferTemplateFromFilename(
  filename: string,
  phase: MovePhaseCode,
): MovePhaseTemplateDefinition | null {
  const fileSlug = slug(filename);
  if (!fileSlug) return null;
  const candidates = templatesForPhase(phase);
  // Exact, then prefix (handles "…-final", "…-v2"), then longest-substring match.
  let best: MovePhaseTemplateDefinition | null = null;
  let bestLen = 0;
  for (const t of candidates) {
    const tSlug = slug(t.label);
    if (fileSlug === tSlug) return t;
    if ((fileSlug.startsWith(tSlug) || fileSlug.includes(tSlug)) && tSlug.length > bestLen) {
      best = t;
      bestLen = tSlug.length;
    }
  }
  return best;
}

/** Pick the upload category from a template's session type (deterministic). */
export function uploadCategoryForTemplate(t: MovePhaseTemplateDefinition | null): UploadCategory {
  if (!t) return 'workshop_output';
  switch (t.recommendedSessionType) {
    case 'final_review':
      return 'final_artifact';
    case 'decision_review':
    case 'sme_review':
      return 'review_summary';
    case 'interview':
      return 'interview_output';
    default:
      return 'workshop_output';
  }
}
