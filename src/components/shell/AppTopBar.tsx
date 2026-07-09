"use client";
// AppTopBar — unified black top bar across the entire product.
//
// Founder-approved 2026-05-08: a single chrome surface for /home,
// /home/learn/*, /intelligence, /strategic-moves, /source, /tower,
// and any other route that mounts AppShell. This is the canonical
// implementation; the previously-shipped AppTopBarBlack is now a
// thin re-export pointing here.
//
// Spec:
// - True black bar (#000000), 64px tall, sticky, z-index 50
// - 28px AbarVa Option 2 compact nav lockup
// - Centered nav · client context sits quietly before Home
// - Module nav inactive items at 72% white · active = white raised pill
// - Right rail: Learn, avatar + first name + Sign-out
// - All colors from the locked brand kit (no green / teal in chrome)
//
// Backward-compat: the legacy props (showLocked, context, timeString)
// are accepted but unused — they were status-rail params on the
// pre-redesign bar. AppShell still passes them; a follow-up cleanup
// can drop them once no caller relies on them.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { getVisibleNavItems } from "@/components/shell/topbar-nav-items";
import { useClientContext } from "@/lib/use-client-context";
import { canonicalClientDisplayName, demoSafeClientText } from "@/lib/client-config";
import { AdminInboxTopNavBadge } from "@/components/shell/AdminInboxTopNavBadge";

export interface AppTopBarProps {
  tenantName?: string;
  preserveTenantName?: boolean;
  /** Hide the product nav entirely (used by sign-out / error chrome). */
  showProductNav?: boolean;
  /** @deprecated retained for AppShell call-site compat; unused in v2. */
  showLocked?: boolean;
  /** @deprecated retained for AppShell call-site compat; unused in v2. */
  context?: string;
  /** @deprecated retained for AppShell call-site compat; unused in v2. */
  timeString?: string;
}

const BRAND = {
  ink: "#000000",
  signalBlue: "#0066CC",
  hair: "rgba(255,255,255,0.10)",
  textMute: "rgba(255,255,255,0.72)",
  textStrong: "rgba(255,255,255,0.92)",
  activePillShadow:
    "0 0 0 1px rgba(255,255,255,0.95), 0 8px 22px rgba(34,174,234,0.28)",
};

const OPTION2_NAV_LOGO =
  "/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-compact.svg";

function userDisplayName(user: ReturnType<typeof useUser>["user"]): string {
  const firstName = user?.firstName?.trim();
  const lastName = user?.lastName?.trim();
  const explicitPersonName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fallback =
    explicitPersonName ||
    user?.fullName?.split("·")[0]?.trim() ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")?.[0] ||
    "User";

  return demoSafeClientText(fallback).trim() || "User";
}

function shouldPreferTenantOverUserAlias(displayName: string): boolean {
  return /\b(?:demo|agent)\b/i.test(displayName);
}

export function AppTopBar({
  tenantName,
  preserveTenantName = false,
  showProductNav = true,
}: AppTopBarProps = {}) {
  const pathname = usePathname() ?? "";
  const { isLoaded, user } = useUser();
  const signOut = useSignOut();
  const { currentClient } = useClientContext();
  const signedIn = isLoaded && Boolean(user);
  const resolvedTenantNameRaw = preserveTenantName
    ? (tenantName ?? currentClient?.name ?? null)
    : (tenantName ? canonicalClientDisplayName({ name: tenantName }) : null) ??
      canonicalClientDisplayName({
        key: currentClient?.id,
        name: currentClient?.name,
      }) ??
      tenantName ??
      currentClient?.name ??
      null;
  const resolvedTenantName = resolvedTenantNameRaw
    ? preserveTenantName
      ? resolvedTenantNameRaw
      : demoSafeClientText(resolvedTenantNameRaw)
    : null;
  const userName = userDisplayName(user);
  const displayName =
    preserveTenantName && resolvedTenantName && shouldPreferTenantOverUserAlias(userName)
      ? resolvedTenantName
      : userName;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const navItems = showProductNav && signedIn ? getVisibleNavItems(user) : [];
  const learnActive =
    pathname === "/home/learn" || pathname.startsWith("/home/learn/");

  function handleSignOut() {
    void signOut();
  }

  return (
    <header
      data-testid="app-top-bar"
      style={{
        background: BRAND.ink,
        color: "white",
        height: 64,
        // 3-column grid so the product nav is TRUE-centered in the bar
        // (Snowflake-style), independent of brand/right-rail widths. The 1fr
        // side columns reserve space so the three groups can never overlap —
        // the collision that ran the tenant name into the old tagline.
        //
        // minmax(0, 1fr) (not bare 1fr) on the side columns: a bare `1fr`
        // track's implicit minimum is its content's min-content size, which
        // for nowrap nav/user-chip text is its full rendered width — so at
        // narrower viewports the grid refused to shrink the side columns and
        // instead overflowed, running the last nav item (Tower) into the
        // right rail's first item (Learn) as unclipped, overlapping text
        // (regression found 2026-07-09 live-browser polish audit). Explicit
        // `minmax(0, ...)` lets the side columns actually shrink toward 0 so
        // their own `overflow: hidden` + `minWidth: 0` can do its job.
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        alignItems: "center",
        gap: 24,
        padding: "0 32px",
        borderBottom: `1px solid ${BRAND.hair}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <style jsx global>{`
        .app-top-bar__nav-link {
          transition:
            background 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }
        .app-top-bar__nav-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white !important;
        }
        .app-top-bar__nav-link[aria-current="page"]:hover {
          background: white;
          color: #050505 !important;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          justifySelf: "start",
        }}
      >
        <Link
          href="/home"
          aria-label="AbarVa Home"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <Image
            src={OPTION2_NAV_LOGO}
            alt="AbarVa"
            width={142}
            height={32}
            style={{ height: 28, width: "auto", display: "block" }}
            priority
          />
        </Link>
        {/* Active-client context sits beside the brand (left), so the product
            nav can be dead-centered in the bar. */}
        {signedIn && resolvedTenantName && (
          <>
            <span
              aria-hidden="true"
              style={{
                width: 1,
                height: 16,
                background: BRAND.hair,
                marginLeft: 4,
              }}
            />
            <span
              title={resolvedTenantName}
              aria-label={`Active client ${resolvedTenantName}`}
              style={{
                display: "inline-block",
                maxWidth: 210,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
                fontSize: 13,
                fontStyle: "italic",
                fontWeight: 600,
                color: "rgba(255,255,255,0.82)",
                letterSpacing: "0.01em",
              }}
            >
              {resolvedTenantName}
            </span>
          </>
        )}
      </div>

      {navItems.length > 0 && (
        <nav
          aria-label="Product modules"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            justifySelf: "center",
          }}
        >
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <a
                key={item.key}
                href={item.href}
                className="app-top-bar__nav-link"
                aria-current={active ? "page" : undefined}
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 13.5,
                  fontWeight: active ? 750 : 500,
                  color: active ? "#050505" : BRAND.textMute,
                  background: active ? "white" : "transparent",
                  boxShadow: active ? BRAND.activePillShadow : "none",
                  borderRadius: 7,
                  textDecoration: "none",
                  padding: "0 12px",
                  minHeight: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  letterSpacing: 0,
                  position: "relative",
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          justifySelf: "end",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {signedIn && (
          <Link
            href="/home/learn"
            data-nav-key="learn"
            aria-current={learnActive ? "page" : undefined}
            className="app-top-bar__nav-link"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              fontWeight: learnActive ? 750 : 600,
              letterSpacing: 0,
              color: learnActive ? "#050505" : BRAND.textStrong,
              background: learnActive ? "white" : "transparent",
              boxShadow: learnActive ? BRAND.activePillShadow : "none",
              borderRadius: 7,
              textDecoration: "none",
              padding: "0 12px",
              minHeight: 34,
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            Learn
          </Link>
        )}
        {signedIn && <AdminInboxTopNavBadge />}
        {/* While Clerk is still resolving the session, auth state is
            indeterminate — render neither chip nor "Sign in" (a signed-in user
            briefly seeing "Sign in" reads as being logged out; audit F4). */}
        {!isLoaded ? null : signedIn ? (
          <>
            <div
              title={displayName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingRight: 14,
                borderRight: `1px solid ${BRAND.hair}`,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 10.5,
                  fontWeight: 700,
                  border: `1px solid ${BRAND.hair}`,
                }}
              >
                {initials || "U"}
              </span>
              <span
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: BRAND.textStrong,
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "white",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 999,
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            style={{
              border: "1px solid rgba(255,255,255,0.20)",
              borderRadius: 999,
              background: "transparent",
              color: "white",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 14px",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
