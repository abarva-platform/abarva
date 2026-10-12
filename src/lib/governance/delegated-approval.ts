import { z } from "zod";
import roots from "./delegation-authority-roots.json";
import decisions from "./delegation-trusted-decisions.json";
import { namesAPerson } from "./approval-actor";
import { isDeclaredSyntheticDemoTenant } from "@/lib/tenant/synthetic-tenant-declaration";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const timestamp = z.string().datetime({ offset: true });
const actor = z
  .object({
    kind: z.literal("delegated_agent"),
    identity: z.string().min(1),
    session_id: z.string().uuid(),
  })
  .strict();
const humanReference = z
  .object({
    thread_id: z.string().uuid(),
    message_id: z.string().uuid(),
    text_sha256: sha,
  })
  .strict();
export const PrivateApprovalProofSchema = z
  .object({
    uri: z
      .string()
      .url()
      .refine((value) => {
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          /^[a-z0-9]+\.blob\.core\.windows\.net$/.test(url.hostname) &&
          !url.search &&
          !url.username &&
          !url.password &&
          url.pathname.split("/").length > 3
        );
      }, "An authenticated private Azure Blob reference without credentials is required"),
    sha256: sha,
  })
  .strict();
export const DelegatedDecisionScopeSchema = z
  .object({
    operation: z.enum(["load", "serve", "review"]),
    dataset_id: z.string().min(3),
    tenant_key: z.enum(CANONICAL_TENANT_KEYS),
    assessment_id: z.string().min(1),
    source_set_hash: sha,
    object_count: z.number().int().nonnegative(),
    ingestion_method: z.string().min(1),
    release_record: z
      .string()
      .regex(/^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/),
    surface: z.enum(["home", "tower"]).optional(),
    extra_bindings: z
      .record(z.string(), z.union([z.string(), z.number().int()]))
      .default({}),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.operation === "load" && value.surface !== undefined) ||
      (value.operation !== "load" && value.surface === undefined)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["surface"],
        message:
          "Load has no product surface; serve and review name an exact surface",
      });
    }
  });
export const DelegatedDecisionSchema = z
  .object({
    contract_version: z.literal("nexus-delegated-approval-decision/v1"),
    authority_id: z.string().min(1),
    decision_id: z.string().min(1),
    authorizer: z.string().refine(namesAPerson),
    actor,
    human_authorization_reference: humanReference,
    scope: DelegatedDecisionScopeSchema,
    decided_at: timestamp,
    expires_at: timestamp.nullable(),
    status: z.enum(["approved", "approved_with_execution_conditions"]),
    independent_human_attestation: z.literal(false),
    independent_finance_attestation: z.literal(false),
    evidence_hashes: z.record(z.string(), sha),
    execution_conditions: z.array(z.string()),
  })
  .strict();
export const DelegatedApprovalSchema = DelegatedDecisionSchema.pick({
  contract_version: true,
  authority_id: true,
  decision_id: true,
  authorizer: true,
  actor: true,
  human_authorization_reference: true,
  scope: true,
  decided_at: true,
  expires_at: true,
  independent_human_attestation: true,
  independent_finance_attestation: true,
})
  .extend({
    authority_proof: PrivateApprovalProofSchema,
    decision_proof: PrivateApprovalProofSchema,
  })
  .strict();
export type DelegatedApproval = z.infer<typeof DelegatedApprovalSchema>;
export type DelegatedDecisionScope = z.infer<
  typeof DelegatedDecisionScopeSchema
>;

const AuthoritySchema = z
  .object({
    contract_version: z.literal("nexus-delegated-approval-authority/v1"),
    authority_id: z.string(),
    status: z.enum(["active", "revoked", "completed"]),
    authorizer: z.string().refine(namesAPerson),
    actor,
    human_authorization_reference: humanReference.passthrough(),
    human_authorization_text: z.string(),
    source_message_independently_read: z.literal(true),
    valid_from: timestamp,
    expires_at: timestamp.nullable(),
    independent_human_attestation: z.literal(false),
    independent_finance_attestation: z.literal(false),
    scope: z
      .object({
        allowed_operations: z.array(z.string()),
        allowed_serving_surfaces: z.array(z.string()),
      })
      .passthrough(),
  })
  .passthrough();
const verified = new WeakSet<object>();
export interface VerifiedDelegationEvidence {
  authorityHash: string;
  decisionHash: string;
  authority: z.infer<typeof AuthoritySchema>;
  decision: z.infer<typeof DelegatedDecisionSchema>;
}
export interface ApprovalEvidenceContext {
  evidence: readonly VerifiedDelegationEvidence[];
  now?: string;
  purpose?: "execution" | "historical_read";
}

const digest = async (bytes: Uint8Array | string): Promise<string> => {
  const input =
    typeof bytes === "string"
      ? new TextEncoder().encode(bytes)
      : Uint8Array.from(bytes);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(hash), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
};
const ordered = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, ordered(item)]),
    );
  return value;
};
const equivalent = (a: unknown, b: unknown) =>
  JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const trustedDecision = (approval: DelegatedApproval) =>
  decisions.decisions.find(
    (item) =>
      item.authority_id === approval.authority_id &&
      item.decision_id === approval.decision_id &&
      item.decision_sha256 === approval.decision_proof.sha256 &&
      item.status === "active",
  );
freeze(roots);
freeze(decisions);

/** Only this decoder creates runtime-verified evidence; arbitrary JSON cannot self-authorize. */
export async function verifyDelegationProofBytes(
  declaration: DelegatedApproval,
  authorityBytes: Uint8Array,
  decisionBytes: Uint8Array,
): Promise<VerifiedDelegationEvidence> {
  const parsed = DelegatedApprovalSchema.parse(declaration);
  if (
    (await digest(authorityBytes)) !== parsed.authority_proof.sha256 ||
    (await digest(decisionBytes)) !== parsed.decision_proof.sha256
  ) {
    throw new Error("Delegation proof byte hash mismatch");
  }
  const authority = AuthoritySchema.parse(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(authorityBytes)),
  );
  const decision = DelegatedDecisionSchema.parse(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decisionBytes)),
  );
  const root = roots.roots.find(
    (item) => item.authority_id === parsed.authority_id,
  );
  if (!trustedDecision(parsed))
    throw new Error(
      "Decision is not pinned in the release-controlled trusted decision registry",
    );
  if (
    !root ||
    root.status !== "active" ||
    root.authority_sha256 !== parsed.authority_proof.sha256 ||
    root.authorizer !== authority.authorizer ||
    root.authorizer !== parsed.authorizer ||
    !equivalent(root.actor, authority.actor) ||
    !equivalent(root.actor, parsed.actor) ||
    !equivalent(
      root.human_authorization_reference,
      parsed.human_authorization_reference,
    ) ||
    authority.authority_id !== parsed.authority_id ||
    authority.status !== "active" ||
    !equivalent(
      {
        thread_id: authority.human_authorization_reference.thread_id,
        message_id: authority.human_authorization_reference.message_id,
        text_sha256: authority.human_authorization_reference.text_sha256,
      },
      parsed.human_authorization_reference,
    ) ||
    (await digest(authority.human_authorization_text)) !==
      parsed.human_authorization_reference.text_sha256
  ) {
    throw new Error(
      "Delegation authority is not a current release-controlled trusted grant",
    );
  }
  for (const key of [
    "authority_id",
    "decision_id",
    "authorizer",
    "actor",
    "human_authorization_reference",
    "scope",
    "decided_at",
    "expires_at",
  ] as const) {
    if (!equivalent(decision[key], parsed[key]))
      throw new Error(`Delegated decision proof mismatch: ${key}`);
  }
  if (
    !root.allowed_operations.includes(parsed.scope.operation) ||
    !authority.scope.allowed_operations.includes(parsed.scope.operation) ||
    (parsed.scope.surface &&
      (!root.allowed_serving_surfaces.includes(parsed.scope.surface) ||
        !authority.scope.allowed_serving_surfaces.includes(
          parsed.scope.surface,
        ))) ||
    root.tenant_scope !== "declared_synthetic" ||
    !isDeclaredSyntheticDemoTenant(parsed.scope.tenant_key)
  ) {
    throw new Error(
      "Delegated decision exceeds the authorized current synthetic workstream scope",
    );
  }
  const evidence = freeze({
    authorityHash: parsed.authority_proof.sha256,
    decisionHash: parsed.decision_proof.sha256,
    authority,
    decision,
  });
  verified.add(evidence);
  return evidence;
}

export function validateDelegatedApproval(
  declaration: DelegatedApproval,
  approvedBy: string,
  expectedScope: DelegatedDecisionScope,
  context?: ApprovalEvidenceContext,
): string[] {
  const parsed = DelegatedApprovalSchema.safeParse(declaration);
  if (!parsed.success) return ["Malformed delegated approval"];
  const approval = parsed.data;
  const evidence = context?.evidence.find(
    (item) =>
      verified.has(item) &&
      item.authorityHash === approval.authority_proof.sha256 &&
      item.decisionHash === approval.decision_proof.sha256,
  );
  if (!evidence)
    return ["Verified private authority and decision evidence is required"];
  const root = roots.roots.find(
    (item) => item.authority_id === approval.authority_id,
  );
  if (!root || root.status !== "active" || !trustedDecision(approval))
    return ["Delegation authority or decision is revoked or completed"];
  const expected = DelegatedDecisionScopeSchema.safeParse(expectedScope);
  if (
    !expected.success ||
    approvedBy !== approval.actor.identity ||
    !equivalent(approval.scope, expected.data)
  ) {
    return ["Delegated actor or exact operation/candidate scope mismatch"];
  }
  for (const key of [
    "authority_id",
    "decision_id",
    "authorizer",
    "actor",
    "human_authorization_reference",
    "scope",
    "decided_at",
    "expires_at",
  ] as const) {
    if (!equivalent(evidence.decision[key], approval[key]))
      return ["Delegated approval differs from its verified decision"];
  }
  // Retained history may be inspected as-of; a new execution always uses the runtime clock.
  const now = Date.parse(context?.purpose === "historical_read" && context.now
    ? context.now : new Date().toISOString());
  const decided = Date.parse(approval.decided_at);
  const validFrom = Date.parse(evidence.authority.valid_from);
  if (
    !Number.isFinite(now) ||
    decided > now ||
    decided < validFrom ||
    (approval.expires_at && decided >= Date.parse(approval.expires_at)) ||
    (evidence.authority.expires_at &&
      decided >= Date.parse(evidence.authority.expires_at)) ||
    (context?.purpose !== "historical_read" &&
      ((evidence.authority.expires_at &&
        now >= Date.parse(evidence.authority.expires_at)) ||
        (approval.expires_at && now >= Date.parse(approval.expires_at))))
  ) {
    return [
      "Delegated authority or decision is not valid for this execution time",
    ];
  }
  return [];
}

export async function loadDelegationEvidence(
  declarations: readonly DelegatedApproval[],
  readPrivateProof: (uri: string) => Promise<Uint8Array>,
): Promise<ApprovalEvidenceContext> {
  const evidence: VerifiedDelegationEvidence[] = [];
  for (const declaration of declarations) {
    const parsed = DelegatedApprovalSchema.parse(declaration);
    const authorityBytes = await readPrivateProof(parsed.authority_proof.uri);
    const decisionBytes = await readPrivateProof(parsed.decision_proof.uri);
    if (
      authorityBytes.byteLength > 1_000_000 ||
      decisionBytes.byteLength > 1_000_000
    ) {
      throw new Error(
        "Delegated proof exceeds the bounded approval document size",
      );
    }
    evidence.push(
      await verifyDelegationProofBytes(parsed, authorityBytes, decisionBytes),
    );
  }
  return { evidence };
}
