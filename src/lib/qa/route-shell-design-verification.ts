import fs from 'node:fs';
import path from 'node:path';

export type RouteShellComplianceStatus =
  | 'compliant'
  | 'partial'
  | 'legacy'
  | 'noncompliant'
  | 'missing';

export interface RouteShellDesignVerificationEntry {
  routePattern: string;
  routeFile: string;
  ownerSurface: 'admin' | 'source' | 'programs';
  requiredCanonicalShellMarkers: string[];
  requiredWorkflowMarkers: string[];
  disallowedLegacyImports: string[];
  approvedLegacyImports?: string[];
  routeExists: boolean;
  mountedCommercialSurface: boolean;
  shellComplianceStatus: RouteShellComplianceStatus;
  workflowMarkersPresent: string[];
  legacyFindings: string[];
  deferredReason?: string;
  remediation: string;
}

export interface RouteShellDesignVerificationReport {
  generatedAt: string;
  deterministic: true;
  targetRoutes: RouteShellDesignVerificationEntry[];
  summary: {
    totalRoutes: number;
    compliantRoutes: number;
    deferredRoutes: number;
    nonCompliantRoutes: number;
  };
}

interface RouteRule {
  routePattern: string;
  routeFile: string;
  ownerSurface: 'admin' | 'source' | 'programs';
  requiredCanonicalShellMarkers: string[];
  requiredWorkflowMarkers: string[];
  disallowedLegacyImports: string[];
  approvedLegacyImports?: string[];
  remediation: string;
}

const ROUTE_RULES: RouteRule[] = [
  {
    routePattern: '/platform/admin',
    routeFile: 'src/app/(maestro)/platform/admin/page.tsx',
    ownerSurface: 'admin',
    requiredCanonicalShellMarkers: ['AdminCanonShell'],
    requiredWorkflowMarkers: ['primaryAgent', 'pageQuestion'],
    disallowedLegacyImports: ['StewardAdminRail'],
    remediation: 'Mount the admin route in AdminCanonShell and remove StewardAdminRail from active route ownership.',
  },
  {
    routePattern: '/platform/admin/architecture',
    routeFile: 'src/app/(maestro)/platform/admin/architecture/page.tsx',
    ownerSurface: 'admin',
    requiredCanonicalShellMarkers: ['AdminCanonShell', 'ArchitectureCanvas'],
    requiredWorkflowMarkers: ['primaryAgent', 'pageQuestion'],
    disallowedLegacyImports: ['StewardAdminRail'],
    remediation: 'Wrap architecture route with AdminCanonShell while preserving ArchitectureCanvas + overview content.',
  },
  {
    routePattern: '/platform/admin/production-readiness',
    routeFile: 'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
    ownerSurface: 'admin',
    requiredCanonicalShellMarkers: ['AdminCanonShell', 'ProductionReadinessTracker'],
    requiredWorkflowMarkers: ['primaryAgent', 'pageQuestion'],
    disallowedLegacyImports: ['StewardAdminRail'],
    remediation: 'Keep tracker route guard and wrap route in AdminCanonShell with deterministic caveat.',
  },
  {
    routePattern: '/platform/admin/build-progress',
    routeFile: 'src/app/(maestro)/platform/admin/build-progress/page.tsx',
    ownerSurface: 'admin',
    requiredCanonicalShellMarkers: ['AdminCanonShell', 'BuildProgressDashboard'],
    requiredWorkflowMarkers: ['primaryAgent', 'pageQuestion'],
    disallowedLegacyImports: ['StewardAdminRail'],
    remediation: 'Keep build progress guard and mount route in AdminCanonShell.',
  },
  {
    routePattern: '/source',
    routeFile: 'src/app/(maestro)/source/page.tsx',
    ownerSurface: 'source',
    requiredCanonicalShellMarkers: ['AppShell', 'SentinelAgentColumn'],
    requiredWorkflowMarkers: ['SentinelAgentColumn'],
    disallowedLegacyImports: ['StewardAdminRail', 'SourceCanonShell', 'SourceFoundationShell', 'SourceRouteShell'],
    remediation: 'Use AppShell + SentinelAgentColumn on Source routes (Wave S1 migration).',
  },
  {
    routePattern: '/source/events',
    routeFile: 'src/app/(maestro)/source/events/page.tsx',
    ownerSurface: 'source',
    requiredCanonicalShellMarkers: ['AppShell', 'SentinelAgentColumn'],
    requiredWorkflowMarkers: ['SentinelAgentColumn'],
    disallowedLegacyImports: ['StewardAdminRail', 'SourceCanonShell', 'SourceFoundationShell', 'SourceRouteShell'],
    remediation: 'Use AppShell + SentinelAgentColumn on source events index route (Wave S1 migration).',
  },
  {
    routePattern: '/source/events/[eventId]',
    routeFile: 'src/app/(maestro)/source/events/[eventId]/page.tsx',
    ownerSurface: 'source',
    requiredCanonicalShellMarkers: ['AppShell', 'SentinelAgentColumn', 'SourceCommercialEventSection'],
    requiredWorkflowMarkers: ['SentinelAgentColumn'],
    disallowedLegacyImports: ['StewardAdminRail', 'SourceCanonShell', 'SourceFoundationShell', 'SourceRouteShell'],
    remediation: 'Ensure event detail route mounts SourceCommercialEventSection inside AppShell + SentinelAgentColumn.',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs',
    routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
    ownerSurface: 'programs',
    requiredCanonicalShellMarkers: ['ProgramCanonShell', 'ProgramsCanonicalIndex'],
    requiredWorkflowMarkers: ['Journey → Phase → Gate → Nexus next action'],
    disallowedLegacyImports: ['LegacyProgramDetailPage'],
    remediation: 'Wrap tenant programs index route in ProgramCanonShell while preserving index behavior.',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs/[programSlug]',
    routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx',
    ownerSurface: 'programs',
    requiredCanonicalShellMarkers: ['ProgramCanonShell', 'ProgramCanonicalDetail'],
    requiredWorkflowMarkers: ['Journey → Phase → Gate → Nexus next action'],
    disallowedLegacyImports: ['LegacyProgramDetailPage'],
    remediation: 'Wrap tenant program detail route in ProgramCanonShell while preserving canonical detail behavior.',
  },
];

const DEFERRED_ROUTE_PATTERNS = new Map<string, string>([
  ['/platform/admin', 'Route still bound to legacy rail shell before Wave 17A integration branch reconciliation.'],
  ['/platform/admin/architecture', 'Canonical wrapper not yet mounted in this branch snapshot.'],
  ['/platform/admin/production-readiness', 'Canonical wrapper not yet mounted in this branch snapshot.'],
  ['/platform/admin/build-progress', 'Canonical wrapper not yet mounted in this branch snapshot.'],
  ['/source', 'Source route shell enforcement lands in DESROUTE4 branch and integration cherry-pick.'],
  ['/source/events', 'Source route shell enforcement lands in DESROUTE4 branch and integration cherry-pick.'],
  ['/source/events/[eventId]', 'Source route shell enforcement lands in DESROUTE4 branch and integration cherry-pick.'],
  ['/tenant/[tenantSlug]/programs', 'Program route shell enforcement lands in DESROUTE5 branch and integration cherry-pick.'],
  ['/tenant/[tenantSlug]/programs/[programSlug]', 'Program route shell enforcement lands in DESROUTE5 branch and integration cherry-pick.'],
]);

function readFileIfExists(relativePath: string): string | null {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function computeStatus(
  routeExists: boolean,
  hasCanonicalMarkers: boolean,
  hasLegacyFindings: boolean,
): RouteShellComplianceStatus {
  if (!routeExists) return 'missing';
  if (hasLegacyFindings) return 'legacy';
  if (!hasCanonicalMarkers) return 'noncompliant';
  return 'compliant';
}

export function buildRouteShellDesignVerificationReport(): RouteShellDesignVerificationReport {
  const targetRoutes: RouteShellDesignVerificationEntry[] = ROUTE_RULES.map((rule) => {
    const source = readFileIfExists(rule.routeFile);
    const routeExists = source !== null;
    const content = source ?? '';

    const missingCanonicalMarkers = rule.requiredCanonicalShellMarkers.filter(
      (marker) => !content.includes(marker),
    );
    const workflowMarkersPresent = rule.requiredWorkflowMarkers.filter((marker) =>
      content.includes(marker),
    );
    const legacyFindings = rule.disallowedLegacyImports.filter((token) =>
      content.includes(token),
    );

    const shellComplianceStatus = computeStatus(
      routeExists,
      missingCanonicalMarkers.length === 0,
      legacyFindings.length > 0,
    );

    const deferredReason =
      shellComplianceStatus === 'compliant'
        ? undefined
        : DEFERRED_ROUTE_PATTERNS.get(rule.routePattern);

    return {
      routePattern: rule.routePattern,
      routeFile: rule.routeFile,
      ownerSurface: rule.ownerSurface,
      requiredCanonicalShellMarkers: [...rule.requiredCanonicalShellMarkers],
      requiredWorkflowMarkers: [...rule.requiredWorkflowMarkers],
      disallowedLegacyImports: [...rule.disallowedLegacyImports],
      approvedLegacyImports: rule.approvedLegacyImports
        ? [...rule.approvedLegacyImports]
        : undefined,
      routeExists,
      mountedCommercialSurface:
        rule.routePattern === '/source/events/[eventId]'
          ? content.includes('SourceCommercialEventSection')
          : false,
      shellComplianceStatus,
      workflowMarkersPresent,
      legacyFindings,
      deferredReason,
      remediation: rule.remediation,
    };
  });

  const compliantRoutes = targetRoutes.filter(
    (route) => route.shellComplianceStatus === 'compliant',
  ).length;
  const deferredRoutes = targetRoutes.filter((route) => !!route.deferredReason).length;
  const nonCompliantRoutes = targetRoutes.filter(
    (route) => route.shellComplianceStatus !== 'compliant' && !route.deferredReason,
  ).length;

  return {
    generatedAt: 'deterministic-route-shell-design-verification-v1',
    deterministic: true,
    targetRoutes,
    summary: {
      totalRoutes: targetRoutes.length,
      compliantRoutes,
      deferredRoutes,
      nonCompliantRoutes,
    },
  };
}

