import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { appClientKeyForTenant } from '@/lib/tenant/aliases';
import type { ClientKey } from '@/lib/client-config';

export interface CanonicalV4Dimension {
  order: number;
  family: string;
  dimension: string;
  file: string;
  templateId: string;
  label: string;
}

export interface CanonicalV4Manifest {
  appClientKey: ClientKey;
  tenantKey: string;
  datasetDir: string;
  sourcePath: string;
  dimensions: CanonicalV4Dimension[];
}

const V4_DATASET_BY_CLIENT: Record<ClientKey, { tenantKey: string; datasetDir: string }> = {
  apexretail: { tenantKey: 'apexretail', datasetDir: 'apex-retail-synthetic-v4' },
  arcturus: { tenantKey: 'firstcapital', datasetDir: 'first-capital-financial-synthetic-v4' },
  firstcapital: { tenantKey: 'firstcapital', datasetDir: 'first-capital-financial-synthetic-v4' },
  meridian: { tenantKey: 'meridian', datasetDir: 'meridian-health-synthetic-v4' },
  skyharbor: { tenantKey: 'skyharbor', datasetDir: 'skyharbor-air-synthetic-v4' },
  lakeshore: { tenantKey: 'lakeshore', datasetDir: 'lakeshore-industries-synthetic-v4' },
  northstar: { tenantKey: 'northstar', datasetDir: 'northstar-clinical-tech-synthetic-v1' },
};

export function resolveV4AppClientKey(value: string | null | undefined): ClientKey {
  return appClientKeyForTenant(value) ?? 'apexretail';
}

export function getCanonicalV4Manifest(value: string | null | undefined): CanonicalV4Manifest | null {
  const appClientKey = resolveV4AppClientKey(value);
  const dataset = V4_DATASET_BY_CLIENT[appClientKey];
  const sourcePath = path.join(process.cwd(), 'datasets', dataset.datasetDir, 'manifest.yaml');
  if (!existsSync(sourcePath)) return null;
  const manifestText = readFileSync(sourcePath, 'utf8');
  const dimensions = parseLoadOrder(manifestText);
  return {
    appClientKey,
    tenantKey: dataset.tenantKey,
    datasetDir: dataset.datasetDir,
    sourcePath,
    dimensions,
  };
}

function parseLoadOrder(manifestText: string): CanonicalV4Dimension[] {
  const loadOrder = manifestText.match(/\nload_order:\n([\s\S]*?)\nsummary:\n/);
  if (!loadOrder) return [];
  const blocks = loadOrder[1].split(/\n\s*-\s+order:\s+/).filter((block) => block.trim());
  return blocks
    .map((block) => {
      const normalized = block.startsWith('order:') ? block.replace(/^order:\s*/, '') : block;
      const order = Number(normalized.match(/^(\d+)/)?.[1] ?? 0);
      const family = readYamlScalar(normalized, 'family');
      const dimension = readYamlScalar(normalized, 'dimension');
      const file = readYamlScalar(normalized, 'file');
      const templateId = readYamlScalar(normalized, 'template_id');
      if (!order || !family || !dimension || !file) return null;
      return {
        order,
        family,
        dimension,
        file,
        templateId,
        label: labelize(dimension),
      };
    })
    .filter((dimension): dimension is CanonicalV4Dimension => Boolean(dimension))
    .sort((a, b) => a.order - b.order);
}

function readYamlScalar(block: string, key: string): string {
  return block.match(new RegExp(`\\n\\s+${key}:\\s+([^\\n]+)`))?.[1]?.trim() ?? '';
}

function labelize(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
