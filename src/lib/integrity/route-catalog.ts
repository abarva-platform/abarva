import {
  buildSeedDeliverableRenderModel,
  getSeedPlan,
  tenantDashboardPath,
  tenantDeliverablePath,
  tenantPatternPath,
  tenantProgramPath,
  tenantProgramPhasePath,
  tenantProgramsPath,
} from '@/lib/deliverables/seed-route-resolver';
import { getAllProgramEvidenceRegistries } from '@/lib/deliverables/evidence-registry';
import { getPatternManifestEntries, patternRouteFor } from '@/lib/intelligence/pattern-manifest';
import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';
import type { ProgramSeedPlan, TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

export const TOWER_SUBSURFACE_DEFINITIONS = [
  {
    slug: 'shadow-ai',
    label: 'Shadow AI',
    description: 'Unsanctioned tools, unmanaged spend, and PHI or customer-data exposure signals.',
  },
  {
    slug: 'vendors',
    label: 'Vendors',
    description: 'Vendor concentration, overlap, renewal clocks, and rationalization candidates.',
  },
  {
    slug: 'regulatory',
    label: 'Regulatory',
    description: 'Policy obligations, audit posture, and governance controls that shape execution risk.',
  },
  {
    slug: 'council',
    label: 'Council',
    description: 'Decision bodies, sponsor ownership, escalation rights, and phase-gate operating cadence.',
  },
  {
    slug: 'models',
    label: 'Models',
    description: 'Model inventory, deployment posture, evaluation state, and guardrail coverage.',
  },
] as const;

export type TowerSubsurfaceSlug = (typeof TOWER_SUBSURFACE_DEFINITIONS)[number]['slug'];

export type CanonicalRouteSurface =
  | 'operations_portfolio'
  | 'tenant_dashboard'
  | 'tenant_programs'
  | 'tenant_program'
  | 'tenant_program_phase'
  | 'tenant_deliverable'
  | 'tenant_evidence'
  | 'tenant_tower'
  | 'tenant_tower_subsurface'
  | 'global_pattern'
  | 'tenant_pattern'
  | 'global_tower_surface';

export interface CanonicalRouteRecord {
  path: string;
  label: string;
  surface: CanonicalRouteSurface;
  tenantSlug?: string;
  programSlug?: string;
  deliverableCode?: string;
  patternSlug?: string;
  towerSurface?: TowerSubsurfaceSlug;
}

export interface RouteLinkRecord {
  sourcePath: string;
  targetPath: string;
  className: string;
  label: string;
}

const SPEC_PHASES = [1, 2, 3, 4, 5] as SpecPhaseNumber[];
const GLOBAL_TOWER_SURFACES = [
  '/tower',
  '/tower/tech-stack',
  '/tower/projects',
  '/tower/staff-aug',
  '/tower/volumetrics',
  '/tower/preview',
  '/tower/onboard',
];

export function isTowerSubsurfaceSlug(value: string): value is TowerSubsurfaceSlug {
  return TOWER_SUBSURFACE_DEFINITIONS.some((surface) => surface.slug === value);
}

export function tenantTowerPath(tenant: Pick<TenantSeedPlan, 'routeSlug'>): string {
  return `/tenant/${tenant.routeSlug}/tower`;
}

export function tenantTowerSubsurfacePath(tenant: Pick<TenantSeedPlan, 'routeSlug'>, surface: TowerSubsurfaceSlug): string {
  return `${tenantTowerPath(tenant)}/${surface}`;
}

export function buildCanonicalRouteRecords(): CanonicalRouteRecord[] {
  const plan = getSeedPlan();
  const patterns = getPatternManifestEntries();
  const records: CanonicalRouteRecord[] = [
    {
      path: '/operations/portfolio',
      label: 'Operations portfolio',
      surface: 'operations_portfolio',
    },
  ];

  for (const path of GLOBAL_TOWER_SURFACES) {
    records.push({
      path,
      label: `Global Tower surface · ${path.split('/').pop() ?? 'landing'}`,
      surface: 'global_tower_surface',
    });
  }

  for (const pattern of patterns) {
    records.push({
      path: patternRouteFor(pattern.slug),
      label: `Global pattern · ${pattern.name}`,
      surface: 'global_pattern',
      patternSlug: pattern.slug,
    });
  }

  for (const tenant of plan.tenants) {
    records.push({
      path: tenantDashboardPath(tenant),
      label: `${tenant.displayName} dashboard`,
      surface: 'tenant_dashboard',
      tenantSlug: tenant.routeSlug,
    });
    records.push({
      path: tenantProgramsPath(tenant),
      label: `${tenant.displayName} programs`,
      surface: 'tenant_programs',
      tenantSlug: tenant.routeSlug,
    });
    records.push({
      path: tenantTowerPath(tenant),
      label: `${tenant.displayName} Tower`,
      surface: 'tenant_tower',
      tenantSlug: tenant.routeSlug,
    });

    for (const surface of TOWER_SUBSURFACE_DEFINITIONS) {
      records.push({
        path: tenantTowerSubsurfacePath(tenant, surface.slug),
        label: `${tenant.displayName} Tower · ${surface.label}`,
        surface: 'tenant_tower_subsurface',
        tenantSlug: tenant.routeSlug,
        towerSurface: surface.slug,
      });
    }

    for (const pattern of patterns) {
      records.push({
        path: tenantPatternPath(tenant, pattern.slug),
        label: `${tenant.displayName} pattern · ${pattern.name}`,
        surface: 'tenant_pattern',
        tenantSlug: tenant.routeSlug,
        patternSlug: pattern.slug,
      });
    }

    for (const program of tenant.programs) {
      addProgramRecords(records, tenant, program);
    }
  }

  for (const registry of getAllProgramEvidenceRegistries()) {
    for (const entry of registry.entries) {
      records.push({
        path: entry.href,
        label: `${registry.programName} · ${entry.id}`,
        surface: 'tenant_evidence',
        tenantSlug: registry.tenantSlug,
        programSlug: registry.programSlug,
      });
    }
  }

  return records.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildCanonicalRouteLinks(): RouteLinkRecord[] {
  const plan = getSeedPlan();
  const patterns = getPatternManifestEntries();
  const links: RouteLinkRecord[] = [];

  for (const tenant of plan.tenants) {
    pushLink(links, tenantDashboardPath(tenant), tenantProgramsPath(tenant), 'tenant_programs', 'Programs');
    pushLink(links, tenantDashboardPath(tenant), tenantTowerPath(tenant), 'tenant_tower', 'Tower');
    pushLink(links, tenantProgramsPath(tenant), tenantDashboardPath(tenant), 'breadcrumb', 'Tenant dashboard');
    pushLink(links, tenantTowerPath(tenant), tenantDashboardPath(tenant), 'breadcrumb', 'Tenant dashboard');

    for (const surface of TOWER_SUBSURFACE_DEFINITIONS) {
      pushLink(links, tenantTowerPath(tenant), tenantTowerSubsurfacePath(tenant, surface.slug), 'tower_subsurface', surface.label);
      pushLink(links, tenantTowerSubsurfacePath(tenant, surface.slug), tenantTowerPath(tenant), 'breadcrumb', 'Back to Control Tower');
    }

    for (const pattern of patterns) {
      pushLink(links, tenantPatternPath(tenant, pattern.slug), patternRouteFor(pattern.slug), 'global_pattern', pattern.name);
    }

    for (const program of tenant.programs) {
      pushLink(links, tenantProgramsPath(tenant), tenantProgramPath(tenant, program), 'program_index', program.name);
      pushLink(links, tenantProgramPath(tenant, program), tenantProgramsPath(tenant), 'breadcrumb', 'Programs');

      for (const phase of SPEC_PHASES) {
        pushLink(links, tenantProgramPath(tenant, program), tenantProgramPhasePath(tenant, program, phase), 'phase_summary', `Phase ${phase}`);
      }

      for (const deliverable of program.deliverables) {
        const deliverablePath = tenantDeliverablePath(tenant, program, deliverable);
        pushLink(links, tenantProgramPath(tenant, program), deliverablePath, 'program_deliverable', deliverable.deliverableCode);
        pushLink(links, tenantProgramPhasePath(tenant, program, deliverable.phaseSpec), deliverablePath, 'phase_deliverable', deliverable.deliverableCode);

        const model = buildSeedDeliverableRenderModel({ tenant, program, deliverable });
        for (const crossLink of model.crossLinks) {
          pushLink(links, deliverablePath, crossLink.href, crossLink.className, crossLink.label);
        }
      }
    }
  }

  return links;
}

export function normalizeInternalPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^[a-z]+:\/\//i.test(trimmed) || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return null;

  const withoutHash = trimmed.split('#')[0] ?? '';
  const withoutQuery = withoutHash.split('?')[0] ?? '';
  if (!withoutQuery.startsWith('/')) return null;

  return withoutQuery.length > 1 && withoutQuery.endsWith('/') ? withoutQuery.slice(0, -1) : withoutQuery;
}

function addProgramRecords(records: CanonicalRouteRecord[], tenant: TenantSeedPlan, program: ProgramSeedPlan) {
  records.push({
    path: tenantProgramPath(tenant, program),
    label: `${tenant.displayName} · ${program.name}`,
    surface: 'tenant_program',
    tenantSlug: tenant.routeSlug,
    programSlug: program.programSlug,
  });

  for (const phase of SPEC_PHASES) {
    records.push({
      path: tenantProgramPhasePath(tenant, program, phase),
      label: `${tenant.displayName} · ${program.name} · Phase ${phase}`,
      surface: 'tenant_program_phase',
      tenantSlug: tenant.routeSlug,
      programSlug: program.programSlug,
    });
  }

  for (const deliverable of program.deliverables) {
    records.push({
      path: tenantDeliverablePath(tenant, program, deliverable),
      label: `${tenant.displayName} · ${program.name} · ${deliverable.deliverableCode}`,
      surface: 'tenant_deliverable',
      tenantSlug: tenant.routeSlug,
      programSlug: program.programSlug,
      deliverableCode: deliverable.deliverableCode,
    });
  }
}

function pushLink(links: RouteLinkRecord[], sourcePath: string, targetPath: string, className: string, label: string) {
  const normalizedTarget = normalizeInternalPath(targetPath);
  if (!normalizedTarget) return;
  links.push({
    sourcePath,
    targetPath: normalizedTarget,
    className,
    label,
  });
}
