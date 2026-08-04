-- Tower value funnel unknown-safe logical view.
--
-- Local/operator DDL for the new Tower schema. This replaces the legacy
-- `tower.value_funnel` behavior that used COALESCE(value, 0), which made
-- unknown financial value indistinguishable from evidenced zero.
--
-- Do not apply to shared production from an ad-hoc branch. Apply only through
-- the approved database change lane after review.

create or replace view tower.value_funnel as
select
  tenant_key,
  count(*)::integer as claim_count,
  count(*) filter (where promised_value is not null)::integer as known_promised_claim_count,
  count(*) filter (where promised_value is null)::integer as unknown_promised_claim_count,
  sum(promised_value) filter (where promised_value is not null) as promised_value,
  count(*) filter (
    where calculated_value is not null
      and claim_state in ('usage_supported', 'finance_validated', 'claimable')
  )::integer as known_usage_supported_claim_count,
  count(*) filter (
    where calculated_value is null
      and claim_state in ('usage_supported', 'finance_validated', 'claimable')
  )::integer as unknown_usage_supported_claim_count,
  sum(calculated_value) filter (
    where calculated_value is not null
      and claim_state in ('usage_supported', 'finance_validated', 'claimable')
  ) as usage_supported_value,
  count(*) filter (
    where calculated_value is not null
      and claim_state in ('finance_validated', 'claimable')
  )::integer as known_finance_validated_claim_count,
  count(*) filter (
    where calculated_value is null
      and claim_state in ('finance_validated', 'claimable')
  )::integer as unknown_finance_validated_claim_count,
  sum(calculated_value) filter (
    where calculated_value is not null
      and claim_state in ('finance_validated', 'claimable')
  ) as finance_validated_value,
  count(*) filter (
    where calculated_value is not null
      and claim_state = 'claimable'
  )::integer as known_claimable_claim_count,
  count(*) filter (
    where calculated_value is null
      and claim_state = 'claimable'
  )::integer as unknown_claimable_claim_count,
  sum(calculated_value) filter (
    where calculated_value is not null
      and claim_state = 'claimable'
  ) as claimable_value,
  count(*) filter (where claim_state <> 'claimable')::integer as blocked_claim_count,
  count(*) filter (
    where promised_value is null
      and claim_state <> 'claimable'
  )::integer as unknown_blocked_claim_count,
  sum(promised_value) filter (
    where promised_value is not null
      and claim_state <> 'claimable'
  ) as blocked_value,
  count(*) filter (where claim_state = 'disputed')::integer as disputed_claim_count,
  sum(promised_value) filter (
    where promised_value is not null
      and claim_state = 'disputed'
  ) as disputed_value,
  count(*) filter (where stale_at is not null)::integer as stale_claim_count,
  sum(promised_value) filter (
    where promised_value is not null
      and stale_at is not null
  ) as stale_value
from tower.value_claim_current
group by tenant_key;
