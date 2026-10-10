import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { previewRfxReleaseAgainstAuthority } from "@/lib/source/rfx-delivery/source-backed-preview";
import { writePreparedRfxPackageVersion, type PreparedPackageWriteInput } from "@/lib/source/rfx-delivery/write-prepared-package-version";
import type { RfxReleaseSnapshotInput } from "@/lib/source/rfx-delivery/release-snapshot";

type RouteContext = { params: Promise<{ eventId: string }> };

const text = z.string().trim().min(1).max(500);
const dateTime = z.string().refine((value) => Number.isFinite(Date.parse(value)), "Invalid date");
const uuid = z.uuid();
const policy = z.enum(["contact_allowed", "review_required", "do_not_contact"]);
const authentication = z.discriminatedUnion("method", [
  z.object({ method: z.literal("magic_link"), expiresAt: dateTime }),
  z.object({ method: z.literal("sso"), identityProvider: text }),
  z.object({ method: z.literal("shared_secret"), secretRef: text }),
]);
const recipientAuthority = z.object({
  recipientId: text,
  candidateAuthorityId: text,
  candidateTenantKey: text.optional(),
  candidateEventId: text.optional(),
  candidateLegalEntityId: text.optional(),
  candidateState: text.optional(),
  contactAuthorityId: text.optional(),
  contactTenantKey: text.optional(),
  contactEventId: text.optional(),
  contactLegalEntityId: text.optional(),
  contactId: text.optional(),
  contactName: text.optional(),
  contactEmail: text.optional(),
  contactPolicy: text.optional(),
  contactState: text.optional(),
  contactApprovedByUserId: text.optional(),
  contactApprovedAt: dateTime.optional(),
  contactEvidenceReference: text.optional(),
  ndaAuthorityId: text.optional(),
  ndaDocumentSha256: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
  ndaTenantKey: text.optional(),
  ndaEventId: text.optional(),
  ndaLegalEntityId: text.optional(),
  ndaState: text.optional(),
  waiverAuthorityId: text.optional(),
  waiverTenantKey: text.optional(),
  waiverEventId: text.optional(),
  waiverLegalEntityId: text.optional(),
  waiverState: text.optional(),
});
const proposal = z.object({
  packageId: text,
  disclosureScope: z.object({
    classification: text,
    includedArtifactIds: z.array(uuid).min(1).max(100),
  }),
  authentication,
  expiresAt: dateTime,
  recipients: z.array(z.object({
    recipientId: text,
    legalEntityId: text,
    contactId: text,
    contactName: text,
    contactEmail: z.email(),
    contactPolicy: policy,
  })).min(1).max(100),
  supplierContactPolicies: z.record(z.string(), policy),
  artifacts: z.array(z.object({ artifactId: uuid, sha256: z.string().regex(/^[0-9a-f]{64}$/i) })).min(1).max(100),
  recipientAuthorities: z.array(recipientAuthority).min(1).max(100),
  approvalEvidenceReference: z.string().trim().min(12).max(1000),
});

export async function POST(request: Request, { params }: RouteContext): Promise<Response> {
  const { eventId } = await params;
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const [activeClient, user] = await Promise.all([
    getActiveClientRow(),
    getCurrentUser().catch(() => null),
  ]);
  if (!activeClient || canonicalTenantKey(activeClient.key) !== canonicalTenantKey(tenancy.clientKey)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const access = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!access?.canApproveSourceStages) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const reviewerId = user?.personId?.trim();
  if (!reviewerId || !user?.name?.trim()) {
    return Response.json({ ok: false, error: "reviewer_identity_required" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_proposal" }, { status: 400 });
  }
  const parsed = proposal.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_proposal" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const packet: RfxReleaseSnapshotInput = {
    release: {
      package: {
        packageId: parsed.data.packageId,
        tenantKey: activeClient.key,
        eventId,
        disclosureScope: parsed.data.disclosureScope,
        authentication: parsed.data.authentication,
        expiresAt: parsed.data.expiresAt,
        recipients: parsed.data.recipients,
        receipts: [],
      },
      supplierContactPolicies: parsed.data.supplierContactPolicies,
      asOf: now,
    },
    packageVersionId: "preflight",
    version: 1,
    artifacts: parsed.data.artifacts,
    recipientAuthorities: parsed.data.recipientAuthorities,
    approvedByUserId: reviewerId,
    approvedAt: now,
    approvalEvidenceReference: parsed.data.approvalEvidenceReference,
  };
  let preview;
  try {
    preview = await previewRfxReleaseAgainstAuthority(packet);
  } catch {
    return Response.json({ ok: false, error: "authority_unavailable" }, { status: 503 });
  }
  if (!preview.proposalConsistent || !preview.sourceAuthoritiesConsistent) {
    return Response.json({ ok: false, error: "release_not_ready", defects: preview.defects }, { status: 409 });
  }

  const writeInput: PreparedPackageWriteInput = {
    release: packet.release,
    artifacts: packet.artifacts,
    recipientAuthorities: packet.recipientAuthorities,
    approvedByUserId: packet.approvedByUserId,
    approvedAt: packet.approvedAt,
    approvalEvidenceReference: packet.approvalEvidenceReference,
  };
  const result = await writePreparedRfxPackageVersion(writeInput);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.code, defects: result.defects ?? [] }, {
      status: result.code === "authority_unavailable" ? 503 : 409,
    });
  }
  revalidatePath(`/source/new/${eventId}`);
  return Response.json({
    ok: true, packageVersionId: result.packageVersionId,
    version: result.version, snapshotSha256: result.snapshotSha256,
    releaseState: "prepared", issued: false,
  }, { status: 201 });
}
