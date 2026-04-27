/**
 * ADMIN-DATA2 — Admin setup-progress adapter types.
 */

export type AdminSetupStepId =
  | 'data_trust'
  | 'connectors'
  | 'users_access'
  | 'agent_readiness'
  | 'production_readiness'
  | 'architecture';

export type AdminSetupStepStatus = 'done' | 'in_progress' | 'pending';

export interface AdminSetupStep {
  id: AdminSetupStepId;
  label: string;
  status: AdminSetupStepStatus;
  description: string;
  computedAt: string;
}
