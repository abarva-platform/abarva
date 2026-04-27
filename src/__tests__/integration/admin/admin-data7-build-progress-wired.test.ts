/**
 * ADMIN-DATA7 — `/admin/build-progress` wired to admin-build-progress-adapter.
 *
 * Verifies:
 *   - The new adapter module exists at the canonical path.
 *   - `getAdminWaves` / `getAdminSlices` return promise-resolved arrays
 *     matching the shape of the underlying manifests.
 *   - `buildBuildProgressPageView()` is async and produces the same
 *     output shape ADMIN15 already verifies (regression).
 *   - The page-view no longer reads the manifest files directly: the
 *     adapter is the only entry point.
 *   - The page route awaits the page-view builder.
 *   - The barrel re-exports the adapter functions and types.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getAdminSlices,
  getAdminWaves,
} from '@/lib/admin/data';
import type {
  AdminBuildSliceRaw,
  AdminBuildWaveRaw,
} from '@/lib/admin/data/admin-build-progress-adapter-types';
import { buildBuildProgressPageView } from '@/lib/admin/build-progress-page-view';

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('ADMIN-DATA7 — adapter module presence', () => {
  it('admin-build-progress-adapter-types.ts exists', () => {
    expect(
      existsSync(
        resolve(root, 'src/lib/admin/data/admin-build-progress-adapter-types.ts'),
      ),
    ).toBe(true);
  });

  it('admin-build-progress-adapter.ts exists', () => {
    expect(
      existsSync(resolve(root, 'src/lib/admin/data/admin-build-progress-adapter.ts')),
    ).toBe(true);
  });

  it('fixture file exists', () => {
    expect(
      existsSync(
        resolve(root, 'src/lib/admin/data/fixtures/admin-build-progress-fixture.ts'),
      ),
    ).toBe(true);
  });

  it('barrel index exports getAdminWaves and getAdminSlices', () => {
    const src = read('src/lib/admin/data/index.ts');
    expect(src).toContain('admin-build-progress-adapter');
    expect(src).toContain('admin-build-progress-adapter-types');
  });
});

describe('ADMIN-DATA7 — getAdminWaves contract', () => {
  it('returns a Promise', () => {
    const result = getAdminWaves('apex-retail');
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves to an array', async () => {
    const waves = await getAdminWaves('apex-retail');
    expect(Array.isArray(waves)).toBe(true);
  });

  it('every wave has a string waveId when present', async () => {
    const waves = await getAdminWaves('apex-retail');
    for (const w of waves) {
      if (w.waveId !== undefined) {
        expect(typeof w.waveId).toBe('string');
      }
    }
  });

  it('returns at least one wave (manifest is populated)', async () => {
    const waves = await getAdminWaves('apex-retail');
    expect(waves.length).toBeGreaterThan(0);
  });

  it('ignores tenantSlug — same result for any tenant', async () => {
    const a = await getAdminWaves('apex-retail');
    const b = await getAdminWaves('meridian-mfg');
    expect(a.length).toBe(b.length);
  });

  it('tenantSlug is optional', async () => {
    const waves = await getAdminWaves();
    expect(Array.isArray(waves)).toBe(true);
  });

  it('matches manifest length (build-waves.json)', async () => {
    const waves = await getAdminWaves('apex-retail');
    const raw = JSON.parse(read('docs/build/build-waves.json')) as {
      waves?: ReadonlyArray<AdminBuildWaveRaw>;
    };
    expect(waves.length).toBe((raw.waves ?? []).length);
  });
});

describe('ADMIN-DATA7 — getAdminSlices contract', () => {
  it('returns a Promise', () => {
    const result = getAdminSlices('apex-retail');
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves to an array', async () => {
    const slices = await getAdminSlices('apex-retail');
    expect(Array.isArray(slices)).toBe(true);
  });

  it('returns at least one slice (manifest is populated)', async () => {
    const slices = await getAdminSlices('apex-retail');
    expect(slices.length).toBeGreaterThan(0);
  });

  it('every slice has a string id when present', async () => {
    const slices = await getAdminSlices('apex-retail');
    for (const s of slices) {
      if (s.id !== undefined) {
        expect(typeof s.id).toBe('string');
      }
    }
  });

  it('matches manifest length (build-slices.json)', async () => {
    const slices = await getAdminSlices('apex-retail');
    const raw = JSON.parse(read('docs/build/build-slices.json')) as {
      slices?: ReadonlyArray<AdminBuildSliceRaw>;
    };
    expect(slices.length).toBe((raw.slices ?? []).length);
  });
});

describe('ADMIN-DATA7 — page-view wiring', () => {
  it('buildBuildProgressPageView is async (returns Promise)', () => {
    const result = buildBuildProgressPageView();
    expect(result).toBeInstanceOf(Promise);
  });

  it('page-view source no longer uses readFileSync directly', () => {
    const src = read('src/lib/admin/build-progress-page-view.ts');
    expect(src).not.toContain("from 'node:fs'");
    expect(src).not.toContain('readFileSync');
  });

  it('page-view source imports the adapter functions', () => {
    const src = read('src/lib/admin/build-progress-page-view.ts');
    expect(src).toContain('getAdminWaves');
    expect(src).toContain('getAdminSlices');
  });

  it('output shape preserved — waves match manifest counts', async () => {
    const view = await buildBuildProgressPageView();
    const raw = JSON.parse(read('docs/build/build-waves.json')) as {
      waves?: unknown[];
    };
    expect(view.waves.length).toBe((raw.waves ?? []).length);
  });

  it('output shape preserved — slicesIndex matches manifest counts', async () => {
    const view = await buildBuildProgressPageView();
    const raw = JSON.parse(read('docs/build/build-slices.json')) as {
      slices?: unknown[];
    };
    expect(view.slicesIndex.length).toBe((raw.slices ?? []).length);
  });

  it('CI snapshot remains exactly 5 deterministic rows', async () => {
    const view = await buildBuildProgressPageView();
    expect(view.ciSnapshot.length).toBe(5);
  });

  it('deterministicSeed flag is still true', async () => {
    const view = await buildBuildProgressPageView();
    expect(view.deterministicSeed).toBe(true);
  });

  it('two adjacent calls produce identical wave arrays (deterministic)', async () => {
    const a = await buildBuildProgressPageView();
    const b = await buildBuildProgressPageView();
    expect(a.waves).toEqual(b.waves);
  });

  it('banned-token scrub still applied to wave notes', async () => {
    const view = await buildBuildProgressPageView();
    const json = JSON.stringify(view).toLowerCase();
    expect(json).not.toContain('#14b8a6');
    expect(json).not.toContain('#7c3aed');
    expect(json).not.toContain('#d946ef');
    expect(json).not.toContain('sparkle');
    expect(json).not.toContain('production_ready');
  });
});

describe('ADMIN-DATA7 — page route awaits the builder', () => {
  it('page.tsx awaits buildBuildProgressPageView', () => {
    const src = read('src/app/(maestro)/admin/build-progress/page.tsx');
    expect(src).toContain('await buildBuildProgressPageView()');
  });
});
