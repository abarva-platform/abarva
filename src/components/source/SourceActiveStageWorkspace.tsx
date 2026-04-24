import { getActiveStage, getStageStateLabel } from '@/lib/source/lifecycle';
import type { SourcingEventDetail } from '@/lib/source/types';
import { sourceCard, sourceMuted } from './foundationStyles';

export function SourceActiveStageWorkspace({ event }: { event: SourcingEventDetail }) {
  const activeStage = getActiveStage(event.stages);

  return (
    <section style={sourceCard}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Active stage workspace</div>
      <div style={{ fontSize: 13, opacity: 0.72 }}>{activeStage.label} · {getStageStateLabel(activeStage.status)}</div>
      <p style={sourceMuted}>{activeStage.summary}</p>
      <div style={{ display: 'grid', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>Problem statement</div>
          <div>{event.problemStatement}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>Next decision</div>
          <div>{event.nextDecision}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>Boundary</div>
          <div>
            This workspace is the canonical Source slot where Nexus, scorecard governance, artifacts,
            and value ledger attach. It stays intentionally light until the first vertical slice lands.
          </div>
        </div>
      </div>
    </section>
  );
}
