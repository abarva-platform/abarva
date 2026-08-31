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
        'ai_use_cases'
      )
    );
end $$;
