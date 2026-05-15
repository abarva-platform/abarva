import {
  buildAzureConnectivityConfig,
  keyVaultUrlFromEnv,
  redactSensitiveText,
  searchEndpointFromEnv,
  serviceBusNamespaceFromEnv,
  summarizeConnectivityResults,
} from '../config';

describe('azure connectivity config', () => {
  it('normalizes service bus namespace, key vault URL, and search endpoint', () => {
    const env = {
      SERVICE_BUS_NAMESPACE: 'sb-abarva-lab-eastus',
      AZURE_KEY_VAULT_NAME: 'kv-abarva-lab-001',
      AZURE_SEARCH_SERVICE_NAME: 'srch-abarva-context-lab-eastus',
    };

    expect(serviceBusNamespaceFromEnv(env)).toBe('sb-abarva-lab-eastus.servicebus.windows.net');
    expect(keyVaultUrlFromEnv(env)).toBe('https://kv-abarva-lab-001.vault.azure.net');
    expect(searchEndpointFromEnv(env)).toBe('https://srch-abarva-context-lab-eastus.search.windows.net');
  });

  it('builds config from the lab env aliases', () => {
    const config = buildAzureConnectivityConfig({
      DATABASE_URL: 'postgres://user:password@host/db',
      INGESTION_SMOKE_STORAGE_ACCOUNT_NAME: 'stabarvaprivatedplab001',
      INGESTION_SMOKE_CONTAINER_NAME: 'context-drops',
      SERVICE_BUS_NAMESPACE: 'sb-abarva-lab-eastus',
      SERVICE_BUS_QUEUE_NAME: 'q-connectivity-smoke',
      AZURE_KEY_VAULT_NAME: 'kv-abarva-lab-001',
      AZURE_SEARCH_SERVICE_NAME: 'srch-abarva-context-lab-eastus',
      AZURE_CLIENT_ID: 'client-id',
      AZURE_CONNECTIVITY_RUN_ID: 'azconn-test',
    });

    expect(config).toMatchObject({
      runId: 'azconn-test',
      storageAccountName: 'stabarvaprivatedplab001',
      blobContainerName: 'context-drops',
      serviceBusNamespace: 'sb-abarva-lab-eastus.servicebus.windows.net',
      serviceBusQueueName: 'q-connectivity-smoke',
      keyVaultUrl: 'https://kv-abarva-lab-001.vault.azure.net',
      keyVaultSecretName: 'azure-connectivity-smoke-secret',
      searchEndpoint: 'https://srch-abarva-context-lab-eastus.search.windows.net',
      searchIndexName: 'tenant-context-v1',
      managedIdentityClientId: 'client-id',
    });
  });

  it('redacts obvious secret material from error details', () => {
    expect(redactSensitiveText(
      'password=supersecret; AccountKey=abc123; sig=xyz api-key: key123 Authorization: Bearer token456',
    )).toBe(
      'password=<redacted>; AccountKey=<redacted>; sig=<redacted> api-key: <redacted> Authorization: Bearer <redacted>',
    );
  });

  it('summarizes failed checks as a failed report', () => {
    const report = summarizeConnectivityResults('run-1', [
      { name: 'postgres', status: 'pass', durationMs: 10, detail: 'ok' },
      { name: 'blob', status: 'fail', durationMs: 20, detail: 'blocked' },
    ], '2026-05-15T00:00:00.000Z');

    expect(report).toEqual({
      event: 'azure_connectivity_smoke',
      status: 'fail',
      runId: 'run-1',
      producedAt: '2026-05-15T00:00:00.000Z',
      checks: [
        { name: 'postgres', status: 'pass', durationMs: 10, detail: 'ok' },
        { name: 'blob', status: 'fail', durationMs: 20, detail: 'blocked' },
      ],
    });
  });
});
