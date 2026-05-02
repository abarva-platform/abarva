import { normalizeTenantMetricTenantKey } from "./tenant-metric-fixtures";

export interface TenantMetricPrivatePlane {
  tenantKey: string;
  privateSchema: string;
  observationTable: "tenant_metric_observations";
  uploadBatchTable: "tenant_metric_upload_batches";
}

const TENANT_METRIC_PRIVATE_PLANES: Record<string, TenantMetricPrivatePlane> = {
  "apex-retail": {
    tenantKey: "apex-retail",
    privateSchema: "client_apex_retail_private",
    observationTable: "tenant_metric_observations",
    uploadBatchTable: "tenant_metric_upload_batches",
  },
  "meridian-health": {
    tenantKey: "meridian-health",
    privateSchema: "client_meridian_health_private",
    observationTable: "tenant_metric_observations",
    uploadBatchTable: "tenant_metric_upload_batches",
  },
  "first-capital": {
    tenantKey: "first-capital",
    privateSchema: "client_first_capital_private",
    observationTable: "tenant_metric_observations",
    uploadBatchTable: "tenant_metric_upload_batches",
  },
} as const;

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function getTenantMetricPrivatePlane(
  tenantKey: string | null | undefined,
): TenantMetricPrivatePlane | null {
  if (!tenantKey) return null;
  return (
    TENANT_METRIC_PRIVATE_PLANES[normalizeTenantMetricTenantKey(tenantKey)] ??
    null
  );
}

export function listTenantMetricPrivatePlanes(): readonly TenantMetricPrivatePlane[] {
  return Object.values(TENANT_METRIC_PRIVATE_PLANES);
}

export function quoteTenantMetricIdentifier(identifier: string): string {
  if (!IDENTIFIER_RE.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

export function tenantMetricTableRef(
  plane: TenantMetricPrivatePlane,
  table:
    | TenantMetricPrivatePlane["observationTable"]
    | TenantMetricPrivatePlane["uploadBatchTable"],
): string {
  return `${quoteTenantMetricIdentifier(plane.privateSchema)}.${quoteTenantMetricIdentifier(table)}`;
}
