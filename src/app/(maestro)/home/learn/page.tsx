// /home/learn · index page (shell only).

import { LearnIndexPage } from '@/components/home/LearnIndexPage';

export const metadata = {
  title: 'Learn | AbarVa Home',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LearnPage() {
  return <LearnIndexPage />;
}
