import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from './types.db';

export type StrategicMovesListView = 'scatter' | 'cards' | 'kanban';
export type StrategicMovesSort = 'value' | 'phase' | 'status' | 'name';

export interface StrategicMovesPreferences {
  listView: StrategicMovesListView;
  sort: StrategicMovesSort;
}

export const DEFAULT_STRATEGIC_MOVES_PREFERENCES: StrategicMovesPreferences = {
  listView: 'cards',
  sort: 'value',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function getStrategicMovesPreferences(
  ctx: TenancyCtx,
): Promise<StrategicMovesPreferences> {
  if (!isUuid(ctx.userId)) return DEFAULT_STRATEGIC_MOVES_PREFERENCES;
  const sb = getServerSupabase();
  const { data } = await sb
    .from('tower_user_preferences')
    .select('default_filters')
    .eq('person_id', ctx.userId)
    .eq('client_id', ctx.clientId)
    .maybeSingle();

  const filters = (data as { default_filters?: unknown } | null)?.default_filters;
  if (!isRecord(filters)) return DEFAULT_STRATEGIC_MOVES_PREFERENCES;
  const strategicMoves = filters.strategic_moves;
  if (!isRecord(strategicMoves)) return DEFAULT_STRATEGIC_MOVES_PREFERENCES;

  const listView =
    strategicMoves.listView === 'scatter' ||
    strategicMoves.listView === 'cards' ||
    strategicMoves.listView === 'kanban'
      ? strategicMoves.listView
      : DEFAULT_STRATEGIC_MOVES_PREFERENCES.listView;
  const sort =
    strategicMoves.sort === 'value' ||
    strategicMoves.sort === 'phase' ||
    strategicMoves.sort === 'status' ||
    strategicMoves.sort === 'name'
      ? strategicMoves.sort
      : DEFAULT_STRATEGIC_MOVES_PREFERENCES.sort;

  return { listView, sort };
}

export async function setStrategicMovesPreferences(
  ctx: TenancyCtx,
  prefs: StrategicMovesPreferences,
): Promise<void> {
  if (!isUuid(ctx.userId)) return;
  const sb = getServerSupabase();
  const { data: existing } = await sb
    .from('tower_user_preferences')
    .select('id, default_filters')
    .eq('person_id', ctx.userId)
    .eq('client_id', ctx.clientId)
    .maybeSingle();

  const defaultFilters = isRecord((existing as { default_filters?: unknown } | null)?.default_filters)
    ? ((existing as { default_filters: Record<string, unknown> }).default_filters)
    : {};
  const nextDefaultFilters = {
    ...defaultFilters,
    strategic_moves: {
      listView: prefs.listView,
      sort: prefs.sort,
    },
  };

  if (existing && (existing as { id: string }).id) {
    await sb
      .from('tower_user_preferences')
      .update({ default_filters: nextDefaultFilters })
      .eq('id', (existing as { id: string }).id);
    return;
  }

  await sb.from('tower_user_preferences').insert({
    person_id: ctx.userId,
    client_id: ctx.clientId,
    default_filters: nextDefaultFilters,
  });
}
