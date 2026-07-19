import { redirect } from 'next/navigation';
export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * Source landing.
 *
 * The analytics shell is now the canonical Source entry. `/source` lands on the
 * portfolio book so every tenant enters the same SourceAnalyticsCanvas family
 * instead of the retired decision-queue home.
 */
export default function SourcePage() {
  redirect('/source/portfolio');
}
