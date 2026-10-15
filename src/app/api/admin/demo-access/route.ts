import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { evaluateDemoAccess, DEMO_VIDEO_IDS } from "@/lib/demo-library/policy";
import { PRIVATE_DEMO_HEADERS } from "@/lib/demo-library/server";
import { checkInviteRateLimit } from "@/lib/admin/invite-rate-limit";

export const dynamic = "force-dynamic";
const input = z.object({
  action: z.enum(["grant", "revoke"]),
  email: z.string().trim().toLowerCase().email().max(254),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const json = (error: string, status: number) =>
    Response.json({ error }, { status, headers: PRIVATE_DEMO_HEADERS });
  try {
    const actor = await currentUser();
    if (!actor) return json("unauthenticated", 401);
    if (!evaluateDemoAccess(actor).admin) return json("forbidden", 403);
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return json("invalid_origin", 403);
    if (!checkInviteRateLimit(`demo-grant:${actor.id}`).allowed)
      return json("rate_limited", 429);
    const parsed = input.safeParse(await request.json());
    if (!parsed.success) return json("invalid_request", 400);
    const { action, email, expiresAt } = parsed.data;
    const now = new Date();
    if (
      action === "grant" &&
      (!expiresAt ||
        Date.parse(expiresAt) <= now.getTime() ||
        Date.parse(expiresAt) > now.getTime() + 30 * 86400000)
    )
      return json("invalid_expiry", 400);
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    const existing = users.data[0];
    if (
      existing &&
      existing.primaryEmailAddress?.emailAddress.toLowerCase() !== email
    )
      return json("primary_email_required", 409);
    if (existing && evaluateDemoAccess(existing).admin)
      return json("admin_access_unchanged", 409);
    if (action === "revoke") {
      if (!existing) return json("not_found", 404);
      await clerk.users.updateUserMetadata(existing.id, {
        privateMetadata: {
          nexusDemoAccess: {
            enabled: false,
            email,
            revokedAt: now.toISOString(),
            revokedBy: actor.id,
          },
        },
      });
    } else {
      const grant = {
        enabled: true,
        email,
        expiresAt,
        grantedAt: now.toISOString(),
        grantedBy: actor.id,
        videoIds: [...DEMO_VIDEO_IDS],
      };
      if (existing)
        await clerk.users.updateUserMetadata(existing.id, {
          privateMetadata: { nexusDemoAccess: grant },
        });
      else
        await clerk.users.createUser({
          emailAddress: [email],
          skipPasswordRequirement: true,
          publicMetadata: {
            role: "external",
            accountType: "demo_viewer",
            moduleAccess: [],
          },
          privateMetadata: { nexusDemoAccess: grant },
        });
    }
    console.info("[demo-access]", {
      action,
      actorUserId: actor.id,
      targetUserId: existing?.id ?? "created",
      expiresAt: expiresAt ?? null,
    });
    return Response.json(
      {
        ok: true,
        action,
        email,
        expiresAt: action === "grant" ? expiresAt : null,
      },
      { headers: PRIVATE_DEMO_HEADERS },
    );
  } catch {
    return json("access_update_unavailable", 503);
  }
}
