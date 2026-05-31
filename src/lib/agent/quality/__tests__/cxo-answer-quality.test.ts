import { validateCxoAnswer } from '../cxo-answer-quality';

describe('validateCxoAnswer', () => {
  it('fails on raw portfolio signal identifiers', () => {
    const result = validateCxoAnswer({
      text:
        'Demand Forecasting attestation is overdue — warning, signal:39901c16-2e8b-4c8c-80aa-8a0182f26754. Next step: open the evidence chain.',
      tenant: {
        tenantKey: 'apex-retail',
        tenantDisplayName: 'Apex Retail Group',
      },
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'raw_internal_id')).toBe(
      true,
    );
  });

  it('fails on implementation leakage in common CXO-facing answers', () => {
    const result = validateCxoAnswer({
      text:
        'Per-gate-risk scoring requires a query_program_gates tool that does not exist yet. Next step: open Tower.',
    });

    expect(result.passed).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === 'implementation_leak'),
    ).toBe(true);
  });

  it('fails on timeout and system-failure copy', () => {
    const result = validateCxoAnswer({
      text: 'Atlas timed out before the portfolio response came back. Try one: Lagging programs.',
    });

    expect(result.passed).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === 'timeout_or_system_failure'),
    ).toBe(true);
  });

  it('fails foreign-tenant content unless it is an honest scope denial', () => {
    const leak = validateCxoAnswer({
      text:
        'Meridian Health has a diabetes care program. Next step: review its gates.',
      tenant: {
        tenantKey: 'apex-retail',
        tenantDisplayName: 'Apex Retail Group',
      },
    });

    expect(leak.passed).toBe(false);
    expect(
      leak.issues.some((issue) => issue.code === 'foreign_tenant_reference'),
    ).toBe(true);

    const denial = validateCxoAnswer({
      text:
        'No such initiative in your scope: MH-99. Atlas did not retrieve cross-tenant content. Next step: use the Apex initiative id.',
      tenant: {
        tenantKey: 'apex-retail',
        tenantDisplayName: 'Apex Retail Group',
      },
      allowCrossTenantDenial: true,
    });

    expect(denial.passed).toBe(true);
  });

  it('fails fallback answers', () => {
    const result = validateCxoAnswer({
      text: 'Next step: review the value ledger.',
      mode: 'fallback',
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'fallback_mode')).toBe(
      true,
    );
  });

  it('fails answers without a concrete next action', () => {
    const result = validateCxoAnswer({
      text:
        'Apex Retail portfolio confidence is low because adoption is the weakest metric.',
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'no_next_action')).toBe(
      true,
    );
  });

  it('accepts the visible "- Next:" bullet as a concrete action cue', () => {
    const result = validateCxoAnswer({
      text:
        'Projected value is $10.9M from the Atlas portfolio estimate.\n- Evidence: Tracked value attainment is 74%.\n- Next: Do not treat projected value as verified value.',
    });

    expect(result.issues.some((issue) => issue.code === 'no_next_action')).toBe(
      false,
    );
  });

  it('does not treat a multi-line executive list as a wall of text', () => {
    const result = validateCxoAnswer({
      text: [
        'What to do next',
        '1. Route the attestation to the accountable owner this week and record the completion date.',
        '2. Confirm the trustworthiness drop is not masking model drift before accepting the issue as paperwork.',
        '3. Note the finding in the pending funding posture so the board sees the control gap was handled.',
        '- Next: close the attestation before the next governance review.',
      ].join('\n'),
      mode: 'live',
    });

    expect(result.issues.some((issue) => issue.code === 'wall_of_text')).toBe(false);
  });

  it('passes a readable decision-grade answer', () => {
    const result = validateCxoAnswer({
      text:
        'Apex Retail portfolio confidence is low because adoption is the weakest measured metric. Next step: open the adoption evidence for the largest funded program and decide whether the next gate needs a hold.',
      tenant: {
        tenantKey: 'apex-retail',
        tenantDisplayName: 'Apex Retail Group',
      },
      mode: 'live',
    });

    expect(result).toEqual({ passed: true, issues: [] });
  });
});
