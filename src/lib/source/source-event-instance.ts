// src/lib/source/source-event-instance.ts
//
// Typed instance shape for source events bound to lifecycle patterns.
// Companion to the display-layer SourcingEventDetail — both can coexist.
// The reasoning layer (Layer 3) reads SourceEventInstance for gate evaluation,
// contradiction detection, and synthesis context building.

import type { SourceEventPatternId, StageId } from '@/lib/intelligence/seed-types';
import type { LinkType } from '@/lib/reasoning';

// ── Vendor types ──────────────────────────────────────────────────────────────

export type VendorStatus = 'active' | 'shortlisted' | 'invited-bafo' | 'selected' | 'declined' | 'disqualified';

export interface VendorParticipant {
  id: string;
  name: string;
  status: VendorStatus;
  invitedToStages: StageId[];
  /** Risk flags raised against this vendor */
  riskFlags: VendorRiskFlag[];
  /** Key differentiators from proposal */
  differentiators: string[];
  pricingBand: 'low' | 'medium' | 'high' | null;
}

export interface VendorRiskFlag {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  detail: string;
  /** Which pattern contradiction template this maps to (if auto-detected) */
  contradictionTemplateId?: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

// ── Response types ────────────────────────────────────────────────────────────

export interface VendorResponse {
  id: string;
  vendorId: string;
  stageId: StageId;
  receivedAt: string;  // ISO date
  status: 'received' | 'under-review' | 'accepted' | 'declined';
  /** Key claims extracted from the response */
  claims: string[];
}

// ── Artifact types ────────────────────────────────────────────────────────────

export interface SourceArtifactRef {
  id: string;
  label: string;
  stageId: StageId;
  /** Maps to ExpectedArtifact.id in the pattern */
  expectedArtifactId?: string;
  status: 'draft' | 'approved' | 'locked';
  createdAt: string;
}

// ── Evidence types ────────────────────────────────────────────────────────────

export interface EvidenceItem {
  id: string;
  kind: 'claim' | 'measurement' | 'document' | 'attestation' | 'flag';
  field: string;  // what this evidence covers, e.g. "vendor-response-count"
  value: string;
  source: string;
  recordedAt: string;
  /** If this evidence was used in a contradiction detection */
  contradictionRef?: string;
}

// ── Stage history ─────────────────────────────────────────────────────────────

export interface StageTransition {
  stageId: StageId;
  enteredAt: string;   // ISO date
  exitedAt?: string;   // ISO date — undefined if still current
  advancedBy: string;  // user ID or 'system'
  gateApprovalRef?: string;  // reference to the gate approval record
}

// ── Cross-instance links ──────────────────────────────────────────────────────

export interface ProgramLink {
  programId: string;
  programName: string;
  linkType: LinkType;
  /** Human description of why this link exists */
  description: string;
  /** Which stage of the linked program is waiting on this event */
  blockedAtStage?: string;
}

export interface SourceLink {
  sourceEventId: string;
  sourceEventName: string;
  linkType: LinkType;
  description: string;
}

// ── Governance ────────────────────────────────────────────────────────────────

export interface GovernanceFlag {
  id: string;
  kind: 'risk' | 'blocker' | 'exception' | 'note';
  description: string;
  raisedBy: string;
  raisedAt: string;
  status: 'open' | 'resolved';
}

// ── Core SourceEventInstance ──────────────────────────────────────────────────

export interface SourceEventInstance {
  // Identity
  id: string;
  displayId: string;
  tenantSlug: string;
  name: string;

  // Pattern binding
  patternId: SourceEventPatternId;
  patternVersion: string;

  // Lifecycle state
  currentStage: StageId;
  stageHistory: StageTransition[];

  // Domain data
  vendors: VendorParticipant[];
  responses: VendorResponse[];
  artifacts: SourceArtifactRef[];
  evidence: EvidenceItem[];

  // Cross-instance links
  linkedPrograms: ProgramLink[];
  linkedSourceEvents: SourceLink[];

  // Governance
  sponsor: { id: string; name: string; title: string };
  flags: GovernanceFlag[];

  // Metadata
  createdAt: string;
  lastModifiedAt: string;
  valueAtStakeUsd: number;
}

/**
 * Build a flat evidence map from a SourceEventInstance.
 * This is what gets passed to the GateEvaluator.
 *
 * Evidence map rules:
 * - `vendor-response-count`: number of VendorResponse records
 * - `bafo-vendor-responses`: number of responses at stageId='BAFO'
 * - `vendor-soc2-attestation`: boolean — any vendor has a 'soc2' attestation evidence item
 * - `selection-committee-approval`: boolean — any artifact with id matching 'selection-committee'
 * - etc.
 * This list grows as gate criteria are better understood.
 */
export function buildEvidenceMap(instance: SourceEventInstance): Record<string, unknown> {
  const map: Record<string, unknown> = {};

  map['vendor-response-count'] = instance.responses.length;
  map['bafo-vendor-responses'] = instance.responses.filter(r => r.stageId === 'BAFO').length;
  map['vendors-shortlisted'] = instance.vendors.filter(v => v.status === 'shortlisted' || v.status === 'invited-bafo').length;
  map['vendor-selected'] = instance.vendors.some(v => v.status === 'selected');
  map['artifacts-count'] = instance.artifacts.length;

  // Evidence-driven flags
  for (const ev of instance.evidence) {
    map[ev.field] = ev.value;
  }

  // Artifact presence flags
  for (const art of instance.artifacts) {
    map[`artifact-${art.id}`] = art.status !== 'draft';
    if (art.expectedArtifactId) {
      map[`artifact-${art.expectedArtifactId}`] = art.status !== 'draft';
    }
  }

  return map;
}
