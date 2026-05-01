import { DEFAULT_CLIENT_KEY, inferClientKeyFromEmail, isClientKey, type ClientKey } from '@/lib/client-config';

export type AppSessionRole = 'admin' | 'investor' | 'maestro' | 'client' | 'external' | string | null | undefined;

interface ResolveClientInput {
  clientId?: string | null;
  defaultClientId?: string | null;
  email?: string | null;
}

function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? '';
}

function hasExplicitTenantAlias(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return (
    normalized.endsWith('@meridian-health.example.com') ||
    normalized.endsWith('@apex-retail.example.com') ||
    normalized.endsWith('@firstcapital.example.com') ||
    normalized.includes('+apex@abarva.com') ||
    normalized.includes('+meridian@abarva.com') ||
    normalized.includes('+firstcapital@abarva.com')
  );
}

export function isNewClientSetupEmail(email: string | null | undefined): boolean {
  void email;
  return false;
}

export function inferSessionRoleFromEmail(email: string | null | undefined): AppSessionRole {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (
    normalized.endsWith('@meridian-health.example.com') ||
    normalized.endsWith('@apex-retail.example.com') ||
    normalized.endsWith('@firstcapital.example.com') ||
    normalized.includes('+apex@abarva.com') ||
    normalized.includes('+meridian@abarva.com') ||
    normalized.includes('+firstcapital@abarva.com')
  ) {
    return 'client';
  }

  return null;
}

export function resolveSessionRole(role: AppSessionRole, email: string | null | undefined): AppSessionRole {
  return role ?? inferSessionRoleFromEmail(email);
}

export function isLockedTenantRole(role: AppSessionRole, email: string | null | undefined): boolean {
  const resolvedRole = resolveSessionRole(role, email);
  return resolvedRole === 'client' || resolvedRole === 'maestro';
}

export function resolvePinnedSessionClientKey(input: ResolveClientInput): ClientKey | null {
  const inferredClientKey = inferClientKeyFromEmail(input.email);
  if (hasExplicitTenantAlias(input.email) && inferredClientKey) {
    return inferredClientKey;
  }

  const resolved = [input.clientId, input.defaultClientId, inferClientKeyFromEmail(input.email)].find((candidate) =>
    isClientKey(candidate),
  );
  return resolved ?? null;
}

export function resolveSessionClientKey(input: ResolveClientInput): ClientKey {
  return resolvePinnedSessionClientKey(input) ?? DEFAULT_CLIENT_KEY;
}

export function shouldStripUnauthorizedClientParam(
  role: AppSessionRole,
  input: ResolveClientInput,
  requestedClientId: string | null | undefined,
): boolean {
  if (!requestedClientId) return false;
  if (!isLockedTenantRole(role, input.email)) return false;
  const pinnedClientId = resolvePinnedSessionClientKey(input);
  if (!pinnedClientId) return false;
  return requestedClientId !== pinnedClientId;
}

export function isExternalOnlyRole(role: AppSessionRole): role is 'external' {
  return role === 'external';
}

export function resolvePostSignInPath(
  role: AppSessionRole,
  input: ResolveClientInput = {},
): string {
  const resolvedRole = resolveSessionRole(role, input.email);
  const pinnedClientId = resolvePinnedSessionClientKey(input);
  const resolvedClientId = resolveSessionClientKey(input);

  if (isNewClientSetupEmail(input.email)) {
    return '/tower/onboard';
  }

  if (isExternalOnlyRole(resolvedRole)) {
    return '/';
  }

  if (resolvedRole === 'investor') {
    return `/investor?client=${resolvedClientId}`;
  }

  if (resolvedRole === 'admin') {
    return `/home?client=${resolvedClientId}`;
  }

  if (resolvedRole === 'client' || resolvedRole === 'maestro') {
    if (pinnedClientId) {
      return `/home?client=${pinnedClientId}`;
    }
    return '/home';
  }

  return `/home?client=${resolvedClientId}`;
}
