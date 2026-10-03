from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


ECL_SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ECL_SCRIPTS))

import generate_synthetic_enterprise_v1 as generator
import normalize_synthetic_enterprise_v1 as adapter
import synthetic_source_versions as registry
import validate_synthetic_enterprise_v1 as validator


def logical_applications(source: dict) -> int:
    return sum(row["application_grain"] != "governed_module" for row in source["source_rows"]["SP03_CMDB"])


class SourceVersionRegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.scratch = Path(self.temp.name)

    def registry_file(self, change) -> Path:
        document = json.loads(registry.REGISTRY.read_text(encoding="utf-8"))
        change(document["source_versions"])
        path = self.scratch / "registry.json"
        path.write_text(json.dumps(document), encoding="utf-8")
        return path

    def export(self, source: dict, name: str = "pack") -> Path:
        pack = self.scratch / name
        generator.export(source, pack)
        return pack

    def test_an_unlisted_version_or_dataset_is_refused(self) -> None:
        self.assertEqual(sorted(registry.load_registry()), ["v1", "v2"])
        with self.assertRaisesRegex(ValueError, "^Unregistered synthetic source version: v3$"):
            registry.source_version("v3")
        with self.assertRaisesRegex(ValueError, "^Unregistered synthetic source version: v3$"):
            registry.load_definition("v3")
        with self.assertRaisesRegex(ValueError, "^Dataset is not a registered synthetic source version: OTHER_V2$"):
            registry.source_version_for_dataset("OTHER_V2")
        for version, entry in registry.load_registry().items():
            self.assertEqual(registry.source_version_for_dataset(entry["dataset_id"]), (version, entry))

    def test_a_malformed_ambiguous_or_circular_registry_is_refused(self) -> None:
        def refused(change, message: str) -> None:
            with self.assertRaisesRegex(ValueError, message):
                registry.load_registry(self.registry_file(change))

        refused(lambda versions: versions.clear(), "unknown schema")
        unknown_schema = self.scratch / "schema.json"
        unknown_schema.write_text(json.dumps({**json.loads(registry.REGISTRY.read_text(encoding="utf-8")),
                                              "schema_version": 2}), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "unknown schema"):
            registry.load_registry(unknown_schema)
        refused(lambda versions: versions["v2"].pop("id_namespace"),
                "Source version v2 does not declare exactly the registered fields")
        refused(lambda versions: versions["v1"].update(note="unreviewed"),
                "Source version v1 does not declare exactly the registered fields")
        refused(lambda versions: versions["v1"].update(dataset_id=""),
                "Source version v1 has an empty identity field")
        refused(lambda versions: versions["v2"].update(application_grain_origin={"logical_service": "assumed"}),
                "Source version v2 declares an unknown application grain origin")
        refused(lambda versions: versions["v2"].update(definition_path="datasets/tenant-inputs/tenant-input-registry.json"),
                "Source version v2 definition is not a file under datasets/synthetic")
        refused(lambda versions: versions["v2"].update(definition_path="datasets/synthetic/absent/definition.json"),
                "Source version v2 definition is not a file under datasets/synthetic")
        for field in registry.EXCLUSIVE_FIELDS:
            refused(lambda versions, field=field: versions["v2"].update({field: versions["v1"][field]}),
                    f"Two source versions declare the same {field}")
        refused(lambda versions: versions["v2"].update(base_version="v0"),
                "Source version v2 has an unregistered or circular base version")
        refused(lambda versions: versions["v1"].update(base_version="v2"),
                "has an unregistered or circular base version")
        self.assertEqual(registry.load_registry(self.registry_file(lambda versions: None)), registry.load_registry())

    def test_a_definition_must_be_the_one_the_registry_declares(self) -> None:
        def refused(change, version: str, message: str) -> None:
            with self.assertRaisesRegex(ValueError, message):
                registry.load_definition(version, self.registry_file(change))

        # The registry names one dataset and assessment; the definition file names another.
        refused(lambda versions: versions["v1"].update(dataset_id="ANOTHER_DATASET_V1"), "v1",
                "Source version v1 definition does not declare the registered dataset and assessment")
        refused(lambda versions: versions["v2"].update(assessment_id="assessment-another"), "v2",
                "Source version v2 definition does not declare the registered dataset and assessment")
        # A version and its definition must agree on whether there is a base, and which bytes it is.
        refused(lambda versions: versions["v2"].update(base_version=None), "v2",
                "Source version v2 and its definition disagree about a base version")

        def another_base(versions: dict) -> None:
            versions["v0"] = {**versions["v1"], "definition_path": "datasets/synthetic/source-versions.json",
                              "dataset_id": "BASE_V0", "assessment_id": "assessment-base-v0", "id_namespace": "base-v0"}
            versions["v2"]["base_version"] = "v0"

        refused(another_base, "v2", "Versioned enterprise definition base has changed")
        self.assertEqual(registry.load_definition("v2")["dataset_id"], registry.source_version("v2")["dataset_id"])
        self.assertNotIn("base_definition_sha256", registry.load_definition("v2"))

    def test_the_generator_is_not_sized_to_an_application_count(self) -> None:
        definition = registry.load_definition("v2")
        kept = {function: 4 for function in definition["service_capabilities_by_function"]}
        kept["FUNC-0005"], kept["FUNC-0010"] = 5, 6
        definition["service_capabilities_by_function"] = {
            function: capabilities[:kept[function]]
            for function, capabilities in definition["service_capabilities_by_function"].items()
        }
        source = generator.build(definition)
        generator.validate(source)
        # 24 declared products and 236 generated services: a pack is not refused for its depth.
        self.assertEqual(logical_applications(source), 260)
        # The shape rules of a service definition are unchanged.
        definition["service_capabilities_by_function"]["FUNC-0001"] = ["Only", "Three", "Named"]
        with self.assertRaisesRegex(ValueError, "Logical service capabilities or suppliers are incomplete"):
            generator.build(definition)

    def test_the_validator_refuses_a_pack_that_is_not_a_registered_version(self) -> None:
        source = generator.build(registry.load_definition("v1"))
        pack = self.export(source)
        self.assertEqual(validator.validate(pack)["dataset_id"], registry.source_version("v1")["dataset_id"])
        self.assertEqual(validator.validate(pack, "v1")["object_count"], 5759)
        # The caller asked for another registered version.
        with self.assertRaisesRegex(ValueError, "^Wrong dataset version$"):
            validator.validate(pack, "v2")
        with self.assertRaisesRegex(ValueError, "^Wrong dataset version$"):
            adapter.normalize(pack, "v2")

        manifest_path = pack / "enterprise_manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        for field, value, message in (
            ("dataset_id", "ANY_OTHER_DATASET", "^Dataset is not a registered synthetic source version: ANY_OTHER_DATASET$"),
            ("dataset_id", None, "^Dataset is not a registered synthetic source version: None$"),
            ("assessment_id", "assessment-anything", "^Wrong assessment$"),
            ("assessment_id", registry.source_version("v2")["assessment_id"], "^Wrong assessment$"),
        ):
            manifest_path.write_text(json.dumps({**manifest, field: value}), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, message):
                validator.validate(pack)

    def test_the_validator_refuses_a_pack_built_from_another_definition(self) -> None:
        # Same dataset and assessment, different content: the definition is the
        # registered file, so a pack built from anything else does not match it.
        definition = registry.load_definition("v2")
        definition["service_capabilities_by_function"]["FUNC-0001"] = \
            definition["service_capabilities_by_function"]["FUNC-0001"][:7]
        with self.assertRaisesRegex(ValueError, "^Source set was built from a different definition$"):
            validator.validate(self.export(generator.build(definition)))

    def test_the_validator_pins_application_rows_and_declared_service_suppliers(self) -> None:
        def built(change) -> dict:
            source = generator.build(registry.load_definition("v2"))
            change(source)
            return source

        def changed(change, name: str) -> Path:
            return self.export(built(change), name)

        def service(source: dict) -> tuple[dict, dict]:
            row = next(row for row in source["source_rows"]["SP03_CMDB"] if row["application_grain"] == "logical_service")
            return row, next(obj for obj in source["objects"] if obj["object_id"] == row["application_id"])

        def undeclared_supplier(source: dict) -> None:
            # A supplier the definition lists, but not for this service's function.
            definition = registry.load_definition("v2")
            row, obj = service(source)
            declared = definition["service_suppliers_by_function"][row["business_function_id"]]
            other = next(name for name in definition["vendor_names"] if name not in declared)
            row["vendor_name"] = obj["attributes"]["vendor_name"] = other

        def module_cost_scope(source: dict) -> None:
            row, obj = service(source)
            row["cost_scope"] = obj["attributes"]["cost_scope"] = "module_run_allocation"

        def extra_application_row(source: dict) -> None:
            row, obj = service(source)
            fields = {**obj["attributes"], "application_id": "APP-9999", "application_name": "Unregistered grain row",
                      "application_grain": "unregistered_grain"}
            source["source_rows"]["SP03_CMDB"].append(
                {**row, **fields, "source_row_id": "APP-9999", "governed_object_id": "APP-9999"})
            source["objects"].append({**obj, "object_id": "APP-9999", "source_row_id": "APP-9999",
                                      "name": "Unregistered grain row", "attributes": fields})

        message = "^Logical service lacks a declared function supplier or independent cost scope$"
        with self.assertRaisesRegex(ValueError, message):
            validator.validate(changed(undeclared_supplier, "supplier"))
        with self.assertRaisesRegex(ValueError, message):
            validator.validate(changed(module_cost_scope, "cost-scope"))
        # 1,071 application rows: one more than products, modules and declared services.
        with self.assertRaisesRegex(ValueError, "^Application product/module grain is not unique or complete$"):
            validator.validate(changed(extra_application_row, "extra-row"))
        with self.assertRaisesRegex(ValueError, "^Application product/module grain is not unique or complete$"):
            generator.validate(built(extra_application_row))
        self.assertEqual(validator.validate(changed(lambda source: None, "unchanged"))["object_count"], 6079)

    def test_adapter_labels_are_the_registered_ones(self) -> None:
        for version, entry in registry.load_registry().items():
            source = generator.build(registry.load_definition(version))
            normalized = adapter.normalize(self.export(source, version), version)
            self.assertEqual(normalized["adapter_contract_version"], entry["adapter_contract_version"])
            self.assertEqual({obj["source"]["source_system"] for obj in normalized["objects"]}, {entry["source_system"]})
            self.assertEqual({edge["declaration_source"]["source_system"] for edge in normalized["relationships"]},
                             {entry["source_system"]})
            self.assertEqual((normalized["dataset_id"], normalized["assessment_id"]),
                             (entry["dataset_id"], entry["assessment_id"]))


if __name__ == "__main__":
    unittest.main()
