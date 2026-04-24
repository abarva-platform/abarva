import { SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import { getStageStateLabel } from '@/lib/source/lifecycle';
import type { WorkflowStage } from '@/lib/source/types';
import { sourceCard } from './foundationStyles';

export function SourceJourneyTracker({ stages }: { stages: WorkflowStage[] }) {
  return (
    <section style={sourceCard}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Source journey tracker</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SOURCE_STAGE_ORDER.length}, minmax(0, 1fr))`, gap: 12 }}>
        {stages.map((stage, index) => (
          <div
            key={stage.key}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 12,
              background: stage.status === 'active' ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.72 }}>Stage {index + 1}</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>{stage.label}</div>
            <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>{getStageStateLabel(stage.status)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
