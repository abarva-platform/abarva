#!/usr/bin/env python3
"""Render a static Source 360 contract preview from local ECL proof outputs."""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("outputs/ecl-commercial-contract-supply-correction-2026-08-22")
PREVIEW_DIR_NAME = "source_360_static_preview"
SNAKE_CASE_RE = re.compile(r"\b[a-z]+_[a-z0-9_]+\b")
LABEL_OVERRIDES = {
    "source_sla_kpi_events_missing": "SLA/KPI event extract missing",
    "partial_intake_accepted_with_gap_register": "Partial intake accepted with gap register",
    "market_benchmark_extract_missing": "Market benchmark evidence missing",
    "revendored_to_existing_r1_fixture_vendor": "Supplier identity aligned to R1 fixture vendor",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def money(value: str | int | float | None) -> str:
    if value in (None, ""):
        return "Not available"
    return f"${float(value):,.0f}"


def pct(value: str | int | float | None) -> str:
    if value in (None, ""):
        return "0%"
    return f"{float(value):.1f}%"


def label(value: str) -> str:
    if value in LABEL_OVERRIDES:
        return LABEL_OVERRIDES[value]
    return value.replace("_", " ").strip().capitalize()


def missing_aware(value: Any, missing_label: str = "Missing extract") -> str:
    if value in (None, "", "None"):
        return missing_label
    return str(value)


def first_value(row: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = row.get(key)
        if value not in (None, ""):
            return str(value)
    return ""


def load_projection(out_dir: Path, contract_id: str) -> dict[str, Any]:
    rows = read_csv(out_dir / "source_contract_360_projection.csv")
    for row in rows:
        if row.get("row_key") == contract_id or row.get("contract_id") == contract_id:
            parsed = dict(row)
            for field in [
                "service_lines_json",
                "scope_json",
                "spend_summary_json",
                "sla_summary_json",
                "document_proof_json",
                "gap_flags_json",
                "source_refs_json",
            ]:
                parsed[field] = json.loads(row[field] or "[]")
            return parsed
    raise AssertionError(f"contract_id not found in projection: {contract_id}")


def compute_denominators(out_dir: Path, contract_id: str) -> dict[str, Any]:
    manifest = json.loads((out_dir / "commercial_contract_supply_manifest.json").read_text())
    acceptance = json.loads((out_dir / "commercial_proof_acceptance_summary.json").read_text())
    document_quality = json.loads((out_dir / "commercial_document_quality_summary.json").read_text())
    product_mapping = json.loads((out_dir / "commercial_product_consumption_mapping_summary.json").read_text())
    validation = json.loads((out_dir / "commercial_contract_supply_validation_summary.json").read_text())
    reconciliation = read_csv(out_dir / "scope_active_application_reconciliation.csv")
    required_additions = read_csv(out_dir / "commercial_scope_dense_meridian_required_additions.csv")
    projection_rows = read_csv(out_dir / "source_contract_360_projection.csv")
    vendor_rows = read_csv(out_dir / "source_vendor_360_projection.csv")

    resolved = sum(1 for row in reconciliation if row["active_application_exact_match"] == "yes")
    unresolved = len(reconciliation) - resolved
    contract_reconciliation = [row for row in reconciliation if row["contract_id"] == contract_id]
    contract_resolved = sum(1 for row in contract_reconciliation if row["active_application_exact_match"] == "yes")

    return {
        "commercial_proof_accepted": acceptance["accepted"],
        "source_room_rows_checked": validation["rows_checked"],
        "source_room_issue_count": validation["issue_count"],
        "contracts_projected": len(projection_rows),
        "vendors_projected": len(vendor_rows),
        "documents_passing_quality": document_quality["documents_checked"] - document_quality["issue_count"],
        "documents_total": document_quality["documents_checked"],
        "scope_links_resolved": resolved,
        "scope_links_total": len(reconciliation),
        "scope_links_unresolved": unresolved,
        "dense_required_additions": len(required_additions),
        "selected_contract_scope_links": len(contract_reconciliation),
        "selected_contract_scope_resolved": contract_resolved,
        "field_lineage_rows": acceptance["checks"]["field_lineage_rows"],
        "product_mappings": product_mapping["mappings"],
        "browser_proof": product_mapping["browser_proof"],
        "document_extractions": manifest["document_extractions"],
        "document_span_distinct": manifest["document_span_distinct"],
        "document_confidence_distinct": manifest["document_confidence_distinct"],
    }


def render_html(contract: dict[str, Any], denominators: dict[str, Any]) -> str:
    services = contract["service_lines_json"]
    scope = contract["scope_json"]
    spend = contract["spend_summary_json"]
    sla = contract["sla_summary_json"]
    docs = contract["document_proof_json"]
    gaps = contract["gap_flags_json"]
    benchmark = spend.get("market_benchmark", {})
    protection_score = spend.get("commercial_protection_score")
    benchmark_variance = benchmark.get("variance_percent", benchmark.get("market_benchmark_variance_percent", "n/a"))

    service_rows = "\n".join(
        f"<tr><td>{html.escape(first_value(row, 'service_category', 'service_line_key'))}</td><td>{money(row.get('annualized_value_usd'))}</td><td>{html.escape(first_value(row, 'description', 'service_line_key'))}</td></tr>"
        for row in services
    )
    scope_rows = "\n".join(
        f"<tr><td>{html.escape(first_value(row, 'application_name', 'name'))}</td><td>{html.escape(first_value(row, 'business_domain', 'domain'))}</td><td>{pct(row.get('allocation_percent'))}</td></tr>"
        for row in scope
    )
    doc_rows = "\n".join(
        f"<tr><td>{html.escape(first_value(row, 'document_key', 'document_id'))}</td><td>{row.get('page_count', 'n/a')}</td><td>{html.escape(label(first_value(row, 'review_state', 'role')))}</td></tr>"
        for row in docs[:12]
    )
    gap_items = "\n".join(f"<li>{html.escape(label(str(gap)))}</li>" for gap in gaps)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Source 360 Static Preview - {html.escape(contract['contract_id'])}</title>
  <style>
    :root {{
      --ink: #172033;
      --muted: #667085;
      --line: #d8dde8;
      --blue: #1463d8;
      --amber: #a86100;
      --green: #18794e;
      --paper: #fbfaf7;
      --panel: #ffffff;
    }}
    body {{
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, Arial, sans-serif;
    }}
    main {{
      max-width: 1280px;
      margin: 0 auto;
      padding: 36px 40px 56px;
    }}
    .eyebrow {{
      color: var(--blue);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
    }}
    h1 {{
      max-width: 900px;
      margin: 10px 0 10px;
      font-size: 44px;
      line-height: 1.05;
      letter-spacing: 0;
    }}
    .subtitle {{
      color: var(--muted);
      font-size: 18px;
      line-height: 1.45;
      max-width: 980px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border: 1px solid var(--line);
      margin: 28px 0;
      background: var(--panel);
    }}
    .metric {{
      padding: 18px 20px;
      border-right: 1px solid var(--line);
    }}
    .metric:last-child {{ border-right: 0; }}
    .metric strong {{
      display: block;
      font-size: 28px;
      font-family: Georgia, serif;
      font-weight: 700;
    }}
    .metric span {{ color: var(--muted); font-size: 13px; }}
    section {{
      margin-top: 34px;
      border-top: 1px solid var(--line);
      padding-top: 22px;
    }}
    h2 {{
      margin: 0 0 14px;
      font-size: 18px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }}
    .two {{
      display: grid;
      grid-template-columns: 1.2fr .8fr;
      gap: 28px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
      font-size: 14px;
    }}
    th, td {{
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }}
    th {{
      color: var(--muted);
      font-size: 12px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }}
    .callout {{
      background: #fff7ed;
      border: 1px solid #efc27e;
      padding: 16px 18px;
      color: #593a00;
    }}
    .callout strong {{ color: var(--amber); }}
    .proof {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }}
    .proof div {{
      background: var(--panel);
      border: 1px solid var(--line);
      padding: 14px;
    }}
    .proof strong {{ display: block; font-size: 20px; }}
    ul {{ margin: 0; padding-left: 20px; }}
  </style>
</head>
<body>
<main>
  <div class="eyebrow">Source 360 / Local ECL Preview / Not Live Routed</div>
  <h1>{html.escape(contract['contract_name'])}</h1>
  <p class="subtitle">
    {html.escape(contract['vendor_name'])} contract view generated from local ECL proof outputs.
    This page is a static render check, not a deployed product route or signed-in browser proof.
  </p>

  <div class="grid">
    <div class="metric"><strong>{money(contract['annualized_value_usd'])}</strong><span>annualized value</span></div>
    <div class="metric"><strong>{len(scope)}</strong><span>scoped applications/platforms</span></div>
    <div class="metric"><strong>{protection_score if protection_score is not None else 'n/a'}</strong><span>commercial protection score</span></div>
    <div class="metric"><strong>{benchmark_variance}%</strong><span>directional benchmark variance</span></div>
  </div>

  <section class="two">
    <div>
      <h2>Service Lines</h2>
      <table><thead><tr><th>Service</th><th>Annual value</th><th>Scope</th></tr></thead><tbody>{service_rows}</tbody></table>
    </div>
    <div class="callout">
      <strong>Gate state</strong>
      <p>Money is visible for Source diagnosis, but remains non-claimable until client finance and owner review pass.</p>
      <ul>{gap_items}</ul>
    </div>
  </section>

  <section>
    <h2>Application Scope</h2>
    <table><thead><tr><th>Application or platform</th><th>Business domain</th><th>Allocation</th></tr></thead><tbody>{scope_rows}</tbody></table>
  </section>

  <section class="two">
    <div>
      <h2>Spend And SLA</h2>
      <table>
        <tbody>
          <tr><th>AP actual total</th><td>{money(spend.get('ap_actual_total_usd'))}</td></tr>
          <tr><th>Invoice variance</th><td>{money(spend.get('invoice_variance_usd'))}</td></tr>
          <tr><th>SLA observations</th><td>{html.escape(missing_aware(sla.get('observation_count')))}</td></tr>
          <tr><th>Credits earned</th><td>{money(sla.get('service_credits_earned_usd'))}</td></tr>
          <tr><th>Credits claimed</th><td>{money(sla.get('service_credits_claimed_usd'))}</td></tr>
        </tbody>
      </table>
    </div>
    <div>
      <h2>Document Proof</h2>
      <table><thead><tr><th>Document</th><th>Pages</th><th>Review</th></tr></thead><tbody>{doc_rows}</tbody></table>
    </div>
  </section>

  <section>
    <h2>Measured Completion</h2>
    <div class="proof">
      <div><strong>{denominators['contracts_projected']} / 5</strong>contracts projected</div>
      <div><strong>{denominators['vendors_projected']} / 5</strong>vendors projected</div>
      <div><strong>{denominators['documents_passing_quality']} / {denominators['documents_total']}</strong>documents pass quality</div>
      <div><strong>{denominators['scope_links_resolved']} / {denominators['scope_links_total']}</strong>scope links resolved to reference apps</div>
      <div><strong>{denominators['dense_required_additions']}</strong>dense Meridian additions required</div>
      <div><strong>{label(str(denominators['browser_proof']))}</strong>browser proof state</div>
    </div>
  </section>
</main>
</body>
</html>
"""


def validate_preview(html_text: str, denominators: dict[str, Any], contract: dict[str, Any]) -> dict[str, Any]:
    visible_text = re.sub(r"<[^>]+>", " ", html_text)
    snake_hits = sorted(set(SNAKE_CASE_RE.findall(visible_text)))
    checks = {
        "contract_name_visible": contract["contract_name"] in visible_text,
        "vendor_name_visible": contract["vendor_name"] in visible_text,
        "annualized_value_visible": money(contract["annualized_value_usd"]) in visible_text,
        "scope_table_nonempty": len(contract["scope_json"]) > 0,
        "service_lines_nonempty": len(contract["service_lines_json"]) > 0,
        "document_proof_nonempty": len(contract["document_proof_json"]) > 0,
        "gate_language_visible": "non-claimable" in visible_text,
        "snake_case_visible_count": len(snake_hits),
        "scope_resolution_percent": round(denominators["scope_links_resolved"] / denominators["scope_links_total"] * 100, 2),
    }
    accepted = all(
        value is True
        for key, value in checks.items()
        if key not in {"snake_case_visible_count", "scope_resolution_percent"}
    ) and checks["snake_case_visible_count"] == 0
    return {
        "accepted": accepted,
        "checks": checks,
        "visible_snake_case_hits": snake_hits,
        "denominators": denominators,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--contract-id", default="MER-CTR-RCM-001")
    args = parser.parse_args()

    preview_dir = args.out_dir / PREVIEW_DIR_NAME
    preview_dir.mkdir(parents=True, exist_ok=True)
    contract = load_projection(args.out_dir, args.contract_id)
    denominators = compute_denominators(args.out_dir, args.contract_id)
    html_text = render_html(contract, denominators)
    summary = validate_preview(html_text, denominators, contract)

    html_path = preview_dir / f"{args.contract_id.lower()}-source-360-preview.html"
    summary_path = preview_dir / f"{args.contract_id.lower()}-source-360-preview-qa.json"
    html_path.write_text(html_text, encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"html": str(html_path), "qa": str(summary_path), **summary}, indent=2, sort_keys=True))
    return 0 if summary["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
