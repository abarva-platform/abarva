#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Same graph walk the Source orphan baseline uses. A control on a component no
// route can reach is not a control the product has, however green its evidence
// tokens and its behavioral test are.
import { computeRouteReachability } from './lib/route-reachability.mjs';

// `unreachableReason` asserts things about the tree. Until item C-513 the only
// thing checked about it was that it was forty characters long, and one of its
// three clauses had already gone false while the gate stayed green.
import { evaluateUnreachableReason } from './lib/unreachable-reason-claims.mjs';

// The catalog this gate reads. `AI_SURFACE_CONTROL_CATALOG_PATH` is a test
// seam: it lets a suite run this script against a mutated copy and prove the
// gate goes red, which is the only way to show a branch can fail. Nothing in
// CI sets it — `npm run audit:ai-surface-controls` reads the file below.
const CATALOG_PATH = process.env.AI_SURFACE_CONTROL_CATALOG_PATH
  ? path.resolve(process.cwd(), process.env.AI_SURFACE_CONTROL_CATALOG_PATH)
  : path.join(process.cwd(), 'docs/security/ai-surface-control-catalog.json');

const WORKFLOW_PATH = '.github/workflows/ai-surface-control-catalog.yml';

const REQUIRED_CONTROL_KINDS = new Set([
  'ai-label',
  'citation',
  'citation-gap',
  'confidence',
  'human-approval-gate',
  'edit-before-commit',
  'responsibility-footer',
  'risk-caveat',
]);

const LEGAL_CATALOGS = [
  {
    id: 'consequential',
    path: 'docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md',
    header: '| Module | Surface / action | Code path | Current control | Required / next control |',
    parseClaims(columns) {
      const [module, surface, , currentControl] = columns;
      if (!currentControl?.startsWith('Covered')) return [];
      return [
        {
          key: `consequential|${module}|${surface}|human-approval-gate`,
          catalog: 'consequential',
          module,
          surface,
          controlKind: 'human-approval-gate',
        },
      ];
    },
  },
  {
    id: 'generated-ui',
    path: 'docs/legal/AI_GENERATED_UI_CATALOG.md',
    header:
      '| Module | Surface / element | Code path | AI label present? | Citations / evidence present? | Confidence / assumption disclosure present? | Required / next control |',
    parseClaims(columns) {
      const [module, surface, , aiLabel, citations, confidence] = columns;
      return [
        aiLabel?.startsWith('Yes') && {
          key: `generated-ui|${module}|${surface}|ai-label`,
          catalog: 'generated-ui',
          module,
          surface,
          controlKind: 'ai-label',
        },
        citations?.startsWith('Yes') && {
          key: `generated-ui|${module}|${surface}|citation`,
          catalog: 'generated-ui',
          module,
          surface,
          controlKind: 'citation',
        },
        confidence?.startsWith('Yes') && {
          key: `generated-ui|${module}|${surface}|confidence`,
          catalog: 'generated-ui',
          module,
          surface,
          controlKind: 'confidence',
        },
      ].filter(Boolean);
    },
  },
];

function fail(message, details = []) {
  console.error(message);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exit(1);
}

function parseMarkdownTableClaims(catalog) {
  const catalogPath = path.join(process.cwd(), catalog.path);
  if (!fs.existsSync(catalogPath)) {
    fail(`Legal catalog missing: ${catalog.path}`);
  }

  const expectedHeader = parseMarkdownTableColumns(catalog.header);
  const lines = fs.readFileSync(catalogPath, 'utf8').split(/\r?\n/);
  const claims = [];
  let inTable = false;

  for (const line of lines) {
    const columns = parseMarkdownTableColumns(line);
    if (!inTable && sameColumns(columns, expectedHeader)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (isMarkdownDivider(columns)) continue;
    if (columns.length === 0) break;

    claims.push(...catalog.parseClaims(columns));
  }

  return claims;
}

function parseMarkdownTableColumns(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  return trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((column) => column.trim());
}

function sameColumns(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isMarkdownDivider(columns) {
  return columns.length > 0 && columns.every((column) => /^:?-{3,}:?$/.test(column));
}

function collectLegalCatalogClaims() {
  return LEGAL_CATALOGS.flatMap(parseMarkdownTableClaims);
}

function readCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    fail(`AI surface control catalog missing: ${path.relative(process.cwd(), CATALOG_PATH)}`);
  }

  try {
    return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  } catch (error) {
    fail(`AI surface control catalog is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeCoverageEntries(catalog) {
  const entries = Array.isArray(catalog.catalogClaimCoverage)
    ? catalog.catalogClaimCoverage
    : [];
  return entries.filter((entry) => entry && typeof entry === 'object');
}

/**
 * Blank out comments so an evidence token is only matched against code that
 * runs. String literals are kept: several controls are legitimately evidenced
 * by prompt text or a rendered label. Replacing comment bodies with spaces
 * preserves offsets, so nothing else about the match shifts.
 */
function stripCommentsForEvidenceMatch(source) {
  let out = "";
  let i = 0;
  let mode = "code"; // code | line-comment | block-comment | single | double | backtick
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (mode === "code") {
      if (ch === "/" && next === "/") { mode = "line-comment"; out += "  "; i += 2; continue; }
      if (ch === "/" && next === "*") { mode = "block-comment"; out += "  "; i += 2; continue; }
      if (ch === "'") mode = "single";
      else if (ch === '"') mode = "double";
      else if (ch === "`") mode = "backtick";
      out += ch; i += 1; continue;
    }
    if (mode === "line-comment") {
      if (ch === "\n") { mode = "code"; out += ch; } else out += " ";
      i += 1; continue;
    }
    if (mode === "block-comment") {
      if (ch === "*" && next === "/") { mode = "code"; out += "  "; i += 2; continue; }
      out += ch === "\n" ? ch : " ";
      i += 1; continue;
    }
    // inside a string literal
    if (ch === "\\") { out += source.slice(i, i + 2); i += 2; continue; }
    if ((mode === "single" && ch === "'") || (mode === "double" && ch === '"') || (mode === "backtick" && ch === "`")) {
      mode = "code";
    }
    out += ch; i += 1;
  }
  return out;
}

/**
 * Which test files this catalog's own CI job actually runs, and with what name
 * filter. A behavioral test that exists on disk but is not wired into the job
 * proves nothing: it never runs on a PR that breaks the control. Both halves of
 * that — file present, file executed — have to be checked, because the gap
 * between them is invisible in every other artifact.
 */
function readWorkflowJestRuns() {
  const workflowPath = path.join(process.cwd(), WORKFLOW_PATH);
  if (!fs.existsSync(workflowPath)) {
    fail(`Control catalog workflow missing: ${WORKFLOW_PATH}`);
  }

  const runs = new Map();
  for (const line of fs.readFileSync(workflowPath, 'utf8').split(/\r?\n/)) {
    if (!line.includes('npx jest')) continue;
    const nameFilter = line.match(/-t\s+"([^"]+)"/)?.[1] ?? null;
    const byPath = line.includes('--runTestsByPath');
    for (const match of line.matchAll(/(src\/[^\s"']+\.test\.tsx?)/g)) {
      runs.set(match[1], { nameFilter, byPath });
    }
  }
  return runs;
}

const SUITE_SCAN_ROOT = 'src';
const SUITE_SCAN_SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'coverage']);

function isTestFile(relative) {
  return /(^|\/)__tests__\//.test(relative) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(relative);
}

function moduleToken(controlPath) {
  return path.basename(controlPath).replace(/\.[^.]+$/, '');
}

/**
 * Every test file that references each of these modules, walked from the tree.
 *
 * An uncovered control's `knownSuites` is checked against this, so the list is
 * derived rather than chosen. One walk covers every token because reading two
 * thousand test files once per control would make the gate slow enough that
 * someone would be tempted to skip it.
 */
function indexSuitesReferencing(tokens) {
  const index = new Map(tokens.map((token) => [token, []]));
  if (tokens.length === 0) return index;

  const walk = (relative) => {
    let entries;
    try {
      entries = fs.readdirSync(path.join(process.cwd(), relative), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SUITE_SCAN_SKIP.has(entry.name)) continue;
      const child = `${relative}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(child);
        continue;
      }
      if (!isTestFile(child)) continue;
      let text;
      try {
        text = fs.readFileSync(path.join(process.cwd(), child), 'utf8');
      } catch {
        continue;
      }
      for (const token of tokens) {
        if (text.includes(token)) index.get(token).push(child);
      }
    }
  };

  walk(SUITE_SCAN_ROOT);
  for (const list of index.values()) list.sort();
  return index;
}

/**
 * The tree, as the `unreachableReason` rules need to see it.
 *
 * Built once and injected rather than read inside the rules, so the same rules
 * can be driven over a constructed tree by a suite. A checker that can only be
 * run against this repository can only be tested by asserting what it happens
 * to print today.
 */
function buildReasonClaimIo() {
  let productFiles = null;

  const listProductFiles = () => {
    if (productFiles) return productFiles;
    productFiles = [];
    const walk = (relative) => {
      let entries;
      try {
        entries = fs.readdirSync(path.join(process.cwd(), relative), { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (SUITE_SCAN_SKIP.has(entry.name)) continue;
        const child = `${relative}/${entry.name}`;
        if (entry.isDirectory()) {
          walk(child);
          continue;
        }
        if (!/\.[cm]?[jt]sx?$/.test(child) || isTestFile(child)) continue;
        productFiles.push(child);
      }
    };
    walk(SUITE_SCAN_ROOT);
    return productFiles;
  };

  return {
    exists: (relative) => fs.existsSync(path.join(process.cwd(), relative)),
    read: (relative) => {
      try {
        return fs.readFileSync(path.join(process.cwd(), relative), 'utf8');
      } catch {
        return null;
      }
    },
    /*
     * A test is not an importer for this purpose. "Nothing imports X" is a
     * claim about the product reaching X, and X's own test importing it is
     * exactly the state the claim is describing, not a refutation of it.
     */
    importersOf: (needles) =>
      listProductFiles().filter((file) => {
        let text;
        try {
          text = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
        } catch {
          return false;
        }
        return needles.some((needle) =>
          new RegExp(
            `(?:from|require\\()\\s*['"\`][^'"\`]*${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`,
          ).test(text),
        );
      }),
  };
}

/**
 * Behavioral coverage is declared per control kind, not per surface. A surface
 * with four controls and a suite that exercises two of them is two covered and
 * two uncovered — counting it as one covered surface overstates the programme
 * by every control the suite never touched.
 */
function validateBehavioralTest(control, controlLabel, workflowRuns, surface, suiteIndex) {
  const declared = control.behavioralTest;
  const problems = [];

  if (!declared || typeof declared !== 'object') {
    return {
      problems: [
        `${controlLabel}: behavioralTest is required — declare a test path, or status "none" with a reason`,
      ],
      covered: false,
    };
  }

  if (declared.status === 'none') {
    if (declared.path) {
      problems.push(`${controlLabel}: behavioralTest status "none" must not also name a path`);
    }
    if (typeof declared.reason !== 'string' || declared.reason.trim().length < 40) {
      problems.push(
        `${controlLabel}: an uncovered control needs a concrete reason saying what is not proven`,
      );
    }

    // A reason of forty characters was everything this branch checked, and
    // prose cannot go stale loudly. One reason here read "the component has no
    // rendering suite" for weeks after a rendering suite landed, and the gate
    // stayed green because nothing compared the sentence to the tree.
    //
    // So the sentence is no longer alone: an uncovered control enumerates the
    // suites that reference its module, and that list is checked against a
    // walk of `src`. A suite appearing or disappearing turns this red until
    // someone reconciles the reason with it.
    const surfacePath = typeof surface?.path === 'string' ? surface.path : null;
    const actual = surfacePath ? (suiteIndex?.get(moduleToken(surfacePath)) ?? []) : [];
    const claimed = declared.knownSuites;

    if (!Array.isArray(claimed)) {
      problems.push(
        `${controlLabel}: an uncovered control must declare knownSuites — every test file that references ${surfacePath ?? 'its module'}, or [] when there are none`,
      );
    } else {
      for (const suite of actual.filter((file) => !claimed.includes(file))) {
        problems.push(
          `${controlLabel}: declares no behavioral test, but ${suite} references ${surfacePath} — name it in knownSuites and say in the reason what it does not prove`,
        );
      }
      for (const suite of claimed.filter((file) => !actual.includes(file))) {
        problems.push(
          `${controlLabel}: knownSuites names ${suite}, which no longer references ${surfacePath} — this list is derived from the tree, not chosen`,
        );
      }
    }

    return { problems, covered: false };
  }

  if (typeof declared.path !== 'string' || !declared.path.trim()) {
    return {
      problems: [`${controlLabel}: behavioralTest needs a path, or status "none"`],
      covered: false,
    };
  }

  if (!fs.existsSync(path.join(process.cwd(), declared.path))) {
    problems.push(`${controlLabel}: behavioral test does not exist (${declared.path})`);
    return { problems, covered: false };
  }

  const run = workflowRuns.get(declared.path);
  if (!run) {
    problems.push(
      `${controlLabel}: behavioral test ${declared.path} is never run by ${WORKFLOW_PATH} — a test that does not run proves nothing`,
    );
    return { problems, covered: false };
  }

  // A name-filtered step is coupled to a test title: rename the test and it
  // silently drops out of the gate. Declaring the filter here makes the catalog
  // fail on that rename instead of quietly covering less.
  const declaredFilter = typeof declared.nameFilter === 'string' ? declared.nameFilter : null;
  if (declaredFilter !== run.nameFilter) {
    problems.push(
      declaredFilter
        ? `${controlLabel}: declares name filter "${declaredFilter}" but ${WORKFLOW_PATH} runs ${declared.path} with ${run.nameFilter ? `"${run.nameFilter}"` : 'no filter'}`
        : `${controlLabel}: ${WORKFLOW_PATH} runs ${declared.path} filtered to "${run.nameFilter}", so the catalog must declare that filter rather than imply the whole suite`,
    );
  }

  // jest reads a bare pattern as a regex; the literal brackets in a route
  // segment like [programId] are a character class that matches nothing, so the
  // step passes having found no tests.
  if (declared.path.includes('[') && !run.byPath) {
    problems.push(
      `${controlLabel}: ${declared.path} contains a bracketed path segment and must be run with --runTestsByPath`,
    );
  }

  return { problems, covered: problems.length === 0 };
}

/**
 * A declared control has to be on a screen a user can get to.
 *
 * Evidence tokens prove the code exists. A behavioral test proves it renders in
 * isolation. Neither proves a route mounts it — and two of the surfaces in this
 * catalog were components no route could reach, already recorded as orphans by
 * a different audit while this one counted them as controls the product has.
 */
function validateRouteReachability(surface, label, reachable, roots, reasonClaimIo) {
  const problems = [];
  if (!surface.path) return { problems, reachable: false };

  const absolute = path.join(process.cwd(), surface.path);
  const isReachable = reachable.has(absolute);
  const declaredUnreachable = surface.routeReachable === false;

  if (isReachable && declaredUnreachable) {
    problems.push(
      `${label}: declares routeReachable false, but ${surface.path} is reachable from a route — the claim is stale`,
    );
    return { problems, reachable: true };
  }

  if (!isReachable && !declaredUnreachable) {
    problems.push(
      roots.length === 0
        ? `${label}: route graph found no entry points, so reachability cannot be judged`
        : `${label}: no route reaches ${surface.path} — a control on a surface no user can open is not a control the product has. Mount it, remove it, or declare routeReachable false with a reason.`,
    );
    return { problems, reachable: false };
  }

  if (declaredUnreachable) {
    const reason = surface.unreachableReason;
    if (typeof reason !== 'string' || reason.trim().length < 40) {
      problems.push(
        `${label}: routeReachable false needs a reason saying what is not on a screen and what would put it there`,
      );
    } else {
      // Length was the whole of this check until C-513. Now the clauses that
      // assert something about the tree are read back off the tree.
      problems.push(
        ...evaluateUnreachableReason({
          label,
          reason,
          surfacePath: surface.path,
          io: reasonClaimIo,
        }),
      );
    }
  }

  return { problems, reachable: isReachable };
}

function normalizeEvidence(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [];
}

function validateCatalogClaimCoverage(catalog, surfacesById) {
  const claims = collectLegalCatalogClaims();
  const claimKeys = new Set(claims.map((claim) => claim.key));
  const entries = normalizeCoverageEntries(catalog);
  const coverageByKey = new Map();
  const problems = [];

  for (const entry of entries) {
    const label = entry.key ?? 'unknown-catalog-claim';
    if (!entry.key || typeof entry.key !== 'string') {
      problems.push('catalogClaimCoverage entry missing key');
      continue;
    }
    if (coverageByKey.has(entry.key)) {
      problems.push(`${label}: duplicate catalog claim coverage entry`);
    }
    coverageByKey.set(entry.key, entry);

    if (!claimKeys.has(entry.key)) {
      problems.push(`${label}: does not match a current legal catalog claim`);
    }
    if (!['covered', 'deferred'].includes(entry.status)) {
      problems.push(`${label}: status must be covered or deferred`);
    }
    const claim = claims.find((item) => item.key === entry.key);
    if (claim && entry.controlKind !== claim.controlKind) {
      problems.push(`${label}: controlKind must be ${claim.controlKind}`);
    }
    if (entry.status === 'covered') {
      const surface = surfacesById.get(entry.surfaceId);
      if (!surface) {
        problems.push(`${label}: covered claim references unknown surfaceId ${entry.surfaceId ?? '(missing)'}`);
        continue;
      }
      const hasControl = (surface.requiredControls ?? []).some(
        (control) => control.kind === entry.controlKind,
      );
      if (!hasControl) {
        problems.push(`${label}: surface ${entry.surfaceId} does not include ${entry.controlKind}`);
      }
    }
    if (entry.status === 'deferred') {
      if (!entry.reason || typeof entry.reason !== 'string' || entry.reason.trim().length < 20) {
        problems.push(`${label}: deferred claims need a concrete reason`);
      }
    }
  }

  for (const claim of claims) {
    if (!coverageByKey.has(claim.key)) {
      problems.push(`${claim.key}: missing catalogClaimCoverage entry`);
    }
  }

  return problems;
}

function validateSurface(surface, index, workflowRuns, tally, routeGraph, suiteIndex, reasonClaimIo) {
  const label = surface?.id ?? `surface[${index}]`;
  const problems = [];

  if (!surface || typeof surface !== 'object') {
    return [`surface[${index}] must be an object`];
  }
  if (!surface.id || typeof surface.id !== 'string') {
    problems.push(`${label}: id is required`);
  }
  if (!surface.surface || typeof surface.surface !== 'string') {
    problems.push(`${label}: human-readable surface name is required`);
  }
  if (!surface.path || typeof surface.path !== 'string') {
    problems.push(`${label}: path is required`);
  }
  if (!Array.isArray(surface.requiredControls) || surface.requiredControls.length === 0) {
    problems.push(`${label}: requiredControls must include at least one control`);
  }

  const filePath = surface.path ? path.join(process.cwd(), surface.path) : null;
  const source = filePath && fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (filePath && !source) {
    problems.push(`${label}: path does not exist (${surface.path})`);
  }

  const reachability = validateRouteReachability(
    surface,
    label,
    routeGraph.reachable,
    routeGraph.roots,
    reasonClaimIo,
  );
  problems.push(...reachability.problems);

  const seenKinds = new Set();
  for (const control of surface.requiredControls ?? []) {
    const kind = control?.kind;
    const controlLabel = `${label}:${kind ?? 'unknown-control'}`;
    if (!REQUIRED_CONTROL_KINDS.has(kind)) {
      problems.push(`${controlLabel}: kind must be one of ${Array.from(REQUIRED_CONTROL_KINDS).join(', ')}`);
      continue;
    }
    if (seenKinds.has(kind)) {
      problems.push(`${controlLabel}: duplicate control kind`);
    }
    seenKinds.add(kind);

    const behavioral = validateBehavioralTest(control, controlLabel, workflowRuns, surface, suiteIndex);
    problems.push(...behavioral.problems);
    tally.declared += 1;
    if (!reachability.reachable) {
      // A test that renders an unmounted component proves the component, not
      // the product. Counting it as coverage is how a control nobody can see
      // ends up reported as a control that holds.
      tally.unreachable += 1;
    } else if (behavioral.covered) {
      tally.covered += 1;
    }

    const evidence = normalizeEvidence(control.evidence);
    if (evidence.length === 0) {
      problems.push(`${controlLabel}: evidence must include at least one code token`);
      continue;
    }
    if (source) {
      // Evidence must be code that runs, not a comment naming the control.
      // Matching raw source let a deleted control keep passing this gate for
      // eleven days after a comment carrying its name was added in its place.
      const executable = stripCommentsForEvidenceMatch(source);
      for (const token of evidence) {
        if (executable.includes(token)) continue;
        problems.push(
          source.includes(token)
            ? `${controlLabel}: evidence token "${token}" appears only in a comment in ${surface.path} — the control must be code that runs`
            : `${controlLabel}: missing evidence token "${token}" in ${surface.path}`,
        );
      }
    }
  }

  return problems;
}

function main() {
  const catalog = readCatalog();
  const surfaces = catalog.controls;
  if (!Array.isArray(surfaces) || surfaces.length === 0) {
    fail('AI surface control catalog must include a non-empty controls array.');
  }

  const ids = new Set();
  const surfacesById = new Map();
  const problems = [];
  const workflowRuns = readWorkflowJestRuns();
  const routeGraph = computeRouteReachability(process.cwd());
  const reasonClaimIo = buildReasonClaimIo();
  // Walked once, for the modules that claim to have no behavioral test.
  const suiteIndex = indexSuitesReferencing(
    Array.from(
      new Set(
        surfaces
          .filter((surface) =>
            (surface?.requiredControls ?? []).some(
              (control) => control?.behavioralTest?.status === 'none',
            ),
          )
          .map((surface) => surface?.path)
          .filter((value) => typeof value === 'string')
          .map(moduleToken),
      ),
    ),
  );
  const tally = { declared: 0, covered: 0, unreachable: 0 };
  surfaces.forEach((surface, index) => {
    if (surface?.id) {
      if (ids.has(surface.id)) {
        problems.push(`${surface.id}: duplicate surface id`);
      }
      ids.add(surface.id);
      surfacesById.set(surface.id, surface);
    }
    problems.push(...validateSurface(surface, index, workflowRuns, tally, routeGraph, suiteIndex, reasonClaimIo));
  });
  problems.push(...validateCatalogClaimCoverage(catalog, surfacesById));

  if (problems.length > 0) {
    fail('AI surface control catalog failed.', problems);
  }

  console.log(
    `AI surface control catalog passed (${surfaces.length} surfaces, ${tally.declared} declared controls, ${routeGraph.roots.length} route entry points).`,
  );
  // Counted per control, not per surface: a surface whose four controls have one
  // behavioral test is one covered and three uncovered.
  //
  // Two denominators, printed separately on purpose. A single `covered of
  // declared` figure conflates two problems with different owners — controls
  // that are reachable and untested, and controls nobody can open — and it
  // hides which one the number is actually about. Today it reports 29 of 37,
  // which reads as 78% tested with 8 controls lacking tests. The truth is that
  // every reachable control is tested and the whole gap is unreachability.
  //
  // The incentive note belongs on the second figure and only the second. A
  // control on an unmounted surface can never count as covered, so mounting
  // one moves it into the reachable denominator and, until it has a test,
  // lowers covered-of-reachable. `covered of declared` does not fall — its
  // numerator can only rise — which is why stating one figure without the
  // other makes the same action look good or bad depending on which is quoted.
  const reachable = tally.declared - tally.unreachable;
  const pct = (n, d) => (d === 0 ? "n/a" : `${Math.round((n / d) * 1000) / 10}%`);

  console.log(
    `Behavioral coverage of reachable controls: ${tally.covered} of ${reachable} (${pct(tally.covered, reachable)}).`,
  );
  console.log(
    `Reachable share of declared controls: ${reachable} of ${tally.declared} (${pct(reachable, tally.declared)}).`,
  );
  if (tally.unreachable > 0) {
    console.log(
      `Not on any screen: ${tally.unreachable} of ${tally.declared} controls sit on surfaces no route reaches. ` +
        "They can never be counted as covered, so they are outside the first figure and inside the second.",
    );
    console.log(
      `  Mounting one lowers the first figure until it has a test — ${tally.covered} of ${reachable + 1} ` +
        `(${pct(tally.covered, reachable + 1)}) for the next one mounted. That is the arithmetic working, not a regression.`,
    );
  }
}

main();
