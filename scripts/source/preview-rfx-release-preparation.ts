import { readFile } from "node:fs/promises";
import { readApprovedContactsForEvent } from "../../src/lib/source/rfx-delivery/release-authority-repository";
import {
  prepareRfxReleaseSnapshot,
  type RfxReleaseSnapshotInput,
} from "../../src/lib/source/rfx-delivery/release-snapshot";

// Read-only operator preview. Input is a proposed package, not authority or approval evidence.
async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath || process.argv.length !== 3) {
    throw new Error("Usage: preview-rfx-release-preparation <input.json>");
  }

  const input = JSON.parse(await readFile(inputPath, "utf8")) as RfxReleaseSnapshotInput;
  const tenantKey = input?.release?.package?.tenantKey;
  const eventId = input?.release?.package?.eventId;
  if (!tenantKey || !eventId || !Array.isArray(input.recipientAuthorities)) {
    throw new Error("Input lacks package identity or recipient authorities");
  }

  const contacts = await readApprovedContactsForEvent({ clientKey: tenantKey, eventId });
  const approved = new Map(contacts.approvedContacts.map((contact) => [contact.authorityId, contact]));
  const missing = input.recipientAuthorities.filter((recipient) => {
    const contact = approved.get(recipient.contactAuthorityId ?? "");
    return !contact || contact.candidateAuthorityId !== recipient.candidateAuthorityId ||
      contact.legalEntityId !== recipient.contactLegalEntityId ||
      contact.contactId !== recipient.contactId ||
      contact.contactName !== recipient.contactName ||
      contact.contactEmail !== recipient.contactEmail;
  });

  if (!contacts.registryAvailable || missing.length > 0) {
    process.stdout.write(JSON.stringify({
      proposalConsistent: false,
      reason: "named-contact authority unavailable or mismatched",
      missingCount: missing.length,
      governedReleaseReady: false,
      issued: false,
    }) + "\n");
    process.exitCode = 2;
    return;
  }

  const result = prepareRfxReleaseSnapshot(input);
  process.stdout.write(JSON.stringify(result.ready
    ? {
        proposalConsistent: true,
        snapshotSha256: result.snapshot.snapshotSha256,
        artifactCount: result.snapshot.artifacts.length,
        recipientCount: result.snapshot.recipients.length,
        governedReleaseReady: false,
        issued: false,
      }
    : { proposalConsistent: false, defects: result.defects, governedReleaseReady: false, issued: false }) + "\n");
  if (!result.ready) process.exitCode = 2;
}

main().catch(() => {
  process.stderr.write("RFx preparation preview could not verify its input or contact authority.\n");
  process.exitCode = 2;
});
