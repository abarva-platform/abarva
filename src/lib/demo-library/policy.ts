export const DEMO_VIDEO_IDS = ["executive", "full"] as const;
export type DemoVideoId = (typeof DEMO_VIDEO_IDS)[number];

export interface DemoIdentity {
  id: string;
  primaryEmailAddressId?: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification?: { status: string } | null;
  }>;
  publicMetadata?: unknown;
  privateMetadata?: unknown;
  unsafeMetadata?: unknown;
}

export interface DemoAccess {
  allowed: boolean;
  admin: boolean;
  videoIds: DemoVideoId[];
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function isDemoVideoId(value: unknown): value is DemoVideoId {
  return typeof value === "string" && DEMO_VIDEO_IDS.some((id) => id === value);
}

export function evaluateDemoAccess(
  user: DemoIdentity | null,
  now = new Date(),
  trustedPlatformAdmin = false,
): DemoAccess {
  const denied: DemoAccess = { allowed: false, admin: false, videoIds: [] };
  if (!user) return denied;
  const primary = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  if (!primary || primary.verification?.status !== "verified") return denied;
  if (trustedPlatformAdmin || record(user.publicMetadata).role === "admin")
    return { allowed: true, admin: true, videoIds: [...DEMO_VIDEO_IDS] };
  const grant = record(record(user.privateMetadata).nexusDemoAccess);
  const expires =
    typeof grant.expiresAt === "string" ? Date.parse(grant.expiresAt) : NaN;
  const granted =
    typeof grant.grantedAt === "string" ? Date.parse(grant.grantedAt) : NaN;
  if (
    grant.enabled !== true ||
    typeof grant.email !== "string" ||
    grant.email.toLowerCase() !== primary.emailAddress.toLowerCase() ||
    !Number.isFinite(expires) ||
    expires <= now.getTime() ||
    !Number.isFinite(granted) ||
    granted > now.getTime() ||
    typeof grant.grantedBy !== "string" ||
    !grant.grantedBy.trim() ||
    !Array.isArray(grant.videoIds) ||
    !grant.videoIds.length ||
    !grant.videoIds.every(isDemoVideoId)
  )
    return denied;
  return {
    allowed: true,
    admin: false,
    videoIds: [...new Set(grant.videoIds)],
  };
}

export function isDemoVisitorRoute(pathname: string): boolean {
  return (
    [
      "/",
      "/demo",
      "/auth-redirect",
      "/signed-out",
      "/api/auth/demo-viewer",
      "/api/request-access",
    ].includes(pathname) ||
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    /^\/api\/demo-video\/(executive|full)$/.test(pathname)
  );
}

export function isDemoRequestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  // ACA may expose an internal request URL; only the exact public app origin is an alternative.
  return (
    origin === new URL(request.url).origin || origin === "https://app.abarva.ai"
  );
}

export function parseVideoRange(
  value: string | null,
  size: number,
): { start: number; end: number } | null {
  if (value === null) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (
    !match ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    (!match[1] && !match[2])
  )
    throw new Error("invalid_range");
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if (
    (first !== null && !Number.isSafeInteger(first)) ||
    (last !== null && !Number.isSafeInteger(last))
  )
    throw new Error("invalid_range");
  if (first === null) {
    if (last === null || last <= 0) throw new Error("invalid_range");
    return { start: Math.max(0, size - last), end: size - 1 };
  }
  if (first >= size || (last !== null && last < first))
    throw new Error("invalid_range");
  return { start: first, end: Math.min(last ?? size - 1, size - 1) };
}
