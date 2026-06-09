import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PhaseGateActorResolution =
  | { ok: true; personId: string }
  | {
      ok: false;
      error: "person_row_required";
      detail: string;
    };

type LookupPersonIdByEmailForClient = (
  email: string,
  clientId: string,
) => Promise<string | null>;

async function lookupPersonIdByEmailForClient(
  email: string,
  clientId: string,
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const sb = getAzureReadFluentClient();
  const { data: person, error: personError } = await sb
    .from("persons")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (personError) throw personError;

  const personId = (person as { id?: string | null } | null)?.id ?? null;
  if (!personId) return null;

  const { data: membership, error: membershipError } = await sb
    .from("person_client_memberships")
    .select("person_id")
    .eq("person_id", personId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (membershipError) throw membershipError;

  return (
    (membership as { person_id?: string | null } | null)?.person_id ?? null
  );
}

export async function resolvePhaseGateActorPersonId(
  ctx: TenancyCtx,
  opts: { lookup?: LookupPersonIdByEmailForClient } = {},
): Promise<PhaseGateActorResolution> {
  if (UUID_PATTERN.test(ctx.userId)) {
    return { ok: true, personId: ctx.userId };
  }

  const email = ctx.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return {
      ok: false,
      error: "person_row_required",
      detail:
        "Phase-gate writes require a tenant-scoped persons row because the audit columns are UUID-backed.",
    };
  }

  const personId = await (opts.lookup ?? lookupPersonIdByEmailForClient)(
    email,
    ctx.clientId,
  );
  if (personId) {
    return { ok: true, personId };
  }

  return {
    ok: false,
    error: "person_row_required",
    detail: `No tenant-scoped persons row was found for ${email}; provision the operator/buyer persona before advancing this Move.`,
  };
}
