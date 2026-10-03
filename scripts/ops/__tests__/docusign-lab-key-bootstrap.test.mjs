import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { provisionDocusignLabKey } from '../docusign-lab-key-bootstrap.mjs';

const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const { n, e } = publicKey.export({ format: 'jwk' });
const key = {
  key: {
    kid: 'https://kv-abarva-lab-001.vault.azure.net/keys/source-nda-docusign-lab-jwt/0123456789abcdef0123456789abcdef',
    kty: 'RSA',
    key_ops: ['sign', 'verify'],
    n,
    e,
  },
  attributes: { enabled: true, exportable: false },
};

const response = (status, body = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

test('creates a non-exportable sign-only key after a verified absence', async () => {
  const calls = [];
  const result = await provisionDocusignLabKey({
    credential: { getToken: async () => ({ token: 'test-token' }) },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1 ? response(404) : response(200, key);
    },
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    kty: 'RSA',
    key_size: 2048,
    key_ops: ['sign', 'verify'],
    attributes: { enabled: true, exportable: false },
  });
  assert.equal(result.created, true);
  assert.match(result.publicKeyPem, /^-----BEGIN PUBLIC KEY-----/);
  assert.equal(result.keyId, key.key.kid);
});

test('an existing approved key is read, never rotated', async () => {
  const methods = [];
  const result = await provisionDocusignLabKey({
    credential: { getToken: async () => ({ token: 'test-token' }) },
    fetchImpl: async (_url, options) => {
      methods.push(options.method);
      return response(200, key);
    },
  });
  assert.deepEqual(methods, ['GET']);
  assert.equal(result.created, false);
});

test('accepts the documented omitted exportable attribute only without a release policy', async () => {
  const result = await provisionDocusignLabKey({
    credential: { getToken: async () => ({ token: 'test-token' }) },
    fetchImpl: async () => response(200, { ...key, attributes: { enabled: true } }),
  });
  assert.equal(result.created, false);
});

test('network and authorization failures cannot become key creation', async () => {
  let calls = 0;
  await assert.rejects(
    provisionDocusignLabKey({
      credential: { getToken: async () => ({ token: 'test-token' }) },
      fetchImpl: async () => {
        calls += 1;
        return response(403, { error: { message: 'do not echo this' } });
      },
    }),
    /Key Vault GET failed with HTTP 403/,
  );
  assert.equal(calls, 1);
});

test('exportable, private, or over-permissioned responses are rejected', async () => {
  for (const unsafe of [
    { ...key, attributes: { ...key.attributes, exportable: true } },
    { ...key, attributes: { ...key.attributes, exportable: 'false' } },
    { ...key, key: { ...key.key, d: 'private-component' } },
    { ...key, key: { ...key.key, key_ops: ['sign', 'verify', 'decrypt'] } },
    { ...key, release_policy: { data: 'exportable' } },
    { ...key, key: { ...key.key, kid: `${key.key.kid}/unexpected` } },
  ]) {
    await assert.rejects(
      provisionDocusignLabKey({
        credential: { getToken: async () => ({ token: 'test-token' }) },
        fetchImpl: async () => response(200, unsafe),
      }),
      /unsafe Key Vault key response/,
    );
  }
});

test('rejects an untrusted token source before network access', async () => {
  let called = false;
  await assert.rejects(
    provisionDocusignLabKey({
      credential: { getToken: async () => null },
      fetchImpl: async () => {
        called = true;
        return response(200, key);
      },
    }),
    /managed identity token required/,
  );
  assert.equal(called, false);
});

test('the CLI fails silently without operator confirmation', () => {
  const result = spawnSync(process.execPath, ['scripts/ops/docusign-lab-key-bootstrap.mjs'], {
    cwd: new URL('../../..', import.meta.url),
    env: { PATH: process.env.PATH },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});
