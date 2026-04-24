import { COLORS, COMPONENTS, FONTS, TEXT } from '@/lib/design-system';
import type {
  BuildStatus,
  ProductionReadiness,
  ProductionReadinessSignal,
} from '@/lib/build-progress/roadmap';

function statusTone(status: BuildStatus): 'low' | 'medium' | 'high' {
  if (status === 'verified' || status === 'code_complete') return 'low';
  if (status === 'blocked') return 'high';
  return 'medium';
}

function statusLabel(status: BuildStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ProductionReadinessPanel({
  readiness,
  signals,
}: {
  readiness: ProductionReadiness;
  signals: ProductionReadinessSignal[];
}) {
  return (
    <section
      style={{
        ...COMPONENTS.card,
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 0.8fr) minmax(0, 1.2fr)',
        gap: 18,
      }}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={TEXT.sectionLabel}>Overall Production Readiness</div>
        <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
          <div style={{ fontFamily: FONTS.serif, fontSize: 62, lineHeight: 0.9 }}>{readiness.score}</div>
          <div style={{ ...TEXT.monoValue, color: COLORS.textMuted, paddingBottom: 7 }}>/ 100</div>
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            border: `1px solid ${COLORS.border}`,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${readiness.score}%`,
              height: '100%',
              borderRadius: 999,
              background: readiness.score >= 70 ? COLORS.green : readiness.score >= 40 ? COLORS.amber : COLORS.teal,
            }}
          />
        </div>
        <div style={COMPONENTS.cardInset}>
          <div style={TEXT.small}>Current phase</div>
          <div style={{ ...TEXT.body, fontWeight: 700 }}>{readiness.currentPhase}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <div style={COMPONENTS.cardInset}>
          <div style={TEXT.sectionLabel}>Next recommended action</div>
          <div style={{ ...TEXT.cxoQuestion, fontSize: 22 }}>{readiness.nextRecommendedAction}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 0.8fr)', gap: 12 }}>
          <div style={COMPONENTS.cardInset}>
            <div style={TEXT.sectionLabel}>Top blockers</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {readiness.topBlockers.map((blocker) => (
                <div key={blocker} style={{ ...TEXT.bodySecondary, display: 'flex', gap: 8 }}>
                  <span style={{ color: COLORS.amber }}>!</span>
                  <span>{blocker}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={COMPONENTS.cardInset}>
            <div style={TEXT.sectionLabel}>Production signals</div>
            <div style={{ display: 'grid', gap: 9 }}>
              {signals.map((signal) => (
                <div key={signal.id} style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <span style={{ ...TEXT.body, fontSize: 13 }}>{signal.label}</span>
                    <span style={COMPONENTS.riskPill(statusTone(signal.status))}>{statusLabel(signal.status)}</span>
                  </div>
                  <div style={{ ...TEXT.small, color: COLORS.textMuted }}>{signal.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
