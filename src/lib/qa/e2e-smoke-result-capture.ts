export type SmokeResultStatus = 'pass' | 'fail' | 'deferred' | 'not_run' | 'blocked';
export type ReadinessImpact = 'none' | 'minor' | 'significant' | 'critical';

export interface RouteResult {
  id: string;
  route: string;
  persona: 'admin' | 'client' | 'investor' | 'guest';
  status: SmokeResultStatus;
  httpStatus: number | null;
  componentRendered: boolean | null;
  screenshotRef: string | null;
  blocker: string | null;
  notes: string;
  readinessImpact: ReadinessImpact;
  nextValidationAction: string;
}

export interface PersonaResult {
  persona: string;
  routesTested: number;
  passed: number;
  failed: number;
  deferred: number;
  blockers: string[];
}

export interface SmokeTestRun {
  runId: string;
  runDate: string;
  isLiveRun: boolean;
  environment: 'local-seed' | 'vercel-preview' | 'production';
  routeResults: RouteResult[];
  personaResults: PersonaResult[];
  totalRoutes: number;
  passedRoutes: number;
  failedRoutes: number;
  deferredRoutes: number;
  blockedRoutes: number;
  overallStatus: SmokeResultStatus;
  readinessSummary: string;
  nextActions: string[];
}

export interface SmokeResultCapture {
  schemaVersion: number;
  generatedAt: string;
  protocol: string;
  runs: SmokeTestRun[];
}

function buildPersonaResults(routeResults: RouteResult[]): PersonaResult[] {
  const personaMap: Record<string, PersonaResult> = {};

  for (const r of routeResults) {
    if (!personaMap[r.persona]) {
      personaMap[r.persona] = {
        persona: r.persona,
        routesTested: 0,
        passed: 0,
        failed: 0,
        deferred: 0,
        blockers: [],
      };
    }
    const pr = personaMap[r.persona];
    pr.routesTested += 1;
    if (r.status === 'pass') pr.passed += 1;
    else if (r.status === 'fail') pr.failed += 1;
    else if (r.status === 'deferred') pr.deferred += 1;
    if (r.blocker) pr.blockers.push(r.blocker);
  }

  return Object.values(personaMap);
}

export function buildSmokeResultFixture(): SmokeResultCapture {
  const routeResults: RouteResult[] = [
    {
      id: 'QA19-R01',
      route: '/home',
      persona: 'admin',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Home page renders with queue panel',
      readinessImpact: 'none',
      nextValidationAction: 'Verify with live DB data',
    },
    {
      id: 'QA19-R02',
      route: '/platform/admin',
      persona: 'admin',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Admin panel accessible with Clerk admin role',
      readinessImpact: 'none',
      nextValidationAction: 'Verify tenant switcher works in live demo',
    },
    {
      id: 'QA19-R03',
      route: '/platform/admin/production-readiness',
      persona: 'admin',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Production readiness tracker renders component table',
      readinessImpact: 'none',
      nextValidationAction: 'Verify live refresh shows correct CI/Vercel status',
    },
    {
      id: 'QA19-R04',
      route: '/platform/admin/build-progress',
      persona: 'admin',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Build progress shows wave 12 merged, wave 13 in progress',
      readinessImpact: 'none',
      nextValidationAction: 'Verify wave-13 slices appear after merge',
    },
    {
      id: 'QA19-R05',
      route: '/tenant/apex-retail/programs',
      persona: 'client',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Apex Retail program grid visible with 4 programs',
      readinessImpact: 'none',
      nextValidationAction: 'Verify program detail links work',
    },
    {
      id: 'QA19-R06',
      route: '/tenant/apex-retail/tower',
      persona: 'client',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Tower dashboard renders with Atlas signal cards',
      readinessImpact: 'none',
      nextValidationAction: 'Verify real cost signals with live integrations',
    },
    {
      id: 'QA19-R07',
      route: '/tenant/apex-retail/intelligence',
      persona: 'client',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Intelligence pattern library visible',
      readinessImpact: 'none',
      nextValidationAction: 'Verify pattern detail pages load',
    },
    {
      id: 'QA19-R08',
      route: '/source',
      persona: 'admin',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Source procurement dashboard renders',
      readinessImpact: 'none',
      nextValidationAction: 'Verify event detail and pricing normalization',
    },
    {
      id: 'QA19-R09',
      route: '/source/events',
      persona: 'admin',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Source event list renders with seed events',
      readinessImpact: 'none',
      nextValidationAction: 'Verify event detail route',
    },
    {
      id: 'QA19-R10',
      route: '/preview/programs',
      persona: 'guest',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Public preview programs page renders without auth',
      readinessImpact: 'none',
      nextValidationAction: 'Verify all preview routes accessible without Clerk',
    },
    {
      id: 'QA19-R11',
      route: '/preview/tower',
      persona: 'guest',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Public preview tower renders',
      readinessImpact: 'none',
      nextValidationAction: 'Verify preview investor route',
    },
    {
      id: 'QA19-R12',
      route: '/sign-in',
      persona: 'guest',
      status: 'pass',
      httpStatus: 200,
      componentRendered: true,
      screenshotRef: null,
      blocker: null,
      notes: 'Sign-in page renders with Clerk UI',
      readinessImpact: 'none',
      nextValidationAction: 'Verify OTP 424242 works for demo accounts',
    },
  ];

  const totalRoutes = routeResults.length;
  const passedRoutes = routeResults.filter((r) => r.status === 'pass').length;
  const failedRoutes = routeResults.filter((r) => r.status === 'fail').length;
  const deferredRoutes = routeResults.filter((r) => r.status === 'deferred').length;
  const blockedRoutes = routeResults.filter((r) => r.status === 'blocked').length;

  const run: SmokeTestRun = {
    runId: 'QA19-RUN-001',
    runDate: '2026-04-26',
    isLiveRun: false,
    environment: 'local-seed',
    routeResults,
    personaResults: buildPersonaResults(routeResults),
    totalRoutes,
    passedRoutes,
    failedRoutes,
    deferredRoutes,
    blockedRoutes,
    overallStatus: 'pass',
    readinessSummary:
      'All 12 seed routes pass in local-seed environment. Live run required to validate with real DB and Clerk auth.',
    nextActions: [
      'Run live smoke against Vercel preview URL',
      'Validate Apex Retail demo tenant routes with demo Clerk accounts',
      'Capture screenshot evidence for boardroom demo preparation',
    ],
  };

  return {
    schemaVersion: 1,
    generatedAt: '2026-04-26',
    protocol: 'QA19-E2E-SMOKE-RESULT-CAPTURE-v1',
    runs: [run],
  };
}

export function validateSmokeResultCapture(capture: SmokeResultCapture): string[] {
  const errors: string[] = [];

  if (capture.schemaVersion !== 1) {
    errors.push(`schemaVersion must be 1, got ${capture.schemaVersion}`);
  }

  if (!capture.generatedAt) {
    errors.push('generatedAt must be non-empty');
  }

  if (!capture.runs || capture.runs.length === 0) {
    errors.push('runs must be non-empty');
    return errors;
  }

  for (const run of capture.runs) {
    if (!run.runId) {
      errors.push('run.runId must be non-empty');
    }
    if (!run.runDate) {
      errors.push('run.runDate must be non-empty');
    }
    if (run.totalRoutes !== run.routeResults.length) {
      errors.push(
        `run ${run.runId}: totalRoutes (${run.totalRoutes}) does not match routeResults.length (${run.routeResults.length})`,
      );
    }
  }

  return errors;
}
