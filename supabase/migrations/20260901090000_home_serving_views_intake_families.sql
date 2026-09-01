-- Home: give every projected page key a reader.
--
-- Five intake families were mapped in application code and allowed by the page-key check
-- constraint, but no serving view selected them. Rows written under those page keys land in
-- ecl_projection.home_enterprise_landscape, pass every readback, and are invisible to the product:
-- the application reads a fixed union of serving.home_* views, and none of them covered these.
--
-- Writing the rows before this migration produces a clean load report and no change on the page.
--
-- serving.home_surface_rows(surface_key_arg, page_key_arg) filters on page_key only; surface_key_arg
-- is echoed into the output as a label. Each view below is therefore a straight projection of one
-- page key, matching the sixteen that already exist.

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
        -- Drilldowns. Each is a page a reader opens, not a family of intake rows.
        'business_unit_profile',
        'data_maturity',
        'kpi_register'
      )
    );
end $$;

-- The five intake families.
create or replace view serving.home_metrics_outcomes as
select * from serving.home_surface_rows('home_metrics_outcomes', 'metrics_outcomes');

create or replace view serving.home_risks_controls as
select * from serving.home_surface_rows('home_risks_controls', 'risks_controls');

create or replace view serving.home_programs_initiatives as
select * from serving.home_surface_rows('home_programs_initiatives', 'programs_initiatives');

create or replace view serving.home_org_ownership as
select * from serving.home_surface_rows('home_org_ownership', 'org_ownership');

create or replace view serving.home_ai_use_cases as
select * from serving.home_surface_rows('home_ai_use_cases', 'ai_use_cases');

-- The three drilldowns.
create or replace view serving.home_business_unit_profile as
select * from serving.home_surface_rows('home_business_unit_profile', 'business_unit_profile');

create or replace view serving.home_data_maturity as
select * from serving.home_surface_rows('home_data_maturity', 'data_maturity');

create or replace view serving.home_kpi_register as
select * from serving.home_surface_rows('home_kpi_register', 'kpi_register');
