import * as fs from 'fs';
import * as path from 'path';
import {
  buildSentinelBriefView,
  buildIntelligenceWorkflowCanvasView,
} from '@/lib/intelligence/intelligence-workflow-canvas-view';

describe('intelligence-workflow-canvas view model', () => {
  describe('buildSentinelBriefView', () => {
    it('returns non-null for apex-retail', () => {
      const brief = buildSentinelBriefView('apex-retail');
      expect(brief).not.toBeNull();
    });

    it('agentLabel === Sentinel', () => {
      const brief = buildSentinelBriefView('apex-retail');
      expect(brief.agentLabel).toBe('Sentinel');
    });

    it('topPatternLabel is non-empty for apex-retail', () => {
      const brief = buildSentinelBriefView('apex-retail');
      expect(brief.topPatternLabel.length).toBeGreaterThan(0);
    });

    it('contextUsed has at least 1 item for apex-retail', () => {
      const brief = buildSentinelBriefView('apex-retail');
      expect(brief.contextUsed.length).toBeGreaterThanOrEqual(1);
    });

    it('deterministicSeed === true', () => {
      const brief = buildSentinelBriefView('apex-retail');
      expect(brief.deterministicSeed).toBe(true);
    });

    it('deterministicSeedCaveat contains Deterministic', () => {
      const brief = buildSentinelBriefView('apex-retail');
      expect(brief.deterministicSeedCaveat).toContain('Deterministic');
    });

    it('confidenceReason is non-empty for apex-retail', () => {
      const brief = buildSentinelBriefView('apex-retail');
      expect(brief.confidenceReason.length).toBeGreaterThan(0);
    });

    it('meridian confidenceLevel === low', () => {
      const brief = buildSentinelBriefView('meridian');
      expect(brief.confidenceLevel).toBe('low');
    });

    it('arcturus affectedPrograms is empty array', () => {
      const brief = buildSentinelBriefView('arcturus');
      expect(brief.affectedPrograms).toEqual([]);
    });
  });

  describe('buildIntelligenceWorkflowCanvasView', () => {
    it('apex-retail patternStrip.length > 0', () => {
      const view = buildIntelligenceWorkflowCanvasView('apex-retail');
      expect(view.patternStrip.length).toBeGreaterThan(0);
    });

    it('meridian patternStrip.length === 0', () => {
      const view = buildIntelligenceWorkflowCanvasView('meridian');
      expect(view.patternStrip.length).toBe(0);
    });

    it('availableModes has 5 entries', () => {
      const view = buildIntelligenceWorkflowCanvasView('apex-retail');
      expect(view.availableModes.length).toBe(5);
    });
  });

  describe('IntelligenceWorkflowCanvas.tsx file checks', () => {
    const componentPath = path.resolve(
      __dirname,
      '../../../../src/components/intelligence/IntelligenceWorkflowCanvas.tsx'
    );

    it('IntelligenceWorkflowCanvas.tsx exists', () => {
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    it('IntelligenceWorkflowCanvas.tsx does not contain #14B8A6', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).not.toContain('#14B8A6');
    });

    it('IntelligenceWorkflowCanvas.tsx contains SENTINEL', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('SENTINEL');
    });
  });
});
