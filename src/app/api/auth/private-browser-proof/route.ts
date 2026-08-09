import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";
import {
  getLaunchAccessProfile,
  isLaunchApprovedEmail,
} from "@/lib/auth/launch-access-server";
import {
  createPrivateBrowserProofSessionValue,
  PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
} from "@/lib/auth/private-browser-proof-session";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";

export const dynamic = "force-dynamic";

const ADMIN_PROOF_PHONE_POOL = [
  "+12025550190",
  "+12025550191",
  "+12025550192",
  "+12025550193",
  "+12025550194",
] as const;

function notFound() {
  return new NextResponse("Not Found", { status: 404 });
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function meridianAdminMetadata() {
  return {
    role: "client",
    clientId: "meridian",
    defaultClientId: "meridian",
    clientName: "Meridian Health",
    clientLocked: true,
    accountType: "meridian_health_demo_admin",
    moduleAccess: ["setup", "programs", "source", "intelligence", "tower"],
    tenantKey: "meridian_health_global",
    tenantName: "Meridian Health",
    allowedClientKeys: ["meridian"],
    visibleClientKeys: ["meridian"],
    tenantRoles: {
      meridian: "tenant_admin",
      "meridian-health": "tenant_admin",
      meridian_health_global: "tenant_admin",
    },
  };
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  return /^\+\d{10,15}$/.test(phone) ? phone : null;
}

interface MeridianClientRow {
  id: string;
  name: string | null;
  tenant_key: string | null;
  slug: string | null;
  industry_code: string | null;
}

async function ensureMeridianClientRow(): Promise<{
  ensured: boolean;
  created: boolean;
  row: MeridianClientRow | null;
  error?: string;
}> {
  const db = getAzureWriteFluentClient();
  const existing = await db
    .from("clients")
    .select("id, name, tenant_key, slug, industry_code")
    .or(
      [
        "tenant_key.eq.meridian_health_global",
        "tenant_key.eq.meridian",
        "tenant_key.eq.meridian-health",
        "slug.eq.meridian",
        "slug.eq.meridian-health",
        "name.eq.Meridian Health",
      ].join(","),
    )
    .limit(1);

  if (existing.error) {
    return {
      ensured: false,
      created: false,
      row: null,
      error: existing.error.message,
    };
  }

  const existingRows = Array.isArray(existing.data)
    ? (existing.data as MeridianClientRow[])
    : [];
  if (existingRows[0]) {
    return { ensured: true, created: false, row: existingRows[0] };
  }

  const inserted = await db
    .from("clients")
    .insert({
      name: "Meridian Health",
      legal_name: "Meridian Health",
      industry_code: "HEALTHCARE_IDN",
      tenant_key: "meridian_health_global",
      slug: "meridian",
    })
    .select("id, name, tenant_key, slug, industry_code")
    .single<MeridianClientRow>();

  if (inserted.error) {
    return {
      ensured: false,
      created: false,
      row: null,
      error: inserted.error.message,
    };
  }

  return {
    ensured: Boolean(inserted.data),
    created: Boolean(inserted.data),
    row: inserted.data ?? null,
  };
}

async function selectAvailableAdminProofPhoneNumber(
  clerk: ReturnType<typeof createClerkClient>,
): Promise<string | null> {
  for (const phoneNumber of ADMIN_PROOF_PHONE_POOL) {
    const existing = await clerk.users.getUserList({
      phoneNumber: [phoneNumber],
      limit: 1,
    });
    if (existing.data.length === 0) return phoneNumber;
  }
  return null;
}

export async function POST(request: Request) {
  if (process.env.ABARVA_PRIVATE_BROWSER_PROOF_ENABLED !== "1") {
    return notFound();
  }

  const expectedToken = process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN?.trim();
  if (!expectedToken) {
    return notFound();
  }

  const header = request.headers.get("authorization") ?? "";
  const presentedToken = header.replace(/^bearer\s+/i, "").trim();
  if (presentedToken !== expectedToken) {
    return unauthorized();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "clerk_not_configured" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email && !isLaunchApprovedEmail(email)) {
    return unauthorized();
  }
  const provisionAdmin = body?.provisionAdmin === true;

  const clerk = createClerkClient({ secretKey });
  const testingToken = await clerk.testingTokens
    .createTestingToken()
    .then((token) => token.token)
    .catch(() => null);

  if (!testingToken) {
    return NextResponse.json(
      { error: "testing_token_unavailable" },
      { status: 503 },
    );
  }

  if (!email) {
    return NextResponse.json({ testingToken });
  }

  const users = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  let user = users.data[0] ?? null;
  const launchProfile = getLaunchAccessProfile(email);
  const proofSessionCookie = await createPrivateBrowserProofSessionValue(
    email,
    900,
    launchProfile?.clientKey ?? "meridian",
  );
  if (body?.proofCookieOnly === true) {
    if (!proofSessionCookie) {
      return NextResponse.json(
        { error: "proof_session_unavailable" },
        { status: 503 },
      );
    }
    const response = NextResponse.json({
      ok: true,
      proofSessionCookie,
      proofSessionCookieName: PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
      clientKey: launchProfile?.clientKey ?? "meridian",
    });
    response.cookies.set(
      PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
      proofSessionCookie,
      {
        httpOnly: true,
        maxAge: 900,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    );
    return response;
  }
  if (provisionAdmin && email !== "admin@abarva.ai") {
    return unauthorized();
  }
  if (provisionAdmin && launchProfile?.clientKey !== "meridian") {
    return unauthorized();
  }
  const clientRow = provisionAdmin ? await ensureMeridianClientRow() : null;
  if (clientRow && !clientRow.ensured) {
    return NextResponse.json(
      { error: "meridian_client_row_unavailable", clientRow },
      { status: 503 },
    );
  }
  const requestedPhoneNumber = normalizePhone(body?.phoneNumber);
  const needsProofPhone =
    provisionAdmin && (!user || user.phoneNumbers.length === 0);
  const existingUserPhoneNumber =
    provisionAdmin && user?.phoneNumbers.length
      ? normalizePhone(user.phoneNumbers[0]?.phoneNumber)
      : null;
  const phoneNumber =
    requestedPhoneNumber ??
    (needsProofPhone
      ? await selectAvailableAdminProofPhoneNumber(clerk)
      : existingUserPhoneNumber);
  if (needsProofPhone && !phoneNumber) {
    return NextResponse.json(
      { error: "admin_proof_phone_pool_exhausted" },
      { status: 409 },
    );
  }
  if (!user && provisionAdmin) {
    user = await clerk.users.createUser({
      emailAddress: [email],
      phoneNumber: phoneNumber ? [phoneNumber] : undefined,
      skipLegalChecks: true,
      skipPasswordRequirement: true,
      publicMetadata: meridianAdminMetadata(),
    });
  } else if (user && provisionAdmin) {
    user = await clerk.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        ...meridianAdminMetadata(),
      },
    });
  }
  if (!user) {
    return NextResponse.json(
      { error: "proof_user_not_found" },
      { status: 404 },
    );
  }

  let phoneRecoveryFactor = false;
  let phoneRecoveryFactorError: string | null = null;
  if (provisionAdmin && phoneNumber) {
    try {
      const existingPhone = user.phoneNumbers.find(
        (phone) => phone.phoneNumber === phoneNumber,
      );
      if (existingPhone) {
        await clerk.phoneNumbers.updatePhoneNumber(existingPhone.id, {
          verified: true,
          primary: true,
          reservedForSecondFactor: false,
        });
        phoneRecoveryFactor = true;
      } else {
        await clerk.phoneNumbers.createPhoneNumber({
          userId: user.id,
          phoneNumber,
          verified: true,
          primary: true,
          reservedForSecondFactor: false,
        });
        phoneRecoveryFactor = true;
      }
    } catch {
      phoneRecoveryFactorError = "phone_factor_not_configured";
    }
  }

  const session = await clerk.sessions.createSession({ userId: user.id });
  const token = await clerk.sessions.getToken(session.id, undefined, 300);
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 300,
  });
  const response = NextResponse.json({
    ok: true,
    testingToken,
    signInTicket: signInToken.token,
    sessionId: session.id,
    sessionToken: token.jwt,
    proofSessionCookie,
    proofSessionCookieName: PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
    provisioned: provisionAdmin,
    adminMetadata: provisionAdmin ? meridianAdminMetadata() : null,
    clientRow,
    phoneRecoveryFactor,
    phoneRecoveryFactorError,
  });
  if (proofSessionCookie) {
    response.cookies.set(
      PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
      proofSessionCookie,
      {
        httpOnly: true,
        maxAge: 900,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    );
  }
  return response;
}
