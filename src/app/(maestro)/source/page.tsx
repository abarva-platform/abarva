import { redirect } from 'next/navigation';
export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * Source landing.
 *
 * IA v2 (audit 2026-06-03, Tier 1): `/source` lands on the Decision Queue
 * ("Decisions") — the act-mode surface that passes the squint test — rather
 * than the retired Events page.
 */
export default function SourcePage() {
  redirect('/source/queue');
}
