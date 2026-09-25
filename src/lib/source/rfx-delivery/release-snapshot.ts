import { createHash } from "node:crypto";
import {
  evaluateRfxPackageRelease,
  type RfxReleaseInput,
  type RfxRecipientAuthentication,
} from "./rfx-package-release-authority";

export type RfxReleaseSnapshotInput = {
  release: RfxReleaseInput;
  packageVersionId: string;
  version: number;
  artifacts: readonly { artifactId: string; sha256: string }[];
  recipientAuthorities: readonly {
    recipientId: string;
    candidateAuthorityId: string;
    candidateTenantKey?: string;
    candidateEventId?: string;
    candidateLegalEntityId?: string;
    candidateState?: string;
    contactAuthorityId?: string;
    contactTenantKey?: string;
    contactEventId?: string;
    contactLegalEntityId?: string;
    contactId?: string;
    contactName?: string;
    contactEmail?: string;
    contactPolicy?: string;
    contactState?: string;
    contactApprovedByUserId?: string;
    contactApprovedAt?: string;
    contactEvidenceReference?: string;
    ndaAuthorityId?: string;
    ndaTenantKey?: string;
    ndaEventId?: string;
    ndaLegalEntityId?: string;
    ndaState?: string;
    waiverAuthorityId?: string;
    waiverTenantKey?: string;
    waiverEventId?: string;
    waiverLegalEntityId?: string;
    waiverState?: string;
  }[];
  approvedByUserId: string;
  approvedAt: string;
  approvalEvidenceReference: string;
};

export type RfxReleaseSnapshotResult =
  | { ready: false; defects: readonly string[] }
  | {
      ready: true;
      snapshot: {
        tenantKey: string;
        eventId: string;
        packageId: string;
        packageVersionId: string;
        version: number;
        snapshotSha256: string;
        disclosureClassification: string;
        authentication: RfxRecipientAuthentication;
        expiresAt: string;
        artifacts: readonly { artifactId: string; sha256: string }[];
        recipients: readonly {
          recipientId: string;
          legalEntityId: string;
          contactId: string;
          contactName: string;
          contactEmail: string;
          candidateAuthorityId: string;
          contactAuthorityId: string;
          ndaAuthorityId?: string;
          waiverAuthorityId?: string;
        }[];
        approvedByUserId: string;
        approvedAt: string;
        approvalEvidenceReference: string;
      };
    };

/** Pure preparation only. Callers must load and verify governed authority before persisting or issuing. */
export function prepareRfxReleaseSnapshot(
  input: RfxReleaseSnapshotInput,
): RfxReleaseSnapshotResult {
  const decision = evaluateRfxPackageRelease(input.release);
  const pkg = input.release.package;
  const defects: string[] = [];
  const filled = (value: string | undefined): boolean => Boolean(value?.trim());

  if (decision.state !== "ready_for_human_release") {
    defects.push(...decision.defects, `Release decision is ${decision.state}.`);
  }
  if (decision.recipients.some((recipient) => !recipient.releasable)) {
    defects.push("Every selected recipient must be cleared for this package.");
  }
  if (!filled(input.packageVersionId) || !Number.isSafeInteger(input.version) || input.version < 1) {
    defects.push("A positive package version and version ID are required.");
  }
  if (
    !filled(input.approvedByUserId) ||
    !filled(input.approvalEvidenceReference) ||
    !Number.isFinite(Date.parse(input.approvedAt)) ||
    Date.parse(input.approvedAt) > Date.parse(input.release.asOf)
  ) {
    defects.push("A named, evidenced approval at or before the evaluation time is required.");
  }

  const expectedArtifacts = pkg.disclosureScope.includedArtifactIds;
  const artifactIds = input.artifacts.map((artifact) => artifact.artifactId);
  if (
    new Set(expectedArtifacts).size !== expectedArtifacts.length ||
    new Set(artifactIds).size !== artifactIds.length ||
    artifactIds.length !== expectedArtifacts.length ||
    artifactIds.some((id) => !expectedArtifacts.includes(id)) ||
    input.artifacts.some((artifact) => !/^[0-9a-f]{64}$/i.test(artifact.sha256))
  ) {
    defects.push("The frozen artifact IDs and SHA-256 hashes must exactly match the package scope.");
  }

  const recipients = pkg.recipients;
  const authorityIds = input.recipientAuthorities.map((authority) => authority.recipientId);
  const recipientIds = recipients.map((recipient) => recipient.recipientId);
  if (
    new Set(recipientIds).size !== recipientIds.length ||
    new Set(authorityIds).size !== authorityIds.length ||
    authorityIds.length !== recipientIds.length ||
    authorityIds.some((id) => !recipientIds.includes(id)) ||
    input.recipientAuthorities.some((authority) =>
      !filled(authority.candidateAuthorityId) ||
      (filled(authority.ndaAuthorityId) === filled(authority.waiverAuthorityId))
    )
  ) {
    defects.push("Each selected recipient needs one candidate authority and exactly one NDA or waiver authority.");
  }

  for (const recipient of recipients) {
    const authority = input.recipientAuthorities.find((item) => item.recipientId === recipient.recipientId);
    if (!authority) continue;
    if (
      authority.candidateTenantKey !== pkg.tenantKey ||
      authority.candidateEventId !== pkg.eventId ||
      authority.candidateLegalEntityId !== recipient.legalEntityId ||
      authority.candidateState !== "accepted"
    ) {
      defects.push(`Recipient ${recipient.recipientId} lacks matching accepted candidate authority.`);
    }
    if (
      !filled(authority.contactAuthorityId) ||
      authority.contactTenantKey !== pkg.tenantKey ||
      authority.contactEventId !== pkg.eventId ||
      authority.contactLegalEntityId !== recipient.legalEntityId ||
      authority.contactId !== recipient.contactId ||
      authority.contactName !== recipient.contactName ||
      authority.contactEmail !== recipient.contactEmail ||
      authority.contactPolicy !== "contact_allowed" ||
      authority.contactState !== "approved" ||
      !filled(authority.contactApprovedByUserId) ||
      !Number.isFinite(Date.parse(authority.contactApprovedAt ?? "")) ||
      Date.parse(authority.contactApprovedAt ?? "") > Date.parse(input.release.asOf) ||
      !filled(authority.contactEvidenceReference)
    ) {
      defects.push(`Recipient ${recipient.recipientId} lacks matching named-contact approval.`);
    }
    if (authority.ndaAuthorityId && (
      authority.ndaTenantKey !== pkg.tenantKey ||
      authority.ndaEventId !== pkg.eventId ||
      authority.ndaLegalEntityId !== recipient.legalEntityId ||
      authority.ndaState !== "recorded"
    )) {
      defects.push(`Recipient ${recipient.recipientId} lacks matching executed NDA authority.`);
    }
    if (authority.waiverAuthorityId && (
      authority.waiverTenantKey !== pkg.tenantKey ||
      authority.waiverEventId !== pkg.eventId ||
      authority.waiverLegalEntityId !== recipient.legalEntityId ||
      authority.waiverState !== "approved"
    )) {
      defects.push(`Recipient ${recipient.recipientId} lacks matching NDA waiver authority.`);
    }
  }

  if (defects.length > 0) return { ready: false, defects };

  const artifacts = input.artifacts
    .map((artifact) => ({ artifactId: artifact.artifactId, sha256: artifact.sha256.toLowerCase() }))
    .sort((a, b) => a.artifactId.localeCompare(b.artifactId));
  const frozenRecipients = recipients
    .map((recipient) => {
      const authority = input.recipientAuthorities.find((item) => item.recipientId === recipient.recipientId)!;
      return {
        recipientId: recipient.recipientId,
        legalEntityId: recipient.legalEntityId,
        contactId: recipient.contactId,
        contactName: recipient.contactName,
        contactEmail: recipient.contactEmail,
        candidateAuthorityId: authority.candidateAuthorityId,
        contactAuthorityId: authority.contactAuthorityId!,
        ...(authority.ndaAuthorityId ? { ndaAuthorityId: authority.ndaAuthorityId } : {}),
        ...(authority.waiverAuthorityId ? { waiverAuthorityId: authority.waiverAuthorityId } : {}),
      };
    })
    .sort((a, b) => a.recipientId.localeCompare(b.recipientId));

  const content = {
    tenantKey: pkg.tenantKey,
    eventId: pkg.eventId,
    packageId: pkg.packageId,
    packageVersionId: input.packageVersionId,
    version: input.version,
    disclosureClassification: pkg.disclosureScope.classification,
    authentication: pkg.authentication,
    expiresAt: pkg.expiresAt,
    artifacts,
    recipients: frozenRecipients,
    approvedByUserId: input.approvedByUserId,
    approvedAt: input.approvedAt,
    approvalEvidenceReference: input.approvalEvidenceReference,
  };

  return {
    ready: true,
    snapshot: {
      ...content,
      snapshotSha256: createHash("sha256").update(JSON.stringify(content)).digest("hex"),
    },
  };
}
