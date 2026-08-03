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
