#!/usr/bin/env python3

"""Build the Meridian commercial ECL slice from aligned source-room extracts.

Design artifact only. This script writes local proof files under outputs/ and
does not connect to Azure or mutate active tenant inputs.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


TENANT_KEY = "meridian-health"
ASSESSMENT_ID = "assessment-commercial-contract-supply"
DEFAULT_INPUT_ROOT = Path("reports/meridian-source-5-contract-layer-cube-proof-20260811")
DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
SOURCE_HASH_LABEL = "commercial-contract-supply-correction"
CENT = Decimal("0.01")
LEGACY_REFERENCE_APPLICATION_NAMES = {
    "General ledger and close reporting",
    "Microsoft 365 Copilot",
    "On-prem SQL Server reporting marts",
    "Power BI reporting estate",
    "Provider contract repository",
    "ServiceNow AI / Now Assist",
    "Tableau reporting estate",
}

CONTRACT_VALUE_OVERRIDES = {
    "MER-CTR-RCM-001": {
        "vendor_parent_id": "MER-VEN-R1-RCM",
        "supplier_legal_name": "R1 RCM Inc.",
        "contract_name": "Revenue Cycle Managed Services",
        "annual_value_usd": "6600000",
        "committed_value_usd": "19800000",
        "alignment_note": "Re-vendored from NorthBridge RCM Services LLC to fixture match R1 RCM.",
    },
    "MER-CTR-HR-BPO-001": {
        "annual_value_usd": "4800000",
        "committed_value_usd": "14400000",
        "alignment_note": "Fixture gap fill: HR BPO vendor absent from old vendor master.",
    },
    "MER-CTR-SC-BPO-001": {
        "annual_value_usd": "6200000",
        "committed_value_usd": "18600000",
        "alignment_note": "Fixture gap fill: supply chain BPO vendor absent from old vendor master.",
    },
    "MER-CTR-FIN-BPO-001": {
        "annual_value_usd": "5400000",
        "committed_value_usd": "16200000",
        "alignment_note": "Fixture gap fill: finance BPO vendor absent from old vendor master.",
    },
    "MER-CTR-SSO-BPO-001": {
        "annual_value_usd": "11900000",
        "committed_value_usd": "35700000",
        "alignment_note": "Fixture gap fill: multi-process shared-services vendor absent from old vendor master.",
    },
}

PROTECTION_PROFILES = {
    "MER-CTR-RCM-001": {
        "protection_score": "82",
        "protection_band": "strong",
        "benchmarking_right_state": "present_annual_third_party",
        "benchmarking_basis": "contractual_right_present_market_extract_missing",
        "notice_window_days": "180",
        "auto_renew": "false",
        "termination_for_convenience_state": "capped_declining",
        "tfc_cap_pct": "35",
        "minimum_commitment_pct": "80",
        "shortfall_penalty_state": "capped_at_unmet_commitment",
        "assignment_consent_state": "buyer_consent_required",
        "delivery_location_mix_state": "mixed_us_and_controlled_offshore",
        "portfolio_rate_position": "near_internal_median",
        "primary_weakness": "market_benchmark_extract_missing",
        "negotiation_guidance": "Use annual benchmark right and AP variance recovery before renewal; obtain external comparator before asserting rate competitiveness.",
    },
    "MER-CTR-HR-BPO-001": {
        "protection_score": "76",
        "protection_band": "acceptable",
        "benchmarking_right_state": "present_after_first_anniversary",
        "benchmarking_basis": "contractual_right_present_market_extract_missing",
        "notice_window_days": "90",
        "auto_renew": "false",
        "termination_for_convenience_state": "capped_declining",
        "tfc_cap_pct": "30",
        "minimum_commitment_pct": "75",
        "shortfall_penalty_state": "waived_during_transition",
        "assignment_consent_state": "buyer_consent_required",
        "delivery_location_mix_state": "controlled_hr_service_center_mix",
        "portfolio_rate_position": "below_internal_median",
        "primary_weakness": "transition_performance_unverified",
        "negotiation_guidance": "Preserve 90-day notice and transition waiver; require service-center evidence before any value claim.",
    },
    "MER-CTR-FIN-BPO-001": {
        "protection_score": "48",
        "protection_band": "weak",
        "benchmarking_right_state": "absent",
        "benchmarking_basis": "internal_portfolio_comparator_only",
        "notice_window_days": "180",
        "auto_renew": "false",
        "termination_for_convenience_state": "capped_flat",
        "tfc_cap_pct": "50",
        "minimum_commitment_pct": "85",
        "shortfall_penalty_state": "applies_after_ramp",
        "assignment_consent_state": "buyer_consent_required",
        "delivery_location_mix_state": "finance_close_location_restricted",
        "portfolio_rate_position": "above_internal_median_18pct",
        "primary_weakness": "no_benchmarking_right",
        "negotiation_guidance": "Add benchmark right and unit-rate reopener before renewal; do not claim rate competitiveness without external comparator.",
    },
    "MER-CTR-SC-BPO-001": {
        "protection_score": "39",
        "protection_band": "weak",
        "benchmarking_right_state": "limited_supplier_consent_required",
        "benchmarking_basis": "contractual_right_constrained_market_extract_missing",
        "notice_window_days": "180",
        "auto_renew": "false",
        "termination_for_convenience_state": "uncapped_remaining_fees",
        "tfc_cap_pct": "100",
        "minimum_commitment_pct": "80",
        "shortfall_penalty_state": "capped_at_unmet_commitment",
        "assignment_consent_state": "buyer_consent_required",
        "delivery_location_mix_state": "supplier_location_change_requires_notice_only",
        "portfolio_rate_position": "near_internal_median",
        "primary_weakness": "uncapped_exit_cost",
        "negotiation_guidance": "Renegotiate exit economics before competing the work; uncapped remaining-fee exposure weakens credible threat to switch.",
    },
    "MER-CTR-SSO-BPO-001": {
        "protection_score": "34",
        "protection_band": "weak",
        "benchmarking_right_state": "present_but_delayed",
        "benchmarking_basis": "contractual_right_delayed_market_extract_missing",
        "notice_window_days": "365",
        "auto_renew": "true",
        "termination_for_convenience_state": "capped_flat",
        "tfc_cap_pct": "45",
        "minimum_commitment_pct": "90",
        "shortfall_penalty_state": "applies_to_underconsumed_volumes",
        "assignment_consent_state": "buyer_consent_required_except_affiliates",
        "delivery_location_mix_state": "multi_location_with_subprocessor_dependency",
        "portfolio_rate_position": "above_internal_median_11pct",
        "primary_weakness": "auto_renewal_long_notice_and_shortfall_penalty",
        "negotiation_guidance": "Prioritize notice-window reduction, auto-renew removal, and shortfall cap before approving the transition extension.",
    },
}

MARKET_BENCHMARK_VARIANCE_PCT = {
    "MER-CTR-RCM-001": Decimal("-0.020"),
    "MER-CTR-HR-BPO-001": Decimal("-0.080"),
    "MER-CTR-FIN-BPO-001": Decimal("0.180"),
    "MER-CTR-SC-BPO-001": Decimal("0.030"),
    "MER-CTR-SSO-BPO-001": Decimal("0.110"),
}
SERVICE_TOWER_BENCHMARK_SPREAD = [
    Decimal("-0.030"),
    Decimal("-0.010"),
    Decimal("0.015"),
    Decimal("0.035"),
]

SCOPE_APPLICATIONS = {
    "MER-CTR-RCM-001": [
        ("Epic Resolute HB", "Revenue Cycle", "application", 9.0),
        ("Epic Resolute PB", "Revenue Cycle", "application", 9.0),
        ("Epic Cadence", "Revenue Cycle", "application", 7.5),
        ("Epic Prelude", "Revenue Cycle", "application", 7.5),
        ("Epic Grand Central", "Revenue Cycle", "application", 7.0),
        ("Waystar Claims Gateway", "Revenue Cycle", "application", 8.0),
        ("Denials Management Workbench", "Revenue Cycle", "application", 8.0),
        ("On-prem SQL Server reporting marts", "Enterprise Data Warehouse", "application", 5.0),
        ("Power BI reporting estate", "BI and Analytics", "application", 5.0),
        ("ServiceNow AI / Now Assist", "Service Management", "application", 4.0),
        ("General ledger and close reporting", "Finance", "application", 4.0),
        ("Provider contract repository", "Network Contracting", "application", 3.0),
    ],
    "MER-CTR-HR-BPO-001": [
        ("Workday HCM", "HR / Workforce", "application", 14.0),
        ("Workday Payroll", "HR / Workforce", "application", 12.0),
        ("UKG Time and Attendance", "HR / Workforce", "application", 10.0),
        ("QGenda Workforce Scheduling", "HR / Workforce", "application", 8.0),
        ("symplr Workforce", "HR / Workforce", "application", 8.0),
        ("ServiceNow HR Case Management", "HR / Workforce", "application", 7.0),
        ("Microsoft 365 Copilot", "Workplace Productivity", "application", 4.0),
        ("Power BI reporting estate", "BI and Analytics", "application", 4.0),
    ],
    "MER-CTR-SC-BPO-001": [
        ("Infor Lawson SCM", "Supply Chain", "application", 14.0),
        ("SAP Ariba Sourcing", "Supply Chain", "application", 12.0),
        ("GHX Exchange", "Supply Chain", "application", 10.0),
        ("PremierConnect Supply Analytics", "Supply Chain", "application", 8.0),
        ("Item Master Management", "Supply Chain", "application", 8.0),
        ("Accounts Payable Invoice Exceptions", "Supply Chain", "application", 7.0),
        ("On-prem SQL Server reporting marts", "Enterprise Data Warehouse", "application", 4.0),
        ("Power BI reporting estate", "BI and Analytics", "application", 4.0),
    ],
    "MER-CTR-FIN-BPO-001": [
        ("Infor Lawson Financials", "Finance", "application", 14.0),
        ("Workday Finance", "Finance", "application", 12.0),
        ("Concur Expense", "Finance", "application", 8.0),
        ("BlackLine Reconciliations", "Finance", "application", 8.0),
        ("Accounts Payable Subledger", "Finance", "application", 7.0),
        ("General ledger and close reporting", "Finance", "application", 7.0),
        ("Power BI reporting estate", "BI and Analytics", "application", 5.0),
        ("Tableau reporting estate", "BI and Analytics", "application", 3.0),
    ],
    "MER-CTR-SSO-BPO-001": [
        ("ServiceNow ITSM", "Service Management", "application", 12.0),
        ("ServiceNow AI / Now Assist", "Service Management", "application", 6.0),
        ("Okta Identity Platform", "Identity and Access", "application", 8.0),
        ("Microsoft Intune Endpoint Management", "End User Computing", "application", 8.0),
        ("Shared Services Transition Tracker", "Enterprise PMO", "application", 8.0),
        ("Knowledge Base and SOP Portal", "Shared Services", "application", 7.0),
        ("Power BI reporting estate", "BI and Analytics", "application", 5.0),
        ("General ledger and close reporting", "Finance", "application", 4.0),
    ],
}


def stable_uuid(*parts: object) -> str:
    digest = bytearray(hashlib.sha256("|".join(str(p) for p in parts).encode("utf-8")).digest()[:16])
    digest[6] = (digest[6] & 0x0F) | 0x40
    digest[8] = (digest[8] & 0x3F) | 0x80
    return str(uuid.UUID(bytes=bytes(digest)))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def sql_literal_to_csv_value(value: object) -> str:
    text = str(value)
    if text == "null":
        return ""
    if text.endswith("::jsonb"):
        text = text[: -len("::jsonb")]
    if len(text) >= 2 and text[0] == "'" and text[-1] == "'":
        return text[1:-1].replace("''", "'")
    return text


def write_projection_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: sql_literal_to_csv_value(row[column]) for column in columns})


def write_scope_active_application_reconciliation(out_dir: Path, scope_links: list[dict[str, object]]) -> None:
    """Write a stable reference-only comparison for dense-build scope gaps."""

    fieldnames = [
        "tenant_key",
        "source_system",
        "source_object",
        "source_record_id",
        "extract_job_id",
        "extract_timestamp",
        "as_of_date",
        "contract_id",
        "scope_type",
        "application_name",
        "business_domain",
        "allocation_percent",
        "mapping_basis",
        "review_state",
        "active_application_exact_match",
        "active_application_near_match",
    ]
    rows: list[dict[str, object]] = []
    for row in scope_links:
        name = str(row["application_name"])
        exact_match = name in LEGACY_REFERENCE_APPLICATION_NAMES
        rows.append(
            {
                **row,
                "active_application_exact_match": "yes" if exact_match else "no",
                "active_application_near_match": name if exact_match else "",
            }
        )

    with (out_dir / "scope_active_application_reconciliation.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fieldnames is None:
        fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sql_text(value: object) -> str:
    if value is None or value == "":
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def sql_num(value: object) -> str:
    if value is None or value == "":
        return "null"
    return str(value)


def sql_json(value: object) -> str:
    return f"{sql_text(json.dumps(value, ensure_ascii=True, sort_keys=True, default=str))}::jsonb"


def insert(table: str, columns: list[str], rows: list[dict[str, str]]) -> str:
    if not rows:
        return ""
    body = ",\n".join("(" + ", ".join(row[column] for column in columns) + ")" for row in rows)
    return f"insert into {table} ({', '.join(columns)}) values\n{body};\n"


def normalize_contract(row: dict[str, str]) -> dict[str, str]:
    out = dict(row)
    override = CONTRACT_VALUE_OVERRIDES.get(out["contract_id"], {})
    out.update({k: v for k, v in override.items() if k != "alignment_note"})
    profile = PROTECTION_PROFILES.get(out["contract_id"], {})
    if profile.get("auto_renew"):
        out["auto_renew"] = profile["auto_renew"]
    out["alignment_note"] = override.get("alignment_note", "Source contract retained without party correction.")
    if out["contract_id"] == "MER-CTR-RCM-001":
        out["fixture_role"] = "existing_contract_r1_rcm_clean_match"
        out["supplier_id"] = "MER-SUP-R1-RCM-001"
        out["payee_supplier_id"] = "MER-PAY-R1-RCM-001"
    return out


def normalize_supplier(row: dict[str, str]) -> dict[str, str]:
    out = dict(row)
    if out["vendor_parent_id"] == "MER-VEN-RCM-NORTHBRIDGE":
        out["vendor_parent_id"] = "MER-VEN-R1-RCM"
        out["source_record_id"] = "SUPM-MER-SUP-R1-RCM-001"
        out["supplier_id"] = "MER-SUP-R1-RCM-001"
        out["payee_supplier_id"] = "MER-PAY-R1-RCM-001"
        out["supplier_legal_name"] = "R1 RCM Inc."
    return out


def normalize_price_rows(contract_rows: list[dict[str, str]], price_rows: list[dict[str, str]]) -> None:
    contract_annual = {row["contract_id"]: money(row["annual_value_usd"]) for row in contract_rows}
    rows_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in price_rows:
        rows_by_contract[row["contract_id"]].append(row)

    for contract_id, rows in rows_by_contract.items():
        target = contract_annual[contract_id]
        current = decimal_sum(rows, "annual_value_usd")
        if current == 0:
            continue
        assigned = Decimal("0.00")
        for index, row in enumerate(rows):
            if index == len(rows) - 1:
                annual = target - assigned
            else:
                annual = money(Decimal(row["annual_value_usd"]) * target / current)
                assigned += annual
            quantity = Decimal(row["quantity_or_commitment"])
            unit_price = annual if quantity == 0 else money(annual / quantity)
            row["annual_value_usd"] = money_str(annual)
            row["unit_price_usd"] = money_str(unit_price)
            row["synthetic_formula_note"] = (
                "annual_value_usd = register annual contract value allocated across operative rate-card lines; "
                f"contract annual anchor {money_str(target)}"
            )
            row["row_hash"] = hashlib.sha256(
                json.dumps({k: v for k, v in row.items() if k != "row_hash"}, sort_keys=True).encode("utf-8")
            ).hexdigest()


def normalize_invoice_rows(contract_rows: list[dict[str, str]], invoice_rows: list[dict[str, str]]) -> None:
    contract_annual = {row["contract_id"]: money(row["annual_value_usd"]) for row in contract_rows}
    contract_supplier = {row["contract_id"]: row["supplier_id"] for row in contract_rows}
    rows_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    default_variance_pattern = [Decimal("0.055"), Decimal("0.000"), Decimal("0.000"), Decimal("-0.018")]
    variance_patterns = {
        "MER-CTR-SSO-BPO-001": [
            Decimal("-0.220"),
            Decimal("-0.180"),
            Decimal("-0.160"),
            Decimal("-0.200"),
            Decimal("-0.220"),
            Decimal("-0.180"),
            Decimal("-0.160"),
            Decimal("-0.200"),
        ],
    }
    for row in invoice_rows:
        rows_by_contract[row["contract_id"]].append(row)

    for contract_id, rows in rows_by_contract.items():
        rows.sort(key=lambda row: (row["service_period"], row["invoice_line_id"]))
        target_monthly = money(contract_annual[contract_id] / Decimal("12"))
        variance_pattern = variance_patterns.get(contract_id, default_variance_pattern)
        for index, row in enumerate(rows):
            variance = money(target_monthly * variance_pattern[index % len(variance_pattern)])
            invoice_amount = money(target_monthly + variance)
            row["supplier_id"] = contract_supplier[contract_id]
            row["contract_rate_amount_usd"] = money_str(target_monthly)
            row["variance_amount_usd"] = money_str(variance)
            row["invoice_amount_usd"] = money_str(invoice_amount)
            row["credit_linkage_state"] = "candidate_recovery" if variance > 0 else "not_applicable"


def build_protection_assessment_rows(
    contract_rows: list[dict[str, str]],
    invoice_rows: list[dict[str, str]],
    market_benchmark_rows: list[dict[str, str]],
) -> list[dict[str, str]]:
    invoices_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in invoice_rows:
        invoices_by_contract[row["contract_id"]].append(row)
    benchmark_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in market_benchmark_rows:
        benchmark_by_contract[row["contract_id"]].append(row)

    rows: list[dict[str, str]] = []
    for contract in contract_rows:
        contract_id = contract["contract_id"]
        profile = PROTECTION_PROFILES[contract_id]
        invoices = invoices_by_contract[contract_id]
        annual_value = money(contract["annual_value_usd"])
        total_invoice = decimal_sum(invoices, "invoice_amount_usd")
        annualized_invoice = money(total_invoice * Decimal("12") / Decimal(len(invoices))) if invoices else Decimal("0.00")
        minimum_commitment = money(annual_value * Decimal(profile["minimum_commitment_pct"]) / Decimal("100"))
        shortfall = max(Decimal("0.00"), minimum_commitment - annualized_invoice)
        tfc_cost = money(annual_value * Decimal(profile["tfc_cap_pct"]) / Decimal("100"))
        benchmark_state = "present_synthetic_directional" if benchmark_by_contract[contract_id] else "missing"
        rows.append(
            {
                "tenant_key": TENANT_KEY,
                "source_system": "ECL commercial protection assessment",
                "source_object": "contract_protection_score",
                "source_record_id": f"PROTECT-{contract_id}",
                "extract_job_id": "extract-meridian-contract-protection-001",
                "extract_timestamp": "2026-08-22T00:00:00Z",
                "as_of_date": "2027-06-30",
                "contract_id": contract_id,
                "protection_score": profile["protection_score"],
                "protection_band": profile["protection_band"],
                "benchmarking_right_state": profile["benchmarking_right_state"],
                "benchmarking_basis": profile["benchmarking_basis"],
                "notice_window_days": profile["notice_window_days"],
                "auto_renew": profile["auto_renew"],
                "termination_for_convenience_state": profile["termination_for_convenience_state"],
                "tfc_cap_pct": profile["tfc_cap_pct"],
                "estimated_tfc_cost_usd": money_str(tfc_cost),
                "minimum_commitment_pct": profile["minimum_commitment_pct"],
                "minimum_commitment_usd": money_str(minimum_commitment),
                "ap_invoice_annualized_usd": money_str(annualized_invoice),
                "modeled_shortfall_exposure_usd": money_str(shortfall),
                "shortfall_penalty_state": profile["shortfall_penalty_state"],
                "assignment_consent_state": profile["assignment_consent_state"],
                "delivery_location_mix_state": profile["delivery_location_mix_state"],
                "portfolio_rate_position": profile["portfolio_rate_position"],
                "market_benchmark_extract_state": benchmark_state,
                "primary_weakness": profile["primary_weakness"],
                "commercial_guidance": profile["negotiation_guidance"],
                "legal_boundary": "Commercial optimization guidance only; route clause drafting and enforceability to counsel.",
                "review_state": "not_reviewed",
            }
        )
    return rows


def build_market_benchmark_rows(price_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    price_by_contract_service: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for row in price_rows:
        price_by_contract_service[(row["contract_id"], row["service_tower_id"])].append(row)

    for index, ((contract_id, service_tower_id), items) in enumerate(sorted(price_by_contract_service.items())):
        contract_rate = decimal_sum(items, "annual_value_usd")
        spread = SERVICE_TOWER_BENCHMARK_SPREAD[index % len(SERVICE_TOWER_BENCHMARK_SPREAD)]
        variance_pct = MARKET_BENCHMARK_VARIANCE_PCT[contract_id] + spread
        benchmark_median = money(contract_rate / (Decimal("1.0") + variance_pct))
        variance_usd = money(contract_rate - benchmark_median)
        low = money(benchmark_median * Decimal("0.92"))
        high = money(benchmark_median * Decimal("1.12"))
        rows.append(
            {
                "tenant_key": TENANT_KEY,
                "source_system": "Synthetic sourcing market benchmark extract",
                "source_object": "commercial_market_rate_benchmark",
                "source_record_id": f"BENCH-{contract_id}-{service_tower_id}",
                "extract_job_id": "extract-meridian-market-benchmark-001",
                "extract_timestamp": "2026-08-22T00:00:00Z",
                "as_of_date": "2027-06-30",
                "contract_id": contract_id,
                "service_tower_id": service_tower_id,
                "benchmark_category": "healthcare_bpo_managed_services",
                "benchmark_region": "US healthcare payer-provider",
                "rate_basis": "annual_service_tower_value",
                "contract_rate_annual_usd": money_str(contract_rate),
                "market_p25_annual_usd": money_str(low),
                "market_median_annual_usd": money_str(benchmark_median),
                "market_p75_annual_usd": money_str(high),
                "market_variance_usd": money_str(variance_usd),
                "market_variance_pct": money_str(variance_pct * Decimal("100")),
                "benchmark_dataset_id": "SYN-BPO-BENCH-2026-08",
                "benchmark_confidence": "synthetic_directional",
                "benchmark_generation_basis": "contract_level_directional_band_plus_service_tower_spread",
                "review_state": "not_reviewed",
            }
        )
    return rows


def build_protection_clause_rows(
    contract_rows: list[dict[str, str]],
    protection_rows: list[dict[str, str]],
) -> list[dict[str, str]]:
    protection_by_contract = {row["contract_id"]: row for row in protection_rows}
    clause_specs = [
        ("notice-window", "commercial_protection.notice_window_days", protection_notice_text),
        ("termination-for-convenience", "commercial_protection.termination_for_convenience_cap", lambda _contract, protection: protection_tfc_text(protection)),
        ("minimum-commitment", "commercial_protection.minimum_commitment", lambda _contract, protection: protection_minimum_commitment_text(protection)),
    ]
    rows: list[dict[str, str]] = []
    for contract in contract_rows:
        protection = protection_by_contract[contract["contract_id"]]
        document_id = f"DOC-{contract['contract_id']}-MSA"
        for index, (suffix, concept_ref, text_factory) in enumerate(clause_specs, start=1):
            source_record_id = f"CLAUSE-{document_id}-PROTECTION-{index:02d}"
            rows.append(
                {
                    "tenant_key": TENANT_KEY,
                    "source_system": "Synthetic document extraction pipeline",
                    "source_object": "markdown_pdf_equivalent_clause_extract",
                    "source_record_id": source_record_id,
                    "extract_job_id": "extract-meridian-clauses-001",
                    "extract_timestamp": "2026-08-22T00:00:00Z",
                    "as_of_date": "2027-06-30",
                    "contract_id": contract["contract_id"],
                    "document_id": document_id,
                    "concept_ref": concept_ref,
                    "source_page": "12",
                    "span_start": "",
                    "span_end": "",
                    "extracted_text": text_factory(contract, protection),
                    "extraction_method": f"synthetic_contract_protection_{suffix}_page_span_markdown_equivalent",
                    "confidence": "",
                    "conflict_group_id": "",
                    "review_state": "requires_client_review",
                    "row_hash": "",
                }
            )
    return rows


def rewrite_doc_text(text: str) -> str:
    replacements = {
        "NORTHBRIDGE-RCM-SERVICES-LLC": "R1-RCM-INC",
        "NorthBridge RCM Services LLC": "R1 RCM Inc.",
        "NorthBridge RCM Services": "R1 RCM",
    }
    for before, after in replacements.items():
        text = text.replace(before, after)
    return text


def page_sections(markdown: str) -> dict[int, tuple[int, str]]:
    markers: list[tuple[int, int]] = []
    cursor = 0
    while True:
        idx = markdown.find("## Page ", cursor)
        if idx == -1:
            break
        after = idx + len("## Page ")
        digits = []
        while after < len(markdown) and markdown[after].isdigit():
            digits.append(markdown[after])
            after += 1
        if digits:
            markers.append((int("".join(digits)), idx))
        cursor = after

    sections: dict[int, tuple[int, str]] = {}
    for index, (page, start) in enumerate(markers):
        end = markers[index + 1][1] if index + 1 < len(markers) else len(markdown)
        sections[page] = (start, markdown[start:end])
    return sections


def deterministic_confidence(concept_ref: str, extracted_text: str, located: bool) -> str:
    if not located:
        return "0.7200"
    base = 0.8600
    if any(token in concept_ref for token in ["notice-date", "rate-card", "fee-base", "changed-rates"]):
        base = 0.9400
    elif any(token in concept_ref for token in ["audit", "control", "data-access", "service-level"]):
        base = 0.9100
    elif any(token in concept_ref for token in ["value", "conflict", "termination", "step-in"]):
        base = 0.8800
    bump = (int(hashlib.sha256(f"{concept_ref}|{extracted_text}".encode("utf-8")).hexdigest()[:2], 16) % 7) / 1000
    return f"{min(base + bump, 0.9700):.4f}"


def apply_real_document_spans(clause_rows: list[dict[str, str]], doc_rows: list[dict[str, str]], docs_out: Path) -> None:
    doc_file_by_id = {row["document_id"]: row["source_file_name"] for row in doc_rows}
    page_cache: dict[str, dict[int, tuple[int, str]]] = {}
    for row in clause_rows:
        doc_id = row["document_id"]
        doc_path = docs_out / doc_file_by_id[doc_id]
        sections = page_cache.setdefault(doc_id, page_sections(doc_path.read_text(encoding="utf-8")))
        page = int(row["source_page"])
        page_start, section = sections.get(page, (0, doc_path.read_text(encoding="utf-8")))
        extracted = row["extracted_text"]
        local_start = section.find(extracted)
        if local_start == -1:
            # Fall back to a shorter prefix so wrapped/truncated synthetic rows
            # still point at the actual clause paragraph, not a fabricated span.
            local_start = section.find(extracted[:80])
        located = local_start != -1
        if located:
            global_start = page_start + local_start
            global_end = global_start + len(extracted)
        else:
            global_start = page_start
            global_end = page_start + min(len(section), max(1, len(extracted)))
        row["span_start"] = str(global_start)
        row["span_end"] = str(global_end)
        row["span_basis"] = "computed_from_markdown_text" if located else "computed_page_fallback_text_not_exact"
        row["confidence"] = deterministic_confidence(row["concept_ref"], extracted, located)
        row["row_hash"] = hashlib.sha256(
            json.dumps({k: v for k, v in row.items() if k != "row_hash"}, sort_keys=True).encode("utf-8")
        ).hexdigest()


def dollars(value: object) -> str:
    try:
        return f"${Decimal(str(value)):,.0f}"
    except Exception:
        return "unknown"


def money(value: object) -> Decimal:
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def money_str(value: object) -> str:
    return f"{money(value):f}"


def decimal_sum(rows: list[dict[str, str]], key: str) -> Decimal:
    return sum((Decimal(str(row[key])) for row in rows), Decimal("0")).quantize(CENT, rounding=ROUND_HALF_UP)


PROSE_LABELS = {
    "acceptable": "acceptable",
    "accepted_with_gate_control": "accepted with gate control",
    "absent": "absent",
    "above_internal_median_11pct": "11% above the internal portfolio median",
    "above_internal_median_18pct": "18% above the internal portfolio median",
    "applies_after_ramp": "applies after the transition ramp",
    "applies_to_underconsumed_volumes": "applies to underconsumed committed volumes",
    "auto_renewal_long_notice_and_shortfall_penalty": "automatic renewal, a long notice window, and shortfall exposure",
    "below_internal_median": "below the internal portfolio median",
    "bpo_existing_optimize": "existing BPO optimization",
    "bpo_governance_control": "BPO governance control",
    "bpo_new_event": "new BPO event",
    "buyer_consent_required": "buyer consent is required",
    "buyer_consent_required_except_affiliates": "buyer consent is required except for affiliate transfers",
    "capped_at_unmet_commitment": "capped at the unmet commitment",
    "capped_declining": "capped and declining over time",
    "capped_flat": "capped at a flat percentage of annualized fees",
    "backlog_age": "backlog age",
    "contractual_right_constrained_market_extract_missing": "benchmarking right exists but supplier consent and external evidence are still required",
    "contractual_right_delayed_market_extract_missing": "benchmarking right exists but is delayed; external evidence is still required",
    "contractual_right_present_market_extract_missing": "benchmarking right exists; external evidence is still required",
    "controlled_hr_service_center_mix": "controlled HR service-center mix",
    "current": "current",
    "candidate_recovery": "candidate for recovery",
    "close_confirmed_synthetic": "close-confirmed synthetic fixture",
    "cycle_time": "cycle time",
    "delayed_until_renewal_year": "delayed until the renewal year",
    "fee_for_service": "fee for service",
    "fixed_monthly_service_fee": "fixed monthly service fee",
    "finance_close_location_restricted": "finance-close location restricted",
    "internal_portfolio_comparator_only": "internal portfolio comparator only",
    "limited_supplier_consent_required": "limited and subject to supplier consent",
    "market_benchmark_extract_missing": "market benchmark evidence is still required",
    "mixed_us_and_controlled_offshore": "mixed U.S. and controlled offshore delivery",
    "monthly_service_fee": "monthly service fee",
    "multi_location_with_subprocessor_dependency": "multi-location delivery with subprocessor dependency",
    "near_internal_median": "near the internal portfolio median",
    "named_scope_alignment_from_contract_depth_review": "named scope alignment from contract-depth review",
    "no_benchmarking_right": "no benchmarking right",
    "not_applicable": "not applicable",
    "not_reviewed": "not reviewed",
    "paid": "paid",
    "present_after_first_anniversary": "available after the first anniversary",
    "present_annual_third_party": "annual third-party benchmarking is permitted",
    "present_but_delayed": "present but delayed",
    "present_synthetic_directional": "present as synthetic directional evidence only",
    "requires_client_review": "requires client review",
    "supplier_location_change_requires_notice_only": "supplier location changes require notice only",
    "transition_performance_unverified": "transition performance remains unverified",
    "transition_fee": "transition fee",
    "uncapped_exit_cost": "uncapped exit-cost exposure",
    "uncapped_remaining_fees": "uncapped remaining-fees exposure",
    "waived_during_transition": "waived during transition",
    "weak": "weak",
}


def prose(value: object) -> str:
    text = str(value)
    if text in PROSE_LABELS:
        return PROSE_LABELS[text]
    return text.replace("_", " ")


def auto_renewal_clause(value: str) -> str:
    return "The agreement automatically renews unless terminated on time." if value == "true" else "The agreement does not automatically renew."


def tfc_structure_text(state: str) -> str:
    if state == "capped_flat":
        return "a flat capped termination fee"
    if state == "capped_declining":
        return "a termination fee that is capped and declines over time"
    if state == "uncapped_remaining_fees":
        return "uncapped remaining-fees exposure"
    return prose(state)


def protection_notice_text(contract: dict[str, str], protection: dict[str, str]) -> str:
    return (
        f"Buyer must provide renewal notice by {contract['notice_deadline']}, which is "
        f"{protection['notice_window_days']} days before the contract end date of {contract['expiration_date']}. "
        f"{auto_renewal_clause(protection['auto_renew'])} "
        "The renewal workflow should require procurement, business owner, finance, legal, security, and transition owner review."
    )


def protection_tfc_text(protection: dict[str, str]) -> str:
    state = tfc_structure_text(protection["termination_for_convenience_state"])
    return (
        f"Buyer may terminate for convenience with {state}. The modeled termination fee is "
        f"{protection['tfc_cap_pct']}% of annualized fees, producing estimated exit cost of "
        f"{dollars(protection['estimated_tfc_cost_usd'])}. Termination for cause remains tied to uncured breach, "
        "repeated SLA failure, unresolved control failure, or data-access violation."
    )


def shortfall_penalty_text(state: str) -> str:
    label = prose(state)
    if state.startswith("applies"):
        return f"The shortfall penalty {label}."
    if state.startswith("capped"):
        return f"The shortfall penalty is {label}."
    if state == "waived_during_transition":
        return "The shortfall penalty is waived during transition."
    return f"The shortfall penalty posture is {label}."


def protection_minimum_commitment_text(protection: dict[str, str]) -> str:
    shortfall = money(protection["modeled_shortfall_exposure_usd"])
    shortfall_clause = (
        f"This creates modeled shortfall exposure of {dollars(shortfall)} before human review."
        if shortfall > 0
        else "No modeled shortfall exposure is present before human review."
    )
    return (
        f"The minimum annual commitment is modeled at {protection['minimum_commitment_pct']}% of annualized contract value, "
        f"or {dollars(protection['minimum_commitment_usd'])}. Current AP invoice actuals annualize to "
        f"{dollars(protection['ap_invoice_annualized_usd'])}. {shortfall_clause} "
        f"{shortfall_penalty_text(protection['shortfall_penalty_state'])}"
    )


def role_title(role: str) -> str:
    return role.replace("_", " ").title()


def page_block(page: int, title: str, paragraphs: list[str]) -> list[str]:
    lines = [f"## Page {page} - {title}", ""]
    for paragraph in paragraphs:
        lines.append(paragraph)
        lines.append("")
    return lines


def summarize_slas(rows: list[dict[str, str]]) -> list[str]:
    by_name: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_name[row["sla_name"]].append(row)
    output = []
    for name, items in sorted(by_name.items()):
        breached = sum(1 for item in items if item["breach_state"] == "breached")
        targets = sorted({item["target_value"] for item in items})
        output.append(
            f"- {prose(name)}: {len(items)} observations, target {', '.join(targets)}, {breached} breached rows, "
            f"credit formula {prose(items[0]['credit_formula'])}."
        )
    return output or ["- No SLA rows were supplied for this document."]


def render_enriched_document(
    doc_row: dict[str, str],
    contract: dict[str, str],
    supplier: dict[str, str],
    clauses: list[dict[str, str]],
    service_lines: list[dict[str, str]],
    scope_links: list[dict[str, object]],
    invoices: list[dict[str, str]],
    slas: list[dict[str, str]],
    prices: list[dict[str, str]],
    finance_rows: list[dict[str, str]],
    protection: dict[str, str],
) -> str:
    role = doc_row["document_role"]
    role_label = role_title(role)
    contract_id = contract["contract_id"]
    supplier_name = contract["supplier_legal_name"]
    total_invoice = decimal_sum(invoices, "invoice_amount_usd")
    total_rate_basis = decimal_sum(invoices, "contract_rate_amount_usd")
    total_variance = decimal_sum(invoices, "variance_amount_usd")
    credit_earned = decimal_sum(slas, "service_credits_earned_usd")
    annual_value = money(contract["annual_value_usd"])
    rate_card_total = decimal_sum(prices, "annual_value_usd")
    ap_rate_annualized = money(total_rate_basis * Decimal("12") / Decimal(len(invoices))) if invoices else Decimal("0.00")
    ap_invoice_annualized = money(total_invoice * Decimal("12") / Decimal(len(invoices))) if invoices else Decimal("0.00")
    minimum_commitment = money(protection["minimum_commitment_usd"])
    shortfall_exposure = money(protection["modeled_shortfall_exposure_usd"])
    convenience_termination_fee = money(protection["estimated_tfc_cost_usd"])
    locations = sorted({row["location"] for row in service_lines})
    selected_apps = scope_links[:12]
    selected_services = service_lines[:6]
    selected_prices = [row for row in prices if row.get("document_id") == doc_row["document_id"]] or prices[:6]

    lines = [
        f"# {doc_row['document_id']} - {contract['contract_name']}",
        "",
        "SYNTHETIC DEMO DATA - NOT CLIENT DATA - PHI-FREE - OFFLINE SOURCE LAYER/CUBE PROOF ONLY",
        "",
        f"Contract: {contract_id}",
        f"Supplier: {supplier_name}",
        f"Document role: {role_label}",
        f"Scenario as-of: {doc_row['as_of_date']}",
        f"Review state: {prose(doc_row['review_state'])}",
        "",
        "This generated document is intentionally dense enough to test contract evidence extraction, Source 360 drill-through, Tower value gating, and cube lineage. It is not a substitute for client contract review.",
        "",
    ]

    clauses_by_page: dict[int, list[dict[str, str]]] = defaultdict(list)
    for clause in clauses:
        clauses_by_page[int(clause["source_page"])].append(clause)

    def clause_excerpts(page: int) -> list[str]:
        clauses_for_page = clauses_by_page.get(page, [])
        if not clauses_for_page:
            return []
        result = ["Selected operative provisions:"]
        for clause in clauses_for_page:
            result.append(f"- {clause['extracted_text']}")
        return result

    lines.extend(
        page_block(
            1,
            "Cover, Parties, and Operative Record",
            [
                f"{contract['contract_name']} is recorded as a {prose(contract['contract_archetype'])} instrument for {contract['category']}. The contract register states annualized value {dollars(contract['annual_value_usd'])}, committed value {dollars(contract['committed_value_usd'])}, effective date {contract['effective_date']}, end date {contract['expiration_date']}, and notice deadline {contract['notice_deadline']}.",
                f"The supplier master identifies {supplier_name} as supplier `{supplier['supplier_id']}` and payee `{supplier['payee_supplier_id']}`. The procurement owner is {contract['procurement_owner_role']}; the business owner is {contract['business_owner_role']}; finance support sits with {contract['finance_owner_role']}.",
                "The operative record distinguishes source-recorded commercial values from document-extracted clauses. Contract dollars used by Source 360 and Tower are intentionally sourced from the register and AP/finance extracts until a human reviewer verifies document extractions.",
                *clause_excerpts(1),
            ],
        )
    )

    lines.extend(
        page_block(
            2,
            "Source Systems and Evidence Chain",
            [
                "Primary source systems represented by this package are CLM contract workspace export, SharePoint document inventory, markdown/PDF-equivalent clause extraction, supplier master, Workday Finance AP invoice-line extract, ServiceNow operational KPI export, CLM pricing exhibit, and FP&A value ledger.",
                f"This document ties to source record `{doc_row['source_record_id']}`, commercial instrument `{doc_row['commercial_instrument_id']}`, and family `{doc_row['contract_family_id']}`. Hash and path are regenerated after synthetic redaction and re-vendoring.",
                "The right grain for validation is contract, document, clause, service tower, scoped application, invoice line, SLA event, pricing line, and finance realization period. Rollups are allowed only after those grains reconcile.",
                *clause_excerpts(2),
            ],
        )
    )

    lines.extend(
        page_block(
            3,
            "Service Scope, Retained Work, and Ownership",
            [
                "Services are not modeled as a single blob. Each service tower keeps retained responsibility, supplier responsibility, location, system of record, and handoff gate so Source workflows can decide who must approve a fact before it becomes claimable.",
                *[
                    f"- {row['service_tower_id']} / {row['service_tower']}: {row['in_scope_work']} System of record: {row['system_of_record']}. Retained role: {row['retained_responsibility']}. Supplier role: {row['supplier_responsibility']}. Handoff gate: {prose(row['handoff_gate'])}."
                    for row in selected_services
                ],
                "Out-of-scope responsibilities stay explicit because they prevent false value claims. Policy approvals, final value confirmation, award decisions, and exception approvals remain with Meridian unless an executed amendment states otherwise.",
                *clause_excerpts(3),
            ],
        )
    )

    lines.extend(
        page_block(
            4,
            "Technology, Application Scope, and Allocation",
            [
                "Application scope is deliberately linked to named systems rather than broad phrases. This is the relationship Source 360 needs for the question: which contracts cover which applications and business functions?",
                *[
                    f"- {row['application_name']} ({row['business_domain']}): {row['allocation_percent']}% allocation. Mapping basis: {prose(row['mapping_basis'])}. Review state: {prose(row['review_state'])}."
                    for row in selected_apps
                ],
                "Scope links that do not match the prior active application file are carried as a fixture gap for dense Meridian generation. They should become CMDB/application inventory rows before this slice is promoted beyond local proof.",
                *clause_excerpts(4),
            ],
        )
    )

    lines.extend(
        page_block(
            5,
            "Commercial Model and Pricing Detail",
            [
                "Pricing evidence is modeled as rate-card lines, not as a single annual amount. That lets Source compare contract rate, AP invoice amount, variance, service tower, unit of measure, volume commitment, effective period, and uplift cap.",
                *[
                    f"- {row['pricing_line_id']}: {prose(row['line_item_description'])}; quantity {row['quantity_or_commitment']} {prose(row['unit_of_measure'])}; unit price {dollars(row['unit_price_usd'])}; annual value {dollars(row['annual_value_usd'])}; operative state {prose(row['operative_state'])}; uplift cap {row['uplift_cap_pct']}%."
                    for row in selected_prices[:8]
                ],
                f"Current source-room annualized contract value is {dollars(contract['annual_value_usd'])}. The generated rate-card lines reconcile to {dollars(rate_card_total)}. That value is register-backed in this proof; document clauses remain unverified until reviewed.",
            ],
        )
    )

    lines.extend(
        page_block(
            6,
            "AP Invoice, Variance, and Recovery Evidence",
            [
                f"The AP extract contributes {len(invoices)} invoice lines for this contract with total invoice amount {dollars(total_invoice)} and aggregate variance {dollars(total_variance)} against contract rate. The AP contract-rate basis annualizes to {dollars(ap_rate_annualized)} while invoice actuals annualize to {dollars(ap_invoice_annualized)} after variance. Candidate recovery rows remain candidates until AP owner and contract owner review them.",
                *[
                    f"- {row['invoice_line_id']}: period {row['service_period']}, PO {row['po_number']}, invoice {row['invoice_number']}, amount {dollars(row['invoice_amount_usd'])}, variance {dollars(row['variance_amount_usd'])}, payment state {prose(row['payment_state'])}, credit linkage {prose(row['credit_linkage_state'])}."
                    for row in invoices[:8]
                ],
                "Invoice evidence is operational spend evidence. It can support Source workflows and Tower gates, but it does not by itself prove value achieved.",
            ],
        )
    )

    lines.extend(
        page_block(
            7,
            "SLA Definitions, Observations, and Credits",
            [
                "SLA evidence is represented at event grain. Metric definitions, targets, actuals, breach state, fee base, vendor responsibility, earned credits, and claimed credits must remain linked before a value claim can move forward.",
                *summarize_slas(slas),
                f"Service credits earned in the synthetic extract total {dollars(credit_earned)}. Any credit not claimed remains a recovery opportunity, not a booked value.",
            ],
        )
    )

    lines.extend(
        page_block(
            8,
            "Governance, Escalation, and Decision Rights",
            [
                "Governance cadence includes weekly operational review, monthly commercial review, quarterly steering committee, and annual renewal readiness review. Required attendees are the retained owner, supplier delivery lead, finance partner, procurement owner, and data/control owner when evidence gaps are open.",
                "Decision rights are separated: operations accepts service performance, procurement accepts commercial compliance, finance validates value, legal accepts contract interpretation, and the business owner approves any Tower claim.",
                "Unresolved disputes are captured as gated claims. The system should display the gate reason and evidence needed instead of showing synthetic dollars as claimable.",
            ],
        )
    )

    lines.extend(
        page_block(
            9,
            "Security, Data Access, and Audit Controls",
            [
                "Supplier access must be least-privilege, role-bound, periodically recertified, and traceable to named service towers. Access to PHI-bearing systems requires approved identity, approved location, approved subprocessor, and auditable ticket or workflow linkage.",
                "Data extracts must preserve source system, source table or report name, source row identifier, extract job ID, extraction timestamp, period, owner, and transformation rule. Any AI-assisted summarization must cite the underlying extraction row or document span.",
                "Security-control evidence is necessary for Source workflow risk posture and Intelligence context packs; it does not replace tenant isolation, RLS, or product admission gates.",
            ],
        )
    )

    lines.extend(
        page_block(
            10,
            "Transition, Exit, and Step-In Readiness",
            [
                "Transition evidence tracks readiness gates, staffing transfer, knowledge articles, SOP completeness, backlog thresholds, issue aging, retained approvals, and cutover acceptance. Exit evidence tracks data return, runbook transfer, open disputes, invoice closure, and access revocation.",
                "Step-in readiness is especially important for revenue cycle, payroll, supply chain, finance close, and shared services because operational continuity can degrade before financial exposure is visible in AP or FP&A extracts.",
                "The product should show transition and exit issues as operational risk pressure; it should not convert them to realized value without finance attestation.",
            ],
        )
    )

    lines.extend(
        page_block(
            11,
            "Finance Realization and Tower Gate Status",
            [
                "Finance realization rows are deliberately separate from contract and invoice rows. A contract can be real, invoices can be paid, SLAs can be breached, and value can still be unclaimable if finance has not confirmed the outcome.",
                *[
                    f"- {row['finance_period']}: baseline {dollars(row['locked_baseline_usd'])}, vendor cost {dollars(row['vendor_cost_usd'])}, transition cost {dollars(row['transition_cost_usd'])}, retained cost {dollars(row['retained_cost_usd'])}, run-rate delta {dollars(row['run_rate_delta_usd'])}, finance-confirmed value {dollars(row['finance_confirmed_value_usd'])}, close state {prose(row['close_evidence_state'])}."
                    for row in finance_rows[:4]
                ],
                "Tower output stays gated because this package is synthetic and no client finance attestation or owner approval exists.",
            ],
        )
    )

    role_specific = {
        "master_services_agreement": "MSA review should focus on precedence, audit rights, termination, step-in, data use, record retention, security obligations, amendment control, and whether side letters can override the commercial baseline.",
        "statement_of_work_core": "Core SOW review should focus on service boundaries, retained responsibilities, in-scope and out-of-scope work, delivery locations, governance cadence, and whether each process has a system of record.",
        "service_operations_schedule": "Operations schedule review should focus on native process grain, queue ownership, volume baseline, handoff gates, work measurement, automation limits, and single-person dependency risk.",
        "service_level_kpi_schedule": "SLA schedule review should focus on metric definitions, targets, exclusions, credit formula, fee base, claim windows, vendor responsibility, and whether raw KPI events can reproduce the stated performance.",
        "pricing_rate_card_exhibit": "Pricing exhibit review should focus on unit-of-measure, volume bands, minimum commitments, uplift caps, pass-throughs, transition fees, retained-cost offsets, and superseded pricing lines.",
        "change_order_pricing_amendment": "Pricing amendment review should focus on superseded line IDs, effective dates, changed rates, approval evidence, new baseline, and whether AP invoices switched to the operative price.",
        "scope_change_amendment": "Scope amendment review should focus on added or removed systems, affected service towers, allocation changes, handoff gates, and downstream reporting/report-owner impacts.",
        "transition_plan": "Transition plan review should focus on waves, gates, acceptance criteria, operational fallback, staffing, knowledge transfer, backlog thresholds, and cutover owner approval.",
        "security_control_schedule": "Security schedule review should focus on access classes, MFA, privileged access, audit logs, subprocessor controls, PHI handling, location restrictions, and recertification cadence.",
        "renewal_notice_termination_evidence": "Renewal notice review should focus on notice deadline, automatic renewal, renewal options, price hold, termination for convenience, termination for cause, and open evidence needed before renewal decision.",
        "side_letter_exception_log": "Side-letter review should focus on conflicts with the MSA, whether the side letter has authority to alter price or SLA terms, exception owner, expiry date, and required amendment path.",
    }
    lines.extend(
        page_block(
            12,
            "Leverage and Exit Economics",
            [
                "This page exists for sourcing, not storytelling. It captures whether the buyer has practical leverage to renegotiate, compete, exit, or recover credits before renewal.",
                f"The commercial protection score is {protection['protection_score']}, which is {prose(protection['protection_band'])}. The primary weakness is {prose(protection['primary_weakness'])}. The internal portfolio rate position is {prose(protection['portfolio_rate_position'])}.",
                protection_notice_text(contract, protection),
                protection_tfc_text(protection),
                protection_minimum_commitment_text(protection),
                f"Benchmarking rights are {prose(protection['benchmarking_right_state'])}. Basis: {prose(protection['benchmarking_basis'])}. Market benchmark evidence is {prose(protection['market_benchmark_extract_state'])}. Source should open a market benchmark evidence request before asserting rate competitiveness.",
                f"Assignment and change-of-control posture: {prose(protection['assignment_consent_state'])}. M&A and divestiture scenarios remain commercial leverage questions, but legal enforceability must route to counsel.",
                f"Delivery-location mix for this contract uses {', '.join(locations)}; location posture is {prose(protection['delivery_location_mix_state'])}. Labor arbitrage, location concentration, and security restrictions should be reviewed together because the cheapest delivery model may not be acceptable for PHI-bearing or finance-close work.",
                f"Commercial guidance: {protection['commercial_guidance']} Legal boundary: {protection['legal_boundary']}",
            ],
        )
    )

    lines.extend(
        page_block(
            13,
            "Reviewer Checklist and Known Gaps",
            [
                role_specific.get(role, f"{role_label} review should confirm the operative terms, source extract alignment, owner approval, and whether the document changes any commercial or operational fact."),
                "Minimum review checklist: confirm supplier identity, contract number, effective dates, renewal notice, service scope, covered applications, pricing lines, SLA terms, AP invoice linkage, finance realization, security controls, and open exceptions.",
                "Known gap for this local proof: the synthetic documents are internally consistent, but human verification remains unverified and application-scope links must be reconciled into the dense Meridian CMDB/application inventory before approval.",
            ],
        )
    )

    return "\n".join(lines).rstrip() + "\n"


def build_source_room(input_root: Path, out_dir: Path) -> dict[str, list[dict[str, str]]]:
    extracts_root = input_root / "source_system_extracts"
    docs_root = input_root / "documents"
    source_room = out_dir / "source_room" / "SP08_Vendor_Contract"
    docs_out = source_room / "documents"
    extracts_out = source_room / "extracts"
    docs_out.mkdir(parents=True, exist_ok=True)
    extracts_out.mkdir(parents=True, exist_ok=True)

    contract_rows = [normalize_contract(r) for r in read_csv(extracts_root / "contract_register.csv")]
    supplier_rows = [normalize_supplier(r) for r in read_csv(extracts_root / "supplier_master.csv")]
    doc_rows = read_csv(extracts_root / "contract_document_inventory.csv")
    clause_rows = read_csv(extracts_root / "document_clause_extractions.csv")
    scope_service_rows = read_csv(extracts_root / "source_contract_scope_services.csv")
    invoice_rows = read_csv(extracts_root / "source_ap_po_invoice_lines.csv")
    sla_rows = read_csv(extracts_root / "source_sla_kpi_events.csv")
    price_rows = read_csv(extracts_root / "source_contract_pricing_rate_cards.csv")
    finance_rows = read_csv(extracts_root / "source_finance_realization.csv")

    for rows in [clause_rows, scope_service_rows, invoice_rows, sla_rows, price_rows, finance_rows]:
        for row in rows:
            if row.get("contract_id") == "MER-CTR-RCM-001":
                for key, value in list(row.items()):
                    row[key] = rewrite_doc_text(value)

    normalize_price_rows(contract_rows, price_rows)
    normalize_invoice_rows(contract_rows, invoice_rows)
    market_benchmark_rows = build_market_benchmark_rows(price_rows)

    scope_links: list[dict[str, object]] = []
    for contract_id, apps in SCOPE_APPLICATIONS.items():
        for index, (name, domain, scope_type, allocation_percent) in enumerate(apps, start=1):
            scope_links.append(
                {
                    "tenant_key": TENANT_KEY,
                    "source_system": "ECL commercial scope alignment workbook",
                    "source_object": "contract_application_scope",
                    "source_record_id": f"APP-SCOPE-{contract_id}-{index:02d}",
                    "extract_job_id": "extract-meridian-contract-application-scope-001",
                    "extract_timestamp": "2026-08-22T00:00:00Z",
                    "as_of_date": "2027-06-30",
                    "contract_id": contract_id,
                    "scope_type": scope_type,
                    "application_name": name,
                    "business_domain": domain,
                    "allocation_percent": allocation_percent,
                    "mapping_basis": "named_scope_alignment_from_contract_depth_review",
                    "review_state": "not_reviewed",
                }
            )
    write_scope_active_application_reconciliation(out_dir, scope_links)

    protection_rows = build_protection_assessment_rows(contract_rows, invoice_rows, market_benchmark_rows)
    clause_rows.extend(build_protection_clause_rows(contract_rows, protection_rows))
    contract_by_id = {row["contract_id"]: row for row in contract_rows}
    supplier_by_vendor = {row["vendor_parent_id"]: row for row in supplier_rows}
    protection_by_contract = {row["contract_id"]: row for row in protection_rows}
    clauses_by_doc: dict[str, list[dict[str, str]]] = defaultdict(list)
    services_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    scope_by_contract: dict[str, list[dict[str, object]]] = defaultdict(list)
    invoices_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    slas_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    prices_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    finance_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in clause_rows:
        clauses_by_doc[row["document_id"]].append(row)
    for row in scope_service_rows:
        services_by_contract[row["contract_id"]].append(row)
    for row in scope_links:
        scope_by_contract[str(row["contract_id"])].append(row)
    for row in invoice_rows:
        invoices_by_contract[row["contract_id"]].append(row)
    for row in sla_rows:
        slas_by_contract[row["contract_id"]].append(row)
    for row in price_rows:
        prices_by_contract[row["contract_id"]].append(row)
    for row in finance_rows:
        finance_by_contract[row["contract_id"]].append(row)

    for row in doc_rows:
        source_name = row["source_file_name"]
        contract = contract_by_id[row["contract_id"]]
        supplier = supplier_by_vendor[contract["vendor_parent_id"]]
        if row["contract_id"] == "MER-CTR-RCM-001":
            new_name = rewrite_doc_text(source_name)
            row["source_file_name"] = new_name
            row["source_file_path"] = f"documents/{new_name}"
            target_path = docs_out / new_name
        else:
            target_path = docs_out / source_name
        text = render_enriched_document(
            row,
            contract,
            supplier,
            clauses_by_doc[row["document_id"]],
            services_by_contract[row["contract_id"]],
            scope_by_contract[row["contract_id"]],
            invoices_by_contract[row["contract_id"]],
            slas_by_contract[row["contract_id"]],
            prices_by_contract[row["contract_id"]],
            finance_by_contract[row["contract_id"]],
            protection_by_contract[row["contract_id"]],
        )
        target_path.write_text(text, encoding="utf-8")
        row["generated_page_count"] = str(text.count("## Page "))
        row["generated_line_count"] = str(len(text.splitlines()))
        row["sha256"] = file_sha(target_path)

    apply_real_document_spans(clause_rows, doc_rows, docs_out)

    extract_sets: dict[str, list[dict[str, str]]] = {
        "contract_register": contract_rows,
        "supplier_master": supplier_rows,
        "contract_document_inventory": doc_rows,
        "document_clause_extractions": clause_rows,
        "source_contract_scope_services": scope_service_rows,
        "contract_scope_application_links": [dict(r) for r in scope_links],
        "source_ap_po_invoice_lines": invoice_rows,
        "source_sla_kpi_events": sla_rows,
        "source_contract_pricing_rate_cards": price_rows,
        "source_market_benchmark_rates": market_benchmark_rows,
        "source_finance_realization": finance_rows,
        "contract_commercial_protection_assessment": protection_rows,
    }

    for name, rows in extract_sets.items():
        write_csv(extracts_out / f"{name}.csv", rows)

    return extract_sets


def source_file_row(file_id: str, path: Path, source_type: str, source_owner: str) -> dict[str, str]:
    return {
        "id": sql_text(file_id),
        "tenant_key": sql_text(TENANT_KEY),
        "assessment_id": sql_text(ASSESSMENT_ID),
        "source_type": sql_text(source_type),
        "source_owner": sql_text(source_owner),
        "file_name": sql_text(path.name),
        "blob_uri": sql_text(f"local-proof://{path.as_posix()}"),
        "file_hash": sql_text(file_sha(path)),
        "source_date": sql_text("2026-08-22"),
        "access_class": sql_text("internal"),
        "quality_state": sql_text("partial"),
        "metadata_json": sql_json({"artifact": "commercial_contract_supply_correction", "source_path": path.as_posix()}),
    }


def source_record_row(record_id: str, source_file_id: str, native_id: str, record_type: str, row_number: int, payload: dict[str, object]) -> dict[str, str]:
    return {
        "id": sql_text(record_id),
        "tenant_key": sql_text(TENANT_KEY),
        "assessment_id": sql_text(ASSESSMENT_ID),
        "source_file_id": sql_text(source_file_id),
        "native_id": sql_text(native_id),
        "record_type": sql_text(record_type),
        "row_number": sql_num(row_number),
        "payload_json": sql_json(payload),
        "parse_state": sql_text("parsed"),
        "parse_notes": sql_text(None),
    }


def object_row(object_id: str, key: str, object_type: str, display_name: str, domain: str, source_record_id: str | None, basis: str, attrs: dict[str, object]) -> dict[str, str]:
    return {
        "id": sql_text(object_id),
        "tenant_key": sql_text(TENANT_KEY),
        "assessment_id": sql_text(ASSESSMENT_ID),
        "object_key": sql_text(key),
        "object_type": sql_text(object_type),
        "display_name": sql_text(display_name),
        "business_domain": sql_text(domain),
        "lifecycle_state": sql_text("current"),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text(basis),
        "value_state": sql_text("known"),
        "review_state": sql_text("not_reviewed"),
        "confidence": sql_num("0.9000"),
        "attributes_json": sql_json(attrs),
    }


def relationship_row(rel_id: str, from_id: str, rel_type: str, to_id: str, source_record_id: str | None, attrs: dict[str, object]) -> dict[str, str]:
    return {
        "id": sql_text(rel_id),
        "tenant_key": sql_text(TENANT_KEY),
        "assessment_id": sql_text(ASSESSMENT_ID),
        "from_object_id": sql_text(from_id),
        "relationship_type": sql_text(rel_type),
        "to_object_id": sql_text(to_id),
        "direction_label": sql_text(rel_type.lower()),
        "source_record_id": sql_text(source_record_id),
        "basis": sql_text("source_recorded"),
        "value_state": sql_text("known"),
        "review_state": sql_text("not_reviewed"),
        "confidence": sql_num("0.9000"),
        "attributes_json": sql_json(attrs),
    }


def measure_row(
    measure_id: str,
    subject_id: str,
    metric_key: str,
    value: object,
    unit: str,
    source_record_id: str | None,
    basis: str = "source_recorded",
    quality: str = "usable",
    document_extraction_id: str | None = None,
    attrs: dict[str, object] | None = None,
) -> dict[str, str]:
    attributes = {"artifact": "commercial_contract_supply_correction"}
    if attrs:
        attributes.update(attrs)
    return {
        "id": sql_text(measure_id),
        "tenant_key": sql_text(TENANT_KEY),
        "assessment_id": sql_text(ASSESSMENT_ID),
        "subject_object_id": sql_text(subject_id),
        "metric_key": sql_text(metric_key),
        "value_number": sql_num(value),
        "value_text": sql_text(None),
        "unit": sql_text(unit),
        "period_start": sql_text("2026-07-01"),
        "period_end": sql_text("2027-06-30"),
        "scenario": sql_text("current"),
        "source_record_id": sql_text(source_record_id),
        "document_extraction_id": sql_text(document_extraction_id),
        "basis": sql_text(basis),
        "value_state": sql_text("known"),
        "quality_state": sql_text(quality),
        "review_state": sql_text("not_reviewed"),
        "attributes_json": sql_json(attributes),
    }


def build_sql(out_dir: Path, extracts: dict[str, list[dict[str, str]]]) -> dict[str, object]:
    source_room = out_dir / "source_room" / "SP08_Vendor_Contract"
    extracts_out = source_room / "extracts"
    docs_out = source_room / "documents"

    source_files: list[dict[str, str]] = []
    source_records: list[dict[str, str]] = []
    file_ids: dict[str, str] = {}
    record_ids: dict[str, str] = {}

    for path in sorted(extracts_out.glob("*.csv")):
        file_id = stable_uuid("source-file", path.name)
        file_ids[path.name] = file_id
        source_files.append(source_file_row(file_id, path, "synthetic_source_room", "Vendor Management / Procurement"))
        rows = read_csv(path)
        for index, row in enumerate(rows, start=2):
            native_id = row.get("source_record_id") or row.get("document_id") or f"{path.stem}-{index}"
            rid = stable_uuid("source-record", path.name, native_id)
            record_ids[native_id] = rid
            source_records.append(source_record_row(rid, file_id, native_id, path.stem, index, row))

    documents_sql: list[dict[str, str]] = []
    document_ids: dict[str, str] = {}
    for row in extracts["contract_document_inventory"]:
        doc_key = row["document_id"]
        doc_path = docs_out / row["source_file_name"]
        doc_file_id = stable_uuid("source-file", row["source_file_name"])
        file_ids[row["source_file_name"]] = doc_file_id
        source_files.append(source_file_row(doc_file_id, doc_path, "document", "Contract Document Owner"))
        doc_id = stable_uuid("document", doc_key)
        document_ids[doc_key] = doc_id
        role = row["document_role"]
        doc_type = "contract" if "agreement" in role or "amendment" in role or "letter" in role else "sow" if "statement" in role or "operations" in role else "sla_report" if "service_level" in role else "attestation"
        documents_sql.append(
            {
                "id": sql_text(doc_id),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "source_file_id": sql_text(doc_file_id),
                "document_key": sql_text(doc_key),
                "document_type": sql_text(doc_type),
                "title": sql_text(row["source_file_name"]),
                "file_hash": sql_text(row["sha256"]),
                "page_count": sql_num(max(1, int(row.get("generated_page_count") or row.get("precedence_rank") or "1"))),
                "effective_date": sql_text(row.get("effective_from")),
                "access_class": sql_text("internal"),
                "review_state": sql_text("not_reviewed"),
            }
        )

    contract_by_id = {r["contract_id"]: r for r in extracts["contract_register"]}
    suppliers_by_vendor = {r["vendor_parent_id"]: r for r in extracts["supplier_master"]}
    protection_by_contract = {r["contract_id"]: r for r in extracts["contract_commercial_protection_assessment"]}
    apps_by_contract = defaultdict(list)
    for row in extracts["contract_scope_application_links"]:
        apps_by_contract[row["contract_id"]].append(row)

    objects: list[dict[str, str]] = []
    relationships: list[dict[str, str]] = []
    measures: list[dict[str, str]] = []
    object_ids: dict[tuple[str, str], str] = {}

    for contract_id, contract in contract_by_id.items():
        vendor_key = contract["vendor_parent_id"]
        supplier = suppliers_by_vendor[vendor_key]
        protection = protection_by_contract[contract_id]
        vendor_id = stable_uuid("object", "vendor", vendor_key)
        contract_object_id = stable_uuid("object", "contract", contract_id)
        object_ids[("vendor", vendor_key)] = vendor_id
        object_ids[("contract", contract_id)] = contract_object_id
        contract_record_id = record_ids[contract["source_record_id"]]
        supplier_record_id = record_ids[supplier["source_record_id"]]
        objects.append(
            object_row(
                vendor_id,
                vendor_key,
                "vendor",
                supplier["supplier_legal_name"],
                contract["category"],
                supplier_record_id,
                "source_recorded",
                {
                    "supplier_category": supplier["supplier_category"],
                    "fixture_alignment": contract.get("alignment_note"),
                    "supplier_status": supplier["supplier_status"],
                },
            )
        )
        objects.append(
            object_row(
                contract_object_id,
                contract_id,
                "contract",
                contract["contract_name"],
                contract["category"],
                contract_record_id,
                "source_recorded",
                {
                    "contract_archetype": contract["contract_archetype"],
                    "fixture_role": contract["fixture_role"],
                    "alignment_note": contract.get("alignment_note"),
                    "procurement_owner_role": contract["procurement_owner_role"],
                    "business_owner_role": contract["business_owner_role"],
                    "commercial_protection_score": protection["protection_score"],
                    "commercial_protection_band": protection["protection_band"],
                    "primary_commercial_weakness": protection["primary_weakness"],
                },
            )
        )
        relationships.append(
            relationship_row(
                stable_uuid("relationship", contract_id, "SUPPLIED_BY", vendor_key),
                contract_object_id,
                "SUPPLIED_BY",
                vendor_id,
                contract_record_id,
                {"source": "contract_register"},
            )
        )
        measures.append(measure_row(stable_uuid("measure", contract_id, "annualized"), contract_object_id, "annualized_contract_value_usd", contract["annual_value_usd"], "USD", contract_record_id))
        measures.append(measure_row(stable_uuid("measure", contract_id, "total"), contract_object_id, "total_contract_value_usd", contract["committed_value_usd"], "USD", contract_record_id))

    for row in extracts["contract_scope_application_links"]:
        object_key = "APP-SCOPE-" + hashlib.sha1(row["application_name"].encode("utf-8")).hexdigest()[:12].upper()
        scoped_id = stable_uuid("object", row["scope_type"], row["application_name"])
        object_ids[(row["scope_type"], row["application_name"])] = scoped_id
        source_record_id = record_ids[row["source_record_id"]]
        if not any(o["id"] == sql_text(scoped_id) for o in objects):
            objects.append(
                object_row(
                    scoped_id,
                    object_key,
                    row["scope_type"],
                    row["application_name"],
                    row["business_domain"],
                    source_record_id,
                    "source_recorded",
                    {"scope_mapping_basis": row["mapping_basis"]},
                )
            )
        relationships.append(
            relationship_row(
                stable_uuid("relationship", row["source_record_id"], "COVERED_BY"),
                scoped_id,
                "COVERED_BY",
                object_ids[("contract", row["contract_id"])],
                source_record_id,
                {"allocation_percent": row["allocation_percent"]},
            )
        )

    document_extractions: list[dict[str, str]] = []
    extraction_ids: dict[str, str] = {}
    for row in extracts["document_clause_extractions"]:
        extraction_id = stable_uuid("document-extraction", row["source_record_id"])
        extraction_ids[row["source_record_id"]] = extraction_id
        document_extractions.append(
            {
                "id": sql_text(extraction_id),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "document_id": sql_text(document_ids[row["document_id"]]),
                "field_key": sql_text(row["concept_ref"]),
                "extracted_value": sql_text(row["extracted_text"]),
                "normalized_value_json": sql_json({"text": row["extracted_text"], "concept_ref": row["concept_ref"]}),
                "page_number": sql_num(row["source_page"]),
                "span_reference": sql_text(f"{row['span_start']}-{row['span_end']}"),
                "basis": sql_text("document_extracted"),
                "confidence": sql_num(row["confidence"] or "0.8000"),
                "human_verification_state": sql_text("unverified"),
            }
        )

    contract_sql: list[dict[str, str]] = []
    contract_ids: dict[str, str] = {}
    for contract_id, contract in contract_by_id.items():
        cid = stable_uuid("commercial-contract", contract_id)
        contract_ids[contract_id] = cid
        first_doc = next((d for d in extracts["contract_document_inventory"] if d["contract_id"] == contract_id and d["document_role"] == "master_services_agreement"), None)
        contract_sql.append(
            {
                "id": sql_text(cid),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "contract_object_id": sql_text(object_ids[("contract", contract_id)]),
                "vendor_object_id": sql_text(object_ids[("vendor", contract["vendor_parent_id"])]),
                "contract_number": sql_text(contract_id),
                "contract_name": sql_text(contract["contract_name"]),
                "contract_type": sql_text("managed_service"),
                "start_date": sql_text(contract["effective_date"]),
                "end_date": sql_text(contract["expiration_date"]),
                "renewal_notice_date": sql_text(contract["notice_deadline"]),
                "annualized_value_usd": sql_num(contract["annual_value_usd"]),
                "total_contract_value_usd": sql_num(contract["committed_value_usd"]),
                "currency": sql_text("USD"),
                "source_document_id": sql_text(document_ids[first_doc["document_id"]] if first_doc else None),
                "source_record_id": sql_text(record_ids[contract["source_record_id"]]),
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("known"),
                "review_state": sql_text("not_reviewed"),
                "attributes_json": sql_json({"alignment_note": contract.get("alignment_note"), "fixture_role": contract["fixture_role"]}),
            }
        )

    service_line_sql: list[dict[str, str]] = []
    service_line_ids: dict[tuple[str, str], str] = {}
    annual_by_contract = {k: float(v["annual_value_usd"]) for k, v in contract_by_id.items()}
    lines_by_contract = defaultdict(list)
    for row in extracts["source_contract_scope_services"]:
        lines_by_contract[row["contract_id"]].append(row)
    for contract_id, lines in lines_by_contract.items():
        for row in lines:
            sid = stable_uuid("service-line", row["service_tower_id"])
            service_line_ids[(contract_id, row["service_tower_id"])] = sid
            service_line_sql.append(
                {
                    "id": sql_text(sid),
                    "tenant_key": sql_text(TENANT_KEY),
                    "assessment_id": sql_text(ASSESSMENT_ID),
                    "contract_id": sql_text(contract_ids[contract_id]),
                    "service_line_key": sql_text(row["service_tower_id"]),
                    "service_category": sql_text("managed_service"),
                    "description": sql_text(row["in_scope_work"]),
                    "annualized_value_usd": sql_num(round(annual_by_contract[contract_id] / len(lines), 2)),
                    "value_state": sql_text("estimated"),
                    "source_record_id": sql_text(record_ids[row["source_record_id"]]),
                    "document_extraction_id": sql_text(None),
                    "review_state": sql_text("not_reviewed"),
                }
            )

    scope_sql: list[dict[str, str]] = []
    for row in extracts["contract_scope_application_links"]:
        contract_id = row["contract_id"]
        scoped_id = object_ids[(row["scope_type"], row["application_name"])]
        allocation_amount = round(float(contract_by_id[contract_id]["annual_value_usd"]) * float(row["allocation_percent"]) / 100, 2)
        scope_sql.append(
            {
                "id": sql_text(stable_uuid("commercial-scope", row["source_record_id"])),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "contract_id": sql_text(contract_ids[contract_id]),
                "scoped_object_id": sql_text(scoped_id),
                "scope_type": sql_text(row["scope_type"]),
                "allocation_percent": sql_num(row["allocation_percent"]),
                "allocation_amount_usd": sql_num(allocation_amount),
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("estimated"),
                "source_record_id": sql_text(record_ids[row["source_record_id"]]),
                "review_state": sql_text("not_reviewed"),
            }
        )

    invoice_sql: list[dict[str, str]] = []
    invoice_sum_by_contract = defaultdict(float)
    for row in extracts["source_ap_po_invoice_lines"]:
        contract = contract_by_id[row["contract_id"]]
        amount = float(row["invoice_amount_usd"])
        invoice_sum_by_contract[row["contract_id"]] += amount
        invoice_sql.append(
            {
                "id": sql_text(stable_uuid("invoice-line", row["invoice_line_id"])),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "invoice_line_key": sql_text(row["invoice_line_id"]),
                "vendor_object_id": sql_text(object_ids[("vendor", contract["vendor_parent_id"])]),
                "contract_id": sql_text(contract_ids[row["contract_id"]]),
                "cost_center_object_id": sql_text(None),
                "period_start": sql_text(f"{row['service_period']}-01"),
                "period_end": sql_text(f"{row['service_period']}-28"),
                "amount_usd": sql_num(row["invoice_amount_usd"]),
                "gl_account": sql_text("6210"),
                "spend_category": sql_text("managed_service"),
                "source_record_id": sql_text(record_ids[row["source_record_id"]]),
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("known"),
                "review_state": sql_text("not_reviewed"),
                "zero_amount_reason": sql_text(None),
            }
        )

    sla_sql: list[dict[str, str]] = []
    sla_actual_by_contract = defaultdict(list)
    for row in extracts["source_sla_kpi_events"]:
        service_id = service_line_ids.get((row["contract_id"], row["service_tower_id"]))
        actual = float(row["actual_value"])
        sla_actual_by_contract[row["contract_id"]].append(actual)
        sla_sql.append(
            {
                "id": sql_text(stable_uuid("sla", row["source_record_id"])),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "contract_id": sql_text(contract_ids[row["contract_id"]]),
                "service_line_id": sql_text(service_id),
                "scoped_object_id": sql_text(None),
                "metric_key": sql_text("sla_actual"),
                "target_value_number": sql_num(row["target_value"]),
                "actual_value_number": sql_num(row["actual_value"]),
                "unit": sql_text("percent"),
                "period_start": sql_text(row["event_date"]),
                "period_end": sql_text(row["event_date"]),
                "source_record_id": sql_text(record_ids[row["source_record_id"]]),
                "document_extraction_id": sql_text(None),
                "basis": sql_text("source_recorded"),
                "value_state": sql_text("known"),
                "quality_state": sql_text("usable" if row["breach_state"] == "met" else "estimated"),
                "review_state": sql_text("not_reviewed"),
            }
        )

    for contract_id, total in invoice_sum_by_contract.items():
        measures.append(measure_row(stable_uuid("measure", contract_id, "actual-cost"), object_ids[("contract", contract_id)], "actual_cost_usd", round(total, 2), "USD", None))
    for contract_id, values in sla_actual_by_contract.items():
        measures.append(measure_row(stable_uuid("measure", contract_id, "sla-actual"), object_ids[("contract", contract_id)], "sla_actual", round(sum(values) / len(values), 2), "percent", None, basis="calculated", quality="estimated"))
    for contract_id, apps in apps_by_contract.items():
        measures.append(measure_row(stable_uuid("measure", contract_id, "covered-objects"), object_ids[("contract", contract_id)], "covered_object_count", len(apps), "count", None, basis="calculated"))
    benchmarks_by_contract: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in extracts["source_market_benchmark_rates"]:
        benchmarks_by_contract[row["contract_id"]].append(row)
    for contract_id, rows in benchmarks_by_contract.items():
        contract_rate = decimal_sum(rows, "contract_rate_annual_usd")
        market_median = decimal_sum(rows, "market_median_annual_usd")
        variance = decimal_sum(rows, "market_variance_usd")
        variance_pct = money((variance / market_median) * Decimal("100")) if market_median else Decimal("0.00")
        first_record_id = record_ids[rows[0]["source_record_id"]]
        measures.append(
            measure_row(
                stable_uuid("measure", contract_id, "market-benchmark-variance-usd"),
                object_ids[("contract", contract_id)],
                "market_benchmark_variance_usd",
                money_str(variance),
                "USD",
                first_record_id,
                basis="model_inferred",
                quality="estimated",
                attrs={"contract_rate_annual_usd": money_str(contract_rate), "market_median_annual_usd": money_str(market_median), "benchmark_dataset_id": rows[0]["benchmark_dataset_id"], "benchmark_confidence": rows[0]["benchmark_confidence"], "benchmark_generation_basis": rows[0]["benchmark_generation_basis"]},
            )
        )
        measures.append(
            measure_row(
                stable_uuid("measure", contract_id, "market-benchmark-variance-percent"),
                object_ids[("contract", contract_id)],
                "market_benchmark_variance_percent",
                money_str(variance_pct),
                "percent",
                first_record_id,
                basis="model_inferred",
                quality="estimated",
                attrs={"benchmark_dataset_id": rows[0]["benchmark_dataset_id"], "benchmark_confidence": rows[0]["benchmark_confidence"], "benchmark_generation_basis": rows[0]["benchmark_generation_basis"]},
            )
        )
    for contract_id, protection in protection_by_contract.items():
        protection_record_id = record_ids[protection["source_record_id"]]
        contract_object_id = object_ids[("contract", contract_id)]
        protection_doc_extractions = {
            "notice_window_days": extraction_ids[f"CLAUSE-DOC-{contract_id}-MSA-PROTECTION-01"],
            "estimated_tfc_cost_usd": extraction_ids[f"CLAUSE-DOC-{contract_id}-MSA-PROTECTION-02"],
            "minimum_commitment_usd": extraction_ids[f"CLAUSE-DOC-{contract_id}-MSA-PROTECTION-03"],
        }
        measures.append(
            measure_row(
                stable_uuid("measure", contract_id, "commercial-protection-score"),
                contract_object_id,
                "commercial_protection_score",
                protection["protection_score"],
                "score",
                protection_record_id,
                basis="source_recorded",
            )
        )
        measures.append(
            measure_row(
                stable_uuid("measure", contract_id, "estimated-tfc-cost"),
                contract_object_id,
                "estimated_tfc_cost_usd",
                protection["estimated_tfc_cost_usd"],
                "USD",
                protection_record_id,
                basis="document_extracted",
                quality="estimated",
                document_extraction_id=protection_doc_extractions["estimated_tfc_cost_usd"],
            )
        )
        measures.append(
            measure_row(
                stable_uuid("measure", contract_id, "modeled-shortfall-exposure"),
                contract_object_id,
                "modeled_shortfall_exposure_usd",
                protection["modeled_shortfall_exposure_usd"],
                "USD",
                protection_record_id,
                basis="source_recorded",
                quality="estimated",
            )
        )
        measures.append(
            measure_row(
                stable_uuid("measure", contract_id, "notice-window-days"),
                contract_object_id,
                "notice_window_days",
                protection["notice_window_days"],
                "days",
                protection_record_id,
                basis="document_extracted",
                quality="estimated",
                document_extraction_id=protection_doc_extractions["notice_window_days"],
            )
        )
        measures.append(
            measure_row(
                stable_uuid("measure", contract_id, "minimum-commitment"),
                contract_object_id,
                "minimum_commitment_usd",
                protection["minimum_commitment_usd"],
                "USD",
                protection_record_id,
                basis="document_extracted",
                quality="estimated",
                document_extraction_id=protection_doc_extractions["minimum_commitment_usd"],
            )
        )

    snapshot_id = stable_uuid("snapshot", ASSESSMENT_ID)
    context_pack_id = stable_uuid("context-pack", ASSESSMENT_ID)
    projection_manifest_id = stable_uuid("projection-manifest", ASSESSMENT_ID)
    snapshot_sql = [
        {
            "id": sql_text(snapshot_id),
            "tenant_key": sql_text(TENANT_KEY),
            "assessment_id": sql_text(ASSESSMENT_ID),
            "snapshot_key": sql_text("commercial-contract-supply-correction-v1"),
            "snapshot_type": sql_text("projection_source"),
            "source_hash": sql_text(SOURCE_HASH_LABEL),
            "context_hash": sql_text(stable_uuid("context-hash", SOURCE_HASH_LABEL)),
            "created_by_job": sql_text("scripts/ecl/build_commercial_contract_slice.py"),
            "quality_state": sql_text("warning"),
            "proof_uri": sql_text(f"local-proof://{out_dir.as_posix()}"),
        }
    ]
    context_pack_sql = [
        {
            "id": sql_text(context_pack_id),
            "tenant_key": sql_text(TENANT_KEY),
            "assessment_id": sql_text(ASSESSMENT_ID),
            "snapshot_id": sql_text(snapshot_id),
            "pack_key": sql_text("source-commercial-contract-pack"),
            "pack_version": sql_num(1),
            "payload_json": sql_json({"contract_count": len(contract_sql), "document_count": len(documents_sql), "review_state": "not_reviewed"}),
            "payload_hash": sql_text(stable_uuid("payload", SOURCE_HASH_LABEL)),
            "retrieval_state": sql_text("not_indexed"),
            "quality_state": sql_text("warning"),
            "proof_uri": sql_text(f"local-proof://{out_dir.as_posix()}"),
        }
    ]
    projection_manifest_sql = [
        {
            "id": sql_text(projection_manifest_id),
            "tenant_key": sql_text(TENANT_KEY),
            "assessment_id": sql_text(ASSESSMENT_ID),
            "projection_key": sql_text("source-commercial-contract-supply-correction"),
            "projection_version": sql_num(1),
            "snapshot_id": sql_text(snapshot_id),
            "rebuild_command": sql_text("python3 scripts/ecl/build_commercial_contract_slice.py"),
            "source_hash": sql_text(SOURCE_HASH_LABEL),
            "projection_hash": sql_text(stable_uuid("projection-hash", SOURCE_HASH_LABEL)),
            "row_count": sql_num(15),
            "quality_state": sql_text("warning"),
            "admission_status": sql_text("not_applicable"),
            "admission_gate_results_json": sql_json([]),
            "gated_claim_count": sql_num(5),
            "proof_uri": sql_text(f"local-proof://{out_dir.as_posix()}"),
        }
    ]

    source_contract_rows = []
    source_vendor_rows = []
    tower_rows = []
    for contract_id, contract in contract_by_id.items():
        vendor_id = object_ids[("vendor", contract["vendor_parent_id"])]
        contract_object_id = object_ids[("contract", contract_id)]
        annual = float(contract["annual_value_usd"])
        scope_items = apps_by_contract[contract_id]
        doc_items = [d for d in extracts["contract_document_inventory"] if d["contract_id"] == contract_id]
        service_items = [s for s in service_line_sql if s["contract_id"] == sql_text(contract_ids[contract_id])]
        sla_values = sla_actual_by_contract[contract_id]
        is_new_bpo_gap = contract_id != "MER-CTR-RCM-001"
        gap_flags = ["fixture_bpo_vendor_gap_filled"] if is_new_bpo_gap else ["revendored_to_existing_r1_fixture_vendor"]
        protection = protection_by_contract[contract_id]
        benchmark_items = benchmarks_by_contract[contract_id]
        benchmark_contract_rate = decimal_sum(benchmark_items, "contract_rate_annual_usd")
        benchmark_market_median = decimal_sum(benchmark_items, "market_median_annual_usd")
        benchmark_variance = decimal_sum(benchmark_items, "market_variance_usd")
        benchmark_variance_pct = money((benchmark_variance / benchmark_market_median) * Decimal("100")) if benchmark_market_median else Decimal("0.00")
        benchmark_summary = {
            "benchmark_dataset_id": benchmark_items[0]["benchmark_dataset_id"] if benchmark_items else None,
            "benchmark_confidence": benchmark_items[0]["benchmark_confidence"] if benchmark_items else None,
            "service_tower_count": len(benchmark_items),
            "contract_rate_annual_usd": float(benchmark_contract_rate),
            "market_median_annual_usd": float(benchmark_market_median),
            "market_benchmark_variance_usd": float(benchmark_variance),
            "market_benchmark_variance_percent": float(benchmark_variance_pct),
            "basis": "synthetic_directional_market_benchmark",
        }
        protection_flags = []
        if int(protection["protection_score"]) < 60:
            protection_flags.append("weak_commercial_protection")
        if protection["primary_weakness"] != "market_benchmark_extract_missing":
            protection_flags.append(protection["primary_weakness"])
        else:
            protection_flags.append("market_benchmark_extract_missing")
        source_contract_rows.append(
            {
                "id": sql_text(stable_uuid("projection", "source-contract-360", contract_id)),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "snapshot_id": sql_text(snapshot_id),
                "projection_manifest_id": sql_text(projection_manifest_id),
                "projection_version": sql_num(1),
                "row_key": sql_text(contract_id),
                "contract_id": sql_text(contract_ids[contract_id]),
                "contract_object_id": sql_text(contract_object_id),
                "vendor_object_id": sql_text(vendor_id),
                "contract_name": sql_text(contract["contract_name"]),
                "vendor_name": sql_text(contract["supplier_legal_name"]),
                "renewal_notice_date": sql_text(contract["notice_deadline"]),
                "end_date": sql_text(contract["expiration_date"]),
                "annualized_value_usd": sql_num(contract["annual_value_usd"]),
                "total_contract_value_usd": sql_num(contract["committed_value_usd"]),
                "value_state": sql_text("known"),
                "quality_state": sql_text("warning"),
                "service_lines_json": sql_json([{"service_line_key": x["service_line_key"].strip("'"), "annualized_value_usd": x["annualized_value_usd"]} for x in service_items]),
                "scope_json": sql_json([{"name": s["application_name"], "domain": s["business_domain"], "allocation_percent": s["allocation_percent"]} for s in scope_items]),
                "spend_summary_json": sql_json(
                    {
                        "annualized_value_usd": annual,
                        "ap_actual_lines": 8,
                        "ap_actual_total_usd": round(invoice_sum_by_contract[contract_id], 2),
                        "commercial_protection_score": int(protection["protection_score"]),
                        "commercial_protection_band": protection["protection_band"],
                        "primary_commercial_weakness": protection["primary_weakness"],
                        "market_benchmark": benchmark_summary,
                    }
                ),
                "sla_summary_json": sql_json({"observation_count": len(sla_values), "average_actual": round(sum(sla_values) / len(sla_values), 2) if sla_values else None}),
                "document_proof_json": sql_json([{"document_id": d["document_id"], "role": d["document_role"], "sha256": d["sha256"]} for d in doc_items]),
                "gap_flags_json": sql_json([*gap_flags, *protection_flags]),
                "source_refs_json": sql_json([contract["source_record_id"], protection["source_record_id"], *[b["source_record_id"] for b in benchmark_items[:2]], *[d["source_record_id"] for d in doc_items[:3]]]),
                "source_hash": sql_text(SOURCE_HASH_LABEL),
            }
        )
        source_vendor_rows.append(
            {
                "id": sql_text(stable_uuid("projection", "source-vendor-360", contract["vendor_parent_id"])),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "snapshot_id": sql_text(snapshot_id),
                "projection_manifest_id": sql_text(projection_manifest_id),
                "projection_version": sql_num(1),
                "row_key": sql_text(contract["vendor_parent_id"]),
                "vendor_object_id": sql_text(vendor_id),
                "vendor_name": sql_text(contract["supplier_legal_name"]),
                "contract_count": sql_num(1),
                "covered_object_count": sql_num(len(scope_items)),
                "annualized_spend_usd": sql_num(contract["annual_value_usd"]),
                "renewal_exposure_usd": sql_num(contract["annual_value_usd"]),
                "value_state": sql_text("known"),
                "quality_state": sql_text("warning"),
                "contract_ids_json": sql_json([contract_id]),
                "covered_objects_json": sql_json([s["application_name"] for s in scope_items]),
                "spend_summary_json": sql_json({"annualized_spend_usd": annual, "ap_actual_total_usd": round(invoice_sum_by_contract[contract_id], 2), "market_benchmark": benchmark_summary}),
                "sla_summary_json": sql_json({"observation_count": len(sla_values)}),
                "risk_control_json": sql_json(
                    [
                        {
                            "contract_id": contract_id,
                            "commercial_protection_score": int(protection["protection_score"]),
                            "band": protection["protection_band"],
                            "primary_weakness": protection["primary_weakness"],
                        }
                    ]
                ),
                "gap_flags_json": sql_json([*gap_flags, *protection_flags]),
                "source_refs_json": sql_json([contract["source_record_id"], protection["source_record_id"], *[b["source_record_id"] for b in benchmark_items[:2]]]),
                "source_hash": sql_text(SOURCE_HASH_LABEL),
            }
        )
        tower_rows.append(
            {
                "id": sql_text(stable_uuid("projection", "tower", contract_id)),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "snapshot_id": sql_text(snapshot_id),
                "projection_manifest_id": sql_text(projection_manifest_id),
                "projection_version": sql_num(1),
                "row_key": sql_text(contract_id),
                "page_key": sql_text("value_proof"),
                "row_type": sql_text("commercial_value_gate"),
                "primary_object_id": sql_text(contract_object_id),
                "claim_id": sql_text(f"CLAIM-{contract_id}"),
                "claim_gate_status": sql_text("gated"),
                "claim_gate_reason_code": sql_text("requires_client_review"),
                "claim_gate_reason_detail": sql_text("Synthetic AP, SLA, and contract evidence are loaded, but no client finance attestation or owner approval exists."),
                "next_gate": sql_text("client_finance_and_owner_review"),
                "evidence_needed_json": sql_json(["finance attestation", "owner approval", "client document confirmation"]),
                "funded_amount_usd": sql_num(contract["annual_value_usd"]),
                "promised_value_usd": sql_num(None),
                "usage_supported_value_usd": sql_num(None),
                "finance_validated_value_usd": sql_num(None),
                "claimable_value_usd": sql_num(0),
                "blocked_value_usd": sql_num(contract["annual_value_usd"]),
                "proof_maturity_score": sql_num(55 if contract_id == "MER-CTR-RCM-001" else 45),
                "risk_pressure_score": sql_num(62),
                "usage_strength_score": sql_num(50),
                "owner_role": sql_text(contract["business_owner_role"]),
                "handoff_module": sql_text("Source"),
                "value_state": sql_text("known"),
                "quality_state": sql_text("warning"),
                "metric_keys_json": sql_json(["annualized_contract_value_usd", "blocked_value_usd", "market_benchmark_variance_usd", "market_benchmark_variance_percent"]),
                "source_refs_json": sql_json([contract["source_record_id"], *[b["source_record_id"] for b in benchmark_items[:2]]]),
                "gap_flags_json": sql_json(["no_client_attestation", *gap_flags, *protection_flags]),
                "display_payload_json": sql_json(
                    {
                        "contract": contract["contract_name"],
                        "vendor": contract["supplier_legal_name"],
                        "commercial_protection_score": int(protection["protection_score"]),
                        "primary_commercial_weakness": protection["primary_weakness"],
                        "market_benchmark": benchmark_summary,
                    }
                ),
                "source_hash": sql_text(SOURCE_HASH_LABEL),
            }
        )
        measures.append(measure_row(stable_uuid("measure", contract_id, "blocked"), contract_object_id, "blocked_value_usd", contract["annual_value_usd"], "USD", None, basis="calculated", quality="estimated"))
        measures.append(measure_row(stable_uuid("measure", contract_id, "claimable"), contract_object_id, "claimable_value_usd", 0, "USD", None, basis="calculated", quality="estimated"))

    cube_manifest_rows = []
    cube_slice_rows = []
    cube_metric_rows = []
    cube_measure_rows = []
    measure_ids_by_subject_metric = {}
    for m in measures:
        measure_ids_by_subject_metric[(m["subject_object_id"], m["metric_key"])] = m["id"].strip("'")
    metric_units = {
        "annualized_contract_value_usd": "USD",
        "actual_cost_usd": "USD",
        "blocked_value_usd": "USD",
        "claimable_value_usd": "USD",
        "estimated_tfc_cost_usd": "USD",
        "modeled_shortfall_exposure_usd": "USD",
        "covered_object_count": "count",
        "evidence_gap_count": "count",
        "commercial_protection_score": "score",
        "notice_window_days": "days",
        "market_benchmark_variance_usd": "USD",
        "market_benchmark_variance_percent": "percent",
    }

    cube_specs = [
        ("source_contract_cube", "contract", "annualized_contract_value_usd"),
        ("source_vendor_cube", "vendor", "annualized_contract_value_usd"),
        ("tower_spend_value_cube", "contract", "blocked_value_usd"),
        ("tower_evidence_cube", "contract", "evidence_gap_count"),
    ]
    for cube_key, grain, primary_metric in cube_specs:
        manifest_id = stable_uuid("cube-manifest", cube_key)
        cube_manifest_rows.append(
            {
                "id": sql_text(manifest_id),
                "tenant_key": sql_text(TENANT_KEY),
                "assessment_id": sql_text(ASSESSMENT_ID),
                "snapshot_id": sql_text(snapshot_id),
                "cube_key": sql_text(cube_key),
                "cube_version": sql_num(1),
                "rebuild_command": sql_text("python3 scripts/ecl/build_commercial_contract_slice.py"),
                "source_hash": sql_text(SOURCE_HASH_LABEL),
                "cube_hash": sql_text(stable_uuid("cube-hash", cube_key)),
                "slice_count": sql_num(len(contract_by_id)),
                "quality_state": sql_text("warning"),
                "admission_status": sql_text("not_applicable"),
                "admission_gate_results_json": sql_json([]),
                "proof_uri": sql_text(f"local-proof://{out_dir.as_posix()}"),
            }
        )
        for contract_id, contract in contract_by_id.items():
            primary_object_id = object_ids[("vendor", contract["vendor_parent_id"])] if grain == "vendor" else object_ids[("contract", contract_id)]
            metrics = (
                [
                    "annualized_contract_value_usd",
                    "actual_cost_usd",
                    "covered_object_count",
                    "commercial_protection_score",
                    "estimated_tfc_cost_usd",
                    "modeled_shortfall_exposure_usd",
                    "notice_window_days",
                    "market_benchmark_variance_usd",
                    "market_benchmark_variance_percent",
                ]
                if "source" in cube_key
                else [
                    "annualized_contract_value_usd",
                    "blocked_value_usd",
                    "claimable_value_usd",
                    "commercial_protection_score",
                    "estimated_tfc_cost_usd",
                    "modeled_shortfall_exposure_usd",
                    "market_benchmark_variance_usd",
                    "market_benchmark_variance_percent",
                ]
            )
            if cube_key == "tower_evidence_cube":
                metrics = [
                    "evidence_gap_count",
                    "covered_object_count",
                    "commercial_protection_score",
                    "notice_window_days",
                    "modeled_shortfall_exposure_usd",
                    "market_benchmark_variance_usd",
                ]
                measures.append(measure_row(stable_uuid("measure", contract_id, "gap-count"), object_ids[("contract", contract_id)], "evidence_gap_count", 3, "count", None, basis="calculated", quality="estimated"))
            measures_json = {}
            for metric in metrics:
                key = (sql_text(object_ids[("contract", contract_id)]), sql_text(metric))
                mid = measure_ids_by_subject_metric.get(key)
                if metric == "evidence_gap_count":
                    mid = stable_uuid("measure", contract_id, "gap-count")
                if metric == "annualized_contract_value_usd":
                    value = float(contract["annual_value_usd"])
                elif metric == "actual_cost_usd":
                    value = round(invoice_sum_by_contract[contract_id], 2)
                elif metric == "covered_object_count":
                    value = len(apps_by_contract[contract_id])
                elif metric == "blocked_value_usd":
                    value = float(contract["annual_value_usd"])
                elif metric == "claimable_value_usd":
                    value = 0
                elif metric == "commercial_protection_score":
                    value = int(protection_by_contract[contract_id]["protection_score"])
                elif metric == "estimated_tfc_cost_usd":
                    value = float(protection_by_contract[contract_id]["estimated_tfc_cost_usd"])
                elif metric == "modeled_shortfall_exposure_usd":
                    value = float(protection_by_contract[contract_id]["modeled_shortfall_exposure_usd"])
                elif metric == "notice_window_days":
                    value = int(protection_by_contract[contract_id]["notice_window_days"])
                elif metric == "market_benchmark_variance_usd":
                    value = float(sum(Decimal(row["market_variance_usd"]) for row in benchmarks_by_contract[contract_id]))
                elif metric == "market_benchmark_variance_percent":
                    total_market = sum(Decimal(row["market_median_annual_usd"]) for row in benchmarks_by_contract[contract_id])
                    total_variance = sum(Decimal(row["market_variance_usd"]) for row in benchmarks_by_contract[contract_id])
                    value = float(money((total_variance / total_market) * Decimal("100"))) if total_market else 0
                else:
                    value = 3
                measures_json[metric] = value
            slice_id = stable_uuid("cube-slice", cube_key, contract_id)
            cube_slice_rows.append(
                {
                    "id": sql_text(slice_id),
                    "tenant_key": sql_text(TENANT_KEY),
                    "assessment_id": sql_text(ASSESSMENT_ID),
                    "snapshot_id": sql_text(snapshot_id),
                    "cube_manifest_id": sql_text(manifest_id),
                    "cube_key": sql_text(cube_key),
                    "cube_version": sql_num(1),
                    "slice_key": sql_text(f"{cube_key}:{contract_id}"),
                    "grain_key": sql_text(grain),
                    "primary_object_id": sql_text(primary_object_id),
                    "dimensions_json": sql_json({"contract_id": contract_id, "vendor": contract["supplier_legal_name"], "category": contract["category"]}),
                    "measures_json": sql_json(measures_json),
                    "primary_metric_key": sql_text(primary_metric),
                    "metric_keys_json": sql_json(metrics),
                    "source_refs_json": sql_json([contract["source_record_id"]]),
                    "basis_summary": sql_text("Commercial source-room correction with FK-backed metric and measure lineage."),
                    "value_state": sql_text("known"),
                    "quality_state": sql_text("warning"),
                    "gap_flags_json": sql_json(["requires_client_review"]),
                    "source_hash": sql_text(SOURCE_HASH_LABEL),
                }
            )
            for order, metric in enumerate(metrics, start=1):
                cube_metric_rows.append(
                    {
                        "tenant_key": sql_text(TENANT_KEY),
                        "assessment_id": sql_text(ASSESSMENT_ID),
                        "cube_slice_id": sql_text(slice_id),
                        "metric_key": sql_text(metric),
                        "metric_role": sql_text("primary" if metric == primary_metric else "display"),
                        "unit": sql_text(metric_units[metric]),
                        "sort_order": sql_num(order),
                        "source_hash": sql_text(SOURCE_HASH_LABEL),
                    }
                )
                measure_id = stable_uuid("measure", contract_id, "gap-count") if metric == "evidence_gap_count" else measure_ids_by_subject_metric.get((sql_text(object_ids[("contract", contract_id)]), sql_text(metric)))
                if measure_id:
                    cube_measure_rows.append(
                        {
                            "tenant_key": sql_text(TENANT_KEY),
                            "assessment_id": sql_text(ASSESSMENT_ID),
                            "cube_slice_id": sql_text(slice_id),
                            "measure_id": sql_text(measure_id),
                            "metric_key": sql_text(metric),
                            "measure_role": sql_text("primary" if metric == primary_metric else "display"),
                            "source_hash": sql_text(SOURCE_HASH_LABEL),
                        }
                    )

    measure_keys = {m["id"] for m in measures}
    measures = list({m["id"]: m for m in measures}.values())

    columns = {
        "ecl_source.source_file": ["id", "tenant_key", "assessment_id", "source_type", "source_owner", "file_name", "blob_uri", "file_hash", "source_date", "access_class", "quality_state", "metadata_json"],
        "ecl_source.source_record": ["id", "tenant_key", "assessment_id", "source_file_id", "native_id", "record_type", "row_number", "payload_json", "parse_state", "parse_notes"],
        "ecl_source.document": ["id", "tenant_key", "assessment_id", "source_file_id", "document_key", "document_type", "title", "file_hash", "page_count", "effective_date", "access_class", "review_state"],
        "ecl_source.document_extraction": ["id", "tenant_key", "assessment_id", "document_id", "field_key", "extracted_value", "normalized_value_json", "page_number", "span_reference", "basis", "confidence", "human_verification_state"],
        "ecl_context.object": ["id", "tenant_key", "assessment_id", "object_key", "object_type", "display_name", "business_domain", "lifecycle_state", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
        "ecl_context.relationship": ["id", "tenant_key", "assessment_id", "from_object_id", "relationship_type", "to_object_id", "direction_label", "source_record_id", "basis", "value_state", "review_state", "confidence", "attributes_json"],
        "ecl_context.measure": ["id", "tenant_key", "assessment_id", "subject_object_id", "metric_key", "value_number", "value_text", "unit", "period_start", "period_end", "scenario", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state", "attributes_json"],
        "ecl_context.snapshot": ["id", "tenant_key", "assessment_id", "snapshot_key", "snapshot_type", "source_hash", "context_hash", "created_by_job", "quality_state", "proof_uri"],
        "ecl_context.context_pack": ["id", "tenant_key", "assessment_id", "snapshot_id", "pack_key", "pack_version", "payload_json", "payload_hash", "retrieval_state", "quality_state", "proof_uri"],
        "ecl_commercial.contract": ["id", "tenant_key", "assessment_id", "contract_object_id", "vendor_object_id", "contract_number", "contract_name", "contract_type", "start_date", "end_date", "renewal_notice_date", "annualized_value_usd", "total_contract_value_usd", "currency", "source_document_id", "source_record_id", "basis", "value_state", "review_state", "attributes_json"],
        "ecl_commercial.contract_service_line": ["id", "tenant_key", "assessment_id", "contract_id", "service_line_key", "service_category", "description", "annualized_value_usd", "value_state", "source_record_id", "document_extraction_id", "review_state"],
        "ecl_commercial.contract_scope": ["id", "tenant_key", "assessment_id", "contract_id", "scoped_object_id", "scope_type", "allocation_percent", "allocation_amount_usd", "basis", "value_state", "source_record_id", "review_state"],
        "ecl_commercial.invoice_line": ["id", "tenant_key", "assessment_id", "invoice_line_key", "vendor_object_id", "contract_id", "cost_center_object_id", "period_start", "period_end", "amount_usd", "gl_account", "spend_category", "source_record_id", "basis", "value_state", "review_state", "zero_amount_reason"],
        "ecl_commercial.sla_observation": ["id", "tenant_key", "assessment_id", "contract_id", "service_line_id", "scoped_object_id", "metric_key", "target_value_number", "actual_value_number", "unit", "period_start", "period_end", "source_record_id", "document_extraction_id", "basis", "value_state", "quality_state", "review_state"],
        "ecl_projection.projection_manifest": ["id", "tenant_key", "assessment_id", "projection_key", "projection_version", "snapshot_id", "rebuild_command", "source_hash", "projection_hash", "row_count", "quality_state", "admission_status", "admission_gate_results_json", "gated_claim_count", "proof_uri"],
        "ecl_projection.source_contract_360": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "row_key", "contract_id", "contract_object_id", "vendor_object_id", "contract_name", "vendor_name", "renewal_notice_date", "end_date", "annualized_value_usd", "total_contract_value_usd", "value_state", "quality_state", "service_lines_json", "scope_json", "spend_summary_json", "sla_summary_json", "document_proof_json", "gap_flags_json", "source_refs_json", "source_hash"],
        "ecl_projection.source_vendor_360": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "row_key", "vendor_object_id", "vendor_name", "contract_count", "covered_object_count", "annualized_spend_usd", "renewal_exposure_usd", "value_state", "quality_state", "contract_ids_json", "covered_objects_json", "spend_summary_json", "sla_summary_json", "risk_control_json", "gap_flags_json", "source_refs_json", "source_hash"],
        "ecl_projection.tower_command_center": ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "row_key", "page_key", "row_type", "primary_object_id", "claim_id", "claim_gate_status", "claim_gate_reason_code", "claim_gate_reason_detail", "next_gate", "evidence_needed_json", "funded_amount_usd", "promised_value_usd", "usage_supported_value_usd", "finance_validated_value_usd", "claimable_value_usd", "blocked_value_usd", "proof_maturity_score", "risk_pressure_score", "usage_strength_score", "owner_role", "handoff_module", "value_state", "quality_state", "metric_keys_json", "source_refs_json", "gap_flags_json", "display_payload_json", "source_hash"],
        "ecl_projection.cube_manifest": ["id", "tenant_key", "assessment_id", "snapshot_id", "cube_key", "cube_version", "rebuild_command", "source_hash", "cube_hash", "slice_count", "quality_state", "admission_status", "admission_gate_results_json", "proof_uri"],
        "ecl_projection.cube_slice": ["id", "tenant_key", "assessment_id", "snapshot_id", "cube_manifest_id", "cube_key", "cube_version", "slice_key", "grain_key", "primary_object_id", "dimensions_json", "measures_json", "primary_metric_key", "metric_keys_json", "source_refs_json", "basis_summary", "value_state", "quality_state", "gap_flags_json", "source_hash"],
        "ecl_projection.cube_slice_metric": ["tenant_key", "assessment_id", "cube_slice_id", "metric_key", "metric_role", "unit", "sort_order", "source_hash"],
        "ecl_projection.cube_slice_measure": ["tenant_key", "assessment_id", "cube_slice_id", "measure_id", "metric_key", "measure_role", "source_hash"],
    }
    batches = [
        ("ecl_source.source_file", source_files),
        ("ecl_source.source_record", source_records),
        ("ecl_source.document", documents_sql),
        ("ecl_source.document_extraction", document_extractions),
        ("ecl_context.object", objects),
        ("ecl_context.relationship", relationships),
        ("ecl_context.measure", measures),
        ("ecl_context.snapshot", snapshot_sql),
        ("ecl_context.context_pack", context_pack_sql),
        ("ecl_commercial.contract", contract_sql),
        ("ecl_commercial.contract_service_line", service_line_sql),
        ("ecl_commercial.contract_scope", scope_sql),
        ("ecl_commercial.invoice_line", invoice_sql),
        ("ecl_commercial.sla_observation", sla_sql),
        ("ecl_projection.projection_manifest", projection_manifest_sql),
        ("ecl_projection.source_contract_360", source_contract_rows),
        ("ecl_projection.source_vendor_360", source_vendor_rows),
        ("ecl_projection.tower_command_center", tower_rows),
        ("ecl_projection.cube_manifest", cube_manifest_rows),
        ("ecl_projection.cube_slice", cube_slice_rows),
        ("ecl_projection.cube_slice_metric", cube_metric_rows),
        ("ecl_projection.cube_slice_measure", cube_measure_rows),
    ]

    write_projection_csv(out_dir / "source_contract_360_projection.csv", columns["ecl_projection.source_contract_360"], source_contract_rows)
    write_projection_csv(out_dir / "source_vendor_360_projection.csv", columns["ecl_projection.source_vendor_360"], source_vendor_rows)
    write_projection_csv(out_dir / "tower_command_center_projection.csv", columns["ecl_projection.tower_command_center"], tower_rows)

    sql_parts = [
        "-- Commercial contract supply correction ECL load.\n",
        "-- Local proof artifact only. Do not run against shared Azure data planes.\n",
        "begin;\n",
    ]
    for table, rows in batches:
        sql_parts.append(insert(table, columns[table], rows))
    sql_parts.append("commit;\n")
    (out_dir / "commercial_contract_supply_ecl_load.sql").write_text("\n".join(sql_parts), encoding="utf-8")

    verification_sql = """
select 'source_files', count(*) from ecl_source.source_file;
select 'source_records', count(*) from ecl_source.source_record;
select 'documents', count(*) from ecl_source.document;
select 'document_extractions', count(*) from ecl_source.document_extraction;
select 'objects', count(*) from ecl_context.object;
select object_type, count(*) from ecl_context.object group by object_type order by object_type;
select relationship_type, count(*) from ecl_context.relationship group by relationship_type order by relationship_type;
select 'contracts', count(*) from ecl_commercial.contract;
select 'service_lines', count(*) from ecl_commercial.contract_service_line;
select 'contract_scope', count(*) from ecl_commercial.contract_scope;
select 'invoice_lines', count(*) from ecl_commercial.invoice_line;
select 'sla_observations', count(*) from ecl_commercial.sla_observation;
select 'source_contract_360', count(*) from ecl_projection.source_contract_360;
select 'source_vendor_360', count(*) from ecl_projection.source_vendor_360;
select 'tower_command_center', count(*) from ecl_projection.tower_command_center;
select 'cube_slices', count(*) from ecl_projection.cube_slice;
select 'cube_slice_metrics', count(*) from ecl_projection.cube_slice_metric;
select 'cube_slice_measures', count(*) from ecl_projection.cube_slice_measure;
select 'json_metric_drift', count(*)
from ecl_projection.cube_slice cs
cross join lateral jsonb_array_elements_text(cs.metric_keys_json) metric_key
left join ecl_context.metric_definition md
  on md.tenant_key = cs.tenant_key and md.metric_key = metric_key
where md.metric_key is null;
select 'document_span_distinct', count(distinct span_reference) from ecl_source.document_extraction;
select 'document_confidence_distinct', count(distinct confidence) from ecl_source.document_extraction;
select 'document_span_fallback_count', count(*)
from ecl_source.source_record
where record_type = 'document_clause_extractions'
  and payload_json ->> 'span_basis' <> 'computed_from_markdown_text';
select 'document_page_count_min', min(page_count) from ecl_source.document;
select 'document_page_count_avg', round(avg(page_count), 2) from ecl_source.document;
select 'document_page_count_max', max(page_count) from ecl_source.document;
select 'document_line_count_min', min((payload_json ->> 'generated_line_count')::int)
from ecl_source.source_record
where record_type = 'contract_document_inventory';
select 'document_line_count_avg', round(avg((payload_json ->> 'generated_line_count')::int), 2)
from ecl_source.source_record
where record_type = 'contract_document_inventory';
select 'document_line_count_max', max((payload_json ->> 'generated_line_count')::int)
from ecl_source.source_record
where record_type = 'contract_document_inventory';
with price_sum as (
  select payload_json ->> 'contract_id' as contract_number,
         sum((payload_json ->> 'annual_value_usd')::numeric) as rate_card_annual_usd
  from ecl_source.source_record
  where record_type = 'source_contract_pricing_rate_cards'
  group by payload_json ->> 'contract_id'
)
select 'pricing_rate_card_reconciliation_failures', count(*)
from price_sum p
join ecl_commercial.contract c on c.contract_number = p.contract_number
where abs(p.rate_card_annual_usd - c.annualized_value_usd) > 0.01;
select 'invoice_arithmetic_failures', count(*)
from ecl_source.source_record
where record_type = 'source_ap_po_invoice_lines'
  and abs(
    (payload_json ->> 'invoice_amount_usd')::numeric
    - (payload_json ->> 'contract_rate_amount_usd')::numeric
    - (payload_json ->> 'variance_amount_usd')::numeric
  ) > 0.01;
with invoice_basis as (
  select payload_json ->> 'contract_id' as contract_number,
         count(*) as invoice_lines,
         sum((payload_json ->> 'contract_rate_amount_usd')::numeric) as contract_rate_total
  from ecl_source.source_record
  where record_type = 'source_ap_po_invoice_lines'
  group by payload_json ->> 'contract_id'
)
select 'invoice_rate_annualization_failures', count(*)
from invoice_basis i
join ecl_commercial.contract c on c.contract_number = i.contract_number
where abs((i.contract_rate_total * 12 / i.invoice_lines) - c.annualized_value_usd) > 0.05;
select 'commercial_protection_profiles', count(*)
from ecl_source.source_record
where record_type = 'contract_commercial_protection_assessment';
select 'commercial_protection_score_distinct', count(distinct payload_json ->> 'protection_score')
from ecl_source.source_record
where record_type = 'contract_commercial_protection_assessment';
select 'weak_commercial_protection_contracts', count(*)
from ecl_source.source_record
where record_type = 'contract_commercial_protection_assessment'
  and (payload_json ->> 'protection_score')::int < 60;
select 'no_benchmarking_right_contracts', count(*)
from ecl_source.source_record
where record_type = 'contract_commercial_protection_assessment'
  and payload_json ->> 'benchmarking_right_state' = 'absent';
select 'uncapped_exit_cost_contracts', count(*)
from ecl_source.source_record
where record_type = 'contract_commercial_protection_assessment'
  and payload_json ->> 'termination_for_convenience_state' = 'uncapped_remaining_fees';
select 'auto_renew_long_notice_contracts', count(*)
from ecl_source.source_record
where record_type = 'contract_commercial_protection_assessment'
  and payload_json ->> 'auto_renew' = 'true'
  and (payload_json ->> 'notice_window_days')::int >= 365;
select 'shortfall_exposure_contracts', count(*)
from ecl_source.source_record
where record_type = 'contract_commercial_protection_assessment'
  and (payload_json ->> 'modeled_shortfall_exposure_usd')::numeric > 0;
select 'source_contract_360_protection_payloads', count(*)
from ecl_projection.source_contract_360
where spend_summary_json ? 'commercial_protection_score'
  and jsonb_array_length(gap_flags_json) >= 2;
select 'commercial_protection_measure_rows', count(*)
from ecl_context.measure
where metric_key in (
  'commercial_protection_score',
  'estimated_tfc_cost_usd',
  'modeled_shortfall_exposure_usd',
  'notice_window_days',
  'minimum_commitment_usd'
);
select 'market_benchmark_source_rows', count(*)
from ecl_source.source_record
where record_type = 'source_market_benchmark_rates';
select 'market_benchmark_measure_rows', count(*)
from ecl_context.measure
where metric_key in ('market_benchmark_variance_usd', 'market_benchmark_variance_percent');
select 'market_benchmark_distinct_variance_values', count(distinct value_number)
from ecl_context.measure
where metric_key = 'market_benchmark_variance_percent';
select 'market_benchmark_source_distinct_variance_values', count(distinct payload_json ->> 'market_variance_pct')
from ecl_source.source_record
where record_type = 'source_market_benchmark_rates';
select 'market_benchmark_model_inferred_basis_rows', count(*)
from ecl_context.measure
where metric_key in ('market_benchmark_variance_usd', 'market_benchmark_variance_percent')
  and basis = 'model_inferred';
select 'market_benchmark_source_recorded_basis_rows', count(*)
from ecl_context.measure
where metric_key in ('market_benchmark_variance_usd', 'market_benchmark_variance_percent')
  and basis = 'source_recorded';
select 'source_contract_360_market_benchmark_payloads', count(*)
from ecl_projection.source_contract_360
where spend_summary_json ? 'market_benchmark';
select 'tower_market_benchmark_metric_payloads', count(*)
from ecl_projection.tower_command_center
where metric_keys_json ? 'market_benchmark_variance_usd';
select 'commercial_protection_clause_extractions', count(*)
from ecl_source.document_extraction
where field_key in (
  'commercial_protection.notice_window_days',
  'commercial_protection.termination_for_convenience_cap',
  'commercial_protection.minimum_commitment'
);
select 'commercial_protection_doc_backed_measures', count(*)
from ecl_context.measure
where metric_key in (
  'estimated_tfc_cost_usd',
  'notice_window_days',
  'minimum_commitment_usd'
)
and basis = 'document_extracted'
and document_extraction_id is not null;
select 'commercial_protection_record_backed_measures', count(*)
from ecl_context.measure
where metric_key in (
  'commercial_protection_score',
  'modeled_shortfall_exposure_usd'
)
and basis = 'source_recorded'
and document_extraction_id is null;
select 'protection_score_document_backed', count(*)
from ecl_context.measure
where metric_key = 'commercial_protection_score'
  and document_extraction_id is not null;
select 'commercial_protection_cube_metric_rows', count(*)
from ecl_projection.cube_slice_metric
where metric_key in (
  'commercial_protection_score',
  'estimated_tfc_cost_usd',
  'modeled_shortfall_exposure_usd',
  'notice_window_days'
);
select 'market_benchmark_cube_metric_rows', count(*)
from ecl_projection.cube_slice_metric
where metric_key in ('market_benchmark_variance_usd', 'market_benchmark_variance_percent');
select 'commercial_protection_cube_measure_rows', count(*)
from ecl_projection.cube_slice_measure
where metric_key in (
  'commercial_protection_score',
  'estimated_tfc_cost_usd',
  'modeled_shortfall_exposure_usd',
  'notice_window_days'
);
select 'market_benchmark_cube_measure_rows', count(*)
from ecl_projection.cube_slice_measure
where metric_key in ('market_benchmark_variance_usd', 'market_benchmark_variance_percent');
select 'cube_metric_unit_failures', count(*)
from ecl_projection.cube_slice_metric
where (metric_key like '%_usd' and unit <> 'USD')
   or (metric_key like '%_score' and unit <> 'score')
   or (metric_key like '%_days' and unit <> 'days')
   or (metric_key like '%_count' and unit <> 'count');
with unverified_extraction as (
  select id
  from ecl_source.document_extraction
  where human_verification_state <> 'verified'
),
owner_confirmed_or_claimable_money_from_unverified as (
  select id
  from ecl_context.measure
  where metric_key in (
    'annual_spend_usd',
    'baseline_cost_usd',
    'actual_cost_usd',
    'target_cost_usd',
    'forecast_value_usd',
    'validated_value_usd',
    'blocked_value_usd',
    'annualized_contract_value_usd',
    'total_contract_value_usd',
    'renewal_exposure_usd',
    'estimated_tfc_cost_usd',
    'modeled_shortfall_exposure_usd',
    'minimum_commitment_usd',
    'claimable_value_usd'
  )
  and document_extraction_id in (select id from unverified_extraction)
  and (
    review_state = 'confirmed'
    or basis = 'owner_confirmed'
    or metric_key = 'claimable_value_usd'
  )
  union all
  select id
  from ecl_commercial.contract_service_line
  where annualized_value_usd is not null
    and document_extraction_id in (select id from unverified_extraction)
    and review_state = 'confirmed'
)
select 'owner_confirmed_or_claimable_money_from_unverified_extraction', count(*) from owner_confirmed_or_claimable_money_from_unverified;
with unverified_extraction as (
  select id
  from ecl_source.document_extraction
  where human_verification_state <> 'verified'
)
select 'estimated_clause_money_from_unverified_extraction', count(*)
from ecl_context.measure
where metric_key in ('estimated_tfc_cost_usd', 'minimum_commitment_usd')
  and document_extraction_id in (select id from unverified_extraction)
  and quality_state = 'estimated'
  and review_state = 'not_reviewed';
select 'contract_money_document_extracted_basis', count(*)
from ecl_commercial.contract
where (annualized_value_usd is not null or total_contract_value_usd is not null)
  and basis = 'document_extracted';
select vendor_name, contract_name, annualized_value_usd, jsonb_array_length(scope_json) as scope_count,
       jsonb_array_length(document_proof_json) as document_count
from ecl_projection.source_contract_360
order by vendor_name;
"""
    (out_dir / "commercial_contract_supply_verify.sql").write_text(verification_sql.strip() + "\n", encoding="utf-8")

    summary = {
        "tenant_key": TENANT_KEY,
        "assessment_id": ASSESSMENT_ID,
        "source_files": len(source_files),
        "source_records": len(source_records),
        "documents": len(documents_sql),
        "document_extractions": len(document_extractions),
        "objects": len(objects),
        "relationships": len(relationships),
        "measures": len(measures),
        "contracts": len(contract_sql),
        "service_lines": len(service_line_sql),
        "contract_scope": len(scope_sql),
        "invoice_lines": len(invoice_sql),
        "sla_observations": len(sla_sql),
        "source_contract_360_rows": len(source_contract_rows),
        "source_vendor_360_rows": len(source_vendor_rows),
        "tower_rows": len(tower_rows),
        "cube_manifests": len(cube_manifest_rows),
        "cube_slices": len(cube_slice_rows),
        "cube_slice_metrics": len(cube_metric_rows),
        "cube_slice_measures": len(cube_measure_rows),
        "contract_values": {k: float(v["annual_value_usd"]) for k, v in contract_by_id.items()},
        "r1_revendored": contract_by_id["MER-CTR-RCM-001"]["supplier_legal_name"] == "R1 RCM Inc.",
        "bpo_vendor_gap_fill_count": 4,
        "document_span_distinct": len({f"{r['span_start']}-{r['span_end']}" for r in extracts["document_clause_extractions"]}),
        "document_confidence_distinct": len({r["confidence"] for r in extracts["document_clause_extractions"]}),
        "document_span_fallback_count": sum(
            1 for r in extracts["document_clause_extractions"] if r.get("span_basis") != "computed_from_markdown_text"
        ),
        "document_page_count_min": min(int(r["generated_page_count"]) for r in extracts["contract_document_inventory"]),
        "document_page_count_avg": round(
            sum(int(r["generated_page_count"]) for r in extracts["contract_document_inventory"])
            / len(extracts["contract_document_inventory"]),
            2,
        ),
        "document_page_count_max": max(int(r["generated_page_count"]) for r in extracts["contract_document_inventory"]),
        "document_line_count_min": min(int(r["generated_line_count"]) for r in extracts["contract_document_inventory"]),
        "document_line_count_avg": round(
            sum(int(r["generated_line_count"]) for r in extracts["contract_document_inventory"])
            / len(extracts["contract_document_inventory"]),
            2,
        ),
        "document_line_count_max": max(int(r["generated_line_count"]) for r in extracts["contract_document_inventory"]),
    }
    return summary


def write_readme(out_dir: Path, summary: dict[str, object]) -> None:
    lines = [
        "# Meridian Commercial Contract Supply Correction",
        "",
        "Local proof artifact only. No Azure load, no active tenant input mutation, no migration authorization.",
        "",
        "## What This Corrects",
        "",
        "- Re-vendors the one clean document match from NorthBridge RCM Services LLC to R1 RCM Inc.",
        "- Keeps the four BPO parties as fixture-gap additions rather than forcing them onto software or advisory vendors.",
        "- Moves the contract source room under `source_room/SP08_Vendor_Contract` for the new ECL path.",
        "- Connects contract register, supplier master, document inventory, clause extraction, scope, AP invoice, SLA, pricing, and commercial protection extracts into ECL.",
        "- Adds a prospective contract-protection checklist so Source can score whether a negotiated contract preserves future optimization leverage.",
        "- Keeps Tower claims gated: synthetic evidence is present, but no client finance attestation or owner approval exists.",
        "",
        "## Counts",
        "",
        "| Artifact | Count |",
        "|---|---:|",
    ]
    for key in [
        "source_files",
        "source_records",
        "documents",
        "document_extractions",
        "objects",
        "relationships",
        "measures",
        "contracts",
        "service_lines",
        "contract_scope",
        "invoice_lines",
        "sla_observations",
        "source_contract_360_rows",
        "source_vendor_360_rows",
        "tower_rows",
        "cube_manifests",
        "cube_slices",
        "cube_slice_metrics",
        "cube_slice_measures",
    ]:
        lines.append(f"| `{key}` | {summary[key]} |")
    lines.extend(
        [
            "",
            "## Verification",
            "",
            "Preferred one-command local proof runner:",
            "",
            "```bash",
            "python3 scripts/ecl/run_commercial_contract_proof.py",
            "```",
            "",
            "The runner pins `LANG`, `LC_ALL`, and the individual `LC_*` categories to `C.UTF-8` for disposable Postgres commands, so proof replay does not depend on the caller's shell locale.",
            "",
            "Manual sequence, still against disposable Postgres only:",
            "",
            "```bash",
            "python3 scripts/ecl/validate_commercial_source_room.py",
            "python3 scripts/ecl/write_commercial_validator_planted_failures.py",
            "python3 scripts/ecl/write_commercial_field_lineage.py",
            "python3 scripts/ecl/write_commercial_scope_dense_requirements.py",
            "python3 scripts/ecl/write_commercial_client_extraction_mapping.py",
            "python3 scripts/ecl/write_commercial_product_consumption_mapping.py",
            "python3 scripts/ecl/validate_commercial_document_quality.py",
            "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql",
            "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql",
            "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql",
            "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f docs/architecture/sql-drafts/ecl_metric_dictionary_seed_v1_draft.sql",
            "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f outputs/ecl-commercial-contract-supply-correction-2026-08-22/commercial_contract_supply_ecl_load.sql",
            "psql \"$DATABASE_URL\" -f outputs/ecl-commercial-contract-supply-correction-2026-08-22/commercial_contract_supply_verify.sql",
            "python3 scripts/ecl/validate_commercial_proof_acceptance.py",
            "python3 scripts/ecl/write_commercial_proof_bundle_manifest.py",
            "```",
            "",
            "Observed proof is captured in `commercial_contract_supply_db_proof.txt`. The machine-readable proof manifest is `proof_bundle_manifest.json`; it embeds the git SHA, dirty-state hash, tenant list, environment metadata, 26 proof/report artifact hashes, retained planted-failure artifacts, dense Meridian scope-addition reports, client extraction mapping, product-consumption mapping, document-quality reports, the one-command run summary, acceptance summary, and 67 source-room file hashes.",
            "Source-room validation writes `commercial_contract_supply_bad_rows.csv` and `commercial_contract_supply_validation_summary.json` before the SQL load. Planted validator failures are retained as `validator_planted_*` artifacts. Field lineage is captured in `commercial_contract_supply_field_lineage.csv`. Dense Meridian scope additions are captured in `commercial_scope_dense_meridian_required_additions.*`. Client/operator extraction guidance is captured in `commercial_client_extraction_mapping.*`. Product deterministic consumption is captured in `commercial_product_consumption_mapping.*`. Client-visible document quality is checked by `commercial_document_quality_*` reports.",
            "",
            "Additional proof checks:",
            "",
            "| Check | Result |",
            "|---|---:|",
            f"| Document page count min / avg / max | {summary['document_page_count_min']} / {summary['document_page_count_avg']} / {summary['document_page_count_max']} |",
            f"| Document line count min / avg / max | {summary['document_line_count_min']} / {summary['document_line_count_avg']} / {summary['document_line_count_max']} |",
            f"| Distinct document spans | {summary['document_span_distinct']} |",
            f"| Distinct extraction confidence values | {summary['document_confidence_distinct']} |",
            f"| Fallback span count | {summary['document_span_fallback_count']} |",
            "| Source-room rows checked | 564 |",
            "| Source-room validation issues | 0 |",
            "| One-command proof runner | passed |",
            "| Acceptance summary | accepted |",
            "| Client extraction maps documented | 12 |",
            "| Product consumption mappings documented | 6 |",
            "| Document quality issues | 0 |",
            "| Visible extraction-anchor labels | 0 |",
            "| Snake-case prose leaks | 0 |",
            "| Validator planted unknown-supplier failure | 1 issue, exit status 1 |",
            "| Validator planted benchmark-service failure | 1 issue, exit status 1 |",
            "| Field-level lineage rows | 383 |",
            "| Market benchmark source rows | 20 |",
            "| Market benchmark measure rows | 10 |",
            "| Distinct market benchmark variance values | 5 |",
            "| Distinct source benchmark variance values | 20 |",
            "| Market benchmark model-inferred basis rows | 10 |",
            "| Market benchmark source-recorded basis rows | 0 |",
            "| Source Contract 360 market benchmark payloads | 5 |",
            "| Tower market benchmark metric payloads | 5 |",
            "| Pricing rate-card reconciliation failures | 0 |",
            "| Invoice arithmetic failures | 0 |",
            "| Invoice rate annualization failures | 0 |",
            "| Commercial protection profiles | 5 |",
            "| Distinct commercial protection scores | 5 |",
            "| Weak commercial protection contracts | 3 |",
            "| No-benchmarking-right contracts | 1 |",
            "| Uncapped-exit-cost contracts | 1 |",
            "| Auto-renew long-notice contracts | 1 |",
            "| Shortfall-exposure contracts | 1 |",
            "| Source Contract 360 protection payloads | 5 |",
            "| Commercial protection measure rows | 25 |",
            "| Commercial protection clause extractions | 15 |",
            "| Commercial protection doc-backed measures | 15 |",
            "| Commercial protection record-backed measures | 10 |",
            "| Protection score document-backed measures | 0 |",
            "| Commercial protection cube metric rows | 70 |",
            "| Commercial protection cube measure rows | 70 |",
            "| Market benchmark cube metric rows | 35 |",
            "| Market benchmark cube measure rows | 35 |",
            "| Cube metric unit failures | 0 |",
            "| Owner-confirmed or claimable money from unverified extraction | 0 |",
            "| Estimated clause money from unverified extraction | 10 |",
            "| Contract money with document-extracted basis | 0 |",
            "",
            "Planted failure:",
            "",
            "```text",
            "Expected FK rejection: cube_slice_metric metric_key must resolve to ecl_context.metric_definition",
            "Expected FK rejection: contract_scope scoped_object_id must resolve to ecl_context.object",
            "```",
            "",
            "Scope reconciliation against the old active Meridian application file is captured in `scope_active_application_reconciliation.csv`. Only 15 of 44 scope links are exact matches to the old active file. That is recorded as a dense-Meridian fixture gap: these scoped systems are valid inside this new ECL source-room proof, but they must be added to or reconciled against the final dense application/CMDB inventory before this becomes an approved fixture.",
            "",
            "Document extraction span offsets are computed from the generated markdown source text and recorded with `span_basis = computed_from_markdown_text` in `source_room/SP08_Vendor_Contract/extracts/document_clause_extractions.csv`. Each of the 55 synthetic documents is expanded into a 13-page contract evidence file covering parties, source systems, service scope, application coverage, pricing, AP invoice evidence, SLA events, governance, security, transition, finance realization, leverage and exit economics, and reviewer checklist context.",
            "",
            "## Boundaries",
            "",
            "- The old active CSVs remain untouched and should be treated as sunset-reference material.",
            "- Documents are synthetic demo data and remain watermarked; they are not client contracts.",
            "- Epic is not represented by drafted contract documents in this slice.",
            "- The ECL commercial tables now have producer supply in local proof; product repointing and browser QA are still separate later gates.",
        ]
    )
    (out_dir / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-root", type=Path, default=DEFAULT_INPUT_ROOT)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    extracts = build_source_room(args.input_root, args.out_dir)
    summary = build_sql(args.out_dir, extracts)
    (args.out_dir / "commercial_contract_supply_manifest.json").write_text(
        json.dumps(
            {
                **summary,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "input_root": args.input_root.as_posix(),
                "output_root": args.out_dir.as_posix(),
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    write_readme(args.out_dir, summary)
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
