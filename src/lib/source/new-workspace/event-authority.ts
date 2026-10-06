import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export type SourceEventActivationState = "request" | "active_event" | "closed_request";
export type SourceEventSolicitationMotion = "rfi" | "rfp";

export type SourceEventAuthority =
  | {
      kind: "available";
      activationState: SourceEventActivationState;
      solicitationMotion: SourceEventSolicitationMotion | null;
      acceptedByUserId: string | null;
      acceptedAt: string | null;
    }
  | { kind: "not_found" }
  | { kind: "unavailable" };

interface AuthorityRow {
  id: string;
  client_key: string;
  activation_state: unknown;
  solicitation_motion: unknown;
  solicitation_motion_accepted_by_user_id: unknown;
  solicitation_motion_accepted_at: unknown;
}

function nonempty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function resolveAuthority(row: AuthorityRow): SourceEventAuthority {
  const activation = row.activation_state;
  if (activation !== "request" && activation !== "active_event" && activation !== "closed_request") {
    return { kind: "unavailable" };
  }

  const motion = row.solicitation_motion;
  const acceptedByUserId = nonempty(row.solicitation_motion_accepted_by_user_id);
  const acceptedAt = nonempty(row.solicitation_motion_accepted_at);
  if (motion === null) {
    if (acceptedByUserId || acceptedAt) return { kind: "unavailable" };
    return {
      kind: "available",
      activationState: activation,
      solicitationMotion: null,
      acceptedByUserId: null,
      acceptedAt: null,
    };
  }
  if ((motion !== "rfi" && motion !== "rfp") || !acceptedByUserId || !acceptedAt) {
    return { kind: "unavailable" };
  }
  return {
    kind: "available",
    activationState: activation,
    solicitationMotion: motion,
    acceptedByUserId,
    acceptedAt,
  };
}

export async function readSourceEventAuthority(
  eventId: string,
  clientKey: string,
): Promise<SourceEventAuthority> {
  try {
    const { data, error } = await getAzureReadFluentClient()
      .from("source_events")
      .select("id,client_key,activation_state,solicitation_motion,solicitation_motion_accepted_by_user_id,solicitation_motion_accepted_at")
      .eq("id", eventId)
      .eq("client_key", clientKey)
      .maybeSingle();

    // Until the migration is approved and applied, this read fails closed.
    if (error) return { kind: "unavailable" };
    if (!data || (data as AuthorityRow).client_key !== clientKey) return { kind: "not_found" };
    return resolveAuthority(data as AuthorityRow);
  } catch {
    return { kind: "unavailable" };
  }
}
