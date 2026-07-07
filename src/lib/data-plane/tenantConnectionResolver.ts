export interface TenantConnectionScope {
  readonly clientKey?: string | null;
  readonly clientId?: string | null;
}

export type TenantConnectionStatus =
  | 'tenant-scoped'
  | 'shared-fallback'
  | 'missing-scope'
  | 'unconfigured';

export interface TenantConnectionResolution {
  readonly status: TenantConnectionStatus;
  readonly candidates: readonly string[];
  readonly sourceEnvNames: readonly string[];
  readonly maskedCandidates: readonly string[];
  readonly attemptedEnvNames: readonly string[];
  readonly warnings: readonly string[];
}

export interface TenantConnectionResolutionOptions {
  readonly allowSharedFallback?: boolean;
}

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function normalizeTenantConnectionToken(value: string | null | undefined): string | null {
  const normalized = value
    ?.trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return normalized || null;
}

export function maskConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.password) url.password = '***';
    if (url.username) url.username = '***';
    const dbName = url.pathname.split('/').filter(Boolean).pop();
    const databaseSuffix = dbName ? `/${dbName}` : '';
    return `${url.protocol}//${url.username ? `${url.username}@` : ''}${url.host}${databaseSuffix}`;
  } catch {
    return connectionString.length > 12
      ? `${connectionString.slice(0, 6)}...${connectionString.slice(-4)}`
      : '<masked>';
  }
}

export function tenantDatabaseEnvNamesForScope(scope: TenantConnectionScope): string[] {
  const tokens = [
    normalizeTenantConnectionToken(scope.clientKey),
    normalizeTenantConnectionToken(scope.clientId),
  ].filter((token): token is string => Boolean(token));

  const names: string[] = [];
  for (const token of [...new Set(tokens)]) {
    names.push(
      `ABARVA_CLIENT_DATABASE_URL_${token}`,
      `ABARVA_TENANT_DATABASE_URL_${token}`,
      `AZURE_CLIENT_DATABASE_URL_${token}`,
    );
  }
  return names;
}

export function tenantConnectionScopeFromEnv(env: NodeJS.ProcessEnv = process.env): TenantConnectionScope {
  return {
    clientKey: env.ABARVA_ACTIVE_CLIENT_KEY ?? env.ABARVA_CLIENT_KEY ?? null,
    clientId: env.ABARVA_ACTIVE_CLIENT_ID ?? env.ABARVA_CLIENT_ID ?? null,
  };
}

function readSharedDatabaseCandidates(env: NodeJS.ProcessEnv): string[] {
  const candidates = [
    env.ABARVA_AZURE_DATABASE_URL?.trim(),
    env.DATABASE_URL?.trim(),
  ].filter((value): value is string => Boolean(value));
  return [...new Set(candidates)];
}

function sharedFallbackAllowed(
  env: NodeJS.ProcessEnv,
  options: TenantConnectionResolutionOptions,
): boolean {
  if (options.allowSharedFallback !== undefined) return options.allowSharedFallback;
  return TRUE_VALUES.has(env.ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK?.trim().toLowerCase() ?? '');
}

export function resolveTenantDatabaseConnection(
  scope: TenantConnectionScope = tenantConnectionScopeFromEnv(),
  env: NodeJS.ProcessEnv = process.env,
  options: TenantConnectionResolutionOptions = {},
): TenantConnectionResolution {
  const attemptedEnvNames = tenantDatabaseEnvNamesForScope(scope);

  if (attemptedEnvNames.length === 0) {
    const shared = readSharedDatabaseCandidates(env);
    return {
      status: shared.length > 0 && sharedFallbackAllowed(env, options) ? 'shared-fallback' : 'missing-scope',
      candidates: sharedFallbackAllowed(env, options) ? shared : [],
      sourceEnvNames: sharedFallbackAllowed(env, options)
        ? ['ABARVA_AZURE_DATABASE_URL', 'DATABASE_URL'].filter((name) => Boolean(env[name]?.trim()))
        : [],
      maskedCandidates: sharedFallbackAllowed(env, options) ? shared.map(maskConnectionString) : [],
      attemptedEnvNames,
      warnings: ['No active client key or client id was provided; tenant-scoped connection cannot be resolved.'],
    };
  }

  const candidates: string[] = [];
  const sourceEnvNames: string[] = [];
  for (const name of attemptedEnvNames) {
    const value = env[name]?.trim();
    if (!value || candidates.includes(value)) continue;
    candidates.push(value);
    sourceEnvNames.push(name);
  }

  if (candidates.length > 0) {
    return {
      status: 'tenant-scoped',
      candidates,
      sourceEnvNames,
      maskedCandidates: candidates.map(maskConnectionString),
      attemptedEnvNames,
      warnings: [],
    };
  }

  const shared = readSharedDatabaseCandidates(env);
  if (shared.length > 0 && sharedFallbackAllowed(env, options)) {
    return {
      status: 'shared-fallback',
      candidates: shared,
      sourceEnvNames: ['ABARVA_AZURE_DATABASE_URL', 'DATABASE_URL'].filter((name) => Boolean(env[name]?.trim())),
      maskedCandidates: shared.map(maskConnectionString),
      attemptedEnvNames,
      warnings: [
        'Shared database fallback is enabled. Use only for local previews and never for a live private client data plane.',
      ],
    };
  }

  return {
    status: 'unconfigured',
    candidates: [],
    sourceEnvNames: [],
    maskedCandidates: [],
    attemptedEnvNames,
    warnings: [
      'Tenant scope was provided but no matching tenant database URL secret was projected; refusing shared fallback.',
    ],
  };
}

export function resolveDatabaseUrlCandidatesForScope(
  env: NodeJS.ProcessEnv = process.env,
  scope: TenantConnectionScope = tenantConnectionScopeFromEnv(env),
  options: TenantConnectionResolutionOptions = {},
): string[] {
  const hasTenantScope = tenantDatabaseEnvNamesForScope(scope).length > 0;
  if (hasTenantScope) {
    return [...resolveTenantDatabaseConnection(scope, env, options).candidates];
  }
  return readSharedDatabaseCandidates(env);
}
