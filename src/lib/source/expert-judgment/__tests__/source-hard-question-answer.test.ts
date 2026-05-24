import { answerHardSourceQuestion } from '../source-hard-question-answer';

const CASE_EVIDENCE = [
  'BlueYonder clause redlines flag telemetry model-improvement rights as P0 until legal accepts revised AI/data terms.',
  'The prior pilot showed 11.4% savings, but excluded union stores and holiday weeks; CFO says >6% is upside only.',
  'WorkForceNow left AI module pricing blank, so pricing is incomplete and non-comparable.',
  'The incumbent renewal notice window closes in 13 days, but audit rights remain unresolved.',
].join('\n');

describe('Source hard-question deterministic expert fallback', () => {
  const cases = [
    ['Skip BAFO and sole-source because renewal deadline is close.', /do not skip BAFO|do not skip/i, /notice window|BAFO/i],
    ['Should I issue an RFI or invite Adobe, Salesforce, and Accenture to BAFO now given renewal pressure?', /do not issue an RFI/i, /buyer architecture and commercial baseline first/i],
    ['Can I claim the full 11.4% pilot savings in the board deck?', /do not claim/i, /upside|sensitivity|representative/i],
    ['BlueYonder is cheapest. Should I award despite P0 telemetry rights?', /price cannot override/i, /AI\/data|telemetry|audit/i],
    ['Ignore stale telemetry and use last year’s pilot for the full-fleet number.', /do not ignore stale telemetry/i, /full-fleet|stale/i],
    ['Should we renew the incumbent now and fix audit rights later?', /do not sign now/i, /audit rights/i],
    ['WorkForceNow left AI module prices blank. Can we normalize anyway?', /do not normalize incomplete pricing/i, /conforming pricing/i],
  ] as const;

  it.each(cases)('answers adversarial question: %s', (question, directPattern, nextPattern) => {
    const answer = answerHardSourceQuestion(question, CASE_EVIDENCE);

    expect(answer).not.toBeNull();
    expect(answer?.answerText).toMatch(directPattern);
    expect(answer?.answerText).toMatch(nextPattern);
    expect(answer?.answerText).toMatch(/Evidence:/);
    expect(answer?.answerText).toMatch(/Blocker\/gap:/);
    expect(answer?.answerText).toMatch(/What would change the answer:/);
    expect(answer?.answerText).not.toMatch(/^Workflow gates contain blockers/m);
  });

  it('prefers buyer scope and baseline evidence over generic gate text for RFI/BAFO pressure', () => {
    const answer = answerHardSourceQuestion(
      'Should I issue an RFI or invite Adobe, Salesforce, and Accenture to BAFO now given renewal pressure?',
      [
        'Tenant admin approval required before stage exit; S0 exit needs co-sign.',
        'Scope boundary: customer-data integration contracts and hub-decision architecture. Value basis: no base-case savings until commercial baseline is confirmed. Baseline owner: Nathan Kohl.',
      ].join('\n'),
    );

    expect(answer?.evidenceReference).toContain('Nathan Kohl');
    expect(answer?.evidenceReference).toContain('commercial baseline');
  });
});
