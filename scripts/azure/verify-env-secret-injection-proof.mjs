#!/usr/bin/env node
// Deterministic env/secret-injection proof for the Azure lab/cutover path.
//
// This is intentionally static and redacted: it inspects committed Bicep and
// parameter files to prove secret env vars are projected through Container Apps
// secretRef entries backed by Key Vault URLs, without reading or printing secret
// values.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = [
  'infra/azure/app-runtime.bicep',
  'infra/azure/database-migration-job.bicep',
  'infra/azure/key-vault-rbac.bicep',
  'infra/azure/parameters/app-runtime.lab.bicepparam',
  'infra/azure/parameters/private-operator.lab.bicepparam',
];

const APP_RUNTIME_SECRET_ENVS = [
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'DEMO_LOGIN_PASSWORD',
  'ABARVA_PRIVATE_BROWSER_PROOF_TOKEN',
];

const PRIVATE_OPERATOR_SECRET_ENVS = ['DATABASE_URL', 'ABARVA_PRIVATE_BROWSER_PROOF_TOKEN'];

const LIKELY_SECRET_PATTERNS = [
  ['github_pat_classic', /ghp_[A-Za-z0-9]{36,}/],
  ['github_pat_fine_grained', /github_pat_[A-Za-z0-9_]{60,}/],
  ['github_app_token', /ghs_[A-Za-z0-9]{36,}/],
  ['vercel_api_token', /vercel_[A-Za-z0-9]{24,}/],
  ['openai_or_anthropic_key', /sk-(ant-)?[A-Za-z0-9_-]{32,}/],
  ['slack_bot_token', /xoxb-[0-9]+-[0-9]+-[A-Za-z0-9]{24,}/],
  ['slack_user_token', /xoxp-[0-9]+-[0-9]+-[0-9]+-[A-Za-z0-9]{32,}/],
  ['aws_access_key_id', /AKIA[0-9A-Z]{16}/],
  ['jwt', /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/],
  [
    'env_var_assignment_with_long_opaque',
    /[A-Z][A-Z0-9_]+_(?:KEY|TOKEN|SECRET|PASSWORD)\s*[:=]\s*["'`][A-Za-z0-9_+/=-]{16,}["'`]/,
  ],
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function parseKeyVaultSecretRefs(source) {
  const startMatch = /param\s+keyVaultSecretRefs\s*=\s*\[/.exec(source);
  if (!startMatch) return null;

  const arrayStart = startMatch.index + startMatch[0].length;
  let depth = 1;
  let cursor = arrayStart;

  while (cursor < source.length && depth > 0) {
    const char = source[cursor];
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    cursor += 1;
  }

  if (depth !== 0) return null;

  const body = source.slice(arrayStart, cursor - 1);
  const refs = [];
  for (const objectMatch of body.matchAll(/\{([\s\S]*?)\}/g)) {
    const fields = {};
    for (const fieldMatch of objectMatch[1].matchAll(/(\w+):\s*'([^']*)'/g)) {
      fields[fieldMatch[1]] = fieldMatch[2];
    }
    refs.push(fields);
  }
  return refs;
}

function truncate(value) {
  return value.length <= 8 ? value : `${value.slice(0, 8)}...`;
}

function secretFindings(source) {
  const findings = [];
  for (const [name, pattern] of LIKELY_SECRET_PATTERNS) {
    const regex = new RegExp(pattern.source, 'g');
    let match = regex.exec(source);
    while (match) {
      findings.push({
        patternName: name,
        match: truncate(match[0]),
        index: match.index,
      });
      match = regex.exec(source);
    }
  }
  return findings;
}

function summarize(checks) {
  return checks.reduce(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { pass: 0, fail: 0 },
  );
}

const checks = [];

function check(name, pass, detail, evidence = undefined) {
  checks.push({
    name,
    status: pass ? 'pass' : 'fail',
    detail,
    ...(evidence ? { evidence } : {}),
  });
}

for (const file of REQUIRED_FILES) {
  check(
    `file.${file}`,
    exists(file),
    exists(file) ? 'Required env/secret-injection proof input exists.' : 'Required proof input is missing.',
  );
}

const appRuntimeBicep = read('infra/azure/app-runtime.bicep');
check(
  'app-runtime.secret-refs.use-key-vault-url',
  appRuntimeBicep.includes('keyVaultUrl: secretRef.keyVaultSecretUri'),
  'Container App secrets are declared from the Key Vault URL carried by keyVaultSecretRefs.',
);
check(
  'app-runtime.secret-refs.use-managed-identity',
  appRuntimeBicep.includes('identity: managedIdentity.id'),
  'Container App secret references use the runtime managed identity.',
);
check(
  'app-runtime.env.uses-secret-ref',
  appRuntimeBicep.includes('secretRef: secretRef.containerAppSecretName') &&
    appRuntimeBicep.includes('env: concat(staticRuntimeEnv, plainRuntimeEnv, keyVaultRuntimeEnv)'),
  'Runtime env combines static/plain env with Key Vault-backed secretRef env entries.',
);

const migrationJobBicep = read('infra/azure/database-migration-job.bicep');
check(
  'container-app-job.secret-refs.use-key-vault-url',
  migrationJobBicep.includes('keyVaultUrl: secretRef.keyVaultSecretUri'),
  'Container Apps Jobs declare secrets from Key Vault URLs carried by keyVaultSecretRefs.',
);
check(
  'container-app-job.env.uses-secret-ref',
  migrationJobBicep.includes('secretRef: secretRef.containerAppSecretName'),
  'Container Apps Jobs project secret env vars through secretRef, not literal values.',
);

const keyVaultRbac = read('infra/azure/key-vault-rbac.bicep');
check(
  'key-vault-rbac.secrets-user-role',
  keyVaultRbac.includes('4633458b-17de-408a-b874-0445c86b69e6'),
  'Key Vault Secrets User role definition is the documented reader role for projected secret access.',
);

const appRuntimeParams = read('infra/azure/parameters/app-runtime.lab.bicepparam');
const appPlainEnvBlock = appRuntimeParams.split('param keyVaultSecretRefs')[0] ?? appRuntimeParams;
const appRefs = parseKeyVaultSecretRefs(appRuntimeParams) ?? [];
const appRefsByEnv = new Map(appRefs.map((ref) => [ref.envName, ref]));

for (const envName of APP_RUNTIME_SECRET_ENVS) {
  const ref = appRefsByEnv.get(envName);
  check(
    `app-runtime.params.${envName}.key-vault-backed`,
    Boolean(ref?.containerAppSecretName && ref?.keyVaultSecretUri),
    `${envName} is present in keyVaultSecretRefs with a Container App secret name and Key Vault URI.`,
    ref
      ? {
          envName: ref.envName,
          containerAppSecretName: ref.containerAppSecretName,
          keyVaultSecretUri: ref.keyVaultSecretUri,
        }
      : undefined,
  );
  check(
    `app-runtime.params.${envName}.not-plain-env`,
    !appPlainEnvBlock.includes(`name: '${envName}'`) &&
      !appPlainEnvBlock.includes(`readEnvironmentVariable('${envName}'`),
    `${envName} is not injected as a literal/plain runtime env value in app-runtime.lab.bicepparam.`,
  );
}

const privateOperatorParams = read('infra/azure/parameters/private-operator.lab.bicepparam');
const privateOperatorRefs = parseKeyVaultSecretRefs(privateOperatorParams) ?? [];
const privateOperatorRefsByEnv = new Map(privateOperatorRefs.map((ref) => [ref.envName, ref]));
for (const envName of PRIVATE_OPERATOR_SECRET_ENVS) {
  const ref = privateOperatorRefsByEnv.get(envName);
  check(
    `private-operator.params.${envName}.key-vault-backed`,
    Boolean(ref?.containerAppSecretName && ref?.keyVaultSecretUri),
    `${envName} is Key Vault-backed for the private operator proof job.`,
    ref
      ? {
          envName: ref.envName,
          containerAppSecretName: ref.containerAppSecretName,
          keyVaultSecretUri: ref.keyVaultSecretUri,
        }
      : undefined,
  );
}

const parameterDir = path.join(ROOT, 'infra/azure/parameters');
const parameterFiles = fs
  .readdirSync(parameterDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.bicepparam'))
  .map((entry) => `infra/azure/parameters/${entry.name}`)
  .sort();

for (const file of parameterFiles) {
  const content = read(file);
  const refs = parseKeyVaultSecretRefs(content);
  if (refs === null || refs.length === 0) continue;

  for (const [index, ref] of refs.entries()) {
    check(
      `parameter.${file}.secret-ref-${index}.shape`,
      Boolean(ref.envName && ref.containerAppSecretName && ref.keyVaultSecretUri),
      'Every non-empty keyVaultSecretRefs entry carries envName, containerAppSecretName, and keyVaultSecretUri.',
      {
        envName: ref.envName ?? null,
        containerAppSecretName: ref.containerAppSecretName ?? null,
        keyVaultSecretUri: ref.keyVaultSecretUri ?? null,
      },
    );
  }
}

for (const file of [
  'infra/azure/app-runtime.bicep',
  'infra/azure/database-migration-job.bicep',
  ...parameterFiles,
]) {
  const findings = secretFindings(read(file));
  check(
    `secret-value-scan.${file}`,
    findings.length === 0,
    findings.length === 0
      ? 'No likely secret values found in committed env/secret-injection config.'
      : 'Likely secret value shape found; matches are truncated in this output.',
    findings.length > 0 ? { findings } : undefined,
  );
}

const summary = summarize(checks);
const status = summary.fail > 0 ? 'fail' : 'pass';

console.log(
  JSON.stringify(
    {
      audit: 'env-secret-injection-proof',
      status,
      proofClass: 'static-redacted-repo-proof',
      secretValuePolicy:
        'This verifier inspects committed projection config only. It never reads Key Vault values and never prints secret values.',
      summary,
      checks,
    },
    null,
    2,
  ),
);

if (status !== 'pass') {
  process.exit(1);
}
