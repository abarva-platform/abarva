from __future__ import annotations

import json
import hashlib
import tempfile
import unittest
from pathlib import Path
import sys


ECL_SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ECL_SCRIPTS))

import generate_synthetic_enterprise_v1 as generator
import normalize_synthetic_enterprise_v1 as adapter


class SyntheticEnterpriseAdapterTests(unittest.TestCase):
    def test_every_source_object_and_relationship_is_normalized_with_lineage(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            pack = Path(temp) / "pack"
            source = generator.build(json.loads(generator.DEFINITION.read_text(encoding="utf-8")))
            generator.validate(source)
            generator.export(source, pack)
            normalized = adapter.normalize(pack)

        self.assertEqual(len(normalized["objects"]), len(source["objects"]))
        self.assertEqual(
            len(normalized["relationships"]) + len(normalized["unresolved_relationships"]),
            len(source["relationships"]),
        )
        self.assertEqual(len(normalized["unresolved_relationships"]), 1)
        self.assertEqual(normalized["quality"]["source_flow_row_count"], 1350)
        self.assertEqual(normalized["quality"]["object_types"]["evidence_request"], 224)
        self.assertEqual(normalized["quality"]["object_types"]["application"], 24)
        self.assertEqual(normalized["quality"]["object_types"]["application_module"], 726)
        self.assertEqual(normalized["quality"]["object_types"]["data_product"], 360)
        self.assertEqual(normalized["quality"]["object_types"]["persona"], 79)
        self.assertEqual(normalized["quality"]["object_types"]["application_deployment"], 1650)
        self.assertEqual(normalized["quality"]["object_types"]["strategic_priority"], 5)
        self.assertEqual(normalized["quality"]["object_types"]["data_flow"], 1350)
        self.assertEqual(normalized["quality"]["object_types"]["spend_line"], 480)
        self.assertEqual(normalized["quality"]["object_types"]["leadership_observation"], 42)
        self.assertEqual(normalized["quality"]["object_types"]["external_benchmark"], 1)
        self.assertEqual(normalized["quality"]["object_types"]["data_platform"] +
                         normalized["quality"]["object_types"]["infrastructure"], 220)
        self.assertEqual(normalized["quality"]["relationship_types"]["MODULE_OF"], 726)
        self.assertEqual(normalized["quality"]["relationship_types"]["EVIDENCE_REQUESTED_FOR"], 224)
        self.assertNotIn("SUPPORTS", normalized["quality"]["relationship_types"])
        self.assertGreater(normalized["quality"]["relationship_types"]["ACCOUNTABLE_TO"], 0)
        self.assertTrue(all(obj["source"]["source_row_id"] for obj in normalized["objects"]))
        self.assertTrue(all(obj["source"]["source_system"] == "synthetic_enterprise_v1_generator"
                            and obj["source"]["value_source"] == "synthetic_generated"
                            for obj in normalized["objects"]))
        self.assertTrue(all(edge["declaration_source"]["source_file_sha256"]
                            and edge["source_refs"] for edge in normalized["relationships"]))
        object_ids = {obj["id"] for obj in normalized["objects"]}
        self.assertTrue(all(edge["to_object_id"] in object_ids for edge in normalized["relationships"]))
        feed = next(edge for edge in normalized["relationships"] if edge["type"] == "FEEDS")
        self.assertTrue(any(ref["source_family"] == "SP13_Data_Flows_Integrations"
                            for ref in feed["source_refs"]))
        self.assertEqual(normalized["client_attestation_state"], "not_client_attested")
        self.assertEqual(normalized["adapter_contract_version"], "synthetic-enterprise-v1/layer2/v1")
        self.assertEqual(normalized["relationship_map_hash"],
                         hashlib.sha256(adapter.RELATIONSHIP_MAP_PATH.read_bytes()).hexdigest())

    def test_relationship_vocabulary_is_exhaustive_and_fail_closed(self) -> None:
        source = generator.build(json.loads(generator.DEFINITION.read_text(encoding="utf-8")))
        source_types = {edge["relationship_type"] for edge in source["relationships"]}
        self.assertEqual(source_types, set(adapter.RELATIONSHIP_TYPES))
        self.assertEqual({obj["object_type"] for obj in source["objects"]}, set(adapter.OBJECT_TYPES))
        with self.assertRaisesRegex(ValueError, "Unmapped relationship type"):
            adapter.canonical_relationship_type("PROPOSED_BUT_UNREVIEWED")
        with self.assertRaisesRegex(ValueError, "Unmapped source object type"):
            adapter.canonical_object_type({"object_type": "unreviewed_type", "attributes": {}})
        with self.assertRaisesRegex(ValueError, "Unmapped application grain"):
            adapter.canonical_object_type({"object_type": "application", "attributes": {"application_grain": "unknown"}})
        with self.assertRaisesRegex(ValueError, "Unmapped platform type"):
            adapter.canonical_object_type({"object_type": "platform", "attributes": {"platform_type": "unknown"}})


if __name__ == "__main__":
    unittest.main()
