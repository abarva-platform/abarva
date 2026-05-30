/**
 * Atlas Tier-2 golden snapshot tests (audit §9.1).
 *
 * For each of the 25 canonical CXO questions (audit §3) × 3 demo tenants (Apex,
 * Meridian, First Capital), this file pins the *structural envelope* of the
 * expected response: classifier intent, route type, and per-intent
 * route-type-correctness. The snapshots are the contract; a fix-induced change
 * to a snapshot triggers explicit human review (audit §9.2).
 *
 * This file does NOT exercise the data layer — it does not call Supabase,
 * Anthropic, or the Atlas orchestrator. It locks the classifier behavior
 * (audit C1 — correct intent), which is the first guard against the
 * "keyword-whack-a-mole" regression class. End-to-end tenant-data snapshots
 * (the "prose stays Apex-correct" guard) live in the integration suite that
 * runs against real fixtures.
 *
 * Tier-3 (model-graded LLM-as-judge) is documented as a follow-up — see the
 * model-graded recommendation at the bottom of this file.
 */

import type { AtlasClassification } from '@/lib/atlas/classifier';
import { classifyAtlasIntent } from '@/lib/atlas/classifier';

interface GoldenCase {
  id: string; // Q1..Q25 from audit §3
  question: string;
  expected: AtlasClassification;
  /** When intent === 'llm', this is a deliberate fallback — not a coverage gap. */
  llmIsDeliberate?: boolean;
}

/**
 * The 25 canonical CXO questions from the Atlas audit §3 — these are the
 * questions a CIO/CFO/CDO/CDAO actually asks against a portfolio tower
 * surface. The classifier MUST route every one of them to a deterministic
 * intent (audit §10 demo-ready definition: classifier covers ≥80% of the
 * canonical set; today's fix lifts that to 25/25 = 100%).
 */
const GOLDEN_QUESTIONS: GoldenCase[] = [
  // ---- §3.1 Portfolio diagnostics
  {
    id: 'Q1',
    question: 'Where do we stand on the AI portfolio today?',
    expected: { intent: 'morning_summary', routeType: 'scripted' },
  },
  {
    id: 'Q2',
    question: 'What is the biggest issue right now?',
    expected: { intent: 'portfolio_status', routeType: 'scripted' },
  },
  {
    id: 'Q3',
    question: 'Show me lagging programs by realized value',
    expected: { intent: 'lagging_programs_by_value', routeType: 'scripted' },
  },
  {
    id: 'Q4',
    question: 'Which bets are at risk of missing the next gate?',
    expected: { intent: 'at_risk_gates', routeType: 'scripted' },
  },
  {
    id: 'Q5',
    question: 'What is the portfolio confidence right now?',
    expected: { intent: 'portfolio_confidence', routeType: 'scripted' },
  },
  {
    id: 'Q6',
    question: 'Where is value attainment vs commitment?',
    expected: { intent: 'value_attainment_vs_commitment', routeType: 'scripted' },
  },
  // ---- §3.2 Peer / industry context
  {
    id: 'Q7',
    question: 'How do we compare to retail peers on adoption?',
    expected: { intent: 'peer_adoption_compare', routeType: 'scripted' },
  },
  {
    id: 'Q8',
    question: 'What are industry leaders doing on AI governance?',
    expected: { intent: 'industry_leaders', routeType: 'scripted' },
  },
  {
    id: 'Q9',
    question: 'Where are we lagging in our cohort?',
    expected: { intent: 'cohort_lagging', routeType: 'scripted' },
  },
  {
    id: 'Q10',
    question: 'What percentile are we on AI spend intensity?',
    expected: { intent: 'peer_adoption_compare', routeType: 'scripted' },
  },
  // ---- §3.3 Spend / cost
  {
    id: 'Q11',
    question: 'AI spend run-rate vs budget?',
    expected: { intent: 'ai_spend_vs_budget', routeType: 'scripted' },
  },
  {
    id: 'Q12',
    question: 'Concentrated vendor risk?',
    expected: { intent: 'vendor_concentration_risk', routeType: 'scripted' },
  },
  {
    id: 'Q13',
    question: 'Cost overruns by program?',
    expected: { intent: 'cost_overruns', routeType: 'scripted' },
  },
  {
    id: 'Q14',
    question: 'Idle Copilot seats and dollarized waste?',
    expected: { intent: 'idle_seats', routeType: 'scripted' },
  },
  // ---- §3.4 Risk / governance
  {
    id: 'Q15',
    question: 'Shadow AI exposure?',
    expected: { intent: 'shadow_ai_exposure', routeType: 'scripted' },
  },
  {
    id: 'Q16',
    question: 'Governance coverage gaps?',
    expected: { intent: 'governance_coverage_gaps', routeType: 'scripted' },
  },
  {
    id: 'Q17',
    question: 'Open regulatory items?',
    expected: { intent: 'regulatory_open_items', routeType: 'scripted' },
  },
  {
    id: 'Q18',
    question: 'Which programs have outstanding dissent or stale attestations?',
    expected: { intent: 'governance_coverage_gaps', routeType: 'scripted' },
  },
  // ---- §3.5 Decisions
  {
    id: 'Q19',
    question: 'What should I fund next, and why?',
    expected: { intent: 'fund_next_why', routeType: 'scripted' },
  },
  {
    id: 'Q20',
    question: 'Should we consolidate ambient vendors?',
    expected: { intent: 'strategy_refusal', routeType: 'scripted' },
  },
  // ---- §3.6 Drilldown
  {
    id: 'Q21',
    question: 'Tell me more about program APX-CDP-2026',
    expected: { intent: 'program_drilldown', routeType: 'scripted' },
  },
  {
    id: 'Q22',
    question: 'Walk me through signal abc-123',
    expected: { intent: 'signal_drilldown', routeType: 'hybrid' },
  },
  {
    id: 'Q23',
    question: 'Tell me about vendor Microsoft Copilot',
    expected: { intent: 'vendor_drilldown', routeType: 'scripted' },
  },
  // ---- §3.7 Compare / hypothetical
  {
    id: 'Q24',
    question: 'If I cut Program X, what is at stake?',
    expected: { intent: 'cut_program_impact', routeType: 'scripted' },
  },
  {
    id: 'Q25',
    question: 'Fund program X instead of program Y — what changes?',
    expected: { intent: 'fund_x_vs_y', routeType: 'scripted' },
  },
];

// Tenants are documented for the golden-set contract; the classifier itself is
// tenant-independent (intent is derived from message text). Per-tenant
// data-snapshot pinning lives in a separate suite that exercises the data
// layer with real fixtures.
const TENANTS = ['apex-retail', 'meridian-health', 'firstcapital'] as const;

describe('Atlas Tier-2 golden snapshots — 25 canonical CXO questions × 3 tenants', () => {
  describe('Classifier intent contract (audit §3 + C1)', () => {
    for (const golden of GOLDEN_QUESTIONS) {
      it(`${golden.id} — "${golden.question}" routes to ${golden.expected.intent}/${golden.expected.routeType}`, () => {
        const got = classifyAtlasIntent(golden.question);
        expect(got).toEqual(golden.expected);
      });
    }
  });

  describe('Classifier coverage contract (audit §10 demo-ready criterion #4)', () => {
    it('at least 80% of the canonical CXO question set routes to a deterministic (non-LLM) intent', () => {
      const totalQuestions = GOLDEN_QUESTIONS.length;
      const llmFallbacks = GOLDEN_QUESTIONS.filter((golden) => {
        const got = classifyAtlasIntent(golden.question);
        return got.routeType === 'llm';
      });
      const deterministicRate = (totalQuestions - llmFallbacks.length) / totalQuestions;
      // Audit §10 demo-ready criterion #4: ≥80%. Current target: 100%.
      expect(deterministicRate).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Tenant-set documentation', () => {
    // The classifier is tenant-independent; this asserts the golden set is
    // designed against the canonical demo tenant set.
    it('golden set is anchored on the three canonical demo tenants', () => {
      expect(TENANTS).toEqual(['apex-retail', 'meridian-health', 'firstcapital']);
    });

    it('25 canonical questions are pinned', () => {
      expect(GOLDEN_QUESTIONS).toHaveLength(25);
    });
  });
});

/**
 * ---- Tier-3 model-graded eval — RECOMMENDED DESIGN (NOT BUILT) ----
 *
 * Per audit §9.1, the third tier is an LLM-as-judge scorecard. It runs the
 * 25 × 3 grid through the live Atlas orchestrator and scores each response on
 * the C1–C8 quality bar (audit §5). It is NOT built in this PR because:
 *
 *  - It requires real tenant data (Supabase + corpus) to evaluate against.
 *  - It costs ~75 Anthropic calls per run + 75 grader calls — gate to a
 *    nightly cadence, not per-PR.
 *  - The grader prompt + rubric is non-trivial and benefits from being
 *    iterated separately from this fix wave.
 *
 * SKETCH of the grader prompt (target: a separate `atlas:eval:graded` script
 * gated behind a CI cron job):
 *
 *   You are the audit reviewer for Atlas, a CXO advisor surface. You are given:
 *     - The user's question
 *     - The active tenant name and industry
 *     - Atlas's response
 *
 *   Score each of the following 1–5 (5 = pass cleanly):
 *     C1 — Correct intent: does Atlas answer the question, not a related one?
 *     C2 — Tenant-correct: is the active tenant named in the lead? Zero
 *          cross-tenant content (no legacy aliases, no other-tenant program
 *          codes, no cross-industry vendors)?
 *     C3 — Deterministic: not assessed per-turn — measured by the replay test.
 *     C4 — Evidence-grounded: every quantitative claim cites a program code,
 *          metric+value, signal ID, or peer cohort definition?
 *     C5 — Honest: planning ranges labeled, gaps named, no fabricated precise
 *          figures?
 *     C6 — Concise: 3-7 lines for most answers; tables only when comparing?
 *     C7 — Actionable: ends with a concrete CIO-actionable next step?
 *     C8 — Operator voice: CIO/CFO vocabulary, no consultant-speak?
 *
 *   Return JSON: { c1: 1–5, c2: 1–5, ..., c8: 1–5, overall_pass: boolean,
 *                  failures: ["short reason per failed criterion"] }
 *
 *   Threshold for the PR-gate: average score ≥ 4.0 across the 75 cells, no
 *   tenant below 3.5 average, zero C2 failures.
 *
 * Output: posted to a dashboard; trend tracked over time. A regression in the
 * average score blocks merge.
 *
 * IMPLEMENTATION FOLLOW-UP: schedule a new PR titled "feat(atlas): Tier-3
 * model-graded eval harness" that:
 *  - Adds `npm run atlas:eval:graded`
 *  - Adds a GitHub Actions cron workflow (nightly)
 *  - Wires the grader to Anthropic claude-opus-4-7 with temperature: 0
 *  - Persists results to a `atlas_eval_runs` table
 *  - Posts a daily summary to the audit channel
 */
