#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const CLIENT_DATA_SIDELOAD_PATTERNS = [
  /^scripts\/seed\/.+\.(mjs|ts|js)$/,
  /^src\/scripts\/seed\/.+\.(mjs|ts|js)$/,
  /^src\/scripts\/setup-data\/load-.+\.(mjs|ts|js)$/,
  /^scripts\/corpus-generation\/load-.+\.(mjs|ts|js)$/,
  /^scripts\/skyharbor\/generate-.+\.(mjs|ts|js)$/,
  /^src\/data\/(apexretail|meridian|skyharbor|firstcapital)\/.+\.(ts|js|json|jsonl)$/,
];

const EXCEPTION_MARKERS = [
  'pilot-data-loader-exception: static-test-fixture',
  'pilot-data-loader-exception: global-static-corpus',
];

const RELEASE_RECORD_PATTERN = /^docs\/releases\/records\/[^/]+\.md$/;

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function changedFiles(base, head) {
  const files = new Set();
  const diff = runGit(['diff', '--name-only', `${base}...${head}`]);
  for (const file of diff ? diff.split('\n').filter(Boolean) : []) {
    files.add(file);
  }

  if (head === 'HEAD') {
    const staged = runGit(['diff', '--cached', '--name-only']);
    const unstaged = runGit(['diff', '--name-only']);
    const untracked = runGit(['ls-files', '--others', '--exclude-standard']);
    for (const file of staged ? staged.split('\n').filter(Boolean) : []) files.add(file);
    for (const file of unstaged ? unstaged.split('\n').filter(Boolean) : []) files.add(file);
    for (const file of untracked ? untracked.split('\n').filter(Boolean) : []) files.add(file);
  }

  return Array.from(files).sort();
}

function isPotentialSideLoad(file) {
  return CLIENT_DATA_SIDELOAD_PATTERNS.some((pattern) => pattern.test(file));
}

function fileText(file) {
  const absolute = path.resolve(process.cwd(), file);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
}

function hasStaticException(file) {
  const text = fileText(file);
  return EXCEPTION_MARKERS.some((marker) => text.includes(marker));
}

function releaseRecordMentionsLoaderPolicy(records) {
  return records.some((record) => {
    const text = fileText(record).toLowerCase();
    return (
      text.includes('admin data loader') &&
      text.includes('no side-load') &&
      (text.includes('data_ingestion_runs') || text.includes('pilot_ingestion'))
    );
  });
}

const base =
  argValue('--base', process.env.GITHUB_BASE_SHA) ||
  process.env.GITHUB_BASE_REF ||
  'origin/main';
const head = argValue('--head', process.env.GITHUB_SHA || 'HEAD');

const files = changedFiles(base, head);
const candidates = files.filter(isPotentialSideLoad).filter((file) => !hasStaticException(file));

if (candidates.length === 0) {
  console.log('Pilot Data Loader Gate passed.');
  process.exit(0);
}

const records = files.filter((file) => RELEASE_RECORD_PATTERN.test(file));
if (releaseRecordMentionsLoaderPolicy(records)) {
  console.log('Pilot Data Loader Gate passed with documented loader-backed exception.');
  console.log(`Potential side-load files: ${candidates.join(', ')}`);
  process.exit(0);
}

console.error('Pilot Data Loader Gate failed.');
console.error('');
console.error(
  'New client/pilot data must enter through the Admin Data Loader or a loader-backed ingestion path that records data_ingestion_runs / pilot_ingestion audit evidence.',
);
console.error(
  'Do not add seed side-loads for pilot data. If the Admin loader cannot handle the dimension or file type, enhance the loader first.',
);
console.error('');
console.error('Potential client-data side-load files:');
for (const file of candidates) console.error(`- ${file}`);
console.error('');
console.error('Allowed exceptions must be explicit static assets, not pilot client data:');
for (const marker of EXCEPTION_MARKERS) console.error(`- ${marker}`);
console.error('');
console.error(
  'For true loader-backed ingestion changes, add/update a release record that mentions Admin Data Loader, no side-load, and the ingestion ledger used.',
);
process.exit(1);
