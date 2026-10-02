import {
  namesAPerson,
  resolveLoadApproval,
  resolveServingApproval,
  validateManifest,
  validateManifestRegistry,
  type DatasetManifest,
  type LoadApproval,
  type LoadBinding,
  type ServingApproval,
  type ServingBinding,
} from "../dataset-manifest";

/**
 * The fixture's `client_key` must be one the schema still admits, or every
 * case below fails on that field before reaching the rule it is testing.
 *
 * It was a key the schema no longer accepts, so cases that read as tests of
 * PII/PHI handling, retrieval proof and classification were in fact reporting
 * a `client_key` enum error. That is a stale fixture, not a governance
 * regression: the live `validate:context-corpus` gate passes on real data and
 * runs on every pull request.
 *
 * Recorded rather than normalised away: the admitted set is
 * `corpus_global | meridian-health | skyharbor-air`, which is narrower than
 * the tenant registry. Whether the schema should admit the rest is a separate
 * and already-known question, and is not settled here.
 */
function manifest(over: Partial<DatasetManifest> = {}): DatasetManifest {
  return {
    dataset_id: "cloud-posture-2026q2",
    title: "Cloud posture extract",
    client_key: "meridian-health",
    source_layer: "tenant_context",
    classification: "internal",
    owner: "anand",
    source_basis: "tenant_admin_upload",
    ingestion_method: "admin_bulk_loader",
    retrieval_plan: "fts_plus_search",
    retrieval_proof_required: true,
    pii_phi_handling: null,
    expected_object_count: 180,
    approved_by: "anand",
    approved_at: "2026-06-08",
    notes: null,
    ...over,
  };
}

describe("validateManifest", () => {
  it("accepts a well-formed manifest", () => {
    const v = validateManifest(manifest());
    expect(v.ok).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  it("rejects a non-canonical client_key (real client name guard)", () => {
    const v = validateManifest(
      manifest({ client_key: "morgan-street" as never }),
    );
    expect(v.ok).toBe(false);
  });

  it("rejects sensitive data destined for shared corpus", () => {
    const v = validateManifest(
      manifest({
        client_key: "corpus_global",
        classification: "phi",
        source_layer: "industry_corpus",
        pii_phi_handling: "redacted",
      }),
    );
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/corpus_global/);
  });

  it("requires pii_phi_handling for sensitive classifications", () => {
    const v = validateManifest(
      manifest({ classification: "pii", pii_phi_handling: null }),
    );
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/pii_phi_handling/);
  });

  it("rejects unknown fields (strict schema — no silent extra keys)", () => {
    const v = validateManifest({ ...manifest(), sneaky: true });
    expect(v.ok).toBe(false);
  });

  it("rejects a malformed approved_at date", () => {
    const v = validateManifest(manifest({ approved_at: "June 8 2026" }));
    expect(v.ok).toBe(false);
  });

  it("warns when retrievable but retrieval_proof_required is false", () => {
    const v = validateManifest(
      manifest({
        retrieval_plan: "azure_ai_search",
        retrieval_proof_required: false,
      }),
    );
    expect(v.ok).toBe(true);
    expect(v.warnings.join(" ")).toMatch(/retrieval-proven/);
  });

  it("declares reviewed Move-scoped prompt context as its own retrieval plan", () => {
    const v = validateManifest(
      manifest({ retrieval_plan: "move_scoped_prompt_context" }),
    );

    expect(v.ok).toBe(true);
    expect(v.errors).toHaveLength(0);
    expect(v.warnings).toHaveLength(0);
  });

  it("resolves Move-scoped datasets from the authenticated Move registry", () => {
    const v = validateManifest(
      manifest({
        client_key: null,
        tenant_scope: "move_registry",
        retrieval_plan: "move_scoped_prompt_context",
      }),
    );

    expect(v.ok).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  it("rejects a pinned tenant key on a Move-registry-scoped dataset", () => {
    const v = validateManifest(manifest({ tenant_scope: "move_registry" }));

    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/must not pin a client_key/);
  });

  it("rejects a Move-registry scope without explicit null client_key", () => {
    const { client_key: _clientKey, ...withoutClientKey } = manifest({
      client_key: null,
      tenant_scope: "move_registry",
    });
    const v = validateManifest(withoutClientKey);

    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/move_registry scope must not pin/);
  });
});

const SOURCE_SET_HASH = "a".repeat(64);
const OTHER_SOURCE_SET_HASH = "b".repeat(64);

function loadApproval(over: Partial<LoadApproval> = {}): LoadApproval {
  return {
    approved_by: "Jordan Rivera",
    approved_at: "2026-06-09",
    assessment_id: "assessment-cloud-posture-2026q2",
    source_set_hash: SOURCE_SET_HASH,
    release_record: "docs/releases/records/2026-06-09-cloud-posture-load.md",
    ...over,
  };
}

function loadableManifest(
  over: Partial<DatasetManifest> = {},
): DatasetManifest {
  return manifest({
    ingestion_method: "operator_aca_job",
    load_approval: loadApproval(),
    ...over,
  });
}

function binding(over: Partial<LoadBinding> = {}): LoadBinding {
  const declared = loadableManifest();
  return {
    dataset_id: declared.dataset_id,
    tenant_key: declared.client_key as string,
    assessment_id: "assessment-cloud-posture-2026q2",
    source_set_hash: SOURCE_SET_HASH,
    object_count: 180,
    ingestion_method: "operator_aca_job",
    ...over,
  };
}

function refusal(manifests: unknown[], bound: LoadBinding = binding()): string {
  const decision = resolveLoadApproval(manifests, bound);
  if (decision.approved) throw new Error("expected the load to be refused");
  return decision.reasons.join(" | ");
}

describe("namesAPerson", () => {
  it.each([
    "Jordan Rivera",
    "Maria de la Cruz",
    "Seán O’Brien",
    "J. Rivera-Okafor",
  ])("accepts a person's name: %s", (name) => {
    expect(namesAPerson(name)).toBe(true);
  });

  it.each([
    "Codex synthetic lab reviewer under product-owner delegation",
    "active-task-operator-approval",
    "AbarVa product owner authorization",
    "AbarVa Product Engineering",
    "Claude Code",
    "Platform Team",
    "Release Bot",
    "jordan rivera",
    "Jordan",
    "",
  ])("refuses an agent, team, role or delegation: %s", (name) => {
    expect(namesAPerson(name)).toBe(false);
  });
});

describe("validateManifest load_approval", () => {
  it("accepts a manifest with no load approval, and one approved by a named person", () => {
    expect(validateManifest(manifest()).ok).toBe(true);
    expect(validateManifest(manifest({ load_approval: null })).ok).toBe(true);
    expect(validateManifest(loadableManifest()).ok).toBe(true);
  });

  it("rejects a load approval that does not name a person", () => {
    const v = validateManifest(
      loadableManifest({
        load_approval: loadApproval({
          approved_by:
            "Codex synthetic lab reviewer under product-owner delegation",
        }),
      }),
    );
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(
      /load_approval\.approved_by must be a named person/,
    );
  });

  it("rejects a load approval whose hash, date or release record is malformed", () => {
    for (const over of [
      { source_set_hash: "abc123" },
      { source_set_hash: SOURCE_SET_HASH.toUpperCase() },
      { approved_at: "9 June 2026" },
      { release_record: "docs/releases/records/../../../etc/passwd.md" },
      { release_record: "2026-06-09-cloud-posture-load.md" },
      { assessment_id: "" },
    ] satisfies Partial<LoadApproval>[]) {
      const v = validateManifest(
        loadableManifest({ load_approval: loadApproval(over) }),
      );
      expect({ over, ok: v.ok }).toEqual({ over, ok: false });
    }
  });

  it("rejects unknown fields inside a load approval", () => {
    const v = validateManifest(
      loadableManifest({
        load_approval: { ...loadApproval(), waived: true } as LoadApproval,
      }),
    );
    expect(v.ok).toBe(false);
  });
});

describe("resolveLoadApproval", () => {
  it("approves the one manifest that declares the dataset and binds this exact load", () => {
    const other = manifest({ dataset_id: "another-dataset-2026q2" });
    const decision = resolveLoadApproval(
      [other, loadableManifest()],
      binding(),
    );
    expect(decision).toEqual({ approved: true, approval: loadApproval() });
  });

  it("refuses when no manifest declares the dataset", () => {
    expect(
      refusal([
        manifest({ dataset_id: "another-dataset-2026q2" }),
        null,
        "x",
        7,
      ]),
    ).toMatch(
      /expected exactly one manifest declaring cloud-posture-2026q2, found 0/,
    );
  });

  it("refuses when two manifests declare the dataset", () => {
    expect(refusal([loadableManifest(), loadableManifest()])).toMatch(
      /found 2/,
    );
  });

  it("refuses a manifest that does not validate", () => {
    const agentApproved = loadableManifest({
      load_approval: loadApproval({ approved_by: "Release Bot" }),
    });
    expect(refusal([agentApproved])).toMatch(
      /manifest is invalid: load_approval\.approved_by/,
    );
    expect(refusal([{ ...loadableManifest(), sneaky: true }])).toMatch(
      /manifest is invalid/,
    );
  });

  it("refuses a manifest with no load approval", () => {
    expect(refusal([loadableManifest({ load_approval: undefined })])).toBe(
      "manifest carries no load_approval",
    );
    expect(refusal([loadableManifest({ load_approval: null })])).toBe(
      "manifest carries no load_approval",
    );
  });

  it("refuses an approval given for a different source-set hash", () => {
    expect(
      refusal(
        [loadableManifest()],
        binding({ source_set_hash: OTHER_SOURCE_SET_HASH }),
      ),
    ).toBe("load_approval is for a different source-set hash");
  });

  it("refuses an approval given for a different assessment", () => {
    expect(
      refusal(
        [loadableManifest()],
        binding({ assessment_id: "assessment-other" }),
      ),
    ).toBe("load_approval is for a different assessment");
  });

  it("refuses when the manifest's tenant is not the tenant being loaded", () => {
    expect(
      refusal([loadableManifest()], binding({ tenant_key: "another-tenant" })),
    ).toBe("manifest client_key is not the tenant being loaded");
  });

  it("refuses when the manifest declares a different way of loading", () => {
    expect(
      refusal([loadableManifest({ ingestion_method: "admin_bulk_loader" })]),
    ).toBe(
      "manifest declares ingestion_method admin_bulk_loader, not operator_aca_job",
    );
  });

  it("refuses when the object count is not the one the manifest declared", () => {
    expect(refusal([loadableManifest()], binding({ object_count: 181 }))).toBe(
      "manifest expects 180 objects, the load has 181",
    );
    expect(refusal([loadableManifest({ expected_object_count: null })])).toBe(
      "manifest expects an undeclared number of objects, the load has 180",
    );
  });

  it("reports every reason, not only the first", () => {
    const reasons = refusal(
      [loadableManifest({ load_approval: undefined })],
      binding({ tenant_key: "another-tenant", object_count: 1 }),
    );
    expect(reasons.split(" | ")).toHaveLength(3);
  });
});

describe("validateManifestRegistry", () => {
  const exists = (record: string) => record === loadApproval().release_record;

  it("accepts a registry where each dataset is declared once and approvals name real records", () => {
    expect(
      validateManifestRegistry(
        [
          { file: "a.json", raw: loadableManifest() },
          {
            file: "b.json",
            raw: manifest({ dataset_id: "another-dataset-2026q2" }),
          },
        ],
        exists,
      ),
    ).toEqual([]);
  });

  it("rejects a dataset declared by two manifests, naming both files", () => {
    expect(
      validateManifestRegistry(
        [
          { file: "a.json", raw: manifest() },
          { file: "b.json", raw: manifest() },
        ],
        exists,
      ),
    ).toEqual([
      "b.json: dataset_id cloud-posture-2026q2 is already declared by a.json",
    ]);
  });

  it("rejects a load approval whose release record does not exist", () => {
    const record = "docs/releases/records/2026-06-09-not-written.md";
    expect(
      validateManifestRegistry(
        [
          {
            file: "a.json",
            raw: loadableManifest({
              load_approval: loadApproval({ release_record: record }),
            }),
          },
        ],
        exists,
      ),
    ).toEqual([
      `a.json: load_approval.release_record ${record} does not exist`,
    ]);
  });

  it("leaves an unparseable manifest to the per-manifest check", () => {
    expect(
      validateManifestRegistry(
        [
          { file: "a.json", raw: null },
          { file: "b.json", raw: { ...manifest(), sneaky: true } },
        ],
        () => false,
      ),
    ).toEqual([]);
  });
});

function servingApproval(over: Partial<ServingApproval> = {}): ServingApproval {
  return {
    ...loadApproval(),
    approved_at: "2026-06-10",
    surface: "home",
    ...over,
  };
}

function servableManifest(
  over: Partial<DatasetManifest> = {},
): DatasetManifest {
  return loadableManifest({ serving_approval: servingApproval(), ...over });
}

function servingBinding(over: Partial<ServingBinding> = {}): ServingBinding {
  return { ...binding(), surface: "home", ...over };
}

function servingRefusal(
  manifests: unknown[],
  bound: ServingBinding = servingBinding(),
): string {
  const decision = resolveServingApproval(manifests, bound);
  if (decision.approved) throw new Error("expected serving to be refused");
  return decision.reasons.join(" | ");
}

describe("validateManifest approved_by", () => {
  // The shared fixture signs off with a single lower-case name.
  it.each([manifest().approved_by, "Jordan Rivera"])(
    "does not warn about a person: %s",
    (name) => {
      expect(
        validateManifest(manifest({ approved_by: name })).warnings,
      ).toEqual([]);
    },
  );

  it.each([
    "Codex synthetic lab reviewer under product-owner delegation",
    "active-task-operator-approval",
    "AbarVa Product Engineering",
  ])(
    "warns, without failing, when the sign-off is an agent, team or role: %s",
    (name) => {
      const v = validateManifest(manifest({ approved_by: name }));
      expect(v.ok).toBe(true);
      expect(v.warnings).toEqual([
        "approved_by names an agent, team, role or delegation, not a person",
      ]);
    },
  );
});

describe("validateManifest serving_approval", () => {
  it("accepts a serving approval for the version the load approval covers", () => {
    expect(validateManifest(servableManifest())).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  it("rejects a serving approval that does not name a person", () => {
    const v = validateManifest(
      servableManifest({
        serving_approval: servingApproval({ approved_by: "Release Bot" }),
      }),
    );
    expect(v.errors).toEqual([
      "serving_approval.approved_by must be a named person, not an agent, team, role or delegation",
    ]);
  });

  it("rejects a serving approval with no load approval", () => {
    const v = validateManifest(servableManifest({ load_approval: undefined }));
    expect(v.errors).toEqual([
      "serving_approval requires a load_approval for the same version",
    ]);
  });

  it("rejects a serving approval for a different version than the load approval", () => {
    for (const over of [
      { source_set_hash: OTHER_SOURCE_SET_HASH },
      { assessment_id: "assessment-other" },
    ] satisfies Partial<ServingApproval>[]) {
      const v = validateManifest(
        servableManifest({ serving_approval: servingApproval(over) }),
      );
      expect({ over, errors: v.errors }).toEqual({
        over,
        errors: [
          "serving_approval and load_approval are for different versions",
        ],
      });
    }
  });

  it("rejects an unknown surface and unknown fields", () => {
    expect(
      validateManifest(
        servableManifest({
          serving_approval: servingApproval({ surface: "tower" as never }),
        }),
      ).ok,
    ).toBe(false);
    expect(
      validateManifest(
        servableManifest({
          serving_approval: {
            ...servingApproval(),
            waived: true,
          } as ServingApproval,
        }),
      ).ok,
    ).toBe(false);
    const withoutSurface: Record<string, unknown> = { ...servingApproval() };
    delete withoutSurface.surface;
    expect(
      validateManifest(
        servableManifest({
          serving_approval: withoutSurface as ServingApproval,
        }),
      ).ok,
    ).toBe(false);
  });

  it("requires a serving approval's release record to exist", () => {
    const record = "docs/releases/records/2026-06-10-not-written.md";
    expect(
      validateManifestRegistry(
        [
          {
            file: "a.json",
            raw: servableManifest({
              serving_approval: servingApproval({ release_record: record }),
            }),
          },
        ],
        (path) => path === loadApproval().release_record,
      ),
    ).toEqual([
      `a.json: serving_approval.release_record ${record} does not exist`,
    ]);
  });
});

describe("resolveServingApproval", () => {
  it("approves serving a loaded version on the surface the approval names", () => {
    expect(
      resolveServingApproval([servableManifest()], servingBinding()),
    ).toEqual({
      approved: true,
      approval: servingApproval(),
    });
  });

  it("refuses when the load itself is not approved, for the load's reason", () => {
    expect(
      servingRefusal([manifest({ ingestion_method: "operator_aca_job" })]),
    ).toBe("manifest carries no load_approval");
    expect(servingRefusal([])).toMatch(/found 0/);
    expect(
      servingRefusal(
        [servableManifest()],
        servingBinding({ source_set_hash: OTHER_SOURCE_SET_HASH }),
      ),
    ).toBe("load_approval is for a different source-set hash");
  });

  it("refuses a loaded version with no serving approval", () => {
    expect(servingRefusal([loadableManifest()])).toBe(
      "manifest carries no serving_approval",
    );
    expect(servingRefusal([loadableManifest({ serving_approval: null })])).toBe(
      "manifest carries no serving_approval",
    );
  });

  it("refuses a serving approval the manifest check rejects", () => {
    expect(
      servingRefusal([
        servableManifest({
          serving_approval: servingApproval({ approved_by: "Platform Team" }),
        }),
      ]),
    ).toBe(
      "manifest is invalid: serving_approval.approved_by must be a named person, not an agent, team, role or delegation",
    );
    expect(
      servingRefusal([
        servableManifest({
          serving_approval: servingApproval({
            source_set_hash: OTHER_SOURCE_SET_HASH,
          }),
        }),
      ]),
    ).toBe(
      "manifest is invalid: serving_approval and load_approval are for different versions",
    );
  });

  it("refuses to serve on a surface the approval does not name", () => {
    expect(
      servingRefusal(
        [servableManifest()],
        servingBinding({ surface: "tower" as never }),
      ),
    ).toBe("serving_approval is for home, not tower");
  });
});
