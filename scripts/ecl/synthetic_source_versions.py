#!/usr/bin/env python3
"""Declared identity of each synthetic enterprise source version.

The generator, validator and adapter resolve a version from one registry file
and refuse a version, a dataset or a definition that it does not list. Nothing
here is read from a dataset name, a folder name or a file name.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "datasets/synthetic/source-versions.json"
DEFINITION_ROOT = ROOT / "datasets/synthetic"
GRAIN_ORIGINS = {"declared_in_definition", "generated_by_formula"}
IDENTITY_FIELDS = ("definition_path", "dataset_id", "assessment_id", "id_namespace",
                   "adapter_contract_version", "source_system")
# One version's value for these can never be another version's.
EXCLUSIVE_FIELDS = ("definition_path", "dataset_id", "assessment_id", "id_namespace")
ENTRY_FIELDS = {*IDENTITY_FIELDS, "base_version", "application_grain_origin"}


def load_registry(path: Path = REGISTRY) -> dict[str, dict[str, Any]]:
    document = json.loads(path.read_text(encoding="utf-8"))
    versions = document.get("source_versions") if isinstance(document, dict) else None
    if not isinstance(versions, dict) or not versions or document.get("schema_version") != 1:
        raise ValueError("Synthetic source-version registry is missing or has an unknown schema")
    for key, entry in versions.items():
        if not isinstance(entry, dict) or set(entry) != ENTRY_FIELDS:
            raise ValueError(f"Source version {key} does not declare exactly the registered fields")
        if any(not isinstance(entry[field], str) or not entry[field] for field in IDENTITY_FIELDS):
            raise ValueError(f"Source version {key} has an empty identity field")
        definition = (ROOT / entry["definition_path"]).resolve()
        if not definition.is_relative_to(DEFINITION_ROOT) or not definition.is_file():
            raise ValueError(f"Source version {key} definition is not a file under datasets/synthetic")
        grains = entry["application_grain_origin"]
        if (not isinstance(grains, dict) or not grains
                or any(origin not in GRAIN_ORIGINS for origin in grains.values())):
            raise ValueError(f"Source version {key} declares an unknown application grain origin")
    for field in EXCLUSIVE_FIELDS:
        values = [entry[field] for entry in versions.values()]
        if len(set(values)) != len(values):
            raise ValueError(f"Two source versions declare the same {field}")
    for key in versions:
        seen = [key]
        while (base := versions[seen[-1]]["base_version"]) is not None:
            if base not in versions or base in seen:
                raise ValueError(f"Source version {key} has an unregistered or circular base version")
            seen.append(base)
    return versions


def source_version(key: str, registry_path: Path = REGISTRY) -> dict[str, Any]:
    versions = load_registry(registry_path)
    if key not in versions:
        raise ValueError(f"Unregistered synthetic source version: {key}")
    return versions[key]


def source_version_for_dataset(dataset_id: Any, registry_path: Path = REGISTRY) -> tuple[str, dict[str, Any]]:
    for key, entry in load_registry(registry_path).items():
        if entry["dataset_id"] == dataset_id:
            return key, entry
    raise ValueError(f"Dataset is not a registered synthetic source version: {dataset_id}")


def load_definition(key: str, registry_path: Path = REGISTRY) -> dict[str, Any]:
    """The definition a registered version is built from, merged over its declared base."""
    entry = source_version(key, registry_path)
    definition = json.loads((ROOT / entry["definition_path"]).read_text(encoding="utf-8"))
    expected_base_hash = definition.pop("base_definition_sha256", None)
    base_key = entry["base_version"]
    if (expected_base_hash is None) != (base_key is None):
        raise ValueError(f"Source version {key} and its definition disagree about a base version")
    if base_key is not None:
        base_path = ROOT / source_version(base_key, registry_path)["definition_path"]
        if hashlib.sha256(base_path.read_bytes()).hexdigest() != expected_base_hash:
            raise ValueError("Versioned enterprise definition base has changed")
        definition = {**load_definition(base_key, registry_path), **definition}
    if (definition.get("dataset_id") != entry["dataset_id"]
            or definition.get("assessment_id") != entry["assessment_id"]):
        raise ValueError(f"Source version {key} definition does not declare the registered dataset and assessment")
    return definition
