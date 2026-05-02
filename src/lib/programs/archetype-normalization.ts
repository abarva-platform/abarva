import type { ArchetypeKey } from '@/lib/programs/types.ui';

const CANONICAL_ARCHETYPES = new Set<ArchetypeKey>([
  'strategic_transformation',
  'workflow_automation',
  'platform_modernization',
  'ai_product_enablement',
  'operational_optimization',
]);

/**
 * Program origination agents often use business-friendly labels such as
 * "AMS Consolidation" or function codes such as "FRONT_OFFICE". The
 * engagements.program_archetype column only accepts the canonical
 * ArchetypeKey enum, so normalize before every write.
 */
export function normalizeProgramArchetype(value?: string | null): ArchetypeKey | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (CANONICAL_ARCHETYPES.has(normalized as ArchetypeKey)) {
    return normalized as ArchetypeKey;
  }

  if (/(^|_)(ai|agent|copilot|genai|agentic)($|_)/.test(normalized)) {
    return 'ai_product_enablement';
  }
  if (/(^|_)(platform|erp|cloud|data|analytics|integration|modernization|modernisation)($|_)/.test(normalized)) {
    return 'platform_modernization';
  }
  if (/(^|_)(workflow|automation|prior_auth|claims|coding|service_now)($|_)/.test(normalized)) {
    return 'workflow_automation';
  }
  if (/(^|_)(ams|consolidation|sourcing|vendor|sla|run_cost|operating_model|bafo|optimization|optimisation)($|_)/.test(normalized)) {
    return 'operational_optimization';
  }
  if (/(^|_)(strategy|transformation|roadmap|mobilization|mobilisation)($|_)/.test(normalized)) {
    return 'strategic_transformation';
  }

  return null;
}
