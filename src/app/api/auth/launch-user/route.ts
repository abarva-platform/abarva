import { NextResponse } from "next/server";
import { ensureLaunchAccessClerkUser } from "@/lib/auth/launch-user-provisioning";

export const dynamic = "force-dynamic";

interface LaunchUserRequestBody {
  email?: string;
}

function statusForError(error: string): number {
  if (error === "access_not_provisioned") return 403;
  if (error === "clerk_not_configured") return 503;
  if (error === "clerk_user_provisioning_failed") return 502;
  return 500;
}

export async function POST(request: Request) {
  let body: LaunchUserRequestBody;

  try {
    body = (await request.json()) as LaunchUserRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_request_body" }, { status: 400 });
  }

  const result = await ensureLaunchAccessClerkUser(body.email);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: statusForError(result.error) },
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    role: result.profile.role,
    clientKey: result.profile.clientKey ?? null,
  });
}
