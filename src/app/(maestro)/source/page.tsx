import { redirect } from 'next/navigation';
export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * Source landing.
 *
 * The governed Source Workspace (native-canvas explorer bound to
 * source.contract_360 / source.vendor_contract_portfolio) is now the
 * canonical Source entry. The prior portfolio-book route redirects here for
 * existing deep links so operators do not enter a second Source home.
 */
export default function SourcePage() {
  redirect('/source/preview/workspace');
}
