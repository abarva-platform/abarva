#!/usr/bin/env python3
"""Normalize a versioned synthetic source set without writing a data plane.

Layer 2 output is a disposable build artifact. IDs and lineage come from owner-shaped
source rows; no object or relationship is matched by display name.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from validate_synthetic_enterprise_v1 import validate as validate_source_set


ROOT = Path(__file__).resolve().parents[2]
RELATIONSHIP_MAP_PATH = ROOT / "config/ecl/synthetic-enterprise-v1-relationship-map.json"
RELATIONSHIP_TYPES = json.loads(
    RELATIONSHIP_MAP_PATH.read_text(encoding="utf-8")
)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def canonical_relationship_type(native_type: str) -> str:
    canonical_type = RELATIONSHIP_TYPES.get(native_type)
    if canonical_type is None:
        raise ValueError(f"Unmapped relationship type: {native_type}")
    return canonical_type


def normalize(pack: Path) -> dict[str, Any]:
    quality = validate_source_set(pack)
    manifest = json.loads((pack / "enterprise_manifest.json").read_text(encoding="utf-8"))
    files = {entry["source_room_family"]: entry for entry in manifest["files"]}
    source_rows = {
        family: {row["source_row_id"]: row for row in read_csv(pack / entry["file_path"])}
        for family, entry in files.items()
    }
    objects_by_id = {obj["object_id"]: obj for obj in manifest["objects"]}
    flows_by_pair: dict[tuple[str, str], list[str]] = defaultdict(list)
    for flow in source_rows["SP13_Data_Flows_Integrations"].values():
        flows_by_pair[(flow["source_object_ref"], flow["target_object_ref"])].append(flow["source_row_id"])

    def source_ref(family: str, row_id: str) -> dict[str, str]:
        if family not in files or row_id not in source_rows[family]:
            raise ValueError(f"Source reference does not resolve: {family}/{row_id}")
        return {
            "source_family": family,
            "source_owner": family,
            "source_system": "synthetic_enterprise_v1_generator",
            "source_file_path": files[family]["file_path"],
            "source_file_sha256": files[family]["sha256"],
            "source_row_id": row_id,
            "value_source": "synthetic_generated",
        }

    objects = []
    for obj in manifest["objects"]:
        objects.append({
            "id": obj["object_id"],
            "type": obj["object_type"],
            "name": obj["name"],
            "attributes": obj["attributes"],
            "source_as_of": obj["source_as_of"],
            "provenance_class": obj["provenance_class"],
            "client_attestation_state": manifest["client_attestation_state"],
            "source": source_ref(obj["source_family"], obj["source_row_id"]),
        })

    relationships = []
    unresolved = []
    for edge in manifest["relationships"]:
        native_type = edge["relationship_type"]
        canonical_type = canonical_relationship_type(native_type)
        source_obj = objects_by_id[edge["from_object_id"]]
        supporting = [source_ref(source_obj["source_family"], source_obj["source_row_id"])]
        if native_type == "FEEDS":
            flow_ids = flows_by_pair.get((edge["from_object_id"], edge["to_object_id"]), [])
            if not flow_ids:
                raise ValueError(f"FEEDS edge has no source flow: {edge['relationship_id']}")
            supporting.extend(source_ref("SP13_Data_Flows_Integrations", flow_id) for flow_id in flow_ids)
        normalized = {
            "id": edge["relationship_id"],
            "from_object_id": edge["from_object_id"],
            "type": canonical_type,
            "native_type": native_type,
            "to_object_id": edge["to_object_id"],
            "resolution_state": edge["resolution_state"],
            "source_as_of": edge["source_as_of"],
            "provenance_class": edge["provenance_class"],
            "declaration_source": source_ref("SP17_Relationships", edge["relationship_id"]),
            "supporting_sources": supporting,
        }
        (unresolved if edge["resolution_state"] == "unresolved" else relationships).append(normalized)

    if len(objects) != quality["object_count"] or len(relationships) + len(unresolved) != quality["relationship_count"]:
        raise ValueError("Layer 2 normalization changed the source-set denominator")
    if len(unresolved) != quality["unresolved_edge_count"]:
        raise ValueError("Layer 2 normalization changed unresolved-edge count")
    if any(edge["to_object_id"] not in objects_by_id for edge in relationships):
        raise ValueError("Resolved relationship has a missing target")
    flow_refs = [ref["source_row_id"] for edge in relationships if edge["type"] == "FEEDS"
                 for ref in edge["supporting_sources"]
                 if ref["source_family"] == "SP13_Data_Flows_Integrations"]
    if len(flow_refs) != len(set(flow_refs)) or set(flow_refs) != set(source_rows["SP13_Data_Flows_Integrations"]):
        raise ValueError("Layer 2 normalization lost or duplicated source flow evidence")

    return {
        "schema_version": 1,
        "adapter_contract_version": "synthetic-enterprise-v1/layer2/v1",
        "dataset_id": manifest["dataset_id"],
        "tenant_key": manifest["tenant_key"],
        "assessment_id": manifest["assessment_id"],
        "source_set_hash": manifest["source_set_hash"],
        "relationship_map_hash": hashlib.sha256(RELATIONSHIP_MAP_PATH.read_bytes()).hexdigest(),
        "client_attestation_state": manifest["client_attestation_state"],
        "objects": objects,
        "relationships": relationships,
        "unresolved_relationships": unresolved,
        "quality": {
            "object_count": len(objects),
            "relationship_count": len(relationships),
            "unresolved_relationship_count": len(unresolved),
            "source_flow_evidence_count": len(flow_refs),
            "object_types": dict(sorted(Counter(obj["type"] for obj in objects).items())),
            "relationship_types": dict(sorted(Counter(edge["type"] for edge in relationships).items())),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pack", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    if args.out_dir.exists() and any(args.out_dir.iterdir()):
        raise ValueError(f"Refusing to overwrite nonempty adapter output: {args.out_dir}")
    normalized = normalize(args.pack.resolve())
    args.out_dir.mkdir(parents=True, exist_ok=True)
    write_json(args.out_dir / "normalized_enterprise.json", normalized)
    print(json.dumps({"dataset_id": normalized["dataset_id"], "source_set_hash": normalized["source_set_hash"],
                      **normalized["quality"]}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
