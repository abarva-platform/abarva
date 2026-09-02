-- Home: give the declared relationship graph a reader.
--
-- The intake carries a relationship per row -- from one object to another, with a type, a strength
-- and an evidence basis -- and it is the only family that crosses the boundaries every other family
-- stops at: system to org unit, system to system, system to vendor, metric to system.
--
-- Every finding on Home today lives inside one family. The organisation chapter reports that no
-- org unit names a system it owns; this family answers the same question from the other side, and
-- nothing could reach it.
--
-- Same shape as the families added in 20260901090000 and 20260902090000: the page key joins the
-- check constraint and one view projects it. serving.home_surface_rows(surface_key_arg,
-- page_key_arg) filters on page_key only; surface_key_arg is echoed into the output as a label.
--
-- Adds a reader, writes no rows. Rows written before a reader exists pass every readback and stay
-- invisible, which is the failure this ordering avoids.

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
        'executive_interviews',
        -- The declared relationship graph.
        'relationships',
        -- Drilldowns. Each is a page a reader opens, not a family of intake rows.
        'business_unit_profile',
        'data_maturity',
        'kpi_register'
      )
    );
end $$;

create or replace view serving.home_relationships as
select * from serving.home_surface_rows('home_relationships', 'relationships');
