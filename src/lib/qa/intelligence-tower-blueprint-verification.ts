/**
 * QA29 — Intelligence / Tower Blueprint Verification
 *
 * Performs deterministic filesystem checks verifying that the Intelligence and
 * Control Tower page blueprints, route files, shell components, view-model
 * contracts, and supporting manifest entries are all present and correctly
 * formed.
 *
 * INTEL1-3 and TOWER1-3 are pre-integration components that may not yet exist
 * on this branch. Checks for those items return status: 'deferred' so the
 * overall suite passes now and will fully pass after integration.
 *
 * Every result is deterministic: the same filesystem state always produces the
 * same report. No model calls, no network calls, no Date.now, no Math.random.
 */

import * as fs from 'fs';
import * as path from 'path';

export type VerificationStatus =
  | 'pass'
  | 'fail'
  | 'deferred'
  | 'retired'
  | 'not_applicable';

export interface IntelTowerCheck {
  checkId: string;
  surface: 'intelligence' | 'tower' | 'shared';
  description: string;
  status: VerificationStatus;
  detail: string;
  deterministicSeed: true;
}

export interface IntelTowerBlueprintVerificationReport {
  reportId: string;
  checks: IntelTowerCheck[];
  passCount: number;
  failCount: number;
  deferredCount: number;
  /** Absent because it was removed on purpose — see `KNOWN_RETIREMENTS`. */
  retiredCount: number;
  overallStatus: 'pass' | 'fail' | 'partial';
  caveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

/**
 * Paths that are absent because something removed them, not because
 * something has not built them yet.
 *
 * These checks read a path off disk and, finding nothing, reported
 * `deferred`: "not yet present … Deferred pending INTEL1 merge". For a
 * component that was retired months ago that is the opposite of true, and
 * it reads as a promise that the work is still coming.
 *
 * A check that cannot tell "not built yet" from "deliberately deleted"
 * reports the wrong state in whichever direction the tree moves — so the
 * absent case is split, and the evidence for each retirement is recorded
 * beside it rather than assumed.
 *
 * Adding an entry is a claim that something was removed on purpose. An
 * absent path that is NOT listed here still reports `deferred`, which keeps
 * today's behaviour for everything nobody has established a reason for.
 */
const KNOWN_RETIREMENTS: Readonly<
  Record<string, { readonly retiredBy: string; readonly evidence: string }>
> = {
  'src/components/intelligence/IntelligenceRouteShell.tsx': {
    retiredBy: 'I1',
    evidence:
      'The July shell retirement removed it; the route renders AdvisoryIntelligencePage '
      + 'directly, and src/components/intelligence/ no longer exists.',
  },
};

/**
 * What an absent path means: removed on purpose, or not built yet.
 *
 * This is the only lookup: both the presence check and the caveat check call
 * it, so a test that drives it is guarding the code that runs rather than a
 * parallel copy of the rule.
 *
 * Exported because with every other blueprint path now present in the tree,
 * the real report exercises only the retired arm. A branch no run can reach
 * is not a safeguard, so the unexplained-absence arm is driven directly
 * instead of being shipped unexercised.
 */
export function retirementFor(
  rel: string,
): { readonly retiredBy: string; readonly evidence: string } | undefined {
  return Object.prototype.hasOwnProperty.call(KNOWN_RETIREMENTS, rel)
    ? KNOWN_RETIREMENTS[rel]
    : undefined;
}

/**
 * The verdict for a check whose whole question is "is this file here".
 *
 * Present is a pass. Absent-and-known-retired says so and names what
 * removed it. Absent and unexplained stays `deferred`, unchanged.
 */
function checkPathPresence(
  checkId: string,
  surface: IntelTowerCheck['surface'],
  description: string,
  rel: string,
  pendingItem: string,
  noun: string = 'Component',
): IntelTowerCheck {
  if (exists(rel)) {
    return makeCheck(checkId, surface, description, 'pass', `${noun} found: ${rel}`);
  }

  const retirement = retirementFor(rel);
  if (retirement) {
    return makeCheck(
      checkId,
      surface,
      description,
      'retired',
      `Removed on purpose by ${retirement.retiredBy}, not pending: ${rel} is absent because `
        + `${retirement.evidence} Reporting this as pre-integration would promise work that is `
        + 'not coming.',
    );
  }

  const basename = rel.slice(rel.lastIndexOf('/') + 1);
  return makeCheck(
    checkId,
    surface,
    description,
    'deferred',
    `${pendingItem} pre-integration: ${basename} not yet present at ${rel}. `
      + `Deferred pending ${pendingItem} merge.`,
  );
}

/**
 * The verdict for a check that reads a file's CONTENT for a marker.
 *
 * The presence checks were not the only place the absent case was answered.
 * The caveat checks read the same retired shell, found nothing, and repeated
 * the same "deferred pending INTEL1 merge" — so fixing only the presence
 * check would have left the report making the identical wrong promise from
 * the other seam.
 */
function checkFileContains(
  checkId: string,
  surface: IntelTowerCheck['surface'],
  description: string,
  rel: string,
  pendingItem: string,
  marker: string,
  label: string,
): IntelTowerCheck {
  const content = readIfExists(rel);
  if (content === null) {
    const retirement = retirementFor(rel);
    if (retirement) {
      return makeCheck(
        checkId,
        surface,
        description,
        'retired',
        `Removed on purpose by ${retirement.retiredBy}, not pending: there is no ${rel} to read a `
          + `'${marker}' caveat out of, because ${retirement.evidence} Reporting this as `
          + 'pre-integration would promise work that is not coming.',
      );
    }
    return makeCheck(
      checkId,
      surface,
      description,
      'deferred',
      `${pendingItem} pre-integration: file absent at ${rel}. Deferred pending ${pendingItem} merge.`,
    );
  }
  const hasMarker = content.includes(marker);
  return makeCheck(
    checkId,
    surface,
    description,
    hasMarker ? 'pass' : 'fail',
    hasMarker
      ? `${label} contains required ${marker} caveat string`
      : `${label} found but missing required '${marker}' caveat string`,
  );
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readIfExists(rel: string): string | null {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function isValidJson(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function makeCheck(
  checkId: string,
  surface: IntelTowerCheck['surface'],
  description: string,
  status: VerificationStatus,
  detail: string,
): IntelTowerCheck {
  return { checkId, surface, description, status, detail, deterministicSeed: true };
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

/** Check 1: Intelligence blueprint exists */
function checkIntelligenceBlueprintExists(): IntelTowerCheck {
  const rel = 'docs/platform-design/page-blueprints/INTELLIGENCE_PAGE_BLUEPRINT.md';
  const found = exists(rel);
  return makeCheck(
    'INTEL-BP-01',
    'intelligence',
    'Intelligence page blueprint file exists',
    found ? 'pass' : 'fail',
    found
      ? `Blueprint found: ${rel}`
      : `Blueprint MISSING: ${rel}`,
  );
}

/** Check 2: Control Tower blueprint exists */
function checkTowerBlueprintExists(): IntelTowerCheck {
  const rel = 'docs/platform-design/page-blueprints/CONTROL_TOWER_PAGE_BLUEPRINT.md';
  const found = exists(rel);
  return makeCheck(
    'TOWER-BP-01',
    'tower',
    'Control Tower page blueprint file exists',
    found ? 'pass' : 'fail',
    found
      ? `Blueprint found: ${rel}`
      : `Blueprint MISSING: ${rel}`,
  );
}

/** Check 3: Intelligence route file exists */
function checkIntelligenceRouteExists(): IntelTowerCheck {
  const rel = 'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx';
  const found = exists(rel);
  return makeCheck(
    'INTEL-ROUTE-01',
    'intelligence',
    'Intelligence route page.tsx exists',
    found ? 'pass' : 'fail',
    found
      ? `Route file found: ${rel}`
      : `Route file MISSING: ${rel}`,
  );
}

/** Check 4: Tower route file exists */
function checkTowerRouteExists(): IntelTowerCheck {
  const rel = 'src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx';
  const found = exists(rel);
  return makeCheck(
    'TOWER-ROUTE-01',
    'tower',
    'Tower route page.tsx exists',
    found ? 'pass' : 'fail',
    found
      ? `Route file found: ${rel}`
      : `Route file MISSING: ${rel}`,
  );
}

/** Check 5: IntelligenceRouteShell.tsx exists (INTEL1 — deferred if absent) */
function checkIntelligenceRouteShellExists(): IntelTowerCheck {
  return checkPathPresence(
    'INTEL1-SHELL-01',
    'intelligence',
    'IntelligenceRouteShell.tsx component exists',
    'src/components/intelligence/IntelligenceRouteShell.tsx',
    'INTEL1',
  );
}

/** Check 6: TowerRouteShell.tsx exists (TOWER1 — deferred if absent) */
function checkTowerRouteShellExists(): IntelTowerCheck {
  return checkPathPresence(
    'TOWER1-SHELL-01',
    'tower',
    'TowerRouteShell.tsx component exists',
    'src/components/tower/TowerRouteShell.tsx',
    'TOWER1',
  );
}

/** Check 7: Intelligence workflow canvas view exists (INTEL2 — deferred if absent) */
function checkIntelligenceWorkflowCanvasView(): IntelTowerCheck {
  return checkPathPresence(
    'INTEL2-CANVAS-01',
    'intelligence',
    'Intelligence workflow canvas view model exists',
    'src/lib/intelligence/intelligence-workflow-canvas-view.ts',
    'INTEL2',
    'View model',
  );
}

/** Check 8: Sentinel evidence brief view exists (INTEL3 — deferred if absent) */
function checkSentinelEvidenceBriefView(): IntelTowerCheck {
  return checkPathPresence(
    'INTEL3-EVID-01',
    'intelligence',
    'Sentinel evidence brief view model exists',
    'src/lib/intelligence/sentinel-brief-evidence-view.ts',
    'INTEL3',
    'View model',
  );
}

/** Check 9: Atlas executive brief canvas exists (TOWER2 — deferred if absent) */
function checkAtlasExecutiveBriefCanvas(): IntelTowerCheck {
  return checkPathPresence(
    'TOWER2-CANVAS-01',
    'tower',
    'Atlas executive brief canvas model exists',
    'src/lib/tower/atlas-executive-brief-canvas.ts',
    'TOWER2',
    'Canvas model',
  );
}

/** Check 10: Active lens view exists (TOWER3 — deferred if absent) */
function checkActiveLensView(): IntelTowerCheck {
  return checkPathPresence(
    'TOWER3-LENS-01',
    'tower',
    'Control Tower active lens view model exists',
    'src/lib/tower/control-tower-active-lens-view.ts',
    'TOWER3',
    'View model',
  );
}

/** Check 11: IntelligenceRouteShell contains 'Deterministic' caveat */
function checkIntelligenceShellDeterministicCaveat(): IntelTowerCheck {
  return checkFileContains(
    'INTEL1-CAVEAT-01',
    'intelligence',
    'IntelligenceRouteShell contains Deterministic caveat',
    'src/components/intelligence/IntelligenceRouteShell.tsx',
    'INTEL1',
    'Deterministic',
    'IntelligenceRouteShell.tsx',
  );
}

/** Check 12: TowerRouteShell contains 'Deterministic' caveat */
function checkTowerShellDeterministicCaveat(): IntelTowerCheck {
  return checkFileContains(
    'TOWER1-CAVEAT-01',
    'tower',
    'TowerRouteShell contains Deterministic caveat',
    'src/components/tower/TowerRouteShell.tsx',
    'TOWER1',
    'Deterministic',
    'TowerRouteShell.tsx',
  );
}

/** Check 13: AGENTX enforcement review doc exists */
function checkAgentxEnforcementDocExists(): IntelTowerCheck {
  const rel = 'docs/build/slices/AGENTX_AGENT_CENTRIC_ENFORCEMENT_REVIEW.md';
  const found = exists(rel);
  return makeCheck(
    'SHARED-AGENTX-01',
    'shared',
    'AGENTX enforcement review slice doc exists',
    found ? 'pass' : 'fail',
    found
      ? `AGENTX doc found: ${rel}`
      : `AGENTX doc MISSING: ${rel}`,
  );
}

/** Check 14: build-slices.json is valid JSON */
function checkBuildSlicesJsonValid(): IntelTowerCheck {
  const rel = 'docs/build/build-slices.json';
  const content = readIfExists(rel);
  if (content === null) {
    return makeCheck(
      'SHARED-SLICES-01',
      'shared',
      'build-slices.json exists and is valid JSON',
      'fail',
      `build-slices.json not found at ${rel}`,
    );
  }
  const valid = isValidJson(content);
  return makeCheck(
    'SHARED-SLICES-01',
    'shared',
    'build-slices.json exists and is valid JSON',
    valid ? 'pass' : 'fail',
    valid
      ? 'build-slices.json is present and parses as valid JSON'
      : 'build-slices.json is present but contains invalid JSON',
  );
}

/** Check 15: INTEL1/INTEL2/INTEL3 appear in build-slices.json when merged (deferred if not yet) */
function checkIntelSlicesInManifest(): IntelTowerCheck {
  const rel = 'docs/build/build-slices.json';
  const content = readIfExists(rel);
  if (content === null) {
    return makeCheck(
      'SHARED-SLICES-02',
      'shared',
      'INTEL1/INTEL2/INTEL3 slice entries present in build-slices.json',
      'deferred',
      'build-slices.json not readable; cannot check for INTEL slice entries. Deferred.',
    );
  }
  if (!isValidJson(content)) {
    return makeCheck(
      'SHARED-SLICES-02',
      'shared',
      'INTEL1/INTEL2/INTEL3 slice entries present in build-slices.json',
      'deferred',
      'build-slices.json is invalid JSON; cannot check for INTEL slice entries. Deferred.',
    );
  }
  // Check if any of INTEL1, INTEL2, INTEL3 appear as slice ids
  const hasIntel1 = content.includes('"INTEL1"');
  const hasIntel2 = content.includes('"INTEL2"');
  const hasIntel3 = content.includes('"INTEL3"');
  if (!hasIntel1 && !hasIntel2 && !hasIntel3) {
    return makeCheck(
      'SHARED-SLICES-02',
      'shared',
      'INTEL1/INTEL2/INTEL3 slice entries present in build-slices.json',
      'deferred',
      'INTEL1, INTEL2, and INTEL3 slice entries not yet present in build-slices.json. Deferred pending post-integration manifest update.',
    );
  }
  const found: string[] = [];
  if (hasIntel1) found.push('INTEL1');
  if (hasIntel2) found.push('INTEL2');
  if (hasIntel3) found.push('INTEL3');
  return makeCheck(
    'SHARED-SLICES-02',
    'shared',
    'INTEL1/INTEL2/INTEL3 slice entries present in build-slices.json',
    'pass',
    `Found in build-slices.json: ${found.join(', ')}`,
  );
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

export function runIntelTowerBlueprintVerification(): IntelTowerBlueprintVerificationReport {
  const checks: IntelTowerCheck[] = [
    checkIntelligenceBlueprintExists(),
    checkTowerBlueprintExists(),
    checkIntelligenceRouteExists(),
    checkTowerRouteExists(),
    checkIntelligenceRouteShellExists(),
    checkTowerRouteShellExists(),
    checkIntelligenceWorkflowCanvasView(),
    checkSentinelEvidenceBriefView(),
    checkAtlasExecutiveBriefCanvas(),
    checkActiveLensView(),
    checkIntelligenceShellDeterministicCaveat(),
    checkTowerShellDeterministicCaveat(),
    checkAgentxEnforcementDocExists(),
    checkBuildSlicesJsonValid(),
    checkIntelSlicesInManifest(),
  ];

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const deferredCount = checks.filter((c) => c.status === 'deferred').length;
  const retiredCount = checks.filter((c) => c.status === 'retired').length;

  let overallStatus: 'pass' | 'fail' | 'partial';
  if (failCount > 0) {
    overallStatus = 'fail';
  } else if (deferredCount > 0) {
    overallStatus = 'partial';
  } else {
    overallStatus = 'pass';
  }

  return {
    reportId: 'QA29-intel-tower-blueprint-verification',
    checks,
    passCount,
    failCount,
    deferredCount,
    retiredCount,
    overallStatus,
    caveat:
      'Deterministic filesystem verification only. No live signals, no model calls, no network calls. ' +
      'INTEL1-3 and TOWER1-3 are pre-integration components deferred until their respective slices merge. ' +
      'Deferred checks resolve to pass after integration. Retired checks will not: they name a component ' +
      'that was removed on purpose, and no merge is coming for them.',
    deterministicSeed: true,
  };
}
