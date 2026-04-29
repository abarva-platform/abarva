// INT6 · Gate Readiness Checklist view-model.
//
// Pure deterministic helper — returns per-programme gate readiness checklists
// for the four Apex Retail AI programmes. Shows what Sentinel needs to confirm
// before each programme can advance to its next milestone gate.
//
// No model calls, no fetch, no Date.now / Math.random / new Date,
// no live data. Same input → identical output.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type GateRequirementStatus = 'met' | 'open' | 'at_risk' | 'blocked';

export type GateRequirementCategory =
  | 'evidence'
  | 'contradiction'
  | 'stakeholder'
  | 'technical'
  | 'governance';

export type GateRequirementUrgency = 'critical' | 'high' | 'medium' | 'low';

export type GateReadinessStatus = 'clear' | 'at_risk' | 'blocked';

export interface GateRequirement {
  requirementId: string;
  category: GateRequirementCategory;
  description: string;
  status: GateRequirementStatus;
  urgency: GateRequirementUrgency;
  sentinelNote: string;
}

export interface ProgrammeGateReadiness {
  programmeId: string;
  programmeCode: string;
  programmeName: string;
  nextGate: string;
  gateReadinessStatus: GateReadinessStatus;
  requirements: GateRequirement[];
}

export interface GateReadinessMetrics {
  totalProgrammes: number;
  clearCount: number;
  blockedCount: number;
  atRiskCount: number;
  /** Requirements with status !== 'met' across all programmes */
  totalOpenRequirements: number;
  /** Requirements with urgency 'critical' and status !== 'met' */
  criticalOpenCount: number;
}

export interface GateReadinessView {
  programmes: ProgrammeGateReadiness[];
  metrics: GateReadinessMetrics;
  atlasSummary: string;
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — Apex Retail four AI programmes
// ─────────────────────────────────────────────────────────────────────────────

const GATE_READINESS_DATA: ReadonlyArray<ProgrammeGateReadiness> = [
  {
    programmeId: 'APX-AMS-2026',
    programmeCode: 'APX-AMS',
    programmeName: 'Contact Center AI — Advanced Model Suite',
    nextGate: 'Architecture Sign-off',
    gateReadinessStatus: 'blocked',
    requirements: [
      {
        requirementId: 'REQ-AMS-001',
        category: 'contradiction',
        description: 'Resolve CON-AMS-001: model SLA vs call volume capacity cap contradiction',
        status: 'blocked',
        urgency: 'critical',
        sentinelNote:
          'Escalated contradiction blocks architecture gate; resolution or formal risk-acceptance required before sign-off can proceed',
      },
      {
        requirementId: 'REQ-AMS-002',
        category: 'evidence',
        description: 'Confirm call volume elasticity data (currently deferred in evidence manifest)',
        status: 'at_risk',
        urgency: 'high',
        sentinelNote:
          'Volume peaks remain deferred in evidence manifest; gate cannot clear without confirmation from Contact Center ops team',
      },
      {
        requirementId: 'REQ-AMS-003',
        category: 'stakeholder',
        description: 'CTO sponsorship letter for Contact Center AI deployment scope',
        status: 'open',
        urgency: 'medium',
        sentinelNote:
          'Sponsor acknowledgment required per engagement governance protocol; blocking only if unresolved at gate day-minus-5',
      },
      {
        requirementId: 'REQ-AMS-004',
        category: 'technical',
        description: 'Disaster recovery failover test completion for model serving layer',
        status: 'open',
        urgency: 'medium',
        sentinelNote:
          'DR test scheduled but not yet run; non-blocking for architecture sign-off unless contradiction is resolved and gate advances',
      },
    ],
  },
  {
    programmeId: 'APX-CDP-2026',
    programmeCode: 'APX-CDP',
    programmeName: 'Customer Data Platform',
    nextGate: 'Data Architecture Approval',
    gateReadinessStatus: 'blocked',
    requirements: [
      {
        requirementId: 'REQ-CDP-001',
        category: 'contradiction',
        description: 'Resolve CON-CDP-001: data residency requirements vs proposed CDP cross-region architecture',
        status: 'blocked',
        urgency: 'critical',
        sentinelNote:
          'Active contradiction between EU residency requirements and proposed CDP architecture; data architecture gate is hard-blocked until resolution',
      },
      {
        requirementId: 'REQ-CDP-002',
        category: 'governance',
        description: 'Complete GDPR privacy impact review including cross-border transfer provisions',
        status: 'at_risk',
        urgency: 'high',
        sentinelNote:
          'Review started; gap identified in cross-border transfer documentation; must close before architecture approval — currently 3 weeks behind schedule',
      },
      {
        requirementId: 'REQ-CDP-003',
        category: 'technical',
        description: 'Confirm source system connectivity for all 7 planned CDP integrations (3 of 7 confirmed)',
        status: 'open',
        urgency: 'high',
        sentinelNote:
          'Four source systems remain unconfirmed; connectivity evidence required before architecture approval; responsible: Client IT integration team',
      },
      {
        requirementId: 'REQ-CDP-004',
        category: 'evidence',
        description: 'Refresh business case with post-contradiction updated data landscape',
        status: 'open',
        urgency: 'medium',
        sentinelNote:
          'Current business case predates CON-CDP-001 discovery; refresh required to reflect revised architecture options before gate sign-off',
      },
    ],
  },
  {
    programmeId: 'APX-SA-2026',
    programmeCode: 'APX-SA',
    programmeName: 'Store Associate Productivity',
    nextGate: 'Pilot Go/No-Go',
    gateReadinessStatus: 'at_risk',
    requirements: [
      {
        requirementId: 'REQ-SA-001',
        category: 'contradiction',
        description: 'Resolve or formally risk-accept productivity KPI baseline contradiction',
        status: 'at_risk',
        urgency: 'high',
        sentinelNote:
          'Active contradiction on KPI baseline measurement methodology risks pilot validity; must be resolved or documented risk-acceptance signed before pilot launch',
      },
      {
        requirementId: 'REQ-SA-002',
        category: 'evidence',
        description: 'Finalize pilot store selection — minimum 2 stores required, 1 confirmed',
        status: 'open',
        urgency: 'high',
        sentinelNote:
          'Second pilot store not yet confirmed; gate requires minimum 2 stores to enable A/B measurement; Client store ops team to confirm by week -3',
      },
      {
        requirementId: 'REQ-SA-003',
        category: 'technical',
        description: 'Device procurement confirmation for pilot store deployment',
        status: 'met',
        urgency: 'medium',
        sentinelNote:
          'Devices confirmed for Store 1; pending Store 2 selection before full confirmation — treated as met for gate purposes with contingency noted',
      },
      {
        requirementId: 'REQ-SA-004',
        category: 'stakeholder',
        description: 'Training content sign-off from L&D team',
        status: 'open',
        urgency: 'medium',
        sentinelNote:
          'L&D review in progress; target sign-off pilot week minus-2; non-blocking if KPI contradiction resolved and store 2 confirmed',
      },
    ],
  },
  {
    programmeId: 'APX-DF-2026',
    programmeCode: 'APX-DF',
    programmeName: 'Demand Forecasting',
    nextGate: 'Model Selection',
    gateReadinessStatus: 'clear',
    requirements: [
      {
        requirementId: 'REQ-DF-001',
        category: 'evidence',
        description: 'Historical demand data access confirmed — 24-month minimum horizon',
        status: 'met',
        urgency: 'high',
        sentinelNote:
          '36-month history available via data warehouse; access confirmed by Client data engineering team at Oct steering',
      },
      {
        requirementId: 'REQ-DF-002',
        category: 'technical',
        description: 'Forecast accuracy baseline established on current rule-based model',
        status: 'met',
        urgency: 'medium',
        sentinelNote:
          'Baseline established: MAPE 18.4% on current rule-based model across 6 SKU categories; documented in evidence manifest',
      },
      {
        requirementId: 'REQ-DF-003',
        category: 'technical',
        description: 'Model evaluation and selection framework document approved',
        status: 'open',
        urgency: 'medium',
        sentinelNote:
          'Framework draft in review; non-blocking for model selection gate — can be finalised in parallel with initial model evaluation',
      },
      {
        requirementId: 'REQ-DF-004',
        category: 'stakeholder',
        description: 'Stakeholder alignment on forecast accuracy improvement targets',
        status: 'met',
        urgency: 'medium',
        sentinelNote:
          'Alignment confirmed at Oct steering committee; MAPE target < 12% approved; documented in programme steering notes',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the GateReadinessView — fully deterministic, no runtime data.
 */
export function buildGateReadinessView(): GateReadinessView {
  const programmes = [...GATE_READINESS_DATA];

  // Compute metrics
  let clearCount = 0;
  let blockedCount = 0;
  let atRiskCount = 0;
  let totalOpenRequirements = 0;
  let criticalOpenCount = 0;

  for (const prog of programmes) {
    if (prog.gateReadinessStatus === 'clear')   clearCount++;
    if (prog.gateReadinessStatus === 'blocked')  blockedCount++;
    if (prog.gateReadinessStatus === 'at_risk')  atRiskCount++;

    for (const req of prog.requirements) {
      if (req.status !== 'met') {
        totalOpenRequirements++;
        if (req.urgency === 'critical') criticalOpenCount++;
      }
    }
  }

  const metrics: GateReadinessMetrics = {
    totalProgrammes: programmes.length,
    clearCount,
    blockedCount,
    atRiskCount,
    totalOpenRequirements,
    criticalOpenCount,
  };

  return {
    programmes,
    metrics,
    atlasSummary:
      'Gate readiness analysis shows 2 programmes blocked by active contradictions and 1 at risk ahead of pilot. ' +
      'Demand Forecasting is the sole programme with a clear path to its next gate. ' +
      'Contact Center AI and CDP both carry critical-urgency open requirements on the engagement critical path — ' +
      'contradiction resolution is the gating dependency in both cases. ' +
      'Store Associate Productivity can advance if KPI baseline contradiction is resolved and second pilot store confirmed.',
    deterministicSeed: true,
  };
}
