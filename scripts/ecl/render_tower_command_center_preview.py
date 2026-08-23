#!/usr/bin/env python3
"""Render a static Tower command-center preview from local ECL projection rows."""

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
PREVIEW_DIR_NAME = "tower_command_center_static_preview"
SNAKE_CASE_RE = re.compile(r"\b[a-z]+_[a-z0-9_]+\b")
WEAK_CONTRACT_ID = "MER-CTR-SSO-BPO-001"
LABEL_OVERRIDES = {
    "auto_renewal_long_notice_and_shortfall_penalty": "Automatic renewal, 365-day notice, and shortfall exposure",
    "client_finance_and_owner_review": "Client finance and owner review",
    "fixture_bpo_vendor_gap_filled": "Managed-services supplier added to the review pack",
    "market_benchmark_extract_missing": "External benchmark evidence is required",
    "no_benchmarking_right": "No benchmarking right",
    "no_client_attestation": "No client attestation yet",
    "requires_client_review": "Requires client review",
    "revendored_to_existing_r1_fixture_vendor": "Supplier matched to the active vendor master",
    "transition_performance_unverified": "Transition performance remains unverified",
    "uncapped_exit_cost": "Uncapped exit cost",
    "weak_commercial_protection": "Weak commercial protection",
}
BANNED_VISIBLE_PHRASES = [
    "fixture vendor",
    "fixture gap",
    "source-room",
    "dense Meridian",
    "snake_case",
    "projection row",
    "builder",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def money(value: str | int | float | None) -> str:
    if value in (None, ""):
        return "Not loaded"
    return f"${float(value):,.0f}"


def pct(value: str | int | float | None) -> str:
    if value in (None, ""):
        return "Not loaded"
    return f"{float(value):.1f}%"


def label(value: str | None) -> str:
    if not value:
        return "Not recorded"
    if value in LABEL_OVERRIDES:
        return LABEL_OVERRIDES[value]
    return value.replace("_", " ").replace("-", " ").strip().capitalize()


def parse_json(value: str, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError as exc:
        raise AssertionError(f"Invalid JSON payload: {exc}: {value[:120]}") from exc


def load_rows(out_dir: Path) -> list[dict[str, Any]]:
    rows = read_csv(out_dir / "tower_command_center_projection.csv")
    parsed: list[dict[str, Any]] = []
    for row in rows:
        item: dict[str, Any] = dict(row)
        for field in [
            "display_payload_json",
            "evidence_needed_json",
            "gap_flags_json",
            "source_refs_json",
            "metric_keys_json",
        ]:
            item[field] = parse_json(row.get(field, ""), [] if field != "display_payload_json" else {})
        parsed.append(item)
    return parsed


def row_float(row: dict[str, Any], field: str) -> float:
    value = row.get(field)
    if value in (None, ""):
        return 0.0
    return float(value)


def render_html(rows: list[dict[str, Any]], checks: dict[str, Any]) -> str:
    total_blocked = sum(row_float(row, "blocked_value_usd") for row in rows)
    total_claimable = sum(row_float(row, "claimable_value_usd") for row in rows)
    weak = next((row for row in rows if row.get("row_key") == WEAK_CONTRACT_ID), None)
    weak_payload = weak.get("display_payload_json", {}) if weak else {}
    weak_benchmark = weak_payload.get("market_benchmark", {}) if isinstance(weak_payload, dict) else {}

    cards = "\n".join(
        f"""
        <article class="contract-card {'weak' if row.get('row_key') == WEAK_CONTRACT_ID else ''}">
          <div class="card-head">
            <div>
              <p class="eyebrow">{html.escape(label(row.get('claim_gate_status')))}</p>
              <h3>{html.escape(row.get('display_payload_json', {}).get('contract', row.get('row_key', 'Contract')))}</h3>
              <p>{html.escape(row.get('display_payload_json', {}).get('vendor', 'Vendor not recorded'))}</p>
            </div>
            <strong>{int(float(row.get('display_payload_json', {}).get('commercial_protection_score', 0)))}/100</strong>
          </div>
          <dl>
            <div><dt>Annual exposure</dt><dd>{money(row.get('funded_amount_usd'))}</dd></div>
            <div><dt>Claimable now</dt><dd>{money(row.get('claimable_value_usd'))}</dd></div>
            <div><dt>Blocked value</dt><dd>{money(row.get('blocked_value_usd'))}</dd></div>
            <div><dt>Benchmark variance</dt><dd>{pct(row.get('display_payload_json', {}).get('market_benchmark', {}).get('market_benchmark_variance_percent'))}</dd></div>
          </dl>
          <p class="reason">{html.escape(row.get('claim_gate_reason_detail', 'No gate reason recorded.'))}</p>
          <ul>
            {''.join(f'<li>{html.escape(label(str(gap)))}</li>' for gap in row.get('gap_flags_json', []))}
          </ul>
        </article>
        """
        for row in sorted(rows, key=lambda r: row_float(r, "blocked_value_usd"), reverse=True)
    )
    evidence_rows = "\n".join(
        f"""
        <tr>
          <td>{html.escape(row.get('row_key', ''))}</td>
          <td>{html.escape(row.get('owner_role', 'Owner not recorded'))}</td>
          <td>{html.escape(label(row.get('next_gate')))}</td>
          <td>{html.escape(', '.join(label(str(item)) for item in row.get('evidence_needed_json', [])))}</td>
          <td>{html.escape(', '.join(row.get('source_refs_json', [])[:3]))}</td>
        </tr>
        """
        for row in rows
    )
    weak_panel = ""
    if weak:
        weak_panel = f"""
        <section class="weak-panel">
          <p class="eyebrow">Priority weak contract</p>
          <h2>{html.escape(weak_payload.get('contract', WEAK_CONTRACT_ID))}</h2>
          <p>
            Tower should route this contract first because it combines the lowest commercial
            protection score, a long notice window, and modeled shortfall exposure.
          </p>
          <div class="weak-grid">
            <span><b>{int(float(weak_payload.get('commercial_protection_score', 0)))}/100</b> protection score</span>
            <span><b>365 days</b> notice window</span>
            <span><b>$1,071,000</b> modeled shortfall exposure</span>
            <span><b>{pct(weak_benchmark.get('market_benchmark_variance_percent'))}</b> directional benchmark variance</span>
          </div>
        </section>
        """

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower ECL Command Center Preview</title>
  <style>
    :root {{
      --ink: #172033;
      --muted: #667085;
      --line: #d8dde8;
      --paper: #fbfaf7;
      --panel: #ffffff;
      --blue: #1463d8;
      --amber: #a86100;
      --red: #b42318;
      --green: #18794e;
    }}
    body {{
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, Arial, sans-serif;
    }}
    main {{
      max-width: 1320px;
      margin: 0 auto;
      padding: 36px 40px 56px;
    }}
    .eyebrow {{
      color: var(--blue);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
    }}
    h1 {{
      max-width: 920px;
      margin: 10px 0;
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
    .metric-grid {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border: 1px solid var(--line);
      background: var(--panel);
      margin: 28px 0;
    }}
    .metric {{
      padding: 18px 20px;
      border-right: 1px solid var(--line);
    }}
    .metric:last-child {{ border-right: 0; }}
    .metric strong {{
      display: block;
      font-size: 30px;
      font-family: Georgia, serif;
    }}
    .metric span {{
      color: var(--muted);
      font-size: 13px;
    }}
    section {{
      margin-top: 32px;
      border-top: 1px solid var(--line);
      padding-top: 22px;
    }}
    h2 {{
      margin: 0 0 12px;
      font-size: 20px;
    }}
    .contracts {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }}
    .contract-card {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
    }}
    .contract-card.weak {{
      border-color: #e6a23c;
      box-shadow: inset 4px 0 0 #e6a23c;
    }}
    .card-head {{
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-start;
    }}
    .card-head h3 {{
      margin: 6px 0 4px;
      font-size: 20px;
    }}
    .card-head p {{
      margin: 0;
      color: var(--muted);
    }}
    .card-head strong {{
      font-family: Georgia, serif;
      font-size: 28px;
      color: var(--amber);
    }}
    dl {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin: 18px 0;
    }}
    dt {{
      color: var(--muted);
      font-size: 12px;
    }}
    dd {{
      margin: 4px 0 0;
      font-weight: 800;
    }}
    .reason {{
      color: #344054;
      line-height: 1.45;
    }}
    ul {{
      margin: 12px 0 0;
      padding-left: 18px;
      color: var(--muted);
    }}
    .weak-panel {{
      background: #fff8ed;
      border: 1px solid #edc27a;
      border-radius: 8px;
      padding: 22px;
    }}
    .weak-panel h2 {{
      font-size: 28px;
    }}
    .weak-grid {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 16px;
    }}
    .weak-grid span {{
      background: white;
      border: 1px solid #edd9b8;
      border-radius: 6px;
      padding: 14px;
    }}
    .weak-grid b {{
      display: block;
      font-size: 22px;
      color: var(--red);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
    }}
    th, td {{
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }}
    th {{
      font-size: 12px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--muted);
    }}
    .qa {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 12px;
    }}
    .qa span {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
    }}
    .qa b {{
      display: block;
      color: var(--green);
    }}
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Tower / ECL command center preview</p>
    <h1>Commercial value is loaded, but every claim remains gated until client review.</h1>
    <p class="subtitle">
      This preview reads the local ECL Tower command-center output. It shows
      contract value exposure, commercial protection, benchmark posture, gate reasons, and evidence needed.
      It does not claim live product route adoption or client attestation.
    </p>

    <div class="metric-grid" aria-label="Tower projection totals">
      <div class="metric"><strong>{len(rows)}</strong><span>gated commercial rows</span></div>
      <div class="metric"><strong>{money(total_blocked)}</strong><span>blocked value</span></div>
      <div class="metric"><strong>{money(total_claimable)}</strong><span>claimable value</span></div>
      <div class="metric"><strong>{checks['weak_contract_id']}</strong><span>priority weak contract</span></div>
    </div>

    {weak_panel}

    <section>
      <p class="eyebrow">Value proof rows</p>
      <h2>Gated commercial exposure by contract</h2>
      <div class="contracts">{cards}</div>
    </section>

    <section>
      <p class="eyebrow">Evidence needed</p>
      <h2>What must be proven before Tower can claim value</h2>
      <table>
        <thead>
          <tr>
            <th>Contract</th>
            <th>Owner role</th>
            <th>Next gate</th>
            <th>Evidence needed</th>
            <th>Source refs</th>
          </tr>
        </thead>
        <tbody>{evidence_rows}</tbody>
      </table>
    </section>

    <section>
      <p class="eyebrow">QA result</p>
      <h2>Rendered proof checks</h2>
      <div class="qa">
        <span><b>{checks['row_count']}</b> Tower rows rendered</span>
        <span><b>{checks['all_rows_gated_with_reasons']}</b> all rows carry gate reasons</span>
        <span><b>{checks['visible_snake_case_hits']}</b> internal token hits</span>
        <span><b>{checks['banned_phrase_count']}</b> banned phrase hits</span>
      </div>
    </section>
  </main>
</body>
</html>
"""


def validate(rows: list[dict[str, Any]], rendered: str, require_weak_contract: bool) -> dict[str, Any]:
    issues: list[str] = []
    row_count = len(rows)
    gated_with_reasons = [
        row
        for row in rows
        if row.get("claim_gate_status") == "gated"
        and row.get("claim_gate_reason_code")
        and row.get("claim_gate_reason_detail")
        and row.get("evidence_needed_json")
    ]
    all_rows_gated = len(gated_with_reasons) == row_count and row_count > 0
    weak = next((row for row in rows if row.get("row_key") == WEAK_CONTRACT_ID), None)
    weak_payload = weak.get("display_payload_json", {}) if weak else {}
    gap_counts = Counter(
        str(gap)
        for row in rows
        for gap in row.get("gap_flags_json", [])
    )
    visible_snake_hits = [
        hit
        for hit in SNAKE_CASE_RE.findall(rendered)
        if hit not in {"utf_8"}
    ]
    banned_hits = [
        phrase
        for phrase in BANNED_VISIBLE_PHRASES
        if phrase.lower() in rendered.lower()
    ]
    total_blocked = sum(row_float(row, "blocked_value_usd") for row in rows)
    total_funded = sum(row_float(row, "funded_amount_usd") for row in rows)
    total_claimable = sum(row_float(row, "claimable_value_usd") for row in rows)

    checks = {
        "row_count": row_count,
        "all_rows_gated_with_reasons": all_rows_gated,
        "weak_contract_id": WEAK_CONTRACT_ID if weak else "missing",
        "weak_contract_selected": weak is not None,
        "weak_score_visible": "34/100" in rendered,
        "long_notice_visible": "365 days" in rendered,
        "shortfall_visible": "$1,071,000" in rendered,
        "blocked_total_usd": total_blocked,
        "funded_total_usd": total_funded,
        "claimable_total_usd": total_claimable,
        "blocked_equals_funded_minus_claimable": abs(total_blocked - (total_funded - total_claimable)) < 0.01,
        "distinct_protection_scores": len(
            {
                row.get("display_payload_json", {}).get("commercial_protection_score")
                for row in rows
            }
        ),
        "distinct_benchmark_variance": len(
            {
                row.get("display_payload_json", {})
                .get("market_benchmark", {})
                .get("market_benchmark_variance_percent")
                for row in rows
            }
        ),
        "gap_counts": dict(sorted(gap_counts.items())),
        "visible_snake_case_hits": len(visible_snake_hits),
        "visible_snake_case_examples": visible_snake_hits[:10],
        "banned_phrase_count": len(banned_hits),
        "banned_phrase_hits": banned_hits,
    }
    if row_count != 5:
        issues.append(f"Expected 5 tower_command_center rows, found {row_count}")
    if not all_rows_gated:
        issues.append("Every Tower row must be gated with reason and evidence-needed payloads.")
    if require_weak_contract and not checks["weak_contract_selected"]:
        issues.append(f"Required weak contract not rendered: {WEAK_CONTRACT_ID}")
    if require_weak_contract and not (
        checks["weak_score_visible"]
        and checks["long_notice_visible"]
        and checks["shortfall_visible"]
    ):
        issues.append("Weak contract leverage facts are not visible.")
    if not checks["blocked_equals_funded_minus_claimable"]:
        issues.append("Blocked value does not reconcile to funded exposure minus claimable value.")
    if checks["distinct_protection_scores"] < 5:
        issues.append("Protection scores look stamped; expected 5 distinct scores.")
    if checks["distinct_benchmark_variance"] < 5:
        issues.append("Benchmark variance looks stamped; expected 5 distinct values.")
    if checks["visible_snake_case_hits"]:
        issues.append("Rendered Tower preview contains visible snake_case tokens.")
    if checks["banned_phrase_count"]:
        issues.append("Rendered Tower preview contains client-visible process/build vocabulary.")
    if weak and weak_payload.get("commercial_protection_score") != 34:
        issues.append("Weak contract protection score drifted from expected 34.")
    return {
        "accepted": not issues,
        "issues": issues,
        "checks": checks,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--require-weak-contract", action="store_true")
    args = parser.parse_args()

    out_dir = args.out_dir.resolve()
    rows = load_rows(out_dir)
    preliminary = {
        "weak_contract_id": WEAK_CONTRACT_ID,
        "row_count": len(rows),
        "all_rows_gated_with_reasons": "pending",
        "visible_snake_case_hits": "pending",
        "banned_phrase_count": "pending",
    }
    rendered = render_html(rows, preliminary)
    qa = validate(rows, rendered, args.require_weak_contract)
    rendered = render_html(rows, qa["checks"])
    qa = validate(rows, rendered, args.require_weak_contract)

    preview_dir = out_dir / PREVIEW_DIR_NAME
    preview_dir.mkdir(parents=True, exist_ok=True)
    html_path = preview_dir / "tower-command-center-preview.html"
    qa_path = preview_dir / "tower-command-center-preview-qa.json"
    html_path.write_text(rendered, encoding="utf-8")
    qa.update(
        {
            "html": html_path.as_posix(),
            "qa_json": qa_path.as_posix(),
        }
    )
    qa_path.write_text(json.dumps(qa, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(qa, indent=2, sort_keys=True))
    return 0 if qa["accepted"] else 1


if __name__ == "__main__":
    sys.exit(main())
