// Azure connectivity smoke probes — L2 of the AbarVa Azure full-stack
// test layers (docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md).
//
// Purpose: prove, from inside the Container App, that every private
// dependency is reachable through its intended lane. The classic
// Azure stand-up failure is "everything deployed but the Container
// App can't reach Postgres over the private endpoint" because private
// DNS zones get this wrong. This module returns a per-resource
// pass/fail JSON the operator can act on.
//
// Negative-path (public-internet-cannot-reach-private-data) checks
// are explicitly NOT in this module: they belong to an external test
// client and are documented as a curl recipe in the PR body. From
// inside the app we only assert positive reachability.
//
// SDK posture: this module uses the SDKs that are ALREADY in
// package.json (`@azure/storage-blob`, `@azure/service-bus`,
// `@azure/identity`, `pg`, `neo4j-driver`). For Key Vault and AI
// Search, where no SDK is installed, the probes use minimal direct
// REST calls against documented Azure data-plane endpoints (no new
// top-level dependencies — per PR constraint).
//
// Every probe is wrapped with a 3-second timeout so one slow lane
// never blocks the response.

import { Pool } from 'pg';
import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { ServiceBusClient } from '@azure/service-bus';

export type ProbeResult = {
  status: 'pass' | 'fail' | 'skipped';
  latencyMs: number;
  error?: string;
  reason?: string;
};

export type ProbeName =
  | 'postgres'
  | 'blob'
  | 'serviceBus'
  | 'keyVault'
  | 'search'
  | 'neo4j';

export type AzureLane = 'control' | 'private-data' | 'intelligence-model';

export type AzureConnectivityReport = {
  ok: boolean;
  lane: AzureLane | 'all';
  durationMs: number;
  probes: Partial<Record<ProbeName, ProbeResult>>;
};

const PROBE_TIMEOUT_MS = 3_000;

/**
 * Probes that belong to each lane. Operators hit
 * /api/health/azure-connectivity/<lane> to validate a single lane
 * (handy from Container App `exec`).
 *
 *   - control: managed identity, Key Vault — anything every app
 *     replica needs at boot.
 *   - private-data: Postgres, Blob, Service Bus, Neo4j — the data
 *     plane that lives on the private VNet.
 *   - intelligence-model: AI Search — the retrieval lane the
 *     agents read from.
 */
export const LANE_PROBES: Record<AzureLane, ReadonlySet<ProbeName>> = {
  control: new Set<ProbeName>(['keyVault']),
  'private-data': new Set<ProbeName>(['postgres', 'blob', 'serviceBus', 'neo4j']),
  'intelligence-model': new Set<ProbeName>(['search']),
};

const ALL_PROBES: ReadonlyArray<ProbeName> = [
  'postgres', 'blob', 'serviceBus', 'keyVault', 'search', 'neo4j',
];

/**
 * Probes contract — every probe is a `() => Promise<ProbeResult>`.
 * Factoring the contract this way means tests can supply a mocked
 * probe object without monkey-patching SDK modules.
 */
export interface ProbeFns {
  postgres: () => Promise<ProbeResult>;
  blob: () => Promise<ProbeResult>;
  serviceBus: () => Promise<ProbeResult>;
  keyVault: () => Promise<ProbeResult>;
  search: () => Promise<ProbeResult>;
  neo4j: () => Promise<ProbeResult>;
}

function nowMs(): number {
  return Date.now();
}

function maskError(err: unknown): string {
  if (process.env.NODE_ENV !== 'production') {
    return err instanceof Error ? err.message : String(err);
  }
  return 'error';
}

/**
 * Race a probe against a 3-second timeout. The timeout result is a
 * `fail` ProbeResult, never an unhandled rejection — so one slow
 * probe can never block the response.
 */
export async function withTimeout(
  fn: () => Promise<ProbeResult>,
  timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<ProbeResult> {
  const start = nowMs();
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race<ProbeResult>([
      fn(),
      new Promise<ProbeResult>((resolve) => {
        timer = setTimeout(() => {
          resolve({
            status: 'fail',
            latencyMs: nowMs() - start,
            error: `probe_timeout_${timeoutMs}ms`,
          });
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---------- Postgres ----------

let pgPool: Pool | null = null;

function getPgPool(connectionString: string): Pool {
  if (pgPool) return pgPool;
  pgPool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 2_500,
  });
  return pgPool;
}

export async function probePostgres(): Promise<ProbeResult> {
  const start = nowMs();
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return { status: 'skipped', latencyMs: 0, reason: 'DATABASE_URL_not_set' };
  }
  try {
    const pool = getPgPool(url);
    await pool.query('select 1');
    return { status: 'pass', latencyMs: nowMs() - start };
  } catch (err) {
    return { status: 'fail', latencyMs: nowMs() - start, error: maskError(err) };
  }
}

// ---------- Blob Storage ----------

function blobAccountName(): string | null {
  return (
    process.env.AZURE_HEALTH_BLOB_ACCOUNT?.trim()
    || process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim()
    || process.env.INGESTION_SMOKE_STORAGE_ACCOUNT_NAME?.trim()
    || null
  );
}

function blobContainerName(): string {
  return process.env.AZURE_HEALTH_BLOB_CONTAINER?.trim() || '_health';
}

function azureCredential(): DefaultAzureCredential {
  const managedIdentityClientId = process.env.AZURE_CLIENT_ID?.trim();
  return new DefaultAzureCredential(
    managedIdentityClientId ? { managedIdentityClientId } : undefined,
  );
}

export async function probeBlob(): Promise<ProbeResult> {
  const start = nowMs();
  const account = blobAccountName();
  if (!account) {
    return {
      status: 'skipped',
      latencyMs: 0,
      reason: 'AZURE_HEALTH_BLOB_ACCOUNT_not_set',
    };
  }
  try {
    const service = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      azureCredential(),
    );
    const container = service.getContainerClient(blobContainerName());
    // The container must already exist (created via bicep at lane
    // bring-up). Probe-only identity should NOT have Container Create
    // permission — that's a least-privilege concern.
    const blobName = `probe-${process.pid}-${Date.now()}.txt`;
    const blob = container.getBlockBlobClient(blobName);
    const body = Buffer.from('x', 'utf-8');
    await blob.uploadData(body, { blobHTTPHeaders: { blobContentType: 'text/plain' } });
    const download = await blob.download();
    if (!download.readableStreamBody) {
      return {
        status: 'fail',
        latencyMs: nowMs() - start,
        error: 'blob_download_empty',
      };
    }
    // Drain the stream so the SDK lets the connection release; we
    // don't actually need the bytes.
    for await (const _chunk of download.readableStreamBody) {
      void _chunk;
    }
    await blob.delete();
    return { status: 'pass', latencyMs: nowMs() - start };
  } catch (err) {
    return { status: 'fail', latencyMs: nowMs() - start, error: maskError(err) };
  }
}

// ---------- Service Bus ----------

function serviceBusFqdn(): string | null {
  const explicit = process.env.SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE?.trim();
  if (explicit) return explicit;
  const ns = process.env.SERVICE_BUS_NAMESPACE?.trim();
  if (!ns) return null;
  return ns.includes('.') ? ns : `${ns}.servicebus.windows.net`;
}

function serviceBusHealthQueue(): string {
  return process.env.AZURE_HEALTH_SERVICEBUS_QUEUE?.trim() || '_health';
}

export async function probeServiceBus(): Promise<ProbeResult> {
  const start = nowMs();
  const fqdn = serviceBusFqdn();
  if (!fqdn) {
    return {
      status: 'skipped',
      latencyMs: 0,
      reason: 'SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE_not_set',
    };
  }
  const queue = serviceBusHealthQueue();
  const client = new ServiceBusClient(fqdn, azureCredential());
  const sender = client.createSender(queue);
  const receiver = client.createReceiver(queue);
  try {
    const probeId = `probe-${process.pid}-${Date.now()}`;
    await sender.sendMessages({
      messageId: probeId,
      subject: 'azure-connectivity-probe',
      body: { ok: true, ts: new Date().toISOString() },
      applicationProperties: { probeId },
    });
    // Best-effort receive: drain up to 1 message with a short timeout.
    // We don't fail the probe if no message comes back (the queue may
    // be drained by another consumer in a Container Apps replica
    // scenario) — the send + auth handshake itself is the proof of
    // reachability.
    const messages = await receiver.receiveMessages(1, { maxWaitTimeInMs: 500 });
    for (const msg of messages) {
      try { await receiver.completeMessage(msg); } catch { /* ignore */ }
    }
    return { status: 'pass', latencyMs: nowMs() - start };
  } catch (err) {
    return { status: 'fail', latencyMs: nowMs() - start, error: maskError(err) };
  } finally {
    try { await sender.close(); } catch { /* ignore */ }
    try { await receiver.close(); } catch { /* ignore */ }
    try { await client.close(); } catch { /* ignore */ }
  }
}

// ---------- Key Vault ----------
// No `@azure/keyvault-secrets` in package.json. Per PR constraint we
// use a minimal direct REST call against the documented Azure Key
// Vault data-plane API and the same DefaultAzureCredential the rest
// of the codebase uses.

function keyVaultName(): string {
  return process.env.AZURE_KEY_VAULT_NAME?.trim() || 'kv-abarva-lab-001';
}

function keyVaultHealthSecretName(): string {
  return process.env.AZURE_HEALTH_KEYVAULT_SECRET?.trim() || '_health_probe';
}

export async function probeKeyVault(): Promise<ProbeResult> {
  const start = nowMs();
  const vault = keyVaultName();
  if (!vault) {
    return {
      status: 'skipped',
      latencyMs: 0,
      reason: 'AZURE_KEY_VAULT_NAME_not_set',
    };
  }
  try {
    const cred = azureCredential();
    const token = await cred.getToken('https://vault.azure.net/.default');
    if (!token?.token) {
      return {
        status: 'fail',
        latencyMs: nowMs() - start,
        error: 'keyvault_token_unavailable',
      };
    }
    const secretName = keyVaultHealthSecretName();
    const apiVersion = '7.4';
    const url = `https://${vault}.vault.azure.net/secrets/${encodeURIComponent(secretName)}?api-version=${apiVersion}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token.token}` },
    });
    if (!res.ok) {
      return {
        status: 'fail',
        latencyMs: nowMs() - start,
        error: `keyvault_status_${res.status}`,
      };
    }
    return { status: 'pass', latencyMs: nowMs() - start };
  } catch (err) {
    return { status: 'fail', latencyMs: nowMs() - start, error: maskError(err) };
  }
}

// ---------- AI Search ----------
// No `@azure/search-documents` in package.json. We mirror the
// auth/endpoint convention from
// `src/lib/azure-search/tenant-context-retriever.ts` and call the
// documented `$count` data-plane API.

function searchEndpoint(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const serviceName = process.env.AZURE_SEARCH_SERVICE_NAME?.trim()
    || 'srch-abarva-context-lab-eastus';
  return `https://${serviceName}.search.windows.net`;
}

function searchIndexName(): string {
  return process.env.AZURE_HEALTH_SEARCH_INDEX?.trim() || 'tenant-context-v1';
}

async function searchAuthHeaders(): Promise<Record<string, string>> {
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (apiKey) return { 'api-key': apiKey };
  const cred = azureCredential();
  const token = await cred.getToken('https://search.azure.com/.default');
  if (!token?.token) {
    throw new Error('azure_search_aad_token_unavailable');
  }
  return { Authorization: `Bearer ${token.token}` };
}

export async function probeSearch(): Promise<ProbeResult> {
  const start = nowMs();
  try {
    const headers = await searchAuthHeaders();
    const apiVersion = process.env.AZURE_SEARCH_API_VERSION?.trim() || '2024-07-01';
    const index = searchIndexName();
    // Use $count on the docs collection to avoid materializing rows.
    const url = `${searchEndpoint()}/indexes/${encodeURIComponent(index)}/docs/$count?api-version=${apiVersion}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...headers, Accept: 'text/plain' },
    });
    if (!res.ok) {
      return {
        status: 'fail',
        latencyMs: nowMs() - start,
        error: `search_status_${res.status}`,
      };
    }
    return { status: 'pass', latencyMs: nowMs() - start };
  } catch (err) {
    return { status: 'fail', latencyMs: nowMs() - start, error: maskError(err) };
  }
}

// ---------- Neo4j ----------

export async function probeNeo4j(): Promise<ProbeResult> {
  const start = nowMs();
  if (process.env.GRAPH_NEO4J_ENABLED?.trim().toLowerCase() !== 'true') {
    return {
      status: 'skipped',
      latencyMs: 0,
      reason: 'GRAPH_NEO4J_ENABLED_not_true',
    };
  }
  let driverModule: typeof import('@/lib/graph/driver') | null = null;
  try {
    driverModule = await import('@/lib/graph/driver');
  } catch (err) {
    return {
      status: 'fail',
      latencyMs: nowMs() - start,
      error: maskError(err),
    };
  }
  let session: ReturnType<ReturnType<typeof driverModule.getGraphDriver>['session']> | null = null;
  try {
    session = driverModule.getGraphDriver().session();
    await session.run('RETURN 1');
    return { status: 'pass', latencyMs: nowMs() - start };
  } catch (err) {
    return { status: 'fail', latencyMs: nowMs() - start, error: maskError(err) };
  } finally {
    if (session) {
      try { await session.close(); } catch { /* ignore */ }
    }
  }
}

// ---------- Default probe registry ----------

export const DEFAULT_PROBES: ProbeFns = {
  postgres: probePostgres,
  blob: probeBlob,
  serviceBus: probeServiceBus,
  keyVault: probeKeyVault,
  search: probeSearch,
  neo4j: probeNeo4j,
};

/**
 * Run the requested probes in parallel, each wrapped with the 3s
 * timeout, and assemble the report. A probe in `skipped` does not
 * make the report unhealthy — `ok` is `false` only when at least one
 * probe returns `fail`.
 */
export async function runAzureConnectivityProbes(opts: {
  lane?: AzureLane;
  probes?: ProbeFns;
  timeoutMs?: number;
}): Promise<AzureConnectivityReport> {
  const start = nowMs();
  const probes = opts.probes ?? DEFAULT_PROBES;
  const timeoutMs = opts.timeoutMs ?? PROBE_TIMEOUT_MS;
  const lane = opts.lane;
  const names: ReadonlyArray<ProbeName> = lane
    ? ALL_PROBES.filter((n) => LANE_PROBES[lane].has(n))
    : ALL_PROBES;

  const results = await Promise.all(
    names.map(async (name) => {
      const fn = probes[name];
      const result = await withTimeout(fn, timeoutMs);
      return [name, result] as const;
    }),
  );

  const report: Partial<Record<ProbeName, ProbeResult>> = {};
  let anyFail = false;
  for (const [name, result] of results) {
    report[name] = result;
    if (result.status === 'fail') anyFail = true;
  }

  return {
    ok: !anyFail,
    lane: lane ?? 'all',
    durationMs: nowMs() - start,
    probes: report,
  };
}
