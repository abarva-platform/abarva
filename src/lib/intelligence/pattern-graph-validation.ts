import { getPatternManifestEntries, patternMatchesIndustry } from '@/lib/intelligence/pattern-manifest';
import { TENANT_PORTFOLIOS } from '@/lib/programs/enhancement-spec';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

export interface PatternGraphEdgeSummary {
  relatedTo: number;
  appliedIn: number;
  applicableToTenant: number;
  sourcedFrom: number;
}

export interface PatternGraphValidationResult {
  summary: {
    patternCount: number;
    tenantCount: number;
    programCount: number;
    deliverableCount: number;
    edgeCounts: PatternGraphEdgeSummary;
  };
  errors: string[];
  warnings: string[];
  orphanPatternSlugs: string[];
}

export function validatePatternGraph(): PatternGraphValidationResult {
  const patterns = getPatternManifestEntries();
  const seedPlan = buildAllProgramsSeedPlan();
  const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const patternBySlug = new Map(patterns.map((pattern) => [pattern.slug, pattern]));
  const validProgramSlugs = new Set(seedPlan.programs.map((program) => program.programSlug));
  const validTenantRouteSlugs = new Set(seedPlan.tenants.map((tenant) => tenant.routeSlug));

  const errors: string[] = [];
  const warnings: string[] = [];
  const relatedInbound = new Map(patterns.map((pattern) => [pattern.slug, 0]));

  let relatedTo = 0;
  let appliedIn = 0;
  let applicableToTenant = 0;
  let sourcedFrom = 0;

  for (const pattern of patterns) {
    const seenRelatedIds = new Set<string>();

    for (const targetId of pattern.relatedPatternIds) {
      if (seenRelatedIds.has(targetId)) {
        warnings.push(`Duplicate RELATED_TO edge from ${pattern.id} to ${targetId}.`);
        continue;
      }
      seenRelatedIds.add(targetId);

      const target = patternById.get(targetId);
      if (!target) {
        errors.push(`RELATED_TO edge from ${pattern.id} points to unknown pattern id ${targetId}.`);
        continue;
      }

      relatedTo += 1;
      relatedInbound.set(target.slug, (relatedInbound.get(target.slug) ?? 0) + 1);

      if (!target.relatedPatternIds.includes(pattern.id)) {
        errors.push(`RELATED_TO edge ${pattern.id} -> ${target.id} is not bidirectional.`);
      }
    }
  }

  for (const program of seedPlan.programs) {
    if (!program.patternSlug) continue;

    const pattern = patternBySlug.get(program.patternSlug);
    if (!pattern) {
      errors.push(`APPLIED_IN edge references unknown pattern slug ${program.patternSlug} from program ${program.programSlug}.`);
      continue;
    }

    if (!validProgramSlugs.has(program.programSlug)) {
      errors.push(`APPLIED_IN edge points to unknown program slug ${program.programSlug}.`);
      continue;
    }

    appliedIn += 1;

    for (const deliverable of program.deliverables) {
      if (!patternBySlug.has(program.patternSlug)) {
        errors.push(`SOURCED_FROM edge references unknown pattern slug ${program.patternSlug} from deliverable ${deliverable.instanceKey}.`);
        continue;
      }
      sourcedFrom += 1;
    }
  }

  for (const tenant of TENANT_PORTFOLIOS) {
    if (!validTenantRouteSlugs.has(tenant.routeSlug)) {
      errors.push(`APPLICABLE_TO_TENANT edge references unknown tenant slug ${tenant.routeSlug}.`);
      continue;
    }

    for (const pattern of patterns) {
      if (!patternMatchesIndustry(pattern, tenant.industryKey)) continue;
      applicableToTenant += 1;
    }
  }

  const orphanPatternSlugs = patterns
    .filter((pattern) => {
      const outboundRelated = pattern.relatedPatternIds.length;
      const inboundRelated = relatedInbound.get(pattern.slug) ?? 0;
      const appliedPrograms = seedPlan.programs.filter((program) => program.patternSlug === pattern.slug).length;
      const applicableTenants = TENANT_PORTFOLIOS.filter((tenant) => patternMatchesIndustry(pattern, tenant.industryKey)).length;

      return outboundRelated === 0 && inboundRelated === 0 && appliedPrograms === 0 && applicableTenants === 0;
    })
    .map((pattern) => pattern.slug);

  if (orphanPatternSlugs.length > 0) {
    errors.push(`Orphan patterns detected: ${orphanPatternSlugs.join(', ')}.`);
  }

  return {
    summary: {
      patternCount: patterns.length,
      tenantCount: seedPlan.tenants.length,
      programCount: seedPlan.programs.length,
      deliverableCount: seedPlan.deliverables.length,
      edgeCounts: {
        relatedTo,
        appliedIn,
        applicableToTenant,
        sourcedFrom,
      },
    },
    errors,
    warnings,
    orphanPatternSlugs,
  };
}
