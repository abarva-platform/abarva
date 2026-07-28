/**
 * Consumption server — barrel. The governed read layer behind
 * /api/knowledge/consumption/*. Routes import getConsumptionReader() and never
 * touch pg or the data plane directly.
 */

import { pgConsumptionQuery, type ConsumptionQuery } from "./db";
import { ConsumptionReader } from "./reader";

export { ConsumptionReader } from "./reader";
export type { ConsumptionQuery } from "./db";

let singleton: ConsumptionReader | null = null;

/** Production reader (pg-backed). Injectable variant is `new ConsumptionReader(q)`. */
export function getConsumptionReader(query: ConsumptionQuery = pgConsumptionQuery): ConsumptionReader {
  if (query === pgConsumptionQuery) {
    if (!singleton) singleton = new ConsumptionReader(pgConsumptionQuery);
    return singleton;
  }
  return new ConsumptionReader(query);
}
