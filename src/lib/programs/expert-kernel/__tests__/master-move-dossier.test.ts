import {
  buildAllMasterMoveDossiers,
  buildMasterMoveDossier,
} from '../master-move-dossier';
import { EXPERT_REVIEW_CASE_IDS } from '../expert-review-cases';
import { KERNEL_ARTIFACTS } from '../exports/artifact-catalog';
import { listRequiredVisualIdsForArtifact } from '../artifact-visual-exhibits';

const ALL_ARTIFACT_IDS = KERNEL_ARTIFACTS.map((artifact) => artifact.id);

describe('Master Move dossier view model', () => {
  it('builds deterministic dossiers for Apex, Meridian and First Capital', () => {
    const dossiers = buildAllMasterMoveDossiers('2026-05-20');

    expect(dossiers.map((dossier) => dossier.caseId)).toEqual(
      EXPERT_REVIEW_CASE_IDS,
    );
    for (const dossier of dossiers) {
      const again = buildMasterMoveDossier(dossier.caseId, '2026-05-20');
      expect(again).toEqual(dossier);
      expect(dossier.generatedOn).toBe('2026-05-20');
      expect(dossier.topStatusRail.map((item) => item.id)).toEqual([
        'recommendation',
        'confidence',
        'case_state',
        'missing_evidence',
        'open_kill_criteria',
        'last_generated',
        'owner',
      ]);
    }
  });

  it('includes all phase sections and links them to the six kernel artifacts', () => {
    const dossier = buildMasterMoveDossier('apexretail');

    expect(dossier.phaseSections.map((section) => section.id)).toEqual([
      'discover',
      'charter',
      'solution_architecture',
      'estimate_financial_model',
      'roadmap_mobilization',
    ]);
    expect(dossier.executiveSummary.artifactIds).toEqual(ALL_ARTIFACT_IDS);
    expect(dossier.downloadsSection.map((card) => card.artifactId)).toEqual(
      ALL_ARTIFACT_IDS,
    );
    expect(dossier.artifactQuality.map((item) => item.artifactId)).toEqual(
      ALL_ARTIFACT_IDS,
    );

    const linkedIds = new Set(
      dossier.sectionNavigation.flatMap((section) => section.artifactIds),
    );
    for (const artifactId of ALL_ARTIFACT_IDS) {
      expect(linkedIds.has(artifactId)).toBe(true);
    }
    expect(dossier.sectionNavigation.map((section) => section.id)).toContain(
      'visual_exhibits',
    );
  });

  it('carries Increment 1 quality scores into every download card', () => {
    const dossier = buildMasterMoveDossier('meridian');

    for (const card of dossier.downloadsSection) {
      expect(Number.isFinite(card.qualityScore)).toBe(true);
      expect(card.qualityScore).toBeGreaterThan(0);
      const quality = dossier.artifactQuality.find(
        (item) => item.artifactId === card.artifactId,
      );
      expect(quality?.quality.score).toBe(card.qualityScore);
      expect(quality?.quality.verdict).toBe(card.verdict);
    }
    expect(
      dossier.downloadsSection.find(
        (card) => card.artifactId === 'business_case_pack',
      )?.hardFailureCount,
    ).toBe(0);
    expect(
      dossier.visualExhibits.find(
        (exhibit) => exhibit.id === 'architecture_context_diagram',
      )?.status,
    ).toBe('gap');
  });

  it('renders missing evidence as explicit gaps, never blanks', () => {
    for (const caseId of EXPERT_REVIEW_CASE_IDS) {
      const dossier = buildMasterMoveDossier(caseId);

      expect(dossier.evidenceGapSection.gaps.length).toBeGreaterThan(0);
      for (const gap of dossier.evidenceGapSection.gaps) {
        expect(gap.id.trim()).not.toBe('');
        expect(gap.label.trim()).not.toBe('');
        expect(gap.source.trim()).not.toBe('');
        expect(gap.owner.trim()).not.toBe('');
        expect(gap.fixCondition.trim()).not.toBe('');
        expect(gap.artifactIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('includes Tower measurement and review sign-off sections for gate governance', () => {
    const dossier = buildMasterMoveDossier('arcturus');

    expect(dossier.towerMeasurementSection.artifactIds).toEqual([
      'mobilize_pack',
      'cfo_pack',
    ]);
    expect(dossier.towerMeasurementSection.metrics.length).toBeGreaterThan(0);
    expect(dossier.reviewSignoffSection.map((row) => row.role)).toEqual([
      'cfo',
      'domain_operator',
      'delivery_lead',
      'sourcing_vp',
      'risk_compliance',
      'tower_owner',
    ]);
    expect(
      dossier.reviewSignoffSection.filter((row) => row.requiredForGate).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('includes consulting-grade visual exhibits and keeps gap-state visuals explicit', () => {
    const dossier = buildMasterMoveDossier('apexretail');
    const exhibitIds = new Set(dossier.visualExhibits.map((exhibit) => exhibit.id));

    for (const artifactId of ALL_ARTIFACT_IDS) {
      for (const visualId of listRequiredVisualIdsForArtifact(artifactId)) {
        expect(exhibitIds.has(visualId)).toBe(true);
      }
    }

    expect(
      dossier.visualExhibits.find(
        (exhibit) => exhibit.id === 'investment_vs_return_waterfall',
      )?.data.length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      dossier.visualExhibits.find(
        (exhibit) => exhibit.id === 'sensitivity_tornado',
      )?.data.length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      dossier.visualExhibits.find(
        (exhibit) => exhibit.id === 'architecture_context_diagram',
      )?.status,
    ).toBe('gap');
  });
});
