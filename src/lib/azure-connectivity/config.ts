export type ConnectivityStatus = 'pass' | 'fail';

export type ConnectivityCheckName =
  | 'postgres'
  | 'blob'
  | 'service_bus'
  | 'key_vault'
  | 'ai_search';

export type ConnectivityCheckResult = {
  readonly name: ConnectivityCheckName;
  readonly status: ConnectivityStatus;
  readonly durationMs: number;
  readonly detail: string;
};

export type ConnectivitySmokeReport = {
  readonly event: 'azure_connectivity_smoke';
  readonly status: ConnectivityStatus;
  readonly runId: string;
  readonly producedAt: string;
  readonly checks: readonly ConnectivityCheckResult[];
};

export type AzureConnectivityConfig = {
  readonly runId: string;
  readonly databaseUrl: string;
  readonly storageAccountName: string;
  readonly blobContainerName: string;
  readonly serviceBusNamespace: string;
  readonly serviceBusQueueName: string;
  readonly keyVaultUrl: string;
  readonly keyVaultSecretName: string;
  readonly searchEndpoint: string;
  readonly searchIndexName: string;
  readonly searchApiVersion: string;
  readonly managedIdentityClientId?: string;
  readonly searchAdminKey?: string;
};

type EnvLike = Record<string, string | undefined>;

function readEnv(env: EnvLike, name: string): string | undefined {
  const value = env[name]?.trim();
  return value || undefined;
}

function requireEnv(env: EnvLike, name: string): string {
  const value = readEnv(env, name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function firstEnv(env: EnvLike, names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(env, name);
    if (value) return value;
  }
  return undefined;
}

function firstRequiredEnv(env: EnvLike, names: readonly string[]): string {
  const value = firstEnv(env, names);
  if (value) return value;
  throw new Error(`Missing required env var: ${names.join(' or ')}`);
}

export function serviceBusNamespaceFromEnv(env: EnvLike): string {
  const explicit = readEnv(env, 'SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE');
  if (explicit) return explicit;
  const namespaceName = requireEnv(env, 'SERVICE_BUS_NAMESPACE');
  return namespaceName.includes('.')
    ? namespaceName
    : `${namespaceName}.servicebus.windows.net`;
}

export function keyVaultUrlFromEnv(env: EnvLike): string {
  const explicit = firstEnv(env, ['AZURE_KEY_VAULT_URL', 'KEY_VAULT_URL']);
  if (explicit) return explicit.replace(/\/$/, '');
  const vaultName = firstRequiredEnv(env, ['AZURE_KEY_VAULT_NAME', 'KEY_VAULT_NAME']);
  return `https://${vaultName}.vault.azure.net`;
}

export function searchEndpointFromEnv(env: EnvLike): string {
  const explicit = firstEnv(env, ['AZURE_SEARCH_ENDPOINT', 'AZURE_AI_SEARCH_ENDPOINT']);
  if (explicit) return explicit.replace(/\/$/, '');
  const serviceName = firstRequiredEnv(env, ['AZURE_SEARCH_SERVICE_NAME', 'AZURE_AI_SEARCH_SERVICE_NAME']);
  return `https://${serviceName}.search.windows.net`;
}

export function buildAzureConnectivityConfig(env: EnvLike = process.env): AzureConnectivityConfig {
  const runId = readEnv(env, 'AZURE_CONNECTIVITY_RUN_ID')
    ?? `azconn-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;

  return {
    runId,
    databaseUrl: requireEnv(env, 'DATABASE_URL'),
    storageAccountName: firstRequiredEnv(env, [
      'AZURE_CONNECTIVITY_STORAGE_ACCOUNT_NAME',
      'INGESTION_SMOKE_STORAGE_ACCOUNT_NAME',
      'AZURE_STORAGE_ACCOUNT_NAME',
    ]),
    blobContainerName: firstEnv(env, [
      'AZURE_CONNECTIVITY_BLOB_CONTAINER_NAME',
      'INGESTION_SMOKE_CONTAINER_NAME',
    ]) ?? 'context-drops',
    serviceBusNamespace: serviceBusNamespaceFromEnv(env),
    serviceBusQueueName: firstRequiredEnv(env, [
      'AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME',
      'SERVICE_BUS_QUEUE_NAME',
    ]),
    keyVaultUrl: keyVaultUrlFromEnv(env),
    keyVaultSecretName: readEnv(env, 'AZURE_CONNECTIVITY_KEY_VAULT_SECRET_NAME')
      ?? 'azure-connectivity-smoke-secret',
    searchEndpoint: searchEndpointFromEnv(env),
    searchIndexName: readEnv(env, 'AZURE_CONNECTIVITY_SEARCH_INDEX_NAME')
      ?? readEnv(env, 'AZURE_SEARCH_INDEX_NAME')
      ?? 'tenant-context-v1',
    searchApiVersion: readEnv(env, 'AZURE_SEARCH_API_VERSION') ?? '2024-07-01',
    managedIdentityClientId: readEnv(env, 'AZURE_CLIENT_ID'),
    searchAdminKey: firstEnv(env, ['AZURE_SEARCH_ADMIN_KEY', 'AZURE_AI_SEARCH_API_KEY']),
  };
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(/(password=)[^;&\s]+/gi, '$1<redacted>')
    .replace(/(AccountKey=)[^;&\s]+/gi, '$1<redacted>')
    .replace(/(sig=)[^&\s]+/gi, '$1<redacted>')
    .replace(/(api-key[=:]\s*)[A-Za-z0-9._~-]+/gi, '$1<redacted>')
    .replace(/(Authorization:\s*Bearer\s+)[A-Za-z0-9._~-]+/gi, '$1<redacted>');
}

export function summarizeConnectivityResults(
  runId: string,
  checks: readonly ConnectivityCheckResult[],
  producedAt = new Date().toISOString(),
): ConnectivitySmokeReport {
  return {
    event: 'azure_connectivity_smoke',
    status: checks.every((check) => check.status === 'pass') ? 'pass' : 'fail',
    runId,
    producedAt,
    checks,
  };
}
