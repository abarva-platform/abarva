// Tenancy-aware Supabase client wrapper for the Intelligence layer.
//
// Every repository call passes a TenancyCtx and must include client_id in
// its filter. This wrapper gives us a single place to enforce that
// invariant plus a hook for telemetry.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from '../types';

export function getIntelSupabase(): SupabaseClient {
  return getServerSupabase();
}

export function assertTenancy(ctx: TenancyCtx): asserts ctx is TenancyCtx {
  if (!ctx || !ctx.clientId || !ctx.userId) {
    throw new Error('[intelligence] TenancyCtx missing clientId or userId — refusing to query');
  }
}
