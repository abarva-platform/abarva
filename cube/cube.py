from cube import config


TENANT_FILTERABLE_CUBES = {
    "sourcing_vendors",
    "sourcing_contracts",
    "sourcing_contract_scope",
    "sourcing_spend_monthly",
    "sourcing_performance",
    "sourcing_opportunities",
    "sourcing_events",
    "sourcing_event_suppliers",
    "source_v4_vendors",
    "source_v4_contracts",
    "source_v4_contract_scope",
    "source_v4_spend_monthly",
    "source_v4_performance",
    "source_v4_saas_usage",
    "source_v4_cloud_cost",
    "source_v4_workforce_rate_cards",
    "source_v4_sourcing_events",
    "source_v4_context_coverage",
    "meridian_health_vendor_portfolio",
    "meridian_health_contract_families",
    "meridian_health_contract_scope",
    "meridian_health_spend_invoice_history",
    "meridian_health_workforce_rate_card_economics",
    "meridian_health_sla_itsm_performance",
    "meridian_health_service_credits",
    "meridian_health_application_dependencies",
    "meridian_health_renewal_exit_terms",
    "meridian_health_program_dependencies",
    "meridian_health_enterprise_outcomes",
    "meridian_health_bpo_baseline",
    "meridian_health_supplier_proposals_bafo",
    "meridian_health_rebadge_transition_commitments",
    "meridian_health_ai_automation_commitments",
    "meridian_health_retained_org_scenarios",
    "meridian_health_normalized_tco_inputs",
    "meridian_health_event_context_snapshot",
}

VIEW_TO_CUBES = {
    "source_executive_portfolio": ["sourcing_contracts", "sourcing_opportunities"],
    "source_vendor_concentration": ["sourcing_vendors"],
    "source_renewal_exposure": ["sourcing_contracts"],
    "source_contract_scope_confidence": ["sourcing_contract_scope"],
    "source_spend_consumption": ["sourcing_spend_monthly"],
    "source_performance_and_credits": ["sourcing_performance"],
    "source_opportunity_pipeline": ["sourcing_opportunities"],
    "source_event_execution": ["sourcing_events", "sourcing_event_suppliers"],
    "source_supplier_comparison": ["sourcing_event_suppliers"],
    "source_v4_executive_portfolio": [
        "source_v4_contracts",
        "source_v4_context_coverage",
    ],
    "source_v4_vendor_concentration": ["source_v4_vendors"],
    "source_v4_renewal_exposure": ["source_v4_contracts"],
    "source_v4_scope_confidence": ["source_v4_contract_scope"],
    "source_v4_spend_consumption": ["source_v4_spend_monthly"],
    "source_v4_performance_credits": ["source_v4_performance"],
    "source_v4_ai_usage_value_proof": ["source_v4_saas_usage"],
    "source_v4_cloud_optimization": ["source_v4_cloud_cost"],
    "source_v4_workforce_rate_card": ["source_v4_workforce_rate_cards"],
    "source_v4_sourcing_event_bafo": ["source_v4_sourcing_events"],
    "meridian_health_vendor_360": ["meridian_health_vendor_portfolio", "meridian_health_contract_families"],
    "meridian_health_contract_360": [
        "meridian_health_contract_families",
        "meridian_health_contract_scope",
        "meridian_health_sla_itsm_performance",
        "meridian_health_service_credits",
    ],
    "meridian_health_bpo_supplier_comparison": [
        "meridian_health_bpo_baseline",
        "meridian_health_supplier_proposals_bafo",
        "meridian_health_rebadge_transition_commitments",
        "meridian_health_ai_automation_commitments",
        "meridian_health_retained_org_scenarios",
        "meridian_health_normalized_tco_inputs",
    ],
    "meridian_health_decision_handoff": [
        "meridian_health_normalized_tco_inputs",
        "meridian_health_event_context_snapshot",
        "meridian_health_program_dependencies",
        "meridian_health_application_dependencies",
    ],
}


@config("query_rewrite")
def query_rewrite(query, ctx):
    tenant_key = ctx.get("securityContext", {}).get("tenant_key")
    if not tenant_key:
        raise Exception("tenant_key is required in Cube securityContext")

    members = []
    members.extend(query.get("measures", []))
    members.extend(query.get("dimensions", []))
    for time_dimension in query.get("timeDimensions", []):
        if time_dimension.get("dimension"):
            members.append(time_dimension["dimension"])

    prefixes = {member.split(".")[0] for member in members if "." in member}
    cubes = set()
    for prefix in prefixes:
        if prefix in TENANT_FILTERABLE_CUBES:
            cubes.add(prefix)
        for cube in VIEW_TO_CUBES.get(prefix, []):
            cubes.add(cube)

    query.setdefault("filters", [])
    for cube in sorted(cubes):
        query["filters"].append({
            "member": f"{cube}.tenant_key",
            "operator": "equals",
            "values": [tenant_key],
        })
    return query
