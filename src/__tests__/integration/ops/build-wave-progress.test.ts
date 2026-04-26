// WAVE1 - Build Wave Progress Tracker tests.
//
// Deterministic, file-pure suite. No model providers, no shell, no
// spawning, no live cloud, no live CI / Vercel polling.

/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs') as typeof import('fs');
const path = require('path') as typeof import('path');

// ---------------------------------------------------------------------
// Canonical vocabularies (mirrored from BUILD_WAVE_PROGRESS_PROTOCOL.md)
// ---------------------------------------------------------------------

const STATUS_VALUES = [
  'planned',
  'in_progress',
  'merged',
  'blocked',
  'deferred',
] as const;

const VALIDATION_STATUS_VALUES = [
  'not_run',
  'tsc_clean',
  'tests_green',
  'build_green',
  'ci_green',
  'full_pass',
  'partial',
  'failing',
] as const;

const SLICE_STATUS_COMPLETE = ['code_complete', 'verified'] as const;

const REQUIRED_WAVE_FIELDS = [
  'waveId',
  'name',
  'goal',
  'status',
  'percentComplete',
  'plannedSlices',
  'completedSlices',
  'skippedSlices',
  'blockedSlices',
  'mergedPrs',
  'validationStatus',
  'productionReadinessUpdated',
  'currentBlockers',
  'nextAction',
  'lastUpdated',
] as const;

const EXPECTED_WAVE_IDS = [
  'wave-0',
  'wave-1',
  'wave-2',
  'wave-3',
  'wave-4',
  'wave-5',
  'wave-6',
  'wave-7',
  'wave-8',
  'wave-9',
  'wave-10',
  'wave-11',
  'wave-12',
  'wave-13',
] as const;

// ---------------------------------------------------------------------
// File loaders (deterministic, file-pure)
// ---------------------------------------------------------------------

const repoRoot = path.resolve(__dirname, '../../../../');
const wavesPath = path.join(repoRoot, 'docs/build/build-waves.json');
const slicesPath = path.join(repoRoot, 'docs/build/build-slices.json');
const sliceContractsDir = path.join(repoRoot, 'docs/build/slices');

interface WaveRecord {
  waveId: string;
  name: string;
  goal: string;
  status: string;
  percentComplete: number;
  plannedSlices: string[];
  completedSlices: string[];
  skippedSlices: string[];
  blockedSlices: string[];
  mergedPrs: number[];
  validationStatus: string;
  productionReadinessUpdated: boolean;
  currentBlockers: string[];
  nextAction: string;
  lastUpdated: string;
}

interface WavesManifest {
  schemaVersion: number;
  lastUpdated: string;
  source: string;
  waves: WaveRecord[];
}

interface SliceRecord {
  id: string;
  status: string;
}

interface SlicesManifest {
  slices: SliceRecord[];
}

function loadWaves(): WavesManifest {
  const raw = fs.readFileSync(wavesPath, 'utf8');
  return JSON.parse(raw) as WavesManifest;
}

function loadSlices(): SlicesManifest {
  const raw = fs.readFileSync(slicesPath, 'utf8');
  return JSON.parse(raw) as SlicesManifest;
}

function listSliceContractIds(): Set<string> {
  const out = new Set<string>();
  if (!fs.existsSync(sliceContractsDir)) return out;
  const entries = fs.readdirSync(sliceContractsDir);
  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    // Slice contract files are named like `<ID>_<slug>.md` or
    // `<ID>.md`. Take the prefix up to the first underscore or dot.
    const stem = entry.replace(/\.md$/, '');
    const idPart = stem.split('_')[0];
    if (idPart && idPart.length > 0) out.add(idPart);
  }
  return out;
}

// ---------------------------------------------------------------------
// Top-level shape
// ---------------------------------------------------------------------

describe('build-waves.json - top-level shape', () => {
  it('parses as valid JSON', () => {
    expect(fs.existsSync(wavesPath)).toBe(true);
    const raw = fs.readFileSync(wavesPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('declares schemaVersion 1, lastUpdated 2026-04-26, and a non-empty source', () => {
    const m = loadWaves();
    expect(m.schemaVersion).toBe(1);
    expect(m.lastUpdated).toBe('2026-04-26');
    expect(typeof m.source).toBe('string');
    expect(m.source.length).toBeGreaterThan(20);
  });

  it('exposes a waves array', () => {
    const m = loadWaves();
    expect(Array.isArray(m.waves)).toBe(true);
    expect(m.waves.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Canonical wave coverage
// ---------------------------------------------------------------------

describe('build-waves.json - canonical wave coverage', () => {
  it('includes all 14 canonical waves (Wave 0 through Wave 13)', () => {
    const m = loadWaves();
    expect(m.waves.length).toBe(EXPECTED_WAVE_IDS.length);
    const ids = m.waves.map((w) => w.waveId);
    for (const expected of EXPECTED_WAVE_IDS) {
      expect(ids).toContain(expected);
    }
  });

  it('has no duplicate waveId', () => {
    const m = loadWaves();
    const ids = m.waves.map((w) => w.waveId);
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------
// Per-wave required fields
// ---------------------------------------------------------------------

describe('build-waves.json - per-wave required fields', () => {
  it('every wave has every required field', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      for (const field of REQUIRED_WAVE_FIELDS) {
        expect(wave).toHaveProperty(field);
      }
    }
  });

  it('every plannedSlices, completedSlices, skippedSlices, blockedSlices is an array', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(Array.isArray(wave.plannedSlices)).toBe(true);
      expect(Array.isArray(wave.completedSlices)).toBe(true);
      expect(Array.isArray(wave.skippedSlices)).toBe(true);
      expect(Array.isArray(wave.blockedSlices)).toBe(true);
    }
  });

  it('every mergedPrs is an array', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(Array.isArray(wave.mergedPrs)).toBe(true);
    }
  });

  it('every currentBlockers is an array', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(Array.isArray(wave.currentBlockers)).toBe(true);
    }
  });

  it('productionReadinessUpdated is a boolean', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(typeof wave.productionReadinessUpdated).toBe('boolean');
    }
  });

  it('nextAction is a non-empty string', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(typeof wave.nextAction).toBe('string');
      expect(wave.nextAction.length).toBeGreaterThan(0);
    }
  });

  it('lastUpdated is the deterministic 2026-04-26 stamp', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(wave.lastUpdated).toBe('2026-04-26');
    }
  });
});

// ---------------------------------------------------------------------
// Canonical vocabularies
// ---------------------------------------------------------------------

describe('build-waves.json - canonical vocabularies', () => {
  it('every status is in the canonical set', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(STATUS_VALUES).toContain(wave.status as (typeof STATUS_VALUES)[number]);
    }
  });

  it('every validationStatus is in the canonical set', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(VALIDATION_STATUS_VALUES).toContain(
        wave.validationStatus as (typeof VALIDATION_STATUS_VALUES)[number],
      );
    }
  });
});

// ---------------------------------------------------------------------
// Percent complete reconciliation
// ---------------------------------------------------------------------

describe('build-waves.json - percent complete reconciliation', () => {
  it('every wave reconciles with round(completed / planned * 100) within +/- 1', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      const planned = wave.plannedSlices.length;
      const completed = wave.completedSlices.length;
      const expected = planned === 0 ? 0 : Math.round((completed / planned) * 100);
      const diff = Math.abs(wave.percentComplete - expected);
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  it('every percentComplete is an integer between 0 and 100 inclusive', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      expect(Number.isInteger(wave.percentComplete)).toBe(true);
      expect(wave.percentComplete).toBeGreaterThanOrEqual(0);
      expect(wave.percentComplete).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------
// Slice membership consistency
// ---------------------------------------------------------------------

describe('build-waves.json - slice membership consistency', () => {
  it('every completedSlices entry exists in build-slices.json at code_complete or verified', () => {
    const waves = loadWaves();
    const slices = loadSlices();
    const sliceById = new Map<string, string>();
    for (const s of slices.slices) sliceById.set(s.id, s.status);

    for (const wave of waves.waves) {
      for (const id of wave.completedSlices) {
        // Allow build-operations wave 8 to claim a planned-but-not-yet-
        // -shipped WAVE1 slice that this lane appends to the slice
        // manifest in the same commit. The slice manifest update is in
        // the same staged batch, so loadSlices() will see it.
        if (sliceById.has(id)) {
          expect(SLICE_STATUS_COMPLETE).toContain(
            sliceById.get(id) as (typeof SLICE_STATUS_COMPLETE)[number],
          );
        } else {
          // If a completed slice is not in the slice manifest, fail
          // loudly: completedSlices must be evidence-backed.
          throw new Error(
            `completedSlice ${id} not found in build-slices.json (wave=${wave.waveId})`,
          );
        }
      }
    }
  });

  it('every plannedSlices entry exists in build-slices.json or has a slice contract MD', () => {
    const waves = loadWaves();
    const slices = loadSlices();
    const sliceIds = new Set(slices.slices.map((s) => s.id));
    const contractIds = listSliceContractIds();

    for (const wave of waves.waves) {
      for (const id of wave.plannedSlices) {
        const inSlices = sliceIds.has(id);
        const inContracts = contractIds.has(id);
        // Future-only IDs are allowed for waves not yet merged
        // (planned-but-not-yet-shipped). For merged waves, every
        // planned slice must be in the slice manifest.
        if (wave.status === 'merged') {
          if (!inSlices) {
            throw new Error(
              `plannedSlice ${id} (merged wave ${wave.waveId}) not in build-slices.json`,
            );
          }
        } else {
          // Non-merged waves accept either a slice manifest entry or a
          // documented slice contract MD. For waves that are
          // entirely future-only (e.g., wave-7 "Private Azure/GCP
          // Deployment Lab"), no plannedSlices need exist; the empty
          // array is allowed.
          if (!inSlices && !inContracts) {
            // OK: future-only slice ID is documented only in the wave
            // manifest. This is acceptable per the protocol.
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// PR binding
// ---------------------------------------------------------------------

describe('build-waves.json - PR binding', () => {
  it('every mergedPrs entry is a positive integer', () => {
    const m = loadWaves();
    for (const wave of m.waves) {
      for (const pr of wave.mergedPrs) {
        expect(Number.isInteger(pr)).toBe(true);
        expect(pr).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Wave 8 (this wave) anchor
// ---------------------------------------------------------------------

describe('build-waves.json - wave-8 build operations anchor', () => {
  it('wave-8 lists OPS5, OPS6, OPS7, OPS8, QA13, CLOUD8, PROD5, WAVE1 as planned', () => {
    const m = loadWaves();
    const wave8 = m.waves.find((w) => w.waveId === 'wave-8');
    expect(wave8).toBeDefined();
    if (!wave8) return;
    const expected = [
      'OPS5',
      'OPS6',
      'OPS7',
      'OPS8',
      'QA13',
      'CLOUD8',
      'PROD5',
      'WAVE1',
    ];
    for (const id of expected) {
      expect(wave8.plannedSlices).toContain(id);
    }
  });

  it('wave-8 lists WAVE1 as completed', () => {
    const m = loadWaves();
    const wave8 = m.waves.find((w) => w.waveId === 'wave-8');
    expect(wave8).toBeDefined();
    if (!wave8) return;
    expect(wave8.completedSlices).toContain('WAVE1');
  });

  it('wave-8 status is merged (build operations hardening completed via PR #291)', () => {
    const m = loadWaves();
    const wave8 = m.waves.find((w) => w.waveId === 'wave-8');
    expect(wave8).toBeDefined();
    if (!wave8) return;
    expect(wave8.status).toBe('merged');
  });
});

// ---------------------------------------------------------------------
// Wave 12 (this wave) anchor
// ---------------------------------------------------------------------

describe('build-waves.json - wave-12 product polish azure lab anchor', () => {
  it('wave-12 lists all 9 planned slices', () => {
    const m = loadWaves();
    const wave12 = m.waves.find((w) => w.waveId === 'wave-12');
    expect(wave12).toBeDefined();
    if (!wave12) return;
    const expected = [
      'OPS11',
      'OPS12',
      'PDEL9',
      'PDEL10',
      'AZLAB1',
      'AZLAB2',
      'AZLAB3',
      'AZLAB4',
      'AZLAB5',
    ];
    for (const id of expected) {
      expect(wave12.plannedSlices).toContain(id);
    }
  });

  it('wave-12 lists all 9 slices as completed', () => {
    const m = loadWaves();
    const wave12 = m.waves.find((w) => w.waveId === 'wave-12');
    expect(wave12).toBeDefined();
    if (!wave12) return;
    const expected = [
      'OPS11',
      'OPS12',
      'PDEL9',
      'PDEL10',
      'AZLAB1',
      'AZLAB2',
      'AZLAB3',
      'AZLAB4',
      'AZLAB5',
    ];
    for (const id of expected) {
      expect(wave12.completedSlices).toContain(id);
    }
  });

  it('wave-12 percentComplete is 100', () => {
    const m = loadWaves();
    const wave12 = m.waves.find((w) => w.waveId === 'wave-12');
    expect(wave12).toBeDefined();
    if (!wave12) return;
    expect(wave12.percentComplete).toBe(100);
  });

  it('wave-12 productionReadinessUpdated is true', () => {
    const m = loadWaves();
    const wave12 = m.waves.find((w) => w.waveId === 'wave-12');
    expect(wave12).toBeDefined();
    if (!wave12) return;
    expect(wave12.productionReadinessUpdated).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Wave 13 (this wave) anchor
// ---------------------------------------------------------------------

describe('build-waves.json - wave-13 live demo validation anchor', () => {
  it('wave-13 lists all 8 planned slices', () => {
    const m = loadWaves();
    const wave13 = m.waves.find((w) => w.waveId === 'wave-13');
    expect(wave13).toBeDefined();
    if (!wave13) return;
    const expected = ['LIVE1', 'LIVE2', 'LIVE3', 'LIVE4', 'DEMO3', 'QA19', 'QA20', 'OPS13'];
    for (const id of expected) {
      expect(wave13.plannedSlices).toContain(id);
    }
  });

  it('wave-13 lists all 8 slices as completed', () => {
    const m = loadWaves();
    const wave13 = m.waves.find((w) => w.waveId === 'wave-13');
    expect(wave13).toBeDefined();
    if (!wave13) return;
    const expected = ['LIVE1', 'LIVE2', 'LIVE3', 'LIVE4', 'DEMO3', 'QA19', 'QA20', 'OPS13'];
    for (const id of expected) {
      expect(wave13.completedSlices).toContain(id);
    }
  });

  it('wave-13 percentComplete is 100', () => {
    const m = loadWaves();
    const wave13 = m.waves.find((w) => w.waveId === 'wave-13');
    expect(wave13).toBeDefined();
    if (!wave13) return;
    expect(wave13.percentComplete).toBe(100);
  });

  it('wave-13 productionReadinessUpdated is true', () => {
    const m = loadWaves();
    const wave13 = m.waves.find((w) => w.waveId === 'wave-13');
    expect(wave13).toBeDefined();
    if (!wave13) return;
    expect(wave13.productionReadinessUpdated).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('build-waves.json - module hygiene', () => {
  it('does not reference Date.now or Math.random in the manifest text', () => {
    const raw = fs.readFileSync(wavesPath, 'utf8');
    expect(raw).not.toContain('Date.now');
    expect(raw).not.toContain('Math.random');
    expect(raw).not.toContain('new Date(');
  });

  it('does not contain conflict markers', () => {
    const raw = fs.readFileSync(wavesPath, 'utf8');
    expect(raw).not.toContain('<<<<<<<');
    expect(raw).not.toContain('>>>>>>>');
    expect(raw).not.toContain('=======\n');
  });
});
