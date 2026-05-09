/**
 * /home/ai-initiatives — AI initiatives list (home surface entry point).
 *
 * The admin/ai-initiatives route was retired in the ADMIN-completion wave.
 * This home surface entry point now resolves to a lightweight redirect
 * to the canonical home surface while the ai-initiatives surface is
 * redesigned as part of the Intelligence wave.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'AI Initiatives | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomeAIInitiativesPage() {
  redirect('/home');
}
