/**
 * ADMIN-DATA2 — Admin blockers fixture.
 *
 * Lifts APEX_RETAIL_BLOCKERS from `blocker-detail-view.ts` into the
 * `AdminBlockerRow` shape.
 */

import type {
  AdminBlockerOwnerAgent,
  AdminBlockerRow,
} from '../admin-blockers-adapter-types';

const APEX_RETAIL_BLOCKERS: ReadonlyArray<AdminBlockerRow> = [
  {
    id: 'blk-apex-001',
    title: 'Evidence upload connector not wired',
    description:
      'The evidence upload pathway is not connected to the evidence fabric. ' +
      'Programme documents, vendor responses, and workshop notes must be manually ' +
      'uploaded by an operator — no automated ingestion is available. ' +
      'This prevents Sentinel from detecting new patterns as evidence arrives.',
    severity: 'critical',
    affectedScope: 'pilot',
    status: 'open',
    ownerAgent: 'engineering' satisfies AdminBlockerOwnerAgent,
    impactedComponent: 'Evidence Fabric / Sentinel Pattern Detection',
    evidenceBasis:
      'Connector readiness stub inventory — evidence upload connector shows not_configured status. ' +
      'Deterministic Wave 2 seed.',
    blockerReason:
      'Evidence upload connector not configured — Sentinel cannot detect new patterns automatically.',
    unblockSteps: [
      'Engineering team to implement evidence upload connector.',
      'Interim: Steward uploads evidence manually via Admin evidence intake.',
    ],
    pilotImpact: true,
    productionImpact: true,
    openedAt: '2026-04-01T00:00:00.000Z',
    resolvedAt: null,
  },
  {
    id: 'blk-apex-002',
    title: 'Model gateway not configured',
    description:
      'The model gateway is not configured for production use. ' +
      'All model inference is deferred — no live AI outputs are generated. ' +
      'This means Intelligence pattern detection, Sentinel signals, and Atlas ' +
      'recommendations are all running on deterministic seed data, not live analysis.',
    severity: 'critical',
    affectedScope: 'production',
    status: 'open',
    ownerAgent: 'founder' satisfies AdminBlockerOwnerAgent,
    impactedComponent: 'Intelligence / Sentinel / Atlas — all model-backed surfaces',
    evidenceBasis:
      'Production readiness manifest — model gateway component shows not_started status. ' +
      'Deterministic Wave 2 seed.',
    blockerReason:
      'Model gateway not configured — production-grade inference deferred.',
    unblockSteps: [
      'Configure model gateway with approved model provider (Azure OpenAI).',
      'Founder decision on model provider required.',
      'Run security review and integration test post-credential issue.',
    ],
    pilotImpact: false,
    productionImpact: true,
    openedAt: '2026-03-15T00:00:00.000Z',
    resolvedAt: null,
  },
  {
    id: 'blk-apex-003',
    title: 'Connector stubs — no live data ingestion',
    description:
      'All data connectors are in stub state. No live data ingestion is wired. ' +
      'The platform is operating on Wave 2 seed data only. ' +
      'CDP programme analysis, AMS BAFO tracking, and spend analytics all ' +
      'require connector activation before live programme signals can be generated.',
    severity: 'high',
    affectedScope: 'pilot',
    status: 'open',
    ownerAgent: 'steward',
    impactedComponent: 'All data-backed surfaces (CDP, AMS, Intelligence)',
    evidenceBasis:
      'Connector readiness view — all connectors show configured_stub or not_configured. ' +
      'Deterministic Wave 2 seed.',
    blockerReason:
      'All connectors in stub state — live programme signals cannot be generated.',
    unblockSteps: [
      'Activate contract management connector (highest priority pilot connector).',
      'Identity connector: IT Security domain verification.',
    ],
    pilotImpact: true,
    productionImpact: true,
    openedAt: '2026-04-05T00:00:00.000Z',
    resolvedAt: null,
  },
  {
    id: 'blk-apex-004',
    title: 'SOC2 certification pending',
    description:
      'SOC2 Type II certification has not been initiated. ' +
      'Enterprise customers require SOC2 certification before allowing AbarVa to ' +
      'process their programme data in a production context.',
    severity: 'high',
    affectedScope: 'production',
    status: 'open',
    ownerAgent: 'founder' satisfies AdminBlockerOwnerAgent,
    impactedComponent: 'Tenant onboarding / Enterprise deployment',
    evidenceBasis:
      'Enterprise deployment trust verification runbook — SOC2 certification status: not_started. ' +
      'Deterministic Wave 2 seed.',
    blockerReason:
      'SOC2 Type II certification not initiated — enterprise production deployments cannot proceed.',
    unblockSteps: [
      'Initiate SOC2 audit with approved auditor.',
      'Founder-level decision requiring legal and compliance review.',
      'Pilot deployments can proceed under mutual NDA in the interim.',
    ],
    pilotImpact: false,
    productionImpact: true,
    openedAt: '2026-03-01T00:00:00.000Z',
    resolvedAt: null,
  },
];

export function adminBlockersFixture(
  tenantSlug: string,
): ReadonlyArray<AdminBlockerRow> {
  if (tenantSlug !== 'apex-retail') return [];
  return APEX_RETAIL_BLOCKERS;
}

export function adminBlockerDetailFixture(
  tenantSlug: string,
  blockerId: string,
): AdminBlockerRow | null {
  return adminBlockersFixture(tenantSlug).find((b) => b.id === blockerId) ?? null;
}

export function adminCriticalBlockersFixture(
  tenantSlug: string,
): ReadonlyArray<AdminBlockerRow> {
  return adminBlockersFixture(tenantSlug).filter((b) => b.severity === 'critical');
}
