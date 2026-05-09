/**
 * /home/ai-initiatives/[initiativeId] — AI initiative detail (home surface).
 *
 * The admin/ai-initiatives route was retired in the ADMIN-completion wave.
 * Redirects to the home surface while the ai-initiatives surface is
 * redesigned as part of the Intelligence wave.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  return { title: 'AI Initiative | AbarVa' };
}

export default function HomeAIInitiativeDetailPage() {
  redirect('/home');
}
