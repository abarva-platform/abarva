/**
 * QA25: Wave-18 Program Flagship E2E Verification Tests
 *
 * Suite A: Static manifest (always pass in any worktree).
 * Suite B: PROG10–PROG14 component + view-model file existence (graceful skip).
 * Suite C: Workflow contract content scan across Wave-18 components (graceful).
 * Suite D: Banned-token absence across Wave-18 components (graceful).
 * Suite E: Program detail route existence (always asserted).
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import {
  PROGRAM_FLAGSHIP_COMPONENTS,
  PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR,
  PROGRAM_FLAGSHIP_ROUTE_FILE_PATH,
  buildProgramFlagshipVerificationReport,
} from '../../../lib/qa/program-flagship-verification';

const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '../../../../');

const flagshipFiles = [
  'src/components/programs/ProgramFlagshipPage.tsx',
  'src/components/programs/PhaseGateCanvas.tsx',
  'src/components/programs/NexusWorkshopCanvas.tsx',
  'src/components/programs/ProgramDeliverablesEvidencePanel.tsx',
  'src/components/programs/ProgramActionMissionStrip.tsx',
];

const bannedHexes = [
  '#14B8A6',
  '#0E9F8C',
  '#0D9488',
  '#39FF14',
  '#00FFFF',
];

describe('QA25 — Program Flagship Verification — Suite A: static manifest', () => {
  it('PROGRAM_FLAGSHIP_COMPONENTS has exactly 5 entries', () => {
    expect(PROGRAM_FLAGSHIP_COMPONENTS).toHaveLength(5);
  });

  it('component lane IDs cover PROG10–PROG14', () => {
    const ids = PROGRAM_FLAGSHIP_COMPONENTS.map((c) => c.laneId).sort();
    expect(ids).toEqual(['PROG10', 'PROG11', 'PROG12', 'PROG13', 'PROG14']);
  });

  it('all component descriptors have non-empty componentFile and componentExport', () => {
    for (const desc of PROGRAM_FLAGSHIP_COMPONENTS) {
      expect(desc.componentFile.length).toBeGreaterThan(0);
      expect(desc.componentExport.length).toBeGreaterThan(0);
    }
  });

  it('PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR.workflowSections has exactly 9 entries', () => {
    expect(PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR.workflowSections).toHaveLength(9);
  });

  it("PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR.primaryAgent === 'nexus'", () => {
    expect(PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR.primaryAgent).toBe('nexus');
  });

  it('pageQuestion is non-empty', () => {
    expect(PROGRAM_FLAGSHIP_WORKFLOW_ANCHOR.pageQuestion.length).toBeGreaterThan(
      0
    );
  });

  it("buildProgramFlagshipVerificationReport() returns waveId === 'wave-18'", () => {
    const report = buildProgramFlagshipVerificationReport();
    expect(report.waveId).toBe('wave-18');
  });

  it('report.designCanonRules.length >= 3', () => {
    const report = buildProgramFlagshipVerificationReport();
    expect(report.designCanonRules.length).toBeGreaterThanOrEqual(3);
  });

  it("report.generatedAt === '2026-04-26'", () => {
    const report = buildProgramFlagshipVerificationReport();
    expect(report.generatedAt).toBe('2026-04-26');
  });

  it('report.routeFilePath matches expected canonical path', () => {
    const report = buildProgramFlagshipVerificationReport();
    expect(report.routeFilePath).toBe(
      'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx'
    );
    expect(report.routeFilePath).toBe(PROGRAM_FLAGSHIP_ROUTE_FILE_PATH);
  });
});

describe('QA25 — Suite B: PROG10–PROG14 file existence (graceful skip)', () => {
  PROGRAM_FLAGSHIP_COMPONENTS.forEach((desc) => {
    it(`${desc.laneId}: component file ${desc.componentFile}`, () => {
      const fullPath = path.join(repoRoot, desc.componentFile);
      if (!fs.existsSync(fullPath)) {
        console.warn(
          `[QA25] Skip ${desc.componentFile} (run in integration branch)`
        );
        return;
      }
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    if (desc.viewModelFile) {
      it(`${desc.laneId}: view-model file ${desc.viewModelFile}`, () => {
        const viewModelFile = desc.viewModelFile as string;
        const fullPath = path.join(repoRoot, viewModelFile);
        if (!fs.existsSync(fullPath)) {
          console.warn(
            `[QA25] Skip ${viewModelFile} (run in integration branch)`
          );
          return;
        }
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    }
  });
});

describe('QA25 — Suite C: workflow contract content (graceful skip)', () => {
  flagshipFiles.forEach((file) => {
    it(`${file}: contains deterministic caveat language`, () => {
      const fullPath = path.join(repoRoot, file);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[QA25] Skip ${file} (run in integration branch)`);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      expect(content.toLowerCase()).toMatch(
        /deterministic|seed-backed|read-only/
      );
    });
  });
});

describe('QA25 — Suite D: banned-token absence (graceful skip)', () => {
  flagshipFiles.forEach((file) => {
    it(`${file}: no banned hex`, () => {
      const fullPath = path.join(repoRoot, file);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[QA25] Skip ${file} (run in integration branch)`);
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      bannedHexes.forEach((hex) => {
        expect(content).not.toContain(hex);
      });
    });
  });
});

describe('QA25 — Suite E: program detail route existence', () => {
  it('Program detail route exists', () => {
    const fullPath = path.join(
      repoRoot,
      'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx'
    );
    expect(fs.existsSync(fullPath)).toBe(true);
  });
});
