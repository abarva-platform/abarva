#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Same graph walk the Source orphan baseline uses. A control on a component no
// route can reach is not a control the product has, however green its evidence
// tokens and its behavioral test are.
import { computeRouteReachability } from './lib/route-reachability.mjs';

const CATALOG_PATH = path.join(
  process.cwd(),
  'docs/security/ai-surface-control-catalog.json',
);

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

/**
 * Behavioral coverage is declared per control kind, not per surface. A surface
 * with four controls and a suite that exercises two of them is two covered and
 * two uncovered — counting it as one covered surface overstates the programme
 * by every control the suite never touched.
 */
function validateBehavioralTest(control, controlLabel, workflowRuns) {
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
function validateRouteReachability(surface, label, reachable, roots) {
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

function validateSurface(surface, index, workflowRuns, tally, routeGraph) {
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

    const behavioral = validateBehavioralTest(control, controlLabel, workflowRuns);
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
  const tally = { declared: 0, covered: 0, unreachable: 0 };
  surfaces.forEach((surface, index) => {
    if (surface?.id) {
      if (ids.has(surface.id)) {
        problems.push(`${surface.id}: duplicate surface id`);
      }
      ids.add(surface.id);
      surfacesById.set(surface.id, surface);
    }
    problems.push(...validateSurface(surface, index, workflowRuns, tally, routeGraph));
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
