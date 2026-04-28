// suggested-action-overlay-view.ts — PRG-STA-SUGGESTED-ACTION-VIEW
//
// View model for the SuggestedActionOverlay component rendered on
// ProgramDetailPage when the user clicks a workbench action button.
//
// Deterministic: no runtime clocks, no random(), no model calls.
//
// The overlay has three frames:
//   1 — Nexus suggests       (initial prompt, with Proceed/Dismiss)
//   2 — Confirm action       (confirmation step)
//   3 — Action logged        (completion, with optional cross-surface href link)

import type { ProgramWorkbenchContent } from './programs-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OverlayFrame = 1 | 2 | 3;
export type ActionLetter = 'A' | 'B' | 'C';

export interface WorkbenchActionInput {
  letter: ActionLetter;
  text: string;
  detail?: string;
  /** Optional cross-surface navigation href (e.g. '/intelligence/t3-h03') */
  href?: string;
}

export interface OverlayFrameCopy {
  frame: OverlayFrame;
  headline: string;
  bodyText: string;
  /** Primary button label */
  primaryLabel: string;
  /** Secondary button label */
  secondaryLabel: string;
  /** True when the primary button should navigate (frame 3 + href) */
  primaryNavigates: boolean;
  /** Cross-surface href if applicable, else null */
  crossSurfaceHref: string | null;
  /** Short label for the cross-surface link button in frame 3 */
  crossSurfaceLinkLabel: string | null;
}

export interface SuggestedActionOverlayView {
  action: WorkbenchActionInput;
  frames: [OverlayFrameCopy, OverlayFrameCopy, OverlayFrameCopy];
  /** True when the action carries a cross-surface href */
  hasCrossSurfaceLink: boolean;
  /** True — built from deterministic fixture input only */
  deterministicSeed: true;
}

// ─── Copy constants ───────────────────────────────────────────────────────────

const CONFIRM_DISCLAIMER =
  'This will queue a deterministic follow-up on the current program surface.';

const LOGGED_CAVEAT =
  'Action queued in the current preview state. Nexus follow-up remains seeded until runtime automation is wired.';

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Build the overlay view model for a single workbench action.
 *
 * `hasCrossSurfaceLink` is true when `action.href` is non-empty.
 * Frame 3 exposes `crossSurfaceHref` for the "View in {surface} →" link.
 */
export function buildSuggestedActionOverlayView(
  action: WorkbenchActionInput,
): SuggestedActionOverlayView {
  const hasCrossSurfaceLink = Boolean(action.href);
  const crossSurfaceHref = action.href ?? null;
  const crossSurfaceLinkLabel = crossSurfaceHref
    ? deriveCrossSurfaceLinkLabel(crossSurfaceHref)
    : null;

  const frame1: OverlayFrameCopy = {
    frame: 1,
    headline: 'Nexus suggests',
    bodyText: action.detail ?? action.text,
    primaryLabel: 'Proceed →',
    secondaryLabel: 'Dismiss',
    primaryNavigates: false,
    crossSurfaceHref: null,
    crossSurfaceLinkLabel: null,
  };

  const frame2: OverlayFrameCopy = {
    frame: 2,
    headline: 'Confirm action',
    bodyText: CONFIRM_DISCLAIMER,
    primaryLabel: 'Confirm and proceed',
    secondaryLabel: '← Back',
    primaryNavigates: false,
    crossSurfaceHref: null,
    crossSurfaceLinkLabel: null,
  };

  const frame3: OverlayFrameCopy = {
    frame: 3,
    headline: 'Action logged',
    bodyText: LOGGED_CAVEAT,
    primaryLabel: 'Done',
    secondaryLabel: 'Return to program',
    primaryNavigates: hasCrossSurfaceLink,
    crossSurfaceHref,
    crossSurfaceLinkLabel,
  };

  return {
    action,
    frames: [frame1, frame2, frame3],
    hasCrossSurfaceLink,
    deterministicSeed: true,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a human-readable link label from a cross-surface href.
 *
 * Examples:
 *   '/intelligence/t3-h03'  → 'View in Intelligence →'
 *   '/source/events/abc'    → 'View in Source →'
 *   '/tower/outcomes/xyz'   → 'View in Tower →'
 */
export function deriveCrossSurfaceLinkLabel(href: string): string {
  if (href.startsWith('/intelligence')) return 'View in Intelligence →';
  if (href.startsWith('/source')) return 'View in Source →';
  if (href.startsWith('/tower')) return 'View in Tower →';
  if (href.startsWith('/programs')) return 'View program →';
  return 'View →';
}

// Internal adapter: ProgramWorkbenchContent uses `letter: string` while
// WorkbenchActionInput constrains it to ActionLetter. Convert safely.
function toInput(
  a: ProgramWorkbenchContent['actions'][number],
): WorkbenchActionInput {
  return {
    letter: (a.letter as ActionLetter) ?? 'A',
    text: a.text,
    detail: a.detail,
    href: a.href,
  };
}

/**
 * Extract all workbench actions that carry a cross-surface href.
 * Useful for pre-building overlays for every linked action in a workbench.
 */
export function getCrossSurfaceActions(
  workbench: ProgramWorkbenchContent,
): WorkbenchActionInput[] {
  return workbench.actions.filter((a) => Boolean(a.href)).map(toInput);
}

/**
 * Build overlay views for ALL actions in a workbench (both linked and unlinked).
 */
export function buildAllWorkbenchOverlayViews(
  workbench: ProgramWorkbenchContent,
): SuggestedActionOverlayView[] {
  return workbench.actions.map((a) => buildSuggestedActionOverlayView(toInput(a)));
}
