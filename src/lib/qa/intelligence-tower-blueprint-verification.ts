/**
 * QA29 — Intelligence / Tower Blueprint Verification
 *
 * Performs deterministic filesystem checks verifying that the Intelligence and
 * Control Tower page blueprints, route files, shell components, view-model
 * contracts, and supporting manifest entries are all present and correctly
 * formed.
 *
 * An absent path is DECLARED, never inferred. Until T-521 every absent path
 * resolved to 'deferred' with the words "not yet present ... Deferred pending
 * <SLICE> merge" - that is, work that has not been built yet. Three of the
 * paths read here are not pending anything: the legacy surface sunset took the
 * tenant Intelligence route and the whole of src/components/intelligence/ with
 * it, and the shell component two of these checks name never landed on this
 * history at all.
 *
 * BLUEPRINT_PATH_REGISTER carries the disposition of every path that may be
 * absent, and resolvePathStatus refuses to guess:
 *
 *   absent  + declared retired -> 'removed', naming the commit that removed it
 *   absent  + declared pending -> 'deferred', naming the slice that adds it
 *   absent  + nothing declared -> 'fail', asking for the declaration
 *   present + declared retired -> 'fail', because the register went stale the
 *                                 other way and the file came back
 *   present + nothing declared -> 'pass'
 *
 * A removal keeps overallStatus at 'partial' rather than 'pass': the blueprint
 * still describes something the tree no longer has, and that loss stays
 * visible at the top line.
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
  | 'removed'
  | 'not_applicable';

/** A path that is gone on purpose, with the commit that removed it. */
export interface RetiredPath {
  /**
   * What the commit actually deleted.
   *
   * 'path' — the commit deleted this file.
   * 'containing-directory' — the file never appeared on this history at all,
   *   and the directory that would hold it was deleted by this commit. The
   *   distinction is not cosmetic: attributing a deletion to a commit that
   *   never held the file is the same class of false claim this register
   *   exists to stop, one level up.
   */
  scope: 'path' | 'containing-directory';
  /** Short SHA of the commit, on this branch's own history. */
  commit: string;
  /** The slice or change the deletion belongs to. */
  slice: string;
  /** What serves this purpose now, or null when nothing replaced it. */
  replacement: string | null;
  /** Why it went, in the words of the change that removed it. */
  note: string;
}

/** A path that has not been built yet, under a named slice. */
export interface PendingPath {
  slice: string;
  note: string;
}

export interface PathDisposition {
  retired?: RetiredPath;
  pending?: PendingPath;
}

export type PathDispositionRegister = Record<string, PathDisposition>;

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
  removedCount: number;
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

/**
 * Every path this report reads that may legitimately be absent.
 *
 * Nothing here is inferred from the tree: a path is absent because a named
 * commit removed it, or because a named slice has not added it yet, and an
 * absence that matches neither is a failure asking for this entry.
 */
export const BLUEPRINT_PATH_REGISTER: PathDispositionRegister = {
  'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx': {
    retired: {
      scope: 'path',
      commit: '0c6a86c51',
      slice: 'legacy surface sunset (v1/v2/v3/v4)',
      replacement: 'src/app/(maestro)/intelligence/page.tsx',
      note:
        'The tenant-scoped Intelligence route was sunset with the other legacy ' +
        'surface versions. The surviving /intelligence route renders ' +
        'AdvisoryIntelligencePage.',
    },
  },
  'src/components/intelligence/IntelligenceRouteShell.tsx': {
    retired: {
      scope: 'containing-directory',
      commit: '0c6a86c51',
      slice: 'legacy surface sunset (v1/v2/v3/v4)',
      replacement: null,
      note:
        'git log over this branch history finds no commit that added this file, ' +
        'so the check was written against a shell component that never landed ' +
        'here. What did exist is src/components/intelligence/, and the sunset ' +
        'removed it: twenty-odd components at 0c6a86c51 and the last two at ' +
        'd5e0ef495. Nothing wraps the surviving /intelligence route in a shell ' +
        'component.',
    },
  },
};

/**
 * Resolve one path to a status. Pure: the caller observes the filesystem, this
 * decides what the observation means.
 */
export function resolvePathStatus(
  rel: string,
  present: boolean,
  register: PathDispositionRegister = BLUEPRINT_PATH_REGISTER,
): { status: VerificationStatus; detail: string } {
  const disposition = register[rel];

  if (present) {
    if (disposition?.retired) {
      const { commit, slice } = disposition.retired;
      return {
        status: 'fail',
        detail:
          `${rel} is declared retired by ${commit} (${slice}) but the file is ` +
          'present. Either the retirement was reverted, in which case remove ' +
          'the BLUEPRINT_PATH_REGISTER entry, or this is an unintended ' +
          'restoration. A register that disagrees with the tree is no better ' +
          'than a guess.',
      };
    }
    return { status: 'pass', detail: `Found: ${rel}` };
  }

  if (disposition?.retired) {
    const { scope, commit, slice, replacement, note } = disposition.retired;
    const lead =
      scope === 'path'
        ? `Removed by ${commit} (${slice}): ${rel}.`
        : `Absent: ${rel}. The path itself never appeared on this history; the ` +
          `directory that would hold it was removed by ${commit} (${slice}).`;
    return {
      status: 'removed',
      detail: `${lead} ${note} Replacement: ${replacement ?? 'none'}.`,
    };
  }

  if (disposition?.pending) {
    const { slice, note } = disposition.pending;
    return {
      status: 'deferred',
      detail: `${slice} pre-integration: not yet present at ${rel}. ${note}`,
    };
  }

  return {
    status: 'fail',
    detail:
      `Absent at ${rel}, and nothing declares why. Declare it in ` +
      'BLUEPRINT_PATH_REGISTER as retired (with the commit that removed it) ' +
      'or pending (with the slice that adds it). An undeclared absence cannot ' +
      'be told apart from a deletion, and this report spent five months ' +
      'calling one deletion "not yet present".',
  };
}

function pathCheck(
  checkId: string,
  surface: IntelTowerCheck['surface'],
  description: string,
  rel: string,
): IntelTowerCheck {
  const { status, detail } = resolvePathStatus(rel, exists(rel));
  return makeCheck(checkId, surface, description, status, detail);
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
  return pathCheck(
    'INTEL-BP-01',
    'intelligence',
    'Intelligence page blueprint file exists',
    'docs/platform-design/page-blueprints/INTELLIGENCE_PAGE_BLUEPRINT.md',
  );
}

/** Check 2: Control Tower blueprint exists */
function checkTowerBlueprintExists(): IntelTowerCheck {
  return pathCheck(
    'TOWER-BP-01',
    'tower',
    'Control Tower page blueprint file exists',
    'docs/platform-design/page-blueprints/CONTROL_TOWER_PAGE_BLUEPRINT.md',
  );
}

/** Check 3: Intelligence route file exists */
function checkIntelligenceRouteExists(): IntelTowerCheck {
  return pathCheck(
    'INTEL-ROUTE-01',
    'intelligence',
    'Intelligence route page.tsx exists',
    'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
  );
}

/** Check 4: Tower route file exists */
function checkTowerRouteExists(): IntelTowerCheck {
  return pathCheck(
    'TOWER-ROUTE-01',
    'tower',
    'Tower route page.tsx exists',
    'src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx',
  );
}

/** Check 5: IntelligenceRouteShell.tsx exists (INTEL1 — deferred if absent) */
function checkIntelligenceRouteShellExists(): IntelTowerCheck {
  return pathCheck(
    'INTEL1-SHELL-01',
    'intelligence',
    'IntelligenceRouteShell.tsx component exists',
    'src/components/intelligence/IntelligenceRouteShell.tsx',
  );
}

/** Check 6: TowerRouteShell.tsx exists (TOWER1 — deferred if absent) */
function checkTowerRouteShellExists(): IntelTowerCheck {
  return pathCheck(
    'TOWER1-SHELL-01',
    'tower',
    'TowerRouteShell.tsx component exists',
    'src/components/tower/TowerRouteShell.tsx',
  );
}

/** Check 7: Intelligence workflow canvas view exists (INTEL2 — deferred if absent) */
function checkIntelligenceWorkflowCanvasView(): IntelTowerCheck {
  return pathCheck(
    'INTEL2-CANVAS-01',
    'intelligence',
    'Intelligence workflow canvas view model exists',
    'src/lib/intelligence/intelligence-workflow-canvas-view.ts',
  );
}

/** Check 8: Sentinel evidence brief view exists (INTEL3 — deferred if absent) */
function checkSentinelEvidenceBriefView(): IntelTowerCheck {
  return pathCheck(
    'INTEL3-EVID-01',
    'intelligence',
    'Sentinel evidence brief view model exists',
    'src/lib/intelligence/sentinel-brief-evidence-view.ts',
  );
}

/** Check 9: Atlas executive brief canvas exists (TOWER2 — deferred if absent) */
function checkAtlasExecutiveBriefCanvas(): IntelTowerCheck {
  return pathCheck(
    'TOWER2-CANVAS-01',
    'tower',
    'Atlas executive brief canvas model exists',
    'src/lib/tower/atlas-executive-brief-canvas.ts',
  );
}

/** Check 10: Active lens view exists (TOWER3 — deferred if absent) */
function checkActiveLensView(): IntelTowerCheck {
  return pathCheck(
    'TOWER3-LENS-01',
    'tower',
    'Control Tower active lens view model exists',
    'src/lib/tower/control-tower-active-lens-view.ts',
  );
}

/** Check 11: IntelligenceRouteShell contains 'Deterministic' caveat */
function checkIntelligenceShellDeterministicCaveat(): IntelTowerCheck {
  const rel = 'src/components/intelligence/IntelligenceRouteShell.tsx';
  const content = readIfExists(rel);
  if (content === null) {
    // Absence is the register's question, not this check's: a caveat
    // cannot be missing from a file that was deliberately removed.
    const { status, detail } = resolvePathStatus(rel, false);
    return makeCheck('INTEL1-CAVEAT-01', 'intelligence', 'IntelligenceRouteShell contains Deterministic caveat', status, detail);
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
    // Absence is the register's question, not this check's: a caveat
    // cannot be missing from a file that was deliberately removed.
    const { status, detail } = resolvePathStatus(rel, false);
    return makeCheck('TOWER1-CAVEAT-01', 'tower', 'TowerRouteShell contains Deterministic caveat', status, detail);
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
  return pathCheck(
    'SHARED-AGENTX-01',
    'shared',
    'AGENTX enforcement review slice doc exists',
    'docs/build/slices/AGENTX_AGENT_CENTRIC_ENFORCEMENT_REVIEW.md',
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
  const removedCount = checks.filter((c) => c.status === 'removed').length;

  // A removal is not a pass. The blueprint still describes something the tree
  // no longer has, so the loss stays visible on the top line.
  let overallStatus: 'pass' | 'fail' | 'partial';
  if (failCount > 0) {
    overallStatus = 'fail';
  } else if (deferredCount > 0 || removedCount > 0) {
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
    removedCount,
    overallStatus,
    caveat:
      'Deterministic filesystem verification only. No live signals, no model calls, no network calls. ' +
      'An absent path is declared, never inferred: a path a named commit removed is reported as ' +
      'removed with that commit, a path a named slice has not added yet is deferred, and an ' +
      'undeclared absence fails rather than passing itself off as pre-integration work. A report ' +
      'carrying removals is partial, not a clean pass.',
    deterministicSeed: true,
  };
}
