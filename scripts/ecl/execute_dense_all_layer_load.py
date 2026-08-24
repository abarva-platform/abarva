#!/usr/bin/env python3

"""Execute the dense ECL all-layer load against a governed target database.

This is the ACA data-build job entrypoint. It regenerates the dense source-room
extracts inside the job image, builds the layer SQL using the same local proof
builders, applies ECL DDL, replaces only the configured tenant/assessment slice,
loads source/context/commercial/review/projection/cube rows, and performs an
independent readback before emitting a proof bundle marker for the ACA wrapper.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import load_dense_source_room_commercial_layer as commercial_layer
import load_dense_source_room_context_layer as context_layer
import load_dense_source_room_cube_layer as cube_layer
import load_dense_source_room_review_layer as review_layer
import load_dense_source_room_source_layer as source_layer
import load_dense_source_room_source_projection_layer as projection_layer


ROOT = Path(__file__).resolve().parents[2]
TENANT_KEY = source_layer.TENANT_KEY
ASSESSMENT_ID = source_layer.ASSESSMENT_ID
DEFAULT_DENSE_OUT_DIR = ROOT / "outputs/source-room-depth-catchup-2026-08-23"
DEFAULT_OUT_DIR = ROOT / "job-output/ecl-dense-all-layer-load"
DDL_FILES = [
    ROOT / "docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql",
    ROOT / "docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql",
    ROOT / "docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql",
]
TRUTHY = {"1", "true", "yes", "on"}
PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__"
PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__"
ALLOWED_TARGETS = {"lab", "preprod", "lab_preprod", "client_preprod", "local_disposable"}


class Refusal(RuntimeError):
    def __init__(self, issues: list[str]):
        self.issues = sorted(set(issues))
        super().__init__("; ".join(self.issues))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_sha(path: Path) -> str:
    return source_layer.hashlib.sha256(path.read_bytes()).hexdigest()


def sql_text(value: object | None) -> str:
    return source_layer.sql_text(value)


def command_env() -> dict[str, str]:
    env = source_layer.command_env()
    env.setdefault("PGCONNECT_TIMEOUT", "30")
    return env


def run(command: list[str], *, out_dir: Path, label: str, sensitive: bool = False) -> dict[str, Any]:
    started_at = now_iso()
    result = subprocess.run(command, cwd=ROOT, env=command_env(), text=True, capture_output=True)
    stdout_path = out_dir / f"{label}.stdout.log"
    stderr_path = out_dir / f"{label}.stderr.log"
    stdout_path.write_text(result.stdout if not sensitive else "<redacted>\n", encoding="utf-8")
    stderr_path.write_text(result.stderr if not sensitive else "<redacted>\n", encoding="utf-8")
    record = {
        "command": [command[0], *("<redacted>" if sensitive and index == 1 else value for index, value in enumerate(command[1:], start=1))],
        "finished_at": now_iso(),
        "label": label,
        "returncode": result.returncode,
        "started_at": started_at,
        "stderr_log": stderr_path.as_posix(),
        "stdout_log": stdout_path.as_posix(),
    }
    if result.returncode != 0:
        raise Refusal([f"{label}_failed:{(result.stderr or result.stdout).strip()[:800]}"])
    return record


def run_psql_file(target_db_url: str, sql_path: Path, out_dir: Path, label: str) -> dict[str, Any]:
    return run(["psql", target_db_url, "-v", "ON_ERROR_STOP=1", "-f", sql_path.as_posix()], out_dir=out_dir, label=label, sensitive=True)


def run_psql_query(target_db_url: str, sql: str, out_dir: Path, label: str, *, expect_failure: bool = False) -> dict[str, Any]:
    command = ["psql", target_db_url, "-v", "ON_ERROR_STOP=1", "-At", "-c", sql]
    result = subprocess.run(command, cwd=ROOT, env=command_env(), text=True, capture_output=True)
    (out_dir / f"{label}.stdout.log").write_text(result.stdout, encoding="utf-8")
    (out_dir / f"{label}.stderr.log").write_text(result.stderr, encoding="utf-8")
    if expect_failure:
        return {"label": label, "rejected": result.returncode != 0, "stderr": result.stderr[:800]}
    if result.returncode != 0:
        raise Refusal([f"{label}_failed:{(result.stderr or result.stdout).strip()[:800]}"])
    return {"label": label, "returncode": result.returncode, "stdout": result.stdout}


def build_layer_sql(dense_out_dir: Path, out_dir: Path) -> dict[str, Any]:
    source_layer.generate_dense_package(dense_out_dir)
    source_sql = source_layer.build_sql(dense_out_dir, out_dir)
    context_sql = context_layer.build_context_sql(dense_out_dir, out_dir)
    commercial_sql = commercial_layer.build_commercial_sql(dense_out_dir, out_dir)
    review_sql = review_layer.build_review_sql(dense_out_dir, out_dir)
    projection_sql = projection_layer.build_projection_sql(dense_out_dir, out_dir)
    cube_sql = cube_layer.build_cube_sql(dense_out_dir, out_dir)
    return {
        "source": source_sql,
        "context": context_sql,
        "commercial": commercial_sql,
        "review": review_sql,
        "projection": projection_sql,
        "cube": cube_sql,
    }


def metric_keys_for_purge(dense_out_dir: Path) -> list[str]:
    context = context_layer.ContextBuilder(dense_out_dir).build()
    keys: list[str] = []
    for row in context["metric_definitions"]:
        value = row["metric_key"]
        parsed = value[1:-1].replace("''", "'") if value.startswith("'") and value.endswith("'") else value
        keys.append(parsed)
    return sorted(set(keys))


def write_purge_sql(path: Path, metric_keys: list[str]) -> None:
    key_values = ", ".join(sql_text(key) for key in metric_keys) or "null"
    tenant = sql_text(TENANT_KEY)
    assessment = sql_text(ASSESSMENT_ID)
    path.write_text(
        f"""
begin;
delete from ecl_projection.cube_slice_measure where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.cube_slice_metric where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.cube_slice where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.cube_manifest where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.source_event_workspace where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.source_value_levers where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.source_vendor_360 where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.source_contract_360 where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.home_enterprise_landscape where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.tower_command_center where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.intelligence_context_pack where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_projection.projection_manifest where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_review.review_event where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_commercial.sla_observation where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_commercial.invoice_line where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_commercial.contract_scope where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_commercial.contract_service_line where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_commercial.contract where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_context.context_pack where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_context.snapshot where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_context.measure where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_context.relationship where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_context.object where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_context.metric_definition where tenant_key = {tenant} and metric_key in ({key_values});
delete from ecl_source.document_extraction where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_source.document where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_source.source_record where tenant_key = {tenant} and assessment_id = {assessment};
delete from ecl_source.source_file where tenant_key = {tenant} and assessment_id = {assessment};
commit;
""".strip()
        + "\n",
        encoding="utf-8",
    )


def readback_sql() -> str:
    tenant = sql_text(TENANT_KEY)
    assessment = sql_text(ASSESSMENT_ID)
    return f"""
select jsonb_pretty(jsonb_build_object(
  'source_file', (select count(*) from ecl_source.source_file where tenant_key = {tenant} and assessment_id = {assessment}),
  'source_record', (select count(*) from ecl_source.source_record where tenant_key = {tenant} and assessment_id = {assessment}),
  'document', (select count(*) from ecl_source.document where tenant_key = {tenant} and assessment_id = {assessment}),
  'document_extraction', (select count(*) from ecl_source.document_extraction where tenant_key = {tenant} and assessment_id = {assessment}),
  'source_record_partial', (select count(*) from ecl_source.source_record where tenant_key = {tenant} and assessment_id = {assessment} and parse_state = 'partial'),
  'extraction_distinct_spans', (select count(distinct span_reference) from ecl_source.document_extraction where tenant_key = {tenant} and assessment_id = {assessment}),
  'client_attested_rows', (select count(*) from ecl_source.source_record where tenant_key = {tenant} and assessment_id = {assessment} and payload_json ->> 'client_attestation_state' <> 'not_client_attested'),
  'object_type_catalog', (select count(*) from ecl_context.object_type_catalog),
  'object', (select count(*) from ecl_context.object where tenant_key = {tenant} and assessment_id = {assessment}),
  'application', (select count(*) from ecl_context.application_v where tenant_key = {tenant} and assessment_id = {assessment}),
  'application_deployment', (select count(*) from ecl_context.application_deployment_v where tenant_key = {tenant} and assessment_id = {assessment}),
  'vendor', (select count(*) from ecl_context.object where tenant_key = {tenant} and assessment_id = {assessment} and object_type = 'vendor'),
  'data_platform', (select count(*) from ecl_context.technical_component_v where tenant_key = {tenant} and assessment_id = {assessment} and object_type = 'data_platform'),
  'infrastructure', (select count(*) from ecl_context.technical_component_v where tenant_key = {tenant} and assessment_id = {assessment} and object_type = 'infrastructure'),
  'relationship', (select count(*) from ecl_context.relationship where tenant_key = {tenant} and assessment_id = {assessment}),
  'deployment_of', (select count(*) from ecl_context.relationship where tenant_key = {tenant} and assessment_id = {assessment} and relationship_type = 'DEPLOYMENT_OF'),
  'hosted_on', (select count(*) from ecl_context.relationship where tenant_key = {tenant} and assessment_id = {assessment} and relationship_type = 'HOSTED_ON'),
  'integrates_with', (select count(*) from ecl_context.relationship where tenant_key = {tenant} and assessment_id = {assessment} and relationship_type = 'INTEGRATES_WITH'),
  'metric_definition', (select count(*) from ecl_context.metric_definition where tenant_key = {tenant}),
  'measure', (select count(*) from ecl_context.measure where tenant_key = {tenant} and assessment_id = {assessment}),
  'measure_metric_drift', (
    select count(*) from ecl_context.measure m
    left join ecl_context.metric_definition md on md.tenant_key = m.tenant_key and md.metric_key = m.metric_key
    where m.tenant_key = {tenant} and m.assessment_id = {assessment} and md.metric_key is null
  ),
  'snapshot', (select count(*) from ecl_context.snapshot where tenant_key = {tenant} and assessment_id = {assessment}),
  'context_pack', (select count(*) from ecl_context.context_pack where tenant_key = {tenant} and assessment_id = {assessment}),
  'contract', (select count(*) from ecl_commercial.contract where tenant_key = {tenant} and assessment_id = {assessment}),
  'contract_service_line', (select count(*) from ecl_commercial.contract_service_line where tenant_key = {tenant} and assessment_id = {assessment}),
  'contract_scope', (select count(*) from ecl_commercial.contract_scope where tenant_key = {tenant} and assessment_id = {assessment}),
  'invoice_line', (select count(*) from ecl_commercial.invoice_line where tenant_key = {tenant} and assessment_id = {assessment}),
  'invoice_lines_with_contract', (select count(*) from ecl_commercial.invoice_line where tenant_key = {tenant} and assessment_id = {assessment} and contract_id is not null),
  'sla_observation', (select count(*) from ecl_commercial.sla_observation where tenant_key = {tenant} and assessment_id = {assessment}),
  'contract_vendor_drift', (
    select count(*) from ecl_commercial.contract c
    left join ecl_context.object v on v.tenant_key = c.tenant_key and v.assessment_id = c.assessment_id and v.id = c.vendor_object_id
    where c.tenant_key = {tenant} and c.assessment_id = {assessment} and v.id is null
  ),
  'contract_scope_object_drift', (
    select count(*) from ecl_commercial.contract_scope cs
    left join ecl_context.object o on o.tenant_key = cs.tenant_key and o.assessment_id = cs.assessment_id and o.id = cs.scoped_object_id
    where cs.tenant_key = {tenant} and cs.assessment_id = {assessment} and o.id is null
  ),
  'sla_metric_drift', (
    select count(*) from ecl_commercial.sla_observation s
    left join ecl_context.metric_definition md on md.tenant_key = s.tenant_key and md.metric_key = s.metric_key
    where s.tenant_key = {tenant} and s.assessment_id = {assessment} and md.metric_key is null
  ),
  'review_event', (select count(*) from ecl_review.review_event where tenant_key = {tenant} and assessment_id = {assessment}),
  'review_contract_subjects', (select count(*) from ecl_review.review_event where tenant_key = {tenant} and assessment_id = {assessment} and subject_kind = 'contract'),
  'review_invoice_subjects', (select count(*) from ecl_review.review_event where tenant_key = {tenant} and assessment_id = {assessment} and subject_kind = 'invoice_line'),
  'review_sla_subjects', (select count(*) from ecl_review.review_event where tenant_key = {tenant} and assessment_id = {assessment} and subject_kind = 'sla_observation'),
  'review_context_pack_subjects', (select count(*) from ecl_review.review_event where tenant_key = {tenant} and assessment_id = {assessment} and subject_kind = 'context_pack'),
  'review_source_record_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_source.source_record sr
      on sr.tenant_key = re.tenant_key and sr.assessment_id = re.assessment_id and sr.id = re.source_record_id
    where re.tenant_key = {tenant} and re.assessment_id = {assessment} and re.source_record_id is not null and sr.id is null
  ),
  'review_contract_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_commercial.contract c
      on c.tenant_key = re.tenant_key and c.assessment_id = re.assessment_id and c.id = re.subject_contract_id
    where re.tenant_key = {tenant} and re.assessment_id = {assessment} and re.subject_kind = 'contract' and c.id is null
  ),
  'review_invoice_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_commercial.invoice_line i
      on i.tenant_key = re.tenant_key and i.assessment_id = re.assessment_id and i.id = re.subject_invoice_line_id
    where re.tenant_key = {tenant} and re.assessment_id = {assessment} and re.subject_kind = 'invoice_line' and i.id is null
  ),
  'review_sla_drift', (
    select count(*) from ecl_review.review_event re
    left join ecl_commercial.sla_observation s
      on s.tenant_key = re.tenant_key and s.assessment_id = re.assessment_id and s.id = re.subject_sla_observation_id
    where re.tenant_key = {tenant} and re.assessment_id = {assessment} and re.subject_kind = 'sla_observation' and s.id is null
  )
) || jsonb_build_object(
  'projection_manifest', (select count(*) from ecl_projection.projection_manifest where tenant_key = {tenant} and assessment_id = {assessment}),
  'home_enterprise_landscape', (select count(*) from ecl_projection.home_enterprise_landscape where tenant_key = {tenant} and assessment_id = {assessment}),
  'source_contract_360', (select count(*) from ecl_projection.source_contract_360 where tenant_key = {tenant} and assessment_id = {assessment}),
  'source_vendor_360', (select count(*) from ecl_projection.source_vendor_360 where tenant_key = {tenant} and assessment_id = {assessment}),
  'source_value_levers', (select count(*) from ecl_projection.source_value_levers where tenant_key = {tenant} and assessment_id = {assessment}),
  'source_event_workspace', (select count(*) from ecl_projection.source_event_workspace where tenant_key = {tenant} and assessment_id = {assessment}),
  'tower_command_center', (select count(*) from ecl_projection.tower_command_center where tenant_key = {tenant} and assessment_id = {assessment}),
  'intelligence_context_pack', (select count(*) from ecl_projection.intelligence_context_pack where tenant_key = {tenant} and assessment_id = {assessment}),
  'cube_manifest', (select count(*) from ecl_projection.cube_manifest where tenant_key = {tenant} and assessment_id = {assessment}),
  'cube_slice', (select count(*) from ecl_projection.cube_slice where tenant_key = {tenant} and assessment_id = {assessment}),
  'cube_slice_metric', (select count(*) from ecl_projection.cube_slice_metric where tenant_key = {tenant} and assessment_id = {assessment}),
  'cube_slice_measure', (select count(*) from ecl_projection.cube_slice_measure where tenant_key = {tenant} and assessment_id = {assessment}),
  'cube_key_count', (select count(distinct cube_key) from ecl_projection.cube_manifest where tenant_key = {tenant} and assessment_id = {assessment}),
  'relationship_endpoint_drift', (
    select count(*) from ecl_context.relationship r
    left join ecl_context.object f on f.tenant_key = r.tenant_key and f.assessment_id = r.assessment_id and f.id = r.from_object_id
    left join ecl_context.object t on t.tenant_key = r.tenant_key and t.assessment_id = r.assessment_id and t.id = r.to_object_id
    where r.tenant_key = {tenant} and r.assessment_id = {assessment} and (f.id is null or t.id is null)
  ),
  'cube_metric_drift', (
    select count(*) from ecl_projection.cube_slice_metric csm
    left join ecl_context.metric_definition md on md.tenant_key = csm.tenant_key and md.metric_key = csm.metric_key
    where csm.tenant_key = {tenant} and csm.assessment_id = {assessment} and md.metric_key is null
  ),
  'cube_measure_drift', (
    select count(*) from ecl_projection.cube_slice_measure csm
    left join ecl_context.measure m on m.tenant_key = csm.tenant_key and m.assessment_id = csm.assessment_id and m.id = csm.measure_id
    where csm.tenant_key = {tenant} and csm.assessment_id = {assessment} and m.id is null
  ),
  'source_value_claimable_rows', (
    select count(*) from ecl_projection.source_value_levers
    where tenant_key = {tenant} and assessment_id = {assessment} and claimable_value_usd > 0
  ),
  'source_value_gated_rows', (
    select count(*) from ecl_projection.source_value_levers
    where tenant_key = {tenant} and assessment_id = {assessment} and value_gate_status in ('gated','blocked')
  ),
  'event_rows_without_evidence_payload', (
    select count(*) from ecl_projection.source_event_workspace
    where tenant_key = {tenant} and assessment_id = {assessment}
      and gate_status in ('gated','blocked')
      and jsonb_array_length(evidence_needed_json) = 0
  ),
  'home_primary_object_drift', (
    select count(*) from ecl_projection.home_enterprise_landscape p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.primary_object_id
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and p.primary_object_id is not null and o.id is null
  ),
  'home_refusal_without_payload', (
    select count(*) from ecl_projection.home_enterprise_landscape
    where tenant_key = {tenant} and assessment_id = {assessment}
      and admission_status = 'refused'
      and (admission_gate_key is null or admission_result_json = '{{}}'::jsonb)
  ),
  'home_application_count_basis_drift', (
    select abs(
      (
        select count(*)
        from ecl_projection.home_enterprise_landscape
        where tenant_key = {tenant}
          and assessment_id = {assessment}
          and page_key = 'applications_systems'
      )
      - (
        select count(*)
        from ecl_context.application_v
        where tenant_key = {tenant}
          and assessment_id = {assessment}
      )
    )
  ),
  'home_application_page_deployment_rows', (
    select count(*)
    from ecl_projection.home_enterprise_landscape p
    join ecl_context.application_deployment_v d
      on d.tenant_key = p.tenant_key
      and d.assessment_id = p.assessment_id
      and d.id = p.primary_object_id
    where p.tenant_key = {tenant}
      and p.assessment_id = {assessment}
      and p.page_key = 'applications_systems'
  ),
  'contract_projection_contract_drift', (
    select count(*) from ecl_projection.source_contract_360 p
    left join ecl_commercial.contract c on c.tenant_key = p.tenant_key and c.assessment_id = p.assessment_id and c.id = p.contract_id
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and c.id is null
  ),
  'vendor_projection_vendor_drift', (
    select count(*) from ecl_projection.source_vendor_360 p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.vendor_object_id
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and o.id is null
  ),
  'value_lever_metric_drift', (
    select count(*) from ecl_projection.source_value_levers p
    left join ecl_context.metric_definition md on md.tenant_key = p.tenant_key and md.metric_key = p.primary_metric_key
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and md.metric_key is null
  ),
  'event_review_drift', (
    select count(*) from ecl_projection.source_event_workspace p
    left join ecl_review.review_event re on re.tenant_key = p.tenant_key and re.assessment_id = p.assessment_id and re.id = p.review_event_id
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and re.id is null
  ),
  'tower_primary_object_drift', (
    select count(*) from ecl_projection.tower_command_center p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.primary_object_id
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and p.primary_object_id is not null and o.id is null
  ),
  'tower_gated_without_reason', (
    select count(*) from ecl_projection.tower_command_center
    where tenant_key = {tenant} and assessment_id = {assessment}
      and claim_gate_status in ('gated','blocked') and claim_gate_reason_code is null
  ),
  'intelligence_context_pack_drift', (
    select count(*) from ecl_projection.intelligence_context_pack p
    left join ecl_context.context_pack cp on cp.tenant_key = p.tenant_key and cp.assessment_id = p.assessment_id and cp.id = p.context_pack_id
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and cp.id is null
  ),
  'intelligence_primary_object_drift', (
    select count(*) from ecl_projection.intelligence_context_pack p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.primary_object_id
    where p.tenant_key = {tenant} and p.assessment_id = {assessment} and p.primary_object_id is not null and o.id is null
  ),
  'json_metric_without_fk', (
    select count(*) from ecl_projection.cube_slice cs
    where cs.tenant_key = {tenant} and cs.assessment_id = {assessment}
      and exists (
        select 1
        from jsonb_array_elements_text(cs.metric_keys_json) as metric_key
        left join ecl_projection.cube_slice_metric csm
          on csm.tenant_key = cs.tenant_key
          and csm.assessment_id = cs.assessment_id
          and csm.cube_slice_id = cs.id
          and csm.metric_key = metric_key
        where csm.metric_key is null
      )
  ),
  'blocked_without_gap', (
    select count(*) from ecl_projection.cube_slice
    where tenant_key = {tenant} and assessment_id = {assessment}
      and quality_state = 'blocked'
      and gap_flags_json = '[]'::jsonb
  )
));
"""


def parse_json_from_psql(raw: str) -> dict[str, Any]:
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise Refusal([f"readback_json_missing:{raw[:500]}"])
    return json.loads(raw[start : end + 1])


def expected_counts(sql_summaries: dict[str, Any]) -> dict[str, int]:
    expected: dict[str, int] = {}
    for section in ["source", "context", "commercial", "review", "projection", "cube"]:
        expected.update({key: int(value) for key, value in sql_summaries[section]["expected_counts"].items()})
    return expected


def validate_readback(readback: dict[str, Any], expected: dict[str, int], planted: list[dict[str, Any]]) -> list[str]:
    issues: list[str] = []
    for key, value in expected.items():
        if int(readback.get(key, -1)) != int(value):
            issues.append(f"{key}_count_expected_{value}_got_{readback.get(key)}")
    for drift_key in [
        "relationship_endpoint_drift",
        "cube_metric_drift",
        "cube_measure_drift",
        "home_primary_object_drift",
        "home_refusal_without_payload",
        "home_application_count_basis_drift",
        "home_application_page_deployment_rows",
        "tower_primary_object_drift",
        "tower_gated_without_reason",
        "intelligence_context_pack_drift",
        "intelligence_primary_object_drift",
    ]:
        if int(readback.get(drift_key, 1)) != 0:
            issues.append(drift_key)
    if int(readback.get("source_value_claimable_rows", 1)) != 0:
        issues.append("source_value_claimable_rows_should_be_zero_before_review")
    if any(not item.get("rejected") for item in planted):
        issues.append("planted_failure_not_rejected")
    return issues


def planted_failure_probes(target_db_url: str, out_dir: Path) -> list[dict[str, Any]]:
    return [
        run_psql_query(
            target_db_url,
            "begin; insert into ecl_context.relationship (tenant_key, assessment_id, from_object_id, relationship_type, to_object_id, basis, value_state, review_state) values ('meridian-health', 'assessment-dense-source-room-20260823', gen_random_uuid(), 'DEPENDS_ON', gen_random_uuid(), 'source_recorded', 'known', 'not_reviewed'); rollback;",
            out_dir,
            "planted_relationship_endpoint_fk",
            expect_failure=True,
        ),
        run_psql_query(
            target_db_url,
            "begin; insert into ecl_projection.cube_slice_metric (tenant_key, assessment_id, cube_slice_id, metric_key, metric_role, source_hash) select tenant_key, assessment_id, id, 'invented_metric_key', 'display', 'bad' from ecl_projection.cube_slice where tenant_key = 'meridian-health' and assessment_id = 'assessment-dense-source-room-20260823' limit 1; rollback;",
            out_dir,
            "planted_cube_metric_fk",
            expect_failure=True,
        ),
    ]


def emit_proof_bundle(out_dir: Path) -> None:
    with tempfile.NamedTemporaryFile(suffix=".tgz", delete=False) as handle:
        tar_path = Path(handle.name)
    try:
        with tarfile.open(tar_path, "w:gz") as archive:
            for file_path in sorted(path for path in out_dir.rglob("*") if path.is_file()):
                archive.add(file_path, arcname=file_path.relative_to(out_dir.parent))
        encoded = base64.b64encode(tar_path.read_bytes()).decode("ascii")
        print(PROOF_BEGIN)
        for index in range(0, len(encoded), 76):
            print(encoded[index : index + 76])
        print(PROOF_END)
    finally:
        tar_path.unlink(missing_ok=True)


def validate_execution_args(args: argparse.Namespace) -> list[str]:
    issues: list[str] = []
    mode = args.mode or os.environ.get("ECL_DENSE_MODE", "")
    approved = args.approved or os.environ.get("ECL_DENSE_AZURE_LOAD_APPROVED", "").lower() in TRUTHY
    target_classification = args.target_classification or os.environ.get("ECL_DENSE_TARGET_DATA_PLANE", "")
    target_db_url = args.target_db_url or os.environ.get("DATABASE_URL", "")
    if args.plan_only:
        return issues
    if mode != "execute":
        issues.append("ECL_DENSE_MODE_must_be_execute")
    if not approved:
        issues.append("ECL_DENSE_AZURE_LOAD_APPROVED_must_be_true")
    if target_classification not in ALLOWED_TARGETS:
        issues.append("ECL_DENSE_TARGET_DATA_PLANE_not_allowed_or_missing")
    if not target_db_url:
        issues.append("DATABASE_URL_missing")
    if target_db_url and "prod" in target_db_url.lower() and target_classification not in {"preprod", "client_preprod"}:
        issues.append("DATABASE_URL_contains_prod_without_preprod_classification")
    return issues


def execute(args: argparse.Namespace) -> dict[str, Any]:
    out_dir = args.out_dir.resolve()
    dense_out_dir = args.dense_out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    dense_out_dir.mkdir(parents=True, exist_ok=True)

    issues = validate_execution_args(args)
    if issues:
        write_json(out_dir / "ecl_dense_all_layer_refusal.json", {"accepted": False, "issues": issues, "generated_at": now_iso()})
        raise Refusal(issues)

    sql_summaries = build_layer_sql(dense_out_dir, out_dir)
    metric_keys = metric_keys_for_purge(dense_out_dir)
    purge_sql = out_dir / "dense_ecl_tenant_assessment_replace_purge.sql"
    write_purge_sql(purge_sql, metric_keys)

    if args.plan_only:
        summary = {
            "accepted": True,
            "actual_azure_execution": False,
            "generated_at": now_iso(),
            "mode": "plan_only",
            "tenant_key": TENANT_KEY,
            "assessment_id": ASSESSMENT_ID,
            "sql_files": sql_summaries,
            "purge_sql": purge_sql.as_posix(),
            "expected_counts": expected_counts(sql_summaries),
        }
        write_json(out_dir / "ecl_dense_all_layer_execute_plan.json", summary)
        print(json.dumps(summary, indent=2, sort_keys=True))
        return summary

    target_db_url = args.target_db_url or os.environ["DATABASE_URL"]
    commands: list[dict[str, Any]] = []
    for index, ddl in enumerate(DDL_FILES, start=1):
        commands.append(run_psql_file(target_db_url, ddl, out_dir, f"ddl_{index}_{ddl.stem}"))
    commands.append(run_psql_file(target_db_url, purge_sql, out_dir, "replace_existing_tenant_assessment_slice"))
    load_files = [
        Path(sql_summaries["source"]["load_sql"]),
        Path(sql_summaries["context"]["context_sql"]),
        Path(sql_summaries["commercial"]["commercial_sql"]),
        Path(sql_summaries["review"]["review_sql"]),
        Path(sql_summaries["projection"]["projection_sql"]),
        Path(sql_summaries["cube"]["cube_sql"]),
    ]
    for sql_path in load_files:
        commands.append(run_psql_file(target_db_url, sql_path, out_dir, f"load_{sql_path.stem}"))

    planted = planted_failure_probes(target_db_url, out_dir)
    readback_result = run_psql_query(target_db_url, readback_sql(), out_dir, "independent_readback")
    readback = parse_json_from_psql(readback_result["stdout"])
    expected = expected_counts(sql_summaries)
    validation_issues = validate_readback(readback, expected, planted)
    status = "pass" if not validation_issues else "fail"
    target_classification = args.target_classification or os.environ.get("ECL_DENSE_TARGET_DATA_PLANE", "")
    summary = {
        "accepted": status == "pass",
        "actual_azure_execution": target_classification != "local_disposable",
        "actual_target_database_mutation": True,
        "assessment_id": ASSESSMENT_ID,
        "commands": commands,
        "dense_out_dir": dense_out_dir.as_posix(),
        "generated_at": now_iso(),
        "idempotency_key": os.environ.get("ECL_DENSE_IDEMPOTENCY_KEY", ""),
        "issues": validation_issues,
        "planted_failures": planted,
        "readback": readback,
        "run_id": os.environ.get("ECL_DENSE_RUN_ID", ""),
        "sql_sha256": {key: file_sha(Path(value)) for key, value in {
            "purge": purge_sql.as_posix(),
            "source": sql_summaries["source"]["load_sql"],
            "context": sql_summaries["context"]["context_sql"],
            "commercial": sql_summaries["commercial"]["commercial_sql"],
            "review": sql_summaries["review"]["review_sql"],
            "projection": sql_summaries["projection"]["projection_sql"],
            "cube": sql_summaries["cube"]["cube_sql"],
        }.items()},
        "status": status,
        "target_classification": target_classification,
        "tenant_key": TENANT_KEY,
    }
    write_json(out_dir / "ecl_dense_all_layer_execute_summary.json", summary)
    write_json(out_dir / "ecl_dense_all_layer_readback.json", readback)
    if validation_issues:
        raise Refusal(validation_issues)
    emit_proof_bundle(out_dir)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return summary


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dense-out-dir", type=Path, default=DEFAULT_DENSE_OUT_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--target-db-url")
    parser.add_argument("--target-classification")
    parser.add_argument("--mode")
    parser.add_argument("--approved", action="store_true")
    parser.add_argument("--plan-only", action="store_true")
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv[1:])
    try:
        execute(args)
        return 0
    except Refusal as exc:
        print(json.dumps({"accepted": False, "issues": exc.issues}, indent=2, sort_keys=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
