#!/usr/bin/env node
import { createPublicKey } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const VAULT_URL = 'https://kv-abarva-lab-001.vault.azure.net';
const KEY_NAME = 'source-nda-docusign-lab-jwt';
const KEY_URL = `${VAULT_URL}/keys/${KEY_NAME}`;
const API_VERSION = '2025-07-01';
const PRIVATE_FIELDS = ['d', 'dp', 'dq', 'p', 'q', 'qi', 'k', 'key_hsm'];

function checkedPublicKey(bundle) {
  const { key, attributes } = bundle ?? {};
  const operations = key?.key_ops;
  const safe =
    typeof key?.kid === 'string' &&
    key.kid.startsWith(`${KEY_URL}/`) &&
    /^[0-9a-f]{32}$/i.test(key.kid.slice(KEY_URL.length + 1)) &&
    key.kty === 'RSA' &&
    Array.isArray(operations) &&
    operations.length === 2 &&
    operations.includes('sign') &&
    operations.includes('verify') &&
    typeof key.n === 'string' &&
    typeof key.e === 'string' &&
    attributes?.enabled === true &&
    (attributes.exportable === false || attributes.exportable === undefined) &&
    bundle.release_policy === undefined &&
    PRIVATE_FIELDS.every((field) => key[field] === undefined);
  if (!safe) throw new Error('unsafe Key Vault key response');

  try {
    const publicKey = createPublicKey({
      key: { kty: 'RSA', n: key.n, e: key.e },
      format: 'jwk',
    });
    if (publicKey.asymmetricKeyDetails?.modulusLength !== 2048) {
      throw new Error('unexpected RSA modulus length');
    }
    return {
      keyId: key.kid,
      publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
    };
  } catch {
    throw new Error('unsafe Key Vault key response');
  }
}

export async function provisionDocusignLabKey({ credential, fetchImpl = fetch }) {
  const token = await credential?.getToken('https://vault.azure.net/.default');
  if (!token?.token) throw new Error('managed identity token required');

  const headers = {
    Authorization: `Bearer ${token.token}`,
    'Content-Type': 'application/json',
  };
  const existing = await fetchImpl(`${KEY_URL}?api-version=${API_VERSION}`, {
    method: 'GET',
    headers,
  });
  if (existing.ok) {
    return { ...checkedPublicKey(await existing.json()), created: false };
  }
  if (existing.status !== 404) {
    throw new Error(`Key Vault GET failed with HTTP ${existing.status}`);
  }

  const created = await fetchImpl(`${KEY_URL}/create?api-version=${API_VERSION}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      kty: 'RSA',
      key_size: 2048,
      key_ops: ['sign', 'verify'],
      attributes: { enabled: true, exportable: false },
    }),
  });
  if (!created.ok) {
    throw new Error(`Key Vault create failed with HTTP ${created.status}`);
  }
  return { ...checkedPublicKey(await created.json()), created: true };
}

async function main() {
  if (process.env.DOCUSIGN_KEY_BOOTSTRAP_CONFIRM !== 'CREATE_LAB_KEY') {
    throw new Error('explicit lab key bootstrap confirmation required');
  }
  if (process.env.DOCUSIGN_ENV !== 'demo') {
    throw new Error('DocuSign demo environment required');
  }
  const clientId = process.env.AZURE_CLIENT_ID;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(clientId ?? '')) {
    throw new Error('dedicated bootstrap managed identity required');
  }

  const { ManagedIdentityCredential } = await import('@azure/identity');
  const result = await provisionDocusignLabKey({
    credential: new ManagedIdentityCredential(clientId),
  });
  process.stdout.write(JSON.stringify({
    keyId: result.keyId,
    exportable: false,
    created: result.created,
    publicKeyPem: result.publicKeyPem,
  }) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    process.exitCode = 1;
  });
}
