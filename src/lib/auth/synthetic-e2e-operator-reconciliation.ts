import "server-only";
import { getAzureWriteFluentClient, resolveDatabaseUrlCandidates, withAzureWriteTransaction } from "@/lib/data-plane/postgresCompat";
import type { ProvisionInput, ProvisionResult } from "./operator-persona-provisioning";

export interface UnboundOperatorPerson {
  id: string; name: string; email: string; role: string;
  primary_role: string; graph_node_id: string; updated_at: string | Date; xmin: string | number;
}

/** Server authority is additional to the email used for identity deduplication. */
export function hasSyntheticOperatorAuthority(input: ProvisionInput): boolean {
  const a = input.syntheticE2eAuthority;
  return a?.source === "authenticated_clerk_profile" && a.clerkUserId === input.clerkUserId &&
    input.clerkUserId.startsWith("user_") && a.email === input.email?.trim().toLowerCase() &&
    a.approvalRef === input.syntheticE2eApprovalRef && Boolean(a.approvalRef.trim()) &&
    /^[a-f0-9]{64}$/.test(a.profileSha256);
}

const SOURCE_RIGHTS = ["can_create_source_events", "can_approve_source_stages", "can_approve_award",
  "can_upload_source_artifacts", "can_generate_sourcing_artifacts", "can_publish_sourcing_artifacts"] as const;
const PROGRAM_RIGHTS = ["financial_visibility", "can_admin_users", "can_create_programs", "can_approve_gates"] as const;

/** Only an unassigned viewer may be reconciled; a different Clerk link is never adopted. */
export async function reconcileUnboundSyntheticOperator(
  input: ProvisionInput, expected: UnboundOperatorPerson,
): Promise<ProvisionResult> {
  if (!hasSyntheticOperatorAuthority(input)) throw new Error("synthetic_operator_authority_refused");
  const connection = resolveDatabaseUrlCandidates()[0];
  if (!connection) throw new Error("synthetic_operator_connection_unavailable");
  return withAzureWriteTransaction(connection, async (query) => {
    const clerkLink = `clerk:${input.clerkUserId}`;
    const { rows: people } = await query(
      "SELECT id, name, email, role, primary_role, graph_node_id, updated_at, xmin::text AS revision_token FROM persons WHERE email = $1 OR graph_node_id = $2 FOR UPDATE",
      [input.syntheticE2eAuthority!.email, clerkLink],
    );
    const person = people[0];
    if (people.length !== 1 || !person || person.id !== expected.id ||
      person.email !== input.syntheticE2eAuthority!.email || person.role !== "client_viewer" ||
      person.primary_role !== "client_viewer" || !/^person_[a-z0-9_]+_[0-9]{13}$/.test(String(person.graph_node_id)) ||
      ["name", "email", "role", "primary_role", "graph_node_id"].some((key) => person[key] !== expected[key as keyof UnboundOperatorPerson]) ||
      !/^[0-9]+$/.test(String(expected.xmin)) || person.revision_token !== String(expected.xmin)) {
      throw new Error("synthetic_operator_prior_person_refused");
    }
    const { rows: memberships } = await query(
      "SELECT *, xmin::text AS revision_token FROM person_client_memberships WHERE person_id = $1 FOR UPDATE", [person.id],
    );
    const member = memberships[0];
    if (memberships.length !== 1 || !member || member.client_id !== input.clientId ||
      member.role !== "client_viewer" || member.access_level !== "program_viewer" ||
      PROGRAM_RIGHTS.some((key) => member[key] !== false) ||
      SOURCE_RIGHTS.some((key) => typeof member[key] !== "boolean") || !/^[0-9]+$/.test(String(member.revision_token))) {
      throw new Error("synthetic_operator_prior_membership_refused");
    }
    const { rows: participants } = await query(
      "SELECT id FROM engagement_participants WHERE user_id = $1 LIMIT 1", [person.id],
    );
    if (participants.length) throw new Error("synthetic_operator_existing_participant_refused");
    const personWrite = await query(
      "UPDATE persons SET graph_node_id = $1, updated_at = now() WHERE id = $2 AND graph_node_id = $3 AND primary_role::text = $4 AND role = $5 AND email = $6 AND name = $7 AND xmin::text = $8 RETURNING id",
      [clerkLink, person.id, expected.graph_node_id, expected.primary_role, expected.role, expected.email, expected.name, String(expected.xmin)],
    );
    if (personWrite.rows.length !== 1) throw new Error("synthetic_operator_person_cas_refused");
    const rights = [...PROGRAM_RIGHTS, ...SOURCE_RIGHTS];
    const predicates = rights.map((key, index) => `${key} IS NOT DISTINCT FROM $${index + 6}`).join(" AND ");
    const memberWrite = await query(
      "UPDATE person_client_memberships SET access_level = 'program_member', financial_visibility = true, can_admin_users = false, can_create_programs = true, can_approve_gates = true, " +
      SOURCE_RIGHTS.map((key) => `${key} = false`).join(", ") +
      ` WHERE id = $1 AND person_id = $2 AND client_id = $3 AND role::text = $4 AND access_level = $5 AND ${predicates} AND xmin::text = $${rights.length + 6} RETURNING id`,
      [member.id, person.id, input.clientId, member.role, member.access_level, ...rights.map((key) => member[key]), member.revision_token],
    );
    if (memberWrite.rows.length !== 1) throw new Error("synthetic_operator_membership_cas_refused");
    const audit = await query(
      "INSERT INTO admin_audit_log (client_id, actor_person_id, category, action, target_kind, target_id, summary, metadata) VALUES ($1, $2, 'auth', 'synthetic_e2e_operator.identity_bound', 'persons', $2, $3, $4::jsonb) RETURNING id",
      [input.clientId, person.id, "Unbound viewer reconciled under exact authenticated operator authority.", JSON.stringify({
        clerkUserId: input.clerkUserId, clerkPersonLink: clerkLink, approvalRef: input.syntheticE2eApprovalRef,
        profileSha256: input.syntheticE2eAuthority!.profileSha256, authoritySource: input.syntheticE2eAuthority!.source,
        programScope: "assigned_programs_only", accessLevel: "program_member", reconciliationVersion: 1,
        priorPerson: expected, priorMembership: member,
        mutationScope: "same person ID and one client membership; no participant, Move or draft write",
      })],
    );
    if (audit.rows.length !== 1) throw new Error("synthetic_operator_audit_refused");
    const sb = getAzureWriteFluentClient();
    const { data: afterPerson, error: personReadError } = await sb.from("persons")
      .select("id, graph_node_id, primary_role").eq("id", person.id).maybeSingle();
    const { data: afterMember, error: memberReadError } = await sb.from("person_client_memberships")
      .select("*").eq("id", member.id).maybeSingle();
    if (personReadError || memberReadError || afterPerson?.id !== person.id ||
      afterPerson?.graph_node_id !== clerkLink || afterPerson?.primary_role !== "client_viewer" ||
      afterMember?.person_id !== person.id || afterMember?.client_id !== input.clientId ||
      afterMember?.role !== "client_viewer" || afterMember?.access_level !== "program_member" ||
      afterMember?.financial_visibility !== true || afterMember?.can_create_programs !== true ||
      afterMember?.can_approve_gates !== true || afterMember?.can_admin_users !== false ||
      SOURCE_RIGHTS.some((key) => afterMember?.[key] !== false)) {
      throw new Error("synthetic_operator_reconciliation_readback_refused");
    }
    return { personId: expected.id, role: "client_viewer", accessLevel: "program_member" };
  });
}
