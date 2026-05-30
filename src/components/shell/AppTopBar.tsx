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
// - 22px AbarVa wordmark (Claude / ChatGPT scale)
// - Hairline divider, then compact handwritten "AI Success Platform"
//   tagline — quiet supporting note, not a second logo
// - Centered nav · client context sits quietly before Home
// - Module nav inactive items at 72% white · active = full white
//   + 600 weight + 3px signal-blue underline
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
};

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
        .app-top-bar__nav-link { transition: color 140ms ease; }
        .app-top-bar__nav-link:hover { color: white !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flexShrink: 0 }}>
        <Link
          href="/home"
          aria-label="AbarVa Home"
          style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
        >
          <Image
            src="/brand/abarva-logo-inverse.svg"
            alt="AbarVa"
            width={85}
            height={22}
            style={{ height: 22, width: "auto", display: "block" }}
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
                  fontWeight: active ? 600 : 500,
                  color: active ? "white" : BRAND.textMute,
                  textDecoration: "none",
                  padding: "22px 14px",
                  letterSpacing: "-0.005em",
                  position: "relative",
                }}
                >
                  {item.label}
                  {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      bottom: 0,
                      height: 3,
                      background: BRAND.signalBlue,
                      borderRadius: 2,
                    }}
                    />
                  )}
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
            aria-current={pathname === "/home/learn" || pathname.startsWith("/home/learn/") ? "page" : undefined}
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: pathname === "/home/learn" || pathname.startsWith("/home/learn/") ? "white" : BRAND.textStrong,
              textDecoration: pathname === "/home/learn" || pathname.startsWith("/home/learn/") ? "underline" : "none",
              textDecorationColor: BRAND.signalBlue,
              textUnderlineOffset: 6,
              padding: "22px 0",
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
            aria-current={pathname === "/product" || pathname.startsWith("/product/") ? "page" : undefined}
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: pathname === "/product" || pathname.startsWith("/product/") ? "white" : BRAND.textStrong,
              textDecoration: pathname === "/product" || pathname.startsWith("/product/") ? "underline" : "none",
              textDecorationColor: BRAND.signalBlue,
              textUnderlineOffset: 6,
              padding: "22px 0",
              whiteSpace: "nowrap",
              marginRight: 2,
            }}
          >
            Product
          </Link>
        )}
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
