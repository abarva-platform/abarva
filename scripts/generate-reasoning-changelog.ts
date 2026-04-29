// Reasoning changelog generator.
//
// Runs `git log` filtered to reasoning-layer commits, parses the
// output through `@/lib/reasoning/changelog-parser`, and writes a
// committed JSON fixture at
// `src/lib/reasoning/generated/changelog.json`.
//
// This is invoked manually (or periodically) — there is intentionally
// no build hook. Re-run the script and commit the resulting JSON
// whenever you want the changelog page to reflect new reasoning PRs.
//
// Run with:
//   npx tsx scripts/generate-reasoning-changelog.ts

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  parseReasoningCommitLog,
  type ReasoningChangelog,
} from '../src/lib/reasoning/changelog-parser';

const REPO_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(
  REPO_ROOT,
  'src/lib/reasoning/generated/changelog.json',
);

function runGitLog(): string {
  // `--grep "(reasoning)"` matches feat / fix / refactor / docs / chore
  // commits with `(reasoning)` in the conventional-commit scope. The
  // wider grep is intentional — fixes and docs belong on the changelog
  // alongside features.
  return execFileSync(
    'git',
    [
      '-c',
      'core.pager=cat',
      'log',
      '--grep',
      '(reasoning)',
      '--pretty=format:%H|%s|%an|%aI',
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    },
  );
}

function main(): void {
  const raw = runGitLog();
  const entries = parseReasoningCommitLog(raw);
  const payload: ReasoningChangelog = {
    generatedAt: new Date().toISOString(),
    entries,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(
    `[reasoning-changelog] wrote ${entries.length} entries to ${OUTPUT_PATH}`,
  );
}

main();
