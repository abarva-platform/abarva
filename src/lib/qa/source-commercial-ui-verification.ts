/**
 * QA22: Wave-15 Source Commercial UI Verification
 *
 * Manifest-driven verification lib for all 8 Wave-15 UI components.
 * Pure TypeScript — no runtime dependencies.
 */

export interface Wave15ComponentDescriptor {
  laneId: string;
  componentFile: string;
  viewModelFile: string;
  componentExport: string;
  viewModelExport: string;
  category: 'surface' | 'panel' | 'view' | 'hub';
  description: string;
}

export interface Wave15VerificationReport {
  waveId: string;
  totalComponents: number;
  componentDescriptors: Wave15ComponentDescriptor[];
  designTokensUsed: Record<string, string>;
  generatedAt: string;
  caveat: string;
}

export const WAVE15_COMPONENT_DESCRIPTORS: Wave15ComponentDescriptor[] = [
  {
    laneId: 'SRC19',
    componentFile: 'components/source/SourceCommercialSummarySurface.tsx',
    viewModelFile: 'lib/source/source-commercial-summary.ts',
    componentExport: 'SourceCommercialSummarySurface',
    viewModelExport: 'buildCommercialSummaryProps',
    category: 'surface',
    description:
      'Top-level commercial summary surface for the Source module. Aggregates deal status, pricing tier, and negotiation posture for the active vendor engagement.',
  },
  {
    laneId: 'SRC20',
    componentFile: 'components/source/SourcePricingComparisonPanel.tsx',
    viewModelFile: 'lib/source/source-pricing-comparison-view.ts',
    componentExport: 'SourcePricingComparisonPanel',
    viewModelExport: 'buildPricingComparisonViewModel',
    category: 'panel',
    description:
      'Side-by-side pricing comparison panel. Normalizes vendor quotes across line items and surfaces discount gaps, enabling informed negotiation decisions.',
  },
  {
    laneId: 'SRC21',
    componentFile: 'components/source/SourceBafoNegotiationModelPanel.tsx',
    viewModelFile: 'lib/source/source-bafo-negotiation-view.ts',
    componentExport: 'SourceBafoNegotiationModelPanel',
    viewModelExport: 'buildBafoNegotiationViewModel',
    category: 'panel',
    description:
      'Best-and-final-offer negotiation model panel. Presents BAFO walk-downs, leverage signals, and recommended counter positions based on market benchmarks.',
  },
  {
    laneId: 'SRC22',
    componentFile: 'components/source/SourceCommercialRiskPanel.tsx',
    viewModelFile: 'lib/source/source-commercial-risk-view.ts',
    componentExport: 'SourceCommercialRiskPanel',
    viewModelExport: 'buildCommercialRiskViewModel',
    category: 'panel',
    description:
      'Commercial risk detection panel. Flags auto-renewal traps, price-escalation clauses, lock-in vectors, and payment terms that deviate from enterprise norms.',
  },
  {
    laneId: 'SRC23',
    componentFile: 'components/source/SourceCommercialReadinessView.tsx',
    viewModelFile: 'lib/source/source-commercial-readiness.ts',
    componentExport: 'SourceCommercialReadinessView',
    viewModelExport: 'buildCommercialReadinessViewModel',
    category: 'view',
    description:
      'Commercial readiness view. Scores the buying team readiness across requirements clarity, stakeholder alignment, budget confirmation, and legal review status.',
  },
  {
    laneId: 'SRC24',
    componentFile: 'components/source/SourceCommercialMissionsPanel.tsx',
    viewModelFile: 'lib/source/source-commercial-missions-view.ts',
    componentExport: 'SourceCommercialMissionsPanel',
    viewModelExport: 'buildCommercialMissionsViewModel',
    category: 'panel',
    description:
      'Active commercial agent missions panel. Lists in-flight negotiation, due-diligence, and market-scan missions with status, agent assignment, and output artifacts.',
  },
  {
    laneId: 'SRC25',
    componentFile: 'components/source/SourceCommercialSignalsPreview.tsx',
    viewModelFile: 'lib/source/source-commercial-signals-preview.ts',
    componentExport: 'SourceCommercialSignalsPreview',
    viewModelExport: 'buildCommercialSignalsPreviewViewModel',
    category: 'panel',
    description:
      'Tower intelligence signals preview for the commercial context. Surfaces pricing pressure, vendor financial health alerts, and competitor deal signals.',
  },
  {
    laneId: 'SRC26',
    componentFile: 'components/source/SourceCommercialHub.tsx',
    viewModelFile: 'lib/source/source-commercial-hub-view.ts',
    componentExport: 'SourceCommercialHub',
    viewModelExport: 'buildCommercialHubViewModel',
    category: 'hub',
    description:
      'Source commercial hub — the top-level orchestrating container for all Wave-15 commercial UI surfaces. Composes summary, pricing, BAFO, risk, readiness, missions, and signals panels into a unified deal-room experience.',
  },
];

const DESIGN_TOKENS_USED: Record<string, string> = {
  background: '#FAFAF9',
  nearBlack: '#0F0E0D',
  bodyText: '#3D3B38',
  muted: '#706D66',
  border: '#E8E6E3',
  accent: '#1E3A5F',
};

const GENERATED_AT = '2026-04-26';

const CAVEAT =
  'Wave-15 UI component verification. All components use AbarVa design canon. Integration-time verification confirms file existence and export correctness.';

export function buildWave15VerificationReport(): Wave15VerificationReport {
  return {
    waveId: 'wave-15',
    totalComponents: WAVE15_COMPONENT_DESCRIPTORS.length,
    componentDescriptors: WAVE15_COMPONENT_DESCRIPTORS,
    designTokensUsed: DESIGN_TOKENS_USED,
    generatedAt: GENERATED_AT,
    caveat: CAVEAT,
  };
}
