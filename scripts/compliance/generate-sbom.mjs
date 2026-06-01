#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const REPO_ROOT = resolve(new URL('../..', import.meta.url).pathname);
const LOCKFILE_PATH = resolve(REPO_ROOT, 'package-lock.json');
const PACKAGE_JSON_PATH = resolve(REPO_ROOT, 'package.json');

function parseArgs(argv) {
  const args = {
    output: null,
    stdout: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output') {
      args.output = argv[++i];
    } else if (arg === '--stdout') {
      args.stdout = true;
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
  console.log(`Usage: node scripts/compliance/generate-sbom.mjs [--output <path>] [--stdout]

Generates a deterministic CycloneDX-compatible JSON SBOM from package-lock.json.`);
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

function purlFor(name, version) {
  const encodedName = name
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
}

function licenseEntry(license) {
  if (license === 'NOASSERTION') return [];
  if (license === 'BSD' || license === 'MIT/X11' || license.startsWith('SEE LICENSE')) {
    return [{ license: { name: license } }];
  }
  if (/[()\s]/.test(license)) {
    return [{ expression: license }];
  }
  return [{ license: { id: license } }];
}

function componentFromPackage(lockPath, metadata) {
  const name = packageNameFromLockPath(lockPath);
  const version = metadata.version ?? '0.0.0';
  const license = normalizeLicense(
    metadata.license ??
      (Array.isArray(metadata.licenses)
        ? metadata.licenses.map((entry) => entry.type ?? entry).join(' OR ')
        : null),
  );

  return {
    type: 'library',
    'bom-ref': purlFor(name, version),
    name,
    version,
    scope: metadata.dev === true ? 'optional' : 'required',
    purl: purlFor(name, version),
    licenses: licenseEntry(license),
    properties: [
      { name: 'abarva:lockfile:path', value: lockPath },
      { name: 'abarva:optional', value: String(metadata.optional === true) },
    ],
  };
}

function componentsFromLockfile(lockfile) {
  const byRef = new Map();

  for (const [lockPath, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (!lockPath.startsWith('node_modules/')) continue;
    const component = componentFromPackage(lockPath, metadata);
    const existing = byRef.get(component['bom-ref']);
    if (!existing) {
      byRef.set(component['bom-ref'], component);
      continue;
    }

    existing.scope = existing.scope === 'required' || component.scope === 'required' ? 'required' : 'optional';
    existing.properties.push(...component.properties);
    existing.properties.sort((a, b) => `${a.name}:${a.value}`.localeCompare(`${b.name}:${b.value}`));
  }

  return [...byRef.values()].sort((a, b) => a['bom-ref'].localeCompare(b['bom-ref']));
}

function buildSbom(packageJson, lockfile) {
  const lockHash = createHash('sha256').update(readFileSync(LOCKFILE_PATH)).digest('hex');
  const components = componentsFromLockfile(lockfile);

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      component: {
        type: 'application',
        name: packageJson.name ?? 'nexus',
        version: packageJson.version ?? '0.0.0',
      },
      properties: [
        { name: 'abarva:source', value: 'package-lock.json' },
        { name: 'abarva:package-lock-sha256', value: lockHash },
      ],
    },
    components,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const packageJson = readJson(PACKAGE_JSON_PATH);
  const lockfile = readJson(LOCKFILE_PATH);
  const sbom = buildSbom(packageJson, lockfile);
  const output = `${JSON.stringify(sbom, null, 2)}\n`;

  if (args.output) {
    const outPath = resolve(REPO_ROOT, args.output);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, output);
  }

  if (args.stdout) {
    process.stdout.write(output);
  } else {
    console.log(`sbom: generated ${sbom.components.length} components from package-lock.json.`);
  }
}

main();
