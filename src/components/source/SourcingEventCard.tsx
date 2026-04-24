import Link from 'next/link';
import type { SourcingEventSummary } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import { sourceCard, sourceMuted, sourcePillRow } from './foundationStyles';
import { EventLifecycleStatusBadge } from './EventLifecycleStatusBadge';

export function SourcingEventCard({ event }: { event: SourcingEventSummary }) {
  return (
    <article style={sourceCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>{event.code} · {event.accountName}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{event.name}</div>
        </div>
        <EventLifecycleStatusBadge status={event.status} label={event.statusLabel} />
      </div>
      <p style={sourceMuted}>{event.nextDecision}</p>
      <div style={sourcePillRow}>
        <span>Stage · {event.currentStageLabel}</span>
        <span>Alerts · {event.openAlerts}</span>
        <span>Lead agent · {event.leadAgent}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.72 }}>Projected value</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{formatUsd(event.projectedValueUsd)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.72 }}>Realized value</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{formatUsd(event.realizedValueUsd)}</div>
        </div>
      </div>
      <div>
        <Link href={`/source/events/${event.id}`} style={{ color: 'inherit' }}>
          Open sourcing event →
        </Link>
      </div>
    </article>
  );
}
