import type { WorkflowStage } from '@/lib/source/types';
import { sourceCard, sourceInsetCard, sourceMuted } from './foundationStyles';

export function SourceStagePanel({ stages }: { stages: WorkflowStage[] }) {
  return (
    <section style={sourceCard}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Stage gates</div>
      {stages.map((stage) => (
        <div key={stage.key} style={sourceInsetCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>{stage.label}</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>{stage.gate.status.replace('_', ' ')}</div>
          </div>
          <div style={sourceMuted}>{stage.summary}</div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>
            Owner · {stage.gate.ownerRole}
          </div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>
            Required artifacts · {stage.gate.requiredArtifacts.join(', ')}
          </div>
          {stage.gate.blocker ? (
            <div style={{ fontSize: 12, color: '#F59E0B' }}>Blocker · {stage.gate.blocker}</div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
