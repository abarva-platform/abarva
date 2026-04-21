import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { EntityLink } from '@/components/shared/entities/EntityLink';

interface Props {
  // Minutes since the most recent intelligence-layer refresh across the
  // user's scope. Null when we don't yet have telemetry.
  minutesSinceRefresh: number | null;
  // Tenant name for the trust line.
  tenantName: string | null;
}

// Quiet context bar at the bottom of the composite home. Two lines only ·
// freshness + trust. No social proof, no testimonials, no carousels.
export function ContextFooter({ minutesSinceRefresh, tenantName }: Props) {
  const freshnessLabel =
    minutesSinceRefresh == null
      ? 'Intelligence freshness · pending'
      : minutesSinceRefresh < 1
        ? 'Intelligence layer refreshed moments ago'
        : minutesSinceRefresh < 60
          ? `Intelligence layer refreshed ${Math.round(minutesSinceRefresh)} minutes ago`
          : minutesSinceRefresh < 24 * 60
            ? `Intelligence layer refreshed ${Math.round(minutesSinceRefresh / 60)} hour${minutesSinceRefresh >= 120 ? 's' : ''} ago`
            : `Intelligence layer refreshed ${Math.round(minutesSinceRefresh / (60 * 24))} day${minutesSinceRefresh >= 60 * 48 ? 's' : ''} ago`;

  return (
    <footer
      style={{
        marginTop: 48,
        paddingTop: 18,
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      <MetaLabel>{freshnessLabel}</MetaLabel>
      <MetaLabel>
        Your data stays in {tenantName ? `${tenantName}` : 'this tenant'}.{' '}
        <EntityLink href="/platform/data" variant="inline">
          How the intelligence layer is isolated.
        </EntityLink>
      </MetaLabel>
    </footer>
  );
}
