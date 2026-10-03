import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const root = path.resolve(__dirname, '../../../..');
const workflow = yaml.load(readFileSync(path.join(root, '.github/workflows/aca-main-deploy.yml'), 'utf8')) as {
  jobs: { deploy: { steps: Array<{ name: string; run?: string; env?: Record<string, string> }> } };
};
const script = path.join(root, 'scripts/ops/source-nda-esign-deploy-env.sh');
const values = {
  SOURCE_NDA_ESIGN_PROVIDER: 'docusign',
  SOURCE_NDA_ESIGN_ENVIRONMENT: 'demo',
  SOURCE_NDA_ESIGN_INTEGRATION_KEY: 'integration-id',
  SOURCE_NDA_ESIGN_ACCOUNT_ID: 'account-id',
  SOURCE_NDA_ESIGN_USER_ID: 'user-id',
  SOURCE_NDA_ESIGN_KEY_ID: 'https://kv-abarva-lab-001.vault.azure.net/keys/source-nda-docusign-lab-jwt/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  SOURCE_NDA_ESIGN_TEST_INBOX: 'synthetic@example.test',
};

function build(env: Record<string, string>) {
  return spawnSync('bash', ['-c', `set -euo pipefail; source "$1"; build_source_nda_esign_env_args; printf '%s\\n' "\${source_nda_esign_env_args[@]}"`, 'bash', script], {
    cwd: root,
    env: { NODE_ENV: 'test', PATH: process.env.PATH ?? '', ...env },
    encoding: 'utf8',
  });
}

describe('Source NDA ACA configuration', () => {
  it('keeps the shared runtime off by default and rejects partial or non-demo setup', () => {
    const disabled = build({});
    expect(disabled.status).toBe(0);
    expect(disabled.stdout.trim()).toBe('SOURCE_NDA_ESIGN_PROVIDER=disabled');
    expect(build({ ...values, SOURCE_NDA_ESIGN_TEST_INBOX: '' }).status).not.toBe(0);
    expect(build({ ...values, SOURCE_NDA_ESIGN_ENVIRONMENT: 'production' }).status).not.toBe(0);
    expect(build({ ...values, SOURCE_NDA_ESIGN_KEY_ID: 'https://example.test/key' }).status).not.toBe(0);
  });

  it('passes all seven validated values only for a complete demo configuration', () => {
    const result = build(values);
    expect(result.status).toBe(0);
    expect(result.stdout.trim().split('\n').sort()).toEqual(
      Object.entries(values).map(([name, value]) => `${name}=${value}`).sort(),
    );
  });

  it('wires each environment variable into the main deploy and emits a narrow update audit', () => {
    const steps = workflow.jobs.deploy.steps;
    const preflight = steps.find((step) => step.name === 'Validate Source NDA demo configuration');
    const deploy = steps.find((step) => step.name === 'Deploy new revision');
    for (const name of Object.keys(values)) {
      expect(preflight?.env?.[name]).toContain(`vars.${name}`);
      expect(deploy?.env?.[name]).toContain(`vars.${name}`);
    }
    expect(preflight?.run).toContain('build_source_nda_esign_env_args');
    expect(deploy?.run).toContain('build_source_nda_esign_env_args');
    expect(deploy?.run).toContain('"${source_nda_esign_env_args[@]}"');
    expect(deploy?.run).toContain('--query');
    expect(deploy?.run).toContain('latestRevisionName');
    expect(deploy?.run).toContain('Existing canonical revision has different Source NDA configuration');
  });

  it('redacts Source NDA settings before public audit upload, including failed deploys', () => {
    const steps = workflow.jobs.deploy.steps as Array<{ name: string; run?: string; if?: string }>;
    const redact = steps.find((step) => step.name === 'Redact Source NDA configuration from deployment evidence');
    const upload = steps.find((step) => step.name === 'Upload deployment evidence');
    expect(redact?.if).toBe('always()');
    expect(upload?.if).toContain("steps.redact_source_nda_evidence.outcome == 'success'");
    const jqFilter = redact?.run?.match(/jq '([^']+)'/)?.[1];
    expect(jqFilter).toBeDefined();
    const sample = JSON.stringify({ env: [
      { name: 'SOURCE_NDA_ESIGN_TEST_INBOX', value: 'synthetic@example.test' },
      { name: 'SOURCE_NDA_ESIGN_INTEGRATION_KEY', value: 'integration-id' },
      { name: 'SAFE', value: 'keep' },
    ] });
    const result = spawnSync('jq', [jqFilter!], { input: sample, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ env: [
      { name: 'SOURCE_NDA_ESIGN_TEST_INBOX', value: '[redacted]' },
      { name: 'SOURCE_NDA_ESIGN_INTEGRATION_KEY', value: '[redacted]' },
      { name: 'SAFE', value: 'keep' },
    ] });
  });
});
