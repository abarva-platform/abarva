// OPS5 - Integration cherry-pick field-merge helper tests.
//
// Spawns the production Python helper at scripts/integration/cherry_resolve.py
// against synthetic fixtures in a per-test tmpdir. The script's fixture-mode
// flags (--src-build-slices / --src-readiness / --src-waves /
// --main-readiness) keep these tests entirely git-free, network-free, and
// model-free.

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SCRIPT_PATH = path.join(
  REPO_ROOT,
  'scripts',
  'integration',
  'cherry_resolve.py',
);

interface SpawnResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runScript(args: string[], cwd: string): SpawnResult {
  try {
    const stdout = execFileSync('python3', [SCRIPT_PATH, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as {
      status?: number | null;
      stdout?: Buffer | string;
      stderr?: Buffer | string;
    };
    return {
      status: typeof e.status === 'number' ? e.status : null,
      stdout: e.stdout ? e.stdout.toString() : '',
      stderr: e.stderr ? e.stderr.toString() : '',
    };
  }
}

function makeFixtureDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ops5-cherry-resolve-'));
  fs.mkdirSync(path.join(dir, 'docs', 'build'), { recursive: true });
  return dir;
}

interface ReadinessComponent {
  id: string;
  name: string;
  status: string;
  notes: string[];
  blockers: Array<{ id?: string; description?: string }>;
  nextAction: string;
}

interface ReadinessDoc {
  schemaVersion: number;
  lastUpdated: string;
  components: ReadinessComponent[];
}

interface SlicesDoc {
  schemaVersion: number;
  lastUpdated: string;
  slices: Array<{ id: string; name: string; status: string }>;
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function baseSlicesDoc(): SlicesDoc {
  return {
    schemaVersion: 1,
    lastUpdated: '2026-04-25',
    slices: [
      { id: 'A1', name: 'alpha', status: 'code_complete' },
      { id: 'B2', name: 'beta', status: 'tested' },
    ],
  };
}

function baseReadinessDoc(): ReadinessDoc {
  return {
    schemaVersion: 1,
    lastUpdated: '2026-04-25',
    components: [
      {
        id: 'validation_qa',
        name: 'Validation / QA',
        status: 'tested',
        notes: ['baseline note'],
        blockers: [{ id: 'BLK-A', description: 'A blocker' }],
        nextAction: 'do A',
      },
      {
        id: 'production_deployment',
        name: 'Production deployment',
        status: 'blocked',
        notes: ['deploy baseline'],
        blockers: [],
        nextAction: 'wait for CI',
      },
    ],
  };
}

interface Fixture {
  dir: string;
  bsPath: string;
  prtPath: string;
  bsSrcPath: string;
  prtSrcPath: string;
  prtMainPath: string;
}

function setupFixture(opts: {
  head?: { slices?: SlicesDoc; readiness?: ReadinessDoc };
  src?: { slices: SlicesDoc; readiness: ReadinessDoc };
  main?: { readiness?: ReadinessDoc };
}): Fixture {
  const dir = makeFixtureDir();
  const bsPath = path.join(dir, 'docs', 'build', 'build-slices.json');
  const prtPath = path.join(dir, 'docs', 'build', 'production-readiness.json');
  const bsSrcPath = path.join(dir, 'src-build-slices.json');
  const prtSrcPath = path.join(dir, 'src-readiness.json');
  const prtMainPath = path.join(dir, 'main-readiness.json');

  writeJson(bsPath, opts.head?.slices ?? baseSlicesDoc());
  writeJson(prtPath, opts.head?.readiness ?? baseReadinessDoc());
  if (opts.src) {
    writeJson(bsSrcPath, opts.src.slices);
    writeJson(prtSrcPath, opts.src.readiness);
  }
  if (opts.main?.readiness) {
    writeJson(prtMainPath, opts.main.readiness);
  } else {
    writeJson(prtMainPath, baseReadinessDoc());
  }

  return { dir, bsPath, prtPath, bsSrcPath, prtSrcPath, prtMainPath };
}

function defaultFixtureArgs(fx: Fixture): string[] {
  return [
    '--repo-root',
    fx.dir,
    '--src-build-slices',
    fx.bsSrcPath,
    '--src-readiness',
    fx.prtSrcPath,
    '--main-readiness',
    fx.prtMainPath,
    '--date',
    '2026-04-26',
    '--main-ref',
    'main',
  ];
}

// ---------------------------------------------------------------------------
// --help and CLI surface
// ---------------------------------------------------------------------------

describe('cherry_resolve.py · CLI surface', () => {
  it('prints usage on --help and exits 0', () => {
    const res = runScript(['--help'], REPO_ROOT);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/usage:/);
    expect(res.stdout).toMatch(/CHERRY_SHA/);
    expect(res.stdout).toMatch(/SLICE_ID/);
    expect(res.stdout).toMatch(/--dry-run/);
    expect(res.stdout).toMatch(/--summary-json/);
  });

  it('prints usage on -h and exits 0', () => {
    const res = runScript(['-h'], REPO_ROOT);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/usage:/);
  });
});

// ---------------------------------------------------------------------------
// build-slices.json: duplicate prevention
// ---------------------------------------------------------------------------

describe('cherry_resolve.py · build-slices duplicate prevention', () => {
  it('does not append a slice that already exists in HEAD', () => {
    const headSlices = baseSlicesDoc();
    headSlices.slices.push({
      id: 'OPS5',
      name: 'integration helper',
      status: 'code_complete',
    });
    const srcSlices: SlicesDoc = {
      schemaVersion: 1,
      lastUpdated: '2026-04-25',
      slices: [
        {
          id: 'OPS5',
          name: 'integration helper',
          status: 'code_complete',
        },
      ],
    };
    const fx = setupFixture({
      head: { slices: headSlices },
      src: { slices: srcSlices, readiness: baseReadinessDoc() },
    });
    const res = runScript(
      ['DEADBEEF', 'OPS5', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    const after = readJson<SlicesDoc>(fx.bsPath);
    const ids = after.slices.map((s) => s.id);
    expect(ids.filter((x) => x === 'OPS5')).toHaveLength(1);
  });

  it('appends a new slice when not present in HEAD', () => {
    const srcSlices: SlicesDoc = {
      schemaVersion: 1,
      lastUpdated: '2026-04-25',
      slices: [
        {
          id: 'OPS5',
          name: 'integration helper',
          status: 'code_complete',
        },
      ],
    };
    const fx = setupFixture({
      src: { slices: srcSlices, readiness: baseReadinessDoc() },
    });
    const res = runScript(
      ['DEADBEEF', 'OPS5', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    const after = readJson<SlicesDoc>(fx.bsPath);
    expect(after.slices.map((s) => s.id)).toContain('OPS5');
    expect(after.lastUpdated).toBe('2026-04-26');
  });
});

// ---------------------------------------------------------------------------
// production-readiness: conservative status / blockers / notes / nextAction
// ---------------------------------------------------------------------------

describe('cherry_resolve.py · production-readiness conservative merge', () => {
  it('keeps HEAD status when src has higher rank', () => {
    const head = baseReadinessDoc(); // validation_qa: tested
    const main = baseReadinessDoc();
    const src = baseReadinessDoc();
    // Force src to look "more ready" than HEAD; merger must keep HEAD.
    src.components.find((c) => c.id === 'validation_qa')!.status =
      'full_flow_ready';
    // Make src diverge from main so the iteration triggers merge logic
    src.components.find((c) => c.id === 'validation_qa')!.notes.push('src note');
    const fx = setupFixture({
      head: { readiness: head },
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'X', name: 'x', status: 'code_complete' }],
        },
        readiness: src,
      },
      main: { readiness: main },
    });
    const res = runScript(
      ['DEADBEEF', 'X', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    const after = readJson<ReadinessDoc>(fx.prtPath);
    const vq = after.components.find((c) => c.id === 'validation_qa')!;
    expect(vq.status).toBe('tested');
  });

  it('demotes HEAD when src has strictly lower rank (conservative)', () => {
    const head = baseReadinessDoc();
    const main = baseReadinessDoc();
    const src = baseReadinessDoc();
    // src reports code_complete; HEAD has tested. Conservative -> code_complete.
    src.components.find((c) => c.id === 'validation_qa')!.status =
      'code_complete';
    src.components
      .find((c) => c.id === 'validation_qa')!
      .notes.push('src demotion signal');
    const fx = setupFixture({
      head: { readiness: head },
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'X', name: 'x', status: 'code_complete' }],
        },
        readiness: src,
      },
      main: { readiness: main },
    });
    const res = runScript(
      ['DEADBEEF', 'X', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    const after = readJson<ReadinessDoc>(fx.prtPath);
    const vq = after.components.find((c) => c.id === 'validation_qa')!;
    expect(vq.status).toBe('code_complete');
  });

  it('UNIONs blockers across HEAD and src by id', () => {
    const head = baseReadinessDoc();
    const main = baseReadinessDoc();
    // HEAD already has BLK-A; give src a BLK-B and the existing BLK-A.
    const src = baseReadinessDoc();
    src.components.find((c) => c.id === 'validation_qa')!.blockers = [
      { id: 'BLK-A', description: 'A blocker' },
      { id: 'BLK-B', description: 'B blocker' },
    ];
    const fx = setupFixture({
      head: { readiness: head },
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'X', name: 'x', status: 'code_complete' }],
        },
        readiness: src,
      },
      main: { readiness: main },
    });
    const res = runScript(
      ['DEADBEEF', 'X', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    const after = readJson<ReadinessDoc>(fx.prtPath);
    const vq = after.components.find((c) => c.id === 'validation_qa')!;
    const blockerIds = vq.blockers.map((b) => b.id);
    expect(blockerIds).toEqual(expect.arrayContaining(['BLK-A', 'BLK-B']));
    expect(blockerIds.filter((id) => id === 'BLK-A')).toHaveLength(1);
  });

  it('UNIONs notes without dupes', () => {
    const head = baseReadinessDoc();
    head.components.find((c) => c.id === 'validation_qa')!.notes = [
      'shared',
      'head-only',
    ];
    const main = baseReadinessDoc();
    const src = baseReadinessDoc();
    src.components.find((c) => c.id === 'validation_qa')!.notes = [
      'shared',
      'src-only',
    ];
    const fx = setupFixture({
      head: { readiness: head },
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'X', name: 'x', status: 'code_complete' }],
        },
        readiness: src,
      },
      main: { readiness: main },
    });
    const res = runScript(
      ['DEADBEEF', 'X', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    const after = readJson<ReadinessDoc>(fx.prtPath);
    const vq = after.components.find((c) => c.id === 'validation_qa')!;
    expect(vq.notes.filter((n) => n === 'shared')).toHaveLength(1);
    expect(vq.notes).toEqual(expect.arrayContaining(['shared', 'head-only', 'src-only']));
  });

  it('append-distincts nextAction when both diverged from main', () => {
    const head = baseReadinessDoc();
    head.components.find((c) => c.id === 'validation_qa')!.nextAction =
      'HEAD diverged action';
    const main = baseReadinessDoc(); // main keeps "do A"
    const src = baseReadinessDoc();
    src.components.find((c) => c.id === 'validation_qa')!.nextAction =
      'SRC diverged action';
    const fx = setupFixture({
      head: { readiness: head },
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'X', name: 'x', status: 'code_complete' }],
        },
        readiness: src,
      },
      main: { readiness: main },
    });
    const res = runScript(
      ['DEADBEEF', 'X', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    const after = readJson<ReadinessDoc>(fx.prtPath);
    const vq = after.components.find((c) => c.id === 'validation_qa')!;
    expect(vq.nextAction).toContain('HEAD diverged action');
    expect(vq.nextAction).toContain('SRC diverged action');
  });
});

// ---------------------------------------------------------------------------
// Defensive behaviors
// ---------------------------------------------------------------------------

describe('cherry_resolve.py · defensive behaviors', () => {
  it('fails with exit 3 on malformed JSON in HEAD readiness', () => {
    const fx = setupFixture({
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'X', name: 'x', status: 'code_complete' }],
        },
        readiness: baseReadinessDoc(),
      },
    });
    fs.writeFileSync(fx.prtPath, '{ this is not json', 'utf8');
    const res = runScript(
      ['DEADBEEF', 'X', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(3);
    expect(res.stderr).toMatch(/malformed JSON/);
  });

  it('--dry-run does not mutate files on disk', () => {
    const headSlices = baseSlicesDoc();
    const headPrt = baseReadinessDoc();
    const fx = setupFixture({
      head: { slices: headSlices, readiness: headPrt },
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'NEW1', name: 'new', status: 'code_complete' }],
        },
        readiness: (() => {
          const r = baseReadinessDoc();
          r.components.find((c) => c.id === 'validation_qa')!.notes.push(
            'src-side note that should NOT be persisted',
          );
          return r;
        })(),
      },
    });
    const beforeBs = fs.readFileSync(fx.bsPath, 'utf8');
    const beforePrt = fs.readFileSync(fx.prtPath, 'utf8');
    const res = runScript(
      ['DEADBEEF', 'NEW1', '--dry-run', ...defaultFixtureArgs(fx)],
      fx.dir,
    );
    expect(res.status).toBe(0);
    expect(fs.readFileSync(fx.bsPath, 'utf8')).toBe(beforeBs);
    expect(fs.readFileSync(fx.prtPath, 'utf8')).toBe(beforePrt);
    expect(res.stdout).toMatch(/dry-run/);
  });

  it('--summary-json emits valid JSON with the expected shape', () => {
    const fx = setupFixture({
      src: {
        slices: {
          schemaVersion: 1,
          lastUpdated: '2026-04-25',
          slices: [{ id: 'NEW1', name: 'new', status: 'code_complete' }],
        },
        readiness: baseReadinessDoc(),
      },
    });
    const res = runScript(
      [
        'DEADBEEF',
        'NEW1',
        '--summary-json',
        '--dry-run',
        ...defaultFixtureArgs(fx),
      ],
      fx.dir,
    );
    expect(res.status).toBe(0);
    let parsed: Record<string, unknown> = {};
    expect(() => {
      parsed = JSON.parse(res.stdout);
    }).not.toThrow();
    expect(parsed.cherry_sha).toBe('DEADBEEF');
    expect(parsed.slice_id).toBe('NEW1');
    expect(parsed.dry_run).toBe(true);
    expect(parsed.build_slices).toBeDefined();
    expect(parsed.production_readiness).toBeDefined();
  });
});
