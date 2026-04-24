import type { SourcingEventDetail } from '@/lib/source/types';
import { sourceCard, sourceInsetCard } from './foundationStyles';

export function PersistentNexusPanel({ event }: { event: SourcingEventDetail }) {
  return (
    <aside style={sourceCard}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Persistent Nexus panel</div>
      <div style={{ fontSize: 13, opacity: 0.72 }}>
        Lead agent · {event.leadAgent}
      </div>
      <div style={sourceInsetCard}>
        <div style={{ fontWeight: 700 }}>Current role</div>
        <div>
          Nexus owns event framing, stage progression, and the handoff between Pattern Fabric,
          Artifact Studio, Control Tower, and the Value Ledger.
        </div>
      </div>
      <div style={sourceInsetCard}>
        <div style={{ fontWeight: 700 }}>Immediate prompts</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>What evidence is still thin for this event?</li>
          <li>Which stage gate is actually blocking progress?</li>
          <li>What moves from projected to realized value next?</li>
        </ul>
      </div>
      <div style={sourceInsetCard}>
        <div style={{ fontWeight: 700 }}>Reuse boundary</div>
        <div>
          This panel is the canonical replacement target for the older NexusPanel and rail variants.
        </div>
      </div>
    </aside>
  );
}
