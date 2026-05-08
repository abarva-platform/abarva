import { Metadata } from 'next';
import { HomePanelGrid } from '@/components/home/HomePanelGrid';

export const metadata: Metadata = { title: 'Home · AbarVa' };

export default function HomePage() {
  return <HomePanelGrid />;
}
