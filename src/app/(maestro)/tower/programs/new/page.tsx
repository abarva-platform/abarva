import type { Metadata } from 'next';
import { AiProgramOnboardFlow } from '@/components/tower/AiProgramOnboardFlow';

export const metadata: Metadata = { title: 'Add AI Program · Control Tower' };

export default function Page() {
  return <AiProgramOnboardFlow />;
}
