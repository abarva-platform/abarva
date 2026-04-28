import { SHELL } from '@/lib/shell/shell-tokens';
import type { ScorecardCriterion } from '@/lib/source/types';

export function EvaluationCriteriaEditor({ criteria }: { criteria: ScorecardCriterion[] }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {criteria.map((criterion) => (
        <div
          key={criterion.id}
          style={{
            display: 'grid',
            gap: 10,
            border: '1px solid ' + SHELL.CARD_LINE,
            borderRadius: 12,
            padding: '14px 16px',
            background: SHELL.PAPER_SOFT,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, lineHeight: 1.2, color: SHELL.INK }}>
              {criterion.label}
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SHELL.INK_SOFT,
                border: '1px solid ' + SHELL.CARD_LINE,
                borderRadius: 999,
                padding: '4px 8px',
                background: SHELL.CARD_WHITE,
              }}
            >
              {criterion.status.replaceAll('_', ' ')}
            </div>
          </div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
            Owner · {criterion.ownerRole}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.55, color: SHELL.INK }}>
            {criterion.note}
          </div>
        </div>
      ))}
    </div>
  );
}
