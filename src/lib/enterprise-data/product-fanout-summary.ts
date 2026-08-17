import { azureRead } from "@/lib/data-plane/azureRead";

export type ProductFanoutKey =
  | "home"
  | "source"
  | "tower"
  | "moves"
  | "intelligence";

export interface ProductFanoutTotal {
  tenantKey: string;
  productKey: ProductFanoutKey;
  buildVersion: string;
  inputSourceVersion: string;
  idempotencyKey: string;
  buildFinishedAt: string | null;
  recordCount: number;
  activeFactCount: number;
  blockedFactCount: number;
  quarantinedCount: number;
  objectTypeCount: number;
}

interface ProductFanoutTotalRow {
  tenant_key: string;
  product_key: ProductFanoutKey;
  build_version: string;
  input_source_version: string;
  idempotency_key: string;
  build_finished_at: string | Date | null;
  record_count: string | number | null;
  active_fact_count: string | number | null;
  blocked_fact_count: string | number | null;
  quarantined_count: string | number | null;
  object_type_count: string | number | null;
}

const TENANT_ALIASES: Readonly<Record<string, string>> = {
  meridian: "meridian-health",
  skyharbor: "skyharbor-air",
};

function normalizeTenantKey(value: string | null | undefined): string | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (!normalized) return null;
  return TENANT_ALIASES[normalized] ?? normalized;
}

function numberValue(value: string | number | null): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function iso(value: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function shape(row: ProductFanoutTotalRow): ProductFanoutTotal {
  return {
    tenantKey: row.tenant_key,
    productKey: row.product_key,
    buildVersion: row.build_version,
    inputSourceVersion: row.input_source_version,
    idempotencyKey: row.idempotency_key,
    buildFinishedAt: iso(row.build_finished_at),
    recordCount: numberValue(row.record_count),
    activeFactCount: numberValue(row.active_fact_count),
    blockedFactCount: numberValue(row.blocked_fact_count),
    quarantinedCount: numberValue(row.quarantined_count),
    objectTypeCount: numberValue(row.object_type_count),
  };
}

export async function listProductFanoutTotals(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
}): Promise<ProductFanoutTotal[]> {
  const candidates = Array.from(
    new Set(args.tenantKeyCandidates.map(normalizeTenantKey).filter(Boolean)),
  ) as string[];
  if (candidates.length === 0) return [];
  const rows = await azureRead.query<ProductFanoutTotalRow>(
    `SELECT tenant_key, product_key, build_version, input_source_version, idempotency_key,
            build_finished_at, record_count, active_fact_count, blocked_fact_count,
            quarantined_count, object_type_count
       FROM consumption.enterprise_l4_product_fanout_totals_v1
      WHERE tenant_key = ANY($1::text[])
      ORDER BY product_key`,
    [candidates],
    { missingTable: "empty" },
  );
  return rows.map(shape);
}

export function productFanoutFor(
  rows: readonly ProductFanoutTotal[],
  productKey: ProductFanoutKey,
): ProductFanoutTotal | null {
  return rows.find((row) => row.productKey === productKey) ?? null;
}
