alter table ecl_projection.tower_value_chain
  alter column claimable_value_usd drop not null,
  alter column claimable_value_usd drop default,
  alter column blocked_value_usd drop not null,
  alter column blocked_value_usd drop default;

alter table ecl_projection.tower_evidence_queue
  alter column priority_score drop not null,
  alter column priority_score drop default;

alter table ecl_projection.tower_value_chain
  add constraint tower_value_chain_unknown_amounts_check
  check (
    value_state not in ('unknown', 'not_applicable')
    or (claimable_value_usd is null and blocked_value_usd is null)
  ) not valid;
