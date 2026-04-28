// SRC-S4 · SRC-DTL-SCORECARD — Evaluation criteria editor (paper aesthetic refresh).
// No live score submission, approval workflow execution, or upload parsing.
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ScorecardCriterion } from '@/lib/source/types';

const STATUS_COLOR: Record<string, string> = {
  approved: SHELL.MINT_TEXT,
  ready: SHELL.INK_MID,
  draft: SHELL.PEACH_TEXT,
  blocked: SHELL.RUST_TEXT,
};

export function EvaluationCriteriaEditor({ criteria }: { criteria: ScorecardCriterion[] }) {
  return (
    <div style={{ display: 'grid', gap: 12 }} data-testid="evaluation-criteria-editor">
      {criteria.map((criterion) => {
        const statusColor = STATUS_COLOR[criterion.status] ?? SHELL.INK_SOFT;
        return (
          <div
            key={criterion.id}
            style={{
              display: 'grid',
              gap: 10,
              border: '1px solid ' + SHELL.CARD_LINE,
              borderLeft: `3px solid ${statusColor}`,
              borderRadius: 12,
              padding: '14px 16px',
              background: SHELL.PAPER_SOFT,
            }}
            data-testid="criterion-row"
            data-status={criterion.status}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: SHELL.SERIF, fontSize: 18, lineHeight: 1.2, color: SHELL.INK }}>
                {criterion.label}
              </div>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: statusColor,
                  border: `1px solid ${statusColor}`,
                  borderRadius: 999,
                  padding: '4px 8px',
                  background: SHELL.CARD_WHITE,
                  whiteSpace: 'nowrap',
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
        );
      })}
    </div>
  );
}
