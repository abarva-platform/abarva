/**
 * QA25: Wave-18 Program Flagship E2E Verification Manifest
 *
 * Manifest-driven verification lib for the Program Flagship experience.
 * Tracks the five PROG10–PROG14 component lanes (shell, phase-gate, workshop,
 * deliverables, actions), the nine workflow sections the page must answer,
 * the canonical Program detail route, and the design canon rules
 * (no teal, no neon, no cyber bg) the flagship must respect.
 *
 * Pure TypeScript. Manifest-driven. No file IO at import time.
 *
 * The companion test suite uses this manifest in two modes:
 * - Static manifest (always green) — descriptor counts, lane coverage,
 *   workflow shape, generatedAt stamp.
 * - Integration-phase (graceful skip) — file existence and source-content
 *   scans that pass-through when the lane files are absent (lane worktree)
 *   and assert when the lane files are present (integration branch).
 */

export interface ProgramFlagshipComponentDescriptor {
  laneId: string;
  componentFile: string;
  viewModelFile?: string;
  componentExport: string;
  viewModelExport?: string;
  category: 'shell' | 'phase-gate' | 'workshop' | 'deliverables' | 'actions';
  description: string;
}

export interface ProgramFlagshipWorkflowAnchor {
  pageQuestion: string;
  primaryAgent: 'nexus';
  workflowSections: string[];
}

export interface ProgramFlagshipDesignCanonRule {
  rule: string;
  expectedAbsent: string[];
}

export interface ProgramFlagshipVerificationReport {
  waveId: 'wave-18';
  components: ProgramFlagshipComponentDescriptor[];
  workflowAnchor: ProgramFlagshipWorkflowAnchor;
  routeFilePath: string;
  designCanonRules: ProgramFlagshipDesignCanonRule[];
  generatedAt: string;
  caveat: string;
}

export const PROGRAM_FLAGSHIP_COMPONENTS: ProgramFlagshipComponentDescriptor[] =
  [
    {
      laneId: 'PROG10',
      componentFile: 'src/components/programs/ProgramFlagshipPage.tsx',
      viewModelFile: 'src/lib/programs/program-flagship-view.ts',
      componentExport: 'ProgramFlagshipPage',
      viewModelExport: 'buildProgramFlagshipView',
      category: 'shell',
      description:
        'Program flagship page shell with executive brief, workflow orientation, slot props',
    },
    {
      laneId: 'PROG11',
      componentFile: 'src/components/programs/PhaseGateCanvas.tsx',
      viewModelFile: 'src/lib/programs/phase-gate-canvas-view.ts',
      componentExport: 'PhaseGateCanvas',
      viewModelExport: 'buildPhaseGateCanvasView',
      category: 'phase-gate',
      description: '6-phase journey rail + current gate canvas',
    },
    {
      laneId: 'PROG12',
      componentFile: 'src/components/programs/NexusWorkshopCanvas.tsx',
      viewModelFile: 'src/lib/programs/nexus-workshop-canvas-view.ts',
      componentExport: 'NexusWorkshopCanvas',
      viewModelExport: 'buildNexusWorkshopCanvasView',
      category: 'workshop',
      description:
        'Nexus workshop canvas with agenda, attendees, decisions',
    },
    {
      laneId: 'PROG13',
      componentFile:
        'src/components/programs/ProgramDeliverablesEvidencePanel.tsx',
      viewModelFile:
        'src/lib/programs/program-deliverables-evidence-view.ts',
      componentExport: 'ProgramDeliverablesEvidencePanel',
      viewModelExport: 'buildProgramDeliverablesEvidenceView',
      category: 'deliverables',
      description: 'Deliverables by phase + evidence trace panel',
    },
    {
      laneId: 'PROG14',
      componentFile:
        'src/components/programs/ProgramActionMissionStrip.tsx',
      viewModelFile:
        'src/lib/programs/program-action-mission-strip-view.ts',
      componentExport: 'ProgramActionMissionStrip',
      viewModelExport: 'buildProgramActionMissionStripView',
      category: 'actions',
      description: 'Action / mission / resume strip',
    },
  ];

export const PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR: ProgramFlagshipWorkflowAnchor =
  {
    pageQuestion:
      'Where is this program in its journey, and what should happen next?',
    primaryAgent: 'nexus',
    workflowSections: [
      'program executive brief',
      'phase journey rail',
      'current phase + gate status',
      'Nexus workshop canvas',
      'deliverables by phase',
      'evidence / missing inputs',
      'agent missions and actions',
      'resume / next action strip',
      'deterministic vs live caveat',
    ],
  };

export const PROGRAM_FLAGSHIP_ROUTE_FILE_PATH =
  'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx';

export const PROGRAM_FLAGSHIP_DESIGN_CANON_RULES: ProgramFlagshipDesignCanonRule[] =
  [
    {
      rule: 'no teal',
      expectedAbsent: ['#14B8A6', '#0E9F8C', '#0D9488'],
    },
    {
      rule: 'no neon',
      expectedAbsent: ['#39FF14', '#00FFFF'],
    },
    {
      rule: 'no cyber bg',
      expectedAbsent: ['#0A0A0A'],
    },
  ];

export function buildProgramFlagshipVerificationReport(): ProgramFlagshipVerificationReport {
  return {
    waveId: 'wave-18',
    components: PROGRAM_FLAGSHIP_COMPONENTS,
    workflowAnchor: PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR,
    routeFilePath: PROGRAM_FLAGSHIP_ROUTE_FILE_PATH,
    designCanonRules: PROGRAM_FLAGSHIP_DESIGN_CANON_RULES,
    generatedAt: '2026-04-26',
    caveat:
      'Program flagship verification report. Static manifest tests always pass. Integration-phase file checks gracefully skip when files absent (lane worktree) and assert when present (integration branch).',
  };
}
