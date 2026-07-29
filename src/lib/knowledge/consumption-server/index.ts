/**
 * Consumption server — barrel. The governed read layer behind
 * /api/knowledge/consumption/*. Routes import getConsumptionReader() and never
 * touch pg or the data plane directly.
 */

import {
  createTenantScopedConsumptionQuery,
  pgConsumptionQuery,
  type ConsumptionQuery,
} from "./db";
import { ConsumptionReader } from "./reader";

export { ConsumptionReader } from "./reader";
export type { ConsumptionQuery } from "./db";

let singleton: ConsumptionReader | null = null;
const tenantSingletons = new Map<string, ConsumptionReader>();

/** Production reader (pg-backed). Injectable variant is `new ConsumptionReader(q)`. */
export function getConsumptionReader(
  query: ConsumptionQuery = pgConsumptionQuery,
): ConsumptionReader {
  if (query === pgConsumptionQuery) {
    if (!singleton) singleton = new ConsumptionReader(pgConsumptionQuery);
    return singleton;
  }
  return new ConsumptionReader(query);
}

/**
 * Production reader for governed foundation tenants. This intentionally refuses
 * the shared DATABASE_URL fallback so a private tenant cannot silently read the
 * control-plane database and look "empty".
 */
export function getTenantScopedConsumptionReader(
  tenantKey: string,
): ConsumptionReader {
  const existing = tenantSingletons.get(tenantKey);
  if (existing) return existing;
  const reader = new ConsumptionReader(
    createTenantScopedConsumptionQuery(tenantKey),
  );
  tenantSingletons.set(tenantKey, reader);
  return reader;
}
