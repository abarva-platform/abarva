-- Source artifact registry · Value Realization family
-- Adds a first-class value_ledger family so generated Value-stage packets do
-- not fall through to `other`.

ALTER TABLE source_artifacts DROP CONSTRAINT IF EXISTS source_artifacts_family_check;
ALTER TABLE source_artifacts ADD CONSTRAINT source_artifacts_family_check
  CHECK (artifact_family IN (
    'rfi',
    'rfp',
    'bafo',
    'scorecard',
    'pricing_workbook',
    'proposal',
    'meeting_notes',
    'workshop_output',
    'decision_brief',
    'transition_risk_register',
    'value_ledger',
    'sourcing_strategy',
    'scope_document',
    'other'
  ));
