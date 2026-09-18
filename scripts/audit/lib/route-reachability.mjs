/**
 * Walk the import graph from the app's route entry points.
 *
 * A component can pass every test, clear CI and deploy successfully while being
 * mounted by nothing. Two audits need the same answer to "can a user reach this
 * file?" — the Source canvas orphan baseline, and the AI surface control
 * catalog, which must not treat a control on an unreachable component as a
 * control the product has. One implementation, so the two cannot disagree.
 */

import fs from 'node:fs';
import path from 'node:path';

const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * Files Next.js actually entry-points: every page, layout, route handler,
 * template, error and loading file under src/app, plus middleware and
 * instrumentation at the src root.
 */
const ROUTE_ENTRY_NAMES = new Set([
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
]);

export function walk(dir, out = []) {
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
function resolveImport(spec, fromFile, srcDir) {
  let base;
  if (spec.startsWith('@/')) {
    base = path.join(srcDir, spec.slice(2));
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
  // Side-effect import — `import "@/lib/agent/tools/program/advancePhase";`.
  // It has no `from`, so a from-only walk calls a registered agent tool
  // unreachable while a route imports it precisely to register it.
  /\bimport\s+["']([^"']+)["']/g,
];

function importsOf(file, srcDir) {
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
    const target = resolveImport(spec, file, srcDir);
    if (target) resolved.push(target);
  }
  return resolved;
}

export function collectRoots(repoRoot) {
  const srcDir = path.join(repoRoot, 'src');
  const appDir = path.join(srcDir, 'app');
  const roots = [];
  if (fs.existsSync(appDir)) {
    for (const file of walk(appDir)) {
      if (ROUTE_ENTRY_NAMES.has(path.basename(file, path.extname(file)))) {
        roots.push(file);
      }
    }
  }
  for (const extra of ['middleware.ts', 'instrumentation.ts']) {
    const candidate = path.join(srcDir, extra);
    if (fs.existsSync(candidate)) roots.push(candidate);
  }
  return roots;
}

export function isExcluded(relative) {
  return (
    relative.includes('/__tests__/') ||
    relative.includes('/__mocks__/') ||
    /\.(test|spec)\.[jt]sx?$/.test(relative) ||
    /\.d\.ts$/.test(relative)
  );
}

/**
 * Every file reachable from a route entry point, as absolute paths.
 * Returns the roots too, so callers can report how wide the walk was — a walk
 * that found no roots would call everything unreachable, which is a tooling
 * failure and not a product finding.
 */
export function computeRouteReachability(repoRoot) {
  const srcDir = path.join(repoRoot, 'src');
  const roots = collectRoots(repoRoot);
  const reachable = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const file = queue.pop();
    if (reachable.has(file)) continue;
    reachable.add(file);
    for (const next of importsOf(file, srcDir)) {
      if (!reachable.has(next)) queue.push(next);
    }
  }
  return { roots, reachable };
}
