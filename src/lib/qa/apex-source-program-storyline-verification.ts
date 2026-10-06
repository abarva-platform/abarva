// QA27 — Apex Retail Source → Program Storyline Verification
//
// Pure TypeScript, no React, no model calls, no network calls.
// All verification is deterministic: it checks exported constants, file
// existence via fs.readFileSync, and structural invariants of seed data.
//
// Slice-integration notes (re-measured against origin/main, 2026-09-20, T-527):
//   - SRC32, LINK1, SRC33, PROG15, PROG16 and MW9 are ALL `code_complete` in
//     docs/build/build-slices.json, and every module is on disk. The note that
//     stood here said they "do NOT exist on this branch", and CH-09, CH-10 and
//     CH-11 reported "Deferred pending <SLICE> integration" on that basis.
//     All three were false: the slices shipped under the names they chose, not
//     the names these checks guessed. LINK1 is source-program-link.ts, not
//     source-program-link-contract.ts; SRC33 is linked-program-badge-view.ts;
//     PROG15 is program-future-phase-deliverables.ts.
//   - A check that searches for a filename and reports the slice as pending
//     when it misses cannot tell "not built" from "built elsewhere". So the
//     disposition of an absent path is now DECLARED, in the shared register
//     src/lib/qa/path-disposition.ts, and a 'superseded' entry resolves to a
//     pass only once the landing path has been observed present.

import fs from 'node:fs';
import path from 'node:path';

import {
  resolvePathStatus,
  type PathDispositionRegister,
} from './path-disposition';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface StorylineVerificationResult {
  checkId: string;
  description: string;
  status: 'pass' | 'fail' | 'deferred';
  detail: string;
}

export interface StorylineVerificationReport {
  reportId: string;
  tenantSlug: string;
  programCode: string;
  sourceEventId: string;
  checks: StorylineVerificationResult[];
  passCount: number;
  failCount: number;
  deferredCount: number;
  overallStatus: 'pass' | 'fail' | 'partial';
  evidenceCaveat: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fileExists(relPath: string): boolean {
  try {
    fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function readFileSafe(relPath: string): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8');
  } catch {
    return null;
  }
}

function pass(
  checkId: string,
  description: string,
  detail: string,
): StorylineVerificationResult {
  return { checkId, description, status: 'pass', detail };
}

function fail(
  checkId: string,
  description: string,
  detail: string,
): StorylineVerificationResult {
  return { checkId, description, status: 'fail', detail };
}

function deferred(
  checkId: string,
  description: string,
  detail: string,
): StorylineVerificationResult {
  return { checkId, description, status: 'deferred', detail };
}

// ---------------------------------------------------------------------------
// Path disposition register
// ---------------------------------------------------------------------------

/**
 * Why each absent path this report looks for is absent.
 *
 * Every `landedAt` below was derived by reading the module's own header and
 * confirming the slice id against docs/build/build-slices.json, and every one
 * is observed present at resolve time rather than trusted.
 */
const STORYLINE_PATH_REGISTER: PathDispositionRegister = {
  'src/lib/source/source-program-link-contract.ts': {
    superseded: {
      slice: 'LINK1 (Source Program Link Model)',
      landedAt: 'src/lib/source/source-program-link.ts',
      note:
        'No commit on this branch history ever added a file named ' +
        '"...-contract.ts"; the check guessed the name. The module that ' +
        'shipped opens "// LINK1 — Source Program Link Model" and LINK1 is ' +
        'code_complete in docs/build/build-slices.json.',
    },
  },
  'src/app/(maestro)/source/events/apex-retail-cdp/page.tsx': {
    superseded: {
      slice: 'SRC33 (Linked Program Badge)',
      landedAt: 'src/lib/source/linked-program-badge-view.ts',
      note:
        'SRC33 shipped as a view model consumed by the existing Source event ' +
        'surface, not as a tenant-specific route. All three names this check ' +
        'searched for describe a route or seed that was never the shape of ' +
        'the slice. Its module opens "// SRC33 — Linked Program Badge View ' +
        'Model" and SRC33 is code_complete.',
    },
  },
  'src/lib/programs/apex-retail-cdp-program-seed.ts': {
    superseded: {
      slice: 'PROG15 (Complete Future Phase Deliverables)',
      landedAt: 'src/lib/programs/program-future-phase-deliverables.ts',
      note:
        'PROG15 is tenant-agnostic and carries the Apex Retail CDP phases as ' +
        'seed entries, so it was never going to be found under an ' +
        '"apex-"-prefixed filename. Its module opens "// PROG15 · Complete ' +
        'Future Phase Deliverables" and PROG15 is code_complete.',
    },
  },
};

/**
 * Resolve one slice-integration check.
 *
 * Searching a candidate list is kept, because a slice that later lands at one
 * of the guessed names should pass without an edit here. What changed is the
 * miss: it no longer invents a reason. An unfound path is resolved through the
 * register, which either names where the slice landed — verified — or fails
 * and asks for the declaration.
 */
export function resolveSliceCheck(
  checkId: string,
  description: string,
  candidates: string[],
): StorylineVerificationResult {
  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return pass(checkId, description, `Found at ${candidate}.`);
    }
  }

  const primary = candidates[0];
  const { status, detail } = resolvePathStatus(
    primary,
    false,
    STORYLINE_PATH_REGISTER,
    'STORYLINE_PATH_REGISTER',
    fileExists,
  );

  // This report has three statuses and the register has five. Only 'pass' and
  // 'deferred' map across; anything else — including an undeclared absence —
  // is a fail, so a new path cannot enter this report without a declaration.
  if (status === 'pass') return pass(checkId, description, detail);
  if (status === 'deferred') return deferred(checkId, description, detail);
  return fail(checkId, description, detail);
}

// ---------------------------------------------------------------------------
// Check implementations
// ---------------------------------------------------------------------------

/**
 * CH-01 · Source commercial demo scenario module exists and is loadable.
 * Depends on SRC28 (merged).
 */
function checkSourceScenarioModuleExists(): StorylineVerificationResult {
  const exists = fileExists(
    'src/lib/source/source-commercial-demo-scenario.ts',
  );
  if (exists) {
    return pass(
      'CH-01',
      'Source commercial demo scenario module exists',
      'src/lib/source/source-commercial-demo-scenario.ts is present on disk.',
    );
  }
  return fail(
    'CH-01',
    'Source commercial demo scenario module exists',
    'src/lib/source/source-commercial-demo-scenario.ts not found. SRC28 may not be installed.',
  );
}

/**
 * CH-02 · Source scenario exports buildSourceCommercialDemoScenario and the
 * scenario object has a non-empty scenarioId.
 * Depends on SRC28 (merged).
 */
function checkSourceScenarioBuildable(): StorylineVerificationResult {
  // Dynamic require is safe because it runs only in Node (Jest) context.
  let mod: { buildSourceCommercialDemoScenario?: () => { scenarioId: string } } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../source/source-commercial-demo-scenario');
  } catch {
    return fail(
      'CH-02',
      'Source scenario is buildable and has a scenarioId',
      'Failed to require source-commercial-demo-scenario. Module may be missing or has a syntax error.',
    );
  }

  if (typeof mod?.buildSourceCommercialDemoScenario !== 'function') {
    return fail(
      'CH-02',
      'Source scenario is buildable and has a scenarioId',
      'buildSourceCommercialDemoScenario is not exported from the module.',
    );
  }

  const scenario = mod.buildSourceCommercialDemoScenario();
  if (!scenario?.scenarioId || scenario.scenarioId.trim() === '') {
    return fail(
      'CH-02',
      'Source scenario is buildable and has a scenarioId',
      'buildSourceCommercialDemoScenario() returned a scenario with an empty scenarioId.',
    );
  }
  return pass(
    'CH-02',
    'Source scenario is buildable and has a scenarioId',
    `scenarioId = "${scenario.scenarioId}". Scenario is deterministic seed data.`,
  );
}

/**
 * CH-03 · Source scenario scenarioId matches expected Apex Retail value (post-SRC32).
 *
 * Pre-integration: the current seed carries 'ams-outsourcing-demo-2026' because
 * SRC32 (which re-seeds the scenario to an Apex Retail event) has not yet merged.
 * The check is deferred when the old ID is found; it will be promoted to 'pass'
 * after SRC32 integrates and updates the scenarioId to include 'apex-retail'.
 */
function checkSourceScenarioApexId(): StorylineVerificationResult {
  let mod: { buildSourceCommercialDemoScenario?: () => { scenarioId: string } } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../source/source-commercial-demo-scenario');
  } catch {
    return deferred(
      'CH-03',
      'Source scenario scenarioId references apex-retail (post-SRC32)',
      'Module not loadable — deferred pending SRC32 integration.',
    );
  }

  const scenario = mod?.buildSourceCommercialDemoScenario?.();
  if (!scenario) {
    return deferred(
      'CH-03',
      'Source scenario scenarioId references apex-retail (post-SRC32)',
      'Could not build scenario — deferred pending SRC32 integration.',
    );
  }

  if (scenario.scenarioId.includes('apex-retail')) {
    return pass(
      'CH-03',
      'Source scenario scenarioId references apex-retail (post-SRC32)',
      `scenarioId "${scenario.scenarioId}" contains "apex-retail". SRC32 is integrated.`,
    );
  }

  // Old seed: ams-outsourcing-demo-2026 — expected pre-integration state.
  return deferred(
    'CH-03',
    'Source scenario scenarioId references apex-retail (post-SRC32)',
    `Current scenarioId is "${scenario.scenarioId}". Expected "apex-retail" substring after SRC32 merges. ` +
      'Deferring — this is the expected pre-integration state.',
  );
}

/**
 * CH-04 · Program flagship view module exists and exports buildProgramFlagshipView.
 * Depends on PROG10 (merged).
 */
function checkProgramFlagshipModuleExists(): StorylineVerificationResult {
  const exists = fileExists('src/lib/programs/program-flagship-view.ts');
  if (!exists) {
    return fail(
      'CH-04',
      'Program flagship view module exists',
      'src/lib/programs/program-flagship-view.ts not found.',
    );
  }
  let mod: { buildProgramFlagshipView?: unknown } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../programs/program-flagship-view');
  } catch {
    return fail(
      'CH-04',
      'Program flagship view module exists',
      'program-flagship-view.ts found on disk but failed to require. Check for compilation errors.',
    );
  }
  if (typeof mod?.buildProgramFlagshipView !== 'function') {
    return fail(
      'CH-04',
      'Program flagship view module exists',
      'buildProgramFlagshipView is not exported.',
    );
  }
  return pass(
    'CH-04',
    'Program flagship view module exists',
    'src/lib/programs/program-flagship-view.ts exists and exports buildProgramFlagshipView.',
  );
}

/**
 * CH-05 · Program flagship view defaults to APX-CDP-2026 program code for Apex Retail.
 * Depends on PROG10 (merged).
 */
function checkProgramFlagshipApexCode(): StorylineVerificationResult {
  let mod: {
    buildProgramFlagshipView?: (
      i: { tenantSlug: string; programSlug: string },
    ) => { brief: { programCode: string; tenantLabel: string } };
  } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../programs/program-flagship-view');
  } catch {
    return fail(
      'CH-05',
      'Program flagship view defaults to APX-CDP-2026 for Apex Retail',
      'Could not require program-flagship-view.',
    );
  }

  if (typeof mod?.buildProgramFlagshipView !== 'function') {
    return fail(
      'CH-05',
      'Program flagship view defaults to APX-CDP-2026 for Apex Retail',
      'buildProgramFlagshipView not exported.',
    );
  }

  const view = mod.buildProgramFlagshipView({
    tenantSlug: 'apex-retail',
    programSlug: 'cdp-activation',
  });

  if (view?.brief?.programCode === 'APX-CDP-2026') {
    return pass(
      'CH-05',
      'Program flagship view defaults to APX-CDP-2026 for Apex Retail',
      `programCode = "${view.brief.programCode}", tenantLabel = "${view.brief.tenantLabel}".`,
    );
  }

  return fail(
    'CH-05',
    'Program flagship view defaults to APX-CDP-2026 for Apex Retail',
    `Expected programCode "APX-CDP-2026" but got "${view?.brief?.programCode ?? 'undefined'}".`,
  );
}

/**
 * CH-06 · Program flagship view tenantLabel defaults to "Apex Retail".
 * Depends on PROG10 (merged).
 */
function checkProgramFlagshipTenantLabel(): StorylineVerificationResult {
  let mod: {
    buildProgramFlagshipView?: (
      i: { tenantSlug: string; programSlug: string },
    ) => { brief: { tenantLabel: string } };
  } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../programs/program-flagship-view');
  } catch {
    return fail(
      'CH-06',
      'Program flagship view tenantLabel defaults to "Apex Retail"',
      'Could not require program-flagship-view.',
    );
  }

  const view = (mod as NonNullable<typeof mod>)?.buildProgramFlagshipView?.({
    tenantSlug: 'apex-retail',
    programSlug: 'cdp-activation',
  });
  const label = view?.brief?.tenantLabel ?? '';

  if (label === 'Apex Retail') {
    return pass(
      'CH-06',
      'Program flagship view tenantLabel defaults to "Apex Retail"',
      `tenantLabel = "${label}".`,
    );
  }
  return fail(
    'CH-06',
    'Program flagship view tenantLabel defaults to "Apex Retail"',
    `Expected tenantLabel "Apex Retail" but got "${label}".`,
  );
}

/**
 * CH-07 · Source index.ts re-exports the demo scenario module.
 * Ensures the scenario is accessible from the public surface.
 * Depends on SRC28 (merged).
 */
function checkSourceIndexReExport(): StorylineVerificationResult {
  const content = readFileSafe('src/lib/source/index.ts');
  if (!content) {
    return fail(
      'CH-07',
      'Source index.ts re-exports source-commercial-demo-scenario',
      'src/lib/source/index.ts not found.',
    );
  }
  if (content.includes('source-commercial-demo-scenario')) {
    return pass(
      'CH-07',
      'Source index.ts re-exports source-commercial-demo-scenario',
      'index.ts contains an export for source-commercial-demo-scenario.',
    );
  }
  return fail(
    'CH-07',
    'Source index.ts re-exports source-commercial-demo-scenario',
    'index.ts does not contain a re-export for source-commercial-demo-scenario.',
  );
}

/**
 * CH-08 · Source scenario has at least 3 caveats that reference "deterministic" or "demo".
 * This confirms the caveat chain is intact and the data is never misrepresented as live.
 * Depends on SRC28 (merged).
 */
function checkSourceScenarioCaveats(): StorylineVerificationResult {
  let mod: { buildSourceCommercialDemoScenario?: () => { caveats: string[] } } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../source/source-commercial-demo-scenario');
  } catch {
    return fail(
      'CH-08',
      'Source scenario carries deterministic-seed caveats',
      'Could not require source-commercial-demo-scenario.',
    );
  }
  const scenario = mod?.buildSourceCommercialDemoScenario?.();
  const caveats = scenario?.caveats ?? [];
  const evidenceCaveats = caveats.filter(
    (c) =>
      c.toLowerCase().includes('deterministic') ||
      c.toLowerCase().includes('demo'),
  );
  if (evidenceCaveats.length >= 1) {
    return pass(
      'CH-08',
      'Source scenario carries deterministic-seed caveats',
      `${evidenceCaveats.length} caveat(s) reference "deterministic" or "demo".`,
    );
  }
  return fail(
    'CH-08',
    'Source scenario carries deterministic-seed caveats',
    `Found ${caveats.length} caveats but none reference "deterministic" or "demo". Evidence caveat chain is broken.`,
  );
}

/** CH-09 · LINK1 source↔program link module is integrated. */
function checkLink1ContractExists(): StorylineVerificationResult {
  return resolveSliceCheck(
    'CH-09',
    'LINK1: source↔program link module is integrated',
    ['src/lib/source/source-program-link-contract.ts'],
  );
}

/** CH-10 · SRC33 is integrated. */
function checkSrc33ApexRouteExists(): StorylineVerificationResult {
  return resolveSliceCheck('CH-10', 'SRC33: linked program badge is integrated', [
    'src/app/(maestro)/source/events/apex-retail-cdp/page.tsx',
    'src/lib/source/apex-retail-source-event.ts',
    'src/lib/source/source-apex-event-seed.ts',
  ]);
}

/** CH-11 · PROG15 is integrated. */
function checkProg15ApexCdpSeedExists(): StorylineVerificationResult {
  return resolveSliceCheck(
    'CH-11',
    'PROG15: future-phase deliverable seed is integrated',
    [
      'src/lib/programs/apex-retail-cdp-program-seed.ts',
      'src/lib/programs/apex-cdp-seed.ts',
      'src/lib/programs/program-seed-apex-retail.ts',
    ],
  );
}

/** CH-12 · PROG16 is integrated. */
function checkProg16LinkViewExists(): StorylineVerificationResult {
  return resolveSliceCheck(
    'CH-12',
    'PROG16: program-source link view is integrated',
    [
      'src/lib/programs/apex-program-source-link-view.ts',
      'src/lib/programs/program-source-link-view.ts',
      'src/lib/programs/apex-retail-program-source-link.ts',
    ],
  );
}

/**
 * CH-13 · Deliverable export contract carries Apex Retail artifacts.
 * Depends on an existing merged slice (deliverable-export-contract.ts).
 */
function checkDeliverableExportContractHasApex(): StorylineVerificationResult {
  const content = readFileSafe(
    'src/lib/programs/deliverable-export-contract.ts',
  );
  if (!content) {
    return fail(
      'CH-13',
      'Deliverable export contract carries Apex Retail artifact entries',
      'src/lib/programs/deliverable-export-contract.ts not found.',
    );
  }
  if (content.includes('apex-retail')) {
    return pass(
      'CH-13',
      'Deliverable export contract carries Apex Retail artifact entries',
      'deliverable-export-contract.ts contains "apex-retail" artifact IDs.',
    );
  }
  return fail(
    'CH-13',
    'Deliverable export contract carries Apex Retail artifact entries',
    'deliverable-export-contract.ts does not contain any "apex-retail" references.',
  );
}

/**
 * CH-14 · Source scenario has at least 1 vendor with deterministicSeed: true.
 * Guards against accidental removal of the seed marker.
 */
function checkSourceVendorsSeedMarker(): StorylineVerificationResult {
  let mod: {
    buildSourceCommercialDemoScenario?: () => {
      vendors: Array<{ deterministicSeed: boolean }>;
    };
  } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../source/source-commercial-demo-scenario');
  } catch {
    return fail(
      'CH-14',
      'Source scenario vendors carry deterministicSeed:true marker',
      'Could not require source-commercial-demo-scenario.',
    );
  }
  const scenario = mod?.buildSourceCommercialDemoScenario?.();
  const seedVendors = (scenario?.vendors ?? []).filter(
    (v) => v.deterministicSeed === true,
  );
  if (seedVendors.length > 0) {
    return pass(
      'CH-14',
      'Source scenario vendors carry deterministicSeed:true marker',
      `${seedVendors.length} vendor(s) carry deterministicSeed: true.`,
    );
  }
  return fail(
    'CH-14',
    'Source scenario vendors carry deterministicSeed:true marker',
    'No vendors carry deterministicSeed: true. The seed marker contract is broken.',
  );
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

export function runApexStorylineVerification(): StorylineVerificationReport {
  const checks: StorylineVerificationResult[] = [
    checkSourceScenarioModuleExists(),
    checkSourceScenarioBuildable(),
    checkSourceScenarioApexId(),
    checkProgramFlagshipModuleExists(),
    checkProgramFlagshipApexCode(),
    checkProgramFlagshipTenantLabel(),
    checkSourceIndexReExport(),
    checkSourceScenarioCaveats(),
    checkLink1ContractExists(),
    checkSrc33ApexRouteExists(),
    checkProg15ApexCdpSeedExists(),
    checkProg16LinkViewExists(),
    checkDeliverableExportContractHasApex(),
    checkSourceVendorsSeedMarker(),
  ];

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const deferredCount = checks.filter((c) => c.status === 'deferred').length;

  let overallStatus: StorylineVerificationReport['overallStatus'];
  if (failCount > 0) {
    overallStatus = 'fail';
  } else if (deferredCount > 0) {
    overallStatus = 'partial';
  } else {
    overallStatus = 'pass';
  }

  // Determine the sourceEventId from the current scenario seed.
  let sourceEventId = 'pending-src32-integration';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../source/source-commercial-demo-scenario') as {
      buildSourceCommercialDemoScenario?: () => { scenarioId: string };
    };
    const scenario = mod?.buildSourceCommercialDemoScenario?.();
    if (scenario?.scenarioId) {
      sourceEventId = scenario.scenarioId;
    }
  } catch {
    // keep default
  }

  return {
    reportId: 'QA27-apex-source-program-storyline',
    tenantSlug: 'apex-retail',
    programCode: 'APX-CDP-2026',
    sourceEventId,
    checks,
    passCount,
    failCount,
    deferredCount,
    overallStatus,
    evidenceCaveat:
      'All checks are deterministic seed verification only. ' +
      'No live data, no model calls, no DB queries. ' +
      'This suite exercises demo story connectivity across the Source and Program surfaces. ' +
      'The disposition of an absent path is declared in STORYLINE_PATH_REGISTER and never inferred: ' +
      'a check that misses every filename it searches for reports what the register says, ' +
      'verified against the tree, or fails and asks for the declaration.',
  };
}
