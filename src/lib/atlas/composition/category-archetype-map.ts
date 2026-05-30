import { getArchetype } from '@/lib/atlas/iac/retrieval';

export type AtlasCategoryId =
  | 'CAT-01'
  | 'CAT-02'
  | 'CAT-03'
  | 'CAT-04'
  | 'CAT-05'
  | 'CAT-06'
  | 'CAT-07'
  | 'CAT-08';

export const CATEGORY_ARCHETYPE_MAP: Readonly<Record<AtlasCategoryId, string>> = {
  'CAT-01': 'microsoft_365_copilot',
  'CAT-02': 'github_copilot',
  'CAT-03': 'servicenow_now_assist',
  'CAT-04': 'workday_ai_agents',
  'CAT-05': 'salesforce_einstein_agentforce',
  'CAT-06': 'ai_led_product_development',
  'CAT-07': 'salesforce_einstein_agentforce',
  'CAT-08': 'servicenow_now_assist',
};

export function categoryIdToArchetypeKey(categoryId: string | null | undefined): string | null {
  if (!categoryId) return null;
  return CATEGORY_ARCHETYPE_MAP[categoryId as AtlasCategoryId] ?? null;
}

export function getArchetypeForCategory(categoryId: string | null | undefined) {
  const archetypeKey = categoryIdToArchetypeKey(categoryId);
  return archetypeKey ? getArchetype(archetypeKey) : null;
}

