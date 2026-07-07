// Intelligence v3 · First Capital Financial worked example.
//
// Hardcoded demo content matching the v3 wireframe
// (docs/design-canon/wireframe-intelligence-v3-2026-05-07.html).
// In a follow-up wave, this data is sourced from the AgentContextBroker
// per tenant context. For now: a fixture that matches the wireframe,
// so the surface can be reviewed against the spec.

import type { ArtOfPossibleData, IntelligenceV3PageData } from './types';

// Meridian Health · Art of Possible · honest-asymmetry band fixture
// (PR-K2.3). Reads as the portfolio actually is, not artificially
// balanced: workforce heavy, margin thin, clinical empty (whitespace),
// foundation blocking via MH-07. Replaces the prior 4-column kanban
// that misled CXOs into thinking every category was filled.
export const MERIDIAN_AOP_DEMO: ArtOfPossibleData = {
  totalPossibleLabel: '$60–150M possible',
  totalCapturingLabel: '~$13M (~12%)',
  cxoFrame:
    "You're capturing ~12% of what's possible. Workforce is heavy · clinical is whitespace · MH-07 is the unlock for everything downstream.",
  bands: [
    {
      key: 'workforce',
      label: 'Workforce productivity',
      tone: 'heavy',
      possibleUsd: '$18–28M',
      capturingUsd: '$8.4M',
      segments: { inFlight: 56, candidate: 18, risk: 6, empty: 20 },
      verdict: 'Over-indexed · 3 active',
    },
    {
      key: 'margin',
      label: 'Margin · revenue cycle',
      tone: 'thin',
      possibleUsd: '$14–32M',
      capturingUsd: '$3.1M',
      segments: { inFlight: 18, candidate: 24, risk: 8, empty: 50 },
      verdict: 'Single-point dependency',
    },
    {
      key: 'clinical',
      label: 'Clinical care · ambient AI',
      tone: 'gap',
      possibleUsd: '$20–62M',
      capturingUsd: '$0',
      segments: { inFlight: 0, candidate: 22, risk: 0, empty: 78 },
      verdict: 'Largest gap · zero in flight',
      blocker: 'MH-07 (foundation) blocks clinical AI',
    },
    {
      key: 'foundation',
      label: 'Foundation · data + identity',
      tone: 'foundation',
      possibleUsd: '$8–28M',
      capturingUsd: '$1.5M',
      segments: { inFlight: 32, candidate: 12, risk: 26, empty: 30 },
      verdict: '2 active · MH-07 at risk',
      blocker: 'MH-07 slip cascades into clinical',
    },
  ],
};

export const EMPTY_AOP_DEMO: ArtOfPossibleData = {
  totalPossibleLabel: 'Not loaded',
  totalCapturingLabel: 'Not loaded',
  cxoFrame:
    'Tenant-specific Art of Possible data has not been loaded yet. AbarVa will not borrow another client fixture to fill this surface.',
  bands: [],
};

export const APEX_RETAIL_AOP_DEMO: ArtOfPossibleData = {
  totalPossibleLabel: '$72-180M possible',
  totalCapturingLabel: '~$18M (~16%)',
  cxoFrame:
    "Apex is capturing a small slice of the retail AI opportunity. Customer growth is active, merchandising margin is thin, store operations need adoption proof, and data/platform ownership is the unlock.",
  bands: [
    {
      key: 'customer-growth',
      label: 'Customer growth + loyalty',
      tone: 'heavy',
      possibleUsd: '$18-44M',
      capturingUsd: '$7.2M',
      segments: { inFlight: 38, candidate: 24, risk: 18, empty: 20 },
      verdict: 'Active · ownership split',
      blocker: 'CMO owns loyalty, IT owns CDP',
    },
    {
      key: 'merch-margin',
      label: 'Merchandising margin',
      tone: 'thin',
      possibleUsd: '$20-52M',
      capturingUsd: '$4.8M',
      segments: { inFlight: 22, candidate: 30, risk: 10, empty: 38 },
      verdict: 'Thin · data dependent',
      blocker: 'Item-location history not audit-ready',
    },
    {
      key: 'store-ops',
      label: 'Store productivity + shrink',
      tone: 'gap',
      possibleUsd: '$16-38M',
      capturingUsd: '$2.6M',
      segments: { inFlight: 12, candidate: 28, risk: 20, empty: 40 },
      verdict: 'Whitespace · adoption risk',
      blocker: 'Intervention protocol missing',
    },
    {
      key: 'supply-chain',
      label: 'Supply chain resilience',
      tone: 'thin',
      possibleUsd: '$12-30M',
      capturingUsd: '$2.1M',
      segments: { inFlight: 18, candidate: 34, risk: 8, empty: 40 },
      verdict: 'Candidate-rich',
    },
    {
      key: 'foundation',
      label: 'Data + platform foundation',
      tone: 'foundation',
      possibleUsd: '$6-16M',
      capturingUsd: '$1.3M',
      segments: { inFlight: 26, candidate: 18, risk: 30, empty: 26 },
      verdict: 'Binding constraint',
      blocker: 'Integration-hub decision unresolved',
    },
  ],
};

export const FIRST_CAPITAL_AOP_DEMO: ArtOfPossibleData = {
  totalPossibleLabel: '$45-110M possible',
  totalCapturingLabel: '~$9M (~14%)',
  cxoFrame:
    'First Capital is under-capturing the banking AI opportunity. Payments and model-risk controls are the binding moves; digital acquisition and AML automation become safer after the control plane is credible.',
  bands: [
    {
      key: 'payments',
      label: 'Payments + commercial retention',
      tone: 'heavy',
      possibleUsd: '$12-30M',
      capturingUsd: '$2.4M',
      segments: { inFlight: 18, candidate: 42, risk: 22, empty: 18 },
      verdict: 'Highest urgency',
      blocker: 'Core API layer and payment-ops ownership',
    },
    {
      key: 'risk-controls',
      label: 'Model risk + compliance',
      tone: 'foundation',
      possibleUsd: '$8-24M',
      capturingUsd: '$1.8M',
      segments: { inFlight: 32, candidate: 20, risk: 28, empty: 20 },
      verdict: 'Binding control plane',
      blocker: 'SR 11-7 evidence and model inventory',
    },
    {
      key: 'digital-growth',
      label: 'Digital acquisition + service',
      tone: 'thin',
      possibleUsd: '$10-26M',
      capturingUsd: '$2.1M',
      segments: { inFlight: 24, candidate: 30, risk: 12, empty: 34 },
      verdict: 'Attractive but sequenced',
      blocker: 'Identity proofing and application-state data',
    },
    {
      key: 'operations',
      label: 'AML + back-office productivity',
      tone: 'gap',
      possibleUsd: '$15-30M',
      capturingUsd: '$2.7M',
      segments: { inFlight: 16, candidate: 34, risk: 18, empty: 32 },
      verdict: 'Control-dependent',
      blocker: 'Explainability and exception workflow',
    },
  ],
};

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
      // L13 fix (2026-05-13): Innovaccer is a healthcare-only vendor;
      // First Capital's renewal watchlist should anchor on the bank's
      // core platform vendor instead.
      title: 'FIS HORIZON renewal',
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
          // L13 fix (2026-05-13): rationale used "Innovaccer" (healthcare
          // vendor). Anchor to the bank's actual concentration risk.
          rationale: 'Core-vendor concentration',
        },
      ],
    },
  ],
  whatWeCantSee: ['EBITDA attribution', 'Peer NIM benchmark depth'],
  // L12 fix (2026-05-13): the opener for First Capital's demo named
  // "Innovaccer renewal" as one of the three things that matter today —
  // Innovaccer is a healthcare-only vendor and has no business surfacing
  // on a bank's Sentinel surface. Anchor to the bank's actual core
  // platform renewal.
  sentinelOpener:
    "Three things matter for First Capital today: NIM compression accelerating, CDO–CIO conflict unresolved, FIS HORIZON renewal in 8 months. Ask me anything you see on this page.",
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
