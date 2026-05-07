/**
 * /source/events/[eventId]/vendors/[vendorId]
 *
 * T10 Vendor detail — covers Steps 4-9 (response, pricing, evaluation,
 * BAFO, risk). Resolves vendor from the seeded vendor-detail fixture.
 * 404s on unknown event or vendor ID.
 */

import { notFound } from 'next/navigation';
import { getSourcingEvent } from '@/lib/source/queries';
import { getVendorDetail } from '@/lib/source/vendor-detail';
import { VendorDetailPage } from '@/components/source/VendorDetailPage';
import { AppShell } from '@/components/shell/AppShell';
import { getActiveClientRow } from '@/lib/active-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ eventId: string; vendorId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { eventId, vendorId } = await params;
  const vendor = getVendorDetail(eventId, vendorId);
  if (!vendor) return { title: 'Vendor not found · AbarVa' };
  return { title: `${vendor.name} · Source · AbarVa` };
}

export default async function VendorDetailRoute({ params }: PageProps) {
  const { eventId, vendorId } = await params;

  const [event, activeClient] = await Promise.all([
    getSourcingEvent(eventId).catch(() => null),
    getActiveClientRow().catch(() => null),
  ]);

  const vendor = getVendorDetail(eventId, vendorId);

  if (!vendor) notFound();

  const tenantName = activeClient?.name ?? 'Apex Retail Group';
  const eventName = event?.name ?? eventId;

  return (
    <AppShell
      surface="source"
      topBarProps={{ tenantName, showLocked: false, context: 'Source' }}
    >
      <VendorDetailPage
        vendor={vendor}
        eventId={eventId}
        eventName={eventName}
      />
    </AppShell>
  );
}
