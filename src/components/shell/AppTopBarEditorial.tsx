"use client";
// AppTopBarEditorial — Option C · "Editorial paper masthead" variant.
//
// Paper bg (#faf7f1), canonical color logo, vertical divider, mono
// eyebrow + Fraunces italic tagline, dot-marker active state. All
// colors from the locked brand kit.

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { clearActiveClientContext } from "@/lib/auth/client-context-storage";
import { getVisibleNavItems } from "@/components/shell/topbar-nav-items";

const BRAND = {
  ink: "#000000",
  signalBlue: "#0066CC",
  paper: "#faf7f1",
  paperLine: "#DCD8D0",
  paperLineMid: "#C9C5BD",
  muted: "#3D4454",
  faint: "#6B7280",
};

interface Props {
  tenantName?: string;
}

export function AppTopBarEditorial({ tenantName }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const signedIn = isLoaded && Boolean(user);
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
  const navItems = signedIn ? getVisibleNavItems(user) : [];

  function handleSignOut() {
    clearActiveClientContext();
    void signOut(() => router.push("/"));
  }

  return (
    <header
      data-testid="app-top-bar-editorial"
      style={{
        background: BRAND.paper,
        borderBottom: `1px solid ${BRAND.paperLine}`,
        padding: "10px 32px",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 32,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <style jsx global>{`
        .c-nav-link { transition: color 140ms ease; }
        .c-nav-link:hover { color: ${BRAND.ink} !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/home" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/brand/abarva-logo.svg"
            alt="AbarVa"
            width={124}
            height={32}
            style={{ height: 32, width: "auto", display: "block" }}
            priority
          />
        </Link>
        <div style={{ width: 1, height: 22, background: BRAND.paperLineMid }} aria-hidden="true" />
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12.5,
            fontWeight: 500,
            color: BRAND.muted,
            letterSpacing: "-0.005em",
          }}
        >
          AI Success Platform
        </div>
      </div>

      {navItems.length > 0 ? (
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.key}
                href={item.href}
                className="c-nav-link"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? BRAND.ink : BRAND.muted,
                  textDecoration: "none",
                  padding: "8px 0",
                  letterSpacing: "-0.005em",
                  position: "relative",
                }}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: -2,
                      width: 4,
                      height: 4,
                      background: BRAND.signalBlue,
                      borderRadius: "50%",
                      transform: "translateX(-50%)",
                    }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : (
        <div />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {tenantName && (
          <div
            style={{
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: BRAND.faint,
              paddingRight: 14,
              borderRight: `1px solid ${BRAND.paperLine}`,
            }}
          >
            Tenant ·{" "}
            <strong style={{ color: BRAND.ink, fontWeight: 700 }}>{tenantName}</strong>
          </div>
        )}
        {signedIn ? (
          <>
            <div title={displayName} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: BRAND.ink,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {initials || "U"}
              </span>
              <span
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: BRAND.ink,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName.split(" ")[0]}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              style={{
                background: "transparent",
                border: `1px solid ${BRAND.ink}`,
                color: BRAND.ink,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 14px",
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
              border: `1px solid ${BRAND.ink}`,
              background: "transparent",
              color: BRAND.ink,
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
