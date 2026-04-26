/**
 * QA23: Wave-16 Source Commercial Route Smoke Verification
 *
 * Manifest-driven verification lib for Wave-16 commercial route components.
 * Pure TypeScript — no runtime dependencies, no file I/O, no live API calls.
 */

export interface RouteDescriptor {
  routeId: string;
  filePath: string; // relative from src/
  description: string;
  expectedExports: string[];
  waveAdded: string;
  isModification: boolean; // true if modifying existing file, false if new
}

export interface ComponentDescriptor {
  componentId: string;
  filePath: string; // relative from src/
  componentName: string;
  waveAdded: string;
  isNew: boolean;
}

export interface LibDescriptor {
  libId: string;
  filePath: string; // relative from src/
  mainExport: string;
  waveAdded: string;
}

export interface Wave16RouteSmokeReport {
  waveId: string;
  routes: RouteDescriptor[];
  wave16Components: ComponentDescriptor[];
  wave15Components: ComponentDescriptor[];
  wave16Libs: LibDescriptor[];
  deterministicDataClaim: string;
  noLiveDataClaim: string;
  generatedAt: string;
}

export const WAVE16_ROUTE_DESCRIPTORS: RouteDescriptor[] = [
  {
    routeId: 'SOURCE_ROOT',
    filePath: 'app/(maestro)/source/page.tsx',
    description: 'Source module root page — renders SourceCommercialHub with all commercial intelligence panels.',
    expectedExports: ['default'],
    waveAdded: 'wave-15',
    isModification: false,
  },
  {
    routeId: 'SOURCE_EVENTS_LIST',
    filePath: 'app/(maestro)/source/events/page.tsx',
    description: 'Source events list page — displays active commercial events and negotiation milestones.',
    expectedExports: ['default'],
    waveAdded: 'wave-15',
    isModification: false,
  },
  {
    routeId: 'SOURCE_EVENT_DETAIL',
    filePath: 'app/(maestro)/source/events/[eventId]/page.tsx',
    description:
      'Source event detail page — deep-dive view for a single commercial event. Wave-16 SRC27 adds SourceCommercialEventSection.',
    expectedExports: ['default'],
    waveAdded: 'wave-15',
    isModification: true,
  },
];

export const WAVE16_COMPONENT_DESCRIPTORS: ComponentDescriptor[] = [
  {
    componentId: 'SRC27',
    filePath: 'components/source/SourceCommercialEventSection.tsx',
    componentName: 'SourceCommercialEventSection',
    waveAdded: 'wave-16',
    isNew: true,
  },
  {
    componentId: 'SRC29_COMPONENT',
    filePath: 'components/source/SourceCommercialExecutiveBrief.tsx',
    componentName: 'SourceCommercialExecutiveBrief',
    waveAdded: 'wave-16',
    isNew: true,
  },
  {
    componentId: 'SRC30_COMPONENT',
    filePath: 'components/source/SourceCommercialActionQueue.tsx',
    componentName: 'SourceCommercialActionQueue',
    waveAdded: 'wave-16',
    isNew: true,
  },
];

export const WAVE16_LIB_DESCRIPTORS: LibDescriptor[] = [
  {
    libId: 'SRC28',
    filePath: 'lib/source/source-commercial-demo-scenario.ts',
    mainExport: 'buildCommercialDemoScenario',
    waveAdded: 'wave-16',
  },
  {
    libId: 'SRC29_LIB',
    filePath: 'lib/source/source-commercial-executive-brief.ts',
    mainExport: 'buildCommercialExecutiveBriefProps',
    waveAdded: 'wave-16',
  },
  {
    libId: 'SRC30_LIB',
    filePath: 'lib/source/source-commercial-action-queue.ts',
    mainExport: 'buildCommercialActionQueueProps',
    waveAdded: 'wave-16',
  },
];

/** Wave-15 components that must already exist in main (used by integration checks). */
export const WAVE15_EXISTING_COMPONENTS: ComponentDescriptor[] = [
  {
    componentId: 'SRC26',
    filePath: 'components/source/SourceCommercialHub.tsx',
    componentName: 'SourceCommercialHub',
    waveAdded: 'wave-15',
    isNew: false,
  },
  {
    componentId: 'SRC19',
    filePath: 'components/source/SourceCommercialSummarySurface.tsx',
    componentName: 'SourceCommercialSummarySurface',
    waveAdded: 'wave-15',
    isNew: false,
  },
  {
    componentId: 'SRC22',
    filePath: 'components/source/SourceCommercialRiskPanel.tsx',
    componentName: 'SourceCommercialRiskPanel',
    waveAdded: 'wave-15',
    isNew: false,
  },
  {
    componentId: 'SRC23',
    filePath: 'components/source/SourceCommercialReadinessView.tsx',
    componentName: 'SourceCommercialReadinessView',
    waveAdded: 'wave-15',
    isNew: false,
  },
  {
    componentId: 'SRC24',
    filePath: 'components/source/SourceCommercialMissionsPanel.tsx',
    componentName: 'SourceCommercialMissionsPanel',
    waveAdded: 'wave-15',
    isNew: false,
  },
  {
    componentId: 'SRC25',
    filePath: 'components/source/SourceCommercialSignalsPreview.tsx',
    componentName: 'SourceCommercialSignalsPreview',
    waveAdded: 'wave-15',
    isNew: false,
  },
];

export function buildWave16RouteSmokeReport(): Wave16RouteSmokeReport {
  return {
    waveId: 'wave-16',
    routes: WAVE16_ROUTE_DESCRIPTORS,
    wave16Components: WAVE16_COMPONENT_DESCRIPTORS,
    wave15Components: WAVE15_EXISTING_COMPONENTS,
    wave16Libs: WAVE16_LIB_DESCRIPTORS,
    deterministicDataClaim:
      'All Wave-16 commercial components use deterministic seed data. No live vendor data ingestion.',
    noLiveDataClaim:
      'No live API calls, model invocations, or runtime agent operations are made by Wave-16 components.',
    generatedAt: '2026-04-26',
  };
}
