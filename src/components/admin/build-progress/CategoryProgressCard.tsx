import type { CSSProperties } from 'react';
import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';
import type { BuildCategory, BuildStatus } from '@/lib/build-progress/roadmap';

function statusTone(status: BuildStatus): 'low' | 'medium' | 'high' {
  if (status === 'verified' || status === 'code_complete') return 'low';
  if (status === 'blocked') return 'high';
  return 'medium';
}

function statusLabel(status: BuildStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const progressTrack: CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  overflow: 'hidden',
  border: `1px solid ${COLORS.border}`,
};

export function CategoryProgressCard({ category }: { category: BuildCategory }) {
  const progressColor =
    category.status === 'blocked'
      ? COLORS.red
      : category.progress >= 50
        ? COLORS.green
        : COLORS.teal;

  return (
    <article style={{ ...COMPONENTS.card, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: 5 }}>
          <div style={{ ...TEXT.sectionLabel, marginBottom: 0 }}>{category.id} - {category.spine}</div>
          <h3 style={{ margin: 0, fontSize: 17, color: COLORS.textPrimary }}>{category.name}</h3>
        </div>
        <span style={COMPONENTS.riskPill(statusTone(category.status))}>{statusLabel(category.status)}</span>
      </div>

      <p style={{ ...TEXT.bodySecondary, margin: 0 }}>{category.summary}</p>

      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ ...TEXT.small, color: COLORS.textMuted }}>Progress</span>
          <span style={{ ...TEXT.monoValue, color: COLORS.textPrimary }}>{category.progress}%</span>
        </div>
        <div style={progressTrack}>
          <div
            style={{
              height: '100%',
              width: `${category.progress}%`,
              background: progressColor,
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <div style={COMPONENTS.cardInset}>
          <div style={TEXT.small}>Slices</div>
          <div style={{ fontFamily: FONTS.serif, fontSize: 22 }}>{category.completedSlices}/{category.totalSlices}</div>
        </div>
        <div style={COMPONENTS.cardInset}>
          <div style={TEXT.small}>Blockers</div>
          <div style={{ fontFamily: FONTS.serif, fontSize: 22, color: category.blockerCount > 0 ? COLORS.amber : COLORS.green }}>
            {category.blockerCount}
          </div>
        </div>
        <div style={COMPONENTS.cardInset}>
          <div style={TEXT.small}>Active</div>
          <div style={{ ...TEXT.bodySecondary, color: COLORS.textPrimary }}>{category.currentActiveSlice}</div>
        </div>
      </div>
    </article>
  );
}
