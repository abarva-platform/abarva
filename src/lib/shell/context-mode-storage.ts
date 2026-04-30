/**
 * Context-mode persistence · CB-6
 *
 * Per-surface localStorage key + helpers for the user's
 * 4-mode toggle preference (Generic / Corpus / Tenant / Full).
 *
 * Keys are namespaced under `abarva.context-mode.<surface-slug>`
 * so each surface (programs-detail, intelligence, etc.) carries
 * its own preference.
 *
 * No `'use client'` directive — pure functions; safe in either
 * a client or test environment that mocks `localStorage`. SSR
 * callers must guard with a `typeof window !== 'undefined'`
 * check; the `read` and `write` helpers below do that already.
 */

import type { BrokerMode } from '@/lib/knowledge/context-broker';

const KEY_PREFIX = 'abarva.context-mode.';

/**
 * Compose the localStorage key for a given surface. Slashes and
 * leading whitespace are normalized to a stable shape.
 *   '/programs/APX-CDP-2026' → 'abarva.context-mode.programs-detail'
 *   'programs-detail'        → 'abarva.context-mode.programs-detail'
 *   '/intelligence'          → 'abarva.context-mode.intelligence'
 *
 * URL-shaped surfaces collapse to the semantic surface key so the
 * preference rolls up across program detail pages instead of being
 * keyed by program id.
 */
export function contextModeStorageKey(surface: string): string {
  const slug = canonicalizeSurfaceSlug(surface);
  return `${KEY_PREFIX}${slug}`;
}

function canonicalizeSurfaceSlug(surface: string): string {
  const trimmed = (surface ?? '').trim();
  if (!trimmed) return 'unknown';
  // Strip leading slash; collapse the program-detail URL form
  // ('/programs/APX-CDP-2026') to its semantic key.
  if (/^\/programs\/[^/]+$/.test(trimmed) && trimmed !== '/programs/new') {
    return 'programs-detail';
  }
  if (trimmed === '/programs/new' || trimmed === '/demo/programs/new') {
    return 'programs-new';
  }
  if (/^\/source(\/|$)/.test(trimmed)) return 'source';
  if (/^\/intelligence(\/|$)/.test(trimmed)) return 'intelligence';
  if (/^\/tower(\/|$)/.test(trimmed)) return 'tower';
  if (/^\/home(\/|$)/.test(trimmed)) return 'home';
  // Fallback — strip leading slash, collapse internal slashes.
  return trimmed.replace(/^\/+/, '').replace(/\//g, '-') || 'unknown';
}

/** Type guard — narrows a string from localStorage to a `BrokerMode`. */
export function isStoredBrokerMode(value: unknown): value is BrokerMode {
  return (
    value === 'generic' ||
    value === 'corpus' ||
    value === 'tenant' ||
    value === 'full'
  );
}

/**
 * Read the persisted mode for a surface from `window.localStorage`.
 * Returns `null` when no preference is set, when the value is
 * malformed, or when localStorage is unavailable (SSR / private
 * browsing / blocked storage).
 */
export function readStoredContextMode(surface: string): BrokerMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(contextModeStorageKey(surface));
    return isStoredBrokerMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Persist the mode for a surface. Silently no-ops when storage is
 * unavailable (the chosen mode still drives the in-flight session
 * via React state; persistence is best-effort).
 */
export function writeStoredContextMode(surface: string, mode: BrokerMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(contextModeStorageKey(surface), mode);
  } catch {
    // Ignore — quota / disabled / SSR / etc.
  }
}
