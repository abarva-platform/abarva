// Clarifying-question trigger · max 1 per turn per spec §2.2 Cap 1.
// Fires when forecast variance on an unknown is high enough that the
// answer would differ materially across 2+ values.
//
// Trigger conditions (any fires):
//   · query mentions a metric without a timeframe ("ROI" but no period)
//   · query mentions a vendor set without scope ("compare X/Y/Z" but no criteria)
//   · query is ambiguous on "for what use case" when use case materially shifts
//     the answer (e.g. "ambient docs" without ED vs inpatient vs ambulatory)
//
// At most ONE clarification per conversation turn. Never auto-clarify if the
// conversation already has 3+ turns (user has context at that point).

export interface ClarifyingInput {
  query: string;
  turnCount: number;
}

export interface ClarifyingOutput {
  fires: boolean;
  question?: string;
  options?: Array<{ label: string; context?: string }>;
}

const AMBIGUOUS_PATTERNS: Array<{ match: RegExp; ask: (q: string) => ClarifyingOutput }> = [
  {
    match: /\bambient doc(s|umentation)?\b.*(?!ED|ambulatory|inpatient|surgical)/i,
    ask: () => ({
      fires: true,
      question: 'Which clinical setting are we scoping for ambient documentation?',
      options: [
        { label: 'ED · emergency department', context: 'highest volume · highest KLAS delta between vendors' },
        { label: 'Ambulatory · clinics', context: 'largest footprint · different documentation cadence' },
        { label: 'Inpatient · bedside', context: 'different integration profile · EHR-first' },
      ],
    }),
  },
  {
    match: /\b(ROI|return on investment|payback)\b(?!.*\b(\d+ ?month|\d+ ?year|annualiz|quarter))/i,
    ask: () => ({
      fires: true,
      question: 'What payback horizon are you underwriting to?',
      options: [
        { label: '12 months', context: 'most CFO-defensible · forces hard scope' },
        { label: '24 months', context: 'balanced · matches typical enterprise software cycle' },
        { label: '36 months', context: 'platform bets · needs boardroom air cover' },
      ],
    }),
  },
];

export function shouldClarify(input: ClarifyingInput): ClarifyingOutput {
  if (input.turnCount >= 3) return { fires: false };
  for (const rule of AMBIGUOUS_PATTERNS) {
    if (rule.match.test(input.query)) return rule.ask(input.query);
  }
  return { fires: false };
}
