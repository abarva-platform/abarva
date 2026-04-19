import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/intake/charter/[id]/approve
//
// Body: { decision: 'approve' | 'reject', rejection_reason?: string }
//
// Clerk-gated: authenticated userId must be listed in
// charter.approval_required_from OR have role === 'admin'.
// ─────────────────────────────────────────────────────────────────────────────

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "charter id required" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    decision?: string;
    rejection_reason?: string;
  };

  const decision = body.decision;
  if (decision !== "approve" && decision !== "reject") {
    return Response.json(
      { error: "decision must be 'approve' or 'reject'" },
      { status: 400 },
    );
  }
  if (decision === "reject" && !body.rejection_reason?.trim()) {
    return Response.json(
      { error: "rejection_reason required when rejecting" },
      { status: 400 },
    );
  }

  let userId: string | null = null;
  let role: string | null = null;
  try {
    const session = await auth();
    userId = session?.userId ?? null;
    role =
      (session?.sessionClaims?.publicMetadata as { role?: string } | undefined)
        ?.role ?? null;
  } catch {
    // fall through to 401
  }
  if (!userId) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: "storage unavailable" }, { status: 503 });
  }

  const { data: charter, error: fetchErr } = await sb
    .from("engagement_charters")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return Response.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!charter) {
    return Response.json({ error: "charter not found" }, { status: 404 });
  }

  const isAdmin = role === "admin";
  const approvers = Array.isArray(
    (charter as { approval_required_from?: string[] }).approval_required_from,
  )
    ? ((charter as { approval_required_from?: string[] })
        .approval_required_from as string[])
    : [];
  if (!isAdmin && !approvers.includes(userId)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> =
    decision === "approve"
      ? {
          status: "approved",
          approved_by: userId,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        }
      : {
          status: "rejected",
          rejection_reason: body.rejection_reason!.trim(),
          approved_by: null,
          approved_at: null,
        };

  const { data: updated, error: updateErr } = await sb
    .from("engagement_charters")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 });
  }

  return Response.json({ charter: updated });
}
