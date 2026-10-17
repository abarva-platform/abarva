import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compareEcSliceV6Shadow,
  ecSliceV6ShadowContractVersion,
  planEcSliceV6Shadow,
  type ShadowObjectRow,
  type ShadowPlanInput,
  type ShadowRelationshipRow,
  type ShadowRelationshipTypeRow,
} from "../ec_slice_v6_shadow";

const uid = (number: number) =>
  `00000000-0000-4000-8000-${number.toString(16).padStart(12, "0")}`;
const assessment = uid(1);
const objectA = uid(10);
const objectB = uid(11);
const relation = uid(20);

function obj(objectId: string, type: string): ShadowObjectRow {
  return {
    id: objectId,
    tenant_key: "fixture-scope",
    assessment_id: assessment,
    object_type: type,
    display_name: `Fixture ${type}`,
    source_record_id: uid(100),
    attributes_json: {},
  };
}

function edge(
  overrides: Partial<ShadowRelationshipRow> = {},
): ShadowRelationshipRow {
  return {
    id: relation,
    tenant_key: "fixture-scope",
    assessment_id: assessment,
    from_object_id: objectA,
    to_object_id: objectB,
    relationship_type: "SUPPORTS",
    source_record_id: uid(101),
    attributes_json: {},
    ...overrides,
  };
}

function dictionary(
  overrides: Partial<ShadowRelationshipTypeRow> = {},
): ShadowRelationshipTypeRow {
  return {
    relationship_type: "SUPPORTS",
    relationship_category: "dependency",
    active: true,
    directionality: "directed",
    allowed_from_object_families: ["application"],
    allowed_to_object_families: ["capability"],
    inverse_relationship_type: "SUPPORTED_BY",
    ...overrides,
  };
}

function fixture(): ShadowPlanInput {
  const objects = [obj(objectA, "application"), obj(objectB, "capability")];
  const relationships = [edge()];
  return {
    tenantKey: "fixture-scope",
    assessmentId: assessment,
    objects,
    relationships,
    dictionary: [dictionary()],
    readerSlice: {
      tenantKey: "fixture-scope",
      assessmentId: assessment,
      objects: structuredClone(objects),
      relationships: structuredClone(relationships),
    },
  };
}

const codes = (input: ShadowPlanInput) =>
  planEcSliceV6Shadow(input).issues.map((issue) => issue.code);

test("plans explicit physical rows and exact reader comparison without readiness promotion", () => {
  const plan = planEcSliceV6Shadow(fixture());
  assert.equal(plan.graph_nodes.length, 2);
  assert.equal(plan.graph_edges.length, 1);
  assert.equal(plan.comparison.status, "match");
  assert.deepEqual(plan.comparison.edge_ids?.planned, [relation]);
  assert.deepEqual(plan.comparison.edge_set?.planned, [
    JSON.stringify([relation, objectA, "SUPPORTS", objectB]),
  ]);
  assert.equal(plan.graph_edges[0].from_node_key, plan.graph_nodes[0].node_key);
  assert.equal(plan.graph_nodes[0].materialized_from, "ecl_context_object");
  assert.equal(plan.graph_edges[0].node_resolution_state, "resolved");
  for (const state of [
    plan,
    ...plan.graph_nodes.map((row) => row.metadata),
    ...plan.graph_edges.map((row) => row.metadata),
    ...plan.graph_quality_reports.map((row) => row.metadata),
  ]) {
    assert.equal(state.quality_status, "not_ready");
    assert.equal(state.governance_status, "blocked");
    assert.equal(state.agent_ready, false);
    assert.equal(state.serving_eligible, false);
    assert.equal(state.executive_safe, false);
    assert.equal(state.adoption_state, "excluded");
  }
  assert.deepEqual(plan.issues, []);
});

test("preserves semantic types, compound attributes, source lineage, qualifiers and time without calculating values", () => {
  const input = fixture();
  input.objects[0].object_type = "program";
  input.objects[0].attributes_json = {
    canonical_semantic_type: "initiative",
    amount: 24,
    unit: "fixture-unit",
    source_file: "fixture.csv",
    source_row: 2,
    source_system: "fixture",
    value_source: "declared",
    compound: ["one", "two"],
    executive_safe: true,
  };
  input.dictionary = [
    dictionary({ allowed_from_object_families: ["initiative"] }),
  ];
  input.relationships = [
    edge({
      attributes_json: { source: { file_hash: "fixture-hash", field: "link" } },
      qualifiers_json: { scope: ["one", "two"], caveat: "Declared only" },
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
    }),
  ];
  const plan = planEcSliceV6Shadow(input);
  assert.equal(plan.graph_nodes[0].object_family, "initiative");
  assert.equal(plan.graph_edges[0].from_object_family, "initiative");
  assert.equal(plan.graph_nodes[0].metadata.object_type, "program");
  assert.deepEqual(
    plan.graph_nodes[0].metadata.attributes_json,
    input.objects[0].attributes_json,
  );
  assert.equal(plan.graph_nodes[0].source_record_id, uid(100));
  assert.equal(plan.graph_nodes[0].metadata.executive_safe, false);
  const metadata = plan.graph_edges[0].metadata;
  assert.deepEqual(
    metadata.attributes_json,
    input.relationships[0].attributes_json,
  );
  assert.deepEqual(
    metadata.qualifiers_json,
    input.relationships[0].qualifiers_json,
  );
  assert.equal(metadata.valid_from, "2026-01-01");
  assert.equal(metadata.valid_to, "2026-12-31");
  assert.equal(metadata.source_record_id, uid(101));
  assert.equal("amount" in plan.graph_quality_reports[0], false);
  assert.equal(
    "executive_readiness_score" in plan.graph_quality_reports[0],
    false,
  );
});

test("fences foreign object and edge rows before endpoint resolution without inferring nodes", () => {
  for (const foreign of [
    { tenant_key: "foreign-scope" },
    { assessment_id: uid(2) },
  ]) {
    const input = fixture();
    input.objects = input.objects.map((row, index) =>
      index === 1 ? { ...row, ...foreign } : row,
    );
    input.relationships = [edge(), edge({ id: uid(21), ...foreign })];
    const plan = planEcSliceV6Shadow(input);
    assert.equal(plan.graph_nodes.length, 1);
    assert.equal(plan.graph_edges.length, 0);
    assert.ok(plan.issues.some((issue) => issue.code.endsWith("_fence")));
    assert.ok(
      plan.issues.some((issue) => issue.code === "unresolved_endpoint"),
    );
    assert.equal(plan.graph_quality_reports[0].inferred_node_count, 0);
  }
});

test("foreign UUID collisions do not poison an otherwise valid local object", () => {
  const input = fixture();
  input.objects = [
    ...input.objects,
    { ...input.objects[0], tenant_key: "foreign-scope" },
  ];
  assert.equal(planEcSliceV6Shadow(input).graph_edges.length, 1);
});

test("fails closed on absent lineage, endpoints, malformed UUIDs, and self edges", () => {
  for (const overrides of [
    { source_record_id: null },
    { source_record_id: "not-a-uuid" },
    { from_object_id: uid(999) },
    { to_object_id: uid(999) },
    { from_object_id: "not-a-uuid" },
    { to_object_id: objectA },
    { id: "not-a-uuid" },
  ]) {
    const input = fixture();
    input.relationships = [edge(overrides)];
    const plan = planEcSliceV6Shadow(input);
    assert.equal(plan.graph_edges.length, 0, JSON.stringify(overrides));
    assert.ok(plan.issues.length);
  }
  const input = fixture();
  input.objects[0].source_record_id = null;
  const plan = planEcSliceV6Shadow(input);
  assert.equal(plan.graph_nodes.length, 1);
  assert.equal(plan.graph_edges.length, 0);
  assert.ok(codes(input).includes("missing_or_invalid_source_lineage"));
});

test("requires dictionary membership, activity, explicit family constraints and declared orientation", () => {
  for (const dict of [
    [],
    [dictionary({ active: false })],
    [dictionary({ allowed_from_object_families: [] })],
    [dictionary({ allowed_to_object_families: ["vendor"] })],
    [dictionary({ relationship_type: "supports" })],
    [dictionary({ directionality: "unknown" as "directed" })],
    [dictionary({ relationship_category: "" })],
    [dictionary({ inverse_relationship_type: "evidence caveat" })],
    [dictionary(), dictionary()],
  ]) {
    const input = fixture();
    input.dictionary = dict;
    assert.equal(planEcSliceV6Shadow(input).graph_edges.length, 0);
    assert.ok(codes(input).length);
  }
  const input = fixture();
  input.relationships = [
    edge({ from_object_id: objectB, to_object_id: objectA }),
  ];
  assert.ok(codes(input).includes("dictionary_endpoint_orientation_or_type"));
  input.relationships = [edge({ relationship_type: "Evidence needs review" })];
  assert.ok(codes(input).includes("missing_dictionary_type"));
});

test("rejects every ambiguous local object or relationship ID, including UUID case collisions", () => {
  const input = fixture();
  input.objects = [
    ...input.objects,
    { ...input.objects[0], display_name: "Conflicting assertion" },
  ];
  let plan = planEcSliceV6Shadow(input);
  assert.equal(plan.graph_nodes.length, 1);
  assert.equal(plan.graph_edges.length, 0);
  assert.ok(plan.issues.some((issue) => issue.code === "duplicate_object_id"));
  const other = fixture();
  other.relationships = [edge(), edge({ to_object_id: objectA })];
  plan = planEcSliceV6Shadow(other);
  assert.equal(plan.graph_edges.length, 0);
  assert.ok(
    plan.issues.some((issue) => issue.code === "duplicate_relationship_id"),
  );
  const caseInput = fixture();
  caseInput.objects = [
    obj(uid(0xab), "application"),
    obj(uid(0xab).toUpperCase(), "application"),
  ];
  assert.ok(codes(caseInput).includes("duplicate_object_id"));
});

test("assessment and tenant namespaces protect all physical unique keys", () => {
  const first = planEcSliceV6Shadow(fixture());
  for (const scope of [
    { assessmentId: uid(2), tenantKey: "fixture-scope" },
    { assessmentId: assessment, tenantKey: "other-scope" },
  ]) {
    const input = fixture();
    Object.assign(input, scope);
    input.objects = input.objects.map((row) => ({
      ...row,
      tenant_key: scope.tenantKey,
      assessment_id: scope.assessmentId,
    }));
    input.relationships = input.relationships.map((row) => ({
      ...row,
      tenant_key: scope.tenantKey,
      assessment_id: scope.assessmentId,
    }));
    const second = planEcSliceV6Shadow(input);
    assert.notEqual(
      first.graph_nodes[0].node_key,
      second.graph_nodes[0].node_key,
    );
    assert.notEqual(
      first.graph_edges[0].edge_key,
      second.graph_edges[0].edge_key,
    );
    assert.notEqual(
      first.graph_quality_reports[0].report_key,
      second.graph_quality_reports[0].report_key,
    );
    assert.notDeepEqual(
      [first.tenant_key, first.contract_version, first.graph_nodes[0].node_id],
      [
        second.tenant_key,
        second.contract_version,
        second.graph_nodes[0].node_id,
      ],
    );
    assert.ok(second.contract_version.includes(scope.assessmentId));
    assert.notEqual(
      second.contract_version,
      "enterprise-intelligence-template-pack-v6",
    );
  }
});

function withInverse(): ShadowPlanInput {
  const input = fixture();
  input.dictionary = [
    ...input.dictionary,
    dictionary({
      relationship_type: "SUPPORTED_BY",
      inverse_relationship_type: "SUPPORTS",
      allowed_from_object_families: ["capability"],
      allowed_to_object_families: ["application"],
    }),
  ];
  input.relationships = [
    ...input.relationships,
    edge({
      id: uid(21),
      from_object_id: objectB,
      to_object_id: objectA,
      relationship_type: "SUPPORTED_BY",
      source_record_id: uid(102),
      attributes_json: { caveat: "Second explicit source" },
    }),
  ];
  return input;
}

test("emits no generated inverse and coalesces explicit equivalent inverses with all source assertions retained", () => {
  assert.equal(planEcSliceV6Shadow(fixture()).graph_edges.length, 1);
  const input = withInverse();
  const plan = planEcSliceV6Shadow(input);
  assert.equal(plan.graph_edges.length, 1);
  const assertions = plan.graph_edges[0].metadata
    .canonical_relationships as ShadowRelationshipRow[];
  assert.deepEqual(
    assertions.map((row) => row.id),
    [relation, uid(21)],
  );
  assert.deepEqual(assertions[1].attributes_json, {
    caveat: "Second explicit source",
  });
  assert.equal(plan.graph_edges[0].source_evidence_refs.length, 2);
  assert.equal(
    plan.graph_quality_reports[0].metadata.coalesced_relationship_assertions,
    1,
  );
  assert.deepEqual(
    planEcSliceV6Shadow({
      ...input,
      relationships: [...input.relationships].reverse(),
    }),
    plan,
  );
});

test("different qualifiers or validity bounds remain distinct explicit assertions", () => {
  for (const extra of [
    { qualifiers_json: { scope: "other" } },
    { valid_from: "2026-01-01" },
  ]) {
    const input = withInverse();
    input.relationships = [
      input.relationships[0],
      { ...input.relationships[1], ...extra },
    ];
    assert.equal(planEcSliceV6Shadow(input).graph_edges.length, 2);
  }
  const input = withInverse();
  input.relationships = input.relationships.map((row, index) => ({
    ...row,
    qualifiers_json: index ? { a: 1, b: 2 } : { b: 2, a: 1 },
  }));
  assert.equal(planEcSliceV6Shadow(input).graph_edges.length, 1);
});

test("directed reverse assertions are distinct unless the dictionary declares equivalence", () => {
  const input = fixture();
  input.objects = input.objects.map((row) => ({
    ...row,
    object_type: "application",
  }));
  input.dictionary = [
    dictionary({
      relationship_type: "DEPENDS_ON",
      inverse_relationship_type: null,
      allowed_to_object_families: ["application"],
    }),
  ];
  input.relationships = [
    edge({ relationship_type: "DEPENDS_ON" }),
    edge({
      id: uid(21),
      relationship_type: "DEPENDS_ON",
      from_object_id: objectB,
      to_object_id: objectA,
    }),
  ];
  assert.equal(planEcSliceV6Shadow(input).graph_edges.length, 2);
  input.dictionary = [
    { ...input.dictionary[0], directionality: "bidirectional" },
  ];
  assert.equal(planEcSliceV6Shadow(input).graph_edges.length, 1);
});

test("rejects invalid time intervals and non-JSON metadata rather than dropping evidence", () => {
  for (const override of [
    { valid_from: "yesterday" },
    { valid_from: "2026-02-30" },
    { valid_from: "2026-01-01T24:00:00Z" },
    { valid_from: "2026-01-01T12:00:00" },
    { valid_from: "2026-12-31", valid_to: "2026-01-01" },
    { attributes_json: { undefinedValue: undefined } },
    { qualifiers_json: { numeric: NaN } },
  ]) {
    const input = fixture();
    input.relationships = [edge(override)];
    assert.equal(planEcSliceV6Shadow(input).graph_edges.length, 0);
    assert.ok(codes(input).length);
  }
  const input = fixture();
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  input.objects[0].attributes_json = cyclic;
  assert.equal(planEcSliceV6Shadow(input).graph_nodes.length, 1);
});

test("equal totals cannot hide different object IDs, relationship IDs, orientation, type or semantic family", () => {
  for (const change of [
    (input: ShadowPlanInput) => {
      input.readerSlice!.objects[0].id = uid(300);
      input.readerSlice!.relationships[0].from_object_id = uid(300);
    },
    (input: ShadowPlanInput) => {
      input.readerSlice!.relationships[0].id = uid(301);
    },
    (input: ShadowPlanInput) => {
      Object.assign(input.readerSlice!.relationships[0], {
        from_object_id: objectB,
        to_object_id: objectA,
      });
    },
    (input: ShadowPlanInput) => {
      input.readerSlice!.relationships[0].relationship_type = "DEPENDS_ON";
    },
    (input: ShadowPlanInput) => {
      input.readerSlice!.objects[0].attributes_json.canonical_semantic_type =
        "initiative";
    },
  ]) {
    const input = fixture();
    change(input);
    const comparison = planEcSliceV6Shadow(input).comparison;
    assert.equal(comparison.status, "mismatch");
    assert.deepEqual(comparison.counts?.planned, comparison.counts?.reader);
    assert.ok(
      [
        comparison.node_ids,
        comparison.edge_ids,
        comparison.edge_set,
        comparison.semantic_nodes,
      ].some((set) => !set?.equal),
    );
  }
});

test("reports extra reader inverse IDs explicitly instead of matching only coalesced totals", () => {
  const input = withInverse();
  input.readerSlice!.relationships = structuredClone(input.relationships);
  const comparison = planEcSliceV6Shadow(input).comparison;
  assert.equal(comparison.status, "mismatch");
  assert.deepEqual(comparison.edge_ids?.only_in_reader, [uid(21)]);
});

test("missing or invalid reader evidence never becomes a successful empty comparison", () => {
  const input = fixture();
  delete input.readerSlice;
  let comparison = planEcSliceV6Shadow(input).comparison;
  assert.equal(comparison.status, "not_compared");
  assert.equal(comparison.counts, null);
  for (const change of [
    (row: ShadowPlanInput) => {
      row.readerSlice!.tenantKey = "foreign-scope";
    },
    (row: ShadowPlanInput) => {
      row.readerSlice!.assessmentId = uid(2);
    },
    (row: ShadowPlanInput) => {
      row.readerSlice!.objects[0].tenant_key = "foreign-scope";
    },
    (row: ShadowPlanInput) => {
      row.readerSlice!.relationships[0].assessment_id = uid(2);
    },
    (row: ShadowPlanInput) => {
      row.readerSlice!.relationships[0].to_object_id = uid(999);
    },
    (row: ShadowPlanInput) => {
      row.readerSlice!.objects = [
        ...row.readerSlice!.objects,
        row.readerSlice!.objects[0],
      ];
    },
    (row: ShadowPlanInput) => {
      row.readerSlice!.relationships = [
        ...row.readerSlice!.relationships,
        row.readerSlice!.relationships[0],
      ];
    },
  ]) {
    const invalid = fixture();
    change(invalid);
    comparison = planEcSliceV6Shadow(invalid).comparison;
    assert.equal(comparison.status, "invalid_reader");
    assert.equal(comparison.counts, null);
    assert.ok(comparison.issues.length);
  }
});

test("quality counts declare their basis and do not hide rejected assertions in physical totals", () => {
  const input = fixture();
  input.relationships = [
    ...input.relationships,
    edge({ id: uid(22), to_object_id: uid(999) }),
  ];
  const report = planEcSliceV6Shadow(input).graph_quality_reports[0];
  assert.equal(report.total_nodes, 2);
  assert.equal(report.total_edges, 1);
  assert.equal(report.unknown_confidence_edge_count, report.total_edges);
  assert.equal(report.high_confidence_edge_count, 0);
  assert.deepEqual(report.metadata.input_counts, {
    objects: 2,
    relationships: 2,
  });
  assert.deepEqual(report.metadata.issue_counts, { unresolved_endpoint: 1 });
  assert.match(
    String(report.metadata.counting_basis),
    /Rejected rows.*counted separately/,
  );
  assert.match(String(report.metadata.source_lineage_validation), /unverified/);
  assert.equal(
    report.metadata.physical_default_values_are_not_assessments,
    true,
  );
});

test("is deterministic, leaves frozen inputs unchanged, and detaches output metadata", () => {
  const input = fixture();
  input.objects[0].attributes_json = { nested: { value: "original" } };
  const before = structuredClone(input);
  function freeze(value: unknown): void {
    if (value && typeof value === "object") {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  }
  freeze(input);
  const plan = planEcSliceV6Shadow(input);
  assert.deepEqual(plan, planEcSliceV6Shadow(input));
  assert.deepEqual(input, before);
  const attributes = plan.graph_nodes[0].metadata.attributes_json as {
    nested: { value: string };
  };
  attributes.nested.value = "changed output";
  assert.deepEqual(input, before);
  assert.equal(compareEcSliceV6Shadow(plan, input.readerSlice).status, "match");
});

test("invalid explicit scopes throw before planning; a valid empty slice stays blocked", () => {
  assert.throws(
    () => planEcSliceV6Shadow({ ...fixture(), tenantKey: " " }),
    /tenant scope/,
  );
  assert.throws(() => ecSliceV6ShadowContractVersion(""), /assessment scope/);
  const input = fixture();
  input.objects = [];
  input.relationships = [];
  input.readerSlice = { ...input, objects: [], relationships: [] };
  const plan = planEcSliceV6Shadow(input);
  assert.equal(plan.comparison.status, "match");
  assert.equal(plan.quality_status, "not_ready");
  assert.equal(plan.serving_eligible, false);
});

test("text assessments survive planning, comparison, keys and metadata with exact case", () => {
  for (const assessmentId of [
    "ec-disposable-proof-v0",
    "EC-Disposable-Proof-v0",
  ]) {
    const input = fixture();
    input.assessmentId = assessmentId;
    input.objects = input.objects.map((row) => ({
      ...row,
      assessment_id: assessmentId,
    }));
    input.relationships = input.relationships.map((row) => ({
      ...row,
      assessment_id: assessmentId,
    }));
    input.readerSlice = {
      tenantKey: input.tenantKey,
      assessmentId,
      objects: structuredClone(input.objects),
      relationships: structuredClone(input.relationships),
    };
    const plan = planEcSliceV6Shadow(input);
    assert.equal(plan.assessment_id, assessmentId);
    assert.equal(
      plan.contract_version,
      `ec-slice-v6-shadow/v1/assessment/${assessmentId}`,
    );
    assert.equal(plan.comparison.status, "match");
    assert.equal(plan.graph_nodes[0].metadata.assessment_id, assessmentId);
    assert.equal(plan.graph_edges[0].metadata.assessment_id, assessmentId);
    assert.equal(
      plan.graph_quality_reports[0].metadata.assessment_id,
      assessmentId,
    );
    const changed = {
      ...input,
      assessmentId: assessmentId.toUpperCase(),
      objects: input.objects.map((row) => ({
        ...row,
        assessment_id: assessmentId.toUpperCase(),
      })),
      relationships: input.relationships.map((row) => ({
        ...row,
        assessment_id: assessmentId.toUpperCase(),
      })),
    };
    const other = planEcSliceV6Shadow(changed);
    assert.notEqual(
      other.graph_nodes[0].node_key,
      plan.graph_nodes[0].node_key,
    );
    assert.notEqual(
      other.graph_edges[0].edge_key,
      plan.graph_edges[0].edge_key,
    );
    assert.equal(other.comparison.status, "invalid_reader");
    input.objects = [
      input.objects[0],
      { ...input.objects[1], assessment_id: assessmentId.toUpperCase() },
    ];
    assert.ok(codes(input).includes("assessment_fence"));
  }
  for (const assessmentId of [
    "",
    " ",
    "leading space",
    "fixture\n",
    "a".repeat(201),
  ]) {
    assert.throws(
      () => ecSliceV6ShadowContractVersion(assessmentId),
      /assessment scope/,
    );
  }
});

test("requires explicit semantic families rather than deriving them from private namespaces", () => {
  const input = fixture();
  input.objects[0].attributes_json = {
    canonical_semantic_type: "design:application",
  };
  assert.ok(codes(input).includes("invalid_semantic_type"));
  input.objects[0].attributes_json = {
    canonical_semantic_type: "application",
    original_semantic_type: "design:application",
  };
  const plan = planEcSliceV6Shadow(input);
  assert.equal(plan.graph_nodes[0].object_family, "application");
  assert.equal(
    (plan.graph_nodes[0].metadata.attributes_json as Record<string, unknown>)
      .original_semantic_type,
    "design:application",
  );
  assert.equal(plan.graph_edges.length, 1);
});

test("copies only structural relationship fields when the adapter supplies wider row types", () => {
  const input = fixture();
  const widerRow = { ...edge(), internalOnly: BigInt(1) };
  input.relationships = [widerRow];
  const plan = planEcSliceV6Shadow(input);
  const assertion = (
    plan.graph_edges[0].metadata.canonical_relationships as Record<
      string,
      unknown
    >[]
  )[0];
  assert.equal("internalOnly" in assertion, false);
  assert.equal(assertion.source_record_id, uid(101));
});
