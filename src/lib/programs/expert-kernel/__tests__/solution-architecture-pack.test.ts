import {
  buildAllSolutionArchitecturePacks,
  buildSolutionArchitecturePack,
  buildSolutionArchitectureQualitySignals,
} from '../solution-architecture-pack';
import {
  SOLUTION_ARCHITECTURE_STANDARD,
} from '../artifact-standards';
import { scoreArtifactAgainstStandard } from '../artifact-quality-rubric';
import { EXPERT_REVIEW_CASE_IDS } from '../expert-review-cases';

describe('Solution architecture pack', () => {
  it('builds deterministic architecture packs for all expert-review cases', () => {
    const packs = buildAllSolutionArchitecturePacks();

    expect(packs.map((pack) => pack.caseId)).toEqual(EXPERT_REVIEW_CASE_IDS);
    for (const pack of packs) {
      expect(buildSolutionArchitecturePack(pack.caseId)).toEqual(pack);
      expect(pack.optionSet.options.length).toBeGreaterThanOrEqual(2);
      expect(pack.selectedOption.id).toBe(pack.optionSet.recommendedOptionId);
      expect(pack.sourceEvidence.length).toBeGreaterThanOrEqual(3);
      expect(pack.diagrams.map((diagram) => diagram.id)).toEqual([
        'architecture_context_diagram',
        'logical_architecture_diagram',
        'data_flow_diagram',
        'integration_map',
        'control_overlay',
        'build_buy_boundary_view',
      ]);
    }
  });

  it('keeps tenant-specific integration gaps visible instead of fabricating systems', () => {
    const meridian = buildSolutionArchitecturePack('meridian');
    const firstCapital = buildSolutionArchitecturePack('arcturus');

    expect(
      meridian.integrations.find(
        (integration) => integration.system === 'Ambient AI vendor platform',
      )?.status,
    ).toBe('gap');
    expect(
      firstCapital.integrations.find(
        (integration) =>
          integration.system === 'Real-time payment / FedNow event stream',
      )?.status,
    ).toBe('gap');

    const dataFlowNotes = firstCapital.diagrams.find(
      (diagram) => diagram.id === 'data_flow_diagram',
    )?.notes;
    expect(dataFlowNotes?.join(' ')).toContain('FedNow');
  });

  it('scores the solution architecture pack against its dedicated standard', () => {
    const pack = buildSolutionArchitecturePack('apexretail');
    const score = scoreArtifactAgainstStandard(
      buildSolutionArchitectureQualitySignals(pack),
      SOLUTION_ARCHITECTURE_STANDARD,
    );

    expect(score.hardFailures).toEqual([]);
    expect(score.missingVisuals).toEqual([]);
    expect(score.missingSections).toEqual([]);
    expect(score.score).toBeGreaterThanOrEqual(
      SOLUTION_ARCHITECTURE_STANDARD.minimumAcceptableScore,
    );
  });

  it('maps build/buy/partner boundaries to sourcing-relevant ownership', () => {
    const apex = buildSolutionArchitecturePack('apexretail');
    const dispositions = apex.buildBuyBoundary.map((lane) => lane.disposition);

    expect(dispositions).toEqual(
      expect.arrayContaining(['buy', 'partner', 'retain']),
    );
    expect(
      apex.buildBuyBoundary.some((lane) =>
        lane.owner.toLowerCase().includes('sourcing'),
      ),
    ).toBe(true);
  });

  it('does not over-recommend full autonomy when scenario evidence requires human accountability', () => {
    expect(buildSolutionArchitecturePack('apexretail').selectedOption.shape).toBe(
      'human_in_loop_agent',
    );
    expect(buildSolutionArchitecturePack('arcturus').selectedOption.shape).toBe(
      'human_in_loop_agent',
    );
    expect(
      buildSolutionArchitecturePack('apexretail').optionSet.reasons.join(' '),
    ).toContain('Scenario guardrail overrides ambition');
  });
});
