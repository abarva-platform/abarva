#!/usr/bin/env python3

"""Write dense source-room requirements from product deterministic needs."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-next-slice-planning-2026-08-23")


ROWS = [
    {
        "requirement_id": "DEN-APP-001",
        "domain": "Applications and Technology",
        "source_room_family": "cmdb_application_portfolio",
        "minimum_viable_rows": "350",
        "dense_meridian_target_rows": "750",
        "critical_segments": "provider clinical, payer core admin, revenue cycle, finance, supply chain, data and analytics, security, integration",
        "must_include": "base application ID; owner; vendor; lifecycle; tier; hosting; function; capability; contract scope IDs where known",
        "why_needed": "Home, Source, Tower, and Intelligence all depend on one shared application identity spine.",
        "partial_catchup_rule": "Load declared applications first; unresolved contract/application names stay in required-additions until CMDB confirms them.",
        "quality_gate": "Base application count excludes environment variants; deployments carry environment as a field.",
    },
    {
        "requirement_id": "DEN-APP-002",
        "domain": "Application Deployment",
        "source_room_family": "application_deployment_and_hosting",
        "minimum_viable_rows": "450",
        "dense_meridian_target_rows": "1100",
        "critical_segments": "production, disaster recovery, non-prod, SaaS tenant, cloud region, owned data center",
        "must_include": "deployment_id; application_id; environment; hosting_platform_id; region; runtime status; DR tier",
        "why_needed": "Preserves operational reality without triple-counting applications or costs.",
        "partial_catchup_rule": "Missing deployment export becomes a deployment coverage gap, not an inferred deployment row.",
        "quality_gate": "Every deployment references a declared base application and a declared platform when known.",
    },
    {
        "requirement_id": "DEN-INF-001",
        "domain": "Infrastructure and Cloud",
        "source_room_family": "infrastructure_cloud_datacenter",
        "minimum_viable_rows": "120",
        "dense_meridian_target_rows": "260",
        "critical_segments": "mainframe, Epic AWS hosting, private cloud, VMware, SQL Server, Netezza/Teradata, object storage, network edge",
        "must_include": "platform_id; technology; hosting model; capacity; utilization; owner; supported function; lifecycle/EOL",
        "why_needed": "Home architecture and AI readiness need platform context beyond application names.",
        "partial_catchup_rule": "Capacity summaries can load before server inventory; absent major platforms must be explicitly absent, not omitted.",
        "quality_gate": "Mainframe and strategic warehouse appliances must be present or carry an explicit absence attestation.",
    },
    {
        "requirement_id": "DEN-DATA-001",
        "domain": "Data and Analytics",
        "source_room_family": "data_analytics_volumetrics",
        "minimum_viable_rows": "80",
        "dense_meridian_target_rows": "180",
        "critical_segments": "finance, supply chain, payer actuarial, RAF, Stars/HEDIS, provider quality, clinical operations, executive reporting",
        "must_include": "function; platform; tool; workload type; report/job/script count; active users; data volume; owner; refresh cadence",
        "why_needed": "The product needs technology and volumetric depth, not a fake inventory of every report or script.",
        "partial_catchup_rule": "Certified counts by function/tool are acceptable; exact object inventories can catch up later.",
        "quality_gate": "Report, ETL, script, user, and volume counts cannot be flat constants across all functions.",
    },
    {
        "requirement_id": "DEN-AI-001",
        "domain": "AI Tools and Usage",
        "source_room_family": "ai_tool_usage",
        "minimum_viable_rows": "48",
        "dense_meridian_target_rows": "120",
        "critical_segments": "M365 Copilot, GitHub Copilot/Codex, ServiceNow Now Assist, clinical documentation AI, contact-center AI, internal agents",
        "must_include": "tool; vendor; licensed users; active users; function; use-case category; period; cost; data-sensitivity band",
        "why_needed": "Tower and Moves need AI adoption and current usage patterns before recommending AI use cases.",
        "partial_catchup_rule": "Tool-level usage can load before persona/use-case attribution; attribution gaps remain visible.",
        "quality_gate": "License count alone cannot create realized value or adoption benefit claims.",
    },
    {
        "requirement_id": "DEN-FIN-001",
        "domain": "Budget and Spend",
        "source_room_family": "budget_spend_finance",
        "minimum_viable_rows": "300",
        "dense_meridian_target_rows": "900",
        "critical_segments": "run, change, cloud, software, managed services, data platforms, AI tooling, security, infrastructure",
        "must_include": "period; account; cost center; supplier; application/platform; amount; budget/actual; allocation basis",
        "why_needed": "Tower needs finance-confirmed spend and value gates; Source needs commercial economics.",
        "partial_catchup_rule": "Unallocated spend can load with explicit allocation gap; Unknown is not zero.",
        "quality_gate": "Spend totals reconcile to finance control totals before product claims are allowed.",
    },
    {
        "requirement_id": "DEN-COM-001",
        "domain": "Vendors and Contracts",
        "source_room_family": "vendor_contract_commercial",
        "minimum_viable_rows": "current commercial proof: 564 source records",
        "dense_meridian_target_rows": "expand to 180 vendors, 260 contracts, 900 documents, 3000+ extracted clauses",
        "critical_segments": "software, SaaS, BPO, managed services, infrastructure, data platforms, AI tools, advisory",
        "must_include": "supplier, contract, document, scope, rate card, invoice, SLA, protection, benchmark, finance realization",
        "why_needed": "Source 360 and Tower cannot be shallow on contracts, vendors, documents, and workflow evidence.",
        "partial_catchup_rule": "Contracts load with visible missing SLA, benchmark, or document gates; no missing area is treated as zero exposure.",
        "quality_gate": "Document spans are computed, money reconciles, and commercial leverage terms cite clause evidence where available.",
    },
    {
        "requirement_id": "DEN-INT-001",
        "domain": "Interviews",
        "source_room_family": "executive_and_director_interviews",
        "minimum_viable_rows": "60",
        "dense_meridian_target_rows": "180",
        "critical_segments": "CXO strategic priorities, IT directors, finance directors, data governance, operations, payer, provider, security",
        "must_include": "role; function; question; answer excerpt; theme; priority; pain point; current tools; AI implication; review state",
        "why_needed": "Home and Intelligence need priorities, themes, and current-state maturity that system exports cannot provide.",
        "partial_catchup_rule": "Strategic interviews can load before tactical interviews; missing functions remain coverage gaps.",
        "quality_gate": "Interview themes cannot create deterministic spend, system, or value facts without source extracts.",
    },
    {
        "requirement_id": "DEN-PMO-001",
        "domain": "Programs and Transformation",
        "source_room_family": "program_portfolio_moves",
        "minimum_viable_rows": "90",
        "dense_meridian_target_rows": "220",
        "critical_segments": "payer modernization, Epic/Cogito, data platform migration, security, AI pilots, revenue cycle, finance transformation",
        "must_include": "program; initiative; sponsor; status; budget; forecast; value case; dependencies; affected capabilities/applications",
        "why_needed": "Moves needs current transformation demand and Tower needs value-gate discipline.",
        "partial_catchup_rule": "Program value cases can load as proposed; finance-confirmed value must catch up through finance extracts.",
        "quality_gate": "No program can become claimable value without finance confirmation and review approval.",
    },
]


def write_csv(rows: list[dict[str, str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_markdown(rows: list[dict[str, str]], path: Path) -> None:
    lines = [
        "# Dense Source-Room Requirements",
        "",
        "Local planning/proof artifact only. These are source-room depth requirements derived from product deterministic needs. They are not active tenant replacement and not a new Azure folder upload.",
        "",
        "## Design Rule",
        "",
        "The dense package must be realistic, but it must also be practical. For analytics, reporting, scripts, and ETL, collect segmentation and volumetric counts by function/tool/platform before asking for exhaustive object inventories.",
        "",
        "| Requirement | Domain | Minimum viable | Dense target | Why needed | Partial catch-up rule |",
        "|---|---|---:|---:|---|---|",
    ]
    for row in rows:
        safe = {key: value.replace("|", "/") for key, value in row.items()}
        lines.append(
            "| {requirement_id} | {domain} | {minimum_viable_rows} | {dense_meridian_target_rows} | {why_needed} | {partial_catchup_rule} |".format(
                **safe
            )
        )
    lines.extend(["", "## Quality Gates", ""])
    for row in rows:
        lines.append(f"- **{row['requirement_id']} {row['domain']}:** {row['quality_gate']}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    csv_path = out_dir / "ecl_dense_source_room_requirements.csv"
    md_path = out_dir / "ecl_dense_source_room_requirements.md"
    summary_path = out_dir / "ecl_dense_source_room_requirements_summary.json"
    write_csv(ROWS, csv_path)
    write_markdown(ROWS, md_path)
    summary_path.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "accepted": True,
                "requirements": len(ROWS),
                "domains": sorted({row["domain"] for row in ROWS}),
                "partial_catchup_supported": True,
                "not_active_tenant_replacement": True,
                "csv": csv_path.as_posix(),
                "markdown": md_path.as_posix(),
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"csv": csv_path.as_posix(), "markdown": md_path.as_posix(), "requirements": len(ROWS)}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
