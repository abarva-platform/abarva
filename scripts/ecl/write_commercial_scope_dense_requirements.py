#!/usr/bin/env python3

"""Write dense Meridian application additions required by commercial scope links."""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from decimal import Decimal
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")


def recommended_lane(name: str, domain: str) -> tuple[str, str]:
    lower = f"{name} {domain}".lower()
    if any(token in lower for token in ["reporting", "tableau", "power bi", "sql server", "mart"]):
        return "data_or_reporting_platform", "data_analytics_current_state"
    if any(token in lower for token in ["okta", "azure ad", "service desk", "servicenow", "teams"]):
        return "technology_platform_or_application", "applications_and_technology"
    if "rpa" in lower:
        return "automation_platform", "applications_and_technology"
    return "business_application", "applications_and_technology"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    out_dir = args.out_dir.resolve()
    source = out_dir / "scope_active_application_reconciliation.csv"
    if not source.exists():
        raise SystemExit(f"Missing scope reconciliation file: {source}")

    with source.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    grouped: dict[str, dict[str, object]] = {}
    for row in rows:
        if row.get("active_application_exact_match") == "yes":
            continue
        name = row["application_name"]
        group = grouped.setdefault(
            name,
            {
                "tenant_key": row["tenant_key"],
                "application_name": name,
                "business_domains": set(),
                "contract_ids": set(),
                "scope_link_count": 0,
                "allocation_percent_total": Decimal("0"),
                "source_record_ids": [],
            },
        )
        group["business_domains"].add(row["business_domain"])
        group["contract_ids"].add(row["contract_id"])
        group["scope_link_count"] += 1
        group["allocation_percent_total"] += Decimal(row["allocation_percent"])
        group["source_record_ids"].append(row["source_record_id"])

    output_rows = []
    for name, group in sorted(grouped.items(), key=lambda item: (sorted(item[1]["business_domains"])[0], item[0])):
        domains = sorted(group["business_domains"])
        entity_type, workbook_lane = recommended_lane(name, "; ".join(domains))
        output_rows.append(
            {
                "tenant_key": group["tenant_key"],
                "application_name": name,
                "business_domains": "; ".join(domains),
                "contract_ids": "; ".join(sorted(group["contract_ids"])),
                "scope_link_count": str(group["scope_link_count"]),
                "allocation_percent_total": str(group["allocation_percent_total"].normalize()),
                "recommended_entity_type": entity_type,
                "recommended_collection_lane": workbook_lane,
                "required_for_product": "Source 360 contract scope; Tower vendor value/evidence; Home architecture lineage",
                "reason": "Commercial scope names this system but dense Meridian application/technology source room has not declared it as an object yet.",
                "source_basis": "contract_scope_application_links.csv plus local reconciliation; not old active-file design authority",
                "review_state": "required_for_dense_meridian",
                "source_record_ids": "; ".join(group["source_record_ids"]),
            }
        )

    csv_path = out_dir / "commercial_scope_dense_meridian_required_additions.csv"
    fieldnames = [
        "tenant_key",
        "application_name",
        "business_domains",
        "contract_ids",
        "scope_link_count",
        "allocation_percent_total",
        "recommended_entity_type",
        "recommended_collection_lane",
        "required_for_product",
        "reason",
        "source_basis",
        "review_state",
        "source_record_ids",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    by_lane = defaultdict(int)
    by_domain = defaultdict(int)
    for row in output_rows:
        by_lane[row["recommended_collection_lane"]] += 1
        for domain in row["business_domains"].split("; "):
            by_domain[domain] += 1

    md_path = out_dir / "commercial_scope_dense_meridian_required_additions.md"
    lines = [
        "# Dense Meridian Commercial Scope Required Additions",
        "",
        "This report converts unresolved contract-scope links into required source-room additions for the dense Meridian rebuild. It does not treat the old active application file as the design authority; it only records that these commercial scope names must become declared objects before Source 360, Tower, Home architecture lineage, or cubes can claim full contract-scope coverage.",
        "",
        f"- Required additions: {len(output_rows)}",
        f"- Source scope links represented: {sum(int(row['scope_link_count']) for row in output_rows)}",
        "- Review state: required_for_dense_meridian",
        "",
        "## By Collection Lane",
        "",
    ]
    for lane, count in sorted(by_lane.items()):
        lines.append(f"- `{lane}`: {count}")
    lines.extend(["", "## By Business Domain", ""])
    for domain, count in sorted(by_domain.items()):
        lines.append(f"- {domain}: {count}")
    lines.extend(["", "## Required Additions", ""])
    for row in output_rows:
        lines.append(
            f"- {row['application_name']} | {row['business_domains']} | contracts: {row['contract_ids']} | lane: `{row['recommended_collection_lane']}`"
        )
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(
        {
            "csv": csv_path.as_posix(),
            "markdown": md_path.as_posix(),
            "required_additions": len(output_rows),
            "source_scope_links": sum(int(row["scope_link_count"]) for row in output_rows),
        }
    )


if __name__ == "__main__":
    main()
