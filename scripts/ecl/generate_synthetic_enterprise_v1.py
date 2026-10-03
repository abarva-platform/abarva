#!/usr/bin/env python3
"""Build one ID-led synthetic enterprise manifest, then export owner-shaped sources.

This is a deterministic Layer 1 fixture, not an approved load or client attestation.
Every cross-family reference comes from an ID in the manifest. The only dangling
reference is the deliberately declared unknown dependency.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from synthetic_source_versions import load_definition


ROOT = Path(__file__).resolve().parents[2]
TENANT_REGISTRY = ROOT / "datasets/tenant-inputs/tenant-input-registry.json"
FAMILIES = {
    "SP00_Enterprise_Profile": "Enterprise_Profile_SYNTHETIC.csv",
    "SP01_Documents_Interviews": "Leadership_Interview_Notes_SYNTHETIC.csv",
    "SP02_HRIS": "HRIS_Workforce_Role_Summary_SYNTHETIC.csv",
    "SP03_CMDB": "ServiceNow_Business_Applications_SYNTHETIC.csv",
    "SP04_Data_BI_ETL": "BI_ETL_Analytics_Volumes_SYNTHETIC.csv",
    "SP05_Infrastructure": "Hosting_Platforms_SYNTHETIC.csv",
    "SP06_Finance_ERP": "GL_Budget_Actuals_SYNTHETIC.csv",
    "SP07_PPM": "PPM_Programs_SYNTHETIC.csv",
    "SP08_Vendor_Contract": "Contract_Register_SYNTHETIC.csv",
    "SP09_GRC": "GRC_Risk_Control_Exceptions_SYNTHETIC.csv",
    "SP10_KPI_Operations": "KPI_Operations_Summary_SYNTHETIC.csv",
    "SP11_AI_Usage_Models": "AI_Usage_Telemetry_SYNTHETIC.csv",
    "SP12_Evidence_Room": "Evidence_Request_Register_SYNTHETIC.csv",
    "SP13_Data_Flows_Integrations": "Data_Flows_Integrations_SYNTHETIC.csv",
    "SP14_Deployments_Hosting": "Application_Deployments_Hosting_SYNTHETIC.csv",
    "SP15_Enterprise_Structure": "Business_Segments_SYNTHETIC.csv",
    "SP16_Organization_Functions": "Business_Functions_SYNTHETIC.csv",
    "SP17_Relationships": "Declared_Relationships_SYNTHETIC.csv",
    "SP18_Strategy_Priorities": "Strategic_Priorities_SYNTHETIC.csv",
    "SP19_Vendors": "Supplier_Master_SYNTHETIC.csv",
    "SP20_Leadership_Owners": "Accountable_Owners_SYNTHETIC.csv",
    "SP21_External_Benchmarks": "External_Benchmarks_SYNTHETIC.csv",
}

SERVICE_ROLES = ("Portal", "Workbench", "Rules Service", "Integration Service")


def pick(parts: tuple[object, ...], count: int) -> int:
    digest = hashlib.sha256("|".join(map(str, parts)).encode()).digest()
    return int.from_bytes(digest[:8], "big") % count


def weighted_pick(parts: tuple[object, ...], values: list[tuple[str, int]]) -> str:
    ticket = pick(parts, sum(weight for _, weight in values))
    for value, weight in values:
        if ticket < weight:
            return value
        ticket -= weight
    raise ValueError("Weighted choice has no positive weight")


def money(value: int) -> str:
    return str(value)


def hash_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    columns = list(dict.fromkeys(key for row in rows for key in row))
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def build(definition: dict[str, Any]) -> dict[str, Any]:
    registry = json.loads(TENANT_REGISTRY.read_text(encoding="utf-8"))
    tenant = next((entry for entry in registry["activeTenants"]
                   if entry["tenantKey"] == definition["tenant_key"]), None)
    if not tenant or not any(packet.get("classification") == "synthetic-demo"
                             for packet in tenant.get("packets", [])):
        raise ValueError("Definition tenant must be an active registry-declared synthetic tenant")
    dataset = definition["dataset_id"]
    as_of = definition["as_of"]
    rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    objects: dict[str, dict[str, Any]] = {}
    relationships: list[dict[str, Any]] = []
    edge_keys: set[tuple[str, str, str]] = set()

    def add(family: str, object_type: str, object_id: str, name: str, fields: dict[str, Any], *,
            evidence_class: str = "synthetic_reference", source_as_of: str = as_of) -> None:
        if object_id in objects:
            raise ValueError(f"Duplicate governed ID: {object_id}")
        if family not in FAMILIES:
            raise ValueError(f"Unknown source family: {family}")
        base = {
            "source_row_id": object_id,
            "governed_object_id": object_id,
            "synthetic_dataset_id": dataset,
            "synthetic_generation_basis": definition["generation_basis"],
            "client_attestation_state": "not_client_attested",
            "provenance_class": evidence_class,
            "source_basis": "synthetic_generated",
            "review_state": "candidate",
            "source_as_of": source_as_of,
        }
        row = {**base, **fields}
        rows[family].append(row)
        objects[object_id] = {
            "object_id": object_id,
            "object_type": object_type,
            "name": name,
            "source_family": family,
            "source_row_id": object_id,
            "provenance_class": evidence_class,
            "source_as_of": source_as_of,
            "attributes": fields,
        }

    def relation(from_id: str, verb: str, to_id: str, *, state: str = "resolved") -> None:
        key = (from_id, verb, to_id)
        if key in edge_keys:
            return
        edge_keys.add(key)
        relationships.append({
            "relationship_id": f"REL-{len(relationships) + 1:05d}",
            "from_object_id": from_id,
            "relationship_type": verb,
            "to_object_id": to_id,
            "resolution_state": state,
            "provenance_class": "synthetic_reference",
            "source_as_of": as_of,
        })

    ent = definition["enterprise"]
    add("SP00_Enterprise_Profile", "enterprise", ent["id"], ent["name"], {
        "enterprise_id": ent["id"], "enterprise_name": ent["name"],
        "business_model": ent["description"], "annual_revenue_usd": "20000000000",
        "business_model_basis": "synthetic_reference_not_client_attested",
    })
    owners = definition["owners"]
    owner_by_id = {owner["id"]: owner for owner in owners}
    for owner in owners:
        add("SP20_Leadership_Owners", "owner", owner["id"], owner["role"], {
            "owner_id": owner["id"], "owner_role": owner["role"],
            "accountability": owner["accountability"], "row_type": "owner",
        })

    segments = definition["segments"]
    segment_by_id = {segment["id"]: segment for segment in segments}
    for segment in segments:
        add("SP15_Enterprise_Structure", "business_segment", segment["id"], segment["name"], {
            "segment_id": segment["id"], "segment_key": segment["id"],
            "segment_name": segment["name"], "revenue_share_pct": segment["revenue_share_pct"],
            "revenue_usd": money(segment["revenue_usd"]),
            "pnl_owner_id": segment["owner_id"],
            "pnl_owner_role": owner_by_id[segment["owner_id"]]["role"],
            "classification_basis": "synthetic_reference_not_client_declared",
        })
        relation(ent["id"], "HAS_SEGMENT", segment["id"])
        relation(segment["id"], "ACCOUNTABLE_TO", segment["owner_id"])

    functions = definition["functions"]
    function_by_id = {function["id"]: function for function in functions}
    for function in functions:
        add("SP16_Organization_Functions", "business_function", function["id"], function["name"], {
            "function_id": function["id"], "function_name": function["name"],
            "business_segment_id": function["segment_id"],
            "business_segment_key": function["segment_id"],
            "executive_owner_id": function["owner_id"],
            "executive_owner": owner_by_id[function["owner_id"]]["role"],
            "row_type": "function",
            "known_gaps": "Shared service; segment attribution requires allocation basis." if not function["segment_id"] else "",
        })
        relation(ent["id"], "HAS_FUNCTION", function["id"])
        relation(function["id"], "ACCOUNTABLE_TO", function["owner_id"])
        if function["segment_id"]:
            relation(function["id"], "BELONGS_TO_SEGMENT", function["segment_id"])

    priorities = definition["priorities"]
    priority_by_id = {priority["id"]: priority for priority in priorities}
    for priority in priorities:
        add("SP18_Strategy_Priorities", "priority", priority["id"], priority["name"], {
            "priority_id": priority["id"], "priority_name": priority["name"],
            "target_outcome": priority["target"], "owner_id": priority["owner_id"],
            "segment_id": priority["segment_id"], "row_type": "priority",
        })
        relation(ent["id"], "HAS_PRIORITY", priority["id"])
        relation(priority["id"], "ACCOUNTABLE_TO", priority["owner_id"])
        if priority["segment_id"]:
            relation(priority["id"], "TARGETS_SEGMENT", priority["segment_id"])

    vendors = definition["vendor_names"]
    for i, name in enumerate(vendors, start=1):
        vendor_id = f"VEN-{i:04d}"
        add("SP19_Vendors", "vendor", vendor_id, name, {
            "vendor_id": vendor_id, "supplier_name": name, "row_type": "vendor",
        })

    app_products = definition["app_products"]
    product_vendor = {
        "Epic Tapestry": "Epic Systems Corporation", "Facets": "TriZetto Corporation",
        "HealthRules Payor": "HealthEdge Software", "QNXT": "Cognizant Technology Solutions",
        "Jiva": "ZeOmega", "TruCare": "Casenet", "Epic Hyperspace": "Epic Systems Corporation",
        "Epic Beaker": "Epic Systems Corporation", "Epic Radiant": "Epic Systems Corporation",
        "Oracle Health Millennium": "Oracle Corporation", "Meditech Expanse": "Oracle Corporation",
        "Workday Financial Management": "Workday Inc.", "Workday HCM": "Workday Inc.",
        "Infor Lawson ERP": "Infor Inc.", "ServiceNow ITSM": "ServiceNow Inc.",
        "Tableau Server": "Salesforce Inc.", "Power BI Premium": "Microsoft Corporation",
        "Informatica PowerCenter": "Informatica LLC", "Netezza Warehouse": "IBM Corporation",
        "Snowflake Enterprise": "Snowflake Inc.", "MuleSoft Anypoint": "MuleSoft LLC",
        "Azure API Management": "Microsoft Corporation", "Salesforce Health Cloud": "Salesforce Inc.",
        "Kronos Workforce": "Workday Inc.",
    }
    if set(product_vendor) != set(app_products):
        raise ValueError("Every application product needs a declared supplier")
    if set(definition["app_function_ids"]) != set(app_products):
        raise ValueError("Every application product needs a declared function ID")
    if not set(definition["app_function_ids"].values()).issubset(function_by_id):
        raise ValueError("Application product references an unknown function ID")
    workflows = definition["module_workflows_by_function"]
    service_areas = definition["service_areas"]
    if set(workflows) != set(function_by_id) or not service_areas or any(len(items) != 3 for items in workflows.values()):
        raise ValueError("Every function needs three declared module workflows and at least one service area")
    vendor_number_by_name = {name: index for index, name in enumerate(vendors, start=1)}
    service_capabilities = definition.get("service_capabilities_by_function", {})
    service_suppliers = definition.get("service_suppliers_by_function", {})
    if service_capabilities and (
        set(service_capabilities) != set(function_by_id)
        or set(service_suppliers) != set(function_by_id)
        or any(not 4 <= len(items) <= 8 or len(set(items)) != len(items)
               for items in service_capabilities.values())
        or len({len(items) for items in service_capabilities.values()}) < 3
        or any(not items or not set(items).issubset(vendors) for items in service_suppliers.values())
    ):
        raise ValueError("Logical service capabilities or suppliers are incomplete")
    service_count = sum(len(items) for items in service_capabilities.values()) * len(SERVICE_ROLES)
    app_weights = [
        (1 + (8 if i % 31 == 0 else 0) + (4 if i % 11 == 0 else 0))
        * (0.7 + pick(("app-cost", i), 100) / 100)
        for i in range(1, 751 + service_count)
    ]
    app_weight_total = sum(app_weights)
    apps: list[str] = []
    for i in range(1, 751):
        app_id = f"APP-{i:04d}"
        product = app_products[(i - 1) % len(app_products)]
        function = function_by_id[definition["app_function_ids"][product]]
        supplier_name = product_vendor[product]
        vendor_id = f"VEN-{vendor_number_by_name[supplier_name]:04d}"
        segment_id = function["segment_id"]
        owner_id = "" if i % 61 == 0 else function["owner_id"]
        module_number = (i - 1) // len(app_products)
        is_module = module_number > 0
        parent_application_id = f"APP-{(i - 1) % len(app_products) + 1:04d}" if is_module else ""
        workflow = workflows[function["id"]][(module_number - 1) % 3] if is_module else ""
        service_area = service_areas[((module_number - 1) // 3) % len(service_areas)] if is_module else ""
        name = f"{product} - {workflow.title()} ({service_area})" if is_module else product
        add("SP03_CMDB", "application", app_id, name, {
            "application_id": app_id, "application_name": name,
            "base_product_name": product, "vendor_id": vendor_id,
            "application_grain": "governed_module" if is_module else "logical_product",
            "parent_application_id": parent_application_id,
            "module_workflow": workflow, "service_area": service_area,
            "vendor_name": supplier_name,
            "business_function_id": function["id"], "business_function": function["name"],
            "segment_id": segment_id, "business_owner_id": owner_id,
            "business_owner": owner_by_id[owner_id]["role"] if owner_id else "",
            "technical_owner": "Technology platform operations",
            "application_domain": "clinical" if segment_id == "SEG-0002" else "health_plan" if segment_id == "SEG-0001" else "shared",
            "application_subdomain": product.lower().replace(" ", "_")[:32],
            "criticality_tier": "tier_1" if product in {
                "Epic Tapestry", "Facets", "HealthRules Payor", "QNXT", "Epic Hyperspace",
                "Epic Beaker", "Epic Radiant", "Oracle Health Millennium", "Meditech Expanse",
            } or i % 19 == 0 else "tier_2" if i % 3 == 0 else "tier_3",
            "lifecycle_state": "replace_candidate" if i % 13 == 0 else "current",
            "hosting_model": ("saas", "on_prem", "aws_hosted", "azure_hosted")[i % 4],
            "annual_cost_usd": money(round(436500000 * app_weights[i - 1] / app_weight_total)),
            "annual_cost_basis": "synthetic_modeled",
            "cost_scope": "module_run_allocation" if is_module else "product_license_allocation",
            "interface_count": 2 + i % 11, "environment_count": 1 + i % 4,
            "user_count_estimate": 75 + i * 19 % 12000,
            "known_gaps": "Business owner not attributed." if not owner_id else "",
        })
        relation(function["id"], "SUPPORTED_BY", app_id)
        relation(app_id, "SUPPLIED_BY", vendor_id)
        if is_module:
            relation(app_id, "MODULE_OF", parent_application_id)
        if owner_id:
            relation(app_id, "ACCOUNTABLE_TO", owner_id)
        apps.append(app_id)

    for function_id, capabilities in service_capabilities.items():
        function = function_by_id[function_id]
        for capability in capabilities:
            for role in SERVICE_ROLES:
                i = len(apps) + 1
                app_id = f"APP-{i:04d}"
                name = f"{function['name']} - {capability} {role}"
                supplier_names = service_suppliers[function_id]
                supplier_name = supplier_names[pick(("logical-service-supplier", i), len(supplier_names))]
                vendor_id = f"VEN-{vendor_number_by_name[supplier_name]:04d}"
                segment_id = function["segment_id"]
                add("SP03_CMDB", "application", app_id, name, {
                    "application_id": app_id, "application_name": name,
                    "base_product_name": name, "vendor_id": vendor_id,
                    "application_grain": "logical_service", "parent_application_id": "",
                    "module_workflow": "", "service_area": "",
                    "vendor_name": supplier_name,
                    "business_function_id": function_id, "business_function": function["name"],
                    "segment_id": segment_id, "business_owner_id": function["owner_id"],
                    "business_owner": owner_by_id[function["owner_id"]]["role"],
                    "technical_owner": "Technology platform operations",
                    "application_domain": "clinical" if segment_id == "SEG-0002" else "health_plan" if segment_id == "SEG-0001" else "shared",
                    "application_subdomain": capability.lower().replace(" ", "_")[:32],
                    "criticality_tier": "tier_1" if i % 17 == 0 else "tier_2" if i % 3 == 0 else "tier_3",
                    "lifecycle_state": "replace_candidate" if i % 23 == 0 else "current",
                    "hosting_model": ("saas", "on_prem", "aws_hosted", "azure_hosted")[i % 4],
                    "annual_cost_usd": money(round(436500000 * app_weights[i - 1] / app_weight_total)),
                    "annual_cost_basis": "synthetic_modeled",
                    "cost_scope": "logical_service_run_allocation",
                    "interface_count": 2 + i % 11, "environment_count": 1 + i % 4,
                    "user_count_estimate": 75 + i * 19 % 12000,
                    "known_gaps": "",
                })
                relation(function_id, "SUPPORTED_BY", app_id)
                relation(app_id, "SUPPLIED_BY", vendor_id)
                relation(app_id, "ACCOUNTABLE_TO", function["owner_id"])
                apps.append(app_id)

    platforms: list[str] = []
    platform_weights = [("cloud_account", 35), ("database_cluster", 24), ("virtualization", 18),
                        ("data_center", 10), ("integration_platform", 13)]
    for i in range(1, 221):
        platform_id = f"PLAT-{i:04d}"
        function = functions[pick(("platform-function", i), len(functions))]
        platform_type = weighted_pick(("platform-type", i), platform_weights)
        add("SP05_Infrastructure", "platform", platform_id, f"{platform_type.replace('_', ' ').title()} {i:02d}", {
            "platform_id": platform_id, "platform_name": f"{platform_type.replace('_', ' ').title()} {i:02d}",
            "platform_type": platform_type, "business_function_id": function["id"],
            "business_function": function["name"], "capacity_value": 60 + i * 13 % 900,
            "capacity_unit": "nodes", "utilization_percent": 34 + i * 7 % 59,
            "dr_tier": "backup_only" if i % 11 == 0 else "warm" if i % 3 == 0 else "active_active",
            "owner_id": "OWN-0005",
        })
        relation(platform_id, "ACCOUNTABLE_TO", "OWN-0005")
        platforms.append(platform_id)

    for i in range(1, 1651):
        app_id = apps[(i - 1) % len(apps)]
        platform_id = platforms[pick(("hosting", i), len(platforms))]
        deploy_id = f"DEP-{i:04d}"
        environment = "Production" if i <= len(apps) else "DR" if i % 4 == 0 else "Test" if i % 3 == 0 else "Training"
        add("SP14_Deployments_Hosting", "deployment", deploy_id, f"{app_id} {environment.lower()}", {
            "deployment_id": deploy_id, "application_id": app_id,
            "environment": environment, "hosting_platform_ref": platform_id,
            "hosting_model": "on_prem" if i % 4 == 0 else "cloud",
            "region_or_location": "primary_dc" if i % 4 == 0 else "us-east",
            "runtime_state": "active", "dr_tier": "tier_3_backup_only" if i % 11 == 0 else "tier_2_warm",
            "deployment_owner": function_by_id[functions[pick(("deployment-owner", i), len(functions))]["id"]]["name"] + " platform owner",
        })
        relation(deploy_id, "DEPLOYMENT_OF", app_id)
        relation(deploy_id, "HOSTED_ON", platform_id)

    data_assets: list[str] = []
    workload_weights = [("clinical_quality", 24), ("claims", 18), ("finance", 13),
                        ("operations", 19), ("population_health", 16), ("regulatory", 10)]
    technology_weights = [("SQL Server", 36), ("Snowflake", 18), ("Power BI", 22),
                          ("Informatica", 15), ("Azure Data Factory", 9)]
    for i in range(1, 361):
        data_id = f"DATA-{i:04d}"
        function = functions[pick(("data-function", i), len(functions))]
        platform_id = platforms[pick(("data-platform", i), len(platforms))]
        workload = weighted_pick(("data-workload", i), workload_weights)
        add("SP04_Data_BI_ETL", "data_asset", data_id, f"{workload.replace('_', ' ').title()} data product {i:03d}", {
            "data_asset_id": data_id, "platform_id": platform_id,
            "platform_name": f"Data product platform {platform_id}",
            "technology_name": weighted_pick(("data-technology", i), technology_weights),
            "workload_type": workload, "function_id": function["id"], "function": function["name"],
            "workload_count": 1 + i % 12, "active_user_count": 12 + i * 17 % 900,
            "data_volume_tb": round(0.5 + i * 0.37 % 40, 2),
            "regulated_data_flag": "yes" if i % 3 == 0 else "no",
            "governance_state": "catalogued" if i % 7 else "unknown",
        })
        relation(data_id, "HOSTED_ON", platform_id)
        relation(data_id, "USED_BY", function["id"])
        data_assets.append(data_id)

    if not (len(definition["program_names"]) == len(definition["program_priority_ids"])
            == len(definition["program_function_ids"])):
        raise ValueError("Program names, priorities and functions must align")
    for i, name in enumerate(definition["program_names"], start=1):
        program_id = f"PROG-{i:04d}"
        priority_id = definition["program_priority_ids"][i - 1]
        function_id = definition["program_function_ids"][i - 1]
        if priority_id and priority_id not in priority_by_id:
            raise ValueError(f"Program {program_id} references an unknown priority")
        if function_id not in function_by_id:
            raise ValueError(f"Program {program_id} references an unknown function")
        function = function_by_id[function_id]
        owner_id = priority_by_id[priority_id]["owner_id"] if priority_id else ""
        candidates = [row["application_id"] for row in rows["SP03_CMDB"]
                      if row["business_function_id"] == function_id]
        if len(candidates) < 3 and function["segment_id"]:
            candidates = [row["application_id"] for row in rows["SP03_CMDB"]
                          if row["segment_id"] == function["segment_id"]]
        if len(candidates) < 3:
            candidates = [row["application_id"] for row in rows["SP03_CMDB"]
                          if row["business_function_id"] in {"FUNC-0010", "FUNC-0011"}]
        dependent: list[str] = []
        salt = 0
        while len(dependent) < 3:
            app_id = candidates[pick(("program-app", i, salt), len(candidates))]
            if app_id not in dependent:
                dependent.append(app_id)
            salt += 1
        budget = 1200000 + pick(("program-budget", i), 220) * 100000
        status = "closed" if i % 11 == 0 else "proposed" if i % 7 == 0 else "approved" if i % 5 == 0 else "at_risk" if i % 6 == 0 else "in_flight"
        completion = 100 if status == "closed" else 0 if status in {"proposed", "approved"} else 3 + pick(("program-completion", i), 72)
        forecast = round(budget * (1.05 + pick(("program-forecast", i), 31) / 100)) if status == "at_risk" else round(budget * (0.91 + pick(("program-forecast", i), 23) / 100))
        target = "" if i == 17 else money(round(budget * (1.1 + pick(("program-value", i), 140) / 100)))
        add("SP07_PPM", "program", program_id, name, {
            "program_id": program_id, "initiative_id": f"INIT-{i:04d}",
            "program_name": name, "priority_id": priority_id,
            "sponsor_function_id": function["id"], "sponsor_function": function["name"],
            "owner_id": owner_id,
            "status": status, "completion_pct": completion,
            "approved_budget_usd": money(budget), "forecast_usd": money(forecast),
            "target_value_usd": target, "value_claim_status": "unsupported_hypothesis" if i == 17 else "modelled_not_finance_validated",
            "dependent_applications": ";".join(dependent),
            "known_gaps": "Priority and accountable owner are unresolved." if not priority_id else "Value hypothesis lacks supporting evidence." if i == 17 else "",
        })
        if owner_id:
            relation(program_id, "ACCOUNTABLE_TO", owner_id)
        relation(program_id, "SPONSORED_BY_FUNCTION", function["id"])
        if priority_id:
            relation(program_id, "ADVANCES_PRIORITY", priority_id)
        for app_id in dependent:
            relation(program_id, "CHANGES", app_id)

    contract_weights = [
        (7 if i <= 24 else 1) * (0.75 + pick(("contract-value", i), 80) / 100)
        for i in range(1, 231)
    ]
    contract_weight_total = sum(contract_weights)
    for i in range(1, 231):
        contract_id = f"CTR-{i:04d}"
        vendor_number = (i - 1) % 5 + 1 if i <= 30 else (i - 31) % len(vendors) + 1
        vendor_id = f"VEN-{vendor_number:04d}"
        candidates = [row["application_id"] for row in rows["SP03_CMDB"]
                      if row["vendor_id"] == vendor_id or
                      (vendor_id == "VEN-0003" and row["hosting_model"] == "aws_hosted")]
        scoped = sorted({candidates[pick(("contract-app", i, salt), len(candidates))]
                         for salt in (1, 2, 3)}) if candidates else []
        renewal_risk = i == 2
        add("SP08_Vendor_Contract", "contract", contract_id, f"{vendors[vendor_number - 1]} agreement {i:03d}", {
            "contract_id": contract_id, "vendor_id": vendor_id,
            "supplier_name": vendors[vendor_number - 1],
            "service_tower": ("clinical_apps", "claims_admin", "data_platform", "managed_infra", "professional_services")[i % 5],
            "annualized_value_usd": money(round(620000000 * contract_weights[i - 1] / contract_weight_total)),
            "minimum_commitment_usd": money(100000 + i * 20000),
            "start_date": "2024-01-01", "end_date": "2026-12-31" if renewal_risk else f"202{7 + i % 3}-12-31",
            "notice_window_days": 90 if renewal_risk else (90, 120, 180, 365)[i % 4],
            "renewal_risk": "notice_window_at_risk" if renewal_risk else "none_declared",
            "benchmarking_right": "unknown" if i % 9 == 0 else "present",
            "scoped_applications": ";".join(scoped),
            "scope_basis": "declared_app_supplier_or_hosting" if scoped else "unmapped_service_scope",
            "known_gaps": "Contract service scope has no declared application or platform edge." if not scoped else "",
        })
        relation(contract_id, "SUPPLIED_BY", vendor_id)
        for app_id in scoped:
            relation(app_id, "COVERED_BY", contract_id)

    for i in range(1, 73):
        function = functions[pick(("role-function", i), len(functions))]
        role_id = f"ROLE-{i:04d}"
        add("SP02_HRIS", "workforce_role", role_id, f"{function['name']} role {i:02d}", {
            "role_id": role_id, "function_id": function["id"], "function": function["name"],
            "role_family": ("clinical", "operations", "analytics", "technology", "management")[i % 5],
            "location_segment": ("urban", "suburban", "rural")[i % 3],
            "employee_count": 40 + i * 13 % 1100, "contractor_count": i * 3 % 120,
            "open_requisition_count": i % 17, "attrition_rate": round(0.06 + i % 9 * 0.012, 3),
        })
        relation(role_id, "WORKS_IN", function["id"])

    for i in range(1, 481):
        function = functions[pick(("finance-function", i), len(functions))]
        app_id = apps[pick(("finance-app", i), len(apps))]
        finance_id = f"FIN-{i:04d}"
        budget = 120000 + i * 17700
        add("SP06_Finance_ERP", "spend_line", finance_id, f"{function['name']} cost line {i:03d}", {
            "finance_line_id": finance_id, "fiscal_period": f"2026-{i % 12 + 1:02d}",
            "business_function_id": function["id"], "business_function": function["name"],
            "supplier_id": f"VEN-{(i - 1) % len(vendors) + 1:04d}",
            "supplier_name": vendors[(i - 1) % len(vendors)],
            "application_or_platform_ref": app_id,
            "budget_usd": money(budget), "actual_usd": money(round(budget * (0.82 + (i % 9) * 0.03))),
            "allocation_basis": "synthetic_function_app_allocation",
        })
        relation(finance_id, "COST_OF", app_id)

    metric_owner_function = {
        "PRI-0001": "FUNC-0001", "PRI-0002": "FUNC-0005",
        "PRI-0003": "FUNC-0011", "PRI-0004": "FUNC-0009", "PRI-0005": "FUNC-0012",
    }
    for i, kpi in enumerate(definition["kpis"], start=1):
        kpi_name = kpi["name"]
        metric_id = f"MET-{i:04d}"
        priority_id = kpi["priority_id"]
        if priority_id not in metric_owner_function:
            raise ValueError(f"KPI {kpi_name} references an unknown priority")
        function = function_by_id[metric_owner_function[priority_id]]
        matching_apps = [row["application_id"] for row in rows["SP03_CMDB"]
                         if row["business_function_id"] == function["id"]]
        unit = kpi["unit"]
        value = kpi["actual"]
        add("SP10_KPI_Operations", "metric", metric_id, kpi_name, {
            "metric_id": metric_id, "kpi_name": kpi_name, "business_function_id": function["id"],
            "business_function": function["name"], "priority_id": priority_id,
            "observation_id": f"{metric_id}-2026Q3", "period": "2026-Q3", "kpi_value": value, "kpi_unit": unit,
            "target_value": kpi["target"], "directionality": kpi["direction"],
            "definition": f"Synthetic reference definition for {kpi_name}; unit {unit}; not client-attested.",
            "definition_state": "conflict" if i == 4 else "synthetic_defined",
            "source_application_ref": matching_apps[pick(("metric-app", i), len(matching_apps))] if matching_apps else "",
            "finance_validation_state": "synthetic_reference_not_client_attested" if kpi_name == "Finance-validated benefits" else "not_applicable",
        })
        relation(metric_id, "MEASURES_PRIORITY", priority_id)
        relation(metric_id, "OWNED_BY_FUNCTION", function["id"])
        current = rows["SP10_KPI_Operations"][-1]
        rows["SP10_KPI_Operations"].append({
            **current,
            "source_row_id": f"{metric_id}-2026Q2",
            "observation_id": f"{metric_id}-2026Q2",
            "period": "2026-Q2",
            "kpi_value": round(value * (0.93 if kpi["direction"] == "higher" else 1.08), 1),
            "source_as_of": "2026-06-30",
        })

    for i in range(1, 201):
        risk_id = f"RISK-{i:04d}"
        function = functions[pick(("risk-function", i), len(functions))]
        target = apps[pick(("risk-app", i), len(apps))] if i % 3 else platforms[pick(("risk-platform", i), len(platforms))]
        risk_type = weighted_pick(("risk-type", i), [("privacy", 28), ("resilience", 22),
                                                     ("vendor", 18), ("delivery", 32)])
        risk_prefix = {"privacy": "PHI handling exposure", "resilience": "Recovery capacity gap",
                       "vendor": "Supplier dependency", "delivery": "Delivery dependency"}[risk_type]
        risk_name = f"{risk_prefix}: {objects[target]['name']} / {function['name']} ({risk_id})"
        add("SP09_GRC", "risk", risk_id, risk_name, {
            "risk_or_control_id": risk_id, "risk_name": risk_name, "risk_type": risk_type,
            "business_function_id": function["id"], "business_function": function["name"],
            "object_ref": target, "severity": "critical" if i % 13 == 0 else "high" if i % 4 == 0 else "medium",
            "control_state": "unknown" if i % 11 == 0 else "partially_effective" if i % 3 == 0 else "effective",
            "open_exception_count": i % 6, "evidence_ref": f"EVID-{i:04d}",
            "owner_id": "OWN-0007",
        })
        relation(risk_id, "APPLIES_TO", target)
        relation(risk_id, "ACCOUNTABLE_TO", "OWN-0007")

    for i, use_case in enumerate(definition["ai_use_cases"], start=1):
        use_case_id = f"AI-{i:04d}"
        function = function_by_id[use_case["function_id"]]
        vendor_id = use_case["vendor_id"]
        if vendor_id not in objects or objects[vendor_id]["name"] not in vendors:
            raise ValueError(f"AI use case {use_case_id} has an unknown supplier")
        add("SP11_AI_Usage_Models", "ai_use_case", use_case_id, use_case["name"], {
            "use_case_id": use_case_id, "use_case_name": use_case["name"],
            "business_function_id": function["id"], "business_function": function["name"],
            "vendor_id": vendor_id, "vendor_name": objects[vendor_id]["name"], "tool_name": use_case["tool"],
            "use_case_category": use_case["category"], "period": "2026-09",
            "licensed_users": 30 + i * 7, "active_users": 12 + i * 5,
            "usage_events": 50 + i * 31, "monthly_cost_usd": money(500 + i * 105),
            "review_state_detail": "human_in_the_loop" if i % 5 else "review_pending",
        })
        relation(use_case_id, "USED_BY", function["id"])
        relation(use_case_id, "SUPPLIED_BY", vendor_id)

    for i in range(1, 1351):
        flow_id = f"FLOW-{i:04d}"
        source = apps[pick(("flow-source", i), len(apps))]
        target = data_assets[0] if i % 6 == 0 else data_assets[1] if i % 9 == 0 else data_assets[pick(("flow-target", i), len(data_assets))]
        function = functions[pick(("flow-function", i), len(functions))]
        add("SP13_Data_Flows_Integrations", "data_flow", flow_id, f"{source} to {target}", {
            "flow_id": flow_id, "source_object_ref": source, "target_object_ref": target,
            "source_function_id": function["id"], "source_function": function["name"],
            "target_function_id": function["id"], "target_function": function["name"],
            "integration_pattern": ("api", "hl7", "edi", "batch_file", "etl")[i % 5],
            "landing_layer": ("raw", "ods", "canonical", "mart")[i % 4],
            "consumption_layer": ("mart", "reporting", "api_consumer")[i % 3],
            "cadence": "real_time" if i % 4 == 0 else "daily",
            "regulated_data_flag": "yes" if i % 3 == 0 else "no",
            "interface_owner_id": "OWN-0005", "interface_owner": "Chief Information Officer",
        })
        relation(source, "FEEDS", target)
    relation("APP-0018", "DEPENDS_ON", "UNKNOWN-DEPENDENCY-0001", state="unresolved")

    for i in range(1, 43):
        interview_id = f"INT-{i:04d}"
        owner = owners[(i - 1) % len(owners)]
        modelled = i == 42
        theme = definition["leadership_themes"][(i - 1) // len(owners) % len(definition["leadership_themes"])]
        if theme["evidence_object_id"] not in objects:
            raise ValueError(f"Leadership theme cites an unknown object: {theme['evidence_object_id']}")
        add("SP01_Documents_Interviews", "leadership_observation", interview_id,
            f"{owner['role']} observation {i:02d}", {
                "interview_id": interview_id, "interviewee_role": owner["role"],
                "owner_id": owner["id"], "theme": theme["theme"],
                "evidence_object_id": theme["evidence_object_id"],
                "synthetic_answer": ("Modelled synthesis: " if modelled else "Simulated role perspective: ")
                + theme["observation"] + " Not a transcribed client statement.",
                "response_basis": "modelled" if modelled else "simulated_interview",
                "known_gaps": "Modelled response, not transcribed." if modelled else "",
            })
        relation(interview_id, "ATTRIBUTED_TO_ROLE", owner["id"])
        relation(interview_id, "GROUNDED_IN", theme["evidence_object_id"])

    for i in range(1, 225):
        evidence_id = f"EVID-{i:04d}"
        subject = f"RISK-{i:04d}" if i <= 200 else f"PROG-{i - 200:04d}"
        add("SP12_Evidence_Room", "evidence_request", evidence_id, f"Evidence requested for {subject}", {
            "evidence_id": evidence_id, "subject_object_id": subject,
            "requested_artifact_type": "control_attestation" if i <= 200 else "benefit_validation",
            "request_state": "requested_not_received", "verification_state": "not_received",
            "document_date": "", "page_ref": "", "span_ref": "",
        })
        relation(evidence_id, "EVIDENCE_REQUESTED_FOR", subject)

    # One historical source is intentionally stale; a second source defines the
    # same KPI differently. Both conditions are explicit, never reconciled away.
    objects["DATA-0007"]["source_as_of"] = "2025-06-30"
    for row in rows["SP04_Data_BI_ETL"]:
        if row["data_asset_id"] == "DATA-0007":
            row["source_as_of"] = "2025-06-30"
            row["known_gaps"] = "Source currency exceeds review threshold."
            break
    conflict = next(row for row in rows["SP10_KPI_Operations"] if row["metric_id"] == "MET-0004")
    rows["SP10_KPI_Operations"].append({**conflict, "source_row_id": "MET-0004-ALT", "observation_id": "MET-0004-ALT", "definition": "Captured conditions in submitted claims; incompatible denominator.", "definition_state": "conflicting_source", "source_as_of": "2026-06-30"})

    benchmark = definition["external_benchmark"]
    if benchmark["related_metric_id"] not in objects:
        raise ValueError("External benchmark refers to an unknown metric")
    add("SP21_External_Benchmarks", "external_benchmark", benchmark["id"], benchmark["name"], {
        "benchmark_id": benchmark["id"],
        "benchmark_name": benchmark["name"],
        "benchmark_year": benchmark["benchmark_year"],
        "benchmark_value": benchmark["value"],
        "benchmark_unit": benchmark["unit"],
        "population": benchmark["population"],
        "source_name": benchmark["source_name"],
        "source_url": benchmark["source_url"],
        "source_published_at": benchmark["source_published_at"],
        "related_metric_id": benchmark["related_metric_id"],
        "comparability_state": benchmark["comparability_state"],
        "client_fact_state": "not_a_client_fact",
        "source_basis": "external_publication",
    }, evidence_class="external_benchmark", source_as_of=benchmark["source_as_of"])

    for rel in relationships:
        rows["SP17_Relationships"].append({
            **rel, "source_row_id": rel["relationship_id"],
            "synthetic_dataset_id": dataset,
            "synthetic_generation_basis": definition["generation_basis"],
            "client_attestation_state": "not_client_attested",
            "source_basis": "synthetic_generated", "review_state": "candidate",
        })
    for family in FAMILIES:
        if not rows[family]:
            raise ValueError(f"Empty source family: {family}")

    return {
        "schema_version": 1,
        "dataset_id": dataset,
        "tenant_key": definition["tenant_key"],
        "assessment_id": definition["assessment_id"],
        "as_of": as_of,
        "seed": definition["seed"],
        "definition_hash": hashlib.sha256(json.dumps(definition, sort_keys=True, separators=(",", ":")).encode()).hexdigest(),
        "generation_basis": definition["generation_basis"],
        "client_attestation_state": "not_client_attested",
        **({"service_capability_count": sum(len(items) for items in service_capabilities.values())}
           if service_capabilities else {}),
        "objects": list(objects.values()),
        "relationships": relationships,
        "source_rows": dict(rows),
        "declared_imperfections": [
            "12 unattributed applications", "one program without a priority relationship",
            "one KPI with conflicting definitions", "one stale data source",
            "one unsupported value hypothesis", "one external benchmark", "one modelled leadership observation",
            "one renewal notice risk", "one unresolved dependency", "224 evidence requests with no received artifact",
        ],
    }


def validate(manifest: dict[str, Any]) -> dict[str, Any]:
    objects = {obj["object_id"]: obj for obj in manifest["objects"]}
    if len(objects) != len(manifest["objects"]):
        raise ValueError("Duplicate object IDs")
    unresolved = []
    for edge in manifest["relationships"]:
        if edge["from_object_id"] not in objects:
            raise ValueError(f"Missing relationship source: {edge}")
        if edge["to_object_id"] not in objects:
            if edge["resolution_state"] != "unresolved":
                raise ValueError(f"Undeclared missing relationship target: {edge}")
            unresolved.append(edge["relationship_id"])
    if len(unresolved) != 1:
        raise ValueError("Expected exactly one declared unknown dependency")
    counts = Counter(obj["object_type"] for obj in objects.values())
    floors = {"business_segment": 3, "business_function": 10, "owner": 4, "program": 20,
              "metric": 30, "application": 300, "platform": 30, "data_asset": 300,
              "vendor": 50, "contract": 50, "risk": 40, "ai_use_case": 20}
    for object_type, floor in floors.items():
        if counts[object_type] < floor:
            raise ValueError(f"{object_type}: {counts[object_type]} < {floor}")
    if sum(segment["attributes"]["revenue_share_pct"] for segment in objects.values()
           if segment["object_type"] == "business_segment") != 100:
        raise ValueError("Revenue shares do not sum to 100")
    if any(row["client_attestation_state"] != "not_client_attested"
           for rows in manifest["source_rows"].values() for row in rows):
        raise ValueError("Synthetic source row claims client attestation")
    rows = manifest["source_rows"]
    checks = {
        "unattributed_applications": sum(not row["business_owner_id"] for row in rows["SP03_CMDB"]),
        "unlinked_program_priorities": sum(not row["priority_id"] for row in rows["SP07_PPM"]),
        "unresolved_program_owners": sum(not row["owner_id"] for row in rows["SP07_PPM"]),
        "unsupported_value_hypotheses": sum(row["value_claim_status"] == "unsupported_hypothesis" for row in rows["SP07_PPM"]),
        "stale_data_sources": sum(row.get("known_gaps") == "Source currency exceeds review threshold." for row in rows["SP04_Data_BI_ETL"]),
        "conflicting_kpi_definitions": sum(row["definition_state"] == "conflicting_source" for row in rows["SP10_KPI_Operations"]),
        "external_benchmarks": len(rows["SP21_External_Benchmarks"]),
        "modelled_leadership_observations": sum(row["response_basis"] == "modelled" for row in rows["SP01_Documents_Interviews"]),
        "renewal_notice_risks": sum(row["renewal_risk"] == "notice_window_at_risk" for row in rows["SP08_Vendor_Contract"]),
    }
    expected = {"unattributed_applications": 12, **{key: 1 for key in checks if key != "unattributed_applications"}}
    if checks != expected:
        raise ValueError(f"Declared imperfection checks do not reconcile: {checks}")
    periods = Counter(row["period"] for row in rows["SP10_KPI_Operations"])
    if periods["2026-Q2"] != 36 or periods["2026-Q3"] != 37:
        raise ValueError("Every KPI needs comparable Q2 and Q3 observations")
    apps = rows["SP03_CMDB"]
    app_by_id = {row["application_id"]: row for row in apps}
    products = [row for row in apps if row["application_grain"] == "logical_product"]
    modules = [row for row in apps if row["application_grain"] == "governed_module"]
    services = [row for row in apps if row["application_grain"] == "logical_service"]
    expected_services = manifest.get("service_capability_count", 0) * len(SERVICE_ROLES)
    if (len(products) != 24 or len(modules) != 726 or len(services) != expected_services
            or len(apps) != 24 + 726 + expected_services
            or len({row["application_name"] for row in apps}) != len(apps)):
        raise ValueError("Application product/module grain is not unique or complete")
    if any(row["parent_application_id"] not in app_by_id or
           app_by_id[row["parent_application_id"]]["application_grain"] != "logical_product" or
           any(row[key] != app_by_id[row["parent_application_id"]][key]
               for key in ("base_product_name", "vendor_id", "business_function_id"))
           for row in modules):
        raise ValueError("Application module does not reconcile to its parent product")
    evidence_requests = rows["SP12_Evidence_Room"]
    if len(evidence_requests) != 224 or any(row["request_state"] != "requested_not_received" or
           row["verification_state"] != "not_received" or row["subject_object_id"] not in objects
           for row in evidence_requests):
        raise ValueError("Evidence requests were mistaken for received proof")
    edge_counts = Counter(edge["relationship_type"] for edge in manifest["relationships"])
    if edge_counts["MODULE_OF"] != 726 or edge_counts["EVIDENCE_REQUESTED_FOR"] != 224 or edge_counts["SUPPORTS"]:
        raise ValueError("Product/module or evidence-request relationships changed")
    return {"object_counts": dict(sorted(counts.items())), "relationship_count": len(manifest["relationships"]),
            "unresolved_relationships": unresolved,
            "source_family_rows": {family: len(family_rows) for family, family_rows in rows.items()},
            "imperfection_checks": checks, "kpi_period_counts": dict(sorted(periods.items()))}


def export(manifest: dict[str, Any], out_dir: Path) -> dict[str, Any]:
    if out_dir.exists() and any(out_dir.iterdir()):
        raise ValueError(f"Refusing to overwrite nonempty source-set directory: {out_dir}")
    out_dir.mkdir(parents=True, exist_ok=True)
    inventory = []
    for family, filename in FAMILIES.items():
        path = out_dir / "__synthetic_sources__" / family / filename
        rows = manifest["source_rows"][family]
        write_csv(path, rows)
        inventory.append({
            "source_room_family": family,
            "file_path": path.relative_to(out_dir).as_posix(),
            "row_count": len(rows),
            "row_grain": "one declared synthetic source row",
            "sha256": hash_file(path),
        })
    write_csv(out_dir / "dense_source_room_manifest.csv", inventory)
    governed = {key: value for key, value in manifest.items() if key != "source_rows"}
    governed["files"] = inventory
    governed["source_set_hash"] = hashlib.sha256(json.dumps(
        sorted((row["file_path"], row["sha256"]) for row in inventory), separators=(",", ":")
    ).encode()).hexdigest()
    governed["review_state"] = "candidate_not_loaded"
    (out_dir / "enterprise_manifest.json").write_text(json.dumps(governed, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {"dataset_id": manifest["dataset_id"], "assessment_id": manifest["assessment_id"],
            "source_set_hash": governed["source_set_hash"], "files": len(inventory),
            "source_rows": sum(row["row_count"] for row in inventory),
            "objects": len(manifest["objects"]), "relationships": len(manifest["relationships"])}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-version", default="v1")
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    manifest = build(load_definition(args.source_version))
    quality = validate(manifest)
    summary = export(manifest, args.out_dir)
    print(json.dumps({**summary, **quality}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
