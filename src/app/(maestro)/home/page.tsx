import { Metadata } from 'next';
import { HomeIndexPage } from '@/components/home/HomeIndexPage';

export const metadata: Metadata = { title: 'Home · AbarVa' };

export default function HomePage() {
  return <HomeIndexPage />;
}
