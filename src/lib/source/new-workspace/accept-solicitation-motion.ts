import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

export type SolicitationMotion = "rfi" | "rfp";
export type MotionAcceptanceResult =
  | { ok: true; motion: SolicitationMotion; acceptedAt: string }
  | {
      ok: false;
      code:
        | "not_found"
        | "forbidden"
        | "wrong_stage"
        | "already_accepted"
        | "stale_decision"
        | "authority_unavailable";
    };

interface EventRow {
  id: string;
  client_key: string;
  activation_state: string;
  current_stage_key: string;
  created_by_user_id: string | null;
  solicitation_motion: string | null;
  solicitation_motion_accepted_by_user_id: string | null;
  solicitation_motion_accepted_at: string | null;
}

export async function acceptSolicitationMotion(input: {
  eventId: string;
  clientKey: string;
  actorUserId: string;
  isClientAdmin: boolean;
  motion: SolicitationMotion;
}): Promise<MotionAcceptanceResult> {
  if (
    !input.actorUserId.trim() ||
    (input.motion !== "rfi" && input.motion !== "rfp")
  ) {
    return { ok: false, code: "forbidden" };
  }
  const aliases = tenantAliasesFor(input.clientKey);
  if (aliases.length === 0) return { ok: false, code: "forbidden" };

  try {
    const db = getAzureWriteFluentClient();
    const { data, error } = await db
      .from("source_events")
      .select(
        "id,client_key,activation_state,current_stage_key,created_by_user_id,solicitation_motion,solicitation_motion_accepted_by_user_id,solicitation_motion_accepted_at",
      )
      .eq("id", input.eventId)
      .in("client_key", aliases)
      .maybeSingle<EventRow>();
    if (error) return { ok: false, code: "authority_unavailable" };
    if (!data || !aliases.includes(data.client_key))
      return { ok: false, code: "not_found" };
    if (!input.isClientAdmin && data.created_by_user_id !== input.actorUserId) {
      return { ok: false, code: "forbidden" };
    }
    if (
      data.activation_state !== "active_event" ||
      data.current_stage_key !== "rfp"
    ) {
      return { ok: false, code: "wrong_stage" };
    }
    if (
      data.solicitation_motion !== null ||
      data.solicitation_motion_accepted_by_user_id !== null ||
      data.solicitation_motion_accepted_at !== null
    ) {
      return { ok: false, code: "already_accepted" };
    }

    const acceptedAt = new Date().toISOString();
    const { data: written, error: writeError } = await db
      .from("source_events")
      .update({
        solicitation_motion: input.motion,
        solicitation_motion_accepted_by_user_id: input.actorUserId,
        solicitation_motion_accepted_at: acceptedAt,
      })
      .eq("id", data.id)
      .eq("client_key", data.client_key)
      .eq("activation_state", "active_event")
      .eq("current_stage_key", "rfp")
      .is("solicitation_motion", null)
      .is("solicitation_motion_accepted_by_user_id", null)
      .is("solicitation_motion_accepted_at", null)
      .select(
        "solicitation_motion,solicitation_motion_accepted_by_user_id,solicitation_motion_accepted_at",
      )
      .maybeSingle<
        Pick<
          EventRow,
          | "solicitation_motion"
          | "solicitation_motion_accepted_by_user_id"
          | "solicitation_motion_accepted_at"
        >
      >();
    if (writeError) return { ok: false, code: "authority_unavailable" };
    if (!written) return { ok: false, code: "stale_decision" };
    if (
      written.solicitation_motion !== input.motion ||
      written.solicitation_motion_accepted_by_user_id !== input.actorUserId ||
      !written.solicitation_motion_accepted_at
    ) {
      return { ok: false, code: "authority_unavailable" };
    }
    return {
      ok: true,
      motion: input.motion,
      acceptedAt: written.solicitation_motion_accepted_at,
    };
  } catch {
    return { ok: false, code: "authority_unavailable" };
  }
}
