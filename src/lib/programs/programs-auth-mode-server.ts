import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase-server';

export type ProgramsAuthMode = 'service_role' | 'authenticated';
export type ProgramsAuthRouteFamily = 'portfolio' | 'detail' | 'mutation';

function normalizeProgramsAuthMode(raw: string | null | undefined): ProgramsAuthMode | null {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'service_role') return 'service_role';
  if (v === 'authenticated') return 'authenticated';
  return null;
}

export function resolveProgramsAuthMode(routeFamily: ProgramsAuthRouteFamily): ProgramsAuthMode {
  const defaultMode = normalizeProgramsAuthMode(process.env.PROGRAMS_AUTH_MODE) ?? 'service_role';
  const rawOverrides = process.env.PROGRAMS_AUTH_MODE_ROUTE_OVERRIDES ?? '';
  if (!rawOverrides.trim()) return defaultMode;

  for (const token of rawOverrides.split(',')) {
    const [rawRoute, rawMode] = token.split('=').map((s) => s.trim().toLowerCase());
    if (!rawRoute || !rawMode) continue;
    if (rawRoute !== routeFamily) continue;
    const mode = normalizeProgramsAuthMode(rawMode);
    if (mode) return mode;
  }

  return defaultMode;
}

async function createAuthenticatedSupabase(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken({ template: 'supabase' });
  if (!token) throw new Error('Missing Clerk Supabase token for authenticated DB mode');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getProgramsRouteSupabase(
  routeFamily: ProgramsAuthRouteFamily,
): Promise<{ mode: ProgramsAuthMode; supabase: SupabaseClient }> {
  const mode = resolveProgramsAuthMode(routeFamily);
  if (mode === 'authenticated') {
    return { mode, supabase: await createAuthenticatedSupabase() };
  }
  return { mode, supabase: getServerSupabase() };
}
