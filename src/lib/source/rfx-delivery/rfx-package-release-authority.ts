/**
 * Stage 06 — governed release of an RFx package to supplier recipients.
 *
 * The recorded decision for day one:
 *
 *   - An in-product secure package and controlled synthetic response upload.
 *   - Bind every package to canonical legal entities **and** separate named
 *     contacts.
 *   - Record disclosure scope, authentication, expiry, revocation, receipt
 *     proof, do-not-contact enforcement, and audit events.
 *   - **Real supplier contact and external package transmission remain a
 *     separate human gate.**
 *
 * So this module decides whether a package *may* be released, and to whom.
 * It never releases one. The furthest state it can reach is
 * `ready_for_human_release`, and there is no code path here that sends,
 * emails, or notifies anything — the module is a pure function returning
 * data with no callable handles.
 *
 * Two separations carry most of the weight:
 *
 *   - **A legal entity is not a contact.** A supplier the organisation may
 *     approach can still have an individual contact who must not be
 *     approached — someone who left, or who opted out. Enforcing
 *     do-not-contact only at the supplier level would approach that person.
 *   - **Released is not received.** Receipt proof is evidence a recipient
 *     produced, never something this evaluation can conjure. A package that
 *     is cleared for release has no receipt, and saying otherwise would make
 *     the audit trail a record of intentions rather than events.
 */

export type RfxDisclosureScope = {
  /** What class of material the package discloses. Must be declared. */
  classification: string;
  /** The specific artifacts the package carries. Must not be empty. */
  includedArtifactIds: readonly string[];
};

export type RfxRecipientAuthentication =
  | { method: "none" }
  | { method: "magic_link"; expiresAt: string }
  | { method: "sso"; identityProvider: string }
  | { method: "shared_secret"; secretRef: string };

export type RfxContactPolicy = "contact_allowed" | "review_required" | "do_not_contact";

export type RfxRecipient = {
  recipientId: string;
  /** Canonical vendor identity. */
  legalEntityId: string;
  /** The named person. Deliberately separate from the legal entity. */
  contactId: string;
  contactName: string;
  contactEmail: string;
  /** Policy for this individual, which may be stricter than the supplier's. */
  contactPolicy: RfxContactPolicy;
};

export type RfxReceiptProof = {
  recipientId: string;
  receivedAt: string;
  /** Evidence the recipient produced. A release cannot invent one. */
  evidenceSha256: string;
};

export type RfxPackage = {
  packageId: string;
  tenantKey: string;
  eventId: string;
  disclosureScope: RfxDisclosureScope;
  authentication: RfxRecipientAuthentication;
  expiresAt: string;
  revokedAt?: string;
  revokedReason?: string;
  recipients: readonly RfxRecipient[];
  receipts: readonly RfxReceiptProof[];
};

export type RfxReleaseInput = {
  package: RfxPackage;
  /**
   * Supplier-level policy by legal entity id, from the candidate-supplier
   * authority. A legal entity absent from this map is unknown, and unknown
   * blocks — an absent policy is not permission.
   */
  supplierContactPolicies: Readonly<Record<string, RfxContactPolicy>>;
  asOf: string;
};

export type RfxRecipientDecision = {
  recipientId: string;
  legalEntityId: string;
  contactId: string;
  releasable: boolean;
  /** Why this recipient is refused. Empty only when releasable. */
  refusals: readonly string[];
  /** Whether this recipient has produced receipt evidence. */
  receiptState: "no_receipt" | "receipt_recorded";
};

export type RfxReleaseAuditEvent = {
  packageId: string;
  tenantKey: string;
  eventId: string;
  evaluatedAt: string;
  state: RfxReleaseState;
  releasableRecipientIds: readonly string[];
  refusedRecipientIds: readonly string[];
  /** Always false here. Nothing in this module transmits. */
  externallyTransmitted: false;
};

export type RfxReleaseState =
  | "ready_for_human_release"
  | "blocked"
  | "expired"
  | "revoked";

export type RfxReleaseDecision = {
  state: RfxReleaseState;
  /** Package-level refusals, distinct from per-recipient ones. */
  defects: readonly string[];
  recipients: readonly RfxRecipientDecision[];
  /** Emitted on every evaluation, including refusals. */
  auditEvent: RfxReleaseAuditEvent;
};

const filled = (value: string | undefined): boolean => Boolean(value?.trim());

function parsedTime(value: string | undefined): number | null {
  if (!filled(value)) return null;
  const parsed = Date.parse(value!);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Package-level defects. Each is a fact the decision requires to be
 * recorded; an absent one is a refusal rather than a default.
 */
function packageDefects(input: RfxReleaseInput): string[] {
  const defects: string[] = [];
  const pkg = input.package;

  if (!filled(pkg.packageId) || !filled(pkg.tenantKey) || !filled(pkg.eventId)) {
    defects.push("The package does not declare its own identity, tenant and event.");
  }
  if (!filled(pkg.disclosureScope.classification)) {
    defects.push("No disclosure scope is recorded, so what the package reveals is unknown.");
  }
  if (pkg.disclosureScope.includedArtifactIds.length === 0) {
    defects.push("The disclosure scope names no artifacts, so the package discloses nothing identifiable.");
  }
  if (pkg.authentication.method === "none") {
    defects.push("No recipient authentication is configured; an unauthenticated package is not releasable.");
  }
  if (parsedTime(pkg.expiresAt) === null) {
    defects.push("No usable expiry is recorded, and a package without an expiry never stops being open.");
  }
  if (pkg.recipients.length === 0) {
    defects.push("The package names no recipients.");
  }
  if (parsedTime(input.asOf) === null) {
    defects.push("The evaluation time is unreadable, so expiry cannot be judged.");
  }
  return defects;
}

function recipientRefusals(
  recipient: RfxRecipient,
  input: RfxReleaseInput,
): string[] {
  const refusals: string[] = [];

  if (!filled(recipient.legalEntityId) || !filled(recipient.contactId)) {
    refusals.push("The recipient is not bound to both a legal entity and a named contact.");
  }
  if (!filled(recipient.contactName) || !filled(recipient.contactEmail)) {
    refusals.push("The named contact has no name or no address of record.");
  }

  // Supplier policy first. An entity missing from the map is unknown, and an
  // unknown policy is not permission.
  const supplierPolicy = input.supplierContactPolicies[recipient.legalEntityId];
  if (supplierPolicy === undefined) {
    refusals.push("No supplier contact policy is on record for this legal entity.");
  } else if (supplierPolicy === "do_not_contact") {
    refusals.push("The supplier is marked do-not-contact.");
  } else if (supplierPolicy === "review_required") {
    refusals.push("The supplier's contact policy requires review before any approach.");
  }

  // Then the individual, who may be stricter than their employer.
  if (recipient.contactPolicy === "do_not_contact") {
    refusals.push("This named contact is marked do-not-contact.");
  } else if (recipient.contactPolicy === "review_required") {
    refusals.push("This named contact requires review before any approach.");
  }

  return refusals;
}

export function evaluateRfxPackageRelease(
  input: RfxReleaseInput,
): RfxReleaseDecision {
  const pkg = input.package;
  const receiptsByRecipient = new Set(
    pkg.receipts
      .filter((receipt) => filled(receipt.evidenceSha256) && filled(receipt.receivedAt))
      .map((receipt) => receipt.recipientId),
  );

  const recipients: RfxRecipientDecision[] = pkg.recipients.map((recipient) => {
    const refusals = recipientRefusals(recipient, input);
    return {
      recipientId: recipient.recipientId,
      legalEntityId: recipient.legalEntityId,
      contactId: recipient.contactId,
      releasable: refusals.length === 0,
      refusals,
      // Receipt state is reported independently of releasability. A cleared
      // recipient has no receipt until one exists.
      receiptState: receiptsByRecipient.has(recipient.recipientId)
        ? "receipt_recorded"
        : "no_receipt",
    };
  });

  const defects = packageDefects(input);
  const releasableIds = recipients.filter((r) => r.releasable).map((r) => r.recipientId);
  const refusedIds = recipients.filter((r) => !r.releasable).map((r) => r.recipientId);

  const state: RfxReleaseState = (() => {
    // Revocation is a deliberate act and outranks every other outcome,
    // including expiry — a revoked package must never read as merely stale.
    if (filled(pkg.revokedAt)) return "revoked";

    // Defects outrank expiry. A package missing its authentication or its
    // disclosure scope that also happens to be stale must not read as
    // merely `expired`, because that invites re-issuing it with a later
    // date and calling the problem solved.
    if (defects.length > 0) return "blocked";

    const expiry = parsedTime(pkg.expiresAt);
    const now = parsedTime(input.asOf);
    // Both are known to parse here: an unreadable expiry or clock is
    // already a defect, and defects returned above.
    if (expiry !== null && now !== null && now > expiry) return "expired";

    if (releasableIds.length === 0) return "blocked";
    return "ready_for_human_release";
  })();

  const finalDefects =
    state === "blocked" && releasableIds.length === 0 && defects.length === 0
      ? ["No recipient on this package may be approached."]
      : defects;

  return {
    state,
    defects: finalDefects,
    recipients,
    auditEvent: {
      packageId: pkg.packageId,
      tenantKey: pkg.tenantKey,
      eventId: pkg.eventId,
      evaluatedAt: input.asOf,
      state,
      releasableRecipientIds: state === "ready_for_human_release" ? releasableIds : [],
      refusedRecipientIds: state === "ready_for_human_release" ? refusedIds : recipients.map((r) => r.recipientId),
      externallyTransmitted: false,
    },
  };
}
