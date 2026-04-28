/**
 * ADMIN-DATA2 — Admin setup-progress fixture.
 *
 * Lifts SETUP_ITEMS from `overview-page-view.ts`.
 */

import type { AdminSetupStep } from '../admin-setup-progress-adapter-types';

const COMPUTED_AT = '2026-04-26T00:00:00.000Z';

const APEX_SETUP_STEPS: ReadonlyArray<AdminSetupStep> = [
  {
    id: 'data_trust',
    label: 'Data Trust',
    status: 'in_progress',
    description: 'Loaded artifacts present; usable evidence partial.',
    computedAt: COMPUTED_AT,
  },
  {
    id: 'connectors',
    label: 'Connectors',
    status: 'pending',
    description: '6 external systems, none live; stubs and deferred only.',
    computedAt: COMPUTED_AT,
  },
  {
    id: 'users_access',
    label: 'Users & Access',
    status: 'pending',
    description: 'Roles seeded; live invite + SSO not wired.',
    computedAt: COMPUTED_AT,
  },
  {
    id: 'agent_readiness',
    label: 'Agent Readiness',
    status: 'in_progress',
    description: 'Steward / Nexus / Sentinel / Atlas posture inventoried.',
    computedAt: COMPUTED_AT,
  },
  {
    id: 'production_readiness',
    label: 'Production Readiness',
    status: 'in_progress',
    description: 'Demo ready; pilot partial; production blocked.',
    computedAt: COMPUTED_AT,
  },
  {
    id: 'architecture',
    label: 'Architecture',
    status: 'in_progress',
    description: 'Planes documented; private data plane lab not deployed.',
    computedAt: COMPUTED_AT,
  },
];

export function adminSetupProgressFixture(
  tenantSlug: string,
): ReadonlyArray<AdminSetupStep> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_SETUP_STEPS;
}
