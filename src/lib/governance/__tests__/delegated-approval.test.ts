import { createHash, webcrypto } from "node:crypto";
import registry from "../../../../datasets/tenant-inputs/tenant-input-registry.json";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import type {
  DelegatedApproval,
  DelegatedDecisionScope,
  ApprovalEvidenceContext,
} from "../delegated-approval";

const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");
const tenant = registry.activeTenants.find(
  (row) =>
    row.packets.length > 0 &&
    row.packets.every((packet) => packet.classification === "synthetic-demo") &&
    CANONICAL_TENANT_KEYS.includes(
      row.tenantKey as (typeof CANONICAL_TENANT_KEYS)[number],
    ),
)!.tenantKey as (typeof CANONICAL_TENANT_KEYS)[number];
const uuid = "11111111-1111-4111-8111-111111111111";
const now = "2026-10-12T15:00:00Z";

function fixture(
  options: {
    operation?: "load" | "serve";
    expired?: boolean;
    revoked?: boolean;
    untrusted?: boolean;
    dual?: boolean;
  } = {},
) {
  const actor = {
    kind: "delegated_agent" as const,
    identity: "Test delegated manager",
    session_id: uuid,
  };
  const humanText = "Delegate the exact declared synthetic workstream.\n";
  const reference = {
    thread_id: uuid,
    message_id: uuid,
    text_sha256: digest(humanText),
  };
  const scope: DelegatedDecisionScope = {
    operation: options.operation ?? "serve",
    dataset_id: "test-integrated-dataset",
    tenant_key: tenant,
    assessment_id: "test-assessment",
    source_set_hash: "a".repeat(64),
    object_count: 3,
    ingestion_method: "operator_aca_job",
    release_record: "docs/releases/records/test-approval.md",
    ...(options.operation === "load" ? {} : { surface: "tower" as const }),
    extra_bindings: {
      projection_version: 5,
      prior_assessment_id: "test-prior",
    },
  };
  const authority = {
    contract_version: "nexus-delegated-approval-authority/v1",
    authority_id: "test-authority",
    status: "active",
    authorizer: "Alex Example",
    actor,
    human_authorization_reference: reference,
    human_authorization_text: humanText,
    source_message_independently_read: true,
    valid_from: "2026-10-12T10:00:00Z",
    expires_at: null,
    independent_human_attestation: false,
    independent_finance_attestation: false,
    scope: {
      allowed_operations: ["load", "serve", "review"],
      allowed_serving_surfaces: ["home", "tower"],
    },
  };
  const declarationFields = {
    contract_version: "nexus-delegated-approval-decision/v1" as const,
    authority_id: "test-authority",
    decision_id: "test-decision",
    authorizer: "Alex Example",
    actor,
    human_authorization_reference: reference,
    scope,
    decided_at: "2026-10-12T12:00:00Z",
    expires_at: options.expired ? "2026-10-12T13:00:00Z" : null,
    independent_human_attestation: false as const,
    independent_finance_attestation: false as const,
  };
  const decision = {
    ...declarationFields,
    status: "approved_with_execution_conditions",
    evidence_hashes: { candidate: "b".repeat(64) },
    execution_conditions: [
      "Fresh preflight and guarded selector comparison are required",
    ],
  };
  const authorityBytes = new TextEncoder().encode(JSON.stringify(authority));
  const decisionBytes = new TextEncoder().encode(JSON.stringify(decision));
  const declaration: DelegatedApproval = {
    ...declarationFields,
    authority_proof: {
      uri: "https://testproof.blob.core.windows.net/private/proofs/authority.json",
      sha256: digest(authorityBytes),
    },
    decision_proof: {
      uri: "https://testproof.blob.core.windows.net/private/proofs/decision.json",
      sha256: digest(decisionBytes),
    },
  };
  const loadDecision = {
    ...decision,
    decision_id: "test-load-decision",
    scope: {
      ...scope,
      operation: "load" as const,
      surface: undefined,
      release_record: "docs/releases/records/test-load-approval.md",
      extra_bindings: { candidate_sha256: "c".repeat(64) },
    },
  };
  const loadBytes = new TextEncoder().encode(JSON.stringify(loadDecision));
  const loadDeclaration: DelegatedApproval = {
    ...declaration,
    decision_id: loadDecision.decision_id,
    scope: loadDecision.scope,
    decision_proof: {
      uri: "https://testproof.blob.core.windows.net/private/proofs/load.json",
      sha256: digest(loadBytes),
    },
  };
  jest.resetModules();
  jest.doMock("../delegation-authority-roots.json", () => ({
    roots: [
      {
        authority_id: "test-authority",
        status: options.revoked ? "revoked" : "active",
        authorizer: authority.authorizer,
        actor,
        human_authorization_reference: reference,
        authority_sha256: digest(authorityBytes),
        allowed_operations: ["load", "serve", "review"],
        allowed_serving_surfaces: ["home", "tower"],
        tenant_scope: "declared_synthetic",
        expires_at: null,
      },
    ],
  }));
  jest.doMock("../delegation-trusted-decisions.json", () => ({
    decisions: options.untrusted
      ? []
      : [
          {
            authority_id: "test-authority",
            decision_id: "test-decision",
            decision_sha256: digest(decisionBytes),
            status: "active",
          },
        ],
  }));
  if (options.dual)
    jest.doMock("../delegation-trusted-decisions.json", () => ({
      decisions: [
        {
          authority_id: "test-authority",
          decision_id: "test-decision",
          decision_sha256: digest(decisionBytes),
          status: "active",
        },
        {
          authority_id: "test-authority",
          decision_id: "test-load-decision",
          decision_sha256: digest(loadBytes),
          status: "active",
        },
      ],
    }));
  const api = jest.requireActual<typeof import("../delegated-approval")>(
    "../delegated-approval",
  );
  const manifests = jest.requireActual<typeof import("../dataset-manifest")>(
    "../dataset-manifest",
  );
  return {
    api,
    manifests,
    declaration,
    authorityBytes,
    decisionBytes,
    scope,
    loadDeclaration,
    loadBytes,
  };
}

beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
});
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
  jest.setSystemTime(new Date(now));
});
afterEach(() => {
  jest.useRealTimers();
  jest.dontMock("../delegation-authority-roots.json");
  jest.dontMock("../delegation-trusted-decisions.json");
});

describe("explicit delegated approvals", () => {
  test("separate delegated load and serving operations retain distinct run records and observations", async () => {
    const f = fixture({ dual: true });
    const manifest = {
      dataset_id: f.scope.dataset_id,
      title: "Test integrated dataset",
      client_key: tenant,
      source_layer: "signal",
      classification: "internal",
      owner: "Test steward",
      source_basis: "Test canonical records",
      ingestion_method: "operator_aca_job",
      retrieval_plan: "postgres_fts",
      retrieval_proof_required: true,
      expected_object_count: f.scope.object_count,
      approved_by: "Alex Example",
      approved_at: "2026-10-12",
      load_approval: {
        approved_by: f.loadDeclaration.actor.identity,
        approved_at: "2026-10-12",
        assessment_id: f.scope.assessment_id,
        source_set_hash: f.scope.source_set_hash,
        release_record: f.loadDeclaration.scope.release_record,
        delegated_decision: f.loadDeclaration,
      },
      serving_approval: {
        approved_by: f.declaration.actor.identity,
        approved_at: "2026-10-12",
        assessment_id: f.scope.assessment_id,
        source_set_hash: f.scope.source_set_hash,
        release_record: f.scope.release_record,
        surface: "tower",
        delegated_decision: f.declaration,
      },
    };
    const binding: import("../dataset-manifest").ServingBinding = {
      dataset_id: f.scope.dataset_id,
      tenant_key: tenant,
      assessment_id: f.scope.assessment_id,
      source_set_hash: f.scope.source_set_hash,
      object_count: f.scope.object_count,
      ingestion_method: "operator_aca_job",
      surface: "tower",
      release_record: f.scope.release_record,
      extra_bindings: f.scope.extra_bindings,
      load_release_record: f.loadDeclaration.scope.release_record,
      load_extra_bindings: f.loadDeclaration.scope.extra_bindings,
    };
    const servingReceipt = await f.api.verifyDelegationProofBytes(
      f.declaration,
      f.authorityBytes,
      f.decisionBytes,
    );
    const loadReceipt = await f.api.verifyDelegationProofBytes(
      f.loadDeclaration,
      f.authorityBytes,
      f.loadBytes,
    );
    const context = { evidence: [loadReceipt, servingReceipt] };
    expect(
      f.manifests.resolveServingApproval([manifest], binding, context).approved,
    ).toBe(true);
    expect(
      f.manifests.resolveServingApproval(
        [manifest],
        { ...binding, load_release_record: undefined },
        context,
      ).approved,
    ).toBe(false);
    expect(
      f.manifests.resolveServingApproval(
        [manifest],
        { ...binding, load_extra_bindings: {} },
        context,
      ).approved,
    ).toBe(false);
  });
  test("independent human or Finance attestation cannot be asserted by a delegate", () => {
    const f = fixture();
    expect(
      f.api.DelegatedApprovalSchema.safeParse({
        ...f.declaration,
        independent_human_attestation: true,
      }).success,
    ).toBe(false);
    expect(
      f.api.DelegatedApprovalSchema.safeParse({
        ...f.declaration,
        independent_finance_attestation: true,
      }).success,
    ).toBe(false);
  });

  test("delegated load works only with verified bytes and never with expired historical evidence", async () => {
    for (const expired of [false, true]) {
      const f = fixture({ operation: "load", expired });
      const manifest = {
        dataset_id: f.scope.dataset_id,
        title: "Test integrated dataset",
        client_key: tenant,
        source_layer: "signal",
        classification: "internal",
        owner: "Test steward",
        source_basis: "Test canonical records",
        ingestion_method: "operator_aca_job",
        retrieval_plan: "postgres_fts",
        retrieval_proof_required: true,
        expected_object_count: f.scope.object_count,
        approved_by: "Alex Example",
        approved_at: "2026-10-12",
        load_approval: {
          approved_by: f.declaration.actor.identity,
          approved_at: "2026-10-12",
          assessment_id: f.scope.assessment_id,
          source_set_hash: f.scope.source_set_hash,
          release_record: f.scope.release_record,
          delegated_decision: f.declaration,
        },
      };
      const binding = {
        release_record: f.scope.release_record,
        dataset_id: f.scope.dataset_id,
        tenant_key: f.scope.tenant_key,
        assessment_id: f.scope.assessment_id,
        source_set_hash: f.scope.source_set_hash,
        object_count: f.scope.object_count,
        ingestion_method: "operator_aca_job" as const,
        extra_bindings: f.scope.extra_bindings,
      };
      expect(
        f.manifests.resolveLoadApproval([manifest], binding).approved,
      ).toBe(false);
      const receipt = await f.api.verifyDelegationProofBytes(
        f.declaration,
        f.authorityBytes,
        f.decisionBytes,
      );
      expect(
        f.manifests.resolveLoadApproval([manifest], binding, {
          evidence: [receipt],
          now,
          purpose: "historical_read",
        }).approved,
      ).toBe(!expired);
      expect(
        f.manifests.validateManifest({
          ...manifest,
          load_approval: {
            ...manifest.load_approval,
            approved_by: "Alex Example",
          },
        }).ok,
      ).toBe(false);
    }
  });

  test("accepts certified exact bytes, actual actor and order-independent exact scope", async () => {
    const f = fixture();
    const receipt = await f.api.verifyDelegationProofBytes(
      f.declaration,
      f.authorityBytes,
      f.decisionBytes,
    );
    expect(
      f.api.validateDelegatedApproval(
        f.declaration,
        f.declaration.actor.identity,
        {
          ...f.scope,
          extra_bindings: {
            prior_assessment_id: "test-prior",
            projection_version: 5,
          },
        },
        { evidence: [receipt], now },
      ),
    ).toEqual([]);
    expect(receipt.decision.independent_human_attestation).toBe(false);
    expect(receipt.decision.independent_finance_attestation).toBe(false);
    expect(receipt.decision.execution_conditions).toHaveLength(1);
  });

  test("structural parsing and arbitrary cloned evidence cannot authorize", async () => {
    const f = fixture();
    expect(
      f.api.validateDelegatedApproval(
        f.declaration,
        f.declaration.actor.identity,
        f.scope,
      ),
    ).toEqual(["Verified private authority and decision evidence is required"]);
    const receipt = await f.api.verifyDelegationProofBytes(
      f.declaration,
      f.authorityBytes,
      f.decisionBytes,
    );
    expect(
      f.api.validateDelegatedApproval(
        f.declaration,
        f.declaration.actor.identity,
        f.scope,
        { evidence: [{ ...receipt }], now },
      ),
    ).not.toEqual([]);
  });

  test("hash-valid self-issued private decisions are not trusted", async () => {
    const f = fixture({ untrusted: true });
    await expect(
      f.api.verifyDelegationProofBytes(
        f.declaration,
        f.authorityBytes,
        f.decisionBytes,
      ),
    ).rejects.toThrow("trusted decision registry");
  });

  test("revocation stops decoding", async () => {
    const f = fixture({ revoked: true });
    await expect(
      f.api.verifyDelegationProofBytes(
        f.declaration,
        f.authorityBytes,
        f.decisionBytes,
      ),
    ).rejects.toThrow("trusted grant");
  });

  test.each(["authority", "decision"])(
    "changed %s bytes fail before parsing",
    async (which) => {
      const f = fixture();
      await expect(
        f.api.verifyDelegationProofBytes(
          f.declaration,
          which === "authority"
            ? new TextEncoder().encode("{}")
            : f.authorityBytes,
          which === "decision"
            ? new TextEncoder().encode("{}")
            : f.decisionBytes,
        ),
      ).rejects.toThrow("byte hash mismatch");
    },
  );

  test("verified evidence is deeply immutable", async () => {
    const f = fixture();
    const receipt = await f.api.verifyDelegationProofBytes(
      f.declaration,
      f.authorityBytes,
      f.decisionBytes,
    );
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(Object.isFrozen(receipt.decision.scope.extra_bindings)).toBe(true);
    expect(() => {
      receipt.decision.scope.object_count = 99;
    }).toThrow();
  });

  test.each([
    "object_count",
    "tenant_key",
    "source_set_hash",
    "assessment_id",
    "surface",
    "extra_bindings",
    "release_record",
  ])("independently observed %s drift refuses approval", async (field) => {
    const f = fixture();
    const receipt = await f.api.verifyDelegationProofBytes(
      f.declaration,
      f.authorityBytes,
      f.decisionBytes,
    );
    const expected = {
      ...f.scope,
      [field]:
        field === "object_count"
          ? 99
          : field === "extra_bindings"
            ? {}
            : "changed",
    };
    expect(
      f.api.validateDelegatedApproval(
        f.declaration,
        f.declaration.actor.identity,
        expected as DelegatedDecisionScope,
        { evidence: [receipt], now },
      ),
    ).not.toEqual([]);
  });

  test("delegate cannot be relabeled as a human reviewer", async () => {
    const f = fixture();
    const receipt = await f.api.verifyDelegationProofBytes(
      f.declaration,
      f.authorityBytes,
      f.decisionBytes,
    );
    expect(
      f.api.validateDelegatedApproval(f.declaration, "Alex Example", f.scope, {
        evidence: [receipt],
        now,
      }),
    ).not.toEqual([]);
  });

  test("nullable expiry is valid; explicit expiry blocks new execution but not historical inspection", async () => {
    const f = fixture({ expired: true });
    const receipt = await f.api.verifyDelegationProofBytes(
      f.declaration,
      f.authorityBytes,
      f.decisionBytes,
    );
    const context: ApprovalEvidenceContext = { evidence: [receipt], now };
    expect(
      f.api.validateDelegatedApproval(
        f.declaration,
        f.declaration.actor.identity,
        f.scope,
        context,
      ),
    ).not.toEqual([]);
    expect(
      f.api.validateDelegatedApproval(
        f.declaration,
        f.declaration.actor.identity,
        f.scope,
        { ...context, purpose: "historical_read" },
      ),
    ).toEqual([]);
    expect(
      f.api.validateDelegatedApproval(
        f.declaration,
        f.declaration.actor.identity,
        f.scope,
        { ...context, now: "2026-10-12T11:00:00Z", purpose: "historical_read" },
      ),
    ).not.toEqual([]);
  });

  test("private references reject query credentials and unsupported storage", () => {
    const f = fixture();
    for (const uri of [
      "https://testproof.blob.core.windows.net/private/p.json?sig=secret",
      "https://example.com/p.json",
      "http://testproof.blob.core.windows.net/private/p.json",
    ]) {
      expect(
        f.api.PrivateApprovalProofSchema.safeParse({
          uri,
          sha256: "a".repeat(64),
        }).success,
      ).toBe(false);
    }
  });

  test("legacy named-human load plus explicit delegated serving requires verified exact observations", async () => {
    const f = fixture();
    const manifest = {
      dataset_id: f.scope.dataset_id,
      title: "Test integrated dataset",
      client_key: tenant,
      source_layer: "signal",
      classification: "internal",
      owner: "Test steward",
      source_basis: "Test canonical records",
      ingestion_method: f.scope.ingestion_method,
      retrieval_plan: "postgres_fts",
      retrieval_proof_required: true,
      expected_object_count: f.scope.object_count,
      approved_by: "Alex Example",
      approved_at: "2026-10-12",
      load_approval: {
        approved_by: "Alex Example",
        approved_at: "2026-10-12",
        assessment_id: f.scope.assessment_id,
        source_set_hash: f.scope.source_set_hash,
        release_record: f.scope.release_record,
      },
      serving_approval: {
        approved_by: f.declaration.actor.identity,
        approved_at: "2026-10-12",
        assessment_id: f.scope.assessment_id,
        source_set_hash: f.scope.source_set_hash,
        release_record: f.scope.release_record,
        surface: "tower",
        delegated_decision: f.declaration,
      },
    };
    expect(f.manifests.validateManifest(manifest).ok).toBe(true);
    const binding = {
      release_record: f.scope.release_record,
      dataset_id: f.scope.dataset_id,
      tenant_key: f.scope.tenant_key,
      assessment_id: f.scope.assessment_id,
      source_set_hash: f.scope.source_set_hash,
      object_count: f.scope.object_count,
      ingestion_method: f.scope.ingestion_method,
      surface: f.scope.surface,
      extra_bindings: f.scope.extra_bindings,
    };
    expect(
      f.manifests.resolveServingApproval(
        [manifest],
        binding as import("../dataset-manifest").ServingBinding,
      ).approved,
    ).toBe(false);
    const evidence = await f.api.loadDelegationEvidence(
      [f.declaration],
      async (uri) =>
        uri === f.declaration.authority_proof.uri
          ? f.authorityBytes
          : f.decisionBytes,
    );
    expect(
      f.manifests.resolveServingApproval(
        [manifest],
        binding as import("../dataset-manifest").ServingBinding,
        { ...evidence, now },
      ).approved,
    ).toBe(true);
    expect(
      f.manifests.resolveServingApproval(
        [manifest],
        {
          ...binding,
          extra_bindings: {},
        } as import("../dataset-manifest").ServingBinding,
        { ...evidence, now },
      ).approved,
    ).toBe(false);
  });
});
