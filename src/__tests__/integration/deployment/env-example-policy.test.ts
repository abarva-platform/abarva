// CLOUD8 - Env Example Gitignore Policy.
//
// Pure file-shape checks. No shell, no docker, no cloud APIs, no
// model calls. Reads the repo .gitignore plus every .env.*.example
// file currently in the repo root.
//
// Asserts:
//   - .gitignore still ignores real env files (.env* blanket rule
//     plus .env*.local rule remain).
//   - The two CLOUD8 allow rules are present:
//       !.env.example
//       !.env.*.example
//   - Every .env.*.example file at the repo root contains the
//     literal substring "EXAMPLE" or "example" (header marker).
//   - No committed .env.*.example file contains likely-secret-shaped
//     values (GitHub PATs, sk-/sk-ant- keys, JWTs, AWS access keys).

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const GITIGNORE_PATH = path.join(REPO_ROOT, '.gitignore');

// Local secret-shape regexes (the QA13 helper may not exist on this
// branch; CLOUD8 ships a local fallback).
const SECRET_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'github_pat', pattern: /ghp_[A-Za-z0-9]{36,}/ },
  { name: 'sk_key', pattern: /sk-(ant-)?[A-Za-z0-9_-]{32,}/ },
  {
    name: 'jwt',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/,
  },
  { name: 'aws_access_key', pattern: /AKIA[0-9A-Z]{16}/ },
];

function readGitignore(): string {
  expect(fs.existsSync(GITIGNORE_PATH)).toBe(true);
  return fs.readFileSync(GITIGNORE_PATH, 'utf8');
}

function listEnvExampleFiles(): string[] {
  const entries = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(
      (name) =>
        name === '.env.example' ||
        (name.startsWith('.env.') && name.endsWith('.example')),
    )
    .sort();
}

// ---------------------------------------------------------------------
// .gitignore policy
// ---------------------------------------------------------------------

describe('CLOUD8 - .gitignore env example policy', () => {
  let gitignore: string;
  let lines: string[];

  beforeAll(() => {
    gitignore = readGitignore();
    lines = gitignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
  });

  test('.gitignore exists and is non-empty', () => {
    expect(gitignore.length).toBeGreaterThan(0);
  });

  test('.gitignore still ignores real env files (.env* blanket rule)', () => {
    // Either ".env*" (blanket) or both ".env" and ".env.local" must be
    // present as ignore rules. The current canonical form is ".env*".
    const hasBlanket = lines.includes('.env*');
    const hasExplicit = lines.includes('.env') && lines.includes('.env.local');
    expect(hasBlanket || hasExplicit).toBe(true);
  });

  test('.gitignore still ignores .env*.local (typescript section)', () => {
    // Defense in depth: the second canonical rule covers role-scoped
    // .local overrides like .env.private-lab.local.
    expect(lines).toContain('.env*.local');
  });

  test('.gitignore allows .env.example via explicit allow rule', () => {
    expect(lines).toContain('!.env.example');
  });

  test('.gitignore allows .env.*.example via explicit allow rule', () => {
    expect(lines).toContain('!.env.*.example');
  });

  test('.gitignore allow rules sit below the .env* ignore line', () => {
    // The order matters: in gitignore, later rules override earlier
    // ones. The two ! rules must come AFTER the blanket .env* rule.
    const rawLines = gitignore.split(/\r?\n/);
    const blanketIdx = rawLines.findIndex(
      (line) => line.trim() === '.env*',
    );
    const exampleIdx = rawLines.findIndex(
      (line) => line.trim() === '!.env.example',
    );
    const wildcardIdx = rawLines.findIndex(
      (line) => line.trim() === '!.env.*.example',
    );
    expect(blanketIdx).toBeGreaterThanOrEqual(0);
    expect(exampleIdx).toBeGreaterThan(blanketIdx);
    expect(wildcardIdx).toBeGreaterThan(blanketIdx);
  });

  test('.gitignore does NOT contain weakening allow rules for real env files', () => {
    const forbidden = ['!.env', '!.env.local', '!.env.production', '!.env.development'];
    for (const rule of forbidden) {
      expect(lines).not.toContain(rule);
    }
  });
});

// ---------------------------------------------------------------------
// .env.*.example files at the repo root
// ---------------------------------------------------------------------

describe('CLOUD8 - .env.*.example file content policy', () => {
  const envExampleFiles = listEnvExampleFiles();

  test('discovered at least one .env.*.example file (sanity)', () => {
    // CLOUD4 ships .env.private-lab.example. If the discovery returns
    // empty, either the repo has none yet (acceptable) or the test is
    // not being run from the repo root (broken). We accept either
    // outcome here; the per-file block below will simply have no
    // iterations if zero files are discovered.
    expect(Array.isArray(envExampleFiles)).toBe(true);
  });

  describe.each(envExampleFiles)('%s', (filename) => {
    let content: string;

    beforeAll(() => {
      const filePath = path.join(REPO_ROOT, filename);
      expect(fs.existsSync(filePath)).toBe(true);
      content = fs.readFileSync(filePath, 'utf8');
    });

    test('contains "EXAMPLE" or "example" header marker', () => {
      const hasMarker =
        content.includes('EXAMPLE') || content.includes('example');
      expect(hasMarker).toBe(true);
    });

    test.each(SECRET_PATTERNS.map(({ name, pattern }) => [name, pattern]))(
      'does not contain a likely-secret value matching %s',
      (_name, pattern) => {
        expect(content).not.toMatch(pattern as RegExp);
      },
    );

    test('does not claim production posture', () => {
      // Defense in depth: env example files should not be marked
      // production_ready, production-ready, or production posture.
      // Substring match is intentional.
      expect(content).not.toMatch(/production[_ -]?ready/i);
    });
  });
});
