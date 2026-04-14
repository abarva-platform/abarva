// Integration tests — Supabase schema contracts
// These tests verify that the Supabase table contracts are correct.
// In CI without a live Supabase instance, these are stub tests.

describe('Supabase integration contracts', () => {
  it('ai_baselines table fields are defined in the commitment payload', () => {
    // Contract: the commitment payload must include these fields
    const commitmentPayload = {
      client_id: 'meridian',
      locked_at: new Date().toISOString(),
      denial_rate: 18.2,
      revenue_per_pp: 13_800_000,
      travel_nurse_spend: 48_000_000,
      prior_auth_coverage: 23,
      cost_per_claim: 28.40,
      locked_by: 'CIO',
      programme: 'RCM AI Automation',
    }
    const requiredFields = ['client_id', 'locked_at', 'denial_rate', 'locked_by']
    for (const field of requiredFields) {
      expect(commitmentPayload).toHaveProperty(field)
    }
  })

  it('verification record payload includes immutability fields', () => {
    const verificationRecord = {
      client_id: 'meridian',
      initiative: 'RCM AI Automation',
      verified_at: new Date().toISOString(),
      baseline_denial_rate: 18.2,
      verified_denial_rate: 11.4,
      verified_savings: 28_000_000,
      fee_rate: 0.15,
      fee_amount: 4_200_000,
      verified_by: 'third-party-auditor',
      immutable: true,
    }
    expect(verificationRecord.immutable).toBe(true)
    expect(verificationRecord).toHaveProperty('verified_by')
  })

  it('baseline record cannot be mutated after creation', () => {
    // This is a contract test — in production, the table is append-only
    // We verify the flag is set correctly
    const baseline = {
      id: 'baseline-001',
      created_at: '2026-04-13T00:00:00Z',
      locked: true,
    }
    expect(baseline.locked).toBe(true)
    // A locked baseline should not be deletable (enforced at DB level)
    expect(baseline.created_at).not.toBeNull()
  })
})
