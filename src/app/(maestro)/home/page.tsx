import { Metadata } from 'next';
import { WelcomeSection } from '@/components/home/learn/WelcomeSection';

export const metadata: Metadata = { title: 'Home · AbarVa' };

export default function HomePage() {
  return <WelcomeSection />;
}
