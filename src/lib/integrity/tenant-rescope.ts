import { getSeedPlan } from '@/lib/deliverables/seed-route-resolver';
import { getPatternApplicableProgramsForTenant } from '@/lib/intelligence/pattern-manifest';

export interface TenantRescopeSnapshot {
  tenantSlug: string;
  tenantName: string;
  programNames: string[];
  patternSlugs: string[];
  programCount: number;
  deliverableCount: number;
  adminDataSignature: string;
  towerDataSignature: string;
  patternIntegrationSignature: string;
}

export interface TenantRescopeValidation {
  from: TenantRescopeSnapshot;
  to: TenantRescopeSnapshot;
  leakedTerms: string[];
}

export function buildTenantRescopeSnapshot(tenantSlug: string): TenantRescopeSnapshot {
  const plan = getSeedPlan();
  const tenant = plan.tenants.find((entry) => entry.routeSlug === tenantSlug);
  if (!tenant) throw new Error(`Unknown tenant slug: ${tenantSlug}`);

  const programNames = tenant.programs.map((program) => program.name);
  const patternSlugs = Array.from(new Set(tenant.programs.map((program) => program.patternSlug).filter((slug): slug is string => Boolean(slug))));
  const deliverableCount = tenant.programs.reduce((total, program) => total + program.deliverables.length, 0);
  const patternIntegrationSignature = patternSlugs
    .map((patternSlug) => {
      const programs = getPatternApplicableProgramsForTenant(patternSlug, tenant.routeSlug);
      return `${patternSlug}:${programs.map((program) => program.programSlug).join(',') || 'none'}`;
    })
    .join('|');

  return {
    tenantSlug: tenant.routeSlug,
    tenantName: tenant.displayName,
    programNames,
    patternSlugs,
    programCount: tenant.programs.length,
    deliverableCount,
    adminDataSignature: `${tenant.displayName} admin data · ${tenant.programs.length} programs · ${deliverableCount} deliverables`,
    towerDataSignature: `${tenant.displayName} Tower · ${tenant.programs.length} programs · ${deliverableCount} deliverables`,
    patternIntegrationSignature,
  };
}

export function validateTenantRescope(fromTenantSlug: string, toTenantSlug: string): TenantRescopeValidation {
  const from = buildTenantRescopeSnapshot(fromTenantSlug);
  const to = buildTenantRescopeSnapshot(toTenantSlug);
  const targetSurface = [
    to.tenantName,
    ...to.programNames,
    ...to.patternSlugs,
    to.adminDataSignature,
    to.towerDataSignature,
    to.patternIntegrationSignature,
  ].join('\n');
  const fromTerms = [
    from.tenantName,
    ...from.programNames,
    ...from.patternSlugs,
  ].filter(Boolean);
  const leakedTerms = fromTerms.filter((term) => targetSurface.includes(term));

  return { from, to, leakedTerms };
}
