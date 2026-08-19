import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { HomeReviewBundle } from "./types";

/**
 * The two tenants accepted for the Home-preview acceptance review. Deliberately a short,
 * hand-maintained list, not a directory scan -- these are the specific, reviewed golden snapshots
 * this route exists to show, not "whatever JSON happens to be in the folder."
 */
export const HOME_PREVIEW_TENANT_KEYS = ["meridian-health", "skyharbor-air"] as const;
export type HomePreviewTenantKey = (typeof HOME_PREVIEW_TENANT_KEYS)[number];

export function isHomePreviewTenantKey(key: string): key is HomePreviewTenantKey {
  return (HOME_PREVIEW_TENANT_KEYS as readonly string[]).includes(key);
}

const SNAPSHOT_DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");

const cache = new Map<HomePreviewTenantKey, HomeReviewBundle>();

/**
 * Loads a tenant's golden snapshot -- the accepted `:plan` output this preview reviews against.
 * Read from a checked-in JSON file, never the database and never a live model call: this route's
 * whole point is to review already-generated, already-verified content, not to generate more of
 * it. Regenerating the snapshot is a deliberate, separate step
 * (`npm run data-build:home-chapters:plan`) followed by a manual copy into
 * `golden-snapshots/<tenantKey>.json` once a human has reviewed the new run -- not something this
 * route ever does on its own.
 */
export function getHomeReviewBundle(tenantKey: string): HomeReviewBundle | null {
  if (!isHomePreviewTenantKey(tenantKey)) return null;
  const cached = cache.get(tenantKey);
  if (cached) return cached;
  const filePath = path.join(SNAPSHOT_DIR, `${tenantKey}.json`);
  if (!fs.existsSync(filePath)) return null;
  const bundle = JSON.parse(fs.readFileSync(filePath, "utf8")) as HomeReviewBundle;
  cache.set(tenantKey, bundle);
  return bundle;
}
