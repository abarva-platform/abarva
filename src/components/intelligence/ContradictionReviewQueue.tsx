'use client';

import { runContradictionDetectionJob } from '../../jobs/contradiction-detection-job';
import type { ContradictionDetectionFinding } from '../../lib/intelligence/contradiction-detector';

export interface ContradictionReviewQueueProps {
  findings?: ContradictionDetectionFinding[];
  title?: string;
  emptyState?: string;
}

const severityTone: Record<ContradictionDetectionFinding['severity'], string> = {
  critical: '#991b1b',
  high: '#b45309',
  medium: '#0369a1',
  low: '#3f6212',
};

function formatRule(ruleLabel: string, status: ContradictionDetectionFinding['status']): string {
  if (status === 'resolved-reference') return `${ruleLabel} · resolved reference`;
  if (status === 'accepted-tension') return `${ruleLabel} · accepted tension`;
  return `${ruleLabel} · needs review`;
}

export function ContradictionReviewQueue({
  findings,
  title = 'Contradiction review queue',
  emptyState = 'No deterministic contradiction findings are waiting for review.',
}: ContradictionReviewQueueProps) {
  const queue = findings ?? runContradictionDetectionJob({ includeResolved: false }).reviewQueue;

  if (queue.length === 0) {
    return (
      <section className="intel-card" aria-label={title}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Deterministic detector
        </div>
        <h2 style={{ margin: '8px 0 6px' }}>{title}</h2>
        <p style={{ margin: 0, color: 'var(--muted-foreground, #64748b)' }}>{emptyState}</p>
      </section>
    );
  }

  return (
    <section className="intel-card" aria-label={title}>
      <div className="intel-row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Deterministic detector · no live LLM calls
          </div>
          <h2 style={{ margin: '8px 0 6px' }}>{title}</h2>
          <p style={{ margin: 0, color: 'var(--muted-foreground, #64748b)' }}>
            Rule-based findings from merged Phase 1 contradictions and corpus evidence.
          </p>
        </div>
        <span className="intel-chip mono">{queue.length} findings</span>
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
        {queue.map((finding) => (
          <article
            key={finding.id}
            style={{
              border: '1px solid var(--border, #dbe3ef)',
              borderRadius: 16,
              padding: 16,
              background: 'var(--card, #fff)',
            }}
          >
            <div className="intel-row" style={{ justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div>
                <div className="mono" style={{ color: severityTone[finding.severity], fontSize: 12 }}>
                  {finding.severity.toUpperCase()} · {formatRule(finding.ruleLabel, finding.status)}
                </div>
                <h3 style={{ margin: '6px 0 8px', fontSize: 18 }}>{finding.title}</h3>
              </div>
              <span className="intel-chip mono">P{finding.priority}</span>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <div>
                <strong>Claim A: </strong>
                <span>{finding.partyAClaim}</span>
              </div>
              <div>
                <strong>Claim B: </strong>
                <span>{finding.partyBClaim}</span>
              </div>
              <div style={{ color: 'var(--muted-foreground, #475569)' }}>{finding.reviewPrompt}</div>
            </div>

            <div className="intel-inline-list" style={{ marginTop: 12 }}>
              {finding.evidenceRefs.slice(0, 5).map((ref) => (
                <span key={`${finding.id}-${ref.kind}-${ref.id}`} className="intel-chip mono">
                  {ref.kind}: {ref.label}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ContradictionReviewQueue;
