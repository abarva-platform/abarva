/**
 * /home/training — canonical alias for /home/learn.
 *
 * The user-guide / training content lives at /home/learn.
 * This redirect ensures both URLs resolve correctly.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  return { title: 'Training | AbarVa' };
}

export default function HomeTrainingPage() {
  redirect('/home/learn');
}
