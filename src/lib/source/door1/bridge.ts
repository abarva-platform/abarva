// ─────────────────────────────────────────────────────────────────────────────
// Door 1 · Step 3 — QUANTIFY (the value bridge).
//
// Roll the diagnosis findings into a cited recoverable range, classified by
// recovery bucket — the Door-1 analogue of the Door-2 value-type waterfall.
//
// HONESTY RULE (carried from the archetype ValueType spine): the `protected`
// bucket is leakage AVOIDED — a risk hedge, real but NOT recoverable cash. It is
// reported ALONGSIDE the recoverable range, never summed into it. The headline
// recoverable range = incremental + risk_adjusted only. A point estimate is never
// presented as fact — every band is low/high.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Door1ValueBridge,
  LeakageDiagnosis,
  LeakageFinding,
  RecoveryBucket,
  ValueBridgeBand,
} from './types';

const BUCKET_ORDER: RecoveryBucket[] = ['incremental', 'risk_adjusted', 'protected'];

const BUCKET_NOTE: Record<RecoveryBucket, string> = {
  incremental:
    'Price/term movement recoverable by renegotiating the incumbent contract — beyond any giveback the vendor would concede on asking.',
  risk_adjusted:
    'Value remaining after normalizing for delivery, under-pricing, and solution-weakness risk — the defensible, not headline, figure.',
  protected:
    'Post-award leakage avoided (scope, SLA, change-order). A risk hedge, not recoverable cash — reported alongside, never summed into the recoverable range.',
};

/** Confidence rollup: the bridge is only as strong as its weakest material finding. */
function rollupConfidence(findings: LeakageFinding[]): 'low' | 'med' | 'high' {
  if (findings.length === 0) return 'low';
  const rank = { low: 0, med: 1, high: 2 } as const;
  const min = findings.reduce(
    (acc, f) => Math.min(acc, rank[f.confidence]),
    2,
  );
  return (['low', 'med', 'high'] as const)[min];
}

/** Build the value bridge from a diagnosis. Deterministic. */
export function buildValueBridge(diagnosis: LeakageDiagnosis): Door1ValueBridge {
  const computed = diagnosis.findings.filter((f) => f.status === 'computed');

  const bands: ValueBridgeBand[] = [];
  for (const bucket of BUCKET_ORDER) {
    const inBucket = computed.filter((f) => f.recoveryBucket === bucket);
    if (inBucket.length === 0) continue;
    bands.push({
      bucket,
      low: sum(inBucket.map((f) => f.low ?? 0)),
      high: sum(inBucket.map((f) => f.high ?? 0)),
      contributingRuleKeys: inBucket.map((f) => f.ruleKey).sort(),
      note: BUCKET_NOTE[bucket],
    });
  }

  const recoverable = bands.filter((b) => b.bucket !== 'protected');
  const protectedBands = bands.filter((b) => b.bucket === 'protected');

  return {
    eventId: diagnosis.eventId,
    bands,
    recoverableLow: sum(recoverable.map((b) => b.low)),
    recoverableHigh: sum(recoverable.map((b) => b.high)),
    protectedLow: sum(protectedBands.map((b) => b.low)),
    protectedHigh: sum(protectedBands.map((b) => b.high)),
    confidence: rollupConfidence(computed),
    unit: 'usd',
  };
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
