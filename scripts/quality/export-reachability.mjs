#!/usr/bin/env node
/**
 * Export-reachability: the top-level declarations of one module that nothing
 * the module exports can reach, found by walking the file's OWN reference
 * graph out from its exports.
 *
 * ITEM U-504. This walk shipped inside
 * `WorkspaceExecutiveShell.performance.test.ts` as part of item U-503, where
 * it failed on a ten-declaration dead closure and then went green. It read
 * exactly one path. The defect it repaired was not special to that file: a
 * component loses its mount site, keeps compiling, keeps linting — and
 * `no-unused-vars` is satisfied the moment one dead declaration references
 * another, which is precisely why a *closure* of ten survived where a single
 * orphan would not have.
 *
 * So the walk lives here, in one module, and both the existing suite and the
 * census import it. It was deliberately NOT copied into a second test file:
 * that is the shape item T-723 was filed against — a rule applied by hand in
 * the places someone happened to think of.
 *
 * WHAT THIS IS NOT. This does not ask who imports a file. That distinction is
 * the whole reason the control can be safe: a Next.js `page`/`layout`/`route`
 * module is reached by the router rather than by any importer, and a component
 * exported solely for a test has no production importer — under an
 * inter-module walk both are false positives, and a control that flags a live
 * route file is a control someone will disable. Here an export is a ROOT, so
 * neither case is reportable, whatever reaches the file from outside.
 * A re-export barrel declares nothing of its own and so reports nothing.
 *
 * The subject is whatever the file declares at the moment it runs, so it
 * cannot go stale the way a scan asserting a NAME is absent does — that scan
 * outlives its subject and passes forever over a file it no longer describes.
 *
 * ---------------------------------------------------------------------------
 * WHY THE COMPILER AND NOT THE ORIGINAL LINE SCAN
 *
 * U-503's walk read comment-stripped text line by line: a regex per line for
 * declarations, the span between two declarations for a body, and every
 * identifier-shaped substring in that span as an edge. Ported here unchanged
 * and run over the corpus for the first time, it reported **22 unreachable
 * declarations over 1611 component files — and 15 of the 22 were false
 * positives from one mechanism**:
 *
 *     <Code>src/lib/reasoning/*</Code>
 *
 * The `/*` in that glob is not a comment, but a hand-written stripper with no
 * model of JSX text reads it as one and blanks everything to the next `*​/` —
 * the whole remainder of the component body, and so every reference the page
 * makes to its own tables, rows and styles. Both `docs/reasoning/page.tsx` and
 * `docs/reasoning/api/page.tsx` failed exactly that way. This is precisely the
 * outcome U-504 warned about: on a first run, two thirds of what the control
 * said would have been wrong, and the first reviewer to check one would have
 * stopped trusting the rest.
 *
 * Three smaller errors came out of the same measurement, and they are worth
 * naming because two of them point the other way — the scan was blind as well
 * as noisy:
 *
 *   - a top-level statement outside every declaration (a registration call, a
 *     side effect) was in no span, so what it referenced looked dead;
 *   - an identifier inside a STRING was an edge, so `return "Orphan"` kept a
 *     dead component alive — a control that under-reports silently;
 *   - a declaration the line regex did not shape-match was absent from the
 *     graph entirely, and its references with it.
 *
 * None of these is fixable by a better regex; each is a question about
 * syntax. TypeScript is already a dependency of this repository, so the walk
 * asks it. Measured cost of asking: the full census over 1611 files takes
 * **0.7s** against the line scan's 0.3s, so correctness here was not bought
 * with a budget anybody has to think about.
 *
 * The corrected census is **7 unreachable declarations over 1611 files**, in 6
 * files, every one a single unused colour or font constant and not one of them
 * a renderer. `docs/quality/export-reachability-census.md` records it.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

import { isDirectInvocation, unknownFlags } from "../exec/cli-entry.mjs";

/**
 * `text` with every comment blanked and every offset preserved.
 *
 * The walk no longer needs this — the parser discards comments — and it is
 * kept exported because it is the honest answer to "can a comment manufacture
 * an edge" for callers scanning text rather than syntax, and
 * `WorkspaceExecutiveShell.performance.test.ts` has such scans over a
 * stylesheet, which has no TypeScript syntax to parse.
 *
 * It carries the JSX defect described above, which is safe over CSS and is not
 * safe over TSX. Do not reach for it to pre-process source for this module.
 */
export function stripComments(text, { lineComments = true } = {}) {
  const out = text.split("");
  const n = text.length;
  let state = "code";
  let i = 0;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (state === "code") {
      if (lineComments && c === "/" && d === "/") {
        out[i] = " ";
        out[i + 1] = " ";
        state = "line";
        i += 2;
        continue;
      }
      if (c === "/" && d === "*") {
        out[i] = " ";
        out[i + 1] = " ";
        state = "block";
        i += 2;
        continue;
      }
      if (c === "'") state = "sq";
      else if (c === '"') state = "dq";
      else if (c === "`") state = "tpl";
      i += 1;
      continue;
    }
    if (state === "line") {
      if (c === "\n") state = "code";
      else out[i] = " ";
      i += 1;
      continue;
    }
    if (state === "block") {
      if (c === "*" && d === "/") {
        out[i] = " ";
        out[i + 1] = " ";
        state = "code";
        i += 2;
        continue;
      }
      if (c !== "\n") out[i] = " ";
      i += 1;
      continue;
    }
    // inside a string literal: only its own closing quote ends it.
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (
      (state === "sq" && c === "'") ||
      (state === "dq" && c === '"') ||
      (state === "tpl" && c === "`")
    ) {
      state = "code";
    }
    i += 1;
  }
  return out.join("");
}

/**
 * The names a top-level statement declares, with whether it is exported.
 *
 * A `const a = 1, b = 2;` declares two; a destructuring pattern declares the
 * names it binds. Anything with no plain identifier to bind — an expression
 * statement, an import, a bare block — declares nothing and is a ROOT instead
 * (see `collectRoots`).
 */
function declaredNames(statement) {
  const exported = Boolean(
    ts.canHaveModifiers(statement)
      && ts
        .getModifiers(statement)
        ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
  );
  const names = [];
  if (
    ts.isFunctionDeclaration(statement)
    || ts.isClassDeclaration(statement)
    || ts.isInterfaceDeclaration(statement)
    || ts.isTypeAliasDeclaration(statement)
    || ts.isEnumDeclaration(statement)
    || ts.isModuleDeclaration(statement)
  ) {
    // `export default function () {}` is anonymous: it declares nothing to
    // reach, and it is itself a root.
    if (statement.name && ts.isIdentifier(statement.name)) names.push(statement.name.text);
  } else if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      for (const name of bindingNames(declaration.name)) names.push(name);
    }
  }
  return { names, exported };
}

function bindingNames(name) {
  if (ts.isIdentifier(name)) return [name.text];
  const out = [];
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isOmittedExpression(element)) continue;
      out.push(...bindingNames(element.name));
    }
  }
  return out;
}

/**
 * Every identifier in `node`'s subtree that could be a reference to a
 * module-level declaration.
 *
 * The skipped positions are the ones that spell a name without referring to
 * one: a property key, the right side of a dot, a JSX attribute name, an
 * import or export clause. Getting these wrong over-reports edges, which hides
 * dead code rather than inventing it — so where the answer is genuinely
 * ambiguous (a local binding shadowing a module name) this errs that way
 * deliberately. A control that invents dead code gets switched off.
 */
function referencedIdentifiers(node, declared) {
  const found = new Set();
  const visit = (child) => {
    if (ts.isPropertyAccessExpression(child)) {
      visit(child.expression);
      return;
    }
    if (ts.isQualifiedName(child)) {
      visit(child.left);
      return;
    }
    if (ts.isPropertyAssignment(child) || ts.isPropertySignature(child) || ts.isMethodDeclaration(child) || ts.isPropertyDeclaration(child) || ts.isEnumMember(child)) {
      // A computed key IS an expression and is visited; a plain key is not.
      if (child.name && ts.isComputedPropertyName(child.name)) visit(child.name);
      ts.forEachChild(child, (grand) => {
        if (grand !== child.name) visit(grand);
      });
      return;
    }
    if (ts.isJsxAttribute(child)) {
      if (child.initializer) visit(child.initializer);
      return;
    }
    if (ts.isImportDeclaration(child) || ts.isExportDeclaration(child) || ts.isImportEqualsDeclaration(child)) {
      return;
    }
    if (ts.isIdentifier(child)) {
      if (declared.has(child.text)) found.add(child.text);
      return;
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, visit);
  return found;
}

/**
 * The names that are reachable without being reached from anything else: the
 * exports, plus what module-level code refers to.
 *
 * `export { a as b }`, `export default Foo` and `export = Foo` name a
 * declaration without carrying a modifier, and a bare statement at module
 * scope runs when the module loads — so what it references is live even if no
 * export mentions it.
 */
function collectRoots(sourceFile, declared, exportedNames) {
  const roots = new Set(exportedNames);
  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      // `export { a } from "./x"` re-exports someone else's `a`; only a
      // clause with no module specifier names a local declaration.
      if (statement.moduleSpecifier) continue;
      const bindings = statement.exportClause;
      if (bindings && ts.isNamedExports(bindings)) {
        for (const element of bindings.elements) {
          const local = element.propertyName ?? element.name;
          if (ts.isIdentifier(local) && declared.has(local.text)) roots.add(local.text);
        }
      }
      continue;
    }
    if (ts.isExportAssignment(statement)) {
      for (const name of referencedIdentifiers(statement, declared)) roots.add(name);
      continue;
    }
    const { names } = declaredNames(statement);
    if (names.length > 0) continue;
    if (ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement)) continue;
    // A statement that declares nothing: its references are live.
    for (const name of referencedIdentifiers(statement, declared)) roots.add(name);
  }
  return roots;
}

/**
 * The top-level declarations of `source` that no export reaches, sorted.
 *
 * `fileName` only chooses the parser's dialect; `.tsx` is the default because
 * the corpus this exists for is components, and a `.tsx` parse of a `.ts` file
 * differs only where a type assertion is spelled `<T>x`, which this repository
 * does not use.
 */
export function unreachableTopLevelDeclarations(source, { fileName = "module.tsx" } = {}) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ false,
    fileName.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.TSX,
  );

  const declared = new Set();
  const owner = new Map();
  const exportedNames = new Set();
  for (const statement of sourceFile.statements) {
    const { names, exported } = declaredNames(statement);
    for (const name of names) {
      declared.add(name);
      if (!owner.has(name)) owner.set(name, statement);
      if (exported) exportedNames.add(name);
    }
  }

  const edges = new Map();
  for (const [name, statement] of owner) {
    const referenced = referencedIdentifiers(statement, declared);
    referenced.delete(name);
    edges.set(name, referenced);
  }

  const roots = collectRoots(sourceFile, declared, exportedNames);
  const reached = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const name = queue.pop();
    if (reached.has(name)) continue;
    reached.add(name);
    for (const next of edges.get(name) ?? []) {
      if (!reached.has(next)) queue.push(next);
    }
  }

  return [...declared].filter((name) => !reached.has(name)).sort();
}

/** The unreachable declarations of one file on disk. */
export function unreachableInFile(file) {
  return unreachableTopLevelDeclarations(readFileSync(file, "utf8"), {
    fileName: file,
  });
}

export const CENSUS_ROOTS = ["src/app", "src/components"];

const SKIP_DIRECTORIES = new Set([
  "node_modules",
  "__tests__",
  "__mocks__",
  "__fixtures__",
]);

/**
 * Every component file under `roots`, relative to `repoRoot`, sorted.
 *
 * Test and fixture directories are skipped: a suite's own top-level helpers are
 * reached by the test runner calling `describe`/`it`, not by an export, so
 * every one of them would report as unreachable. That is the false positive the
 * item names — a control that flags what the runner mounts is a control someone
 * will disable — and it is excluded by construction rather than by a threshold.
 */
export function componentFiles(repoRoot, roots = CENSUS_ROOTS) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue;
        walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (/\.(test|spec)\.tsx?$/.test(entry.name)) continue;
      if (/\.d\.ts$/.test(entry.name)) continue;
      out.push(path.relative(repoRoot, full));
    }
  };
  for (const root of roots) {
    const abs = path.join(repoRoot, root);
    try {
      if (!statSync(abs).isDirectory()) continue;
    } catch {
      continue;
    }
    walk(abs);
  }
  return out.sort();
}

/**
 * The census: per-file unreachable declarations across `roots`.
 *
 * Reports `filesScanned` — every file looked at, clean or not — so the
 * denominator is measured rather than asserted. A findings list on its own
 * cannot tell a clean corpus from a walk that stopped reading.
 */
export function census(repoRoot, roots = CENSUS_ROOTS) {
  const files = componentFiles(repoRoot, roots);
  const findings = [];
  let declarationCount = 0;
  for (const file of files) {
    const unreachable = unreachableInFile(path.join(repoRoot, file));
    if (unreachable.length === 0) continue;
    declarationCount += unreachable.length;
    findings.push({ file, unreachable });
  }
  findings.sort(
    (a, b) =>
      b.unreachable.length - a.unreachable.length || a.file.localeCompare(b.file),
  );
  return {
    roots,
    filesScanned: files.length,
    filesWithFindings: findings.length,
    declarationCount,
    findings,
  };
}

export const BASELINE_FILE = "scripts/quality/export-reachability-baseline.json";

/**
 * The census against its recorded baseline.
 *
 * WHY A BASELINE AND NOT A THRESHOLD. The corpus has 7 pre-existing findings,
 * so a gate demanding zero would be red on arrival and switched off within a
 * day. A gate demanding "no more than 7" would pass a brand-new dead renderer
 * the moment somebody deleted an unused colour constant. The baseline names
 * the 7, by file and by declaration, so only a change in the SET moves it.
 *
 * It fails in BOTH directions, and the second one is the point: a baseline
 * entry whose finding has been fixed is an exemption that has outlived its
 * defect, and an exemption nobody is forced to retire is how a stale list ends
 * up protecting code that no longer needs protecting. Cleaning something up
 * therefore requires deleting its line here, in the same change — which is
 * also the audit trail for the cleanup.
 */
export function compareToBaseline(report, baseline) {
  const flatten = (findings) => {
    const out = [];
    for (const finding of findings) {
      for (const name of finding.unreachable) out.push(`${finding.file}::${name}`);
    }
    return out.sort();
  };
  const now = new Set(flatten(report.findings));
  const recorded = new Set(flatten(baseline.findings ?? []));
  return {
    added: [...now].filter((k) => !recorded.has(k)).sort(),
    fixed: [...recorded].filter((k) => !now.has(k)).sort(),
  };
}

const FLAG_SPEC = { boolean: ["--json", "--check"], value: ["--file", "--roots"] };

function main(argv) {
  const unknown = unknownFlags(argv, FLAG_SPEC);
  if (unknown.length > 0) {
    // An unrecognised flag is parsed as nothing, so the measurement asked for
    // would not happen and a different one would be printed as if it were the
    // answer. Refused rather than passed silently (item T-748).
    console.error(
      `Unrecognised flag(s): ${unknown.join(", ")}. Nothing was measured.\n`
        + "usage: export-reachability.mjs [--check] [--json] [--roots a,b] [--file <path>]",
    );
    return 2;
  }

  const json = argv.includes("--json");
  const repoRoot = process.cwd();
  const fileAt = argv.indexOf("--file");

  if (fileAt >= 0) {
    const target = argv[fileAt + 1];
    if (!target || target.startsWith("--")) {
      console.error("--file needs a path. Nothing was measured.");
      return 2;
    }
    const unreachable = unreachableInFile(path.resolve(repoRoot, target));
    if (json) {
      console.log(JSON.stringify({ file: target, unreachable }, null, 2));
    } else {
      console.log(
        unreachable.length === 0
          ? `${target}: every top-level declaration is reachable from an export`
          : `${target}: ${unreachable.length} unreachable -> ${unreachable.join(", ")}`,
      );
    }
    return unreachable.length === 0 ? 0 : 1;
  }

  const rootsAt = argv.indexOf("--roots");
  const roots =
    rootsAt >= 0 && argv[rootsAt + 1] && !argv[rootsAt + 1].startsWith("--")
      ? argv[rootsAt + 1].split(",").map((r) => r.trim()).filter(Boolean)
      : CENSUS_ROOTS;
  const report = census(repoRoot, roots);

  if (argv.includes("--check")) {
    const baselinePath = path.join(repoRoot, BASELINE_FILE);
    let baseline;
    try {
      baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    } catch (error) {
      // Refuse rather than pass: a missing or unreadable baseline read as "no
      // findings recorded" would report all 7 as new on the first run and then,
      // if anyone silenced that by treating absence as acceptance, would accept
      // everything for ever.
      console.error(
        `Cannot read ${BASELINE_FILE}: ${error.message}. `
          + "The check is refused rather than passed.",
      );
      return 2;
    }
    const { added, fixed } = compareToBaseline(report, baseline);
    if (json) {
      console.log(JSON.stringify({ added, fixed, report }, null, 2));
      return added.length + fixed.length === 0 ? 0 : 1;
    }
    for (const key of added) {
      const [file, name] = key.split("::");
      console.error(
        `NEW unreachable top-level declaration: ${name} in ${file}. `
          + "Nothing the module exports can reach it. Mount it, export it, "
          + "delete it, or record it in " + BASELINE_FILE + " with a reason.",
      );
    }
    for (const key of fixed) {
      const [file, name] = key.split("::");
      console.error(
        `BASELINE IS STALE: ${name} in ${file} is recorded as unreachable and `
          + "is now reachable or gone. Delete its entry — an exemption that "
          + "outlives its defect protects nothing and hides the next one.",
      );
    }
    if (added.length + fixed.length === 0) {
      console.log(
        `Export-reachability: ${report.declarationCount} unreachable `
          + `declaration(s) over ${report.filesScanned} component files, `
          + `exactly the set recorded in ${BASELINE_FILE}.`,
      );
      return 0;
    }
    return 1;
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  console.log(
    `Export-reachability census over ${report.roots.join(", ")}: `
      + `${report.filesScanned} component files scanned, `
      + `${report.filesWithFindings} with at least one unreachable top-level `
      + `declaration, ${report.declarationCount} unreachable declarations in total.`,
  );
  for (const finding of report.findings) {
    console.log(`  ${finding.unreachable.length}  ${finding.file}`);
    console.log(`      ${finding.unreachable.join(", ")}`);
  }
  /*
   * The census REPORTS: exit 0 whatever it finds, and it deletes nothing.
   *
   * Whether this deserves a required job is what the number decides, and U-504
   * excludes deleting anything it finds — each removal is its own bounded item
   * with its own unreachability proof, because a deletion justified only by a
   * bulk report is how a live surface gets removed.
   */
  return 0;
}

if (isDirectInvocation(import.meta.url)) process.exit(main(process.argv.slice(2)));
