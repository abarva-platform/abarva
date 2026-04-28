// ADM8 · Agent Readiness Deep Drill
// Deterministic readiness inventory for all four AbarVa agents: Nexus, Sentinel, Atlas, Steward.
// Captures readiness factors, blockers, and next actions per agent plus system-level dimensions.
// NO model calls · NO DB writes · NO 'use client' · NO React

export type AgentReadinessLevel = 'ready' | 'partial' | 'deferred' | 'blocked'

export interface AgentReadinessFactor {
  factor: string
  status: AgentReadinessLevel
  note: string
}

export interface AgentReadinessRecord {
  agentId: string
  agentName: string
  missionType: string
  readinessLevel: AgentReadinessLevel
  factors: AgentReadinessFactor[]
  blockers: string[]
  nextAction: string
}

export interface AgentReadinessDeepDrill {
  generatedAt: string                    // hardcoded '2026-04-26'
  deterministicSourceCaption: string     // always 'Static manifest — not live agent execution'
  agents: AgentReadinessRecord[]
  missionQueueReadiness: AgentReadinessLevel
  contextReadiness: AgentReadinessLevel
  evidenceReadiness: AgentReadinessLevel
  modelGatewayReadiness: AgentReadinessLevel
  toolRegistryReadiness: AgentReadinessLevel
  overallReadiness: AgentReadinessLevel
  topBlockers: string[]
  nextAction: string
}

export function buildAgentReadinessDeepDrill(): AgentReadinessDeepDrill {
  const agents: AgentReadinessRecord[] = [
    {
      agentId: 'nexus',
      agentName: 'Nexus',
      missionType: 'orchestration',
      readinessLevel: 'partial',
      factors: [
        {
          factor: 'mission_queue',
          status: 'partial',
          note: 'Deterministic AG10 mission queue is in place; live queue wiring is deferred.',
        },
        {
          factor: 'context_injection',
          status: 'partial',
          note: 'CTX2/CTX3 context builder is wired; evidence and datasets sections remain seed-only.',
        },
        {
          factor: 'output_schema',
          status: 'ready',
          note: 'Output schema is defined and tested via deterministic read models.',
        },
        {
          factor: 'audit_trail',
          status: 'partial',
          note: 'TOOL3 audit read model exists; live audit ledger write path is deferred.',
        },
      ],
      blockers: [
        'Live mission queue not wired',
        'Context injection uses seed data only',
      ],
      nextAction:
        'Wire live mission queue; replace seed context with real data ingestion',
    },
    {
      agentId: 'sentinel',
      agentName: 'Sentinel',
      missionType: 'intelligence',
      readinessLevel: 'partial',
      factors: [
        {
          factor: 'pattern_library',
          status: 'ready',
          note: 'Sentinel pattern detection read model (I1) is complete with full pattern catalog.',
        },
        {
          factor: 'evidence_integration',
          status: 'partial',
          note: 'Evidence ledger (EVID2) exists; integration uses seed manifest only, not live ingested datasets.',
        },
        {
          factor: 'rail_checks',
          status: 'ready',
          note: 'SentinelPatternRail is mounted and passes deterministic pattern checks.',
        },
        {
          factor: 'confidence_scoring',
          status: 'deferred',
          note: 'Confidence scoring is modeled but not wired to live evidence or model outputs.',
        },
      ],
      blockers: [
        'Evidence integration uses seed manifest only',
      ],
      nextAction:
        'Connect evidence ledger to real ingested datasets',
    },
    {
      agentId: 'atlas',
      agentName: 'Atlas',
      missionType: 'cost-value',
      readinessLevel: 'partial',
      factors: [
        {
          factor: 'cost_consumption',
          status: 'ready',
          note: 'ACT6 AI cost consumption read model is complete with deterministic cost signals.',
        },
        {
          factor: 'value_ledger',
          status: 'deferred',
          note: 'Value outcome ledger (ACT4) is scaffolded; value ledger slice not complete.',
        },
        {
          factor: 'productivity_signals',
          status: 'partial',
          note: 'ACT7 DORA productivity read model is in place; live DORA metric ingestion is deferred.',
        },
      ],
      blockers: [
        'Value ledger slice not complete',
      ],
      nextAction:
        'Complete value ledger slice; add DORA metrics integration',
    },
    {
      agentId: 'steward',
      agentName: 'Steward',
      missionType: 'governance',
      readinessLevel: 'partial',
      factors: [
        {
          factor: 'dataset_trust',
          status: 'ready',
          note: 'TRUST1 dataset trust model and TRUST2 agent data access policy matrix are complete.',
        },
        {
          factor: 'approval_workflow',
          status: 'ready',
          note: 'TRUST3 dataset approval workflow read model covers 11 states and 5 reviewer roles.',
        },
        {
          factor: 'access_policy',
          status: 'ready',
          note: 'TRUST2 access policy matrix is complete for all four agents across all sharing levels.',
        },
        {
          factor: 'deployment_pipeline',
          status: 'blocked',
          note: 'CI integration is not in place; Vercel health check not wired.',
        },
      ],
      blockers: [
        'Deployment pipeline readiness blocked — no CI integration',
      ],
      nextAction:
        'Complete CI integration; wire Vercel health check',
    },
  ]

  // Collect top 3 real blockers across all agents
  const allBlockers = agents.flatMap((a) => a.blockers)
  const topBlockers = allBlockers.slice(0, 3)

  return {
    generatedAt: '2026-04-26',
    deterministicSourceCaption: 'Static manifest — not live agent execution',
    agents,
    missionQueueReadiness: 'partial',
    contextReadiness: 'partial',
    evidenceReadiness: 'partial',
    modelGatewayReadiness: 'partial',
    toolRegistryReadiness: 'partial',
    overallReadiness: 'partial',
    topBlockers,
    nextAction:
      'Wire live mission queue and evidence ingestion for Nexus and Sentinel; complete value ledger for Atlas; complete CI integration for Steward.',
  }
}
