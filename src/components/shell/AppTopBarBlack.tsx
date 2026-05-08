"use client";
// AppTopBarBlack — Option B · "Executive cockpit" variant.
//
// True black bar (#000000), canonical inverse logo (white "Abar" +
// signal-blue "Va"), signal-blue active accent, mono status rail.
// All colors from the locked brand kit (no green, no teal in chrome).

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { clearActiveClientContext } from "@/lib/auth/client-context-storage";
import { getVisibleNavItems } from "@/components/shell/topbar-nav-items";

const BRAND = {
  ink: "#000000",
  signalBlue: "#0066CC",
  hair: "rgba(255,255,255,0.10)",
  textMute: "rgba(255,255,255,0.72)",
  textFaint: "rgba(255,255,255,0.55)",
  textStrong: "rgba(255,255,255,0.92)",
};

interface Props {
  tenantName?: string;
}

export function AppTopBarBlack({ tenantName }: Props) {
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
      data-testid="app-top-bar-black"
      style={{
        background: BRAND.ink,
        color: "white",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: `1px solid ${BRAND.hair}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <style jsx global>{`
        .b-nav-link { transition: color 140ms ease; }
        .b-nav-link:hover { color: white !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 36, minWidth: 0 }}>
        <Link href="/home" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/brand/abarva-logo-inverse.svg"
            alt="AbarVa"
            width={140}
            height={28}
            style={{ height: 28, width: "auto", display: "block" }}
            priority
          />
        </Link>

        {tenantName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: BRAND.textFaint,
              paddingLeft: 28,
              borderLeft: `1px solid ${BRAND.hair}`,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: BRAND.signalBlue,
                boxShadow: "0 0 0 3px rgba(0,102,204,0.22)",
              }}
            />
            <span>{tenantName} · Live</span>
          </div>
        )}
      </div>

      {navItems.length > 0 && (
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.key}
                href={item.href}
                className="b-nav-link"
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
                      height: 2,
                      background: BRAND.signalBlue,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
