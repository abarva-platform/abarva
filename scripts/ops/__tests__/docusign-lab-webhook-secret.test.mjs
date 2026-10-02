import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { storeDemoWebhookSecret } from '../docusign-lab-webhook-secret.mjs';
import { writeWebhookJobSpec } from '../docusign-lab-webhook-secret-job.mjs';

const vault = 'https://kv-abarva-lab-001.vault.azure.net';
const name = 'source-nda-docusign-lab-webhook-hmac';
const response = (status, body = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});
const credential = { getToken: async () => ({ token: 'test-token' }) };

test('stores once after metadata-only absence and never reads the value back', async () => {
  const calls = [];
  const result = await storeDemoWebhookSecret({
    credential,
    secret: 'sensitive-synthetic-marker',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1
        ? response(200, { value: [], nextLink: null })
        : response(200, { value: 'sensitive-synthetic-marker', id: `${vault}/secrets/${name}/v1` });
    },
  });
  assert.equal(result, 'stored');
  assert.deepEqual(calls.map((call) => call.options.method), ['GET', 'PUT']);
  assert.equal(calls[0].url, `${vault}/secrets?api-version=2025-07-01&maxresults=25`);
  assert.equal(calls[1].url, `${vault}/secrets/${name}?api-version=2025-07-01`);
  assert.equal(JSON.parse(calls[1].options.body).value, 'sensitive-synthetic-marker');
});

test('existing target on any metadata page refuses a new version', async () => {
  const calls = [];
  await assert.rejects(storeDemoWebhookSecret({
    credential,
    secret: 'sensitive-synthetic-marker',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1
        ? response(200, { value: [], nextLink: `${vault}/secrets?api-version=2025-07-01&next=2` })
        : response(200, { value: [{ id: `${vault}/secrets/${name}` }] });
    },
  }), /already exists/);
  assert.deepEqual(calls.map((call) => call.options.method), ['GET', 'GET']);
});

test('missing token, absent secret, bad metadata and foreign pagination fail without a PUT', async () => {
  for (const bad of [
    { credential: { getToken: async () => null }, secret: 'marker' },
    { credential, secret: '' },
    { credential, secret: 'marker', reply: response(403) },
    { credential, secret: 'marker', reply: response(200, { value: 'not a list' }) },
    { credential, secret: 'marker', reply: response(200, { value: [], nextLink: 'https://evil.test/secrets' }) },
  ]) {
    const calls = [];
    await assert.rejects(storeDemoWebhookSecret({
      credential: bad.credential,
      secret: bad.secret,
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return bad.reply ?? response(200, { value: [] });
      },
    }));
    assert.ok(calls.every((call) => call.options.method !== 'PUT'));
  }
});

test('job spec holds a job secret and only a secretRef env; file is owner-only', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nda-secret-spec-'));
  try {
    const path = join(dir, 'job.yaml');
    await writeWebhookJobSpec({
      path,
      secret: 'sensitive-synthetic-marker',
      jobName: 'nda-hmac-12345',
      environmentId: '/subscriptions/test/resourceGroups/test/providers/Microsoft.App/managedEnvironments/cae-abarva-scale-lab-eastus',
      identityId: '/subscriptions/test/resourceGroups/test/providers/Microsoft.ManagedIdentity/userAssignedIdentities/test',
      clientId: '00000000-0000-4000-8000-000000000001',
      image: 'acrabarvalab001.azurecr.io/abarva/web@sha256:' + 'a'.repeat(64),
    });
    const spec = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(spec.properties.configuration.secrets[0].value, 'sensitive-synthetic-marker');
    const env = spec.properties.template.containers[0].env;
    assert.deepEqual(env.find((entry) => entry.name === 'SOURCE_NDA_DEMO_WEBHOOK_HMAC'), {
      name: 'SOURCE_NDA_DEMO_WEBHOOK_HMAC', secretRef: 'webhook-hmac',
    });
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.ok(!JSON.stringify(spec.properties.template.containers[0].args).includes('sensitive-synthetic-marker'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('job spec refuses mutable images and missing secret without writing a file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nda-secret-refusal-'));
  try {
    const path = join(dir, 'job.yaml');
    await assert.rejects(writeWebhookJobSpec({
      path, secret: 'marker', jobName: 'nda-hmac-test', environmentId: 'test', identityId: 'test',
      clientId: 'test', image: 'registry.invalid/web:latest',
    }));
    await assert.rejects(readFile(path));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('CLI does not print the value on refused execution', () => {
  const result = spawnSync(process.execPath, ['scripts/ops/docusign-lab-webhook-secret.mjs'], {
    cwd: new URL('../../..', import.meta.url),
    env: { PATH: process.env.PATH, SOURCE_NDA_DEMO_WEBHOOK_HMAC: 'sensitive-synthetic-marker' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('manual workflow never logs or publishes the secret-bearing job specification', async () => {
  const source = await readFile(new URL('../../../.github/workflows/source-nda-demo-webhook-secret.yml', import.meta.url), 'utf8');
  const assertBoundary = (text) => {
    assert.match(text, /^on:\n  workflow_dispatch:/m);
    assert.doesNotMatch(text, /^  (push|schedule|pull_request):/m);
    assert.match(text, /SOURCE_NDA_DEMO_WEBHOOK_HMAC: \$\{\{ secrets\.SOURCE_NDA_DEMO_WEBHOOK_HMAC \}\}/);
    assert.match(text, /node scripts\/ops\/docusign-lab-webhook-secret-job\.mjs "\$spec_path"/);
    assert.match(text, /--yaml "\$spec_path" --output none 2>"\$error_path"/);
    assert.match(text, /trap 'rm -f "\$spec_path" "\$error_path"' EXIT/);
    assert.doesNotMatch(text, /set -x|logs show|upload-artifact/);
    assert.doesNotMatch(text, /echo [^\n]*SOURCE_NDA_DEMO_WEBHOOK_HMAC/);
  };
  assertBoundary(source);
  assert.throws(() => assertBoundary(source.replace('2>"$error_path"', '')), /--yaml/);
  assert.throws(() => assertBoundary(source.replace("trap 'rm -f \"$spec_path\" \"$error_path\"' EXIT", '')), /trap/);
});
