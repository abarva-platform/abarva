import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';
import type { BuildStatus, CriticalPathMilestone } from '@/lib/build-progress/roadmap';

function statusTone(status: BuildStatus): 'low' | 'medium' | 'high' {
  if (status === 'verified' || status === 'code_complete') return 'low';
  if (status === 'blocked') return 'high';
  return 'medium';
}

function statusLabel(status: BuildStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CriticalPathTracker({ milestones }: { milestones: CriticalPathMilestone[] }) {
  return (
    <section style={{ ...COMPONENTS.card, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end' }}>
        <div>
          <div style={TEXT.sectionLabel}>Critical Path</div>
          <h2 style={{ margin: 0, fontFamily: FONTS.serif, fontSize: 28, fontWeight: 500 }}>
            From canon lock to production deployment
          </h2>
        </div>
        <div style={{ ...TEXT.small, color: COLORS.textMuted }}>13 milestone spine</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {milestones.map((milestone) => (
          <article key={milestone.id} style={{ ...COMPONENTS.cardInset, minHeight: 154 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  color: COLORS.teal,
                  letterSpacing: '0.08em',
                }}
              >
                {String(milestone.order).padStart(2, '0')}
              </span>
              <span style={COMPONENTS.riskPill(statusTone(milestone.status))}>{statusLabel(milestone.status)}</span>
            </div>
            <div style={{ ...TEXT.body, fontWeight: 700, marginBottom: 8 }}>{milestone.name}</div>
            <div style={{ ...TEXT.small, color: COLORS.textMuted, marginBottom: 8 }}>Owner - {milestone.owner}</div>
            <p style={{ ...TEXT.bodySecondary, margin: 0 }}>{milestone.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
