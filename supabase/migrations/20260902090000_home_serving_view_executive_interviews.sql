-- Home: give the interview family a reader.
--
-- The intake carries 221 executive-interview rows per tenant across 29 columns -- 23 interviews,
-- 19 stakeholder roles, 8 executive areas -- and every row names the systems, risks, metrics,
-- initiatives and data domains it refers to. It is the only family that joins leadership opinion to
-- the estate by name.
--
-- None of it reaches the product. The chapter that asks what leaders agree on, disagree on and
-- worry about renders four written insights over no openable evidence at all.
--
-- Same shape as the five families added in 20260901090000: the page key joins the check
-- constraint, and one view projects it. serving.home_surface_rows(surface_key_arg, page_key_arg)
-- filters on page_key only; surface_key_arg is echoed into the output as a label.
--
-- This migration adds a reader. It writes no rows: loading the family is a separate, gated step,
-- and rows written before this exists would pass every readback and stay invisible.

do $$
begin
  alter table if exists ecl_projection.home_enterprise_landscape
    drop constraint if exists home_enterprise_landscape_page_check;

  alter table if exists ecl_projection.home_enterprise_landscape
    add constraint home_enterprise_landscape_page_check check (
      page_key in (
        'executive_brief',
        'our_business',
        'strategy_value_creation',
        'how_we_operate',
        'technology_data',
        'performance_value',
        'leadership_perspective',
        'what_needs_attention',
        'current_state_architecture',
        'current_state_data_flow',
        'what_has_been_loaded',
        'browse_the_record',
        'applications_systems',
        'vendor_contracts',
        'infrastructure_platforms',
        'data_assets_integrations',
        'metrics_outcomes',
        'risks_controls',
        'programs_initiatives',
        'org_ownership',
        'ai_use_cases',
        -- The interview family.
        'executive_interviews',
        -- Drilldowns. Each is a page a reader opens, not a family of intake rows.
        'business_unit_profile',
        'data_maturity',
        'kpi_register'
      )
    );
end $$;

create or replace view serving.home_executive_interviews as
select * from serving.home_surface_rows('home_executive_interviews', 'executive_interviews');
