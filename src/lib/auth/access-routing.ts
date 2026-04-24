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

export function isNewClientSetupEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized.includes('demo-new+clerk_test');
}

export function inferSessionRoleFromEmail(email: string | null | undefined): AppSessionRole {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (
    normalized.includes('anand+clerk_test@abarva.com') ||
    normalized.includes('anand.sundaram@thesundaram.com')
  ) {
    return 'admin';
  }

  if (normalized.includes('investor+clerk_test@abarva.com')) {
    return 'investor';
  }

  if (
    normalized.includes('demo-meridian+clerk_test') ||
    normalized.includes('demo-arcturus+clerk_test') ||
    normalized.includes('demo-firstcapital+clerk_test') ||
    normalized.includes('demo-apexretail+clerk_test') ||
    normalized.includes('demo-keystone+clerk_test') ||
    normalized.includes('demo-nexora+clerk_test') ||
    normalized.includes('demo-new+clerk_test') ||
    normalized.includes('mh+clerk_test') ||
    normalized.includes('af+clerk_test') ||
    normalized.includes('apex+clerk_test') ||
    normalized.includes('keystone+clerk_test') ||
    normalized.includes('ke+clerk_test')
  ) {
    return 'maestro';
  }

  return null;
}

export function resolveSessionRole(role: AppSessionRole, email: string | null | undefined): AppSessionRole {
  return role ?? inferSessionRoleFromEmail(email);
}

export function resolveSessionClientKey(input: ResolveClientInput): ClientKey {
  const resolved = [input.clientId, input.defaultClientId, inferClientKeyFromEmail(input.email), DEFAULT_CLIENT_KEY].find((candidate) =>
    isClientKey(candidate),
  );
  return resolved ?? DEFAULT_CLIENT_KEY;
}

export function isExternalOnlyRole(role: AppSessionRole): role is 'external' {
  return role === 'external';
}

export function resolvePostSignInPath(
  role: AppSessionRole,
  input: ResolveClientInput = {},
): string {
  const resolvedRole = resolveSessionRole(role, input.email);
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

  if ((resolvedRole === 'client' || resolvedRole === 'maestro') && isClientKey(input.clientId)) {
    return `/home?client=${input.clientId}`;
  }

  return `/home?client=${resolvedClientId}`;
}
