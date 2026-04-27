/**
 * ADMIN-DATA7 — Build progress adapter.
 *
 * Server-only async readers wrapping `docs/build/build-waves.json` and
 * `docs/build/build-slices.json`. Build progress is platform-level state, not
 * tenant state — `tenantSlug` is accepted for shape symmetry with other
 * adapters but ignored. There is no live mode: build manifests ARE the source
 * of truth, and live CI integration is gated to Wave 27+.
 */

import type {
  AdminBuildSlices,
  AdminBuildWaves,
} from './admin-build-progress-adapter-types';
import {
  adminBuildSlicesFixture,
  adminBuildWavesFixture,
} from './fixtures/admin-build-progress-fixture';

/**
 * Read the canonical wave manifest. Returns an empty array on missing file or
 * parse error — page-view treats missing as "no waves planned" rather than a
 * fatal error.
 */
export async function getAdminWaves(
  tenantSlug?: string,
): Promise<AdminBuildWaves> {
  // tenantSlug accepted for shape symmetry with tenant-scoped adapters but
  // ignored: build progress is platform state, not tenant state.
  void tenantSlug;
  return adminBuildWavesFixture();
}

/**
 * Read the canonical slice manifest. Returns an empty array on missing file
 * or parse error.
 */
export async function getAdminSlices(
  tenantSlug?: string,
): Promise<AdminBuildSlices> {
  void tenantSlug;
  return adminBuildSlicesFixture();
}
