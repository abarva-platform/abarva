#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import https from 'node:https';

const STRICT = process.argv.includes('--strict');
const NO_HEALTH = process.argv.includes('--no-health');
const HEALTH_TIMEOUT_MS = Number(argValue('--health-timeout-ms', '15000'));
const MAX_IMAGE_AGE_DAYS = Number(argValue('--max-image-age-days', '14'));

const ENVIRONMENTS = [
  {
    key: 'product-dev',
    displayName: 'Product Dev',
    subscriptionId: 'fbea9ee2-ccdd-49fc-808b-22897f2db56b',
    subscriptionName: 'sub-abarva-product-dev-eus-001',
    webApp: {
      resourceGroup: 'rg-abarva-product-development-controlplane-eus2-001',
      name: 'ca-abarva-pdev-web-eus2-001',
    },
  },
  {
    key: 'product-preview',
    displayName: 'Product Preview',
    subscriptionId: '0cd743d3-ea51-43e3-97e2-723b9f34fb21',
    subscriptionName: 'sub-abarva-product-preview-eus-001',
    webApp: {
      resourceGroup: 'rg-abarva-product-preview-controlplane-eus2-001',
      name: 'ca-abarva-pprev-web-eus2-001',
    },
  },
  {
    key: 'product-prod',
    displayName: 'Product Prod',
    subscriptionId: '1c67651b-4c57-49e8-9934-7dd660cdbd3b',
    subscriptionName: 'sub-abarva-product-prod-eus-001',
    webApp: {
      resourceGroup: 'rg-abarva-product-prod-controlplane-eastus2',
      name: 'ca-abarva-pprod-web-eus2-001',
    },
  },
];

const REQUIRED_TYPES = [
  'Microsoft.App/containerApps',
  'Microsoft.App/managedEnvironments',
  'Microsoft.ContainerRegistry/registries',
  'Microsoft.DBforPostgreSQL/flexibleServers',
  'Microsoft.KeyVault/vaults',
  'Microsoft.Storage/storageAccounts',
  'Microsoft.Search/searchServices',
  'Microsoft.OperationalInsights/workspaces',
];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function az(args) {
  const output = execFileSync('az', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 20,
  }).trim();
  return output ? JSON.parse(output) : null;
}

function tryAz(args) {
  try {
    return { ok: true, value: az(args) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function record(name, status, detail, evidence = undefined) {
  return { name, status, detail, ...(evidence === undefined ? {} : { evidence }) };
}

function pass(name, detail, evidence) {
  return record(name, 'pass', detail, evidence);
}

function attention(name, detail, evidence) {
  return record(name, 'attention', detail, evidence);
}

function fail(name, detail, evidence) {
  return record(name, 'fail', detail, evidence);
}

function parseImageTimestamp(image) {
  const match = String(image ?? '').match(/(20\d{6})T(\d{6})Z/);
  if (!match) return null;
  const [, datePart, timePart] = match;
  const iso = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}T${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ageDaysFromTimestamp(timestamp) {
  if (!timestamp) return null;
  return Math.floor((Date.now() - timestamp.getTime()) / (24 * 60 * 60 * 1000));
}

function imageAgeDays(image) {
  return ageDaysFromTimestamp(parseImageTimestamp(image));
}

function parseAcrDigestImage(image) {
  const match = String(image ?? '').match(/^(?<registry>[a-z0-9]+)\.azurecr\.io\/(?<repository>.+)@(?<digest>sha256:[a-f0-9]{64})$/i);
  return match?.groups ?? null;
}

function acrManifestMetadata(subscriptionId, image) {
  const parsed = parseAcrDigestImage(image);
  if (!parsed) return null;
  const result = tryAz([
    'acr',
    'manifest',
    'show-metadata',
    '--subscription',
    subscriptionId,
    '--registry',
    parsed.registry,
    '--name',
    `${parsed.repository}@${parsed.digest}`,
    '--query',
    '{digest:digest,createdTime:createdTime,lastUpdateTime:lastUpdateTime,tags:tags}',
    '-o',
    'json',
  ]);
  return result.ok ? { ok: true, value: result.value } : { ok: false, error: result.error };
}

function manifestAgeDays(metadata) {
  const timestamp = metadata?.createdTime ?? metadata?.lastUpdateTime;
  if (!timestamp) return null;
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : ageDaysFromTimestamp(parsed);
}

function requestJson(url) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const req = https.get(url, { timeout: HEALTH_TIMEOUT_MS }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
        if (body.length > 10000) req.destroy(new Error('response body exceeded audit limit'));
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch {
          parsed = null;
        }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          body: parsed ?? body.slice(0, 1000),
        });
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`timeout after ${HEALTH_TIMEOUT_MS}ms`));
    });
    req.on('error', (error) => {
      resolve({
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });
}

function summarize(checks) {
  return checks.reduce(
    (summary, check) => {
      summary[check.status] = (summary[check.status] ?? 0) + 1;
      return summary;
    },
    { pass: 0, attention: 0, fail: 0 },
  );
}

function typeCounts(resources) {
  const counts = {};
  for (const resource of resources ?? []) {
    counts[resource.type] = (counts[resource.type] ?? 0) + 1;
  }
  return counts;
}

async function auditEnvironment(environment) {
  const checks = [];

  const subscription = tryAz([
    'account',
    'show',
    '--subscription',
    environment.subscriptionId,
    '--query',
    '{id:id,name:name,state:state,user:user.name,tenantId:tenantId}',
    '-o',
    'json',
  ]);
  if (!subscription.ok) {
    checks.push(fail('subscription.visible', 'Subscription could not be read.', subscription));
    return { ...environment, status: 'unknown', checks, summary: summarize(checks) };
  }

  checks.push(
    subscription.value?.state === 'Enabled'
      ? pass('subscription.enabled', 'Subscription is enabled.', subscription.value)
      : fail('subscription.enabled', 'Subscription is not enabled.', subscription.value),
  );
  checks.push(
    subscription.value?.user === 'admin@abarva.ai'
      ? pass('subscription.adminBoundary', 'Subscription is visible under admin@abarva.ai.', { user: subscription.value.user })
      : attention('subscription.adminBoundary', 'Subscription is not reported under admin@abarva.ai in the active Azure account cache.', { user: subscription.value?.user }),
  );

  const resources = tryAz([
    'resource',
    'list',
    '--subscription',
    environment.subscriptionId,
    '--query',
    '[].{name:name,type:type,resourceGroup:resourceGroup,location:location,tags:tags}',
    '-o',
    'json',
  ]);
  if (!resources.ok) {
    checks.push(fail('resources.list', 'Resources could not be listed.', resources));
  } else {
    const counts = typeCounts(resources.value);
    for (const type of REQUIRED_TYPES) {
      checks.push(
        counts[type] > 0
          ? pass(`resources.${type}`, `Found ${counts[type]} resource(s).`, { count: counts[type] })
          : fail(`resources.${type}`, `Required resource type is missing: ${type}.`, counts),
      );
    }
  }

  const app = tryAz([
    'containerapp',
    'show',
    '--subscription',
    environment.subscriptionId,
    '-g',
    environment.webApp.resourceGroup,
    '-n',
    environment.webApp.name,
    '--query',
    '{name:name,provisioningState:properties.provisioningState,latestRevisionName:properties.latestRevisionName,latestReadyRevisionName:properties.latestReadyRevisionName,activeRevisionsMode:properties.configuration.activeRevisionsMode,external:properties.configuration.ingress.external,fqdn:properties.configuration.ingress.fqdn,targetPort:properties.configuration.ingress.targetPort,templateImage:properties.template.containers[0].image,traffic:properties.configuration.ingress.traffic}',
    '-o',
    'json',
  ]);
  if (!app.ok) {
    checks.push(fail('webApp.read', 'Product web Container App could not be read.', app));
  } else {
    const value = app.value ?? {};
    checks.push(
      value.provisioningState === 'Succeeded'
        ? pass('webApp.provisioned', 'Product web Container App is provisioned.', { provisioningState: value.provisioningState })
        : fail('webApp.provisioned', 'Product web Container App is not provisioned successfully.', { provisioningState: value.provisioningState }),
    );
    checks.push(
      value.latestReadyRevisionName && value.latestReadyRevisionName === value.latestRevisionName
        ? pass('webApp.latestReady', 'Latest revision is ready.', {
          latestRevisionName: value.latestRevisionName,
          latestReadyRevisionName: value.latestReadyRevisionName,
        })
        : fail('webApp.latestReady', 'Latest revision is not the ready revision.', {
          latestRevisionName: value.latestRevisionName,
          latestReadyRevisionName: value.latestReadyRevisionName,
        }),
    );
    const traffic = Array.isArray(value.traffic) ? value.traffic : [];
    const hasHundred = traffic.some((entry) => Number(entry.weight) === 100);
    checks.push(
      hasHundred
        ? pass('webApp.traffic100', 'Container App has a 100% traffic target.', traffic)
        : fail('webApp.traffic100', 'Container App does not show a 100% traffic target.', traffic),
    );
    checks.push(
      value.external === true && value.fqdn
        ? pass('webApp.externalFqdn', 'Container App exposes an external FQDN.', { fqdn: value.fqdn })
        : fail('webApp.externalFqdn', 'Container App does not expose an external FQDN.', { external: value.external, fqdn: value.fqdn }),
    );

    if (String(value.templateImage ?? '').includes('@sha256:')) {
      checks.push(pass('webApp.imageDigestPinned', 'Container App is using a digest-pinned image.', { image: value.templateImage }));
    } else {
      checks.push(attention('webApp.imageDigestPinned', 'Container App is using a tag rather than a digest-pinned image.', { image: value.templateImage }));
    }

    const tagAgeDays = imageAgeDays(value.templateImage);
    const manifestMetadata = tagAgeDays === null ? acrManifestMetadata(environment.subscriptionId, value.templateImage) : null;
    const manifestDays = manifestMetadata?.ok ? manifestAgeDays(manifestMetadata.value) : null;
    const ageDays = tagAgeDays ?? manifestDays;
    const freshnessEvidence = manifestMetadata?.ok
      ? { image: value.templateImage, ageDays, source: 'acrManifest', manifest: manifestMetadata.value }
      : { image: value.templateImage, ageDays };

    if (ageDays === null && manifestMetadata?.ok === false) {
      checks.push(attention('webApp.imageFreshness', 'Image freshness could not be resolved from tag or ACR manifest metadata; freshness must be approved manually.', {
        image: value.templateImage,
        manifestError: manifestMetadata.error,
      }));
    } else if (ageDays === null) {
      checks.push(attention('webApp.imageFreshness', 'Image timestamp could not be parsed; freshness must be approved manually.', { image: value.templateImage }));
    } else if (ageDays <= MAX_IMAGE_AGE_DAYS) {
      checks.push(pass('webApp.imageFreshness', `Image timestamp is ${ageDays} day(s) old.`, freshnessEvidence));
    } else {
      checks.push(attention('webApp.imageFreshness', `Image timestamp is ${ageDays} day(s) old; refresh or approve stale baseline before promotion.`, freshnessEvidence));
    }

    if (NO_HEALTH) {
      checks.push(attention('health.api', 'Health check skipped because --no-health was provided.'));
    } else if (value.fqdn) {
      const health = await requestJson(`https://${value.fqdn}/api/health`);
      const body = health.body && typeof health.body === 'object' ? health.body : {};
      const healthOk = health.ok === true && body.ok === true;
      checks.push(
        healthOk
          ? pass('health.api', '/api/health returned ok=true.', health)
          : fail('health.api', '/api/health did not return ok=true.', health),
      );
      checks.push(
        body.checks?.postgres === true
          ? pass('health.postgres', 'Health reports postgres=true.', body.checks)
          : fail('health.postgres', 'Health does not report postgres=true.', body.checks ?? body),
      );
      checks.push(
        body.checks?.direct_postgres === true
          ? pass('health.directPostgres', 'Health reports direct_postgres=true.', body.checks)
          : fail('health.directPostgres', 'Health does not report direct_postgres=true.', body.checks ?? body),
      );
    }
  }

  const summary = summarize(checks);
  const releaseOperational = summary.fail === 0 && summary.attention === 0;
  const status = releaseOperational
    ? 'release_operational'
    : summary.fail > 0
      ? 'provisioned_not_operational'
      : 'provisioned_needs_approval';

  return { ...environment, status, summary, checks };
}

const results = [];
for (const environment of ENVIRONMENTS) {
  results.push(await auditEnvironment(environment));
}

const summary = results.reduce(
  (acc, environment) => {
    acc.environments += 1;
    acc[environment.status] = (acc[environment.status] ?? 0) + 1;
    acc.pass += environment.summary.pass;
    acc.attention += environment.summary.attention;
    acc.fail += environment.summary.fail;
    return acc;
  },
  {
    environments: 0,
    release_operational: 0,
    provisioned_not_operational: 0,
    provisioned_needs_approval: 0,
    unknown: 0,
    pass: 0,
    attention: 0,
    fail: 0,
  },
);

const status = summary.release_operational === ENVIRONMENTS.length ? 'release_operational' : 'not_release_operational';

console.log(JSON.stringify({
  audit: 'product-release-operational-readiness',
  status,
  strict: STRICT,
  noHealth: NO_HEALTH,
  generatedAt: new Date().toISOString(),
  thresholds: {
    maxImageAgeDays: MAX_IMAGE_AGE_DAYS,
    healthTimeoutMs: HEALTH_TIMEOUT_MS,
  },
  summary,
  environments: results,
}, null, 2));

if (STRICT && status !== 'release_operational') {
  process.exit(1);
}
