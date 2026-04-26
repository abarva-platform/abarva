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
  '/platform/admin/architecture',
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
    activePageComponent: 'AdminPortal',
    importedShellOrNav: ['StewardAdminRail'],
    currentPrimaryVisibleComponent: 'Legacy Admin portal with dark sidebar + in-route sections',
    expectedCanonicalShell: 'AdminCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'legacy',
    requiredRemediation: 'Route must mount AdminCanonShell and de-emphasize/remove legacy dark sidebar shell.',
    ownerSurface: 'admin',
    primaryAgent: 'Steward',
    riskLevel: 'high',
  },
  {
    routePattern: '/platform/admin/architecture',
    activeRouteFile: 'src/app/(maestro)/platform/admin/architecture/page.tsx',
    activePageComponent: 'ArchitecturePage',
    importedShellOrNav: ['ArchitectureCanvas', 'ArchitectureOverviewPage'],
    currentPrimaryVisibleComponent: 'ArchitectureCanvas + ArchitectureOverviewPage',
    expectedCanonicalShell: 'AdminCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Wrap route in AdminCanonShell and add workflow orientation without changing architecture content.',
    ownerSurface: 'admin',
    primaryAgent: 'Steward',
    riskLevel: 'medium',
  },
  {
    routePattern: '/platform/admin/production-readiness',
    activeRouteFile: 'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
    activePageComponent: 'ProductionReadinessPage',
    importedShellOrNav: ['ProductionReadinessDecisionFlow', 'ProductionReadinessLivePanel'],
    currentPrimaryVisibleComponent: 'Decision flow + live panel under admin guard',
    expectedCanonicalShell: 'AdminCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Wrap route in AdminCanonShell and keep no-store/live-refresh behavior unchanged.',
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
    activePageComponent: 'SourceDashboardPage',
    importedShellOrNav: ['SourceFoundationShell', 'PageShell'],
    currentPrimaryVisibleComponent: 'AbarVaSourceDashboard inside SourceFoundationShell',
    expectedCanonicalShell: 'SourceCanonShell or SourceFoundationShell (canon-compliant)',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Verify shell canon markers and ensure Source commercial workflow is discoverable from event routes.',
    ownerSurface: 'source',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/source/events',
    activeRouteFile: 'src/app/(maestro)/source/events/page.tsx',
    activePageComponent: 'SourceEventsPage',
    importedShellOrNav: ['SourceFoundationShell'],
    currentPrimaryVisibleComponent: 'SourcingEventTable inside SourceFoundationShell',
    expectedCanonicalShell: 'SourceCanonShell or SourceFoundationShell (canon-compliant)',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Ensure route shell carries canon markers and event index points clearly to commercial workflow.',
    ownerSurface: 'source',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/source/events/[eventId]',
    activeRouteFile: 'src/app/(maestro)/source/events/[eventId]/page.tsx',
    activePageComponent: 'SourceEventDetailPage',
    importedShellOrNav: ['SourceFoundationShell', 'NexusEngagementCanvas', 'SourceCommercialEventSection'],
    currentPrimaryVisibleComponent: 'NexusEngagementCanvas + SourceCommercialEventSection',
    expectedCanonicalShell: 'SourceCanonShell or SourceFoundationShell (canon-compliant)',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Enforce canon shell and keep Event > Pricing > Risk > BAFO > Readiness > Missions > Signals visible.',
    ownerSurface: 'source',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs',
    activeRouteFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
    activePageComponent: 'TenantProgramsCanonicalPage',
    importedShellOrNav: ['ProgramsCanonicalIndex'],
    currentPrimaryVisibleComponent: 'ProgramsCanonicalIndex',
    expectedCanonicalShell: 'ProgramCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Wrap route with program canon shell while preserving canonical index behavior.',
    ownerSurface: 'programs',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs/[programSlug]',
    activeRouteFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx',
    activePageComponent: 'TenantProgramCanonicalPage',
    importedShellOrNav: ['ProgramCanonicalDetail'],
    currentPrimaryVisibleComponent: 'ProgramCanonicalDetail',
    expectedCanonicalShell: 'ProgramCanonShell',
    expectedCanonicalWordmark: 'AbarvaWordmark',
    compliance: 'partial',
    requiredRemediation: 'Wrap route with program canon shell while preserving canonical detail + workshop/artifact/missions.',
    ownerSurface: 'programs',
    primaryAgent: 'Nexus',
    riskLevel: 'medium',
  },
];

export function buildActiveRouteOwnershipMap(): ActiveRouteOwnershipEntry[] {
  return ACTIVE_ROUTE_OWNERSHIP_MAP.map((entry) => ({ ...entry, importedShellOrNav: [...entry.importedShellOrNav] }));
}

