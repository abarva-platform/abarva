// /source/learn — root primer page renders the welcome section directly.
// The layout wraps it with the side-nav.

import { SourceWelcomeSection } from '@/components/source/learn/SourceWelcomeSection';

export const metadata = {
  title: 'Source primer | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SourceLearnPage() {
  return <SourceWelcomeSection />;
}
