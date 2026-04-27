/**
 * ADMIN-DATA7 — Build progress fixture.
 *
 * Reads `docs/build/build-waves.json` and `docs/build/build-slices.json` from
 * the repo at runtime. These manifests are the source of truth for platform
 * build state — they are versioned in-repo and updated by orchestration
 * scripts. The adapter is "fixture-mode" because there is no live alternative
 * (live CI integration is gated to Wave 27+).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type {
  AdminBuildSliceRaw,
  AdminBuildSlices,
  AdminBuildWaveRaw,
  AdminBuildWaves,
} from '../admin-build-progress-adapter-types';

function safeReadJson(rel: string): unknown {
  try {
    const path = resolve(process.cwd(), rel);
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function adminBuildWavesFixture(): AdminBuildWaves {
  const data = safeReadJson('docs/build/build-waves.json');
  if (!data) return [];
  if (Array.isArray(data)) return data as ReadonlyArray<AdminBuildWaveRaw>;
  const obj = data as { waves?: ReadonlyArray<AdminBuildWaveRaw> };
  return obj.waves ?? [];
}

export function adminBuildSlicesFixture(): AdminBuildSlices {
  const data = safeReadJson('docs/build/build-slices.json');
  if (!data) return [];
  if (Array.isArray(data)) return data as ReadonlyArray<AdminBuildSliceRaw>;
  const obj = data as { slices?: ReadonlyArray<AdminBuildSliceRaw> };
  return obj.slices ?? [];
}
