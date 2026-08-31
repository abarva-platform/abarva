#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  loadTenantNarrativeTerms,
  validateTenantNarrativeGuard,
} from './release-record-tenant-narrative-guard.mjs';

const REQUIRED_SECTIONS = [
  'Release ID',
  'Status',
  'Plain-English Summary',
  'Layer Impact',
  'Client Applicability',
  'Changes Included',
  'QA / Validation',
  'Rollout Plan',
  'Deployment Authority',
  'Rollback Plan',
  'Audit Evidence',
  'Known Gaps',
];

const RELEASE_RELEVANT_PATTERNS = [
  /^AGENTS\.md$/,
  /^package(-lock)?\.json$/,
  /^vercel\.(json|ts)$/,
  /^next\.config\./,
  /^src\//,
  /^scripts\//,
  /^supabase\/migrations\//,
  /^db\//,
  /^public\//,
  /^\.github\/workflows\//,
  /^\.github\/(PULL_REQUEST_TEMPLATE|pull_request_template)\.md$/,
  /^docs\/execution-kit\//,
  /^docs\/architecture\//,
  /^docs\/build\//,
  /^docs\/pilot\//,
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
    for (const file of staged ? staged.split('\n').filter(Boolean) : []) {
      files.add(file);
    }
    for (const file of unstaged ? unstaged.split('\n').filter(Boolean) : []) {
      files.add(file);
    }
    for (const file of untracked ? untracked.split('\n').filter(Boolean) : []) {
      files.add(file);
    }
  }

  return Array.from(files).sort();
}

function isReleaseRelevant(file) {
  if (file.startsWith('docs/releases/')) return false;
  return RELEASE_RELEVANT_PATTERNS.some((pattern) => pattern.test(file));
}

function sectionBody(markdown, section) {
  const lines = markdown.split('\n');
  const heading = `## ${section}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) return '';

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break;
    body.push(line);
  }

  return body.join('\n').trim();
}

function validateRecord(file, tenantNarrativeTerms) {
  const absolute = path.resolve(process.cwd(), file);
  if (!existsSync(absolute)) {
    return [`${file}: release record does not exist on disk.`];
  }

  const markdown = readFileSync(absolute, 'utf8');
  const errors = validateTenantNarrativeGuard(file, markdown, tenantNarrativeTerms);
  for (const section of REQUIRED_SECTIONS) {
    const body = sectionBody(markdown, section);
    if (!body) {
      errors.push(`${file}: missing or empty section "## ${section}".`);
      continue;
    }
    if (body.length < 20 && section !== 'Status') {
      errors.push(
        `${file}: section "## ${section}" is too thin; write a plain-English audit note.`,
      );
    }
  }

  const layerBody = sectionBody(markdown, 'Layer Impact');
  if (!/lane\b/.test(layerBody)) {
    errors.push(`${file}: Layer Impact must name the affected lane(s).`);
  }

  const validationBody = sectionBody(markdown, 'QA / Validation');
  if (!/(pass|passed|green|success|not run|blocked|failed)/i.test(validationBody)) {
    errors.push(
      `${file}: QA / Validation must state pass/fail/not-run/blocked status.`,
    );
  }

  const applicabilityBody = sectionBody(markdown, 'Client Applicability');
  if (!/(all clients|specific clients|internal only|public\/demo|feature flag|not applicable)/i.test(applicabilityBody)) {
    errors.push(
      `${file}: Client Applicability must state who receives the change.`,
    );
  }

  return errors;
}

const base =
  argValue('--base', process.env.GITHUB_BASE_SHA) ||
  process.env.GITHUB_BASE_REF ||
  'origin/main';
const head = argValue('--head', process.env.GITHUB_SHA || 'HEAD');
const files = changedFiles(base, head);
const relevant = files.filter(isReleaseRelevant);
const records = files.filter((file) => RELEASE_RECORD_PATTERN.test(file));

if (relevant.length === 0) {
  console.log('Release Control Gate: no release-relevant files changed.');
  process.exit(0);
}

if (records.length === 0) {
  console.error('Release Control Gate failed.');
  console.error('');
  console.error('Release-relevant files changed, but no release record was added or updated.');
  console.error('Add a markdown record under docs/releases/records/ using docs/releases/templates/release-record-template.md.');
  console.error('');
  console.error('Changed release-relevant files:');
  for (const file of relevant) console.error(`- ${file}`);
  process.exit(1);
}

const tenantNarrativeTerms = loadTenantNarrativeTerms();
const errors = records.flatMap((file) => validateRecord(file, tenantNarrativeTerms));
if (errors.length > 0) {
  console.error('Release Control Gate failed.');
  console.error('');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Release Control Gate passed.');
console.log(`Release-relevant files: ${relevant.length}`);
console.log(`Release records: ${records.join(', ')}`);
