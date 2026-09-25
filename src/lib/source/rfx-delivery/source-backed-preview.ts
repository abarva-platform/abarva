import {
  readAcceptedCandidatesForEvent,
  type EventCandidateAuthorityRead,
} from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import {
  readNdaAuthorityForEvent,
  type NdaAuthorityRead,
} from "@/lib/source/nda/nda-authority-repository";
import { evaluateNdaCoverage } from "@/lib/source/nda/nda-scope-authority";
import { evaluateExecutedDocumentEvidence } from "@/lib/source/nda/executed-document-evidence";
import {
  readApprovedContactsForEvent,
  type ApprovedRfxContact,
} from "./release-authority-repository";
import { prepareRfxReleaseSnapshot, type RfxReleaseSnapshotInput } from "./release-snapshot";

export type RfxAuthorityReaders = {
  readAcceptedCandidatesForEvent(input: { clientKey: string; eventId: string }): Promise<EventCandidateAuthorityRead>;
  readApprovedContactsForEvent(input: { clientKey: string; eventId: string }): Promise<{
    registryAvailable: boolean;
    approvedContacts: readonly ApprovedRfxContact[];
  }>;
  readNdaAuthorityForEvent(input: {
    clientKey: string;
    eventId: string;
    supplierLegalEntityId: string;
  }): Promise<NdaAuthorityRead>;
};

export type RfxSourceBackedPreview = {
  proposalConsistent: boolean;
  sourceAuthoritiesConsistent: boolean;
  governedReleaseReady: false;
  issued: false;
  defects: readonly string[];
  proposedSnapshotSha256?: string;
  artifactCount?: number;
  recipientCount?: number;
};

const defaultReaders: RfxAuthorityReaders = {
  readAcceptedCandidatesForEvent,
  readApprovedContactsForEvent,
  readNdaAuthorityForEvent,
};

const base = { governedReleaseReady: false, issued: false } as const;

function beforeOrAt(value: string, asOf: string): boolean {
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= Date.parse(asOf);
}

/** Read-only comparison of a proposed package with the event's current supplier, contact and NDA authority. */
export async function previewRfxReleaseAgainstAuthority(
  input: RfxReleaseSnapshotInput,
  readers: RfxAuthorityReaders = defaultReaders,
): Promise<RfxSourceBackedPreview> {
  const proposed = prepareRfxReleaseSnapshot(input);
  if (!proposed.ready) return {
    ...base,
    proposalConsistent: false,
    sourceAuthoritiesConsistent: false,
    defects: ["proposal_invalid"],
  };

  const pkg = input.release.package;
  const scope = { clientKey: pkg.tenantKey, eventId: pkg.eventId };
  let candidates: EventCandidateAuthorityRead;
  let contacts: Awaited<ReturnType<RfxAuthorityReaders["readApprovedContactsForEvent"]>>;
  try {
    [candidates, contacts] = await Promise.all([
      readers.readAcceptedCandidatesForEvent(scope),
      readers.readApprovedContactsForEvent(scope),
    ]);
  } catch {
    return { ...base, proposalConsistent: true, sourceAuthoritiesConsistent: false, defects: ["authority_unavailable"] };
  }
  if (!candidates.registryAvailable || !contacts.registryAvailable) {
    return { ...base, proposalConsistent: true, sourceAuthoritiesConsistent: false, defects: ["authority_unavailable"] };
  }

  const defects = new Set<string>();
  for (const recipient of pkg.recipients) {
    const supplied = input.recipientAuthorities.find((item) => item.recipientId === recipient.recipientId);
    const candidateMatches = candidates.acceptedCandidates.filter(
      (item) => item.authorityId === supplied?.candidateAuthorityId && item.legalEntityId === recipient.legalEntityId,
    );
    const candidate = candidateMatches.length === 1 ? candidateMatches[0] : undefined;
    if (!candidate || !beforeOrAt(candidate.acceptedAt, input.release.asOf)) {
      defects.add("candidate_authority_mismatch");
    }
    if (candidate?.contactPolicy !== "contact_allowed" ||
      input.release.supplierContactPolicies[recipient.legalEntityId] !== candidate.contactPolicy) {
      defects.add("supplier_contact_policy_mismatch");
    }

    const contactMatches = contacts.approvedContacts.filter(
      (item) => item.authorityId === supplied?.contactAuthorityId &&
        item.tenantKey === pkg.tenantKey && item.eventId === pkg.eventId &&
        item.legalEntityId === recipient.legalEntityId &&
        item.candidateAuthorityId === supplied?.candidateAuthorityId &&
        item.contactId === recipient.contactId &&
        item.contactName === recipient.contactName &&
        item.contactEmail === recipient.contactEmail,
    );
    const contact = contactMatches.length === 1 ? contactMatches[0] : undefined;
    if (!contact || contact.contactPolicy !== "contact_allowed" || contact.contactState !== "approved" ||
      contact.approvedByUserId !== supplied?.contactApprovedByUserId ||
      contact.approvedAt !== supplied?.contactApprovedAt ||
      contact.evidenceReference !== supplied?.contactEvidenceReference ||
      !beforeOrAt(contact.approvedAt, input.release.asOf)) {
      defects.add("contact_authority_mismatch");
    }

    let nda: NdaAuthorityRead;
    try {
      nda = await readers.readNdaAuthorityForEvent({ ...scope, supplierLegalEntityId: recipient.legalEntityId });
    } catch {
      defects.add("authority_unavailable");
      continue;
    }
    if (!nda.registryAvailable) {
      defects.add("authority_unavailable");
      continue;
    }
    const coverage = evaluateNdaCoverage({
      registryAvailable: true,
      tenantKey: pkg.tenantKey,
      eventId: pkg.eventId,
      supplierLegalEntityId: recipient.legalEntityId,
      publishedTemplateVersions: nda.publishedTemplateVersions,
      executedNdas: nda.executedNdas,
      waivers: nda.waivers,
      asOf: input.release.asOf,
    });
    if (coverage.state === "not_covered") {
      defects.add("nda_coverage_unproven");
    } else if (coverage.state === "covered_by_nda") {
      if (coverage.ndaId !== supplied?.ndaAuthorityId || supplied?.waiverAuthorityId) {
        defects.add("nda_authority_mismatch");
      }
      const grantingDocument = nda.executedNdas.find((item) => item.ndaId === coverage.ndaId);
      if (!grantingDocument?.signatureEvidence ||
        evaluateExecutedDocumentEvidence(grantingDocument.signatureEvidence, input.release.asOf).state !== "complete") {
        defects.add("nda_signature_unproven");
      }
    } else if (coverage.waiver?.waiverId !== supplied?.waiverAuthorityId || supplied?.ndaAuthorityId) {
      defects.add("nda_authority_mismatch");
    }
  }

  if (defects.size > 0) return {
    ...base,
    proposalConsistent: true,
    sourceAuthoritiesConsistent: false,
    defects: [...defects].sort(),
  };
  return {
    ...base,
    proposalConsistent: true,
    sourceAuthoritiesConsistent: true,
    defects: [],
    proposedSnapshotSha256: proposed.snapshot.snapshotSha256,
    artifactCount: proposed.snapshot.artifacts.length,
    recipientCount: proposed.snapshot.recipients.length,
  };
}
