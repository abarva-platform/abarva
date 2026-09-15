import { industryIntelligenceForArchetype } from '../industry-intelligence/archetype-registry';
import { evaluatorFor } from '../facts/evaluators/formulas';
import { listSourceArchetypes } from './registry';

export type ArchetypeReadinessState =
  | 'workflow_only'
  | 'analytics_ready';

export interface SourceArchetypeReadiness {
  archetypeId: string;
  name: string;
  workflowDefined: boolean;
  industryMetricCount: number;
  deterministicLeverCount: number;
  registeredFormulaCount: number;
  state: ArchetypeReadinessState;
  blockers: string[];
}

export interface SourceArchetypeProgramSummary {
  totalArchetypes: number;
  workflowDefined: number;
  industryRequirementsDefined: number;
  deterministicAnalyticsReady: number;
  workflowOnly: number;
}

export function sourceArchetypeReadiness(): SourceArchetypeReadiness[] {
  return listSourceArchetypes().map((archetype) => {
    const industry = industryIntelligenceForArchetype(archetype.id);
    const rules = archetype.valueLeverRules ?? [];
    const registeredFormulaCount = rules.filter((rule) =>
      Boolean(evaluatorFor(rule.computation.formulaId)),
    ).length;
    const blockers: string[] = [];

    if (!industry || industry.benchmarkMetrics.length === 0) {
      blockers.push('industry_metric_requirements_missing');
    }
    if (rules.length === 0) {
      blockers.push('deterministic_value_rules_missing');
    } else if (registeredFormulaCount !== rules.length) {
      blockers.push('deterministic_formula_implementation_incomplete');
    }

    return {
      archetypeId: archetype.id,
      name: archetype.name,
      workflowDefined: true,
      industryMetricCount: industry?.benchmarkMetrics.length ?? 0,
      deterministicLeverCount: rules.length,
      registeredFormulaCount,
      state: blockers.length === 0 ? 'analytics_ready' : 'workflow_only',
      blockers,
    };
  });
}

export function sourceArchetypeProgramSummary(): SourceArchetypeProgramSummary {
  const readiness = sourceArchetypeReadiness();
  const deterministicAnalyticsReady = readiness.filter(
    (entry) => entry.state === 'analytics_ready',
  ).length;

  return {
    totalArchetypes: readiness.length,
    workflowDefined: readiness.filter((entry) => entry.workflowDefined).length,
    industryRequirementsDefined: readiness.filter(
      (entry) => entry.industryMetricCount > 0,
    ).length,
    deterministicAnalyticsReady,
    workflowOnly: readiness.length - deterministicAnalyticsReady,
  };
}
