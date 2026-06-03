import { redirect } from 'next/navigation';

export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * Source now defaults to the Events surface, which carries the
 * Sentinel Source dock on the left and the sourcing operating view on
 * the right. Queue and Portfolio remain reachable via sub-nav once the
 * user lands inside Source.
 *
 * We redirect rather than re-render so `/source/events` stays the
 * canonical implementation of the default landing view.
 */
export default function SourcePage() {
  redirect('/source/events');
}
