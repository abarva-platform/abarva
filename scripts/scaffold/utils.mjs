import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const [rawKey, rawValue] = token.slice(2).split('=');
    const key = rawKey.trim();
    if (!key) continue;
    if (rawValue !== undefined) {
      args[key] = rawValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }
  return args;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function requireText(args, key, hint) {
  const value = String(args[key] ?? '').trim();
  if (!value) {
    throw new Error(`Missing --${key}. ${hint ?? ''}`.trim());
  }
  return value;
}

export function writeNewFile(filePath, contents, { force = false } = {}) {
  const absolute = path.resolve(filePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  if (existsSync(absolute) && !force) {
    throw new Error(`${path.relative(process.cwd(), absolute)} already exists. Re-run with --force to overwrite.`);
  }
  writeFileSync(absolute, contents, 'utf8');
  return absolute;
}

export function readIfExists(filePath) {
  const absolute = path.resolve(filePath);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
}

export function repoPath(root, ...parts) {
  return path.join(path.resolve(root), ...parts);
}

export function printCreated(kind, filePath, nextSteps = []) {
  console.log(`${kind}: ${path.relative(process.cwd(), filePath)}`);
  for (const step of nextSteps) {
    console.log(`- ${step}`);
  }
}
