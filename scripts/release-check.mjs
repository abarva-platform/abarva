import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const args = process.argv.slice(2);
const baseIndex = args.indexOf('--base');
const headIndex = args.indexOf('--head');
const base = baseIndex >= 0 ? args[baseIndex + 1] : 'origin/main';
const head = headIndex >= 0 ? args[headIndex + 1] : 'HEAD';

function git(argsForGit) {
  return execFileSync('git', argsForGit, { encoding: 'utf8' }).trim();
}

const changedFiles = git(['diff', '--name-only', base, head])
  .split('\n')
  .filter(Boolean);

const touchesReleaseNotedArea = changedFiles.some((file) =>
  file.startsWith('datasets/'),
);

if (!touchesReleaseNotedArea) {
  console.log('release:check passed - no release-noted areas changed.');
  process.exit(0);
}

const releaseNotes = changedFiles.filter((file) =>
  file.startsWith('docs/releases/') && file.endsWith('.md'),
);

if (releaseNotes.length === 0) {
  console.error('release:check failed - datasets changes require a docs/releases/*.md impact note.');
  process.exit(1);
}

for (const notePath of releaseNotes) {
  const body = fs.readFileSync(notePath, 'utf8');
  for (const required of ['Impact', 'Validation', 'Scope']) {
    if (!body.includes(`## ${required}`)) {
      console.error(`release:check failed - ${notePath} missing ## ${required}`);
      process.exit(1);
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  releaseNotes,
  changedFiles: changedFiles.length,
}, null, 2));
