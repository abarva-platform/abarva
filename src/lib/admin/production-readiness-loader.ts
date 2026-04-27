/**
 * production-readiness-loader.ts
 *
 * Server-only module for loading the production-readiness manifest from disk.
 * Uses Node.js `fs` — must never be imported by client components or the
 * client bundle.
 *
 * Imported by:
 *   - src/app/api/admin/production-readiness/route.ts
 *   - src/app/(maestro)/platform/admin/production-readiness/page.tsx
 *
 * All pure logic and types live in production-readiness.ts (client-safe).
 */
import 'server-only';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  buildProductionReadinessView,
  getProductionReadinessRefreshMetadata,
  type ProductionReadinessApiResponse,
  type ProductionReadinessManifest,
  type ProductionReadinessView,
} from './production-readiness';

const PRODUCTION_READINESS_MANIFEST_PATH = join(
  process.cwd(),
  'docs/build/production-readiness.json',
);

export function loadProductionReadinessManifest(): ProductionReadinessManifest {
  return JSON.parse(
    readFileSync(PRODUCTION_READINESS_MANIFEST_PATH, 'utf8'),
  ) as ProductionReadinessManifest;
}

/**
 * Convenience wrapper: loads manifest then builds view.
 * Equivalent to the old buildProductionReadinessView() with no arguments.
 */
export function buildProductionReadinessViewFromDisk(
  generatedAt?: string,
): ProductionReadinessView {
  const manifest = loadProductionReadinessManifest();
  return buildProductionReadinessView(manifest, generatedAt ?? manifest.lastUpdated);
}

export function buildProductionReadinessApiResponse(
  generatedAt: string,
): ProductionReadinessApiResponse {
  const manifest = loadProductionReadinessManifest();
  const view = buildProductionReadinessView(manifest, generatedAt);
  return {
    ...getProductionReadinessRefreshMetadata(generatedAt),
    ...view.freshness,
    manifest,
    view,
  };
}
