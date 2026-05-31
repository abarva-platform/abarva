import {
  AI_PROGRAM_FAILURE_KEYS_IN_ORDER,
  listAiProgramFailureModes,
  mapSignalsToFailureModes,
  summarizeFailureModes,
} from '../ai-program-failure-modes';

describe('AI program failure modes', () => {
  it('extends the canonical AI-program pack from 12 to 16 failure modes', () => {
    const modes = listAiProgramFailureModes();

    expect(modes).toHaveLength(16);
    expect(AI_PROGRAM_FAILURE_KEYS_IN_ORDER.slice(-4)).toEqual([
      'token_cost_explosion_at_adoption_inflection',
      'model_selection_drift',
      'embedding_refresh_cost_surprise',
      'eval_cost_growth',
    ]);
  });

  it('loads the four AI cost-of-ops failure modes with required evidence', () => {
    const modes = listAiProgramFailureModes().slice(-4);

    expect(modes.map((mode) => mode.name)).toEqual([
      'Token cost explosion at adoption inflection',
      'Model selection drift',
      'Embedding refresh cost surprise',
      'Eval cost growth',
    ]);
    for (const mode of modes) {
      expect(mode.requiredEvidence.length).toBeGreaterThanOrEqual(3);
      expect(mode.recommendedIntervention.trim().length).toBeGreaterThan(0);
      expect(mode.createdFrom).toBe('deterministic_pattern_pack');
    }
  });

  it('maps AI cost signals to the new cost-of-ops modes', () => {
    const modes = mapSignalsToFailureModes(['cost_not_ready', 'operating_cost_variance']);
    const keys = modes.map((mode) => mode.key);

    expect(keys).toEqual(expect.arrayContaining([
      'token_cost_explosion_at_adoption_inflection',
      'model_selection_drift',
      'embedding_refresh_cost_surprise',
      'eval_cost_growth',
    ]));
  });

  it('counts the new deliverable implications in the summary', () => {
    const summary = summarizeFailureModes(listAiProgramFailureModes());

    expect(summary.totalCount).toBe(16);
    expect(summary.uniqueDeliverableImplications).toEqual(expect.arrayContaining([
      'ai_ops_cost_model',
      'vendor_pricing_review',
      'eval_operating_plan',
    ]));
  });
});
