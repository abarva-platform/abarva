#!/usr/bin/env python3

"""Write a client-facing extraction mapping guide for the commercial ECL slice."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
EXTRACT_DIR = DEFAULT_OUT_DIR / "source_room/SP08_Vendor_Contract/extracts"


EXTRACT_GUIDE: dict[str, dict[str, str]] = {
    "supplier_master.csv": {
        "source_owner": "Vendor management or procurement operations",
        "system_to_pull_from": "Supplier master, Coupa, Ariba, ERP vendor master",
        "one_row_represents": "One supplier/payee entity used on contracts, POs, or invoices",
        "why_needed": "Prevents contract and AP rows from using stale or invented supplier identities.",
        "product_consumers": "Source 360 vendor profile; Tower vendor concentration; Intelligence context",
        "required_join_keys": "supplier_id, vendor_parent_id, payee_supplier_id",
        "do_not_collect": "Do not collect bank account numbers, tax IDs, or restricted payment details.",
        "acceptable_blanks": "Tax and banking state may be blank or redacted if the supplier ID is present.",
        "quality_gate": "Every contract and invoice supplier_id must resolve to this extract.",
        "example_export": "ERP vendor master export filtered to active BPO, managed service, software, and advisory suppliers.",
    },
    "contract_register.csv": {
        "source_owner": "Vendor management, procurement, or CLM administrator",
        "system_to_pull_from": "CLM, contract register, Coupa contracts, Ariba contracts, SharePoint register",
        "one_row_represents": "One commercial contract or master service agreement",
        "why_needed": "Creates the governed contract object, value anchor, dates, notice window, owners, and renewal posture.",
        "product_consumers": "Source Contract 360; Tower contract/value gates; Home technology/vendor context; cubes",
        "required_join_keys": "contract_id, supplier_id, contract_family_id, commercial_instrument_id",
        "do_not_collect": "Do not paste full contract text into the register; documents belong in the document inventory.",
        "acceptable_blanks": "Owner roles can remain blank when unknown, but dates, supplier, and value require review gates.",
        "quality_gate": "Contract IDs must be unique; supplier IDs must resolve; money cannot be zero unless reason is explicit.",
        "example_export": "CLM contract list with contract number, supplier, effective date, expiration date, notice date, value, owners.",
    },
    "contract_document_inventory.csv": {
        "source_owner": "CLM administrator or contract document librarian",
        "system_to_pull_from": "CLM workspace, SharePoint library, legal document room",
        "one_row_represents": "One contract document, amendment, SOW, pricing exhibit, SLA schedule, or notice",
        "why_needed": "Provides the document spine, precedence, hashes, parent-child relationships, and review state.",
        "product_consumers": "Source evidence drill-through; Tower evidence gate; Intelligence citations",
        "required_join_keys": "document_id, contract_id, parent_document_id, source_file_path, sha256",
        "do_not_collect": "Do not collect privileged legal notes or unrelated negotiation drafts.",
        "acceptable_blanks": "Supersedes and conflict group can be blank when no amendment conflict exists.",
        "quality_gate": "Every document row must have a stable ID, path, role, precedence, hash, and contract ID.",
        "example_export": "CLM document manifest with one row per executed file plus amendments and schedules.",
    },
    "document_clause_extractions.csv": {
        "source_owner": "AbarVa extractor plus sourcing/legal reviewer",
        "system_to_pull_from": "Generated from the supplied contract documents",
        "one_row_represents": "One extracted clause or commercial fact with page/span evidence",
        "why_needed": "Turns documents into citeable evidence without letting unverified clauses become claimable dollars.",
        "product_consumers": "Source evidence panel; Tower gate reasons; Intelligence cited context",
        "required_join_keys": "source_record_id, document_id, contract_id, concept_ref",
        "do_not_collect": "Do not hand-type plausible clauses; extract from supplied documents or mark missing.",
        "acceptable_blanks": "Conflict group may be blank; span must not be blank after extraction.",
        "quality_gate": "Spans must be computed from document text; no fallback or constant span stamps.",
        "example_export": "Extractor output with concept, page, character span, extracted text, method, confidence, review state.",
    },
    "source_contract_scope_services.csv": {
        "source_owner": "Service owner, sourcing lead, or managed-services tower lead",
        "system_to_pull_from": "SOW, service catalog, transition plan, retained-organization RACI",
        "one_row_represents": "One service tower/process covered by a contract",
        "why_needed": "Separates service scope from contract header value and prevents broad contract blobs.",
        "product_consumers": "Source Contract 360 service scope; Tower action queues; Home operating model context",
        "required_join_keys": "contract_id, service_tower_id",
        "do_not_collect": "Do not list every task or SOP; capture the service tower and ownership grain.",
        "acceptable_blanks": "Location can be blank if not applicable; retained and supplier responsibility should not be blank.",
        "quality_gate": "Every AP, SLA, pricing, and benchmark row should resolve to a declared service tower.",
        "example_export": "SOW service schedule reduced to tower/process/location/responsibility rows.",
    },
    "contract_scope_application_links.csv": {
        "source_owner": "Application owner, CMDB team, or contract service owner",
        "system_to_pull_from": "SOW scope appendix, CMDB, service catalog, application portfolio",
        "one_row_represents": "One contract-to-application or contract-to-platform scope link",
        "why_needed": "Makes Source answer which applications, functions, and platforms a contract actually covers.",
        "product_consumers": "Source Contract 360; Home architecture lineage; Tower vendor/application exposure; cubes",
        "required_join_keys": "contract_id, application_name, scope_type",
        "do_not_collect": "Do not infer scope from vendor name; use named systems or mark unresolved.",
        "acceptable_blanks": "Allocation percent may be blank at intake; unresolved names remain fixture gaps.",
        "quality_gate": "Every scoped object must either match canonical inventory or appear in the dense-build required-additions report.",
        "example_export": "SOW application appendix joined to CMDB display names and business domains.",
    },
    "source_contract_pricing_rate_cards.csv": {
        "source_owner": "Sourcing, procurement, or commercial finance",
        "system_to_pull_from": "Pricing exhibit, rate card, SOW commercial schedule, CLM pricing table",
        "one_row_represents": "One rate-card line or commitment line",
        "why_needed": "Supports rate, uplift, consumption, and variance analysis without reducing pricing to one annual number.",
        "product_consumers": "Source optimization workflow; Tower savings gates; commercial cubes",
        "required_join_keys": "contract_id, document_id, pricing_line_id, service_tower_id",
        "do_not_collect": "Do not collect employee-level rates or named individual compensation.",
        "acceptable_blanks": "Effective-to date can be blank for current lines; unit price requires review if blank.",
        "quality_gate": "Rate-card annual value must reconcile to the contract register or produce an explicit variance finding.",
        "example_export": "Pricing exhibit table with unit, quantity, unit price, annual value, effective dates, uplift cap.",
    },
    "source_ap_po_invoice_lines.csv": {
        "source_owner": "AP operations or IT finance",
        "system_to_pull_from": "ERP AP, Workday Finance, Oracle AP, SAP, Coupa invoice export",
        "one_row_represents": "One invoice line tied to a contract and service period",
        "why_needed": "Proves spend actuals, payment state, variance against contract rate, and recovery candidates.",
        "product_consumers": "Source optimization workflow; Tower finance gate; spend/value cubes",
        "required_join_keys": "invoice_line_id, contract_id, supplier_id, po_number, service_tower_id",
        "do_not_collect": "Do not collect patient, employee, or bank-payment details.",
        "acceptable_blanks": "Credit linkage can be blank before review; amount and service period cannot be blank.",
        "quality_gate": "Invoice amount must reconcile to rate basis; supplier and contract IDs must resolve.",
        "example_export": "AP invoice-line export for the last 6 to 12 months with PO, invoice, period, amount, supplier, contract.",
    },
    "source_sla_kpi_events.csv": {
        "source_owner": "Service management, vendor management, or operations lead",
        "system_to_pull_from": "ServiceNow, vendor KPI pack, SLA dashboard, monthly service review file",
        "one_row_represents": "One SLA/KPI observation for a period, tower, and contract",
        "why_needed": "Separates performance evidence and earned credits from contract text and invoice rows.",
        "product_consumers": "Source recovery workflow; Tower risk/value gates; service-performance cubes",
        "required_join_keys": "contract_id, service_tower_id, event_date, sla_name",
        "do_not_collect": "Do not collect ticket narratives containing PHI or employee personal data.",
        "acceptable_blanks": "Claimed credit can be zero; earned credit and breach state require evidence.",
        "quality_gate": "Targets, actuals, breach state, fee base, earned credit, and claimed credit must reconcile.",
        "example_export": "Monthly KPI export with SLA name, target, actual, breach, fee base, credit calculation.",
    },
    "source_finance_realization.csv": {
        "source_owner": "FP&A, IT finance, or value-realization owner",
        "system_to_pull_from": "Finance value tracker, FP&A model, budget system, realized savings ledger",
        "one_row_represents": "One contract, period, and value-realization checkpoint",
        "why_needed": "Prevents Tower from claiming value before finance confirms the outcome.",
        "product_consumers": "Tower value gate; Source optimization economics; finance cubes",
        "required_join_keys": "contract_id, finance_period",
        "do_not_collect": "Do not invent benefits or use business-case value as realized value.",
        "acceptable_blanks": "Approved value may be blank pre-review; finance-confirmed value must be zero unless attested.",
        "quality_gate": "Claimable value requires finance confirmation and owner approval; synthetic rows remain gated.",
        "example_export": "Quarterly value tracker with baseline, vendor cost, transition cost, retained cost, run-rate delta, confirmed value.",
    },
    "source_market_benchmark_rates.csv": {
        "source_owner": "Sourcing analyst or external benchmark provider",
        "system_to_pull_from": "Third-party benchmark, sourcing benchmark study, portfolio comparator extract",
        "one_row_represents": "One benchmark comparator for a contract service tower",
        "why_needed": "Supports rate-position questions while keeping synthetic or directional benchmarks out of recorded-fact basis.",
        "product_consumers": "Source optimization workflow; Tower commercial-risk context; benchmark cubes",
        "required_join_keys": "contract_id, service_tower_id, benchmark_dataset_id",
        "do_not_collect": "Do not present directional or synthetic benchmarks as client-recorded market truth.",
        "acceptable_blanks": "External benchmark fields may be blank until a benchmark request is completed.",
        "quality_gate": "Benchmark confidence and generation basis are mandatory; ECL basis must be model_inferred when synthetic.",
        "example_export": "Benchmark table with p25, median, p75, rate basis, region, dataset ID, confidence, and generation basis.",
    },
    "contract_commercial_protection_assessment.csv": {
        "source_owner": "AbarVa commercial analyst with sourcing, finance, and legal review",
        "system_to_pull_from": "Derived from contract register, clauses, AP, pricing, SLA, and benchmark extracts",
        "one_row_represents": "One contract-level commercial protection assessment",
        "why_needed": "Scores whether the contract preserves future optimization leverage: benchmark right, exit cost, notice, shortfall, assignment, and location mix.",
        "product_consumers": "Source opportunity scoring; Tower action queue; commercial-protection cubes",
        "required_join_keys": "contract_id",
        "do_not_collect": "Do not ask the client to invent a score; compute it and have reviewers challenge the inputs.",
        "acceptable_blanks": "Score can remain blank until component facts are available.",
        "quality_gate": "Score is computed; clause-derived facts cite document spans, while benchmark variance stays estimated unless externally sourced.",
        "example_export": "Derived assessment output with component states, modeled exposures, guidance, legal boundary, and review state.",
    },
}


def read_header_and_count(path: Path) -> tuple[list[str], int]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        header = next(reader)
        count = sum(1 for _ in reader)
    return header, count


def write_csv(rows: list[dict[str, str]], path: Path) -> None:
    fields = [
        "extract_file",
        "current_rows",
        "current_columns",
        "source_owner",
        "system_to_pull_from",
        "one_row_represents",
        "required_join_keys",
        "why_needed",
        "product_consumers",
        "do_not_collect",
        "acceptable_blanks",
        "quality_gate",
        "example_export",
        "fields",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def write_markdown(rows: list[dict[str, str]], path: Path) -> None:
    lines = [
        "# Commercial Source-Room Client Extraction Mapping",
        "",
        "Local proof artifact only. This guide explains what a client or operator would extract for the commercial contract slice before ECL loading. It is not an Azure load, migration, or product proof.",
        "",
        "## Collection Rule",
        "",
        "Collect at the grain the source owner can actually export. Do not ask a client to fill ECL tables by hand. Source owners provide native extracts; adapters map them forward.",
        "",
        "## Extract Map",
        "",
        "| Extract | Rows | Owner | Source system | Grain | Product consumers | Quality gate |",
        "|---|---:|---|---|---|---|---|",
    ]
    for row in rows:
        lines.append(
            "| {extract_file} | {current_rows} | {source_owner} | {system_to_pull_from} | {one_row_represents} | {product_consumers} | {quality_gate} |".format(
                **{key: row[key].replace("|", "/") for key in row}
            )
        )
    lines.extend(["", "## Per-Extract Guidance", ""])
    for row in rows:
        lines.extend(
            [
                f"### {row['extract_file']}",
                "",
                f"- **One row represents:** {row['one_row_represents']}",
                f"- **Owner:** {row['source_owner']}",
                f"- **Pull from:** {row['system_to_pull_from']}",
                f"- **Join keys:** {row['required_join_keys']}",
                f"- **Why needed:** {row['why_needed']}",
                f"- **Product consumers:** {row['product_consumers']}",
                f"- **Do not collect:** {row['do_not_collect']}",
                f"- **Acceptable blanks:** {row['acceptable_blanks']}",
                f"- **Quality gate:** {row['quality_gate']}",
                f"- **Example export:** {row['example_export']}",
                f"- **Fields in current proof:** {row['fields']}",
                "",
            ]
        )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    out_dir = args.out_dir.resolve()
    extract_dir = out_dir / "source_room/SP08_Vendor_Contract/extracts"

    rows: list[dict[str, str]] = []
    for extract_file, guide in EXTRACT_GUIDE.items():
        path = extract_dir / extract_file
        if not path.exists():
            raise SystemExit(f"Missing expected extract: {path}")
        header, count = read_header_and_count(path)
        rows.append(
            {
                "extract_file": extract_file,
                "current_rows": str(count),
                "current_columns": str(len(header)),
                "fields": ", ".join(header),
                **guide,
            }
        )

    csv_path = out_dir / "commercial_client_extraction_mapping.csv"
    md_path = out_dir / "commercial_client_extraction_mapping.md"
    summary_path = out_dir / "commercial_client_extraction_mapping_summary.json"
    write_csv(rows, csv_path)
    write_markdown(rows, md_path)
    summary_path.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "extracts_documented": len(rows),
                "total_current_rows": sum(int(row["current_rows"]) for row in rows),
                "csv": csv_path.as_posix(),
                "markdown": md_path.as_posix(),
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"csv": csv_path.as_posix(), "markdown": md_path.as_posix(), "extracts_documented": len(rows)}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
