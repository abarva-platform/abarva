import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { ServiceBusClient } from '@azure/service-bus';
import { Pool } from 'pg';
import {
  redactSensitiveText,
  summarizeConnectivityResults,
  type AzureConnectivityConfig,
  type ConnectivityCheckName,
  type ConnectivityCheckResult,
  type ConnectivitySmokeReport,
} from './config';

type CheckRunner = () => Promise<string>;

function credential(config: AzureConnectivityConfig): DefaultAzureCredential {
  return new DefaultAzureCredential(
    config.managedIdentityClientId
      ? { managedIdentityClientId: config.managedIdentityClientId }
      : undefined,
  );
}

async function timedCheck(name: ConnectivityCheckName, run: CheckRunner): Promise<ConnectivityCheckResult> {
  const start = Date.now();
  try {
    const detail = await run();
    return {
      name,
      status: 'pass',
      durationMs: Date.now() - start,
      detail,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name,
      status: 'fail',
      durationMs: Date.now() - start,
      detail: redactSensitiveText(message),
    };
  }
}

async function checkPostgres(config: AzureConnectivityConfig): Promise<string> {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
  });
  try {
    const result = await pool.query<{ ok: number }>('select 1::int as ok');
    if (result.rows[0]?.ok !== 1) throw new Error('postgres_select_1_unexpected_result');
    return 'SELECT 1 succeeded';
  } finally {
    await pool.end();
  }
}

async function checkBlob(config: AzureConnectivityConfig, cred: TokenCredential): Promise<string> {
  const service = new BlobServiceClient(
    `https://${config.storageAccountName}.blob.core.windows.net`,
    cred,
  );
  const container = service.getContainerClient(config.blobContainerName);
  const blobPath = `connectivity-smoke/${config.runId}.txt`;
  const blockBlob = container.getBlockBlobClient(blobPath);
  const payload = Buffer.from('1', 'utf-8');

  await blockBlob.uploadData(payload, {
    blobHTTPHeaders: { blobContentType: 'text/plain' },
    metadata: { smokeRunId: config.runId, purpose: 'azure_connectivity_smoke' },
  });
  const downloaded = await blockBlob.downloadToBuffer();
  if (downloaded.toString('utf-8') !== '1') {
    throw new Error('blob_put_get_payload_mismatch');
  }
  await blockBlob.deleteIfExists();
  return `put/get/delete succeeded on ${config.blobContainerName}/${blobPath}`;
}

async function checkServiceBus(config: AzureConnectivityConfig, cred: TokenCredential): Promise<string> {
  const client = new ServiceBusClient(config.serviceBusNamespace, cred);
  const sender = client.createSender(config.serviceBusQueueName);
  const receiver = client.createReceiver(config.serviceBusQueueName, { receiveMode: 'peekLock' });
  const messageId = `${config.runId}-service-bus`;

  try {
    await sender.sendMessages({
      messageId,
      subject: 'abarva.connectivity.smoke',
      contentType: 'application/json',
      body: {
        schema: 'abarva.connectivity.v1',
        runId: config.runId,
        producedAt: new Date().toISOString(),
      },
      applicationProperties: {
        schema: 'abarva.connectivity.v1',
        smokeRunId: config.runId,
      },
    });

    const received = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5_000 });
    let found = false;
    for (const message of received) {
      if (message.messageId === messageId) {
        found = true;
        await receiver.completeMessage(message);
      } else {
        await receiver.abandonMessage(message);
      }
    }
    if (!found) throw new Error(`service_bus_smoke_message_not_received:${messageId}`);
    return `send/receive succeeded on ${config.serviceBusQueueName}`;
  } finally {
    await sender.close();
    await receiver.close();
    await client.close();
  }
}

async function getAzureToken(cred: TokenCredential, scope: string): Promise<string> {
  const token = await cred.getToken(scope);
  if (!token?.token) throw new Error(`azure_token_unavailable:${scope}`);
  return token.token;
}

async function checkKeyVault(config: AzureConnectivityConfig, cred: TokenCredential): Promise<string> {
  const token = await getAzureToken(cred, 'https://vault.azure.net/.default');
  const res = await fetch(
    `${config.keyVaultUrl}/secrets/${encodeURIComponent(config.keyVaultSecretName)}?api-version=7.4`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`key_vault_secret_read_failed:${res.status}:${await res.text()}`);
  }
  const body = await res.json() as { value?: string };
  if (typeof body.value !== 'string' || body.value.length === 0) {
    throw new Error('key_vault_secret_empty_or_missing');
  }
  return `secret read succeeded for ${config.keyVaultSecretName}`;
}

async function searchHeaders(config: AzureConnectivityConfig, cred: TokenCredential): Promise<Record<string, string>> {
  if (config.searchAdminKey) return { 'api-key': config.searchAdminKey };
  const token = await getAzureToken(cred, 'https://search.azure.com/.default');
  return { Authorization: `Bearer ${token}` };
}

async function checkSearch(config: AzureConnectivityConfig, cred: TokenCredential): Promise<string> {
  const body = { search: '*', count: true, top: 0 };
  const res = await fetch(
    `${config.searchEndpoint}/indexes/${encodeURIComponent(config.searchIndexName)}/docs/search?api-version=${config.searchApiVersion}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(await searchHeaders(config, cred)),
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error(`azure_search_count_failed:${res.status}:${await res.text()}`);
  }
  const json = await res.json() as { '@odata.count'?: number };
  return `count query succeeded on ${config.searchIndexName}: ${json['@odata.count'] ?? 'unknown'}`;
}

export async function runAzureConnectivitySmoke(
  config: AzureConnectivityConfig,
): Promise<ConnectivitySmokeReport> {
  const cred = credential(config);
  const checks = await Promise.all([
    timedCheck('postgres', () => checkPostgres(config)),
    timedCheck('blob', () => checkBlob(config, cred)),
    timedCheck('service_bus', () => checkServiceBus(config, cred)),
    timedCheck('key_vault', () => checkKeyVault(config, cred)),
    timedCheck('ai_search', () => checkSearch(config, cred)),
  ]);
  return summarizeConnectivityResults(config.runId, checks);
}
