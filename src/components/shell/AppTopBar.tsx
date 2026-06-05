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
// - Right rail: Learn, Product, avatar + first name + Sign-out
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
import { canonicalClientDisplayName } from "@/lib/client-config";
import { AdminInboxTopNavBadge } from "@/components/shell/AdminInboxTopNavBadge";

export interface AppTopBarProps {
  tenantName?: string;
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
  activePillShadow: "0 0 0 1px rgba(255,255,255,0.95), 0 8px 22px rgba(34,174,234,0.28)",
};

const OPTION2_NAV_LOGO =
  "/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-compact.svg";

export function AppTopBar({ tenantName, showProductNav = true }: AppTopBarProps = {}) {
  const pathname = usePathname() ?? "";
  const { isLoaded, user } = useUser();
  const signOut = useSignOut();
  const { currentClient } = useClientContext();
  const signedIn = isLoaded && Boolean(user);
  const resolvedTenantName =
    canonicalClientDisplayName({ key: currentClient?.id, name: tenantName ?? currentClient?.name }) ??
    tenantName ??
    currentClient?.name ??
    null;
  const displayName =
    user?.fullName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")?.[0] ||
    "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const navItems = showProductNav && signedIn ? getVisibleNavItems(user) : [];
  const learnActive = pathname === "/home/learn" || pathname.startsWith("/home/learn/");
  const productActive = pathname === "/product" || pathname.startsWith("/product/");

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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // Minimum spacing between the three groups (brand · module nav ·
        // right rail) so they can never overlap under width pressure — the
        // collision that ran the tenant name into the old tagline.
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
          transition: background 140ms ease, color 140ms ease, box-shadow 140ms ease;
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flexShrink: 0 }}>
        <Link
          href="/home"
          aria-label="AbarVa Home"
          style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
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
      </div>

      {navItems.length > 0 && (
        <nav aria-label="Product modules" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {signedIn && resolvedTenantName && (
            <>
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
                  padding: "22px 12px 22px 0",
                  transform: "translateY(1px)",
                }}
              >
                {resolvedTenantName}
              </span>
              <span
                aria-hidden="true"
                style={{
                  width: 1,
                  height: 16,
                  background: BRAND.hair,
                  marginRight: 2,
                }}
              />
            </>
          )}
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

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
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
        {signedIn && (
          <Link
            href="/product"
            data-nav-key="product"
            aria-current={productActive ? "page" : undefined}
            className="app-top-bar__nav-link"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              fontWeight: productActive ? 750 : 600,
              letterSpacing: 0,
              color: productActive ? "#050505" : BRAND.textStrong,
              background: productActive ? "white" : "transparent",
              boxShadow: productActive ? BRAND.activePillShadow : "none",
              borderRadius: 7,
              textDecoration: "none",
              padding: "0 12px",
              minHeight: 34,
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              marginRight: 2,
            }}
          >
            Product
          </Link>
        )}
        {signedIn && <AdminInboxTopNavBadge />}
        {signedIn ? (
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
