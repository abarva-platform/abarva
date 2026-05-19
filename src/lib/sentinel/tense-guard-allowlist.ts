// Sentinel G7 tense-guard allowlist.
//
// The previous open item was not "invent more rules"; it was "tune the tense
// guard from production false-positive telemetry." This module closes that
// operational gap by creating a deterministic, auditable allowlist-candidate
// path. It never auto-allowlists from one complaint; it requires enough
// telemetry and a low true-positive signal.

export interface TenseGuardTelemetryEvent {
  guardId: 'G7';
  phrase: string;
  classification: 'true_positive' | 'false_positive';
}

export interface TenseGuardAllowlistCandidate {
  phrase: string;
  total: number;
  falsePositiveRate: number;
  recommended: boolean;
  reason: string;
}

export function buildG7AllowlistCandidates(
  events: TenseGuardTelemetryEvent[],
  options: { minSamples?: number; minFalsePositiveRate?: number } = {},
): TenseGuardAllowlistCandidate[] {
  const minSamples = options.minSamples ?? 5;
  const minFalsePositiveRate = options.minFalsePositiveRate ?? 0.8;
  const buckets = new Map<string, { total: number; falsePositive: number }>();

  for (const event of events) {
    if (event.guardId !== 'G7') continue;
    const phrase = event.phrase.trim().toLowerCase();
    if (!phrase) continue;
    const bucket = buckets.get(phrase) ?? { total: 0, falsePositive: 0 };
    bucket.total += 1;
    if (event.classification === 'false_positive') bucket.falsePositive += 1;
    buckets.set(phrase, bucket);
  }

  return [...buckets.entries()]
    .map(([phrase, bucket]) => {
      const falsePositiveRate = Math.round((bucket.falsePositive / bucket.total) * 100) / 100;
      const enoughSamples = bucket.total >= minSamples;
      const highFalsePositiveRate = falsePositiveRate >= minFalsePositiveRate;
      return {
        phrase,
        total: bucket.total,
        falsePositiveRate,
        recommended: enoughSamples && highFalsePositiveRate,
        reason: !enoughSamples
          ? `Needs ${minSamples} samples before recommendation.`
          : highFalsePositiveRate
            ? 'Recommend adding to the G7 allowlist after human review.'
            : 'Do not allowlist; true-positive signal remains material.',
      };
    })
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || b.falsePositiveRate - a.falsePositiveRate || a.phrase.localeCompare(b.phrase));
}
