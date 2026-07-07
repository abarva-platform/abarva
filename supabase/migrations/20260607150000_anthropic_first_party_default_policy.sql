-- Azure-native standard: Anthropic/Claude is the sanctioned FIRST-PARTY reasoning
-- provider, so the platform default AI policy permits Claude (gated by data class),
-- while genuinely external providers stay off by default.
--
-- This migration is additive on top of 20260522170000_ai_egress_control_plane.sql
-- (which creates clients.ai_policy + the ai_egress_audit / tenant_policy_audit
-- tables). Apply with `npm run db:migrate`. Idempotent.
--
-- Effect:
--   1. New column default flips conservative (allowClaude:false, kernelOnlyMode:true,
--      maxDataClass:internal) -> first-party (allowClaude:true, kernelOnlyMode:false,
--      maxDataClass:confidential), matching CONSERVATIVE_TENANT_AI_POLICY in
--      src/lib/integrations/ai-egress/policy.ts.
--   2. Every existing tenant is enabled for Claude (merge — other policy fields kept).

BEGIN;

-- Safety: ensure the column exists even if the base control-plane migration has
-- not been applied on this database yet.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS ai_policy JSONB NOT NULL DEFAULT
  '{
    "allowExternalAI": false,
    "kernelOnlyMode": false,
    "allowClaude": true,
    "allowGamma": false,
    "maxDataClass": "confidential",
    "requireRedaction": true,
    "requireHumanApprovalForExports": true,
    "promptResponseRetentionDays": 0
  }'::jsonb;

-- New first-party default for future client rows.
ALTER TABLE public.clients
  ALTER COLUMN ai_policy SET DEFAULT
  '{
    "allowExternalAI": false,
    "kernelOnlyMode": false,
    "allowClaude": true,
    "allowGamma": false,
    "maxDataClass": "confidential",
    "requireRedaction": true,
    "requireHumanApprovalForExports": true,
    "promptResponseRetentionDays": 0
  }'::jsonb;

-- Default-allow Claude for every existing tenant. Merge so any other explicit
-- policy fields a tenant already has are preserved; only the first-party gates
-- (allowClaude, kernelOnlyMode, and a confidential ceiling) are set.
UPDATE public.clients
SET ai_policy = coalesce(ai_policy, '{}'::jsonb) || jsonb_build_object(
  'allowClaude', true,
  'kernelOnlyMode', false,
  'maxDataClass',
    CASE
      WHEN ai_policy ->> 'maxDataClass' IN ('restricted') THEN ai_policy ->> 'maxDataClass'
      ELSE 'confidential'
    END
);

COMMIT;
