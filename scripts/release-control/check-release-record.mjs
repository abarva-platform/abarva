#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  loadReleaseLanes,
  validateLayerImpactLane,
} from './release-record-lane-guard.mjs';
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
const RELEASE_RECORD_TEMPLATE_PATH = path.join(
  process.cwd(),
  'docs/releases/templates/release-record-template.md',
);

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

function validateReleaseRecordTemplate() {
  if (!existsSync(RELEASE_RECORD_TEMPLATE_PATH)) {
    return ['release record template is missing'];
  }

  const markdown = readFileSync(RELEASE_RECORD_TEMPLATE_PATH, 'utf8');
  const headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
  const required = new Set(REQUIRED_SECTIONS);
  const present = new Set(headings);
  const problems = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!present.has(section)) {
      problems.push(`missing required section "## ${section}"`);
    }
  }
  for (const section of headings) {
    if (!required.has(section)) {
      problems.push(`unexpected section "## ${section}"`);
    }
  }
  if (
    headings.length === REQUIRED_SECTIONS.length &&
    headings.some((section, index) => section !== REQUIRED_SECTIONS[index])
  ) {
    problems.push('required section order does not match the release gate');
  }

  return problems;
}

function validateRecord(file, tenantNarrativeTerms, releaseLanes) {
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

  // `/lane\b/` used to stand in for this. It is satisfied by the substring inside
  // `plane`, so "Data plane: no schema changes" passed a check meant to require a
  // release lane, while `internal-admin`, `public-demo` and `experimental` — three
  // of the five lanes AGENTS.md declares — were refused for not containing the word.
  const layerBody = sectionBody(markdown, 'Layer Impact');
  errors.push(...validateLayerImpactLane(file, layerBody, releaseLanes));

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

const templateProblems = validateReleaseRecordTemplate();
if (templateProblems.length > 0) {
  console.error('Release record template contract failed.');
  for (const problem of templateProblems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log('Release record template contract passed.');

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
const releaseLanes = loadReleaseLanes();
const errors = records.flatMap((file) =>
  validateRecord(file, tenantNarrativeTerms, releaseLanes),
);
if (errors.length > 0) {
  console.error('Release Control Gate failed.');
  console.error('');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Release Control Gate passed.');
console.log(`Release-relevant files: ${relevant.length}`);
console.log(`Release records: ${records.join(', ')}`);
