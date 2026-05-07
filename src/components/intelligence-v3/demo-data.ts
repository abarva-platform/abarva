// Intelligence v3 · First Capital Financial worked example.
//
// Hardcoded demo content matching the v3 wireframe
// (docs/design-canon/wireframe-intelligence-v3-2026-05-07.html).
// In a follow-up wave, this data is sourced from the AgentContextBroker
// per tenant context. For now: a fixture that matches the wireframe,
// so the surface can be reviewed against the spec.

import type { IntelligenceV3PageData } from './types';

export const FIRST_CAPITAL_DEMO: IntelligenceV3PageData = {
  tenantName: 'First Capital Financial',
  industry: 'Banking',
  refreshedLabel: '14m ago',
  stats: {
    patterns: 5,
    contradictions: 2,
    syntheses: 1,
  },
  substrate: {
    tenantLoaded: 12,
    tenantTotal: 23,
    corpus: { failureModes: 10, patternRecords: 17, researchAnchors: 30 },
  },
  aiTrajectory: {
    headline: 'AI trajectory · regional banking',
    body: '80% of programs are front-office. Middle office underweight. SR 11-7 tightening.',
  },
  pressureCards: [
    {
      severity: 'HIGH',
      title: 'NIM compression',
      body: '14bp/qtr × 3 consecutive quarters; rate-of-change has more than doubled vs FY2024.',
    },
    {
      severity: 'MEDIUM',
      title: 'CDO–CIO conflict',
      body: 'Unresolved across 3 quarters; named in 4 of 6 active programs; no CEO arbitration recorded.',
    },
    {
      severity: 'WATCH',
      title: 'Innovaccer renewal',
      body: 'Renewal closes in 8 months. Same vendor profile factors as the 2023 platform consolidation.',
    },
  ],
  conversationContext: {
    activeThread: 'NIM trend → Move shapes',
    layerFocus: 'Decision Layer',
  },
  artOfThePossible: [
    {
      key: 'experience',
      name: 'Experience Layer',
      parenthetical: 'Front Office',
      gating: 'Customer experience reshaped',
      moves: [
        {
          id: 'mv-conversational-banking',
          name: 'Conversational banking pilot',
          rationale: 'CRO priority alignment',
        },
        {
          id: 'mv-branch-advisor',
          name: 'Branch advisor support',
          rationale: 'Productivity below peer median',
        },
      ],
    },
    {
      key: 'decision',
      name: 'Decision Layer',
      parenthetical: 'Middle Office',
      gating: 'Decisions get faster, evidence-grounded',
      focused: true,
      moves: [
        {
          id: 'mv-credit-decisioning',
          name: 'Credit decisioning modernization',
          rationale: 'Surfaced in this thread',
          surfaceState: 'surfaced-in-thread',
        },
        {
          id: 'mv-deposit-pricing',
          name: 'Deposit pricing optimization',
          rationale: 'Newly surfaced',
          surfaceState: 'newly-surfaced',
        },
        {
          id: 'mv-model-risk-gov',
          name: 'Model risk governance',
          rationale: 'CDO–CIO conflict',
        },
      ],
    },
    {
      key: 'operations',
      name: 'Operations Layer',
      parenthetical: 'Back Office',
      gating: 'Operations approach lower marginal cost',
      moves: [
        {
          id: 'mv-control-monitoring',
          name: 'Continuous control monitoring',
          rationale: 'SR 11-7 expects',
        },
        {
          id: 'mv-vendor-risk',
          name: 'Vendor risk monitoring',
          rationale: 'Innovaccer pattern',
        },
      ],
    },
  ],
  whatWeCantSee: ['EBITDA attribution', 'Peer NIM benchmark depth'],
  sentinelOpener:
    "Three things matter for First Capital today: NIM compression accelerating, CDO–CIO conflict unresolved, Innovaccer renewal in 8 months. Ask me anything you see on this page.",
  conversation: [
    {
      role: 'user',
      text: 'Tell me more about the NIM trend',
    },
    {
      role: 'agent',
      text: '14bp/quarter for 3 consecutive quarters. Started Q3 2024 — coincides with Fed pause and your deposit-mix shift toward higher-cost CDs. Two of your 8 named peers show similar acceleration; the other 6 do not.',
      refs: ['KPI History', 'Peer Benchmarks'],
    },
    {
      role: 'user',
      text: 'What can we do about it?',
    },
    {
      role: 'agent',
      text: 'Three Move shapes are plausible. Decisioning modernization has the strongest evidence basis given portfolio composition and AI trajectory.',
      refs: ['AI Trajectory', 'Decision Traces'],
      hasExpand: true,
    },
  ],
};
