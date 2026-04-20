-- Demo seed for Intelligence Zone 3 signals
--
-- Populates portfolio_signals for Meridian Health with the 4 demo signals
-- referenced in Packet 8 (Prat demo script): the $2.3M Abridge/DAX
-- contradiction, vendor overlap on prior-auth, emerging ambient-docs
-- pattern, and shadow AI inventory warning.
--
-- Idempotent: each INSERT guarded by NOT EXISTS on (client_id, category,
-- headline) so re-running does nothing.

DO $$
DECLARE
  v_meridian_id UUID;
BEGIN
  SELECT id INTO v_meridian_id FROM clients WHERE name ILIKE 'Meridian Health%' LIMIT 1;
  IF v_meridian_id IS NULL THEN
    RAISE NOTICE 'Meridian client not found — skipping Intelligence demo signals';
    RETURN;
  END IF;

  INSERT INTO portfolio_signals (client_id, category, severity, headline, context_jsonb, sponsor_notified, fired_at)
  SELECT v_meridian_id, 'contradiction', 'critical',
    '$2.3M overlap between DAX and Abridge ambient-docs programs',
    jsonb_build_object(
      'delta_usd', 2300000,
      'vendor_a', 'DAX (Nuance)',
      'vendor_b', 'Abridge',
      'so_what', 'Both running as separate pilots with CMIO + CDO as shared sponsors. Rationalize before either scales.',
      'recommended_action', 'Reconcile scope or pick one before Phase 3 gate'
    ),
    true, now() - interval '2 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_signals
    WHERE client_id = v_meridian_id AND category = 'contradiction'
      AND headline = '$2.3M overlap between DAX and Abridge ambient-docs programs'
  );

  INSERT INTO portfolio_signals (client_id, category, severity, headline, context_jsonb, sponsor_notified, fired_at)
  SELECT v_meridian_id, 'vendor_overlap', 'warning',
    'Prior-auth stack has 3 overlapping vendors ($1.8M/yr)',
    jsonb_build_object(
      'overlap_usd', 1800000,
      'vendors', jsonb_build_array('Cohere Health', 'Olive AI', 'Notable'),
      'so_what', 'Three vendors touching the same workflow at different denial stages. Consolidation opportunity at next renewal.',
      'recommended_action', 'Schedule joint Q3 review with revenue cycle lead'
    ),
    false, now() - interval '5 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_signals
    WHERE client_id = v_meridian_id AND category = 'vendor_overlap'
      AND headline = 'Prior-auth stack has 3 overlapping vendors ($1.8M/yr)'
  );

  INSERT INTO portfolio_signals (client_id, category, severity, headline, context_jsonb, sponsor_notified, fired_at)
  SELECT v_meridian_id, 'pattern_emerging', 'info',
    'Ambient documentation adoption crossing 40% in Tier-1 health systems',
    jsonb_build_object(
      'cohort_size', 6,
      'median_adoption_pct', 42,
      'range_pct', jsonb_build_array(28, 61),
      'so_what', 'Not a leading indicator anymore — becoming table stakes. Your rollout timing matters.',
      'source', 'AbarVa emergent layer · verified cohort · n=6'
    ),
    false, now() - interval '1 day'
  WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_signals
    WHERE client_id = v_meridian_id AND category = 'pattern_emerging'
      AND headline = 'Ambient documentation adoption crossing 40% in Tier-1 health systems'
  );

  INSERT INTO portfolio_signals (client_id, category, severity, headline, context_jsonb, sponsor_notified, fired_at)
  SELECT v_meridian_id, 'shadow_ai', 'warning',
    '17 unsanctioned AI tools detected across clinical operations',
    jsonb_build_object(
      'shadow_count', 17,
      'top_tools', jsonb_build_array('ChatGPT Plus', 'Claude Desktop', 'Perplexity Pro'),
      'so_what', 'PHI exposure risk is real — no BAAs, no audit trail. Governance gap before next HIPAA review.',
      'recommended_action', 'Run 30-day sanction-or-block program with CISO'
    ),
    true, now() - interval '8 hours'
  WHERE NOT EXISTS (
    SELECT 1 FROM portfolio_signals
    WHERE client_id = v_meridian_id AND category = 'shadow_ai'
      AND headline = '17 unsanctioned AI tools detected across clinical operations'
  );
END $$;
