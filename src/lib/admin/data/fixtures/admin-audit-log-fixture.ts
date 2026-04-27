/**
 * ADMIN-DATA2 — Admin audit-log fixture.
 *
 * Lifts AUDIT_TRAIL from `data-trust-page-view.ts` and re-shapes into
 * the cross-page `AdminAuditEvent` contract.
 */

import type {
  AdminAuditCategory,
  AdminAuditEvent,
  AdminAuditLogQueryOptions,
} from '../admin-audit-log-adapter-types';

interface SeedTrailEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  datasetId?: string;
  rung?: string;
}

const SEED_TRAIL: ReadonlyArray<SeedTrailEntry> = [
  { id: 'a1', at: '2026-04-25T09:00:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_decision_grade', datasetId: 'apex_outcome_lock_v1', rung: 'decision_grade' },
  { id: 'a2', at: '2026-04-24T14:20:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_decision_grade', datasetId: 'apex_program_gate_pack', rung: 'decision_grade' },
  { id: 'a3', at: '2026-04-24T10:01:00.000Z', actor: 'Steward', role: 'AGENT', action: 'promoted_to_agent_usable', datasetId: 'apex_master_program_brief', rung: 'agent_usable' },
  { id: 'a4', at: '2026-04-23T16:42:00.000Z', actor: 'Steward', role: 'AGENT', action: 'promoted_to_agent_usable', datasetId: 'apex_steward_evidence_pack', rung: 'agent_usable' },
  { id: 'a5', at: '2026-04-23T07:30:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_demand_forecast_eval', rung: 'usable' },
  { id: 'a6', at: '2026-04-22T19:18:00.000Z', actor: 'Atlas', role: 'AGENT', action: 'promoted_to_agent_usable', datasetId: 'apex_atlas_pressure_index', rung: 'agent_usable' },
  { id: 'a7', at: '2026-04-22T18:11:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_cdp_data_audit', rung: 'usable' },
  { id: 'a8', at: '2026-04-22T12:00:00.000Z', actor: 'Steward', role: 'AGENT', action: 'parsed_and_indexed', datasetId: 'apex_pos_indexed', rung: 'available' },
  { id: 'a9', at: '2026-04-22T11:00:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'promotion_requested', datasetId: 'apex_demand_forecast_eval' },
  { id: 'a10', at: '2026-04-22T10:14:00.000Z', actor: 'Apex IT', role: 'TENANT', action: 'ingested', datasetId: 'apex_pos_raw', rung: 'loaded' },
  { id: 'a11', at: '2026-04-21T16:30:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'promotion_requested', datasetId: 'apex_cdp_data_audit' },
  { id: 'a12', at: '2026-04-21T13:55:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_contact_center_kpis', rung: 'usable' },
  { id: 'a13', at: '2026-04-21T08:02:00.000Z', actor: 'Apex HR', role: 'TENANT', action: 'ingested', datasetId: 'apex_store_assoc_raw', rung: 'loaded' },
  { id: 'a14', at: '2026-04-20T16:33:00.000Z', actor: 'Apex Data Eng', role: 'TENANT', action: 'ingested', datasetId: 'apex_demand_logs_raw', rung: 'loaded' },
  { id: 'a15', at: '2026-04-19T15:00:00.000Z', actor: 'Steward', role: 'AGENT', action: 'cited_in_editorial', datasetId: 'apex_demand_forecast_eval' },
  { id: 'a16', at: '2026-04-19T11:20:00.000Z', actor: 'Steward', role: 'AGENT', action: 'parsed_and_indexed', datasetId: 'apex_vendor_inventory', rung: 'available' },
  { id: 'a17', at: '2026-04-18T09:45:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_promotion', datasetId: 'apex_outcome_baseline' },
  { id: 'a18', at: '2026-04-17T15:10:00.000Z', actor: 'Apex CIO', role: 'TENANT', action: 'parsed_and_indexed', datasetId: 'apex_tech_inventory', rung: 'available' },
  { id: 'a19', at: '2026-04-15T13:20:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'approved_promotion', datasetId: 'apex_master_program_brief' },
  { id: 'a20', at: '2026-04-10T10:00:00.000Z', actor: 'Sundaram', role: 'MAESTRO', action: 'rejected_promotion' },
];

function categoryFor(action: string): AdminAuditCategory {
  if (action.startsWith('approved') || action === 'rejected_promotion') return 'approval';
  if (action.startsWith('promoted') || action === 'promotion_requested') return 'dataset';
  if (action === 'ingested' || action === 'parsed_and_indexed' || action === 'cited_in_editorial') return 'dataset';
  return 'other';
}

function actorIdFor(actor: string): string | null {
  const map: Record<string, string> = {
    Sundaram: 'usr_001',
    Steward: 'agent:steward',
    Atlas: 'agent:atlas',
    'Apex IT': 'team:apex-it',
    'Apex HR': 'team:apex-hr',
    'Apex Data Eng': 'team:apex-data-eng',
    'Apex CIO': 'team:apex-cio',
  };
  return map[actor] ?? null;
}

const APEX_EVENTS: ReadonlyArray<AdminAuditEvent> = SEED_TRAIL.map((entry) => {
  const category = categoryFor(entry.action);
  return {
    id: entry.id,
    category,
    action: entry.action,
    actorPersonId: actorIdFor(entry.actor),
    actorDisplayName: entry.actor,
    targetKind: entry.datasetId ? 'admin_datasets' : null,
    targetId: entry.datasetId ?? null,
    summary: entry.rung
      ? `${entry.actor} (${entry.role}) ${entry.action.replace(/_/g, ' ')} — rung ${entry.rung}`
      : `${entry.actor} (${entry.role}) ${entry.action.replace(/_/g, ' ')}`,
    createdAt: entry.at,
  };
});

export function adminAuditEventsFixture(
  tenantSlug: string,
  options?: AdminAuditLogQueryOptions,
): ReadonlyArray<AdminAuditEvent> {
  if (tenantSlug !== 'apex-retail') return [];
  let events: ReadonlyArray<AdminAuditEvent> = APEX_EVENTS;
  if (options?.category) {
    events = events.filter((e) => e.category === options.category);
  }
  if (options?.since) {
    const sinceMs = Date.parse(options.since);
    if (!Number.isNaN(sinceMs)) {
      events = events.filter((e) => Date.parse(e.createdAt) >= sinceMs);
    }
  }
  if (options?.limit !== undefined && options.limit >= 0) {
    events = events.slice(0, options.limit);
  }
  return events;
}

export function adminAuditEventFixture(
  tenantSlug: string,
  eventId: string,
): AdminAuditEvent | null {
  return adminAuditEventsFixture(tenantSlug).find((e) => e.id === eventId) ?? null;
}
