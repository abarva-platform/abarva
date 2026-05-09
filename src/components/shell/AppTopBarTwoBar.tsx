"use client";
// AppTopBarTwoBar — Option D · "Two-bar hybrid" variant.
//
// Black editorial context bar on top (mono uppercase, page sub-nav),
// 2px signal-blue accent rail, then a clean white nav bar with the
// canonical color logo + Home/Intelligence/Moves/Source/Tower +
// tenant context on the right. Mirrors the Intelligence CXO wireframe
// pattern shown in docs/training/intelligence-all-surfaces-cxo.html.

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { clearActiveClientContext } from "@/lib/auth/client-context-storage";
import { getVisibleNavItems } from "@/components/shell/topbar-nav-items";

const BRAND = {
  ink: "#000000",
  signalBlue: "#0066CC",
  amber: "#F59E0B",
  line: "#E5E7EB",
  muted: "#3D4454",
  faint: "#6B7280",
  hair: "rgba(255,255,255,0.10)",
};

interface Props {
  tenantName?: string;
  contextLine?: string;
  contextSubNav?: ReadonlyArray<{ label: string; href?: string; active?: boolean }>;
}

const DEFAULT_SUBNAV = [
  { label: "→ Operational Posture", active: true },
  { label: "→ Steward Voice" },
  { label: "→ Action Queue" },
  { label: "→ Recent Activity" },
  { label: "→ Panels" },
];

export function AppTopBarTwoBar({
  tenantName,
  contextLine = "Where You Stand and What to Do Next",
  contextSubNav = DEFAULT_SUBNAV,
}: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const signedIn = isLoaded && Boolean(user);
  const displayName =
    user?.fullName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")?.[0] ||
    "User";
  const navItems = signedIn ? getVisibleNavItems(user) : [];

  function handleSignOut() {
    clearActiveClientContext();
    void signOut(() => router.push("/"));
  }

  return (
    <header
      data-testid="app-top-bar-twobar"
      style={{ position: "sticky", top: 0, zIndex: 50, background: "white" }}
    >
      <style jsx global>{`
        .d-context-link { transition: color 140ms ease; }
        .d-context-link:hover { color: white !important; }
        .d-nav-link { transition: color 140ms ease; }
        .d-nav-link:hover { color: ${BRAND.ink} !important; }
      `}</style>

      {/* Editorial context bar (black) */}
      <div style={{ background: BRAND.ink, color: "white", padding: "14px 32px" }}>
        <div
          style={{
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            marginBottom: 6,
          }}
        >
          Home · {tenantName ? `${tenantName} · ` : ""}
          <span style={{ color: "white" }}>{contextLine}</span>
        </div>
        <div
          style={{
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            display: "flex",
            gap: 22,
            flexWrap: "wrap",
          }}
        >
          {contextSubNav.map((s, i) =>
            s.href ? (
              <Link
                key={i}
                href={s.href}
                className="d-context-link"
                style={{
                  color: s.active ? BRAND.amber : "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                }}
              >
                {s.label}
              </Link>
            ) : (
              <span
                key={i}
                style={{
                  color: s.active ? BRAND.amber : "rgba(255,255,255,0.55)",
                }}
              >
                {s.label}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Signal-blue accent rail */}
      <div style={{ height: 2, background: BRAND.signalBlue }} aria-hidden="true" />

      {/* White nav bar */}
      <div
        style={{
          background: "white",
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          borderBottom: `1px solid ${BRAND.line}`,
          gap: 36,
        }}
      >
        <Link href="/home" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/brand/abarva-logo.svg"
            alt="AbarVa"
            width={140}
            height={28}
            style={{ height: 28, width: "auto", display: "block" }}
            priority
          />
        </Link>

        {navItems.length > 0 ? (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              flex: 1,
              justifyContent: "center",
            }}
          >
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="d-nav-link"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    color: active ? BRAND.ink : BRAND.muted,
                    textDecoration: "none",
                    padding: "19px 0",
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
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 2,
                        background: BRAND.ink,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {signedIn ? (
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            style={{
              background: "transparent",
              border: `1px solid ${BRAND.line}`,
              color: BRAND.ink,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 14px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            Sign out · {displayName.split(" ")[0]}
          </button>
        ) : (
          <Link
            href="/sign-in"
            style={{
              border: `1px solid ${BRAND.line}`,
              borderRadius: 999,
              background: "white",
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
