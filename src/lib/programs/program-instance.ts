// src/lib/programs/program-instance.ts
//
// Typed instance shape for programs bound to program-type lifecycle patterns.
// Companion to the display-layer ProgramRow — both can coexist.
// The reasoning layer (Layer 3) reads ProgramInstance for gate evaluation,
// synthesis context building, and cross-instance cascade tracking.
//
// Mirrors the shape of SourceEventInstance in src/lib/source/source-event-instance.ts
// but adapted to the 7-phase program lifecycle (P0 Originate → P6 Operate).

import type { LinkType } from '@/lib/reasoning';

// ── Phase types ──────────────────────────────────────────────────────────────

export type ProgramPhaseStatus = 'done' | 'current' | 'pending' | 'locked';

export interface ProgramPhaseState {
  phaseId: number;         // 0-6
  phaseLabel: string;      // 'Originate' | 'Discovery' | ... | 'Operate'
  status: ProgramPhaseStatus;
  gateStatus: 'open' | 'pending' | 'approved' | 'na';
  enteredAt?: string;      // ISO date
  exitedAt?: string;
  /** Evidence items that satisfied the gate criteria for this phase */
  gateEvidence: string[];
}

// ── Deliverable types ─────────────────────────────────────────────────────────

export type DeliverableStatus = 'not-started' | 'in-progress' | 'complete' | 'blocked';

export interface ProgramDeliverable {
  id: string;
  label: string;
  phaseId: number;
  status: DeliverableStatus;
  owner?: string;
  dueDate?: string;
  completedAt?: string;
}

// ── Evidence types ─────────────────────────────────────────────────────────────

export interface ProgramEvidenceItem {
  id: string;
  citation: string;       // e.g. "Workshop 4 output · Apr 14 2026"
  phaseId: number;
  uploadedAt: string;
  uploadedBy: string;
  kind: 'workshop' | 'document' | 'approval' | 'assessment' | 'demo' | 'other';
}

// ── Cross-instance links ──────────────────────────────────────────────────────

export interface SourceEventLink {
  sourceEventId: string;
  sourceEventName: string;
  linkType: LinkType;
  description: string;
  /** Which phase of this program is gated on the source event outcome */
  blockedAtPhase?: number;
}

// ── Governance ────────────────────────────────────────────────────────────────

export interface ProgramGovernanceFlag {
  id: string;
  kind: 'blocker' | 'risk' | 'decision' | 'note';
  description: string;
  raisedBy: string;
  raisedAt: string;
  status: 'open' | 'resolved';
}

// ── Core ProgramInstance ──────────────────────────────────────────────────────

export interface ProgramInstance {
  // Identity
  id: string;           // 'APX-CDP-2026'
  displayId: string;    // 'APX-CDP-2026'
  tenantSlug: string;   // 'apex-retail'
  name: string;

  // Pattern binding (for the reasoning layer)
  patternId: ProgramPatternId;
  patternVersion: string;

  // Lifecycle state
  currentPhase: number;        // 0-6
  phases: ProgramPhaseState[]; // all 7 phases

  // Domain data
  deliverables: ProgramDeliverable[];
  evidence: ProgramEvidenceItem[];

  // Cross-instance links
  linkedSourceEvents: SourceEventLink[];
  linkedPrograms: Array<{
    programId: string;
    programName: string;
    linkType: LinkType;
    description: string;
  }>;

  // Governance
  sponsor: { id: string; name: string; title: string };
  flags: ProgramGovernanceFlag[];

  // Metadata
  createdAt: string;
  lastModifiedAt: string;
  estimatedValueUsd?: number;
}

/** Program-type pattern IDs (pre-defined for the 6 Apex Retail programs) */
export type ProgramPatternId =
  | 'PAT-PRG-CDP-001'
  | 'PAT-PRG-AI-CODING-001'
  | 'PAT-PRG-COPILOT-001'
  | 'PAT-PRG-LOYALTY-001'
  | 'PAT-PRG-CC-AI-001'
  | 'PAT-PRG-DATA-FAB-001';

/**
 * Build a flat evidence map from a ProgramInstance for gate evaluation.
 * This is what gets passed to the GateEvaluator for a program instance.
 */
export function buildProgramEvidenceMap(instance: ProgramInstance): Record<string, unknown> {
  const map: Record<string, unknown> = {};

  map['evidence-count'] = instance.evidence.length;
  map['deliverables-complete'] = instance.deliverables.filter(d => d.status === 'complete').length;
  map['deliverables-total'] = instance.deliverables.length;
  map['current-phase'] = instance.currentPhase;

  // Phase gate approvals
  for (const phase of instance.phases) {
    if (phase.gateStatus === 'approved') {
      map[`gate-p${phase.phaseId}-approved`] = true;
    }
    map[`phase-p${phase.phaseId}-status`] = phase.status;
  }

  // Evidence items by citation
  for (const ev of instance.evidence) {
    map[`evidence-phase-${ev.phaseId}`] = true;
    map[ev.id] = ev.citation;
  }

  // Governance flags
  map['open-blockers'] = instance.flags.filter(f => f.kind === 'blocker' && f.status === 'open').length;

  // Cross-instance: linked source events awaiting
  map['linked-source-event-blocking'] = instance.linkedSourceEvents.some(
    l => l.linkType === 'depends-on' && l.blockedAtPhase !== undefined && l.blockedAtPhase >= instance.currentPhase
  );

  return map;
}
