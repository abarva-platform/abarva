import 'server-only';

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

export type ProgramsAuthMode = 'service_role' | 'authenticated';
export type ProgramsAuthRouteFamily =
  | 'portfolio'
  | 'detail'
  | 'program_read'
  | 'mutation'
  | 'origination';

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

export async function getProgramsRouteSupabase(
  routeFamily: ProgramsAuthRouteFamily,
): Promise<{ mode: ProgramsAuthMode; supabase: ReturnType<typeof getAzureWriteFluentClient> }> {
  const mode = resolveProgramsAuthMode(routeFamily);
  return { mode, supabase: getAzureWriteFluentClient() };
}
