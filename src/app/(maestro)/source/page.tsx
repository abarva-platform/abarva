import { redirect } from 'next/navigation';
import { isSourceIaV2 } from '@/lib/source/source-ia-v2';

export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * Source landing.
 *
 * IA v2 (audit 2026-06-03, Tier 1): `/source` lands on the Decision Queue
 * ("Decisions") — the act-mode surface that passes the squint test — rather
 * than the busy Events page. Reversible via `NEXT_PUBLIC_SOURCE_IA_V2=0`,
 * which restores the prior `/source/events` landing.
 */
export default function SourcePage() {
  redirect(isSourceIaV2() ? '/source/queue' : '/source/events');
}
