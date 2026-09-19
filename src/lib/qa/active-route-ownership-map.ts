export type RouteCompliance = 'unknown' | 'legacy' | 'partial' | 'compliant';
export type RouteRisk = 'low' | 'medium' | 'high';

export interface ActiveRouteOwnershipEntry {
  routePattern: string;
  activeRouteFile: string;
  activePageComponent: string;
  importedShellOrNav: string[];
  currentPrimaryVisibleComponent: string;
  expectedCanonicalShell: string;
  expectedCanonicalWordmark: string;
  compliance: RouteCompliance;
  requiredRemediation: string;
  ownerSurface: 'admin' | 'source' | 'programs';
  primaryAgent: 'Steward' | 'Nexus';
  riskLevel: RouteRisk;
  missingReason?: string;
}

export const TARGET_ROUTE_PATTERNS = [
  '/platform/admin',
  '/platform/admin/production-readiness',
  '/platform/admin/build-progress',
  '/source',
  '/source/events',
  '/source/events/[eventId]',
  '/tenant/[tenantSlug]/programs',
  '/tenant/[tenantSlug]/programs/[programSlug]',
] as const;

export const ACTIVE_ROUTE_OWNERSHIP_MAP: ActiveRouteOwnershipEntry[] = [
  {
    routePattern: '/platform/admin',
    activeRouteFile: 'src/app/(maestro)/platform/admin/page.tsx',
    activePageComponent: 'PlatformAdminRedirect',
    importedShellOrNav: [],
    currentPrimaryVisibleComponent: '(redirect to /admin)',
    expectedCanonicalShell: 'AdminCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'legacy',
    requiredRemediation: 'None here. ADMIN8 retired this route to a redirect; the canonical surface is /admin, which carries the shell obligation.',
    ownerSurface: 'admin',
    primaryAgent: 'Steward',
    riskLevel: 'high',
  },
  {
    routePattern: '/platform/admin/production-readiness',
    activeRouteFile: 'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
    activePageComponent: 'PlatformAdminProductionReadinessRedirect',
    importedShellOrNav: [],
    currentPrimaryVisibleComponent: '(redirect to /admin/production-readiness)',
    expectedCanonicalShell: 'AdminCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'None here. Retired to a redirect; /admin/production-readiness is canonical and carries the shell and live-refresh obligations.',
    ownerSurface: 'admin',
    primaryAgent: 'Steward',
    riskLevel: 'medium',
  },
  {
    routePattern: '/platform/admin/build-progress',
    activeRouteFile: 'src/app/(maestro)/platform/admin/build-progress/page.tsx',
    activePageComponent: 'FounderBuildProgressPage',
    importedShellOrNav: ['BuildProgressDashboard'],
    currentPrimaryVisibleComponent: 'BuildProgressDashboard under admin guard',
    expectedCanonicalShell: 'AdminCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Wrap route in AdminCanonShell while preserving steward/build metrics and admin guard.',
    ownerSurface: 'admin',
    primaryAgent: 'Steward',
    riskLevel: 'medium',
  },
  {
    routePattern: '/source',
    activeRouteFile: 'src/app/(maestro)/source/page.tsx',
    activePageComponent: 'SourceWorkspacePage',
    importedShellOrNav: ['SourceWorkspacePage'],
    currentPrimaryVisibleComponent: 'SourceWorkspacePage',
    expectedCanonicalShell: 'SourceCanonShell or SourceFoundationShell (canon-compliant)',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'This route re-exports ./workspace/page; the shell obligation belongs to that page, so check canon markers there rather than here.',
    ownerSurface: 'source',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/source/events',
    activeRouteFile: 'src/app/(maestro)/source/events/page.tsx',
    activePageComponent: 'SourceEventsPage',
    importedShellOrNav: [],
    currentPrimaryVisibleComponent: '(redirect to /source)',
    expectedCanonicalShell: 'SourceCanonShell or SourceFoundationShell (canon-compliant)',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'None here. Retired to a redirect into /source, which owns the portfolio view.',
    ownerSurface: 'source',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/source/events/[eventId]',
    activeRouteFile: 'src/app/(maestro)/source/events/[eventId]/page.tsx',
    activePageComponent: 'SourceEventDetailPage',
    importedShellOrNav: ['SourceShellWorkspace', 'SourceAnalyticsCanvas'],
    currentPrimaryVisibleComponent: 'SourceAnalyticsCanvas',
    expectedCanonicalShell: 'SourceCanonShell or SourceFoundationShell (canon-compliant)',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Enforce canon shell on SourceShellWorkspace. Note that SentinelEngagementCanvas, which this entry named until 2026-09-19, is imported by no route; the components reached only from it are unmounted, and suites written against them prove nothing about this route.',
    ownerSurface: 'source',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs',
    activeRouteFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
    activePageComponent: 'TenantProgramsCanonicalPage',
    importedShellOrNav: [],
    currentPrimaryVisibleComponent: '(redirect to /programs)',
    expectedCanonicalShell: 'ProgramCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'None here. The route asserts tenant access and redirects to /programs, which owns the index and the shell obligation.',
    ownerSurface: 'programs',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs/[programSlug]',
    activeRouteFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx',
    activePageComponent: 'TenantProgramCanonicalPage',
    importedShellOrNav: [],
    currentPrimaryVisibleComponent: '(redirect to the canonical program route, or notFound)',
    expectedCanonicalShell: 'ProgramCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'None here. The route asserts tenant access, resolves the program and redirects, or 404s when it does not resolve; the canonical detail surface carries the shell obligation.',
    ownerSurface: 'programs',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
];

export function buildActiveRouteOwnershipMap(): ActiveRouteOwnershipEntry[] {
  return ACTIVE_ROUTE_OWNERSHIP_MAP.map((entry) => ({ ...entry, importedShellOrNav: [...entry.importedShellOrNav] }));
}

