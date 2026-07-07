#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const REQUIRED_MARKERS = [
  {
    file: 'AGENTS.md',
    markers: [
      'Deployment authority and runtime invariant',
      'Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web traffic',
      'ACA web and worker runtimes must use digest-pinned images',
      'ACR build and registry policy',
      'acrabarvalab001',
      'cache-from: type=gha',
      'cache-to: type=gha,mode=max',
    ],
  },
  {
    file: '.github/PULL_REQUEST_TEMPLATE.md',
    markers: [
      'Deployment Authority If Applicable',
      'ACA template image',
      'Live signed-in client proof',
      'ACR / Build Policy If Applicable',
      'ACR Premium',
    ],
  },
  {
    file: 'docs/releases/templates/release-record-template.md',
    markers: [
      'Deployment Authority',
      'Repo-owned deploy workflow',
      'ACA runtime invariant',
    ],
  },
  {
    file: 'docs/runbooks/deploy-authority-and-runtime-invariant.md',
    markers: [
      'Deploy Authority And Runtime Invariant',
      'Allowed Shared-Runtime Mutator',
      'Forbidden Pattern',
      'Proof Bundle',
      'ACR Build And Registry Policy',
      'GitHub Actions cache',
      'Prune Safety',
    ],
  },
  {
    file: '.github/workflows/aca-main-deploy.yml',
    markers: [
      'Assert main deploy authority',
      'Assert ACR registry policy',
      'docker/setup-buildx-action@v3',
      'docker/build-push-action@v6',
      'cache-from: type=gha',
      'cache-to: type=gha,mode=max',
      'Verify ACA runtime invariant',
      'Refusing to shift shared runtime traffic to non-main revision name',
      'origin/main HEAD only',
    ],
  },
  {
    file: '.github/workflows/aca-runtime-drift-monitor.yml',
    markers: [
      'ACA runtime drift monitor',
      'Check live runtime invariant',
      'scripts/deploy/check-aca-runtime-invariant.mjs',
    ],
  },
  {
    file: 'scripts/deploy/check-aca-runtime-invariant.mjs',
    markers: [
      'FORBIDDEN_TAG_PREFIXES',
      'Active digest must have a main-<sha> ACR tag',
      '100% traffic revision must be a main revision',
    ],
  },
  {
    file: 'scripts/deploy/update-worker-jobs.sh',
    markers: [
      'must be pinned by digest',
      'ALLOW_MUTABLE_ACA_IMAGE',
    ],
  },
];

const SCANNED_CHANGED_PATHS = [
  /^\.github\/workflows\/.+\.(ya?ml)$/,
  /^scripts\/.+\.(mjs|js|cjs|ts|tsx|sh)$/,
  /^infra\/azure\/.+\.(bicep|bicepparam|json|ya?ml)$/,
  /^docs\/azure\/.+\.(md|json)$/,
  /^docs\/runbooks\/.+\.md$/,
];

const RELEASE_RECORD_PATTERN = /^docs\/releases\/records\/[^/]+\.md$/;
const EXCEPTION_MARKER = 'deploy-authority-exception:';
const ACR_PRUNE_APPROVAL_MARKER = 'acr-prune-approved:';
const ACR_PRUNE_UNTAGGED_APPROVAL_MARKER = 'acr-prune-untagged-approved:';
const PATH_ALLOWLIST = new Set([
  'scripts/release-control/check-deploy-authority-policy.mjs',
  'scripts/deploy/check-aca-runtime-invariant.mjs',
]);

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
  for (const file of diff ? diff.split('\n').filter(Boolean) : []) files.add(file);

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

function fileText(file) {
  const absolute = path.resolve(process.cwd(), file);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
}

function lineHasException(lines, index) {
  const window = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3));
  return window.some((line) => line.includes(EXCEPTION_MARKER));
}

function nearbyText(lines, index, before = 3, after = 8) {
  return lines.slice(Math.max(0, index - before), Math.min(lines.length, index + after)).join('\n');
}

function scanAzContainerAppUpdate(file, text) {
  const errors = [];
  if (PATH_ALLOWLIST.has(file)) return errors;
  const lines = text.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/\baz\s+containerapp\s+update\b/.test(line)) continue;
    if (lineHasException(lines, index)) continue;

    const commandWindow = lines.slice(index, Math.min(lines.length, index + 12)).join('\n');
    const hasPinnedLiteral = /--image\s+["']?[^"'\s]*@sha256:/m.test(commandWindow);
    const hasApprovedImageVariable = /--image\s+["']?\$(APPROVED_IMAGE|IMAGE)\b/m.test(commandWindow);
    const hasWorkflowDigestOutput = /--image\s+["']?\$\{\{\s*steps\.image\.outputs\.image\s*\}\}/m.test(commandWindow);
    if (!hasPinnedLiteral && !hasApprovedImageVariable && !hasWorkflowDigestOutput) {
      errors.push(
        `${file}:${index + 1}: az containerapp update must include a digest-pinned --image so env-only changes cannot mint a stale-image revision.`,
      );
    }
  }

  return errors;
}

function scanAzContainerAppTrafficSet(file, text) {
  const errors = [];
  if (PATH_ALLOWLIST.has(file)) return errors;
  const lines = text.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/\baz\s+containerapp\s+ingress\s+traffic\s+set\b/.test(line)) continue;
    if (lineHasException(lines, index)) continue;
    if (file === '.github/workflows/aca-main-deploy.yml') continue;

    errors.push(
      `${file}:${index + 1}: shared ACA traffic can only be shifted by .github/workflows/aca-main-deploy.yml.`,
    );
  }

  return errors;
}

function scanAzAcrBuild(file, text) {
  const errors = [];
  if (PATH_ALLOWLIST.has(file)) return errors;
  const lines = text.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/\baz\s+acr\s+build\b/.test(line)) continue;
    if (lineHasException(lines, index)) continue;

    errors.push(
      `${file}:${index + 1}: shared web images must use the repo-owned Docker Buildx cache workflow, not ad-hoc az acr build.`,
    );
  }

  return errors;
}

function scanMutableAbarvaRuntimeImages(file, text) {
  const errors = [];
  const lines = text.split('\n');
  const imagePattern = /acrabarvalab001\.azurecr\.io\/abarva\/web:(?!main-\$\{\{ steps\.release\.outputs\.short_sha \}\})[A-Za-z0-9._-]+/;

  lines.forEach((line, index) => {
    if (!imagePattern.test(line)) return;
    if (lineHasException(lines, index)) return;
    if (/az acr build\b/.test(line)) return;
    errors.push(
      `${file}:${index + 1}: AbarVa ACA runtime image references must be digest-pinned, not mutable tags.`,
    );
  });

  return errors;
}

function scanDockerBuildxCache(file, text) {
  const errors = [];
  if (!/^\.github\/workflows\/.+\.ya?ml$/.test(file)) return errors;
  if (!text.includes('docker/build-push-action')) return errors;

  const buildsAbarvaWeb =
    text.includes('IMAGE_REPOSITORY') ||
    text.includes('abarva/web') ||
    text.includes('acrabarvalab001.azurecr.io');
  if (!buildsAbarvaWeb) return errors;

  if (!text.includes('cache-from: type=gha')) {
    errors.push(`${file}: Docker Buildx AbarVa web builds must include cache-from: type=gha.`);
  }
  if (!text.includes('cache-to: type=gha,mode=max')) {
    errors.push(`${file}: Docker Buildx AbarVa web builds must include cache-to: type=gha,mode=max.`);
  }

  return errors;
}

function scanAcrPrune(file, text) {
  const errors = [];
  if (PATH_ALLOWLIST.has(file)) return errors;
  const lines = text.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/\bacr\s+purge\b/.test(line)) continue;
    if (lineHasException(lines, index)) continue;

    const window = nearbyText(lines, index);
    if (window.includes('--untagged') && !window.includes(ACR_PRUNE_UNTAGGED_APPROVAL_MARKER)) {
      errors.push(
        `${file}:${index + 1}: acr purge --untagged can delete digest-pinned rollback images; add a named ${ACR_PRUNE_UNTAGGED_APPROVAL_MARKER} approval or remove --untagged.`,
      );
    }

    const hasDryRun = window.includes('--dry-run');
    const hasApproval =
      window.includes(ACR_PRUNE_APPROVAL_MARKER) || window.includes('ACR_PURGE_APPROVED=true');
    if (!hasDryRun && !hasApproval) {
      errors.push(
        `${file}:${index + 1}: acr purge must be dry-run first or carry ACR_PURGE_APPROVED=true with a documented ${ACR_PRUNE_APPROVAL_MARKER} note.`,
      );
    }
  }

  return errors;
}

function releaseRecordMentionsDeployAuthority(records) {
  return records.some((record) => {
    const text = fileText(record).toLowerCase();
    return (
      text.includes('deployment authority') &&
      text.includes('aca runtime invariant') &&
      text.includes('repo-owned deploy workflow') &&
      text.includes('acr build')
    );
  });
}

const errors = [];

for (const requirement of REQUIRED_MARKERS) {
  const text = fileText(requirement.file);
  if (!text) {
    errors.push(`${requirement.file}: required deploy-authority file is missing.`);
    continue;
  }
  for (const marker of requirement.markers) {
    if (!text.includes(marker)) {
      errors.push(`${requirement.file}: missing required deploy-authority marker "${marker}".`);
    }
  }
}

const base =
  argValue('--base', process.env.GITHUB_BASE_SHA) ||
  process.env.GITHUB_BASE_REF ||
  'origin/main';
const head = argValue('--head', process.env.GITHUB_SHA || 'HEAD');
const files = changedFiles(base, head);
const records = files.filter((file) => RELEASE_RECORD_PATTERN.test(file));
const changedPolicyFiles = files.filter((file) =>
  SCANNED_CHANGED_PATHS.some((pattern) => pattern.test(file)),
);

for (const file of changedPolicyFiles) {
  const text = fileText(file);
  if (!text) continue;
  errors.push(...scanAzContainerAppUpdate(file, text));
  errors.push(...scanAzContainerAppTrafficSet(file, text));
  errors.push(...scanAzAcrBuild(file, text));
  errors.push(...scanMutableAbarvaRuntimeImages(file, text));
  errors.push(...scanDockerBuildxCache(file, text));
  errors.push(...scanAcrPrune(file, text));
}

const touchesRuntimeDeploy = changedPolicyFiles.some((file) =>
  /^(infra\/azure|\.github\/workflows\/aca-main-deploy\.yml|scripts\/deploy|docs\/azure|docs\/runbooks)/.test(file),
);

if (touchesRuntimeDeploy && !releaseRecordMentionsDeployAuthority(records)) {
  errors.push(
    'Runtime/deploy surfaces changed, but no release record documents Deployment Authority, ACA runtime invariant, repo-owned deploy workflow, and ACR build policy.',
  );
}

if (errors.length > 0) {
  console.error('Deploy Authority Gate failed.');
  console.error('');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Deploy Authority Gate passed.');
