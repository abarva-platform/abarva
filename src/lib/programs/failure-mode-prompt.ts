// Slice OV2-WIRE-AND-FM-PROMPT — failure-mode catalog system-prompt block.
// Sources canonical names from FAILURE_MODES so the prompt and the catalog
// never drift. Design ref: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section C.6.

import { FAILURE_MODES } from '@/lib/programs/failure-modes';
import type { BriefOverlapMatch } from '@/lib/programs/origination-overlap';

const PROGRAMS_SURFACE_PREFIXES = ['/programs', '/demo/programs', '/tower'];

/** Programs surfaces eligible for the failure-mode catalog block. */
export function isProgramsSurface(surface: string | null | undefined): boolean {
  if (!surface || typeof surface !== 'string') return false;
  return PROGRAMS_SURFACE_PREFIXES.some(
    (prefix) => surface === prefix || surface.startsWith(`${prefix}/`),
  );
}

/**
 * Render the canonical 10-failure-mode catalog as a system-prompt block.
 * Names are pulled from FAILURE_MODES so renaming a mode in one place
 * updates the prompt. Returns the same string every call — deterministic.
 */
export function formatFailureModeCatalogForPrompt(): string {
  const lines = FAILURE_MODES.map((mode) => {
    const num = String(mode.id).padStart(2, ' ');
    return `${num}. ${mode.name}`;
  });

  return [
    'THE 10 FAILURES YOU EXIST TO PREVENT:',
    '',
    'These are the failure modes AI programs hit, grounded in published research (Gartner, RAND, MIT/BCG, McKinsey, Forrester). At every step, in every phase, your job is to force the user through the success-thinking that prevents each. When you detect a signal that one of these is happening, surface it.',
    '',
    ...lines,
  ].join('\n');
}

/**
 * Compose the failure-mode catalog block iff the surface qualifies.
 * Empty string on non-Programs surfaces so the route's filter strips it.
 */
export function composeFailureModeBlock(surface: string | null | undefined): string {
  if (!isProgramsSurface(surface)) return '';
  return formatFailureModeCatalogForPrompt();
}

/**
 * Compose the OVERLAP CANDIDATES block for /programs/new from the top
 * matches returned by detectBriefOverlap. Empty string when matches is
 * empty. Caller is responsible for slicing to the top N (typically 3).
 */
export function composeOverlapBlock(matches: readonly BriefOverlapMatch[]): string {
  if (!matches || matches.length === 0) return '';

  const matchLines = matches.flatMap((m) => {
    const phase = m.programPhase ? m.programPhase : 'unknown';
    return [
      `  - ${m.programName} (${m.programId})  ·  current phase: ${phase}`,
      `    Overlap kind: ${m.overlapKind}.  ${m.overlapDetail}`,
    ];
  });

  return [
    'OVERLAP CANDIDATES (existing programs in this tenant that may overlap with the brief in progress):',
    '',
    ...matchLines,
    '',
    "When the user's brief reveals real overlap with one of these, emit an `overlap-alert` artifact (see channel instructions) using the canonical programId / name / phase / kind / detail above. Do NOT invent overlap; only use these candidates. If none of the candidates is a real match given the user's actual problem statement, do not emit overlap-alert.",
  ].join('\n');
}

/**
 * One-line directive that nudges Steward to emit `brief-progress` on
 * every turn that captures or refines a brief field. The artifact-channel
 * instructions teach the *shape*; this teaches the *cadence*.
 * Empty string off `/programs/new`.
 */
export function composeBriefProgressCadenceDirective(
  surface: string | null | undefined,
): string {
  if (surface !== '/programs/new' && surface !== '/demo/programs/new') {
    return '';
  }
  return "- After every turn that captures or refines a brief field, emit a `brief-progress` artifact summarizing the 8-field state. The user's right pane only updates when you emit it.";
}
