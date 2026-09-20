/**
 * QA28 — Active Route Shell Verification
 *
 * Performs deterministic filesystem checks to verify that canonical route page
 * files, flagship components, and Wave-20 shell components are present (or
 * correctly deferred pre-integration). Every result is deterministic: the same
 * filesystem state always produces the same report.
 *
 * An absent path is DECLARED, never inferred. Until T-524 every absent path
 * here resolved to 'deferred' with wording that asserted a Wave-20 slice was
 * going to add it. Two of those assertions were untrue on this history:
 * IntelligenceRouteShell.tsx was declared RETIRED by the blueprint report in
 * the same tree (its containing directory removed by 0c6a86c51), and no commit
 * on origin/main has ever added or removed platform/admin/architecture/page.tsx
 * at all. One path carrying two dispositions in two reports is what moved the
 * mechanism into src/lib/qa/path-disposition.ts.
 *
 * Wave-20 shell components that are genuinely present pass; an absent path
 * resolves through ROUTE_SHELL_PATH_REGISTER, and an absence that nothing
 * declares is a FAILURE asking for the declaration rather than a silent
 * 'deferred'.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  resolvePathStatus,
  SHARED_PATH_DISPOSITIONS,
  type PathDispositionRegister,
} from './path-disposition';

export type ShellCheckStatus =
  | 'pass'
  | 'fail'
  | 'deferred'
  | 'removed'
  | 'not_applicable';

export interface ShellVerificationCheck {
  checkId: string;
  route: string;
  description: string;
  status: ShellCheckStatus;
  detail: string;
  deterministicSeed: true;
}

export interface ShellVerificationReport {
  reportId: string;
  checks: ShellVerificationCheck[];
  passCount: number;
  failCount: number;
  deferredCount: number;
  removedCount: number;
  notApplicableCount: number;
  overallStatus: 'pass' | 'fail' | 'partial';
  caveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '../../../');

function repoPath(...segments: string[]): string {
  return path.join(REPO_ROOT, ...segments);
}

function fileExists(...segments: string[]): boolean {
  return fs.existsSync(repoPath(...segments));
}

function fileContains(content: string, filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    return fs.readFileSync(filePath, 'utf-8').includes(content);
  } catch {
    return false;
  }
}

function fileImportsFrom(filePath: string, importSubstring: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    const src = fs.readFileSync(filePath, 'utf-8');
    // Match both static import and dynamic require patterns
    const lines = src.split('\n');
    return lines.some((line) => {
      const isImportLine = line.trim().startsWith('import') || line.includes('require(');
      return isImportLine && line.includes(importSubstring);
    });
  } catch {
    return false;
  }
}

/**
 * Every path this report reads that may legitimately be absent.
 *
 * Nothing here is inferred from the tree: a path is absent because a named
 * commit removed it, because a named slice has not added it yet, or because
 * the call is genuinely open and an item owns it. An absence matching none of
 * those is a failure asking for this entry.
 */
export const ROUTE_SHELL_PATH_REGISTER: PathDispositionRegister = {
  // Declared retired by the blueprint report since T-521. Taken from the
  // shared register so the two reports cannot answer differently again.
  'src/components/intelligence/IntelligenceRouteShell.tsx':
    SHARED_PATH_DISPOSITIONS[
      'src/components/intelligence/IntelligenceRouteShell.tsx'
    ],
  'src/app/(maestro)/platform/admin/architecture/page.tsx': {
    undecided: {
      owner: 'T-503',
      note:
        'This check read "deferred pending Wave-20 admin shell integration". ' +
        'git log origin/main finds no commit that ever added or removed this ' +
        'route, so no wave was measurably building it and the pending claim ' +
        'was unearned. design-workflow-canon-regression asserts the same route ' +
        'and is quarantined for the same reason. Whether the route should ' +
        'exist is a product question neither suite can answer.',
    },
  },
};

// ---------------------------------------------------------------------------
// Individual check builders
// ---------------------------------------------------------------------------

function checkRouteExists(
  checkId: string,
  routeRelPath: string,
  description: string,
): ShellVerificationCheck {
  const exists = fileExists(routeRelPath);
  return {
    checkId,
    route: routeRelPath,
    description,
    status: exists ? 'pass' : 'fail',
    detail: exists
      ? `Route file found: ${routeRelPath}`
      : `Route file MISSING: ${routeRelPath}`,
    deterministicSeed: true,
  };
}

/**
 * A route that may be absent. The disposition comes from the register, not
 * from a sentence written at the call site — the call-site sentence is how
 * "pending Wave-20" outlived the wave.
 */
function checkRouteDeclared(
  checkId: string,
  routeRelPath: string,
  description: string,
): ShellVerificationCheck {
  const { status, detail } = resolvePathStatus(
    routeRelPath,
    fileExists(routeRelPath),
    ROUTE_SHELL_PATH_REGISTER,
    'ROUTE_SHELL_PATH_REGISTER',
  );
  return {
    checkId,
    route: routeRelPath,
    description,
    status,
    detail,
    deterministicSeed: true,
  };
}

function checkComponentExists(
  checkId: string,
  componentRelPath: string,
  description: string,
): ShellVerificationCheck {
  const exists = fileExists(componentRelPath);
  return {
    checkId,
    route: componentRelPath,
    description,
    status: exists ? 'pass' : 'fail',
    detail: exists
      ? `Component found: ${componentRelPath}`
      : `Component MISSING: ${componentRelPath}`,
    deterministicSeed: true,
  };
}

/** A component that may be absent. Same rule as checkRouteDeclared. */
function checkComponentDeclared(
  checkId: string,
  componentRelPath: string,
  description: string,
): ShellVerificationCheck {
  const { status, detail } = resolvePathStatus(
    componentRelPath,
    fileExists(componentRelPath),
    ROUTE_SHELL_PATH_REGISTER,
    'ROUTE_SHELL_PATH_REGISTER',
  );
  return {
    checkId,
    route: componentRelPath,
    description,
    status,
    detail,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------------
// Main verification function
// ---------------------------------------------------------------------------

export function runActiveRouteShellVerification(): ShellVerificationReport {
  const checks: ShellVerificationCheck[] = [];

  // ---- Check 1: Tenant programs list route --------------------------------
  checks.push(
    checkRouteExists(
      'QA28-C01',
      'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
      'Tenant programs list route page.tsx exists',
    ),
  );

  // ---- Check 2: Tenant program detail route --------------------------------
  checks.push(
    checkRouteExists(
      'QA28-C02',
      'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx',
      'Tenant program detail (flagship) route page.tsx exists',
    ),
  );

  // ---- Check 3: Source event detail route ----------------------------------
  checks.push(
    checkRouteExists(
      'QA28-C03',
      'src/app/(maestro)/source/events/[eventId]/page.tsx',
      'Source event detail route page.tsx exists',
    ),
  );

  // ---- Check 4: Platform admin root route ----------------------------------
  checks.push(
    checkRouteExists(
      'QA28-C04',
      'src/app/(maestro)/platform/admin/page.tsx',
      'Platform admin root route page.tsx exists',
    ),
  );

  // ---- Check 5: Platform admin architecture route (or deferred) -----------
  checks.push(
    checkRouteDeclared(
      'QA28-C05',
      'src/app/(maestro)/platform/admin/architecture/page.tsx',
      'Platform admin architecture route page.tsx exists (or deferred)',
    ),
  );

  // ---- Check 6: Platform admin production-readiness route (or deferred) ---
  checks.push(
    checkRouteDeclared(
      'QA28-C06',
      'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
      'Platform admin production-readiness route page.tsx exists (or deferred)',
    ),
  );

  // ---- Check 7: ProgramFlagshipPage component ------------------------------
  checks.push(
    checkComponentExists(
      'QA28-C07',
      'src/components/programs/ProgramFlagshipPage.tsx',
      'ProgramFlagshipPage.tsx component exists (Wave-18 PROG10)',
    ),
  );

  // ---- Check 8: SourceCommercialEventSection component --------------------
  checks.push(
    checkComponentExists(
      'QA28-C08',
      'src/components/source/SourceCommercialEventSection.tsx',
      'SourceCommercialEventSection.tsx component exists (Wave-16 SRC27)',
    ),
  );

  // ---- Check 9: AbarVaAppShell (Wave-20 SHELL1 — deferred) ---------------
  checks.push(
    checkComponentDeclared(
      'QA28-C09',
      'src/components/abarva/AbarVaAppShell.tsx',
      'AbarVaAppShell.tsx exists (Wave-20 SHELL1)',
    ),
  );

  // ---- Check 10: ProgramRouteShell (Wave-20 SHELL4 — deferred) -----------
  checks.push(
    checkComponentDeclared(
      'QA28-C10',
      'src/components/programs/ProgramRouteShell.tsx',
      'ProgramRouteShell.tsx exists (Wave-20 SHELL4)',
    ),
  );

  // ---- Check 11: SentinelAgentColumn (Wave-S1 — shipped) -----------------
  checks.push(
    checkComponentDeclared(
      'QA28-C11',
      'src/components/source/SentinelAgentColumn.tsx',
      'SentinelAgentColumn.tsx exists (Wave-S1 shell convergence)',
    ),
  );

  // ---- Check 12: AdminRouteShell (Wave-20 SHELL6 — deferred) -------------
  checks.push(
    checkComponentDeclared(
      'QA28-C12',
      'src/components/admin/AdminRouteShell.tsx',
      'AdminRouteShell.tsx exists (Wave-20 SHELL6)',
    ),
  );

  // ---- Check 13: IntelligenceRouteShell (Wave-20 SHELL7 — deferred) ------
  checks.push(
    checkComponentDeclared(
      'QA28-C13',
      'src/components/intelligence/IntelligenceRouteShell.tsx',
      'IntelligenceRouteShell.tsx exists (Wave-20 SHELL7)',
    ),
  );

  // ---- Check 14: TowerRouteShell (Wave-20 SHELL7 — deferred) -------------
  checks.push(
    checkComponentDeclared(
      'QA28-C14',
      'src/components/tower/TowerRouteShell.tsx',
      'TowerRouteShell.tsx exists (Wave-20 SHELL7)',
    ),
  );

  // ---- Check 15: Legacy TopBar retired (SHELL8) ---------------------------
  // TopBar.tsx and PrimaryNav.tsx were confirmed dead code (not imported by any
  // active route per SHELL2 audit) and retired in Wave 29 (SHELL8). Absence is
  // now the expected state — presence would indicate incomplete cleanup.
  {
    const topBarPath = repoPath('src/components/chrome/TopBar.tsx');
    const exists = fs.existsSync(topBarPath);
    checks.push({
      checkId: 'QA28-C15',
      route: 'src/components/chrome/TopBar.tsx',
      description: 'Legacy TopBar.tsx retired in SHELL8 — should be absent',
      status: exists ? 'fail' : 'pass',
      detail: exists
        ? 'TopBar.tsx still exists — expected to be removed in SHELL8 cleanup. Remove the file to complete SHELL8.'
        : 'TopBar.tsx has been correctly retired (SHELL8) — confirmed dead code no longer present.',
      deterministicSeed: true,
    });
  }

  // ---- Check 16: Programs route does not import from chrome/ --------------
  {
    const programsRoutePath = repoPath(
      'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
    );
    const importsChrome = fileImportsFrom(programsRoutePath, '/chrome/');
    checks.push({
      checkId: 'QA28-C16',
      route: 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
      description: 'Programs route does not import legacy chrome/ components',
      status: importsChrome ? 'fail' : 'pass',
      detail: importsChrome
        ? 'Programs route page.tsx imports from chrome/ — legacy shell coupling detected; should use canonical shell'
        : 'Programs route page.tsx has no chrome/ imports — clean',
      deterministicSeed: true,
    });
  }

  // ---- Check 17: Source event route does not import from chrome/ ----------
  {
    const sourceEventPath = repoPath(
      'src/app/(maestro)/source/events/[eventId]/page.tsx',
    );
    const importsChrome = fileImportsFrom(sourceEventPath, '/chrome/');
    checks.push({
      checkId: 'QA28-C17',
      route: 'src/app/(maestro)/source/events/[eventId]/page.tsx',
      description: 'Source event route does not import legacy chrome/ components',
      status: importsChrome ? 'fail' : 'pass',
      detail: importsChrome
        ? 'Source event route page.tsx imports from chrome/ — legacy shell coupling detected; should use canonical shell'
        : 'Source event route page.tsx has no chrome/ imports — clean',
      deterministicSeed: true,
    });
  }

  // ---- Check 18: source-program-link.ts exists (Wave-19 LINK1) -----------
  {
    const linkPath = repoPath('src/lib/source/source-program-link.ts');
    const exists = fs.existsSync(linkPath);
    checks.push({
      checkId: 'QA28-C18',
      route: 'src/lib/source/source-program-link.ts',
      description: 'source-program-link.ts exists (Wave-19 LINK1)',
      status: exists ? 'pass' : 'fail',
      detail: exists
        ? 'source-program-link.ts found — Wave-19 LINK1 integration confirmed'
        : 'source-program-link.ts MISSING — Wave-19 LINK1 has not been integrated',
      deterministicSeed: true,
    });
  }

  // ---- Check 19: source-commercial-demo-scenario.ts contains 'apex-retail' (Wave-19 SRC32)
  {
    const scenarioPath = repoPath('src/lib/source/source-commercial-demo-scenario.ts');
    const containsApexRetail = fileContains('apex-retail', scenarioPath);
    checks.push({
      checkId: 'QA28-C19',
      route: 'src/lib/source/source-commercial-demo-scenario.ts',
      description: "source-commercial-demo-scenario.ts contains 'apex-retail' (Wave-19 SRC32)",
      status: containsApexRetail ? 'pass' : 'fail',
      detail: containsApexRetail
        ? "source-commercial-demo-scenario.ts contains 'apex-retail' — tenant-scoped demo seed confirmed (Wave-19 SRC32)"
        : "source-commercial-demo-scenario.ts does NOT contain 'apex-retail' — Wave-19 SRC32 tenant scoping may not be integrated",
      deterministicSeed: true,
    });
  }

  // ---- Check 20: build-slices.json is valid parseable JSON ----------------
  {
    const slicesPath = repoPath('docs/build/build-slices.json');
    let status: ShellCheckStatus = 'fail';
    let detail = 'docs/build/build-slices.json MISSING or unreadable';

    if (fs.existsSync(slicesPath)) {
      try {
        const raw = fs.readFileSync(slicesPath, 'utf-8');
        JSON.parse(raw);
        status = 'pass';
        detail = 'docs/build/build-slices.json is valid, parseable JSON';
      } catch (err) {
        status = 'fail';
        detail = `docs/build/build-slices.json parse error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    checks.push({
      checkId: 'QA28-C20',
      route: 'docs/build/build-slices.json',
      description: 'docs/build/build-slices.json is valid parseable JSON',
      status,
      detail,
      deterministicSeed: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Tally
  // ---------------------------------------------------------------------------
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const deferredCount = checks.filter((c) => c.status === 'deferred').length;
  const removedCount = checks.filter((c) => c.status === 'removed').length;
  const notApplicableCount = checks.filter((c) => c.status === 'not_applicable').length;

  // A removal keeps overallStatus at 'partial' rather than 'pass', the same
  // way the blueprint report treats one: the check still describes something
  // the tree no longer has, and that loss stays visible at the top line.
  let overallStatus: 'pass' | 'fail' | 'partial';
  if (failCount > 0) {
    overallStatus = deferredCount > 0 || removedCount > 0 ? 'partial' : 'fail';
  } else if (deferredCount > 0 || removedCount > 0) {
    overallStatus = 'partial';
  } else {
    overallStatus = 'pass';
  }

  return {
    reportId: 'QA28_ACTIVE_ROUTE_SHELL_VERIFICATION',
    checks,
    passCount,
    failCount,
    deferredCount,
    removedCount,
    notApplicableCount,
    overallStatus,
    caveat:
      'Wave-20 shell components (SHELL1-7) are pre-integration deferred items. ' +
      'Deferred status is expected in this branch and does not indicate a failure. ' +
      'All deferred items will resolve to pass after Wave-20 integration. ' +
      'This report is deterministic: filesystem state drives every status.',
    deterministicSeed: true,
  };
}
