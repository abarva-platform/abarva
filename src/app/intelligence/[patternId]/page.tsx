// INT-DTL — Shell-native Intelligence pattern detail reading view.
// Serves T3-H01 (validated) and T3-H03 (in-review) via fixture map.

import { notFound } from 'next/navigation';
import { PatternDetailPage } from '@/components/intelligence/PatternDetailPage';
import { T3_H01_PATTERN } from '@/lib/intelligence/shell-pattern-detail-fixture';
import { T3_H03_PATTERN } from '@/lib/intelligence/shell-pattern-detail-inreview-fixture';

const PATTERN_MAP = {
  't3-h01': T3_H01_PATTERN,
  't3-h03': T3_H03_PATTERN,
} as const;

type PatternId = keyof typeof PATTERN_MAP;

interface Props {
  params: Promise<{ patternId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { patternId } = await params;
  const pattern = PATTERN_MAP[patternId as PatternId];
  if (!pattern) return { title: 'Pattern · Intelligence' };
  return {
    title: `${pattern.id} · ${pattern.name} · Intelligence`,
  };
}

export default async function PatternDetailRoute({ params }: Props) {
  const { patternId } = await params;
  const pattern = PATTERN_MAP[patternId as PatternId];

  if (!pattern) {
    notFound();
  }

  // T3_H01_PATTERN uses string phase, T3_H03_PATTERN uses numeric phase + phaseLabel.
  // PatternDetailPage accepts both shapes via the union type in UsedByPrograms.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PatternDetailPage pattern={pattern as any} />;
}
