/**
 * ADMIN-DATA2 — Admin overview adapter types.
 */

import type { AdminAuditEvent } from './admin-audit-log-adapter-types';
import type { AdminSetupStep } from './admin-setup-progress-adapter-types';

export interface AdminOverviewSnapshot {
  tenant: { slug: string; name: string };
  setupSteps: ReadonlyArray<AdminSetupStep>;
  recentActivity: ReadonlyArray<AdminAuditEvent>;
  crossPageCounts: {
    openBlockers: number;
    datasetsPendingApproval: number;
    connectorsNotConfigured: number;
    invitesPending: number;
    productionReadinessGatesFailing: number;
  };
  generatedAt: string;
}
