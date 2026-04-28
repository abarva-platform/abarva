// INT-DTL — Shell-native Intelligence pattern detail reading view.
// Serves T3-H01 (validated), T3-H03 (in-review), T1-F02 (candidate),
// and T2-C03 (deprecated) via fixture map.

import { PatternDetailPage } from '@/components/intelligence/PatternDetailPage';
import { DeprecatedPatternDetailPage } from '@/components/intelligence/DeprecatedPatternDetailPage';
import { T3_H01_PATTERN } from '@/lib/intelligence/shell-pattern-detail-fixture';
import { T3_H03_PATTERN } from '@/lib/intelligence/shell-pattern-detail-inreview-fixture';
import { T1_F02_PATTERN } from '@/lib/intelligence/shell-pattern-detail-candidate-fixture';
import { T2_C03_PATTERN } from '@/lib/intelligence/shell-pattern-detail-deprecated-fixture';

const PATTERN_MAP = {
  't3-h01': T3_H01_PATTERN,
  't3-h03': T3_H03_PATTERN,
  't1-f02': T1_F02_PATTERN,
  't2-c03': T2_C03_PATTERN,
} as const;

type PatternId = keyof typeof PATTERN_MAP;

export function generateStaticParams() {
  return Object.keys(PATTERN_MAP).map((patternId) => ({ patternId }));
}

export async function generateMetadata({ params }: { params: Promise<{ patternId: string }> }) {
  const { patternId } = await params;
  const pattern = PATTERN_MAP[patternId as PatternId];
  if (!pattern) return { title: 'Pattern · Intelligence' };
  return { title: `${pattern.id} · ${pattern.name} · Intelligence` };
}

export default async function PatternDetailRoute({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  const pattern = PATTERN_MAP[patternId as PatternId];

  if (!pattern) {
    // Fallback to T3-H01
    return <PatternDetailPage />;
  }

  if (pattern.status === 'deprecated') {
    return <DeprecatedPatternDetailPage />;
  }

  return <PatternDetailPage />;
}
