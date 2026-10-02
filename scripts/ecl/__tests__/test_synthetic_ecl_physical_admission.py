#!/usr/bin/env python3
"""Exercise synthetic ECL admission only in a disposable local Postgres database."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "scripts/ecl"))

import generate_synthetic_enterprise_v1 as source  # noqa: E402
import normalize_synthetic_enterprise_v1 as adapter  # noqa: E402
from synthetic_source_versions import load_definition  # noqa: E402


def connection() -> tuple[list[str], dict[str, str]]:
    raw = os.environ.get("ECL_ADMISSION_TEST_DATABASE_URL", "")
    url = urlparse(raw)
    if (url.scheme not in {"postgres", "postgresql"} or
            url.hostname not in {"localhost", "127.0.0.1"} or
            url.path != "/ecl_admission_test"):
        raise ValueError("Physical admission test requires local ecl_admission_test Postgres")
    env = os.environ.copy()
    env["PGPASSWORD"] = url.password or ""
    return ["psql", "-X", "-At", "-v", "ON_ERROR_STOP=1", "-h", url.hostname,
            "-p", str(url.port or 5432), "-U", url.username or "postgres",
            "-d", "ecl_admission_test"], env


def main() -> None:
    base, env = connection()

    def psql(*args: str, expected_constraint: str | None = None) -> str:
        result = subprocess.run([*base, *args], env=env, text=True, capture_output=True, check=False)
        if expected_constraint:
            if result.returncode == 0 or expected_constraint not in result.stderr:
                raise AssertionError(f"Expected {expected_constraint} rejection: {result.stderr}")
        elif result.returncode != 0:
            raise AssertionError(result.stderr)
        return result.stdout.strip()

    existing = psql("-c", "select count(*) from information_schema.schemata where schema_name like 'ecl_%'")
    if existing != "0":
        raise ValueError("Physical admission test requires a fresh disposable database")

    psql("-f", str(ROOT / "supabase/migrations/20260831031000_ecl_substrate_baseline.sql"))
    psql("-c", """
        insert into ecl_context.object_type_catalog
          (object_type, display_label, grain, counting_class, description)
        values
          ('enterprise', 'Enterprise', 'enterprise', 'enterprise_scope', 'Existing grain'),
          ('business_segment', 'Business Segment', 'business_segment', 'business_entity', 'Existing grain'),
          ('business_function', 'Business Function', 'business_function', 'business_entity', 'Existing grain'),
          ('organization', 'Organization', 'organization', 'business_entity', 'Existing grain'),
          ('process', 'Process', 'process', 'business_entity', 'Existing grain'),
          ('application', 'Application', 'application', 'business_entity', 'Existing grain'),
          ('application_deployment', 'Application Deployment', 'application_deployment', 'deployment_instance', 'Existing grain'),
          ('data_platform', 'Data Platform', 'data_platform', 'technical_component', 'Existing grain'),
          ('data_product', 'Data Product', 'data_product', 'business_entity', 'Existing grain'),
          ('infrastructure', 'Infrastructure', 'infrastructure', 'technical_component', 'Existing grain'),
          ('vendor', 'Vendor', 'vendor', 'commercial_entity', 'Existing grain'),
          ('contract', 'Contract', 'contract', 'commercial_entity', 'Existing grain'),
          ('program', 'Program', 'program', 'initiative', 'Existing grain'),
          ('metric', 'Metric', 'metric', 'metric_definition', 'Existing grain'),
          ('risk', 'Risk', 'risk', 'risk_control', 'Existing grain'),
          ('control', 'Control', 'control', 'risk_control', 'Existing grain'),
          ('ai_program', 'AI Program', 'ai_program', 'initiative', 'Existing grain'),
          ('ai_use_case', 'AI Use Case', 'ai_use_case', 'business_entity', 'Existing grain'),
          ('ai_tool', 'AI Tool', 'ai_tool', 'technical_component', 'Existing grain'),
          ('persona', 'Persona', 'persona', 'persona', 'Existing grain')
        on conflict (object_type) do nothing;
    """)
    migration = str(ROOT / "supabase/migrations/20261001183000_ecl_enterprise_context_admission.sql")
    psql("-f", migration)
    psql("-f", migration)

    definition = load_definition("v1")
    generated = source.build(definition)
    source.validate(generated)
    with tempfile.TemporaryDirectory() as temp:
        pack = Path(temp) / "pack"
        source.export(generated, pack)
        normalized = adapter.normalize(pack)

    catalog = set(psql("-c", "select object_type from ecl_context.object_type_catalog").splitlines())
    missing = set(normalized["quality"]["object_types"]) - catalog
    if missing:
        raise AssertionError(f"Canonical object types missing from ECL catalog: {sorted(missing)}")

    psql("-c", """
        insert into ecl_context.object
          (tenant_key, assessment_id, object_key, object_type, display_name,
           lifecycle_state, basis, value_state, review_state)
        values
          ('synthetic', 'admission-proof', 'APP-0001', 'application', 'Product',
           'current', 'source_recorded', 'known', 'not_reviewed'),
          ('synthetic', 'admission-proof', 'APP-0025', 'application_module', 'Module',
           'current', 'source_recorded', 'known', 'not_reviewed'),
          ('synthetic', 'admission-proof', 'EVID-0001', 'evidence_request', 'Missing artifact',
           'current', 'source_recorded', 'unknown', 'not_reviewed');
    """)
    counts = psql("-c", """
        select (select count(*) from ecl_context.application_v where assessment_id = 'admission-proof'),
               (select count(*) from ecl_context.object where assessment_id = 'admission-proof');
    """)
    if counts.splitlines()[-1] != "1|3":
        raise AssertionError(f"Application module inflated logical app count: {counts}")
    psql("-c", """
        insert into ecl_context.object
          (tenant_key, assessment_id, object_key, object_type, display_name,
           lifecycle_state, basis, value_state, review_state)
        values ('synthetic', 'admission-proof', 'BAD-0001', 'unreviewed_type', 'Invalid',
                'current', 'source_recorded', 'known', 'not_reviewed');
    """, expected_constraint="object_type_check")

    verbs = set(adapter.RELATIONSHIP_TYPES.values())
    if not all(re.fullmatch(r"[A-Z_]+", verb) for verb in verbs):
        raise AssertionError("Unexpected relationship token")
    values = ", ".join(f"('{verb}')" for verb in sorted(verbs))
    psql("-c", f"""
        insert into ecl_context.relationship
          (tenant_key, assessment_id, from_object_id, relationship_type, to_object_id,
           basis, value_state, review_state)
        select 'synthetic', 'admission-proof', request.id, types.verb, module.id,
               'source_recorded', 'known', 'not_reviewed'
          from (values {values}) as types(verb)
          cross join ecl_context.object request
          cross join ecl_context.object module
         where request.assessment_id = 'admission-proof' and request.object_key = 'EVID-0001'
           and module.assessment_id = 'admission-proof' and module.object_key = 'APP-0025';
    """)
    count = psql("-c", "select count(*) from ecl_context.relationship where assessment_id = 'admission-proof'")
    if count != str(len(verbs)):
        raise AssertionError(f"Normalized relationships were not all admitted: {count}")
    psql("-c", """
        insert into ecl_context.relationship
          (tenant_key, assessment_id, from_object_id, relationship_type, to_object_id,
           basis, value_state, review_state)
        select 'synthetic', 'admission-proof', request.id, 'UNREVIEWED_VERB', module.id,
               'source_recorded', 'known', 'not_reviewed'
          from ecl_context.object request cross join ecl_context.object module
         where request.assessment_id = 'admission-proof' and request.object_key = 'EVID-0001'
           and module.assessment_id = 'admission-proof' and module.object_key = 'APP-0025';
    """, expected_constraint="relationship_type_check")
    print(json.dumps({"canonical_object_types": len(normalized["quality"]["object_types"]),
                      "admitted_relationship_types": len(verbs),
                      "logical_application_rows": 1, "fixture_object_rows": 3}, sort_keys=True))


if __name__ == "__main__":
    main()
