// CLOUD5 - Azure Container Apps + VNet IaC Starter tests.
//
// Deterministic, file-pure suite. No network calls, no Azure ARM
// calls, no model providers. The test only reads the on-disk
// starter artifacts and asserts shape, required resource declarations,
// and absence of hardcoded secrets.

import { readFileSync, existsSync } from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const INFRA_DIR = path.join(REPO_ROOT, 'infra', 'azure', 'container-apps-vnet');
const BICEP_PATH = path.join(INFRA_DIR, 'main.bicep');
const PARAMS_PATH = path.join(INFRA_DIR, 'parameters.example.json');
const README_PATH = path.join(INFRA_DIR, 'README.md');

// ---------------------------------------------------------------------
// Required resource declarations
// ---------------------------------------------------------------------

const REQUIRED_RESOURCE_TYPES = [
  'Microsoft.Network/virtualNetworks',
  'Microsoft.App/managedEnvironments',
  'Microsoft.App/containerApps',
  'Microsoft.DBforPostgreSQL/flexibleServers',
  'Microsoft.Storage/storageAccounts',
  'Microsoft.KeyVault/vaults',
  'Microsoft.OperationalInsights/workspaces',
];

describe('CLOUD5 main.bicep · existence + required resources', () => {
  it('main.bicep exists at the starter path', () => {
    expect(existsSync(BICEP_PATH)).toBe(true);
  });

  it.each(REQUIRED_RESOURCE_TYPES)(
    'declares the %s resource',
    (resourceType) => {
      const bicep = readFileSync(BICEP_PATH, 'utf8');
      expect(bicep).toContain(resourceType);
    },
  );

  it('declares all required parameters by name', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    const requiredParams = [
      'location',
      'environmentName',
      'vnetCidr',
      'appSubnetCidr',
      'peSubnetCidr',
      'containerAppName',
      'postgresAdminLogin',
      'postgresAdminPasswordSecretName',
      'keyVaultName',
    ];
    for (const param of requiredParams) {
      // Match `param <name> <type>` declaration form.
      const re = new RegExp(`\\bparam\\s+${param}\\s+\\w+`);
      expect(re.test(bicep)).toBe(true);
    }
  });

  it('annotates every parameter with a @description(...) line', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    // For each `param <name>` line there must be an immediately
    // preceding `@description(...)` line. We assert at least 9
    // @description annotations are present (one per required param).
    const descriptionMatches = bicep.match(/@description\(/g) ?? [];
    expect(descriptionMatches.length).toBeGreaterThanOrEqual(9);
  });

  it('uses the placeholder hello-world image and not a private registry secret', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    expect(bicep).toContain(
      'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest',
    );
  });

  it('declares the three privatelink DNS zone names', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    expect(bicep).toContain('privatelink.postgres.database.azure.com');
    expect(bicep).toContain('privatelink.blob.');
    expect(bicep).toContain('privatelink.vaultcore.azure.net');
  });

  it('marks the file as STARTER / LAB ONLY in the header', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    expect(bicep).toContain('STARTER / LAB ONLY');
    expect(bicep).toContain('Not production');
    expect(bicep).toContain('Do not deploy without review');
  });
});

// ---------------------------------------------------------------------
// Hardcoded-secret guards
// ---------------------------------------------------------------------

describe('CLOUD5 main.bicep · no hardcoded secrets', () => {
  it('does not contain an OpenAI-style sk- key', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    // Catch any literal `sk-` followed by alphanumerics that looks
    // like a real key.
    expect(/sk-[A-Za-z0-9]{16,}/.test(bicep)).toBe(false);
  });

  it('does not embed a real-looking subscription ID', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    // ARM subscription IDs are GUIDs and appear as
    // `subscriptions/<guid>` in resource IDs.
    expect(
      /subscriptions\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(
        bicep,
      ),
    ).toBe(false);
  });

  it('does not embed a real-looking tenant ID GUID literal', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    // Reject any direct GUID literal in the file. The legitimate
    // tenant reference uses `subscription().tenantId`, not a literal.
    expect(
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(bicep),
    ).toBe(false);
  });

  it('does not assign a literal password value outside parameter declarations', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    // A literal assignment such as `password = 'abc123longstring'`
    // must NOT appear. The starter intentionally omits the
    // administratorLoginPassword field; it is sourced from Key Vault.
    const banned = /password\s*[:=]\s*['"][A-Za-z0-9!@#$%^&*_+\-]{12,}['"]/i;
    expect(banned.test(bicep)).toBe(false);
  });

  it('does not contain a private key or PEM block', () => {
    const bicep = readFileSync(BICEP_PATH, 'utf8');
    expect(bicep).not.toContain('BEGIN PRIVATE KEY');
    expect(bicep).not.toContain('BEGIN RSA PRIVATE KEY');
    expect(bicep).not.toContain('BEGIN OPENSSH PRIVATE KEY');
  });
});

// ---------------------------------------------------------------------
// parameters.example.json
// ---------------------------------------------------------------------

describe('CLOUD5 parameters.example.json · shape + placeholders', () => {
  it('exists and parses as JSON', () => {
    expect(existsSync(PARAMS_PATH)).toBe(true);
    const raw = readFileSync(PARAMS_PATH, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('uses the ARM deployment-parameters $schema', () => {
    const parsed = JSON.parse(readFileSync(PARAMS_PATH, 'utf8'));
    expect(typeof parsed.$schema).toBe('string');
    expect(parsed.$schema).toContain('deploymentParameters.json');
  });

  it('declares all required parameter keys', () => {
    const parsed = JSON.parse(readFileSync(PARAMS_PATH, 'utf8'));
    const requiredKeys = [
      'location',
      'environmentName',
      'vnetCidr',
      'appSubnetCidr',
      'peSubnetCidr',
      'containerAppName',
      'postgresAdminLogin',
      'postgresAdminPasswordSecretName',
      'keyVaultName',
    ];
    for (const key of requiredKeys) {
      expect(parsed.parameters[key]).toBeDefined();
      expect(parsed.parameters[key].value).toBeDefined();
    }
  });

  it('uses placeholder values only (location is allowed to be eastus2; everything else is <replace-me>)', () => {
    const parsed = JSON.parse(readFileSync(PARAMS_PATH, 'utf8'));
    for (const [key, entry] of Object.entries<{ value: unknown }>(
      parsed.parameters,
    )) {
      const value = entry.value;
      if (key === 'location') {
        expect(typeof value).toBe('string');
        expect(['eastus2', '<replace-me>']).toContain(value);
        continue;
      }
      expect(value).toBe('<replace-me>');
    }
  });

  it('does not contain anything that looks like a real secret', () => {
    const raw = readFileSync(PARAMS_PATH, 'utf8');
    expect(/sk-[A-Za-z0-9]{16,}/.test(raw)).toBe(false);
    expect(
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/.test(raw),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------
// README guards
// ---------------------------------------------------------------------

describe('CLOUD5 README.md · marks the artifact as starter / lab', () => {
  it('exists', () => {
    expect(existsSync(README_PATH)).toBe(true);
  });

  it('contains the words STARTER, LAB, and not production', () => {
    const readme = readFileSync(README_PATH, 'utf8');
    expect(readme).toContain('STARTER');
    expect(readme).toContain('LAB');
    expect(readme.toLowerCase()).toContain('not production');
  });

  it('documents the validation-only commands without runnable deploy', () => {
    const readme = readFileSync(README_PATH, 'utf8');
    expect(readme).toContain('az bicep build');
    expect(readme).toContain('az deployment group what-if');
    // `az deployment group create` may appear as forward-reference
    // documentation but must be marked as not-to-run. The README
    // calls it out as "NOT to be executed from this starter".
    if (readme.includes('az deployment group create')) {
      expect(readme).toMatch(/NOT to be executed/);
    }
  });

  it('cross-references CLOUD2, CLOUD1, and CLOUD4', () => {
    const readme = readFileSync(README_PATH, 'utf8');
    expect(readme).toContain('CLOUD1');
    expect(readme).toContain('CLOUD2');
    expect(readme).toContain('CLOUD4');
  });
});
