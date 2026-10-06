#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

const VAULT_URL = 'https://kv-abarva-lab-001.vault.azure.net';
const SECRET_NAME = 'source-nda-docusign-lab-webhook-hmac';
const API_VERSION = '2025-07-01';
const SECRET_URL = `${VAULT_URL}/secrets/${SECRET_NAME}`;

export async function storeDemoWebhookSecret({ credential, secret, fetchImpl = fetch }) {
  if (typeof secret !== 'string' || !secret || secret.includes('\0')) {
    throw new Error('nonempty webhook secret required');
  }
  const token = await credential?.getToken('https://vault.azure.net/.default');
  if (!token?.token) throw new Error('managed identity token required');
  const headers = { Authorization: `Bearer ${token.token}` };

  let next = `${VAULT_URL}/secrets?api-version=${API_VERSION}&maxresults=25`;
  for (let page = 0; next && page < 100; page += 1) {
    const url = new URL(next);
    if (url.origin !== VAULT_URL || url.pathname !== '/secrets') {
      throw new Error('untrusted Key Vault pagination');
    }
    const listed = await fetchImpl(url.href, { method: 'GET', headers });
    if (!listed.ok) throw new Error(`Key Vault metadata list failed with HTTP ${listed.status}`);
    const body = await listed.json();
    if (!Array.isArray(body?.value)) throw new Error('invalid Key Vault metadata list');
    for (const item of body.value) {
      if (typeof item?.id !== 'string' || !item.id.startsWith(`${VAULT_URL}/secrets/`)) {
        throw new Error('invalid Key Vault secret metadata');
      }
      const itemName = item.id.slice(`${VAULT_URL}/secrets/`.length).split('/')[0];
      if (itemName.toLowerCase() === SECRET_NAME) {
        throw new Error('webhook secret already exists');
      }
    }
    next = body.nextLink ?? null;
    if (next !== null && typeof next !== 'string') {
      throw new Error('invalid Key Vault pagination');
    }
  }
  if (next) throw new Error('Key Vault metadata list exceeded page limit');

  const stored = await fetchImpl(`${SECRET_URL}?api-version=${API_VERSION}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: secret, contentType: 'application/vnd.docusign.connect.hmac-key' }),
  });
  if (!stored.ok) throw new Error(`Key Vault secret write failed with HTTP ${stored.status}`);
  // A successful SET response contains the value; do not parse, return, or log it.
  return 'stored';
}

async function main() {
  if (process.env.DOCUSIGN_ENV !== 'demo' ||
      process.env.DOCUSIGN_WEBHOOK_BOOTSTRAP_CONFIRM !== 'STORE_LAB_WEBHOOK_SECRET') {
    throw new Error('explicit demo webhook-secret confirmation required');
  }
  const clientId = process.env.AZURE_CLIENT_ID;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(clientId ?? '')) {
    throw new Error('dedicated bootstrap managed identity required');
  }
  const { ManagedIdentityCredential } = await import('@azure/identity');
  await storeDemoWebhookSecret({
    credential: new ManagedIdentityCredential(clientId),
    secret: process.env.SOURCE_NDA_DEMO_WEBHOOK_HMAC,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.exitCode = 1;
  });
}
