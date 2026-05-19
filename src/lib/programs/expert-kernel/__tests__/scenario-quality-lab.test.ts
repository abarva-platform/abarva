import {
  runAllMovesScenarioQualityLabs,
  runAllMovesScenarioQualityLabsWithWatchedSessions,
  runMovesScenarioQualityLab,
  runMovesScenarioQualityLabWithWatchedSession,
} from '../scenario-quality-lab';
import { assessScenarioUpdates } from '../scenario-updates';
import { EXPERT_REVIEW_CASE_IDS, EXPERT_REVIEW_CASES } from '../expert-review-cases';
import {
  buildDefaultWatchedSessionTranscript,
  extractUpdatesFromWatchedSession,
} from '../watched-session-mode';

describe('Moves scenario quality lab', () => {
  it('scores the Apex real-life scenario artifact by artifact', () => {
    const lab = runMovesScenarioQualityLab('apexretail');

    expect(lab.caseId).toBe('apexretail');
    expect(lab.mode).toBe('simulated_update_packet');
    expect(lab.scorecard.map((s) => s.artifactId)).toEqual([
      'intelligence_idea',
      'discover_brief',
      'charter_case',
      'business_case_pack',
      'financial_model',
      'cfo_pack',
      'mobilize_pack',
      'workshop_session_support',
      'updated_content_acceptance',
      'trace_and_governance',
    ]);
    expect(lab.overallScore).toBeGreaterThanOrEqual(7);
    expect(lab.regenerationDiff.affectedArtifacts).toContain('financial_model');
    expect(lab.nextBestAction).toMatch(/Cost per contact|Annual contact volume|cost-per-contact/i);
  });

  it('runs the same lab for all three tenant anchors in sequence', () => {
    const labs = runAllMovesScenarioQualityLabs();

    expect(labs.map((l) => l.caseId)).toEqual(EXPERT_REVIEW_CASE_IDS);
    for (const lab of labs) {
      expect(lab.overallScore).toBeGreaterThanOrEqual(7);
      expect(lab.scorecard).toHaveLength(10);
      expect(lab.updateAssessment.regenerationRequired).toBe(true);
    }
    expect(labs[0]?.nextClientCaseId).toBe('meridian');
    expect(labs[1]?.nextClientCaseId).toBe('arcturus');
    expect(labs[2]?.nextClientCaseId).toBeNull();
  });

  it('accepts known updates and rejects unmapped workshop content', () => {
    const { skeleton } = EXPERT_REVIEW_CASES.apexretail.buildCase();
    const assessment = assessScenarioUpdates(skeleton, [
      {
        kind: 'baseline_metric',
        key: 'cost_per_contact_usd',
        label: 'Cost per contact',
        value: 7.85,
        source: 'Finance workshop',
        owner: 'Brendan Fox',
      },
      {
        kind: 'baseline_metric',
        key: 'random_metric',
        label: 'Random metric',
        value: 1,
        source: 'Spreadsheet',
        owner: 'Unknown',
      },
      {
        kind: 'workshop_note',
        key: 'manager_adoption',
        label: 'Manager adoption',
        source: 'Workshop',
        owner: 'WFM Lead',
      },
    ]);

    expect(assessment.accepted.map((u) => u.key)).toContain('cost_per_contact_usd');
    expect(assessment.rejected.map((r) => r.input.key)).toEqual([
      'random_metric',
      'manager_adoption',
    ]);
    expect(assessment.regenerationReasons).toContain(
      'Baseline metric updated: cost_per_contact_usd.',
    );
  });

  it('scores the current known weak spot as a human-observed session gap', () => {
    const lab = runMovesScenarioQualityLab('apexretail');
    const workshop = lab.scorecard.find(
      (item) => item.artifactId === 'workshop_session_support',
    );

    expect(workshop).toBeDefined();
    expect(workshop?.criteria.some((c) => c.id === 'human_observed_gap')).toBe(true);
    expect(workshop?.criteria.find((c) => c.id === 'human_observed_gap')?.score).toBe(5);
  });

  it('extracts watched-session signals into proposed case updates', () => {
    const transcript = buildDefaultWatchedSessionTranscript('apexretail');
    const extraction = extractUpdatesFromWatchedSession(transcript);

    expect(extraction.proposedUpdates.map((u) => u.key)).toEqual([
      'cost_per_contact_usd',
      'contact_volume_annual',
      'containment_uplift',
      'manager_adoption',
      'unmapped_sentiment_score',
    ]);
    expect(extraction.unmappedSignals).toHaveLength(1);
  });

  it('watched-session mode lifts the current scenario score and shows regeneration diff', () => {
    const baseline = runMovesScenarioQualityLab('apexretail');
    const watched = runMovesScenarioQualityLabWithWatchedSession('apexretail');

    expect(watched.mode).toBe('watched_session');
    expect(watched.overallScore).toBeGreaterThan(baseline.overallScore);
    expect(watched.watchedSession?.participantCount).toBeGreaterThanOrEqual(4);
    expect(watched.regenerationDiff.recommendationAfter).toBe('requires_regeneration');
    expect(watched.regenerationDiff.acceptedChanges.map((c) => c.updateKey)).toContain(
      'cost_per_contact_usd',
    );
    expect(watched.regenerationDiff.rejectedChanges.map((c) => c.updateKey)).toContain(
      'unmapped_sentiment_score',
    );
  });

  it('runs watched-session mode across all tenant anchors', () => {
    const labs = runAllMovesScenarioQualityLabsWithWatchedSessions();

    expect(labs.map((l) => l.caseId)).toEqual(EXPERT_REVIEW_CASE_IDS);
    for (const lab of labs) {
      expect(lab.mode).toBe('watched_session');
      expect(lab.overallScore).toBeGreaterThanOrEqual(8.3);
      expect(lab.regenerationDiff.acceptedChanges.length).toBeGreaterThanOrEqual(4);
      expect(lab.regenerationDiff.rejectedChanges.length).toBe(1);
    }
  });
});
