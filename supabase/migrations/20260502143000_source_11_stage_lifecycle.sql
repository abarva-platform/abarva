-- Source 11-stage lifecycle normalization.
-- Keeps legacy stage keys readable while allowing the locked user-facing stages:
-- Strategy, Scope, RFP, Responses, Evaluation, Pricing, BAFO,
-- Executive Decision, Selection, Transition, Value.

ALTER TABLE source_events
  ALTER COLUMN current_stage_key SET DEFAULT 'strategy';

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_stage_key_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_stage_key_check
  CHECK (stage_key IN (
    'strategy',
    'scope',
    'rfp',
    'responses',
    'evaluation',
    'pricing',
    'bafo',
    'executive_decision',
    'selection',
    'transition',
    'value',
    -- legacy compatibility for artifacts uploaded before the 11-stage normalization
    'intake',
    'sourcing_strategy',
    'rfp_rfi_package',
    'vendor_responses',
    'orals_bafo',
    'contract_mobilization',
    'value_realization'
  ));
