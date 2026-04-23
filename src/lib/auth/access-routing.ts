import { DEFAULT_CLIENT_KEY, isClientKey, type ClientKey } from '@/lib/client-config';

export type AppSessionRole = 'admin' | 'investor' | 'maestro' | 'client' | 'external' | string | null | undefined;

interface ResolveClientInput {
  clientId?: string | null;
  defaultClientId?: string | null;
}

export function resolveSessionClientKey(input: ResolveClientInput): ClientKey {
  const resolved = [input.clientId, input.defaultClientId, DEFAULT_CLIENT_KEY].find((candidate) =>
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
  const resolvedClientId = resolveSessionClientKey(input);

  if (isExternalOnlyRole(role)) {
    return '/';
  }

  if (role === 'investor') {
    return `/investor?client=${resolvedClientId}`;
  }

  if (role === 'admin') {
    return `/home?client=${resolvedClientId}`;
  }

  if ((role === 'client' || role === 'maestro') && isClientKey(input.clientId)) {
    return `/home?client=${input.clientId}`;
  }

  return `/home?client=${resolvedClientId}`;
}
