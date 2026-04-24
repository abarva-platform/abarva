import { summarizeApprovalState } from '@/lib/source/scorecard';
import type { ScorecardGovernance } from '@/lib/source/types';
import { sourceCard } from './foundationStyles';
import { EvaluationCriteriaEditor } from './EvaluationCriteriaEditor';

export function ScorecardGovernancePanel({ scorecard }: { scorecard: ScorecardGovernance }) {
  const summary = summarizeApprovalState(scorecard);

  return (
    <section style={sourceCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Scorecard governance</div>
          <div style={{ fontSize: 13, opacity: 0.72 }}>
            Decision owner · {scorecard.decisionOwner} · cadence · {scorecard.reviewCadence}
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.72 }}>
          {summary.label} · {summary.approved}/{summary.required} required criteria approved
        </div>
      </div>
      <EvaluationCriteriaEditor criteria={scorecard.criteria} />
    </section>
  );
}
