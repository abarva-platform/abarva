// /home/learn — renders the welcome section directly (no redirect needed,
// layout wraps it with the left sidebar).

import { WelcomeSection } from '@/components/home/learn/WelcomeSection';

export const metadata = {
  title: 'Learn | AbarVa User Guide',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LearnPage() {
  return <WelcomeSection />;
}
