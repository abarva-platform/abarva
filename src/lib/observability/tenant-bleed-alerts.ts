import type { CrossTenantWriteIntent } from '@/lib/agent/tenant-guardrails';
import { writeStructuredLog } from './structured-logger';

export interface TenantBleedAlertInput {
  intent: CrossTenantWriteIntent;
  route: string;
  surface?: string;
  metadata?: Record<string, unknown>;
}

export function recordTenantBleedAlert(input: TenantBleedAlertInput): void {
  writeStructuredLog('warn', 'tenant_bleed_attempt_blocked', {
    message: 'Blocked cross-tenant write intent before model or tool execution.',
    route: input.route,
    surface: input.surface,
    tenant: {
      activeClientKey: input.intent.activeClientKey,
      activeClientName: input.intent.activeClientName,
      requestedClientKey: input.intent.requestedClientKey,
      requestedClientName: input.intent.requestedClientName,
    },
    metadata: {
      blocked: true,
      alertKind: 'tenant_bleed',
      ...input.metadata,
    },
  });
}
