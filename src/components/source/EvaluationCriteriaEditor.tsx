import type { ScorecardCriterion } from '@/lib/source/types';
import { sourceInsetCard } from './foundationStyles';

export function EvaluationCriteriaEditor({ criteria }: { criteria: ScorecardCriterion[] }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {criteria.map((criterion) => (
        <div key={criterion.id} style={sourceInsetCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>{criterion.label}</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>{criterion.status.replace('_', ' ')}</div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>Owner · {criterion.ownerRole}</div>
          <div>{criterion.note}</div>
        </div>
      ))}
    </div>
  );
}
