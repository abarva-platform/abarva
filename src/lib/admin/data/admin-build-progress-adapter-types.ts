/**
 * ADMIN-DATA7 — Build progress adapter types.
 *
 * Build progress is the one admin domain that is NOT DB-backed: it reflects
 * platform build state (waves + slices in `docs/build/*.json`) rather than
 * tenant state. The adapter exists for symmetry with the rest of the admin
 * data layer — `getAdminWaves(tenantSlug)` / `getAdminSlices(tenantSlug)`
 * accept tenantSlug for shape symmetry but ignore it.
 */

export interface AdminBuildWaveRaw {
  waveId?: string;
  name?: string;
  goal?: string;
  status?: string;
  percentComplete?: number;
  plannedSlices?: ReadonlyArray<string>;
  completedSlices?: ReadonlyArray<string>;
  blockedSlices?: ReadonlyArray<string>;
  mergedPrs?: ReadonlyArray<number>;
  validationStatus?: string;
  lastUpdated?: string;
  nextAction?: string;
}

export interface AdminBuildSliceRaw {
  id?: string;
  name?: string;
  title?: string;
  status?: string;
  category?: string;
  risk?: string;
  ownerAgent?: string;
  dependsOn?: ReadonlyArray<string>;
  wave?: string;
  notes?: string | ReadonlyArray<string>;
  completedAt?: string;
}

/**
 * The adapter return-shape: arrays of raw wave/slice records exactly as they
 * appear in the manifests. The page-view layer normalizes + scrubs them.
 */
export type AdminBuildWaves = ReadonlyArray<AdminBuildWaveRaw>;
export type AdminBuildSlices = ReadonlyArray<AdminBuildSliceRaw>;
