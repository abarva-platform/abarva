/**
 * Item C-406 — which surface does a whole-contract question actually reach?
 *
 * WHY THIS SUITE EXISTS, and it is not the reason the item was filed for.
 *
 * `C-403` measured the aVa Source answer router (`src/lib/source/ava/answer-mode.ts`)
 * against the 16 acceptance rows of the Ask aVa contract spec's §12.11 set,
 * expanded to 48 questions, and recorded `fallbackCount: 48` in
 * `docs/architecture/c403-answer-mode-routing.json`. That measurement is correct
 * and this suite does not touch it or the suite that writes it.
 *
 * What the repository did NOT record is the scope of that number: which mounted
 * surface those 48 questions travel through. Without it, the number reads as
 * "every contract question falls through the router", and `C-406` was filed on
 * exactly that reading — its acceptance asks for `fallbackCount` in the C-403
 * record to FALL as the proof that a general contract-question path was built.
 *
 * Measured here, from repository bytes: the two paths are DISJOINT.
 *
 *   - The spec's own declared Ask aVa entry point, `/api/intelligence/ask`, does
 *     not import `answer-mode.ts` anywhere in its transitive closure. It reaches
 *     the contract answer builder `source-workspace-visual-answer.ts` instead.
 *   - `/api/chat/agent` reaches `answer-mode.ts` and does NOT reach the contract
 *     answer builder.
 *
 * So a general contract-question path built where the spec puts it cannot move
 * the C-403 number, and the only edit that WOULD move it is adding rules to a
 * classifier the contract surface never enters — which the same acceptance
 * forbids. A number cited outside its scope is what this suite makes
 * unavailable to the next reader: the scope is now committed beside it.
 *
 * WHAT THIS SUITE IS NOT. It is not a prohibition on ever wiring these two
 * together. If a later change deliberately routes contract questions through the
 * classifier, this suite fails, and the correct response is to regenerate the
 * record and say in the release record why the scope changed — a reviewed diff
 * rather than a silent drift. The failure message says so.
 *
 * Module specifiers are read through the TypeScript AST, not by a regex over the
 * file: a text scan cannot answer a syntax question, and `import ... from "x"`
 * spans lines, nests in type-only positions, and appears inside `import("x")`
 * expressions.
 *
 * THE LIMIT OF A CLOSURE, STATED AS A NUMBER RATHER THAN ASSUMED AWAY. An import
 * closure is sound evidence that a path EXISTS and weaker evidence that one does
 * not: a `import(expr)` with a computed specifier is invisible to it. The two
 * negative readings above are therefore backed by two further measurements — the
 * count of non-literal dynamic imports inside each closure, recorded rather than
 * waved at, and the list of string literals anywhere in the closure that name the
 * module said to be unreachable, asserted empty.
 *
 * Regenerate the committed record with:
 *   ABARVA_UPDATE_C406_SURFACES=1 npx jest --runTestsByPath \
 *     src/__tests__/behaviors/c406-contract-question-surface-reachability.test.ts
 */

import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const REPO_ROOT = process.cwd();
const SRC_ROOT = path.join(REPO_ROOT, "src");

const RECORD_REL = "docs/architecture/c406-contract-question-surface-reachability.json";
const RECORD_PATH = path.join(REPO_ROOT, RECORD_REL);
const C403_RECORD_REL = "docs/architecture/c403-answer-mode-routing.json";
const C403_RECORD_PATH = path.join(REPO_ROOT, C403_RECORD_REL);

const EVENT_CHAT_CLASSIFIER_REL = "src/lib/source/ava/answer-mode.ts";
const CONTRACT_ANSWER_BUILDER_REL = "src/lib/source/ava/source-workspace-visual-answer.ts";

const ASK_ROUTE_REL = "src/app/api/intelligence/ask/route.ts";
const CHAT_ROUTE_REL = "src/app/api/chat/agent/route.ts";

const CONTRACT_360_PAGE_REL = "src/app/(maestro)/source/360/page.tsx";
const WORKSPACE_PAGE_REL = "src/app/(maestro)/source/workspace/page.tsx";
const WORKSPACE_LOADER_REL = "src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx";
const WORKSPACE_CLIENT_REL = "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx";
const OPTIMIZE_PAGE_REL = "src/app/(maestro)/source/optimize/page.tsx";
const OPTIMIZE_CLIENT_REL = "src/components/source/SourceOptimizeContractPage.tsx";

const UPDATE = process.env.ABARVA_UPDATE_C406_SURFACES === "1";

// ───────────────────────────────────────────────────────────────────────────────
// Module-graph reader
// ───────────────────────────────────────────────────────────────────────────────

const RESOLVE_SUFFIXES = ["", ".ts", ".tsx", ".js", ".mjs", ".cjs"] as const;
const RESOLVE_INDEXES = ["index.ts", "index.tsx", "index.js"] as const;

function parse(absolute: string): ts.SourceFile {
  return ts.createSourceFile(
    absolute,
    fs.readFileSync(absolute, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}

function resolveSpecifier(specifier: string, fromFile: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) {
    base = path.join(SRC_ROOT, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    // A bare specifier is a package; the product code under measurement is the
    // first-party graph, so packages are the boundary of this closure.
    return null;
  }
  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  for (const index of RESOLVE_INDEXES) {
    const candidate = path.join(base, index);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

interface FileSpecifiers {
  /** Static `import`/`export ... from` and literal `import("x")` specifiers. */
  literal: string[];
  /** `import(expr)` calls whose specifier is not a string literal. */
  nonLiteralDynamicImports: number;
  /** Every string literal in the file, for the run-time-reference check. */
  stringLiterals: string[];
}

/**
 * Only literals matching one of these fragments are carried out of a file. A
 * closure of several hundred modules holds tens of thousands of string literals
 * and collecting all of them is what a first draft of this suite did — it
 * overflowed the stack on the spread rather than measuring anything.
 */
const LITERAL_NEEDLES = [
  "answer-mode",
  "source-workspace-visual-answer",
  "/api/",
] as const;

/**
 * The needle for the classifier is PATH-QUALIFIED, and the first draft's was
 * not. A bare `answer-mode` matches `@/lib/intelligence/ask/answer-mode-registry`
 * — a different module, on the Ask path, holding CXO response-shape contracts
 * rather than question routing — so the coarse needle reported the negative
 * reading refuted when it was not. Two modules sharing a name fragment is
 * exactly how a reader grepping for this later would talk themselves out of the
 * measurement, so the near miss is asserted below rather than filtered away.
 */
const CLASSIFIER_SPECIFIER_NEEDLE = "source/ava/answer-mode";
const ASK_MODE_REGISTRY_REL = "src/lib/intelligence/ask/answer-mode-registry.ts";

function keptLiteral(value: string): boolean {
  return LITERAL_NEEDLES.some((needle) => value.includes(needle));
}

function readSpecifiers(sourceFile: ts.SourceFile): FileSpecifiers {
  const literal: string[] = [];
  const stringLiterals: string[] = [];
  let nonLiteralDynamicImports = 0;

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      literal.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const first = node.arguments[0];
      if (first && ts.isStringLiteral(first)) {
        literal.push(first.text);
      } else {
        nonLiteralDynamicImports += 1;
      }
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      literal.push((node.arguments[0] as ts.StringLiteral).text);
    }

    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      keptLiteral(node.text)
    ) {
      stringLiterals.push(node.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { literal, nonLiteralDynamicImports, stringLiterals };
}

interface Closure {
  entry: string;
  /** Repo-relative, POSIX-separated, sorted. */
  files: string[];
  fileSet: Set<string>;
  /** Importer of each discovered file, for chain reconstruction. */
  importedBy: Map<string, string>;
  nonLiteralDynamicImports: number;
  stringLiterals: string[];
}

function relative(absolute: string): string {
  return path.relative(REPO_ROOT, absolute).split(path.sep).join("/");
}

function closureOf(entryRel: string): Closure {
  const entry = path.join(REPO_ROOT, entryRel);
  if (!fs.existsSync(entry)) {
    throw new Error(`entry point does not exist: ${entryRel}`);
  }
  const seen = new Set<string>();
  const importedBy = new Map<string, string>();
  const stringLiterals: string[] = [];
  let nonLiteralDynamicImports = 0;
  const stack = [entry];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (seen.has(current)) continue;
    seen.add(current);
    const specifiers = readSpecifiers(parse(current));
    nonLiteralDynamicImports += specifiers.nonLiteralDynamicImports;
    stringLiterals.push(...specifiers.stringLiterals);
    for (const specifier of specifiers.literal) {
      const resolved = resolveSpecifier(specifier, current);
      if (!resolved || seen.has(resolved)) continue;
      if (!importedBy.has(resolved)) importedBy.set(resolved, current);
      stack.push(resolved);
    }
  }

  const files = [...seen].map(relative).sort();
  return {
    entry: entryRel,
    files,
    fileSet: new Set(files),
    importedBy: new Map(
      [...importedBy].map(([child, parent]) => [relative(child), relative(parent)]),
    ),
    nonLiteralDynamicImports,
    stringLiterals,
  };
}

function chainTo(closure: Closure, targetRel: string): string[] {
  const chain: string[] = [];
  let cursor: string | undefined = targetRel;
  const guard = new Set<string>();
  while (cursor && !guard.has(cursor)) {
    guard.add(cursor);
    chain.push(cursor);
    cursor = closure.importedBy.get(cursor);
  }
  return chain.reverse();
}

// ───────────────────────────────────────────────────────────────────────────────
// Surface binding
// ───────────────────────────────────────────────────────────────────────────────

function fetchedUrlLiterals(fileRel: string): string[] {
  const sourceFile = parse(path.join(REPO_ROOT, fileRel));
  const { stringLiterals } = readSpecifiers(sourceFile);
  return [...new Set(stringLiterals.filter((value) => value.startsWith("/api/")))].sort();
}

function reExportsDefaultFrom(fileRel: string): string | null {
  const sourceFile = parse(path.join(REPO_ROOT, fileRel));
  const imported = new Map<string, string>();
  let defaultExported: string | null = null;
  const visit = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.importClause?.name
    ) {
      imported.set(node.importClause.name.text, node.moduleSpecifier.text);
    }
    if (
      ts.isExportAssignment(node) &&
      !node.isExportEquals &&
      ts.isIdentifier(node.expression)
    ) {
      defaultExported = node.expression.text;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return defaultExported ? (imported.get(defaultExported) ?? null) : null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Measurement
// ───────────────────────────────────────────────────────────────────────────────

interface EntryPointMeasurement {
  route: string;
  file: string;
  reachesEventChatClassifier: boolean;
  reachesContractAnswerBuilder: boolean;
}

interface SurfaceBinding {
  surface: string;
  postsTo: string;
}

interface CoreRecord {
  item: string;
  generatedBy: string;
  question: string;
  subjects: {
    eventChatClassifier: string;
    contractAnswerBuilder: string;
    /** Named because its name invites confusion with the classifier, not because it routes. */
    askPathModeRegistryNotTheClassifier: string;
  };
  entryPoints: EntryPointMeasurement[];
  surfaceBinding: SurfaceBinding[];
  fallbackCountScope: {
    citedRecord: string;
    citedFallbackCount: number;
    citedTotalQuestionsRun: number;
    describesRoute: string;
    doesNotDescribeRoute: string;
    statement: string;
  };
}

interface ObservedRecord {
  note: string;
  closureSizes: Record<string, number>;
  chainToContractAnswerBuilder: string[];
  chainToEventChatClassifier: string[];
  nonLiteralDynamicImports: Record<string, number>;
}

interface Record_ {
  core: CoreRecord;
  observed: ObservedRecord;
}

const askClosure = closureOf(ASK_ROUTE_REL);
const chatClosure = closureOf(CHAT_ROUTE_REL);

const c403 = JSON.parse(fs.readFileSync(C403_RECORD_PATH, "utf8")) as {
  specAcceptance: { fallbackCount: number; totalQuestionsRun: number; source: string };
};

const measuredCore: CoreRecord = {
  item: "C-406",
  generatedBy: "src/__tests__/behaviors/c406-contract-question-surface-reachability.test.ts",
  question:
    "Which mounted route does a whole-contract question reach, and is the router the §12.11 fallback count was measured on reachable from it?",
  subjects: {
    eventChatClassifier: EVENT_CHAT_CLASSIFIER_REL,
    contractAnswerBuilder: CONTRACT_ANSWER_BUILDER_REL,
    askPathModeRegistryNotTheClassifier: ASK_MODE_REGISTRY_REL,
  },
  entryPoints: [
    {
      route: "/api/intelligence/ask",
      file: ASK_ROUTE_REL,
      reachesEventChatClassifier: askClosure.fileSet.has(EVENT_CHAT_CLASSIFIER_REL),
      reachesContractAnswerBuilder: askClosure.fileSet.has(CONTRACT_ANSWER_BUILDER_REL),
    },
    {
      route: "/api/chat/agent",
      file: CHAT_ROUTE_REL,
      reachesEventChatClassifier: chatClosure.fileSet.has(EVENT_CHAT_CLASSIFIER_REL),
      reachesContractAnswerBuilder: chatClosure.fileSet.has(CONTRACT_ANSWER_BUILDER_REL),
    },
  ],
  surfaceBinding: [
    { surface: "/source/360", postsTo: "/api/intelligence/ask" },
    { surface: "/source/workspace", postsTo: "/api/intelligence/ask" },
    { surface: "/source/optimize", postsTo: "/api/chat/agent" },
  ],
  fallbackCountScope: {
    citedRecord: C403_RECORD_REL,
    citedFallbackCount: c403.specAcceptance.fallbackCount,
    citedTotalQuestionsRun: c403.specAcceptance.totalQuestionsRun,
    describesRoute: "/api/chat/agent",
    doesNotDescribeRoute: "/api/intelligence/ask",
    statement:
      "The §12.11 fallback count in the cited record is a fact about the event-chat classifier, which only /api/chat/agent reaches. It is not a measurement of the Ask aVa contract path (/api/intelligence/ask) that §12.11's acceptance is written against, and it cannot be moved by building the general contract-question path there.",
  },
};

const measuredObserved: ObservedRecord = {
  note: "Volatile measurements, recorded for a reader and deliberately NOT equality-asserted: a closure size or an intermediate import changes whenever an unrelated module is added, and a gate that fails for an unrelated reason gets weakened rather than read.",
  closureSizes: {
    [ASK_ROUTE_REL]: askClosure.files.length,
    [CHAT_ROUTE_REL]: chatClosure.files.length,
  },
  chainToContractAnswerBuilder: chainTo(askClosure, CONTRACT_ANSWER_BUILDER_REL),
  chainToEventChatClassifier: chainTo(chatClosure, EVENT_CHAT_CLASSIFIER_REL),
  nonLiteralDynamicImports: {
    [ASK_ROUTE_REL]: askClosure.nonLiteralDynamicImports,
    [CHAT_ROUTE_REL]: chatClosure.nonLiteralDynamicImports,
  },
};

if (UPDATE) {
  fs.writeFileSync(
    RECORD_PATH,
    `${JSON.stringify({ core: measuredCore, observed: measuredObserved }, null, 2)}\n`,
    "utf8",
  );
}

function committed(): Record_ {
  return JSON.parse(fs.readFileSync(RECORD_PATH, "utf8")) as Record_;
}

const REGENERATE =
  "If this change intentionally rewired the two paths, regenerate with " +
  "ABARVA_UPDATE_C406_SURFACES=1 and say in the release record why the scope changed.";

// ───────────────────────────────────────────────────────────────────────────────

describe("C-406 — the suite runs where a CI job already looks", () => {
  it("sits inside the directory `npm run test:behaviors` names", () => {
    const parts = path.relative(REPO_ROOT, __filename).split(path.sep).join("/");
    expect(parts.startsWith("src/__tests__/behaviors/")).toBe(true);
  });
});

describe("C-406 — the closure reader is not vacuous in either direction", () => {
  it("returns a non-trivial first-party graph for both entry points", () => {
    expect(askClosure.files.length).toBeGreaterThan(50);
    expect(chatClosure.files.length).toBeGreaterThan(50);
  });

  it("includes each entry point in its own closure", () => {
    expect(askClosure.fileSet.has(ASK_ROUTE_REL)).toBe(true);
    expect(chatClosure.fileSet.has(CHAT_ROUTE_REL)).toBe(true);
  });

  it("does not return the same set for both entry points", () => {
    // A reader that returned "every file" or "no file" would pass a one-sided
    // reachability assertion; it cannot pass this one.
    const onlyAsk = askClosure.files.filter((f) => !chatClosure.fileSet.has(f));
    const onlyChat = chatClosure.files.filter((f) => !askClosure.fileSet.has(f));
    expect(onlyAsk.length).toBeGreaterThan(0);
    expect(onlyChat.length).toBeGreaterThan(0);
  });

  it("resolves a specifier it is given, rather than reporting every path missing", () => {
    const resolved = resolveSpecifier("@/lib/source/ava/answer-mode", path.join(REPO_ROOT, CHAT_ROUTE_REL));
    expect(resolved && relative(resolved)).toBe(EVENT_CHAT_CLASSIFIER_REL);
  });
});

describe("C-406 (1) — the §12.11 acceptance path cannot reach the event-chat classifier", () => {
  it(`${ASK_ROUTE_REL} does not import ${EVENT_CHAT_CLASSIFIER_REL}, transitively`, () => {
    expect(askClosure.fileSet.has(EVENT_CHAT_CLASSIFIER_REL)).toBe(false);
  });

  it(`${CHAT_ROUTE_REL} does — which is the positive control for the same reader`, () => {
    expect(chatClosure.fileSet.has(EVENT_CHAT_CLASSIFIER_REL)).toBe(true);
  });
});

describe("C-406 (2) — and the event-chat path cannot reach the contract answer builder", () => {
  it(`${ASK_ROUTE_REL} reaches ${CONTRACT_ANSWER_BUILDER_REL}`, () => {
    expect(askClosure.fileSet.has(CONTRACT_ANSWER_BUILDER_REL)).toBe(true);
  });

  it(`${CHAT_ROUTE_REL} does not`, () => {
    expect(chatClosure.fileSet.has(CONTRACT_ANSWER_BUILDER_REL)).toBe(false);
  });
});

describe("C-406 (3) — the two negative readings are backed, not assumed", () => {
  it("finds no string literal naming the classifier anywhere in the ask closure", () => {
    const naming = [
      ...new Set(
        askClosure.stringLiterals.filter((v) => v.includes(CLASSIFIER_SPECIFIER_NEEDLE)),
      ),
    ];
    expect(naming).toEqual([]);
  });

  it("names the near miss, so a later grep for `answer-mode` is not read as a refutation", () => {
    // The ask closure DOES carry a module whose name contains `answer-mode`. It
    // is a different file with a different job, and saying so here is cheaper
    // than the wrong conclusion it otherwise invites.
    expect(askClosure.fileSet.has(ASK_MODE_REGISTRY_REL)).toBe(true);
    expect(ASK_MODE_REGISTRY_REL).not.toBe(EVENT_CHAT_CLASSIFIER_REL);
    expect(askClosure.fileSet.has(EVENT_CHAT_CLASSIFIER_REL)).toBe(false);
  });

  it("finds no string literal naming the contract answer builder in the chat closure", () => {
    const naming = [
      ...new Set(
        chatClosure.stringLiterals.filter((v) => v.includes("source-workspace-visual-answer")),
      ),
    ];
    expect(naming).toEqual([]);
  });

  it("records the count of non-literal dynamic imports rather than waving at it", () => {
    // This is the stated limit of the method: a computed specifier is invisible
    // to a closure. The number is committed so a later reader can judge it.
    const record = committed();
    expect(record.observed.nonLiteralDynamicImports).toEqual(
      measuredObserved.nonLiteralDynamicImports,
    );
  });
});

describe("C-406 (4) — the scope names a surface a signed-in user can open", () => {
  it("/source/360 re-exports the /source/workspace page rather than mounting its own", () => {
    const specifier = reExportsDefaultFrom(CONTRACT_360_PAGE_REL);
    expect(specifier).toBe("../workspace/page");
  });

  it("the workspace page mounts the loader, which mounts the client that posts", () => {
    const pageClosure = closureOf(WORKSPACE_PAGE_REL);
    expect(pageClosure.fileSet.has(WORKSPACE_LOADER_REL)).toBe(true);
    expect(pageClosure.fileSet.has(WORKSPACE_CLIENT_REL)).toBe(true);
  });

  it("that client posts to the Ask aVa route and to no other api route", () => {
    expect(fetchedUrlLiterals(WORKSPACE_CLIENT_REL)).toContain("/api/intelligence/ask");
    expect(fetchedUrlLiterals(WORKSPACE_CLIENT_REL)).not.toContain("/api/chat/agent");
  });

  it("/source/optimize is the Source contract surface that DOES post to the chat route", () => {
    const pageClosure = closureOf(OPTIMIZE_PAGE_REL);
    expect(pageClosure.fileSet.has(OPTIMIZE_CLIENT_REL)).toBe(true);
    expect(fetchedUrlLiterals(OPTIMIZE_CLIENT_REL)).toContain("/api/chat/agent");
  });
});

describe("C-406 (5) — the cited number, and the scope it is committed with", () => {
  it("reads the same §12.11 record C-406's acceptance names", () => {
    expect(c403.specAcceptance.source).toContain("§12.11");
    expect(c403.specAcceptance.totalQuestionsRun).toBe(48);
    expect(c403.specAcceptance.fallbackCount).toBe(48);
  });

  it("scopes that count to the route that reaches the classifier it was measured on", () => {
    const record = committed();
    const scope = record.core.fallbackCountScope;
    const byRoute = new Map(record.core.entryPoints.map((e) => [e.route, e]));
    const describes = byRoute.get(scope.describesRoute);
    const doesNot = byRoute.get(scope.doesNotDescribeRoute);
    expect(describes?.reachesEventChatClassifier).toBe(true);
    expect(doesNot?.reachesEventChatClassifier).toBe(false);
  });

  it("does not let the scope be edited to name a route the classifier cannot serve", () => {
    // The invariant, rather than the prose: whatever route the record claims the
    // count describes must be one this suite measured as reaching the classifier.
    const record = committed();
    const reaching = record.core.entryPoints
      .filter((e) => e.reachesEventChatClassifier)
      .map((e) => e.route);
    expect(reaching).toContain(record.core.fallbackCountScope.describesRoute);
    expect(reaching).not.toContain(record.core.fallbackCountScope.doesNotDescribeRoute);
  });
});

describe("C-406 — the committed record equals what this suite recomputes", () => {
  it(`has the load-bearing facts of ${RECORD_REL} unchanged. ${REGENERATE}`, () => {
    expect(committed().core).toEqual(measuredCore);
  });
});
