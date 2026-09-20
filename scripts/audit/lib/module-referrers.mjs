/**
 * Classify every module under a watched directory by WHO can reach it.
 *
 * `route-reachability.mjs` answers one question — can a route reach this file —
 * and for `src/components` that is the whole question, because a component a
 * route cannot reach is a component no user can see.
 *
 * Under `src/lib` the same question answers wrongly in both directions, and
 * both wrong answers were measured on this tree before this file existed:
 *
 *   - Route-only reachability calls 799 modules dead. Most are alive: they are
 *     reached from an operator script or an ACA job, which is a different entry
 *     point, not an absent one.
 *   - "Is it imported anywhere" calls all of them live, because a module's own
 *     test imports it. That is precisely how eight modules survived ten weeks
 *     after the sunset removed their only product consumer — the suites stayed
 *     green, so the code looked reached.
 *
 * So the useful distinction is not reached/unreached but WHICH entry class
 * reaches it, and the load-bearing boundary is that a test is not an entry
 * point. A module whose only path from any entry point starts at its own test
 * is dead product code with a live test attached.
 *
 * Four states, in descending strength:
 *
 *   product      reached from a route, the proxy, an ACA job or a build config
 *   tooling      not reached by product, but reached from an operator script
 *   test-only    the only path to it starts at a test  <-- the finding
 *   unreferenced nothing imports it at all             <-- the finding
 *
 * `repoRoot` is a parameter rather than derived from `import.meta.url` so the
 * behavioural suite can point the classifier at a fixture tree and construct
 * each of the four states, including the ones this repository happens not to
 * have today. A classifier that can only be run against the real tree can only
 * be tested by asserting the number it currently prints, which is a snapshot,
 * not a test.
 */

import fs from 'node:fs';
import path from 'node:path';

import { collectRoots, isExcluded, walk } from './route-reachability.mjs';

/**
 * Extensions the classifier will follow and enumerate.
 *
 * Wider than `route-reachability.mjs`, which walks TS/JS under src only. The
 * operator entry points live in `scripts/` and many are `.mjs`; omitting that
 * extension would leave every script-only module looking unreferenced.
 */
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];

const IMPORT_PATTERNS = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  // Side-effect import, which has no `from`.
  /\bimport\s+["']([^"']+)["']/g,
  // `jest.mock('@/lib/x')` is a reference from a test and nothing else. It is
  // matched so that a module reached ONLY by being mocked is classified
  // test-only rather than unreferenced — the two carry different work.
  /\bjest\.mock\s*\(\s*["']([^"']+)["']/g,
];

/**
 * Directories whose files are entry points, by class.
 *
 * The runtime entry FILES — the routes, the proxy, instrumentation — come from
 * `collectRoots`, not from a second list here, so that this classifier and the
 * component audit cannot disagree about what runs. `src/jobs` is added on top:
 * an ACA job is a real entry point and no route imports one.
 */
const PRODUCT_ENTRY_DIRS = ['src/jobs'];
const BUILD_CONFIG_FILES = [
  'next.config.ts',
  'jest.config.ts',
  'playwright.config.ts',
];
const TOOLING_ENTRY_DIRS = ['scripts', 'src/scripts'];

/**
 * A test, a mock, or a harness that exists to be imported by tests.
 *
 * `src/test` and `src/testing` are included: they hold fixtures and harnesses
 * whose only callers are suites, so treating them as product entry points
 * would launder every module they touch into `product`.
 */
export function isTestFile(relative) {
  return (
    relative.includes('/__tests__/') ||
    relative.includes('/__mocks__/') ||
    /\.(test|spec)\.[jt]sx?$/.test(relative) ||
    relative.startsWith('tests/') ||
    relative.startsWith('src/test/') ||
    relative.startsWith('src/testing/') ||
    relative.startsWith('src/__tests__/')
  );
}

function walkWide(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walkWide(full, out);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

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

function closure(entries, srcDir) {
  const reached = new Set();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop();
    if (reached.has(file)) continue;
    reached.add(file);
    for (const next of importsOf(file, srcDir)) {
      if (!reached.has(next)) queue.push(next);
    }
  }
  return reached;
}

function existingFiles(repoRoot, relatives) {
  return relatives
    .map((relative) => path.join(repoRoot, relative))
    .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile());
}

/**
 * The entry points of each class, as absolute paths.
 *
 * Exported so the report can state how wide each walk was. A walk that found
 * no product entry points would classify the whole tree as dead, which is a
 * tooling failure wearing a finding's clothes; the caller has to be able to
 * tell the two apart.
 */
export function collectEntryPoints(repoRoot) {
  const srcDir = path.join(repoRoot, 'src');
  const notATest = (file) => !isTestFile(path.relative(repoRoot, file));

  const product = [
    ...collectRoots(repoRoot),
    ...PRODUCT_ENTRY_DIRS.flatMap((dir) =>
      walkWide(path.join(repoRoot, dir)).filter(notATest),
    ),
    ...existingFiles(repoRoot, BUILD_CONFIG_FILES),
  ];
  const tooling = TOOLING_ENTRY_DIRS.flatMap((dir) =>
    walkWide(path.join(repoRoot, dir)).filter(notATest),
  );
  const test = [
    ...walkWide(srcDir),
    ...walkWide(path.join(repoRoot, 'tests')),
  ].filter((file) => isTestFile(path.relative(repoRoot, file)));

  return {
    product: [...new Set(product)],
    tooling: [...new Set(tooling)],
    test: [...new Set(test)],
  };
}

/**
 * Classify every non-test module under `watchedDir` into the four states.
 *
 * Returns repo-relative, sorted paths, plus the entry-point counts the caller
 * needs to distinguish a finding from an empty walk.
 */
export function classifyModuleReferrers(repoRoot, watchedDir) {
  const srcDir = path.join(repoRoot, 'src');
  const entryPoints = collectEntryPoints(repoRoot);

  const productClosure = closure(entryPoints.product, srcDir);
  const toolingClosure = closure(entryPoints.tooling, srcDir);
  const testClosure = closure(entryPoints.test, srcDir);

  const watchedAbs = path.join(repoRoot, watchedDir);
  const modules = walk(watchedAbs).filter(
    (file) => !isExcluded(path.relative(repoRoot, file)),
  );

  const buckets = {
    product: [],
    tooling: [],
    testOnly: [],
    unreferenced: [],
  };
  for (const file of modules) {
    const relative = path.relative(repoRoot, file);
    if (productClosure.has(file)) buckets.product.push(relative);
    else if (toolingClosure.has(file)) buckets.tooling.push(relative);
    else if (testClosure.has(file)) buckets.testOnly.push(relative);
    else buckets.unreferenced.push(relative);
  }
  for (const list of Object.values(buckets)) list.sort();

  return {
    ...buckets,
    scanned: modules.length,
    entryPointCounts: {
      product: entryPoints.product.length,
      tooling: entryPoints.tooling.length,
      test: entryPoints.test.length,
    },
  };
}
