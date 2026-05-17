import { redirect } from 'next/navigation';

export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * Iteration-2 punch-list (design-partner IT sourcing VP): "stronger if
 * /source defaults directly to queue." The Decision Queue is now the Source
 * landing experience — landing on `/source` *is* the queue.
 *
 * We redirect rather than re-render so `/source/queue` stays the single
 * canonical implementation of the queue (one data-load path, one view). The
 * legacy portfolio command-center remains reachable at `/source/portfolio`
 * for users who want the table-forward view.
 */
export default function SourcePage() {
  redirect('/source/queue');
}
