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
  // Runtime entry points that are not routes. `proxy.ts` is what Next.js 16
  // renamed middleware to, and this tree has only the new name — so the list
  // was naming a file that does not exist while missing the one that does.
  // Exactly one src/lib module is reachable only from it, and it is a route
  // tenancy guard: left out, an orphan report scores a wired control as dead.
  // `middleware.ts` stays listed so the walk is correct on either name.
  for (const extra of ['proxy.ts', 'middleware.ts', 'instrumentation.ts']) {
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
/**
 * Every file reachable from ONE entry point, by following imports.
 *
 * `computeRouteReachability` answers "can any route reach this file", which
 * is the right question for finding orphans and the wrong one for checking a
 * claim about a particular route. The route ownership map claims that a
 * named route imports a named component, and a global reachable set cannot
 * tell that claim from a component some other route happens to mount.
 *
 * Shared here rather than reimplemented beside the map, for the reason the
 * graph walk itself is shared: two audits asking the same question must not
 * be able to disagree about the answer.
 */
export function reachableFrom(repoRoot, entryFile) {
  const srcDir = path.join(repoRoot, 'src');
  const absolute = path.isAbsolute(entryFile)
    ? entryFile
    : path.join(repoRoot, entryFile);
  if (!fs.existsSync(absolute)) return new Set();

  const reachable = new Set();
  const queue = [absolute];
  while (queue.length > 0) {
    const file = queue.pop();
    if (reachable.has(file)) continue;
    reachable.add(file);
    for (const next of importsOf(file, srcDir)) {
      if (!reachable.has(next)) queue.push(next);
    }
  }
  return reachable;
}

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

/**
 * Exports in the watched trees that no route-reachable file imports.
 *
 * `computeRouteReachability` answers "can a route reach this FILE", and two
 * dead surfaces landed inside files every Source route reaches — so the file
 * was reached, the audit was quiet, and nothing rendered them. The grain the
 * question needs is the exported symbol, not the file.
 *
 * Three rules make the answer honest, and each one was wrong in a first draft:
 *
 *   - A test importer is not a mount. The consumed set is built only from
 *     route-reachable, non-excluded files, so a symbol kept alive by its own
 *     suite is still reported.
 *   - A mention in the file's own comment is not a use. Comments and string
 *     literals are stripped before a symbol's local uses are counted; without
 *     that, the doc comment above `ContractRefusalChips` scored it as used and
 *     the known-true positive went unreported.
 *   - Anything that cannot be resolved by name is treated as reaching every
 *     export — star imports, dynamic `import()`, `require`, and `export *`
 *     re-exports. A false negative here costs a missed orphan; a false
 *     positive costs the gate its credibility, and a gate nobody believes gets
 *     quarantined.
 *
 * Exports inside a file no route reaches are deliberately NOT reported: the
 * file baseline already names that file, and reporting both would bill one
 * defect twice.
 */

/** Exports Next.js itself calls. Nothing imports these, by design. */
const FRAMEWORK_EXPORTS = new Set([
  'metadata',
  'generateMetadata',
  'generateStaticParams',
  'generateViewport',
  'viewport',
  'dynamic',
  'dynamicParams',
  'revalidate',
  'fetchCache',
  'runtime',
  'preferredRegion',
  'maxDuration',
  'config',
  'alt',
  'size',
  'contentType',
  'default',
]);

function stripCommentsAndStrings(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1 ')
    .replace(/`(?:[^`\\]|\\[\s\S])*`/g, ' ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, ' ')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, ' ');
}

/** Value exports declared by a module, by name. Types are not rendered. */
function exportedNames(text) {
  const names = new Set();
  for (const match of text.matchAll(
    /^\s*export\s+(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)/gm,
  )) {
    names.add(match[1]);
  }
  for (const match of text.matchAll(/^\s*export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/gm)) {
    names.add(match[1]);
  }
  for (const match of text.matchAll(/^\s*export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/gm)) {
    names.add(match[1]);
  }
  for (const match of text.matchAll(/^\s*export\s*\{([^}]*)\}\s*;?\s*$/gm)) {
    for (const part of match[1].split(',')) {
      const trimmed = part.trim();
      if (!trimmed || trimmed.startsWith('type ')) continue;
      const pieces = trimmed.split(/\s+as\s+/);
      names.add((pieces[1] ?? pieces[0]).trim());
    }
  }
  return names;
}

/**
 * What each imported module has taken from it, as Map<file, Set<name> | '*'>.
 * `'*'` means "every export", used wherever the specifier cannot be resolved
 * to individual names.
 */
function importedNamesOf(file, srcDir) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return new Map();
  }
  const taken = new Map();
  const record = (spec, names) => {
    const target = resolveImport(spec, file, srcDir);
    if (!target) return;
    const current = taken.get(target);
    if (current === '*') return;
    if (names === '*') {
      taken.set(target, '*');
      return;
    }
    const merged = current ?? new Set();
    for (const name of names) merged.add(name);
    taken.set(target, merged);
  };

  for (const match of text.matchAll(/\bimport\s+([^'";]*?)\s*from\s*["']([^"']+)["']/g)) {
    const clause = match[1];
    if (/\*\s+as\s+/.test(clause)) {
      record(match[2], '*');
      continue;
    }
    const names = new Set();
    const braced = clause.match(/\{([^}]*)\}/);
    if (braced) {
      for (const part of braced[1].split(',')) {
        const trimmed = part.trim().replace(/^type\s+/, '');
        if (!trimmed) continue;
        names.add(trimmed.split(/\s+as\s+/)[0].trim());
      }
    }
    const withoutBraces = clause.replace(/\{[^}]*\}/, '').replace(/^type\s+/, '');
    if (withoutBraces.split(',')[0].trim()) names.add('default');
    record(match[2], names);
  }
  for (const match of text.matchAll(/\bexport\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    const names = new Set();
    for (const part of match[1].split(',')) {
      const trimmed = part.trim().replace(/^type\s+/, '');
      if (!trimmed) continue;
      names.add(trimmed.split(/\s+as\s+/)[0].trim());
    }
    record(match[2], names);
  }
  for (const match of text.matchAll(
    /\bexport\s*\*\s*(?:as\s+[A-Za-z0-9_$]+\s*)?from\s*["']([^"']+)["']/g,
  )) {
    record(match[1], '*');
  }
  for (const match of text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    record(match[1], '*');
  }
  for (const match of text.matchAll(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    record(match[1], '*');
  }
  return taken;
}

export function computeExportReachability(repoRoot, watchedDirs) {
  const srcDir = path.join(repoRoot, 'src');
  const { reachable } = computeRouteReachability(repoRoot);

  // Built from the route-reachable set alone, which is what makes a test
  // importer not a mount: no test file is reachable from a route entry, so a
  // symbol only its own suite imports never enters this map. Measured rather
  // than assumed — on this tree, 0 of 3,373 reachable files are excluded — so
  // no isExcluded() guard is applied here. One would never fire, and a branch
  // that cannot fire is the shape this control exists to report.
  const consumed = new Map();
  for (const file of reachable) {
    for (const [target, names] of importedNamesOf(file, srcDir)) {
      const current = consumed.get(target);
      if (current === '*') continue;
      if (names === '*') {
        consumed.set(target, '*');
        continue;
      }
      const merged = current ?? new Set();
      for (const name of names) merged.add(name);
      consumed.set(target, merged);
    }
  }

  const orphanExports = [];
  let scannedFiles = 0;
  for (const dir of watchedDirs) {
    const absolute = path.join(repoRoot, dir);
    if (!fs.existsSync(absolute)) continue;
    for (const file of walk(absolute)) {
      const relative = path.relative(repoRoot, file);
      if (isExcluded(relative)) continue;
      // A file no route reaches is the file baseline's finding, not this one.
      if (!reachable.has(file)) continue;
      scannedFiles += 1;
      const taken = consumed.get(file);
      if (taken === '*') continue;

      const text = fs.readFileSync(file, 'utf8');
      const isRouteEntry = ROUTE_ENTRY_NAMES.has(
        path.basename(file, path.extname(file)),
      );
      // Count local uses against code only, with the export clauses that merely
      // name a symbol removed — naming it is not using it.
      const body = stripCommentsAndStrings(text).replace(/\bexport\s*\{[^}]*\}/g, ' ');

      for (const name of exportedNames(text)) {
        if (FRAMEWORK_EXPORTS.has(name)) continue;
        if (isRouteEntry) continue;
        if (taken?.has(name)) continue;
        const uses = [
          ...body.matchAll(new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`, 'g')),
        ].length;
        if (uses > 1) continue;
        orphanExports.push(`${relative}#${name}`);
      }
    }
  }
  orphanExports.sort();
  return { orphanExports, scannedFiles };
}
