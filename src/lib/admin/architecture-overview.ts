// ── Architecture Overview data builder ────────────────────────────────────────
// Pure TypeScript: no React, no file I/O, no Date.now, no Math.random.
// All data is deterministic static seed.

export interface ArchitectureLayer {
  layerId: string;
  name: string;
  description: string;
  keyModules: string[];
  waveRange: string;
}

export interface ArchitectureWaveSummary {
  waveId: string;
  title: string;
  status: string;
  sliceCount: number;
  percentComplete: number;
}

export interface ArchitectureOverviewData {
  systemName: string;
  buildDate: string;
  totalWaves: number;
  mergedWaves: number;
  totalSlices: number;
  layers: ArchitectureLayer[];
  waveSummaries: ArchitectureWaveSummary[];
  generatedAt: string;
  caveat: string;
}

const LAYERS: ArchitectureLayer[] = [
  {
    layerId: 'foundation',
    name: 'Foundation',
    description: 'Auth, DB schema, routing',
    keyModules: ['clerk', 'drizzle', 'next.js'],
    waveRange: 'Wave 0–2',
  },
  {
    layerId: 'rfp-core',
    name: 'RFP Core',
    description: 'RFP lifecycle, stages, gates, decisions',
    keyModules: ['lifecycle', 'queries', 'types'],
    waveRange: 'Wave 3–5',
  },
  {
    layerId: 'agent-intelligence',
    name: 'Agent Intelligence',
    description: 'Multi-agent briefings, validation, missions',
    keyModules: ['agent-validation', 'agent-missions', 'multi-agent-briefing'],
    waveRange: 'Wave 6–9',
  },
  {
    layerId: 'commercial-intelligence',
    name: 'Commercial Intelligence',
    description: 'Pricing normalization, BAFO, risk detection, signals',
    keyModules: [
      'pricing-normalization-model',
      'bafo-negotiation-model',
      'commercial-risk-detection',
      'control-tower-signals',
    ],
    waveRange: 'Wave 10–14',
  },
  {
    layerId: 'commercial-ui',
    name: 'Commercial UI',
    description: 'Surface components for commercial intelligence',
    keyModules: [
      'SourceCommercialHub',
      'SourcePricingComparisonPanel',
      'SourceCommercialRiskPanel',
    ],
    waveRange: 'Wave 15',
  },
  {
    layerId: 'admin-ops',
    name: 'Admin & Ops',
    description: 'CI hygiene gate, architecture overview, QA verification',
    keyModules: ['hygiene_gate.sh', 'ArchitectureOverviewPage'],
    waveRange: 'Wave 13–15',
  },
];

const WAVE_SUMMARIES: ArchitectureWaveSummary[] = [
  {
    waveId: 'wave-0',
    title: 'Agentic Spine Foundation',
    status: 'merged',
    sliceCount: 39,
    percentComplete: 98,
  },
  {
    waveId: 'wave-1',
    title: 'Runtime Safety + Agent Mission + Context/Evidence Backbone',
    status: 'merged',
    sliceCount: 13,
    percentComplete: 100,
  },
  {
    waveId: 'wave-2',
    title: 'AI Control Tower + Intelligence Depth',
    status: 'merged',
    sliceCount: 19,
    percentComplete: 100,
  },
  {
    waveId: 'wave-3',
    title: 'Enterprise SaaS + Data Trust + Deployment Foundations',
    status: 'merged',
    sliceCount: 15,
    percentComplete: 100,
  },
  {
    waveId: 'wave-4',
    title: 'Program Continuity + Deliverable Loop',
    status: 'merged',
    sliceCount: 9,
    percentComplete: 100,
  },
  {
    waveId: 'wave-5',
    title: 'Solution-to-Workshop / Architecture Canvas',
    status: 'merged',
    sliceCount: 8,
    percentComplete: 100,
  },
  {
    waveId: 'wave-6',
    title: 'Production Hardening / Route Smoke / Persona Crawler',
    status: 'merged',
    sliceCount: 5,
    percentComplete: 100,
  },
  {
    waveId: 'wave-7',
    title: 'Private Azure/GCP Deployment Lab',
    status: 'planned',
    sliceCount: 0,
    percentComplete: 0,
  },
  {
    waveId: 'wave-8',
    title: 'Build Operations Hardening',
    status: 'merged',
    sliceCount: 8,
    percentComplete: 100,
  },
  {
    waveId: 'wave-9',
    title: 'Pattern Library + Quality Governance',
    status: 'merged',
    sliceCount: 5,
    percentComplete: 100,
  },
  {
    waveId: 'wave-10',
    title: 'Final Hardening',
    status: 'merged',
    sliceCount: 5,
    percentComplete: 100,
  },
  {
    waveId: 'wave-11',
    title: 'Demo Readiness + Architecture Overview',
    status: 'merged',
    sliceCount: 6,
    percentComplete: 100,
  },
  {
    waveId: 'wave-12',
    title: 'Product Polish + Azure Private Data Plane Prep',
    status: 'merged',
    sliceCount: 9,
    percentComplete: 100,
  },
  {
    waveId: 'wave-13',
    title: 'Live Demo Validation + Hygiene Enforcement',
    status: 'merged',
    sliceCount: 8,
    percentComplete: 100,
  },
  {
    waveId: 'wave-14',
    title: 'Source Commercial Intelligence + Pricing Hardening',
    status: 'merged',
    sliceCount: 10,
    percentComplete: 100,
  },
  {
    waveId: 'wave-15',
    title: 'Source Commercial UI + Architecture Page',
    status: 'in_progress',
    sliceCount: 10,
    percentComplete: 10,
  },
];

export function buildArchitectureOverview(): ArchitectureOverviewData {
  const mergedWaves = WAVE_SUMMARIES.filter(w => w.status === 'merged').length;

  return {
    systemName: 'Nexus',
    buildDate: '2026-04-26',
    totalWaves: WAVE_SUMMARIES.length,
    mergedWaves,
    totalSlices: 176,
    layers: LAYERS,
    waveSummaries: WAVE_SUMMARIES,
    generatedAt: '2026-04-26',
    caveat:
      'Static deterministic snapshot. Slice counts and percentages reflect the build manifest at 2026-04-26; live progress is tracked in docs/build/build-waves.json.',
  };
}
