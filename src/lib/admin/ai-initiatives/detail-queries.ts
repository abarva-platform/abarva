import 'server-only';

// AIR-4 · Detail-page queries for a single initiative.
//
// Loads the initiative + its 5 supporting substrate types (KPIs,
// stakeholder notes, decisions, vendors, scenarios) in parallel.
// All queries are tenant-scoped via client_id passed in.

import { azureRead } from '@/lib/data-plane/azureRead';
import {
  type AIInitiative,
  type ConfidenceLevel,
  listInitiativesForClient,
} from './queries';

export interface AIInitiativeKpi {
  kpiName: string;
  kpiUnit: string | null;
  quarter: string;
  kpiValue: number;
  targetValue: number | null;
  peerMedian: number | null;
  confidenceLevel: ConfidenceLevel;
  loadedViaTemplate: string;
}

export interface AIInitiativeStakeholderNote {
  noteId: string;
  stakeholderName: string;
  stakeholderTitle: string;
  interviewDate: string;
  quote: string;
  themes: ReadonlyArray<string>;
  attributionConsent: boolean;
  loadedViaTemplate: string;
}

export type DecisionStatus = 'decided' | 'pending' | 'stalled' | 'reversed';

export interface AIInitiativeDecision {
  decisionId: string;
  decisionName: string;
  decisionDate: string | null;
  sponsorName: string | null;
  decisionStatus: DecisionStatus;
  dissentRecorded: boolean;
  dissentSummary: string | null;
  outcomeStatus: string | null;
  loadedViaTemplate: string;
}

export type VendorFinancialHealth = 'strong' | 'moderate' | 'watch' | 'at_risk';

export interface AIInitiativeVendor {
  vendorId: string;
  vendorName: string;
  contractValueUsd: number | null;
  renewalDate: string | null;
  financialHealth: VendorFinancialHealth | null;
  notes: string | null;
  loadedViaTemplate: string;
}

export interface AIInitiativeScenario {
  scenarioId: string;
  scenarioName: string;
  triggerEvent: string | null;
  timeHorizonMonths: number | null;
  probabilityPct: number | null;
  impactSummary: string;
  loadedViaTemplate: string;
}

export interface InitiativeDetail {
  initiative: AIInitiative;
  kpis: ReadonlyArray<AIInitiativeKpi>;
  stakeholderNotes: ReadonlyArray<AIInitiativeStakeholderNote>;
  decisions: ReadonlyArray<AIInitiativeDecision>;
  vendors: ReadonlyArray<AIInitiativeVendor>;
  scenarios: ReadonlyArray<AIInitiativeScenario>;
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function toIsoDateString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export async function getInitiativeDetail(
  clientId: string,
  initiativeId: string,
): Promise<InitiativeDetail | null> {
  // Reuse the list query (with category + goal joins) and pick the matching row.
  // For the 21-initiative case the client-side filter is cheap and avoids
  // duplicating the join logic.
  const all = await listInitiativesForClient(clientId);
  const initiative = all.find((i) => i.initiativeId === initiativeId);
  if (!initiative) return null;

  const [kpisRows, notesRows, decisionsRows, vendorsRows, scenariosRows] = await Promise.all([
    azureRead.select<Record<string, unknown>>({
      table: 'ai_initiative_kpis',
      columns: [
        'kpi_name',
        'kpi_unit',
        'quarter',
        'kpi_value',
        'target_value',
        'peer_median',
        'confidence_level',
        'loaded_via_template',
      ],
      where: { initiative_id: initiativeId },
      orderBy: { column: 'quarter', direction: 'asc' },
    }),
    azureRead.select<Record<string, unknown>>({
      table: 'ai_initiative_stakeholder_notes',
      columns: [
        'note_id',
        'stakeholder_name',
        'stakeholder_title',
        'interview_date',
        'quote',
        'themes',
        'attribution_consent',
        'loaded_via_template',
      ],
      where: { initiative_id: initiativeId },
      orderBy: { column: 'interview_date', direction: 'desc' },
    }),
    azureRead.select<Record<string, unknown>>({
      table: 'ai_initiative_decisions',
      columns: [
        'decision_id',
        'decision_name',
        'decision_date',
        'sponsor_name',
        'decision_status',
        'dissent_recorded',
        'dissent_summary',
        'outcome_status',
        'loaded_via_template',
      ],
      where: { initiative_id: initiativeId },
      orderBy: { column: 'decision_date', direction: 'desc', nulls: 'last' },
    }),
    azureRead.select<Record<string, unknown>>({
      table: 'ai_initiative_vendors',
      columns: [
        'vendor_id',
        'vendor_name',
        'contract_value_usd',
        'renewal_date',
        'financial_health',
        'notes',
        'loaded_via_template',
      ],
      where: { initiative_id: initiativeId },
      orderBy: { column: 'renewal_date', direction: 'asc', nulls: 'last' },
    }),
    azureRead.select<Record<string, unknown>>({
      table: 'ai_initiative_scenarios',
      columns: [
        'scenario_id',
        'scenario_name',
        'trigger_event',
        'time_horizon_months',
        'probability_pct',
        'impact_summary',
        'loaded_via_template',
      ],
      where: { initiative_id: initiativeId },
      orderBy: { column: 'probability_pct', direction: 'desc', nulls: 'last' },
    }),
  ]);

  const kpis: ReadonlyArray<AIInitiativeKpi> = kpisRows.map((r: Record<string, unknown>) => ({
    kpiName: r.kpi_name as string,
    kpiUnit: (r.kpi_unit as string | null) ?? null,
    quarter: r.quarter as string,
    kpiValue: toNumber(r.kpi_value as number | string | null) ?? 0,
    targetValue: toNumber(r.target_value as number | string | null),
    peerMedian: toNumber(r.peer_median as number | string | null),
    confidenceLevel: r.confidence_level as ConfidenceLevel,
    loadedViaTemplate: r.loaded_via_template as string,
  }));

  const stakeholderNotes: ReadonlyArray<AIInitiativeStakeholderNote> = notesRows.map(
    (r: Record<string, unknown>) => ({
      noteId: r.note_id as string,
      stakeholderName: r.stakeholder_name as string,
      stakeholderTitle: r.stakeholder_title as string,
      interviewDate: toIsoDateString(r.interview_date) ?? '',
      quote: r.quote as string,
      themes: (r.themes as string[] | null) ?? [],
      attributionConsent: Boolean(r.attribution_consent),
      loadedViaTemplate: r.loaded_via_template as string,
    }),
  );

  const decisions: ReadonlyArray<AIInitiativeDecision> = decisionsRows.map(
    (r: Record<string, unknown>) => ({
      decisionId: r.decision_id as string,
      decisionName: r.decision_name as string,
      decisionDate: toIsoDateString(r.decision_date),
      sponsorName: (r.sponsor_name as string | null) ?? null,
      decisionStatus: r.decision_status as DecisionStatus,
      dissentRecorded: Boolean(r.dissent_recorded),
      dissentSummary: (r.dissent_summary as string | null) ?? null,
      outcomeStatus: (r.outcome_status as string | null) ?? null,
      loadedViaTemplate: r.loaded_via_template as string,
    }),
  );

  const vendors: ReadonlyArray<AIInitiativeVendor> = vendorsRows.map(
    (r: Record<string, unknown>) => ({
      vendorId: r.vendor_id as string,
      vendorName: r.vendor_name as string,
      contractValueUsd: toNumber(r.contract_value_usd as number | string | null),
      renewalDate: toIsoDateString(r.renewal_date),
      financialHealth: (r.financial_health as VendorFinancialHealth | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      loadedViaTemplate: r.loaded_via_template as string,
    }),
  );

  const scenarios: ReadonlyArray<AIInitiativeScenario> = scenariosRows.map(
    (r: Record<string, unknown>) => ({
      scenarioId: r.scenario_id as string,
      scenarioName: r.scenario_name as string,
      triggerEvent: (r.trigger_event as string | null) ?? null,
      timeHorizonMonths: (r.time_horizon_months as number | null) ?? null,
      probabilityPct: (r.probability_pct as number | null) ?? null,
      impactSummary: r.impact_summary as string,
      loadedViaTemplate: r.loaded_via_template as string,
    }),
  );

  return { initiative, kpis, stakeholderNotes, decisions, vendors, scenarios };
}
