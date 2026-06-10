// Stage-gate proof: 3-level assessment, honest gate status, and the Maestro override
// hard rules (rationale required on gaps; never final with gaps; gaps carried forward).
import { assessStageGate } from '../gate-resolver';
import { applyMaestroDecision } from '../maestro-override';
import { buildGateGuidance } from '../gate-guidance';
import { AMS_STAGE_GATES, getAmsStageGate } from '../ams-stage-gates';
import type { StageCompletionState } from '../types';

const RFP = getAmsStageGate('rfp_design')!;
const sat = (...keys: string[]): StageCompletionState => ({ satisfiedRequirementKeys: new Set(keys) });

describe('AMS stage-gate playbook', () => {
  it('defines all 12 AMS stages, each with a minimum-viable subset', () => {
    expect(AMS_STAGE_GATES).toHaveLength(12);
    for (const s of AMS_STAGE_GATES) {
      expect(s.requirements.some((r) => r.tier === 'minimum_viable')).toBe(true);
      expect(s.stageName).toBeTruthy();
    }
  });
});

describe('assessStageGate', () => {
  it('ready when the full recommended standard is met', () => {
    const a = assessStageGate(RFP, sat(...RFP.requirements.map((r) => r.key)));
    expect(a.gateStatus).toBe('ready');
    expect(a.gaps).toHaveLength(0);
    expect(a.currentCompletion).toBe(1);
    expect(a.recommendedDecision).toBe('advance');
  });

  it('ready_with_gaps when minimum-viable met but recommended gaps remain', () => {
    // satisfy both minimum_viable items, leave recommended ones unmet
    const mv = RFP.requirements.filter((r) => r.tier === 'minimum_viable').map((r) => r.key);
    const a = assessStageGate(RFP, sat(...mv));
    expect(a.minimumViableMet).toBe(true);
    expect(a.gateStatus).toBe('ready_with_gaps');
    expect(a.gaps.length).toBeGreaterThan(0);
    expect(a.recommendedDecision).toBe('advance_with_gaps_or_hold');
    // downstream impacts surfaced (evaluation_criteria / contracting_terms)
    expect(a.downstreamImpacts.length).toBeGreaterThan(0);
  });

  it('blocked when a minimum-viable item is missing (override still allowed)', () => {
    const a = assessStageGate(RFP, sat('evaluation_weights')); // a recommended item, no MV
    expect(a.minimumViableMet).toBe(false);
    expect(a.gateStatus).toBe('blocked');
    expect(a.maestroOverrideAllowed).toBe(true);
    expect(a.recommendedDecision).toBe('hold_or_override');
  });
});

describe('applyMaestroDecision — hard rules', () => {
  const mv = RFP.requirements.filter((r) => r.tier === 'minimum_viable').map((r) => r.key);
  const withGaps = assessStageGate(RFP, sat(...mv)); // ready_with_gaps
  const clean = assessStageGate(RFP, sat(...RFP.requirements.map((r) => r.key))); // ready

  it('refuses to approve with gaps without a rationale', () => {
    const res = applyMaestroDecision(withGaps, { action: 'approve_with_gaps', approver: 'maestro', approvedAt: 't' });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/rationale/i);
  });

  it('approves with gaps when a rationale is given → override, preliminary, NOT issue-ready', () => {
    const res = applyMaestroDecision(withGaps, { action: 'approve_with_gaps', approver: 'maestro', approvedAt: 't', rationale: 'Time-boxed; finalize weights in parallel.' });
    expect(res.ok).toBe(true);
    expect(res.resolved!.gateStatus).toBe('maestro_override_approved');
    expect(res.resolved!.artifactLabel).toBe('preliminary');
    expect(res.resolved!.allowIssueReady).toBe(false);
    // gaps carried forward even though approver didn't restate them
    expect(res.resolved!.gapsAcknowledged.length).toBe(withGaps.gaps.length);
    expect(res.resolved!.approvalRecord.readinessSnapshot.gapCount).toBe(withGaps.gaps.length);
  });

  it('clean approve → ready, final, issue-ready allowed', () => {
    const res = applyMaestroDecision(clean, { action: 'approve', approver: 'maestro', approvedAt: 't' });
    expect(res.ok).toBe(true);
    expect(res.resolved!.gateStatus).toBe('ready');
    expect(res.resolved!.artifactLabel).toBe('final');
    expect(res.resolved!.allowIssueReady).toBe(true);
  });

  it('plain approve WITH gaps is treated honestly as an override (never silently final)', () => {
    const res = applyMaestroDecision(withGaps, { action: 'approve', approver: 'm', approvedAt: 't', rationale: 'proceed' });
    expect(res.resolved!.gateStatus).toBe('maestro_override_approved');
    expect(res.resolved!.allowIssueReady).toBe(false);
  });

  it('builds a persistable approval record with the readiness snapshot', () => {
    const res = applyMaestroDecision(withGaps, { action: 'force_advance', approver: 'maestro', approvedAt: '2026-06-10T00:00:00Z', rationale: 'exec deadline', followUpItems: [{ item: 'Confirm eval weights', owner: 'Procurement' }] });
    const rec = res.resolved!.approvalRecord;
    expect(rec.stageKey).toBe('rfp_design');
    expect(rec.decision).toBe('force_advance');
    expect(rec.followUpItems[0].owner).toBe('Procurement');
    expect(rec.allowIssueReady).toBe(false);
    expect(rec.readinessSnapshot.gateStatusBeforeDecision).toBe('ready_with_gaps');
  });
});

describe('buildGateGuidance', () => {
  it('produces senior-advisor language with missing items + override note', () => {
    const mv = RFP.requirements.filter((r) => r.tier === 'minimum_viable').map((r) => r.key);
    const g = buildGateGuidance(assessStageGate(RFP, sat(...mv)));
    expect(g.verdict).toBe('Ready with gaps');
    expect(g.detail).toMatch(/full standard/i);
    expect(g.detail).toMatch(/Missing:/);
    expect(g.detail).toMatch(/Maestro/);
    expect(g.missingItems.length).toBeGreaterThan(0);
  });

  it('blocked-with-critical-risk verdict when minimum-viable is unmet', () => {
    const g = buildGateGuidance(assessStageGate(RFP, sat()));
    expect(g.verdict).toBe('Blocked unless Maestro accepts critical risk');
    expect(g.maestroOverrideAllowed).toBe(true);
  });
});
