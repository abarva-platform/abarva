// INT-DTL-VALIDATED — Shell-native Intelligence pattern detail reading view.
// For this wave: single fixture-backed pattern (T3-H01). patternId routing
// comes in a later wave.

import { PatternDetailPage } from '@/components/intelligence/PatternDetailPage';

export const metadata = {
  title: 'T3-H01 · Ambient AI in Retail · Intelligence',
};

export default function PatternDetailRoute() {
  // Single fixture-backed pattern. patternId routing comes in a later wave.
  return <PatternDetailPage />;
}
