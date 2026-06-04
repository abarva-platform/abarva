import fs from 'node:fs';
import path from 'node:path';

import { listDemoDatasets } from '../../src/lib/demo/demo-dataset-registry';

const REQUIRED_TENANTS = ['apex-retail', 'meridian-health', 'first-capital'];
const REQUIRED_SURFACES = [
  'programs',
  'source',
  'intelligence',
  'control_tower',
  'admin',
];

interface Finding {
  tenant: string;
  check: string;
  status: 'pass' | 'fail';
  detail: string;
}

const findings: Finding[] = [];

function record(
  tenant: string,
  check: string,
  status: Finding['status'],
  detail: string,
): void {
  findings.push({ tenant, check, status, detail });
}

function existsFromRoot(candidate: string | null): boolean {
  if (!candidate) return false;
  return fs.existsSync(path.join(process.cwd(), candidate));
}

for (const tenantSlug of REQUIRED_TENANTS) {
  const tenant = listDemoDatasets().find((entry) => entry.tenantSlug === tenantSlug);
  if (!tenant) {
    record(tenantSlug, 'registry', 'fail', 'Missing from demo dataset registry.');
    continue;
  }

  record(
    tenant.tenantSlug,
    'rehearsal eligibility',
    tenant.rehearsalEligible ? 'pass' : 'fail',
    tenant.rehearsalEligible
      ? 'Tenant is approved for synthetic demo rehearsal.'
      : 'Tenant is not approved for synthetic demo rehearsal.',
  );

  record(
    tenant.tenantSlug,
    'dataset root',
    existsFromRoot(tenant.datasetRoot) ? 'pass' : 'fail',
    tenant.datasetRoot ?? 'No dataset root configured.',
  );

  const manifestYaml = tenant.datasetRoot
    ? path.join(tenant.datasetRoot, 'manifest.yaml')
    : null;
  const manifestJson = tenant.datasetRoot
    ? path.join(tenant.datasetRoot, 'manifest.json')
    : null;
  record(
    tenant.tenantSlug,
    'dataset manifest',
    existsFromRoot(manifestYaml) || existsFromRoot(manifestJson) ? 'pass' : 'fail',
    manifestYaml ?? 'No manifest path available.',
  );

  record(
    tenant.tenantSlug,
    'loader key',
    tenant.loaderTenantKey ? 'pass' : 'fail',
    tenant.loaderTenantKey ?? 'No loader key configured.',
  );

  record(
    tenant.tenantSlug,
    'nightly reset command',
    tenant.nightlyResetCommand?.includes('load-tenant-substrate.ts')
      ? 'pass'
      : 'fail',
    tenant.nightlyResetCommand ?? 'No reset command configured.',
  );

  for (const surface of REQUIRED_SURFACES) {
    const surfaceData = tenant.surfaces.find((entry) => entry.surface === surface);
    if (!surfaceData) {
      record(tenant.tenantSlug, `surface ${surface}`, 'fail', 'Missing surface.');
      continue;
    }

    const hasSeedProof =
      surfaceData.seedFile === null ||
      existsFromRoot(surfaceData.seedFile) ||
      surfaceData.tier === 'deterministic_only';

    record(
      tenant.tenantSlug,
      `surface ${surface}`,
      hasSeedProof ? 'pass' : 'fail',
      surfaceData.seedFile ?? surfaceData.caveat,
    );
  }
}

const failures = findings.filter((finding) => finding.status === 'fail');
const output = {
  generatedAt: new Date().toISOString(),
  posture: failures.length === 0 ? 'ready-for-synthetic-rehearsal' : 'blocked',
  requiredTenants: REQUIRED_TENANTS,
  note:
    'This verifies committed synthetic demo readiness only. It does not prove demo.abarva.com DNS, Vercel deployment, Clerk users, or live nightly scheduler execution.',
  findings,
};

console.log(JSON.stringify(output, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
