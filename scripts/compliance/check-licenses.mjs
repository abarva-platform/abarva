#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const REPO_ROOT = resolve(new URL('../..', import.meta.url).pathname);
const LOCKFILE_PATH = resolve(REPO_ROOT, 'package-lock.json');
const POLICY_PATH = resolve(REPO_ROOT, 'docs/compliance/license-policy.json');

function parseArgs(argv) {
  const args = {
    output: null,
    markdown: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output') {
      args.output = argv[++i];
    } else if (arg === '--markdown') {
      args.markdown = true;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/compliance/check-licenses.mjs [--output <path>] [--markdown]

Checks package-lock.json against docs/compliance/license-policy.json.
The gate fails on denied or unclassified licenses unless a package exception is recorded.`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function packageNameFromLockPath(lockPath) {
  return lockPath.slice(lockPath.lastIndexOf('node_modules/') + 'node_modules/'.length);
}

function normalizeLicense(rawLicense) {
  if (!rawLicense || rawLicense === 'UNKNOWN') return 'NOASSERTION';
  return String(rawLicense).trim();
}

function licenseTokens(expression) {
  return normalizeLicense(expression)
    .replace(/[()]/g, ' ')
    .split(/\s+(?:AND|OR|WITH)\s+|\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function exceptionKey(name, version) {
  return `${name}@${version}`;
}

function uniquePackages(lockfile) {
  const packages = new Map();

  for (const [lockPath, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (!lockPath.startsWith('node_modules/')) continue;
    const name = packageNameFromLockPath(lockPath);
    const version = metadata.version ?? '0.0.0';
    const key = exceptionKey(name, version);
    const license = normalizeLicense(
      metadata.license ??
        (Array.isArray(metadata.licenses)
          ? metadata.licenses.map((entry) => entry.type ?? entry).join(' OR ')
          : null),
    );

    const existing = packages.get(key);
    if (existing) {
      existing.paths.push(lockPath);
      existing.devOnly = existing.devOnly && metadata.dev === true;
      existing.optional = existing.optional || metadata.optional === true;
      continue;
    }

    packages.set(key, {
      key,
      name,
      version,
      license,
      devOnly: metadata.dev === true,
      optional: metadata.optional === true,
      paths: [lockPath],
      resolved: metadata.resolved ?? null,
    });
  }

  return [...packages.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function classifyLicense(pkg, policy, exceptions) {
  const license = normalizeLicense(pkg.license);
  const exception = exceptions.get(pkg.key) ?? exceptions.get(pkg.name);

  if (exception) {
    return {
      status: 'exception',
      reason: exception.reason,
      decision: exception.decision,
      owner: exception.owner,
      reviewBy: exception.reviewBy,
    };
  }

  if (policy.allowedLicenses.includes(license)) {
    return { status: 'allowed', reason: 'License is in allowedLicenses.' };
  }

  const tokens = licenseTokens(license);
  const hasAllowed = tokens.some((token) => policy.allowedLicenses.includes(token));
  const hasReview = tokens.some((token) => policy.reviewRequiredLicenses.includes(token));
  const hasDenied = tokens.some((token) => policy.deniedLicenses.includes(token));
  const isAlternativeExpression = /\sOR\s/.test(license);

  if (license === 'NOASSERTION') {
    return { status: 'unclassified', reason: 'No license metadata in package-lock.json.' };
  }

  if (hasDenied && !isAlternativeExpression) {
    return { status: 'denied', reason: 'License contains a denied token.' };
  }

  if (hasReview || hasDenied) {
    return { status: 'review', reason: 'License expression requires legal review before direct adoption.' };
  }

  if (hasAllowed && isAlternativeExpression) {
    return { status: 'allowed', reason: 'License expression includes an allowed alternative.' };
  }

  if (hasAllowed && tokens.every((token) => policy.allowedLicenses.includes(token))) {
    return { status: 'allowed', reason: 'All license expression tokens are allowed.' };
  }

  return { status: 'unclassified', reason: 'License is not represented in the current policy.' };
}

function summarize(packages, policy) {
  const exceptions = new Map(
    (policy.packageExceptions ?? []).map((entry) => [
      entry.version ? exceptionKey(entry.package, entry.version) : entry.package,
      entry,
    ]),
  );

  const rows = packages.map((pkg) => ({
    ...pkg,
    classification: classifyLicense(pkg, policy, exceptions),
  }));

  const totals = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[row.classification.status] = (acc[row.classification.status] ?? 0) + 1;
      acc.licenses[row.license] = (acc.licenses[row.license] ?? 0) + 1;
      return acc;
    },
    { total: 0, allowed: 0, review: 0, exception: 0, denied: 0, unclassified: 0, licenses: {} },
  );

  const failures = rows.filter((row) => ['denied', 'unclassified'].includes(row.classification.status));
  const reviewQueue = rows.filter((row) => row.classification.status === 'review');
  const exceptionQueue = rows.filter((row) => row.classification.status === 'exception');

  return {
    generatedFrom: {
      lockfile: 'package-lock.json',
      lockfileSha256: createHash('sha256').update(readFileSync(LOCKFILE_PATH)).digest('hex'),
      policy: 'docs/compliance/license-policy.json',
      policySha256: createHash('sha256').update(readFileSync(POLICY_PATH)).digest('hex'),
    },
    totals,
    failures,
    reviewQueue,
    exceptionQueue,
    packages: rows,
  };
}

function toMarkdown(report) {
  const lines = [
    '# License Compliance Report',
    '',
    `- Packages checked: ${report.totals.total}`,
    `- Allowed: ${report.totals.allowed}`,
    `- Review required: ${report.totals.review}`,
    `- Exceptions: ${report.totals.exception}`,
    `- Denied: ${report.totals.denied}`,
    `- Unclassified: ${report.totals.unclassified}`,
    '',
    '## Review Queue',
    '',
  ];

  if (report.reviewQueue.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| Package | License | Reason |');
    lines.push('| --- | --- | --- |');
    for (const row of report.reviewQueue) {
      lines.push(`| ${row.key} | ${row.license} | ${row.classification.reason} |`);
    }
  }

  lines.push('', '## Exceptions', '');
  if (report.exceptionQueue.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| Package | License | Decision | Reason |');
    lines.push('| --- | --- | --- | --- |');
    for (const row of report.exceptionQueue) {
      lines.push(`| ${row.key} | ${row.license} | ${row.classification.decision} | ${row.classification.reason} |`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const lockfile = readJson(LOCKFILE_PATH);
  const policy = readJson(POLICY_PATH);
  const report = summarize(uniquePackages(lockfile), policy);
  const output = args.markdown ? toMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;

  if (args.output) {
    const outPath = resolve(REPO_ROOT, args.output);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, output);
  }

  console.log(
    `license: checked ${report.totals.total} packages; ` +
      `${report.totals.denied} denied, ${report.totals.unclassified} unclassified, ` +
      `${report.totals.review} review, ${report.totals.exception} exceptions.`,
  );

  if (report.failures.length > 0) {
    for (const failure of report.failures) {
      console.error(`license: ${failure.classification.status}: ${failure.key} (${failure.license})`);
    }
    process.exit(1);
  }
}

main();
