import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import "server-only";

import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import {
  canReadAggregate,
  type HoldingGroupClientProfile,
  loadHoldingGroupClientProfile,
} from "@/lib/auth/holding-group-policy";
import {
  inferClientKeyFromEmail,
  isKnownAgentClientLoginEmail,
} from "@/lib/client-config";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import type { TenancyCtx } from "@/lib/programs/types.db";

export type SourceAccessLevel =
  | "client_admin"
  | "source_member"
  | "source_viewer"
  | "no_source_access";

export type SourceDataAccessClass =
  | "public"
  | "internal"
  | "confidential"
  | "restricted_financial"
  | "restricted_phi_pii"
  | "admin_only";

export interface UserSourceAccessPolicy {
  userId: string;
  clientId: string;
  activeClientKey: string;
  accessLevel: SourceAccessLevel;
  sourceScope:
    | "all_client_source_events"
    | "assigned_source_events_only"
    | "none";
  sourceEventIdsAllowed: string[] | null;
  canAdminUsers: boolean;
  canCreateSourceEvents: boolean;
  canApproveSourceStages: boolean;
  canApproveAward: boolean;
  canUploadSourceArtifacts: boolean;
  canGenerateSourcingArtifacts: boolean;
  canPublishSourcingArtifacts: boolean;
  holdingGroupId: string | null;
  holdingGroupRole: HoldingGroupClientProfile["holdingGroupRole"];
  federatedScope: "none" | "l0_group_aggregate";
  canReadHoldingGroupAggregates: boolean;
  canReadSiblingTransactionGrain: boolean;
  canViewFinancialData: boolean;
  allowedDataClasses: SourceDataAccessClass[];
  deniedDataClasses: SourceDataAccessClass[];
  outputPolicy: {
    exactFinancialValues: boolean;
    financialSummaries: boolean;
    restrictedSourceIds: boolean;
    saveRestrictedContentToArtifacts: boolean;
  };
}

interface ClientMembershipRow {
  role?: string | null;
  access_level?: string | null;
  financial_visibility?: boolean | null;
  can_admin_users?: boolean | null;
  can_create_programs?: boolean | null;
  can_approve_gates?: boolean | null;
  can_create_source_events?: boolean | null;
  can_approve_source_stages?: boolean | null;
  can_approve_award?: boolean | null;
  can_upload_source_artifacts?: boolean | null;
  can_generate_sourcing_artifacts?: boolean | null;
  can_publish_sourcing_artifacts?: boolean | null;
}

interface SourceParticipantRow {
  source_event_id: string;
  client_key?: string | null;
  approval_authority?: string | null;
  source_access_level?: string | null;
  can_view_financial?: boolean | null;
  can_upload_source_artifacts?: boolean | null;
  can_generate_sourcing_artifacts?: boolean | null;
  can_publish_sourcing_artifacts?: boolean | null;
  can_approve_source_stages?: boolean | null;
  can_approve_award?: boolean | null;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

function normalizeSourceAccessLevel(
  value: string | null | undefined,
): SourceAccessLevel | null {
  if (
    value === "client_admin" ||
    value === "source_member" ||
    value === "source_viewer"
  )
    return value;
  if (value === "abarva_super_admin") return "client_admin";
  if (value === "program_member" || value === "program_viewer")
    return "no_source_access";
  return null;
}

function isClientAdminPolicy(level: SourceAccessLevel): boolean {
  return level === "client_admin";
}

function sameTenantAliasFamily(
  inferredClientKey: string | null | undefined,
  activeClientKey: string | null | undefined,
): boolean {
  if (!inferredClientKey || !activeClientKey) return false;
  const normalizedInferredClientKey = inferredClientKey.trim().toLowerCase();
  return tenantAliasesFor(activeClientKey)
    .map((alias) => alias.trim().toLowerCase())
    .includes(normalizedInferredClientKey);
}

// A Clerk tenant/client-admin is a Source admin for their OWN active client even
// with no persons-backed membership row. Mirrors the proven Moves program-access
// policy (program-access-policy.ts `isClientAdminRole`). The cross-tenant fence
// is unchanged: events stay filtered by client_key at the query layer — this only
// sets access *within* the already-resolved active client.
function isClientAdminRole(role: string | null | undefined): boolean {
  return (
    role === "maestro" ||
    role === "admin" ||
    role === "tenant_admin" ||
    role === "client_admin" ||
    role === "abarva_super_admin"
  );
}

function defaultDataClasses(
  canViewFinancialData: boolean,
): Pick<UserSourceAccessPolicy, "allowedDataClasses" | "deniedDataClasses"> {
  const allowed: SourceDataAccessClass[] = [
    "public",
    "internal",
    "confidential",
  ];
  const denied: SourceDataAccessClass[] = ["restricted_phi_pii", "admin_only"];
  if (canViewFinancialData) {
    allowed.push("restricted_financial");
  } else {
    denied.push("restricted_financial");
  }
  return { allowedDataClasses: allowed, deniedDataClasses: denied };
}

async function loadClientMembership(
  ctx: TenancyCtx,
  personId: string,
): Promise<ClientMembershipRow | null> {
  const baseSelect =
    "role, access_level, financial_visibility, can_admin_users, can_create_programs, can_approve_gates";
  const sourceSelect = `${baseSelect}, can_create_source_events, can_approve_source_stages, can_approve_award, can_upload_source_artifacts, can_generate_sourcing_artifacts, can_publish_sourcing_artifacts`;
  const query = (select: string) =>
    getAzureReadFluentClient()
      .from("person_client_memberships")
      .select(select)
      .eq("person_id", personId)
      .eq("client_id", ctx.clientId)
      .maybeSingle();

  const { data, error } = await query(sourceSelect);
  if (
    error &&
    /can_create_source_events|can_approve_source_stages|can_approve_award|can_upload_source_artifacts|can_generate_sourcing_artifacts|can_publish_sourcing_artifacts/i.test(
      error.message,
    )
  ) {
    const fallback = await query(baseSelect);
    return (fallback.data as ClientMembershipRow | null) ?? null;
  }
  return (data as ClientMembershipRow | null) ?? null;
}

async function loadSourceParticipants(
  personId: string,
  activeClientKey: string,
): Promise<SourceParticipantRow[]> {
  const clientKeyAliases = Array.from(
    new Set([activeClientKey, ...tenantAliasesFor(activeClientKey)]),
  );
  const rows: SourceParticipantRow[] = [];

  for (const clientKey of clientKeyAliases) {
    const { data, error } = await getAzureReadFluentClient()
      .from("source_event_participants")
      .select(
        "source_event_id, client_key, approval_authority, source_access_level, can_view_financial, can_upload_source_artifacts, can_generate_sourcing_artifacts, can_publish_sourcing_artifacts, can_approve_source_stages, can_approve_award",
      )
      .eq("user_id", personId)
      .eq("client_key", clientKey);

    if (error) {
      // The Source participant table may not exist in older demo databases.
      // Fail closed for non-admin users instead of throwing the Source page.
      console.warn(
        "[source-access-policy] source_event_participants unavailable:",
        error.message,
      );
      return [];
    }
    rows.push(...(((data as SourceParticipantRow[] | null) ?? []).filter((row) =>
      Boolean(row.source_event_id),
    )));
    if (rows.length > 0) break;
  }

  return rows;
}

async function resolveSourcePolicyPersonId(
  ctx: TenancyCtx,
  activeClientKey: string,
): Promise<string | null> {
  if (isUuidLike(ctx.userId)) return ctx.userId;
  const normalizedEmail = ctx.email?.trim().toLowerCase() ?? "";
  if (!normalizedEmail) return null;
  const inferredClientKey = inferClientKeyFromEmail(normalizedEmail);
  if (!sameTenantAliasFamily(inferredClientKey, activeClientKey)) return null;

  const { data } = await getAzureReadFluentClient()
    .from("persons")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  return (data as { id?: string | null } | null)?.id ?? null;
}

function inferAccessLevel(
  ctx: TenancyCtx,
  membership: ClientMembershipRow | null,
  participants: SourceParticipantRow[],
): SourceAccessLevel {
  if (isClientAdminRole(ctx.role) || isClientAdminRole(membership?.role))
    return "client_admin";
  const explicit = normalizeSourceAccessLevel(membership?.access_level);
  if (explicit) return explicit;
  if (membership?.role === "maestro" || membership?.role === "client_admin")
    return "client_admin";
  if (
    membership?.can_create_source_events ||
    membership?.can_approve_source_stages ||
    membership?.can_approve_award ||
    membership?.can_publish_sourcing_artifacts
  ) {
    return "source_member";
  }
  if (participants.length > 0) {
    return participants.some(
      (p) =>
        p.source_access_level === "source_member" ||
        p.approval_authority === "approver",
    )
      ? "source_member"
      : "source_viewer";
  }
  return "no_source_access";
}

function buildPolicy(args: {
  ctx: TenancyCtx;
  activeClientKey: string;
  accessLevel: SourceAccessLevel;
  sourceEventIdsAllowed: string[] | null;
  canViewFinancialData: boolean;
  canAdminUsers?: boolean;
  canCreateSourceEvents?: boolean;
  canApproveSourceStages?: boolean;
  canApproveAward?: boolean;
  canUploadSourceArtifacts?: boolean;
  canGenerateSourcingArtifacts?: boolean;
  canPublishSourcingArtifacts?: boolean;
  holdingGroupProfile?: HoldingGroupClientProfile | null;
}): UserSourceAccessPolicy {
  const admin = isClientAdminPolicy(args.accessLevel);
  const none = args.accessLevel === "no_source_access";
  const classes = defaultDataClasses(args.canViewFinancialData);
  const holdingGroupRole =
    args.holdingGroupProfile?.holdingGroupRole ?? "standalone";
  const canReadHoldingGroupAggregates = Boolean(
    admin &&
    args.holdingGroupProfile &&
    holdingGroupRole === "l0_sponsor" &&
    canReadAggregate({
      requester: args.holdingGroupProfile,
      target: args.holdingGroupProfile,
    }),
  );
  return {
    userId: args.ctx.userId,
    clientId: args.ctx.clientId,
    activeClientKey: args.activeClientKey,
    accessLevel: args.accessLevel,
    sourceScope: none
      ? "none"
      : args.sourceEventIdsAllowed === null
        ? "all_client_source_events"
        : "assigned_source_events_only",
    sourceEventIdsAllowed: none ? [] : args.sourceEventIdsAllowed,
    canAdminUsers: args.canAdminUsers ?? admin,
    canCreateSourceEvents: args.canCreateSourceEvents ?? admin,
    canApproveSourceStages: args.canApproveSourceStages ?? admin,
    canApproveAward: args.canApproveAward ?? admin,
    canUploadSourceArtifacts:
      args.canUploadSourceArtifacts ?? (!none && !admin),
    canGenerateSourcingArtifacts: args.canGenerateSourcingArtifacts ?? admin,
    canPublishSourcingArtifacts: args.canPublishSourcingArtifacts ?? admin,
    holdingGroupId: args.holdingGroupProfile?.holdingGroupId ?? null,
    holdingGroupRole,
    federatedScope: canReadHoldingGroupAggregates
      ? "l0_group_aggregate"
      : "none",
    canReadHoldingGroupAggregates,
    canReadSiblingTransactionGrain: false,
    canViewFinancialData: args.canViewFinancialData,
    ...classes,
    outputPolicy: {
      exactFinancialValues: args.canViewFinancialData,
      financialSummaries: true,
      restrictedSourceIds: args.canViewFinancialData,
      saveRestrictedContentToArtifacts: args.canViewFinancialData,
    },
  };
}

export async function loadUserSourceAccessPolicy(
  ctx: TenancyCtx,
  opts: { activeClientKey: string; sourceEventId?: string | null },
): Promise<UserSourceAccessPolicy> {
  if (isCanonicalClientAdminEmail(ctx.email)) {
    // Security boundary: canonical admin/test accounts get unlimited Source
    // scope ONLY when acting as their inferred home client. Apply this even
    // after Clerk is mapped to a real persons.id; otherwise a stale membership
    // row can silently strip Source create/approval rights for the pinned
    // testing tenant.
    const inferredAdminClientKey = inferClientKeyFromEmail(ctx.email);
    if (
      inferredAdminClientKey &&
      sameTenantAliasFamily(inferredAdminClientKey, opts.activeClientKey)
    ) {
      return buildPolicy({
        ctx,
        activeClientKey: opts.activeClientKey,
        accessLevel: "client_admin",
        sourceEventIdsAllowed: null,
        canViewFinancialData: false,
        canAdminUsers: true,
        canCreateSourceEvents: true,
        canApproveSourceStages: true,
        canApproveAward: true,
        canUploadSourceArtifacts: true,
        canGenerateSourcingArtifacts: true,
        canPublishSourcingArtifacts: true,
      });
    }
  }

  if (isKnownAgentClientLoginEmail(ctx.email)) {
    // Automation identities are tenant-rostered proof users. They are not
    // usually event participants, but they must be able to verify the Source
    // runtime for their own pinned tenant. The same-tenant guard preserves the
    // cross-tenant fence: an agent email never grants scope outside its roster
    // client alias family.
    const inferredAgentClientKey = inferClientKeyFromEmail(ctx.email);
    if (
      inferredAgentClientKey &&
      sameTenantAliasFamily(inferredAgentClientKey, opts.activeClientKey)
    ) {
      return buildPolicy({
        ctx,
        activeClientKey: opts.activeClientKey,
        accessLevel: "client_admin",
        sourceEventIdsAllowed: null,
        canViewFinancialData: false,
        canAdminUsers: false,
        canCreateSourceEvents: true,
        canApproveSourceStages: true,
        canApproveAward: true,
        canUploadSourceArtifacts: true,
        canGenerateSourcingArtifacts: true,
        canPublishSourcingArtifacts: true,
      });
    }
  }

  const personId = await resolveSourcePolicyPersonId(ctx, opts.activeClientKey);
  const membership = personId
    ? await loadClientMembership(ctx, personId)
    : null;
  const holdingGroupProfile = await loadHoldingGroupClientProfile(ctx);
  const membershipAccessLevel = inferAccessLevel(ctx, membership, []);
  const participants = isClientAdminPolicy(membershipAccessLevel)
    ? []
    : personId
      ? await loadSourceParticipants(personId, opts.activeClientKey)
      : [];

  const accessLevel = inferAccessLevel(ctx, membership, participants);
  const admin = isClientAdminPolicy(accessLevel);
  const scopedParticipants = opts.sourceEventId
    ? participants.filter((p) => p.source_event_id === opts.sourceEventId)
    : participants;
  const participantFinancial = scopedParticipants.some(
    (p) => p.can_view_financial === true,
  );
  const canViewFinancialData = Boolean(
    admin || membership?.financial_visibility || participantFinancial,
  );
  const sourceEventIdsAllowed = admin
    ? null
    : participants.length > 0
      ? Array.from(new Set(participants.map((p) => p.source_event_id)))
      : [];

  return buildPolicy({
    ctx,
    activeClientKey: opts.activeClientKey,
    accessLevel,
    sourceEventIdsAllowed,
    canViewFinancialData,
    canAdminUsers: Boolean(membership?.can_admin_users) && admin,
    canCreateSourceEvents:
      Boolean(membership?.can_create_source_events) ||
      admin ||
      accessLevel === "source_member",
    canApproveSourceStages:
      Boolean(membership?.can_approve_source_stages) ||
      Boolean(membership?.can_approve_gates) ||
      scopedParticipants.some(
        (p) =>
          p.can_approve_source_stages === true ||
          p.approval_authority === "approver",
      ) ||
      admin,
    canApproveAward:
      Boolean(membership?.can_approve_award) ||
      scopedParticipants.some(
        (p) =>
          p.can_approve_award === true ||
          p.approval_authority === "award_approver",
      ) ||
      admin,
    canUploadSourceArtifacts:
      !admin && scopedParticipants.length > 0
        ? scopedParticipants.some(
            (p) => p.can_upload_source_artifacts !== false,
          )
        : Boolean(membership?.can_upload_source_artifacts) ||
          admin ||
          accessLevel === "source_member",
    canGenerateSourcingArtifacts:
      Boolean(membership?.can_generate_sourcing_artifacts) ||
      scopedParticipants.some(
        (p) => p.can_generate_sourcing_artifacts === true,
      ) ||
      admin,
    canPublishSourcingArtifacts:
      Boolean(membership?.can_publish_sourcing_artifacts) ||
      scopedParticipants.some(
        (p) => p.can_publish_sourcing_artifacts === true,
      ) ||
      admin,
    holdingGroupProfile,
  });
}

export async function allowedSourceEventIdsForUser(
  ctx: TenancyCtx,
  activeClientKey: string,
): Promise<string[] | null> {
  const policy = await loadUserSourceAccessPolicy(ctx, { activeClientKey });
  return policy.sourceEventIdsAllowed;
}

export async function canReadSourceEvent(
  ctx: TenancyCtx,
  activeClientKey: string,
  sourceEventId: string,
): Promise<boolean> {
  const policy = await loadUserSourceAccessPolicy(ctx, {
    activeClientKey,
    sourceEventId,
  });
  return (
    policy.sourceEventIdsAllowed === null ||
    policy.sourceEventIdsAllowed.includes(sourceEventId)
  );
}

export function formatUserSourceAccessPolicyForPrompt(
  policy: UserSourceAccessPolicy,
): string {
  return [
    "USER ACCESS POLICY:",
    `- Client role: ${policy.accessLevel}`,
    `- Source visibility: ${policy.sourceScope}`,
    `- Allowed source event ids: ${policy.sourceEventIdsAllowed === null ? "all source events in active client" : policy.sourceEventIdsAllowed.join(", ") || "none"}`,
    `- Financial visibility: ${policy.canViewFinancialData ? "allowed" : "restricted"}`,
    `- Can create sourcing events: ${policy.canCreateSourceEvents ? "yes" : "no"}`,
    `- Can approve source stages: ${policy.canApproveSourceStages ? "yes" : "no"}`,
    `- Can approve award: ${policy.canApproveAward ? "yes" : "no"}`,
    `- Can publish sourcing artifacts: ${policy.canPublishSourcingArtifacts ? "yes" : "no"}`,
    `- Federated aggregate scope: ${policy.federatedScope}`,
    `- Sibling HoldCo transaction-grain access: ${policy.canReadSiblingTransactionGrain ? "allowed" : "denied"}`,
    `- Denied data classes: ${policy.deniedDataClasses.join(", ")}`,
    "- Cross-client rule: refuse create, read, update, approve, or admin requests outside the active client.",
    policy.canReadHoldingGroupAggregates
      ? "- Holding-group rule: L0 aggregate rollups may be summarized across child HoldCos; sibling contracts, source artifacts, banking records, and other transaction-grain evidence remain denied unless explicitly granted."
      : "- Holding-group rule: no cross-HoldCo aggregate access is granted for this Source session.",
    policy.canViewFinancialData
      ? "- Output rule: exact financial values may be shown only when present in retrieved context."
      : "- Output rule: restricted financial context may guide risk/readiness judgment, but exact vendor spend, budgets, savings, margins, ROI, payback, business-case dollars, or sensitive KPI values must not appear in chat or sourcing artifacts.",
  ].join("\n");
}
