#!/usr/bin/env node
/**
 * C-508 · Which governed API routes fence on tenancy, and which of those fences
 * any test could actually fail.
 *
 * THE DEFECT SHAPE THIS MEASURES. A suite asserts a tenancy guard by the
 * presence of identifiers in the route's source text, sometimes with a
 * character-index ordering between two of them. It therefore stays green when
 * the guard is inverted, deleted, moved after the collaborator it guards, or
 * left running against the caller's string instead of the resolved tenant. All
 * four were reproduced as surviving mutations on the two routes C-507 proved.
 * Both of those routes were found by accident — by a draw derived from
 * `resolvedProductSources`, not from anything looking for tenancy. This census
 * is so the next one is derived.
 *
 * IT DOES NOT REPAIR ANYTHING, ON PURPOSE. It ranks. A sweep that finds twenty
 * routes and repairs them in one change is one unreadable change, which is the
 * shape this whole backlog was opened against. Each repair is its own item.
 *
 * EVERY QUESTION IS ASKED OF THE PARSER, NOT OF THE TEXT. Three things a grep
 * for `requireTenancy` cannot tell apart:
 *
 *   a route that calls it                         -> fences
 *   a route that imports it for a type position    -> does not fence
 *   a comment saying why a route does not call it  -> does not fence
 *
 * and in a suite, `"requireTenancy"` inside a `toContain` argument is the
 * byte-scanner being detected, not proof of coverage. A text reader gives all
 * of these one verdict, and that confusion is the defect class itself. So
 * imports come from TypeScript's own `isImportDeclaration`, and a fence is a
 * `CallExpression` whose callee is a binding imported from a fence module.
 *
 * THE POPULATION IS REPORTED IN BOTH DIRECTIONS. `reachesFenceModule` is true
 * for a route whose import graph reaches `src/lib/auth/tenancy.ts` at any
 * depth; `fence` is `direct`/`indirect` only when a fence symbol is CALLED.
 * Those two numbers differ a lot, and the difference is the honest answer to
 * "how many governed routes assert tenancy at all" — a route can import a
 * helper that imports tenancy and fence on nothing itself.
 *
 * Usage:
 *   node scripts/quality/tenancy-fence-coverage.mjs            report
 *   node scripts/quality/tenancy-fence-coverage.mjs --json     machine-readable
 *   node scripts/quality/tenancy-fence-coverage.mjs --write     regenerate the artifact
 *   node scripts/quality/tenancy-fence-coverage.mjs --check     fail on drift
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { isDirectInvocation, unknownFlags } from "../exec/cli-entry.mjs";
import { runtimeModuleSpecifiers } from "./test-ci-coverage-census.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = fs.realpathSync(path.resolve(HERE, "../.."));

export const ARTIFACT_RELATIVE_PATH = "docs/security/tenancy-fence-coverage.json";

/**
 * The seed. `requireTenancy` is the enforcement call and `tenancyErrorResponse`
 * is its fail-closed mapper — C-507's mutation M-B deleted only the mapper and
 * both byte-scanner suites stayed green, so the mapper is part of the fence and
 * not decoration. `TenancyError` is deliberately NOT a seed symbol: a module
 * that only narrows an error type is reading a fence, not applying one.
 */
export const FENCE_MODULE = "src/lib/auth/tenancy.ts";
export const FENCE_SEED_SYMBOLS = ["requireTenancy", "tenancyErrorResponse"];

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const TEST_FILE_RE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const ROUTE_FILE_RE = /(?:^|\/)route\.tsx?$/;
const HTTP_METHOD_RE = /^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/;
const READ_FILE_RE = /^readFileSync|^readFile$/;

/** Walking further than this would mean the graph is cyclic in a way we mis-read. */
const MAX_PROVIDER_DEPTH = 8;

function normalize(value) {
  return value.split(path.sep).join("/");
}

/**
 * The file population: `git ls-files` over the repository, falling back to a
 * walk of `src/` when the root is not a git checkout.
 *
 * The fallback is not a convenience. Without it every case in this module's
 * suite would have to be a case about THIS repository, and a detector that can
 * only be pointed at its own subject cannot be given a fixture that fails —
 * which is the shape the item this census serves was filed against.
 */
function trackedFiles(root) {
  try {
    return execFileSync("git", ["-C", root, "ls-files"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    const found = [];
    const walk = (directory) => {
      let entries;
      try {
        entries = fs.readdirSync(path.join(root, directory), { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const relative = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === ".git") continue;
          walk(relative);
        } else if (entry.isFile()) {
          found.push(relative);
        }
      }
    };
    walk("src");
    return found.sort();
  }
}

/**
 * Module specifier -> repository-relative source path. Mirrors the resolution
 * the census already uses so both readers answer the same question about the
 * same edge; a second, subtly different resolver is how two censuses come to
 * disagree about one tree.
 */
export function resolveSourceModule(root, importer, specifier) {
  let base;
  if (specifier.startsWith("@/")) {
    base = path.join(root, "src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(path.join(root, importer)), specifier);
  } else {
    return null;
  }

  const candidates = [base];
  for (const extension of SOURCE_EXTENSIONS) candidates.push(`${base}${extension}`);
  for (const extension of SOURCE_EXTENSIONS) {
    candidates.push(path.join(base, `index${extension}`));
  }

  for (const candidate of candidates) {
    let stat;
    try {
      stat = fs.statSync(candidate);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;
    const relative = normalize(path.relative(root, candidate));
    if (!relative.startsWith("src/")) continue;
    if (TEST_FILE_RE.test(relative)) continue;
    return relative;
  }
  return null;
}

function parse(source, fileName) {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    fileName.endsWith(".tsx") || fileName.endsWith(".jsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS,
  );
}

/**
 * Every value binding a file imports, as `localName -> { module, imported }`.
 *
 * Type-only clauses and type-only elements are dropped, because an import the
 * compiler erases cannot call anything at run time. The parser's own
 * `isTypeOnly` flags decide that — matching the word `type` in a brace list is
 * the text-scan mistake one level down.
 */
export function importedValueBindings(sourceFile, resolveSpecifier) {
  const bindings = new Map();

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      if (clause && !clause.isTypeOnly) {
        const moduleId = resolveSpecifier(node.moduleSpecifier.text);
        if (moduleId) {
          if (clause.name) {
            bindings.set(clause.name.text, { module: moduleId, imported: "default" });
          }
          const named = clause.namedBindings;
          if (named && ts.isNamedImports(named)) {
            for (const element of named.elements) {
              if (element.isTypeOnly) continue;
              bindings.set(element.name.text, {
                module: moduleId,
                imported: (element.propertyName ?? element.name).text,
              });
            }
          } else if (named && ts.isNamespaceImport(named)) {
            bindings.set(named.name.text, { module: moduleId, imported: "*" });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return bindings;
}

/** Every identifier this file calls, and every `ns.member()` it calls. */
function callTargets(sourceFile) {
  const plain = new Set();
  const members = [];

  const visit = (node) => {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee)) {
        plain.add(callee.text);
      } else if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression)
      ) {
        members.push({ object: callee.expression.text, member: callee.name.text });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { plain, members };
}

/** Names a module exports as values, so a wrapper's surface can be named. */
function exportedValueNames(sourceFile) {
  const names = new Set();

  const isExported = (node) =>
    node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
    false;

  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && isExported(node)) {
      names.add(node.name.text);
    } else if (ts.isVariableStatement(node) && isExported(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    } else if (ts.isClassDeclaration(node) && node.name && isExported(node)) {
      names.add(node.name.text);
    } else if (ts.isExportDeclaration(node) && node.exportClause) {
      if (ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          if (!element.isTypeOnly) names.add(element.name.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return names;
}

/**
 * Which fence symbols a file CALLS, and where each one came from.
 *
 * `providerSymbols` maps a module path to the set of its exports that are
 * fences. `resolveSpecifier` turns a specifier into a module path. Both are
 * passed in rather than derived here so a single file can be classified in
 * isolation — a detector that can only run over the whole repository cannot be
 * given a case that fails.
 */
export function fenceCallsInRoute(source, fileName, providerSymbols, resolveSpecifier) {
  const sourceFile = parse(source, fileName);
  const bindings = importedValueBindings(sourceFile, resolveSpecifier);
  const { plain, members } = callTargets(sourceFile);
  const symbolsFor = (moduleId) => {
    const set = providerSymbols[moduleId];
    if (!set) return null;
    return set instanceof Set ? set : new Set(set);
  };

  const calls = [];
  for (const [local, binding] of bindings) {
    const provided = symbolsFor(binding.module);
    if (!provided) continue;
    if (binding.imported === "*") {
      for (const { object, member } of members) {
        if (object === local && provided.has(member)) {
          calls.push({ module: binding.module, symbol: member });
        }
      }
      continue;
    }
    if (plain.has(local) && provided.has(binding.imported)) {
      calls.push({ module: binding.module, symbol: binding.imported });
    }
  }

  // Deterministic and de-duplicated: two call sites of one symbol are one fact.
  const seen = new Set();
  return calls
    .filter((call) => {
      const key = `${call.module}::${call.symbol}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.module.localeCompare(b.module) || a.symbol.localeCompare(b.symbol));
}

/**
 * The fence surface, grown outward from `src/lib/auth/tenancy.ts` to a fixpoint.
 *
 * A module is a fence PROVIDER when it calls a fence symbol itself; its own
 * exported value names then become fence symbols, because that is what a route
 * calls when it fences through a wrapper — the `_auth` helpers under
 * `src/app/api/**` are exactly this and 187 routes reach tenancy only through
 * one.
 *
 * This is deliberately coarse in one direction and the report says so: a module
 * that calls `requireTenancy` for its own reasons also has its exports marked,
 * so a route calling one of them is recorded as `indirect` with the wrapper
 * named in `fenceVia`. Naming the hop is what makes the coarseness reviewable
 * instead of hidden — the alternative is a hand-kept list of wrapper modules,
 * which is a list that goes stale silently.
 */
export function fenceProviderSymbols(root, seeds) {
  const providers = { [FENCE_MODULE]: new Set(FENCE_SEED_SYMBOLS) };
  const specifierCache = new Map();

  const edgesOf = (file) => {
    if (specifierCache.has(file)) return specifierCache.get(file);
    let resolved = [];
    try {
      const source = fs.readFileSync(path.join(root, file), "utf8");
      resolved = [
        ...new Set(
          runtimeModuleSpecifiers(source, file)
            .map((specifier) => resolveSourceModule(root, file, specifier))
            .filter(Boolean),
        ),
      ];
    } catch {
      resolved = [];
    }
    specifierCache.set(file, resolved);
    return resolved;
  };

  // Every module reachable from the seeds, so the fixpoint below runs over the
  // graph the routes actually load and not over the whole of `src/`.
  const reachable = new Set(seeds);
  const stack = [...seeds];
  while (stack.length) {
    const file = stack.pop();
    for (const edge of edgesOf(file)) {
      if (reachable.has(edge)) continue;
      reachable.add(edge);
      stack.push(edge);
    }
  }

  const candidates = [...reachable].filter(
    (file) => file !== FENCE_MODULE && !ROUTE_FILE_RE.test(file),
  );

  for (let round = 0; round < MAX_PROVIDER_DEPTH; round += 1) {
    let grew = false;
    for (const file of candidates) {
      if (providers[file]) continue;
      let source;
      try {
        source = fs.readFileSync(path.join(root, file), "utf8");
      } catch {
        continue;
      }
      const calls = fenceCallsInRoute(source, file, providers, (specifier) =>
        resolveSourceModule(root, file, specifier),
      );
      if (calls.length === 0) continue;
      const exported = exportedValueNames(parse(source, file));
      if (exported.size === 0) continue;
      providers[file] = exported;
      grew = true;
    }
    if (!grew) break;
  }

  return providers;
}

/**
 * Does this suite prove anything about that route, and by what means?
 *
 * `behavioral` — it loads the route module and calls a handler. The handler call
 *                is found as a `CallExpression` on an HTTP-method name, so
 *                `await POST(request)` counts and the string `"POST"` does not.
 * `byte-scanner` — it names the route's path in a string literal AND calls a
 *                file read. Both halves are required: a suite that mentions a
 *                path in a comment about something else is not scanning it.
 * `none`       — neither.
 *
 * The strongest present verdict wins, because a byte assertion standing beside
 * a real response assertion is not what this census is hunting.
 */
export function classifySuiteForRoute(source, suitePath, routePath, resolveSpecifier) {
  const sourceFile = parse(source, suitePath);
  const bindings = importedValueBindings(sourceFile, resolveSpecifier);
  const { plain, members } = callTargets(sourceFile);

  for (const [local, binding] of bindings) {
    if (binding.module !== routePath) continue;
    if (binding.imported === "*") {
      if (members.some((m) => m.object === local && HTTP_METHOD_RE.test(m.member))) {
        return "behavioral";
      }
      continue;
    }
    if (plain.has(local) && HTTP_METHOD_RE.test(binding.imported)) return "behavioral";
  }

  // A dynamically imported route yields no binding, so the handler call is
  // matched on the destructured or property-accessed method name instead. The
  // module still has to be loaded for this branch to be reached.
  const loadsRoute = runtimeModuleSpecifiers(source, suitePath).some(
    (specifier) => resolveSpecifier(specifier) === routePath,
  );
  if (loadsRoute) {
    const callsHandler =
      [...plain].some((name) => HTTP_METHOD_RE.test(name)) ||
      members.some((m) => HTTP_METHOD_RE.test(m.member));
    if (callsHandler) return "behavioral";
  }

  const reads =
    [...plain].some((name) => READ_FILE_RE.test(name)) ||
    members.some((m) => READ_FILE_RE.test(m.member));
  if (reads && namesPathInString(sourceFile, suitePath, routePath)) return "byte-scanner";

  return "none";
}

/** Does any string literal in this file identify that route file? */
function namesPathInString(sourceFile, suitePath, routePath) {
  let found = false;
  const suiteDir = path.posix.dirname(suitePath);

  const visit = (node) => {
    if (found) return;
    if (ts.isStringLiteralLike(node)) {
      const text = node.text;
      if (text.includes(routePath)) {
        found = true;
        return;
      }
      // A relative spelling such as `../route.ts`, resolved against the suite's
      // own directory. Without this the census would miss every suite that
      // reads its neighbour by `__dirname`.
      if (text.startsWith(".") && /route\.tsx?$/.test(text)) {
        if (path.posix.normalize(path.posix.join(suiteDir, text)) === routePath) {
          found = true;
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

export function buildTenancyFenceCensus(root = DEFAULT_ROOT) {
  const tracked = trackedFiles(root);
  const routes = tracked
    .filter((file) => file.startsWith("src/app/api/") && ROUTE_FILE_RE.test(file))
    .sort();
  const suitePaths = tracked.filter((file) => TEST_FILE_RE.test(file)).sort();

  const providers = fenceProviderSymbols(root, routes);

  // Import-graph reach, measured separately from the call. The two numbers
  // disagree by design and the disagreement is reported.
  const reachCache = new Map();
  const edgesOf = (file) => {
    if (reachCache.has(file)) return reachCache.get(file);
    let resolved = [];
    try {
      resolved = [
        ...new Set(
          runtimeModuleSpecifiers(fs.readFileSync(path.join(root, file), "utf8"), file)
            .map((specifier) => resolveSourceModule(root, file, specifier))
            .filter(Boolean),
        ),
      ];
    } catch {
      resolved = [];
    }
    reachCache.set(file, resolved);
    return resolved;
  };
  const reaches = (start) => {
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length) {
      const file = stack.pop();
      for (const edge of edgesOf(file)) {
        if (edge === FENCE_MODULE) return true;
        if (seen.has(edge)) continue;
        seen.add(edge);
        stack.push(edge);
      }
    }
    return false;
  };

  const rows = [];
  const fencedRoutes = [];
  for (const route of routes) {
    const source = fs.readFileSync(path.join(root, route), "utf8");
    const calls = fenceCallsInRoute(source, route, providers, (specifier) =>
      resolveSourceModule(root, route, specifier),
    );
    const via = [...new Set(calls.map((call) => call.module))]
      .filter((moduleId) => moduleId !== FENCE_MODULE)
      .sort();
    const fence =
      calls.length === 0 ? "none" : via.length === 0 ? "direct" : "indirect";
    const row = {
      route,
      fence,
      fenceSymbols: [...new Set(calls.map((call) => call.symbol))].sort(),
      fenceVia: via,
      reachesFenceModule: reaches(route),
      coverage: null,
      suites: { behavioral: [], byteScanner: [] },
    };
    rows.push(row);
    if (fence !== "none") fencedRoutes.push(row);
  }

  // One parse per suite, then classified against every fenced route it could
  // possibly touch. Suites are the expensive half; routes are 387 and suites
  // are thousands.
  const byRoute = new Map(fencedRoutes.map((row) => [row.route, row]));
  for (const suitePath of suitePaths) {
    let source;
    try {
      source = fs.readFileSync(path.join(root, suitePath), "utf8");
    } catch {
      continue;
    }
    // Cheap pre-filter: a suite that contains neither `route` nor `api` anywhere
    // cannot name one. This is a performance filter only — every candidate it
    // admits is still decided by the parser.
    if (!source.includes("route") && !source.includes("/api/")) continue;
    const resolveSpecifier = (specifier) =>
      resolveSourceModule(root, suitePath, specifier);
    const loaded = new Set(
      runtimeModuleSpecifiers(source, suitePath)
        .map(resolveSpecifier)
        .filter(Boolean),
    );
    for (const [routePath, row] of byRoute) {
      const mightTouch = loaded.has(routePath) || source.includes(routePath);
      // A relative spelling is not in `source` as the full path, so suites that
      // sit beside a route are always examined.
      const isNeighbour = suitePath.startsWith(`${path.posix.dirname(routePath)}/`);
      if (!mightTouch && !isNeighbour) continue;
      const verdict = classifySuiteForRoute(source, suitePath, routePath, resolveSpecifier);
      if (verdict === "behavioral") row.suites.behavioral.push(suitePath);
      else if (verdict === "byte-scanner") row.suites.byteScanner.push(suitePath);
    }
  }

  for (const row of fencedRoutes) {
    row.suites.behavioral.sort();
    row.suites.byteScanner.sort();
    row.coverage =
      row.suites.behavioral.length > 0
        ? "behavioral"
        : row.suites.byteScanner.length > 0
          ? "byte-scanner"
          : "none";
  }

  const counts = {
    routes: rows.length,
    fenced: fencedRoutes.length,
    fencedDirect: fencedRoutes.filter((row) => row.fence === "direct").length,
    fencedIndirect: fencedRoutes.filter((row) => row.fence === "indirect").length,
    unfenced: rows.length - fencedRoutes.length,
    unfencedButReachesFenceModule: rows.filter(
      (row) => row.fence === "none" && row.reachesFenceModule,
    ).length,
    behavioral: fencedRoutes.filter((row) => row.coverage === "behavioral").length,
    byteScannerOnly: fencedRoutes.filter((row) => row.coverage === "byte-scanner").length,
    none: fencedRoutes.filter((row) => row.coverage === "none").length,
  };

  // The ranking. Worst first, so the next draw is read off the top of this list
  // rather than chosen by whoever happens to be looking.
  const rank = { none: 0, "byte-scanner": 1 };
  const ranking = fencedRoutes
    .filter((row) => row.coverage !== "behavioral")
    .sort(
      (a, b) =>
        rank[a.coverage] - rank[b.coverage] ||
        b.fenceSymbols.length - a.fenceSymbols.length ||
        a.route.localeCompare(b.route),
    )
    .map((row) => ({
      route: row.route,
      coverage: row.coverage,
      fence: row.fence,
      fenceVia: row.fenceVia,
    }));

  return {
    subject:
      "every route under src/app/api/** that CALLS a tenancy fence, and what kind of proof its covering suites offer",
    method: [
      "A route fences when a CallExpression's callee is a binding imported from a fence module. An import with no call, a mention in a comment and a mention in a string are all `none` — that distinction is the defect class this census exists to measure, so it is decided by TypeScript's parser rather than by a text scan.",
      "The fence surface grows from src/lib/auth/tenancy.ts to a fixpoint: a module that calls a fence symbol has its own exported value names marked as fence symbols, which is how the `_auth` wrappers under src/app/api/** are found without a hand-kept list. A route reaching a fence through a wrapper is `indirect` and names the hop in fenceVia.",
      "requireTenancy and tenancyErrorResponse are the seed symbols. TenancyError is not: narrowing an error type is reading a fence, not applying one. C-507's mutation M-B deleted only the mapper and both byte-scanner suites stayed green, which is why the mapper counts.",
      "reachesFenceModule is import-graph reach at any depth and is reported separately from `fence` on purpose. The two numbers disagree by a wide margin, and a route that reaches tenancy through a library it imports for other reasons fences on nothing.",
      "A suite is `behavioral` when it loads the route module and calls an HTTP-method handler, `byte-scanner` when it names the route's path in a string literal and calls a file read, `none` otherwise. Where a suite does both, behavioral wins: a byte assertion beside a real response assertion is not what this census is hunting.",
      "coverage is the strongest verdict among a route's covering suites. `byte-scanner` therefore means EVERY covering suite asserts the route by its bytes, and that is the population C-507 showed can stay green through an inverted fence.",
      "This census ranks and does not repair. Each repair is its own backlog item so that a sweep finding twenty routes is not one change nobody reads.",
    ],
    counts,
    ranking,
    mutationProof: {
      note:
        "A classification that was never executed is the same kind of claim this item exists against. Each sample below was proved by applying the named mutation to the route on the recorded commit and running the covering suites: a `byte-scanner` or `none` row is proved when the suites stay GREEN under a mutation that breaks the fence. Sampled, not generalised — the counts say how many of how many.",
      sampled: [],
    },
    routes: rows,
  };
}

/**
 * Drift, per route, in BOTH directions.
 *
 * A regression (behavioral -> byte-scanner) and an improvement
 * (byte-scanner -> behavioral) both fail. The improvement has to fail because
 * this artifact is what ranks the next draw: an artifact that silently lags
 * behind its own repairs mis-ranks the queue and nothing says so, which is
 * T-760's lesson one directory over. Regenerating is one command.
 *
 * Counts are NOT compared. They are a function of the rows, so a count
 * assertion adds a second thing to regenerate and no coverage.
 */
export function describeCensusDrift(measured, committed) {
  const differences = [];
  const committedRows = new Map(
    (committed?.routes ?? []).map((row) => [row.route, row]),
  );
  const measuredRows = new Map((measured?.routes ?? []).map((row) => [row.route, row]));

  for (const [route, row] of measuredRows) {
    const before = committedRows.get(route);
    if (!before) {
      differences.push(
        `+ ${route} — not in the committed census (fence ${row.fence}, coverage ${row.coverage ?? "n/a"})`,
      );
      continue;
    }
    if (before.fence !== row.fence) {
      differences.push(`~ ${route} — fence ${before.fence} -> ${row.fence}`);
    }
    if ((before.coverage ?? null) !== (row.coverage ?? null)) {
      differences.push(
        `~ ${route} — coverage ${before.coverage ?? "n/a"} -> ${row.coverage ?? "n/a"}`,
      );
    }
  }
  for (const route of committedRows.keys()) {
    if (!measuredRows.has(route)) {
      differences.push(`- ${route} — in the committed census and no longer in the tree`);
    }
  }
  return differences.sort();
}

function report(census) {
  const { counts } = census;
  const lines = [
    `fence census: ${counts.routes} api routes, ${counts.fenced} call a tenancy fence ` +
      `(${counts.fencedDirect} direct, ${counts.fencedIndirect} through a wrapper)`,
    `fence census: ${counts.unfenced} call none — of which ${counts.unfencedButReachesFenceModule} ` +
      `reach src/lib/auth/tenancy.ts in the import graph anyway, which is why reach is not the measure`,
    `fence census: proof — ${counts.behavioral} behavioral, ${counts.byteScannerOnly} byte-scanner only, ${counts.none} none`,
  ];
  if (census.ranking.length > 0) {
    lines.push("");
    lines.push(`fence census: top of the ranking (${census.ranking.length} unproven):`);
    for (const row of census.ranking.slice(0, 15)) {
      lines.push(`  ${row.coverage.padEnd(12)} ${row.fence.padEnd(8)} ${row.route}`);
    }
  }
  return lines.join("\n");
}

function main(argv) {
  const unknown = unknownFlags(argv, {
    boolean: ["--json", "--write", "--check"],
    value: ["--root"],
  });
  if (unknown.length > 0) {
    console.error(
      `unrecognised flag(s): ${unknown.join(", ")}\n` +
        "usage: tenancy-fence-coverage.mjs [--json] [--write] [--check] [--root <path>]",
    );
    return 2;
  }

  const rootIndex = argv.indexOf("--root");
  const root = rootIndex >= 0 ? fs.realpathSync(argv[rootIndex + 1]) : DEFAULT_ROOT;
  const artifactPath = path.join(root, ARTIFACT_RELATIVE_PATH);
  const census = buildTenancyFenceCensus(root);

  if (argv.includes("--write")) {
    // The mutation samples are evidence of executed runs; regenerating must not
    // silently discard them. They are carried forward and the suite asserts
    // each one still describes the tree.
    let existing = null;
    try {
      existing = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    } catch {
      existing = null;
    }
    if (existing?.mutationProof?.sampled?.length) {
      // The WHOLE block, not just `sampled`: the calibration run and the
      // sampled-of-how-many counts are what make the samples readable, and a
      // carry-forward that kept only the list would delete the evidence that
      // the greens mean anything. The suite asserts each sample still
      // describes the tree, so a stale one cannot survive here quietly.
      census.mutationProof = { ...census.mutationProof, ...existing.mutationProof };
    }
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, `${JSON.stringify(census, null, 2)}\n`);
    console.log(`wrote ${ARTIFACT_RELATIVE_PATH}`);
    console.log(report(census));
    return 0;
  }

  if (argv.includes("--check")) {
    let committed;
    try {
      committed = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    } catch (error) {
      // Fail closed, including on "could not tell". A guard whose unknown case
      // passes is opt-in, and the first file to reach it is the one that
      // predates it.
      console.error(
        `fence census: cannot read ${ARTIFACT_RELATIVE_PATH} (${error.message}).\n` +
          "Regenerate it:  node scripts/quality/tenancy-fence-coverage.mjs --write",
      );
      return 1;
    }
    const drift = describeCensusDrift(census, committed);
    if (drift.length > 0) {
      console.error(
        `fence census: ${drift.length} route(s) differ from the committed census:`,
      );
      for (const line of drift) console.error(`  ${line}`);
      console.error(
        "\nAn improvement is drift too — this artifact ranks the next repair, so it has to\n" +
          "match the tree. Regenerate it:  node scripts/quality/tenancy-fence-coverage.mjs --write",
      );
      return 1;
    }
    console.log(`fence census: shape matches ${ARTIFACT_RELATIVE_PATH}`);
    console.log(report(census));
    return 0;
  }

  if (argv.includes("--json")) {
    console.log(JSON.stringify(census, null, 2));
    return 0;
  }

  console.log(report(census));
  return 0;
}

if (isDirectInvocation(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
