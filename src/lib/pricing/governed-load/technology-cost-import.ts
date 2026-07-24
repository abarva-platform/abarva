/**
 * Nexus Pricing Engine — PR3 governed-load client technology-cost-default
 * import (optional per the brief — `client_technology_costs.template.csv`).
 *
 * `pricing_technology_cost_defaults` versions a whole set of `cost_key` rows
 * together per tenant scope (`uq_pricing_technology_cost_defaults_version`
 * is `(COALESCE(tenant_key,'__global__'), version, cost_key)` — every
 * current row for a tenant shares one `version` number), so this mirrors
 * `client-profile-repository.ts`'s whole-set idempotency pattern rather than
 * the rate-card pipeline's per-line one.
 */
import { randomUUID } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { computeContentHash, decideVersionAction } from "../versioning";
import { parseClientTechnologyCostsCsv } from "./csv-parse";
import { validateTechnologyCostRowsWithinUpload } from "./semantic-validation";
import type { ClientTechnologyCostCsvRow, RowError } from "./types";

export interface CurrentTechnologyCostRow {
  cost_key: string;
  cost_value: number;
  unit: string;
}

export async function listCurrentTechnologyCosts(
  tenantKey: string | null,
): Promise<CurrentTechnologyCostRow[]> {
  return azureRead.select<CurrentTechnologyCostRow>({
    table: "pricing_technology_cost_defaults",
    where: {
      tenant_key: tenantKey === null ? { op: "is", value: null } : tenantKey,
      is_current: true,
    },
    missingTable: "empty",
  });
}

export interface NewTechnologyCostInput {
  costKey: string;
  costValue: number;
  unit: string;
}

export interface TechnologyCostDiff {
  added: NewTechnologyCostInput[];
  changed: { before: NewTechnologyCostInput; after: NewTechnologyCostInput }[];
  unchanged: NewTechnologyCostInput[];
}

export function computeTechnologyCostDiff(
  currentRows: readonly CurrentTechnologyCostRow[],
  incoming: readonly NewTechnologyCostInput[],
): TechnologyCostDiff {
  const currentByKey = new Map(currentRows.map((r) => [r.cost_key, r]));
  const added: NewTechnologyCostInput[] = [];
  const changed: { before: NewTechnologyCostInput; after: NewTechnologyCostInput }[] = [];
  const unchanged: NewTechnologyCostInput[] = [];

  for (const row of incoming) {
    const before = currentByKey.get(row.costKey);
    if (!before) {
      added.push(row);
    } else if (before.cost_value !== row.costValue || before.unit !== row.unit) {
      changed.push({
        before: { costKey: before.cost_key, costValue: before.cost_value, unit: before.unit },
        after: row,
      });
    } else {
      unchanged.push(row);
    }
  }
  return { added, changed, unchanged };
}

export interface TechnologyCostImportPreview {
  tenantKey: string;
  parseErrors: RowError[];
  validationErrors: RowError[];
  diff: TechnologyCostDiff;
  valuesToCommit: NewTechnologyCostInput[];
}

function toNewTechnologyCostInput(row: ClientTechnologyCostCsvRow): NewTechnologyCostInput {
  return { costKey: row.costKey, costValue: row.costValue, unit: row.unit };
}

export async function previewClientTechnologyCostImport(input: {
  tenantKey: string;
  csvText: string;
}): Promise<TechnologyCostImportPreview> {
  const parsed = parseClientTechnologyCostsCsv(input.csvText);
  const validated = validateTechnologyCostRowsWithinUpload(parsed.rows);
  const currentRows = await listCurrentTechnologyCosts(input.tenantKey);
  const valuesToCommit = validated.validRows.map(toNewTechnologyCostInput);
  const diff = computeTechnologyCostDiff(currentRows, valuesToCommit);
  return {
    tenantKey: input.tenantKey,
    parseErrors: parsed.errors,
    validationErrors: validated.errors,
    diff,
    valuesToCommit,
  };
}

export type CreateTechnologyCostVersionResult =
  | { action: "noop"; version: number }
  | { action: "new_version"; version: number; previousVersion: number | null };

export interface TechnologyCostStorePort {
  getCurrentVersion(
    tenantKey: string,
  ): Promise<{ version: number; contentHash: string } | null>;
  insertNewVersion(input: {
    tenantKey: string;
    version: number;
    values: readonly (NewTechnologyCostInput & { contentHash: string })[];
  }): Promise<void>;
}

function defaultTechnologyCostStore(
  session: TxSessionRunner = createTxSession("abarva-pricing-write"),
): TechnologyCostStorePort {
  return {
    async getCurrentVersion(tenantKey) {
      // All current rows for one tenant scope share the same `version`
      // number per the unique-index shape, so one query carrying `version`
      // covers both "does a current set exist" and "what version is it".
      const rows = await azureRead.select<CurrentTechnologyCostRow & { version: number }>({
        table: "pricing_technology_cost_defaults",
        where: { tenant_key: tenantKey, is_current: true },
        missingTable: "empty",
      });
      if (rows.length === 0) return null;
      const sorted = [...rows]
        .map((r) => ({ cost_key: r.cost_key, cost_value: r.cost_value, unit: r.unit }))
        .sort((a, b) => (a.cost_key < b.cost_key ? -1 : a.cost_key > b.cost_key ? 1 : 0));
      return { version: rows[0].version, contentHash: computeContentHash(sorted) };
    },
    async insertNewVersion(input) {
      await session(async (run) => {
        await run(
          `UPDATE pricing_technology_cost_defaults SET is_current = false WHERE tenant_key = $1 AND is_current = true`,
          [input.tenantKey],
        );
        for (const value of input.values) {
          await run(
            `INSERT INTO pricing_technology_cost_defaults
               (id, tenant_key, version, is_current, content_hash, cost_key, cost_value, unit, status)
             VALUES ($1, $2, $3, true, $4, $5, $6, $7, 'active')`,
            [
              randomUUID(),
              input.tenantKey,
              input.version,
              value.contentHash,
              value.costKey,
              value.costValue,
              value.unit,
            ],
          );
        }
      });
    },
  };
}

/**
 * Snake_case hash shape, matching the physical `pricing_technology_cost_defaults`
 * columns. Used for BOTH the write-time hash (here) and the read-time
 * recomputation (`defaultTechnologyCostStore.getCurrentVersion` above) —
 * this table has no dedicated "whole version" row to store one canonical
 * content_hash in (unlike `pricing_rate_cards`/`pricing_client_profiles`),
 * so the hash is always re-derived from the individual rows. Hashing two
 * different key-casings of the same data (camelCase in-memory input vs.
 * snake_case DB rows) would silently produce two different hashes for
 * identical content and break the no-op idempotency check — every caller
 * MUST route through this one function rather than hashing either shape
 * directly.
 */
function toHashRow(input: NewTechnologyCostInput): { cost_key: string; cost_value: number; unit: string } {
  return { cost_key: input.costKey, cost_value: input.costValue, unit: input.unit };
}

export async function commitClientTechnologyCostImport(
  input: { tenantKey: string; values: readonly NewTechnologyCostInput[] },
  store: TechnologyCostStorePort = defaultTechnologyCostStore(),
): Promise<CreateTechnologyCostVersionResult> {
  const sorted = [...input.values].sort((a, b) => (a.costKey < b.costKey ? -1 : a.costKey > b.costKey ? 1 : 0));
  const contentHash = computeContentHash(sorted.map(toHashRow));
  const current = await store.getCurrentVersion(input.tenantKey);
  const decision = decideVersionAction(contentHash, current);

  if (decision.action === "noop") {
    return { action: "noop", version: decision.version };
  }

  await store.insertNewVersion({
    tenantKey: input.tenantKey,
    version: decision.version,
    values: sorted.map((v) => ({ ...v, contentHash: computeContentHash(v) })),
  });

  return { action: "new_version", version: decision.version, previousVersion: decision.previousVersion };
}
