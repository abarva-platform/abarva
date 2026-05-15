#!/usr/bin/env -S npx tsx
// Azure AI Search index contract deployment for the lab retrieval lane.

import { DefaultAzureCredential } from '@azure/identity';
import { azureSearchIndexContracts } from '@/lib/azure-search/index-contracts';

type Mode = 'plan' | 'apply' | 'verify';

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function mode(): Mode {
  const value = readEnv('AZURE_SEARCH_INDEX_MODE', process.argv[2] ?? 'plan') as Mode;
  if (value === 'plan' || value === 'apply' || value === 'verify') return value;
  throw new Error(`Unsupported AZURE_SEARCH_INDEX_MODE: ${value}`);
}

function endpoint(): string {
  const explicit = process.env.AZURE_SEARCH_ENDPOINT?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const serviceName = readEnv('AZURE_SEARCH_SERVICE_NAME', 'srch-abarva-context-lab-eastus');
  return `https://${serviceName}.search.windows.net`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY?.trim();
  if (apiKey) {
    return { 'api-key': apiKey };
  }

  const credential = new DefaultAzureCredential(
    process.env.AZURE_CLIENT_ID?.trim()
      ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID.trim() }
      : undefined,
  );
  const token = await credential.getToken('https://search.azure.com/.default');
  if (!token?.token) throw new Error('azure_search_aad_token_unavailable');
  return { Authorization: `Bearer ${token.token}` };
}

async function searchRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const apiVersion = readEnv('AZURE_SEARCH_API_VERSION', '2024-07-01');
  const sep = path.includes('?') ? '&' : '?';
  return fetch(`${endpoint()}${path}${sep}api-version=${apiVersion}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(await authHeaders()),
      ...(init.headers ?? {}),
    },
  });
}

async function existingIndexNames(): Promise<Set<string>> {
  const res = await searchRequest('/indexes');
  if (!res.ok) {
    throw new Error(`azure_search_list_failed:${res.status}:${await res.text()}`);
  }
  const body = await res.json() as { value?: Array<{ name?: string }> };
  return new Set((body.value ?? []).map((index) => index.name).filter(Boolean) as string[]);
}

async function applyIndexes(): Promise<void> {
  const contracts = azureSearchIndexContracts();
  for (const contract of contracts) {
    const res = await searchRequest(`/indexes/${encodeURIComponent(contract.name)}`, {
      method: 'PUT',
      body: JSON.stringify(contract),
    });
    if (!res.ok) {
      throw new Error(`azure_search_index_put_failed:${contract.name}:${res.status}:${await res.text()}`);
    }
    console.log(JSON.stringify({ event: 'azure_search_index_applied', index: contract.name }));
  }
}

async function verifyIndexes(): Promise<void> {
  const expected = azureSearchIndexContracts().map((index) => index.name);
  const actual = await existingIndexNames();
  const missing = expected.filter((name) => !actual.has(name));
  if (missing.length > 0) {
    throw new Error(`azure_search_indexes_missing:${missing.join(',')}`);
  }
  console.log(JSON.stringify({
    event: 'azure_search_indexes_verified',
    indexes: expected,
  }));
}

async function main(): Promise<void> {
  const runMode = mode();
  if (runMode === 'plan') {
    console.log(JSON.stringify({
      event: 'azure_search_index_plan',
      endpoint: endpoint(),
      indexes: azureSearchIndexContracts().map((index) => ({
        name: index.name,
        fieldCount: index.fields.length,
        vectorDimensions: index.fields.find((field) => field.name === 'embedding')?.dimensions,
      })),
    }, null, 2));
    return;
  }

  if (runMode === 'apply') {
    await applyIndexes();
    await verifyIndexes();
    return;
  }

  await verifyIndexes();
}

main().catch((err) => {
  console.error(JSON.stringify({
    event: 'azure_search_indexes_failed',
    error: err instanceof Error ? err.message : String(err),
  }));
  process.exit(1);
});
