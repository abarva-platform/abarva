import { clerkClient } from "@clerk/nextjs/server";
import { checkInviteRateLimit } from "@/lib/admin/invite-rate-limit";
import { isDemoRequestOriginAllowed } from "@/lib/demo-library/policy";
import {
  PRIVATE_DEMO_HEADERS,
  evaluateDemoUser,
} from "@/lib/demo-library/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const json = (error: string, status: number) =>
    Response.json({ error }, { status, headers: PRIVATE_DEMO_HEADERS });
  if (!isDemoRequestOriginAllowed(request)) return json("invalid_origin", 403);
  // This per-instance throttle complements Clerk's provider-side OTP limits.
  if (!checkInviteRateLimit("demo-viewer-bootstrap").allowed)
    return json("rate_limited", 429);
  try {
    const body: unknown = await request.json();
    const email =
      body &&
      typeof body === "object" &&
      "email" in body &&
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      return json("invalid_email", 400);
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    const user = users.data[0];
    const primary = user?.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    if (
      !user ||
      primary?.emailAddress.toLowerCase() !== email ||
      !evaluateDemoUser(user).allowed
    )
      return json("demo_access_not_approved", 403);
    return Response.json({ ok: true }, { headers: PRIVATE_DEMO_HEADERS });
  } catch {
    return json("demo_access_unavailable", 503);
  }
}
