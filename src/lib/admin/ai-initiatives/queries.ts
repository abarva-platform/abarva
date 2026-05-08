import 'server-only';

// AIR-3 · Server-side queries for the AI Initiatives Registry.
//
// Reads from the ai_* tables created by AIR-1. All queries are
// tenant-scoped via client_id. Used by the /admin/ai-initiatives
// page and (in AIR-4) the per-initiative detail page.

import { getServerSupabase } from '@/lib/supabase-server';
import {
  STAGE_LABELS as _STAGE_LABELS,
  STATUS_LABELS as _STATUS_LABELS,
  formatUsd as _formatUsd,
  type Stage,
  type StatusFlag,
  type ConfidenceLevel,
} from './labels';

export type { Stage, StatusFlag, ConfidenceLevel };

// Re-export so existing server-side callers keep working unchanged.
export const STAGE_LABELS = _STAGE_LABELS;
export const STATUS_LABELS = _STATUS_LABELS;
export const formatUsd = _formatUsd;

export interface AICategory {
  categoryId: string;
  name: string;
  definition: string;
  displayOrder: number;
}

export interface AIBusinessGoal {
  goalId: string;
  name: string;
  strategicContext: string;
  displayOrder: number;
}

export interface AIInitiative {
  initiativeId: string;
  displayId: string;
  name: string;
  description: string;
  primaryCategoryId: string;
  primaryCategoryName: string;
  secondaryCategoryId: string | null;
  secondaryCategoryName: string | null;
  primaryGoalId: string;
  primaryGoalName: string;
  stage: Stage;
  stageDetail: string | null;
  ownerName: string;
  ownerTitle: string;
  ownerFunction: string | null;
  committedAnnualUsd: number | null;
  committedTotalUsd: number | null;
  measuredValueUsd: number | null;
  statusFlag: StatusFlag;
  statusSummary: string;
  confidenceLevel: ConfidenceLevel;
  alignedCallout: boolean;
  alignedRationale: string | null;
  loadedViaTemplate: string;
}

interface InitiativeRow {
  initiative_id: string;
  display_id: string;
  name: string;
  description: string;
  primary_category_id: string;
  secondary_category_id: string | null;
  primary_goal_id: string;
  stage: Stage;
  stage_detail: string | null;
  owner_name: string;
  owner_title: string;
  owner_function: string | null;
  committed_annual_usd: number | string | null;
  committed_total_usd: number | string | null;
  measured_value_usd: number | string | null;
  status_flag: StatusFlag;
  status_summary: string;
  confidence_level: ConfidenceLevel;
  aligned_callout: boolean;
  aligned_rationale: string | null;
  loaded_via_template: string;
}

interface CategoryRow {
  category_id: string;
  name: string;
  definition: string;
  display_order: number;
}

interface GoalRow {
  goal_id: string;
  name: string;
  strategic_context: string;
  display_order: number;
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

export async function listCategories(): Promise<ReadonlyArray<AICategory>> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('ai_categories')
    .select('category_id, name, definition, display_order')
    .order('display_order', { ascending: true });
  if (error) throw new Error(`listCategories: ${error.message}`);
  const rows = (data ?? []) as ReadonlyArray<CategoryRow>;
  return rows.map((r) => ({
    categoryId: r.category_id,
    name: r.name,
    definition: r.definition,
    displayOrder: r.display_order,
  }));
}

export async function listBusinessGoalsForClient(clientId: string): Promise<ReadonlyArray<AIBusinessGoal>> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('ai_business_goals')
    .select('goal_id, name, strategic_context, display_order')
    .eq('client_id', clientId)
    .order('display_order', { ascending: true });
  if (error) throw new Error(`listBusinessGoalsForClient: ${error.message}`);
  const rows = (data ?? []) as ReadonlyArray<GoalRow>;
  return rows.map((r) => ({
    goalId: r.goal_id,
    name: r.name,
    strategicContext: r.strategic_context,
    displayOrder: r.display_order,
  }));
}

export async function listInitiativesForClient(clientId: string): Promise<ReadonlyArray<AIInitiative>> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('ai_initiatives')
    .select(
      'initiative_id, display_id, name, description, primary_category_id, secondary_category_id, primary_goal_id, stage, stage_detail, owner_name, owner_title, owner_function, committed_annual_usd, committed_total_usd, measured_value_usd, status_flag, status_summary, confidence_level, aligned_callout, aligned_rationale, loaded_via_template',
    )
    .eq('client_id', clientId)
    .order('display_id', { ascending: true });
  if (error) throw new Error(`listInitiativesForClient: ${error.message}`);
  const rows = (data ?? []) as ReadonlyArray<InitiativeRow>;

  // Resolve category + goal names with two cheap parallel queries (small fixed sets).
  const [categories, goals] = await Promise.all([
    listCategories(),
    listBusinessGoalsForClient(clientId),
  ]);
  const categoryById = new Map(categories.map((c) => [c.categoryId, c]));
  const goalById = new Map(goals.map((g) => [g.goalId, g]));

  return rows.map((r) => ({
    initiativeId: r.initiative_id,
    displayId: r.display_id,
    name: r.name,
    description: r.description,
    primaryCategoryId: r.primary_category_id,
    primaryCategoryName: categoryById.get(r.primary_category_id)?.name ?? r.primary_category_id,
    secondaryCategoryId: r.secondary_category_id,
    secondaryCategoryName: r.secondary_category_id
      ? (categoryById.get(r.secondary_category_id)?.name ?? r.secondary_category_id)
      : null,
    primaryGoalId: r.primary_goal_id,
    primaryGoalName: goalById.get(r.primary_goal_id)?.name ?? r.primary_goal_id,
    stage: r.stage,
    stageDetail: r.stage_detail,
    ownerName: r.owner_name,
    ownerTitle: r.owner_title,
    ownerFunction: r.owner_function,
    committedAnnualUsd: toNumber(r.committed_annual_usd),
    committedTotalUsd: toNumber(r.committed_total_usd),
    measuredValueUsd: toNumber(r.measured_value_usd),
    statusFlag: r.status_flag,
    statusSummary: r.status_summary,
    confidenceLevel: r.confidence_level,
    alignedCallout: r.aligned_callout,
    alignedRationale: r.aligned_rationale,
    loadedViaTemplate: r.loaded_via_template,
  }));
}

export interface AIInitiativesPageData {
  categories: ReadonlyArray<AICategory>;
  goals: ReadonlyArray<AIBusinessGoal>;
  initiatives: ReadonlyArray<AIInitiative>;
}

export async function getAIInitiativesPageData(clientId: string): Promise<AIInitiativesPageData> {
  const [categories, goals, initiatives] = await Promise.all([
    listCategories(),
    listBusinessGoalsForClient(clientId),
    listInitiativesForClient(clientId),
  ]);
  return { categories, goals, initiatives };
}

// View-model helpers (STAGE_LABELS / STATUS_LABELS / formatUsd) live
// in ./labels.ts and are re-exported at the top of this file so the
// public surface of queries.ts is unchanged for server-side callers.

/** Group initiatives by primary business goal. Goals with no initiatives are omitted. */
export function groupInitiativesByGoal(
  initiatives: ReadonlyArray<AIInitiative>,
  goals: ReadonlyArray<AIBusinessGoal>,
): Array<{ goal: AIBusinessGoal; initiatives: ReadonlyArray<AIInitiative> }> {
  const byGoal = new Map<string, AIInitiative[]>();
  for (const initiative of initiatives) {
    const list = byGoal.get(initiative.primaryGoalId) ?? [];
    list.push(initiative);
    byGoal.set(initiative.primaryGoalId, list);
  }
  return goals
    .map((goal) => ({ goal, initiatives: byGoal.get(goal.goalId) ?? [] }))
    .filter((group) => group.initiatives.length > 0);
}

/** Group initiatives by primary category. Categories with no initiatives are omitted. */
export function groupInitiativesByCategory(
  initiatives: ReadonlyArray<AIInitiative>,
  categories: ReadonlyArray<AICategory>,
): Array<{ category: AICategory; initiatives: ReadonlyArray<AIInitiative> }> {
  const byCategory = new Map<string, AIInitiative[]>();
  for (const initiative of initiatives) {
    const list = byCategory.get(initiative.primaryCategoryId) ?? [];
    list.push(initiative);
    byCategory.set(initiative.primaryCategoryId, list);
  }
  return categories
    .map((category) => ({ category, initiatives: byCategory.get(category.categoryId) ?? [] }))
    .filter((group) => group.initiatives.length > 0);
}

// ---------------------------------------------------------------------
// T-5: tenant-level vendor list (all vendors across all initiatives).
// Used by Tower CFO View band tile aggregations (e.g., Renewals · 90d).
// ---------------------------------------------------------------------

export interface AIInitiativeVendorRow {
  vendorId: string;
  initiativeId: string;
  initiativeDisplayId: string;
  initiativeName: string;
  vendorName: string;
  contractValueUsd: number | null;
  renewalDate: string | null;
  financialHealth: 'strong' | 'moderate' | 'watch' | 'at_risk' | null;
}

interface VendorRow {
  vendor_id: string;
  initiative_id: string;
  vendor_name: string;
  contract_value_usd: number | string | null;
  renewal_date: string | null;
  financial_health: 'strong' | 'moderate' | 'watch' | 'at_risk' | null;
}

export async function listVendorsForClient(
  clientId: string,
): Promise<ReadonlyArray<AIInitiativeVendorRow>> {
  const sb = getServerSupabase();
  const initiatives = await listInitiativesForClient(clientId);
  if (initiatives.length === 0) return [];
  const initiativeIds = initiatives.map((i) => i.initiativeId);
  const initiativeById = new Map(initiatives.map((i) => [i.initiativeId, i] as const));

  const { data, error } = await sb
    .from('ai_initiative_vendors')
    .select(
      'vendor_id, initiative_id, vendor_name, contract_value_usd, renewal_date, financial_health',
    )
    .in('initiative_id', initiativeIds)
    .order('renewal_date', { ascending: true, nullsFirst: false });
  if (error) throw new Error(`listVendorsForClient: ${error.message}`);
  const rows = (data ?? []) as ReadonlyArray<VendorRow>;

  return rows.map((r) => {
    const initiative = initiativeById.get(r.initiative_id);
    return {
      vendorId: r.vendor_id,
      initiativeId: r.initiative_id,
      initiativeDisplayId: initiative?.displayId ?? r.initiative_id,
      initiativeName: initiative?.name ?? r.initiative_id,
      vendorName: r.vendor_name,
      contractValueUsd: toNumber(r.contract_value_usd),
      renewalDate: r.renewal_date,
      financialHealth: r.financial_health,
    };
  });
}
