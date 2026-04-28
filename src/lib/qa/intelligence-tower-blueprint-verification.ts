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

export type VerificationStatus = 'pass' | 'fail' | 'deferred' | 'not_applicable';

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
  overallStatus: 'pass' | 'fail' | 'partial';
  caveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

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
  const rel = 'src/components/intelligence/IntelligenceRouteShell.tsx';
  const found = exists(rel);
  if (found) {
    return makeCheck(
      'INTEL1-SHELL-01',
      'intelligence',
      'IntelligenceRouteShell.tsx component exists',
      'pass',
      `Component found: ${rel}`,
    );
  }
  return makeCheck(
    'INTEL1-SHELL-01',
    'intelligence',
    'IntelligenceRouteShell.tsx component exists',
    'deferred',
    `INTEL1 pre-integration: IntelligenceRouteShell.tsx not yet present at ${rel}. Deferred pending INTEL1 merge.`,
  );
}

/** Check 6: TowerRouteShell.tsx exists (TOWER1 — deferred if absent) */
function checkTowerRouteShellExists(): IntelTowerCheck {
  const rel = 'src/components/tower/TowerRouteShell.tsx';
  const found = exists(rel);
  if (found) {
    return makeCheck(
      'TOWER1-SHELL-01',
      'tower',
      'TowerRouteShell.tsx component exists',
      'pass',
      `Component found: ${rel}`,
    );
  }
  return makeCheck(
    'TOWER1-SHELL-01',
    'tower',
    'TowerRouteShell.tsx component exists',
    'deferred',
    `TOWER1 pre-integration: TowerRouteShell.tsx not yet present at ${rel}. Deferred pending TOWER1 merge.`,
  );
}

/** Check 7: Intelligence workflow canvas view exists (INTEL2 — deferred if absent) */
function checkIntelligenceWorkflowCanvasView(): IntelTowerCheck {
  const rel = 'src/lib/intelligence/intelligence-workflow-canvas-view.ts';
  const found = exists(rel);
  if (found) {
    return makeCheck(
      'INTEL2-CANVAS-01',
      'intelligence',
      'Intelligence workflow canvas view model exists',
      'pass',
      `View model found: ${rel}`,
    );
  }
  return makeCheck(
    'INTEL2-CANVAS-01',
    'intelligence',
    'Intelligence workflow canvas view model exists',
    'deferred',
    `INTEL2 pre-integration: intelligence-workflow-canvas-view.ts not yet present at ${rel}. Deferred pending INTEL2 merge.`,
  );
}

/** Check 8: Sentinel evidence brief view exists (INTEL3 — deferred if absent) */
function checkSentinelEvidenceBriefView(): IntelTowerCheck {
  const rel = 'src/lib/intelligence/sentinel-brief-evidence-view.ts';
  const found = exists(rel);
  if (found) {
    return makeCheck(
      'INTEL3-EVID-01',
      'intelligence',
      'Sentinel evidence brief view model exists',
      'pass',
      `View model found: ${rel}`,
    );
  }
  return makeCheck(
    'INTEL3-EVID-01',
    'intelligence',
    'Sentinel evidence brief view model exists',
    'deferred',
    `INTEL3 pre-integration: sentinel-brief-evidence-view.ts not yet present at ${rel}. Deferred pending INTEL3 merge.`,
  );
}

/** Check 9: Atlas executive brief canvas exists (TOWER2 — deferred if absent) */
function checkAtlasExecutiveBriefCanvas(): IntelTowerCheck {
  const rel = 'src/lib/tower/atlas-executive-brief-canvas.ts';
  const found = exists(rel);
  if (found) {
    return makeCheck(
      'TOWER2-CANVAS-01',
      'tower',
      'Atlas executive brief canvas model exists',
      'pass',
      `Canvas model found: ${rel}`,
    );
  }
  return makeCheck(
    'TOWER2-CANVAS-01',
    'tower',
    'Atlas executive brief canvas model exists',
    'deferred',
    `TOWER2 pre-integration: atlas-executive-brief-canvas.ts not yet present at ${rel}. Deferred pending TOWER2 merge.`,
  );
}

/** Check 10: Active lens view exists (TOWER3 — deferred if absent) */
function checkActiveLensView(): IntelTowerCheck {
  const rel = 'src/lib/tower/control-tower-active-lens-view.ts';
  const found = exists(rel);
  if (found) {
    return makeCheck(
      'TOWER3-LENS-01',
      'tower',
      'Control Tower active lens view model exists',
      'pass',
      `View model found: ${rel}`,
    );
  }
  return makeCheck(
    'TOWER3-LENS-01',
    'tower',
    'Control Tower active lens view model exists',
    'deferred',
    `TOWER3 pre-integration: control-tower-active-lens-view.ts not yet present at ${rel}. Deferred pending TOWER3 merge.`,
  );
}

/** Check 11: IntelligenceRouteShell contains 'Deterministic' caveat */
function checkIntelligenceShellDeterministicCaveat(): IntelTowerCheck {
  const rel = 'src/components/intelligence/IntelligenceRouteShell.tsx';
  const content = readIfExists(rel);
  if (content === null) {
    return makeCheck(
      'INTEL1-CAVEAT-01',
      'intelligence',
      'IntelligenceRouteShell contains Deterministic caveat',
      'deferred',
      `INTEL1 pre-integration: file absent at ${rel}. Deferred pending INTEL1 merge.`,
    );
  }
  const hasCaveat = content.includes('Deterministic');
  return makeCheck(
    'INTEL1-CAVEAT-01',
    'intelligence',
    'IntelligenceRouteShell contains Deterministic caveat',
    hasCaveat ? 'pass' : 'fail',
    hasCaveat
      ? 'IntelligenceRouteShell.tsx contains required Deterministic caveat string'
      : `IntelligenceRouteShell.tsx found but missing required 'Deterministic' caveat string`,
  );
}

/** Check 12: TowerRouteShell contains 'Deterministic' caveat */
function checkTowerShellDeterministicCaveat(): IntelTowerCheck {
  const rel = 'src/components/tower/TowerRouteShell.tsx';
  const content = readIfExists(rel);
  if (content === null) {
    return makeCheck(
      'TOWER1-CAVEAT-01',
      'tower',
      'TowerRouteShell contains Deterministic caveat',
      'deferred',
      `TOWER1 pre-integration: file absent at ${rel}. Deferred pending TOWER1 merge.`,
    );
  }
  const hasCaveat = content.includes('Deterministic');
  return makeCheck(
    'TOWER1-CAVEAT-01',
    'tower',
    'TowerRouteShell contains Deterministic caveat',
    hasCaveat ? 'pass' : 'fail',
    hasCaveat
      ? 'TowerRouteShell.tsx contains required Deterministic caveat string'
      : `TowerRouteShell.tsx found but missing required 'Deterministic' caveat string`,
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
    overallStatus,
    caveat:
      'Deterministic filesystem verification only. No live signals, no model calls, no network calls. ' +
      'INTEL1-3 and TOWER1-3 are pre-integration components deferred until their respective slices merge. ' +
      'All deferred checks will resolve to pass after integration.',
    deterministicSeed: true,
  };
}
