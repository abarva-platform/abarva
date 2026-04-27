/**
 * ADMIN-DATA2 — Admin connectors adapter types.
 */

export type AdminConnectorStatus =
  | 'not_configured'
  | 'configured_stub'
  | 'blocked'
  | 'deferred'
  | 'active';

export type AdminConnectorKind =
  | 'erp'
  | 'spend_analytics'
  | 'contract_management'
  | 'market_intelligence'
  | 'vendor_portal'
  | 'identity'
  | 'data_warehouse'
  | 'crm';

export interface AdminConnectorRow {
  id: string;
  tenantSlug: string;
  kind: AdminConnectorKind;
  vendor: string | null;
  label: string;
  status: AdminConnectorStatus;
  requiredForPilot: boolean;
  requiredForProduction: boolean;
  blockerReason: string | null;
  stewardGuidance: string | null;
  lastSyncAttempt: string | null;
  updatedAt: string;
}

export type AdminConnectorSyncOutcome = 'ok' | 'failed' | 'partial';

export interface AdminConnectorSyncAttempt {
  at: string;
  result: AdminConnectorSyncOutcome;
  errorMessage?: string;
}

export type AdminConnectorHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'failed'
  | 'paused';

export interface AdminConnectorHealthPoint {
  at: string;
  status: AdminConnectorHealthStatus;
}

export interface AdminConnectorDetail extends AdminConnectorRow {
  configSchema: Record<string, unknown> | null;
  recentSyncAttempts: ReadonlyArray<AdminConnectorSyncAttempt>;
  healthTrend: ReadonlyArray<AdminConnectorHealthPoint>;
}
