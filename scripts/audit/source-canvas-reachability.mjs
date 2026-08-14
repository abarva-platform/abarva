#!/usr/bin/env node
/**
 * Report Source canvas components that no route can reach.
 *
 * A component can pass every test, clear CI and deploy successfully while
 * being mounted by nothing. That happened: a 425-line change landed in
 * `workspace-tabs/EvidenceTab.tsx`, whose only importer is
 * `UniversalCanvasShell.tsx`, which the event route stopped mounting. The work
 * was correct, tested and deployed, and no user could reach it.
 *
 * This walks the import graph from the app routes and reports which files
 * under the watched directories are never reached. Existing orphans are
 * recorded in a baseline so the check fails only when a NEW one appears, or
 * when a known orphan is removed and the baseline is stale.
 *
 * Usage:
 *   node scripts/audit/source-canvas-reachability.mjs            # check against baseline
 *   node scripts/audit/source-canvas-reachability.mjs --update   # rewrite baseline
 *   node scripts/audit/source-canvas-reachability.mjs --json     # machine-readable
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);
const SRC = path.join(REPO_ROOT, 'src');
const APP = path.join(SRC, 'app');
const BASELINE = path.join(
  REPO_ROOT,
  'docs',
  'architecture',
  'source-canvas-orphans.json',
);

/** Directories whose components must be reachable from a route. */
const WATCHED = ['src/components/source'];

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, out);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/** Resolve an import specifier to a file on disk, or null if it is external. */
function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith('@/')) {
    base = path.join(SRC, spec.slice(2));
  } else if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else {
    return null; // package import
  }

  for (const ext of EXTENSIONS) {
    const candidate = `${base}${ext}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  for (const ext of EXTENSIONS) {
    const candidate = path.join(base, `index${ext}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

const IMPORT_PATTERNS = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
];

function importsOf(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const specs = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of text.matchAll(pattern)) specs.add(match[1]);
  }
  const resolved = [];
  for (const spec of specs) {
    const target = resolveImport(spec, file);
    if (target) resolved.push(target);
  }
  return resolved;
}

/**
 * Roots are the files Next.js actually entry-points: every page, layout,
 * route handler, template, error and loading file under src/app, plus
 * middleware and instrumentation at the src root.
 */
function collectRoots() {
  const roots = [];
  if (fs.existsSync(APP)) {
    for (const file of walk(APP)) {
      const name = path.basename(file, path.extname(file));
      if (
        [
          'page',
          'layout',
          'route',
          'template',
          'error',
          'loading',
          'not-found',
          'global-error',
          'default',
          'opengraph-image',
          'icon',
          'sitemap',
          'robots',
          'manifest',
        ].includes(name)
      ) {
        roots.push(file);
      }
    }
  }
  for (const extra of ['middleware.ts', 'instrumentation.ts']) {
    const candidate = path.join(SRC, extra);
    if (fs.existsSync(candidate)) roots.push(candidate);
  }
  return roots;
}

function reachableFrom(roots) {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const next of importsOf(file)) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  return seen;
}

function isWatched(relative) {
  return WATCHED.some((dir) => relative.startsWith(`${dir}/`));
}

function isExcluded(relative) {
  return (
    relative.includes('/__tests__/') ||
    relative.includes('/__mocks__/') ||
    /\.(test|spec)\.[jt]sx?$/.test(relative) ||
    /\.d\.ts$/.test(relative)
  );
}

function main() {
  const args = process.argv.slice(2);
  const update = args.includes('--update');
  const asJson = args.includes('--json');

  const roots = collectRoots();
  const reachable = reachableFrom(roots);

  const orphans = [];
  for (const dir of WATCHED) {
    const abs = path.join(REPO_ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const relative = path.relative(REPO_ROOT, file);
      if (isExcluded(relative)) continue;
      if (!isWatched(relative)) continue;
      if (!reachable.has(file)) orphans.push(relative);
    }
  }
  orphans.sort();

  if (update) {
    fs.writeFileSync(
      BASELINE,
      `${JSON.stringify(
        {
          note: 'Source components no route can reach. Generated by scripts/audit/source-canvas-reachability.mjs. A new entry here means work has landed somewhere no user can see; remove the component or mount it, do not just extend this list.',
          generatedFrom: 'src/app route graph',
          orphans,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Baseline written: ${orphans.length} orphaned file(s).`);
    return;
  }

  let baseline = { orphans: [] };
  if (fs.existsSync(BASELINE)) {
    baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  }
  const known = new Set(baseline.orphans ?? []);
  const added = orphans.filter((file) => !known.has(file));
  const removed = [...known].filter((file) => !orphans.includes(file));

  if (asJson) {
    console.log(
      JSON.stringify({ orphans, added, removed, roots: roots.length }, null, 2),
    );
  } else {
    console.log(
      `Source canvas reachability: ${roots.length} route entry points, ${orphans.length} unreachable file(s).`,
    );
    if (added.length > 0) {
      console.error('\nNEW unreachable file(s) — no route can reach these:');
      for (const file of added) console.error(`  + ${file}`);
      console.error(
        '\nWork landing here ships and passes CI but no user can see it.',
      );
      console.error(
        'Mount it from a route, or remove it. Do not extend the baseline to silence this.',
      );
    }
    if (removed.length > 0) {
      console.error('\nBaseline is stale — these are reachable again:');
      for (const file of removed) console.error(`  - ${file}`);
      console.error(
        '\nRefresh with: node scripts/audit/source-canvas-reachability.mjs --update',
      );
    }
    if (added.length === 0 && removed.length === 0) {
      console.log('No new unreachable components.');
    }
  }

  process.exit(added.length > 0 || removed.length > 0 ? 1 : 0);
}

main();
