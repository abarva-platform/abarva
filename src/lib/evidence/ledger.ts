import 'server-only';

import { randomUUID } from 'crypto';
import { getServerSupabase } from '@/lib/supabase-server';

export type EvidenceSurface = 'intelligence' | 'moves' | 'source' | 'tower' | 'watchlist';
export type EvidenceArtifactType = 'recommendation' | 'claim' | 'metric' | 'citation' | 'value_state' | 'kill_signal';
export type EvidenceSourceType =
  | 'tenant_record'
  | 'corpus_pattern'
  | 'document_extract'
  | 'workshop_output'
  | 'live_telemetry'
  | 'derived'
  | 'no_evidence';

export interface EvidenceLedgerRow {
  id: string;
  client_id: string;
  surface: EvidenceSurface;
  artifact_type: EvidenceArtifactType;
  artifact_ref: string;
  claim_text: string;
  source_type: EvidenceSourceType;
  source_ref: Record<string, unknown>;
  source_quote: string | null;
  freshness_at: string;
  confidence: number;
  confidence_basis: string;
  owner_role: string | null;
  not_enough_data_flag: boolean;
  not_enough_data_reason: string | null;
  egress_audit_id: string | null;
  created_at: string;
  created_by: string;
  supersedes_id: string | null;
}

export interface RecordEvidenceInput {
  clientId: string;
  surface: EvidenceSurface;
  artifactType: EvidenceArtifactType;
  artifactRef: string;
  claimText: string;
  sourceType: EvidenceSourceType;
  sourceRef: Record<string, unknown>;
  sourceQuote?: string | null;
  freshnessAt: string | Date;
  confidence: number;
  confidenceBasis: string;
  ownerRole?: string | null;
  notEnoughData?: boolean;
  notEnoughDataReason?: string | null;
  egressAuditId?: string | null;
  createdBy: string;
  supersedesId?: string | null;
}

export interface EvidenceProofPointCount {
  total: number;
  tenantRecords: number;
  corpusPatterns: number;
  documentExtracts: number;
  workshopOutputs: number;
  liveTelemetry: number;
  derived: number;
  noEvidence: number;
  notEnoughData: number;
}

export async function recordEvidence(input: RecordEvidenceInput): Promise<string> {
  const row = normalizeRecordEvidenceInput(input);
  const { data, error } = await getServerSupabase()
    .from('evidence_ledger')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    throw new Error(`evidence_ledger insert failed: ${error.message}`);
  }

  return String((data as { id: string }).id);
}

export async function getEvidenceForArtifact(
  surface: EvidenceSurface,
  artifactRef: string,
  clientId?: string,
): Promise<EvidenceLedgerRow[]> {
  let query = getServerSupabase()
    .from('evidence_ledger')
    .select('*')
    .eq('surface', surface)
    .eq('artifact_ref', artifactRef)
    .order('created_at', { ascending: false });

  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query;
  if (error) throw new Error(`evidence_ledger artifact lookup failed: ${error.message}`);
  return (data ?? []) as EvidenceLedgerRow[];
}

export async function getEvidenceProofPointCount(
  artifactRef: string,
  clientId?: string,
): Promise<EvidenceProofPointCount> {
  let query = getServerSupabase()
    .from('evidence_ledger')
    .select('source_type, not_enough_data_flag')
    .eq('artifact_ref', artifactRef);

  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query;
  if (error) throw new Error(`evidence_ledger proof-point count failed: ${error.message}`);
  return summarizeProofPoints((data ?? []) as Array<Pick<EvidenceLedgerRow, 'source_type' | 'not_enough_data_flag'>>);
}

export async function searchEvidenceByClaim(
  clientId: string,
  claimSubstring: string,
): Promise<EvidenceLedgerRow[]> {
  const { data, error } = await getServerSupabase()
    .from('evidence_ledger')
    .select('*')
    .eq('client_id', clientId)
    .ilike('claim_text', `%${claimSubstring}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`evidence_ledger claim search failed: ${error.message}`);
  return (data ?? []) as EvidenceLedgerRow[];
}

export async function supersedeEvidence(
  originalId: string,
  newRow: Omit<RecordEvidenceInput, 'supersedesId'>,
): Promise<string> {
  return recordEvidence({ ...newRow, supersedesId: originalId });
}

// Packet prompt carried the typo "superseseEvidence"; keep an alias so the
// public service surface exactly matches the instruction without spreading it.
export const superseseEvidence = supersedeEvidence;

export function makeNoEvidenceInput(
  input: Omit<RecordEvidenceInput, 'sourceType' | 'sourceRef' | 'confidence' | 'confidenceBasis' | 'notEnoughData' | 'notEnoughDataReason'> & {
    reason: string;
  },
): RecordEvidenceInput {
  return {
    ...input,
    sourceType: 'no_evidence',
    sourceRef: { reason: input.reason },
    confidence: 0,
    confidenceBasis: `Insufficient evidence: ${input.reason}`,
    notEnoughData: true,
    notEnoughDataReason: input.reason,
  };
}

export function normalizeRecordEvidenceInput(input: RecordEvidenceInput): Omit<EvidenceLedgerRow, 'created_at'> {
  const notEnoughData = input.notEnoughData ?? input.sourceType === 'no_evidence';
  return {
    id: randomUUID(),
    client_id: input.clientId.trim(),
    surface: input.surface,
    artifact_type: input.artifactType,
    artifact_ref: input.artifactRef.trim(),
    claim_text: input.claimText.trim(),
    source_type: input.sourceType,
    source_ref: input.sourceRef,
    source_quote: input.sourceQuote ?? null,
    freshness_at: input.freshnessAt instanceof Date ? input.freshnessAt.toISOString() : input.freshnessAt,
    confidence: clampConfidence(input.confidence),
    confidence_basis: input.confidenceBasis.trim(),
    owner_role: input.ownerRole ?? null,
    not_enough_data_flag: notEnoughData,
    not_enough_data_reason: input.notEnoughDataReason ?? (notEnoughData ? 'Not enough tenant evidence to ground this claim.' : null),
    egress_audit_id: input.egressAuditId ?? null,
    created_by: input.createdBy.trim(),
    supersedes_id: input.supersedesId ?? null,
  };
}

export function summarizeProofPoints(
  rows: Array<Pick<EvidenceLedgerRow, 'source_type' | 'not_enough_data_flag'>>,
): EvidenceProofPointCount {
  const summary: EvidenceProofPointCount = {
    total: rows.length,
    tenantRecords: 0,
    corpusPatterns: 0,
    documentExtracts: 0,
    workshopOutputs: 0,
    liveTelemetry: 0,
    derived: 0,
    noEvidence: 0,
    notEnoughData: 0,
  };

  for (const row of rows) {
    if (row.not_enough_data_flag) summary.notEnoughData += 1;
    switch (row.source_type) {
      case 'tenant_record':
        summary.tenantRecords += 1;
        break;
      case 'corpus_pattern':
        summary.corpusPatterns += 1;
        break;
      case 'document_extract':
        summary.documentExtracts += 1;
        break;
      case 'workshop_output':
        summary.workshopOutputs += 1;
        break;
      case 'live_telemetry':
        summary.liveTelemetry += 1;
        break;
      case 'derived':
        summary.derived += 1;
        break;
      case 'no_evidence':
        summary.noEvidence += 1;
        break;
    }
  }

  return summary;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
