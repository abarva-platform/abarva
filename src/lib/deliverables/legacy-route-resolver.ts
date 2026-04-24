import type { ClientKey } from '@/lib/client-config';
import type { DeliverableSeedPlan, ProgramSeedPlan, TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import {
  findDeliverableByRoute,
  findProgramByRoute,
  getSeedPlan,
  tenantDeliverablePath,
  tenantProgramPath,
  tenantProgramsPath,
} from '@/lib/deliverables/seed-route-resolver';

const LEGACY_PROGRAM_ALIASES: Record<string, { tenantKey: ClientKey; programSlug: string }> = {
  morrison: { tenantKey: 'apexretail', programSlug: 'morrison-owned-brand-margin-recovery' },
  'owned-brand-margin-acceleration': { tenantKey: 'apexretail', programSlug: 'morrison-owned-brand-margin-recovery' },
  'ambient-documentation-vendor-strategy': { tenantKey: 'meridian', programSlug: 'ambient-clinical-value-chain-activation' },
  'meridian-ai-readiness': { tenantKey: 'meridian', programSlug: 'clinical-documentation-ai-governance' },
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function tokens(value: string | null | undefined): string[] {
  return normalize(value).split('-').filter(Boolean);
}

function scoreProgramMatch(program: ProgramSeedPlan, candidate: string): number {
  const normalized = normalize(candidate);
  if (!normalized) return 0;

  const programSlug = normalize(program.programSlug);
  const graphNodeId = normalize(program.graphNodeId);
  const code = normalize(program.code);
  const name = normalize(program.name);

  if (normalized === programSlug || normalized === graphNodeId || normalized === code || normalized === name) {
    return 100;
  }

  if (programSlug.includes(normalized) || name.includes(normalized)) {
    return 88;
  }

  const candidateTokens = tokens(candidate);
  if (candidateTokens.length === 0) return 0;
  const haystack = `${programSlug} ${graphNodeId} ${code} ${name}`;
  const matched = candidateTokens.filter((token) => haystack.includes(token)).length;
  if (matched === candidateTokens.length) {
    return 60 + matched;
  }

  return 0;
}

export function getSeedTenantForClientKey(clientKey: ClientKey): TenantSeedPlan | null {
  return getSeedPlan().tenants.find((tenant) => tenant.tenantKey === clientKey) ?? null;
}

export function getSeedProgramsIndexPath(clientKey: ClientKey): string {
  const tenant = getSeedTenantForClientKey(clientKey);
  return tenant ? tenantProgramsPath(tenant) : '/home';
}

export function resolveSeedProgramContext(
  legacyProgramId: string,
  activeClientKey?: ClientKey | null,
): { tenant: TenantSeedPlan; program: ProgramSeedPlan } | null {
  const normalized = normalize(legacyProgramId);
  if (!normalized) return null;

  const alias = LEGACY_PROGRAM_ALIASES[normalized];
  if (alias && (!activeClientKey || alias.tenantKey === activeClientKey)) {
    const aliased = findProgramByRoute(alias.tenantKey, alias.programSlug)
      ?? getSeedPlan().tenants
        .find((tenant) => tenant.tenantKey === alias.tenantKey)
        ?.programs.find((program) => program.programSlug === alias.programSlug);
    if (aliased && 'tenant' in aliased) return aliased;
    const tenant = getSeedTenantForClientKey(alias.tenantKey);
    const program = tenant?.programs.find((entry) => entry.programSlug === alias.programSlug);
    if (tenant && program) return { tenant, program };
  }

  const prioritizedTenants = getSeedPlan().tenants.slice().sort((a, b) => {
    if (!activeClientKey) return 0;
    if (a.tenantKey === activeClientKey) return -1;
    if (b.tenantKey === activeClientKey) return 1;
    return 0;
  });

  let best: { tenant: TenantSeedPlan; program: ProgramSeedPlan; score: number } | null = null;
  for (const tenant of prioritizedTenants) {
    for (const program of tenant.programs) {
      const score = scoreProgramMatch(program, legacyProgramId);
      if (!best || score > best.score) {
        best = { tenant, program, score };
      }
    }
  }

  return best && best.score >= 70 ? { tenant: best.tenant, program: best.program } : null;
}

export function resolveSeedProgramPath(
  legacyProgramId: string,
  activeClientKey?: ClientKey | null,
): string | null {
  const context = resolveSeedProgramContext(legacyProgramId, activeClientKey);
  return context ? tenantProgramPath(context.tenant, context.program) : null;
}

export function resolveSeedDeliverablePath(
  deliverableCodeOrSegment: string,
  activeClientKey: ClientKey,
  legacyProgramId?: string | null,
): string | null {
  const normalized = normalize(deliverableCodeOrSegment).toUpperCase();
  if (!normalized) return null;

  const pinnedProgram = legacyProgramId ? resolveSeedProgramContext(legacyProgramId, activeClientKey) : null;
  const programs = pinnedProgram
    ? [pinnedProgram]
    : (getSeedTenantForClientKey(activeClientKey)?.programs ?? [])
        .map((program) => ({ tenant: getSeedTenantForClientKey(activeClientKey)!, program }))
        .sort((a, b) => {
          const aHero = Number(a.program.roleInDemo.toLowerCase().includes('hero'));
          const bHero = Number(b.program.roleInDemo.toLowerCase().includes('hero'));
          return bHero - aHero || b.program.currentPhaseSpec - a.program.currentPhaseSpec;
        });

  for (const context of programs) {
    const direct = findDeliverableByRoute(context.tenant.routeSlug, context.program.programSlug, deliverableCodeOrSegment);
    if (direct?.deliverable) {
      return tenantDeliverablePath(direct.tenant, direct.program, direct.deliverable);
    }

    const deliverable = context.program.deliverables.find((entry) => normalize(entry.deliverableCode).toUpperCase() === normalized);
    if (deliverable) {
      return tenantDeliverablePath(context.tenant, context.program, deliverable);
    }
  }

  return null;
}

export function resolvePreferredProgramDestination(
  legacyProgramId: string,
  activeClientKey: ClientKey,
): string {
  return resolveSeedProgramPath(legacyProgramId, activeClientKey) ?? getSeedProgramsIndexPath(activeClientKey);
}

export function isSeedProgramKnown(legacyProgramId: string, activeClientKey?: ClientKey | null): boolean {
  return resolveSeedProgramContext(legacyProgramId, activeClientKey) !== null;
}

export function firstDeliverableForProgram(program: ProgramSeedPlan): DeliverableSeedPlan | null {
  return program.deliverables.find((deliverable) => deliverable.renderTier !== 'stub') ?? program.deliverables[0] ?? null;
}
