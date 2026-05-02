"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { SHELL } from "@/lib/shell/shell-tokens";
import { clearActiveClientContext } from "@/lib/auth/client-context-storage";
import {
  resolveModuleAccess,
  type ProductModule,
} from "@/lib/auth/module-access";

export interface AppTopBarProps {
  tenantName?: string;
  showLocked?: boolean;
  context?: string;
  timeString?: string;
  showProductNav?: boolean;
}

type CockpitNavItem = {
  key: "home" | ProductModule | "learn";
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  module?: ProductModule;
};

const NAV_ITEMS: CockpitNavItem[] = [
  {
    key: "home",
    label: "Home",
    href: "/home",
    match: (pathname) =>
      pathname === "/" ||
      pathname === "/home" ||
      pathname.startsWith("/home/") ||
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/"),
  },
  {
    key: "setup",
    label: "Setup",
    href: "/admin",
    module: "setup",
    match: (pathname) =>
      pathname.startsWith("/admin") ||
      pathname.startsWith("/platform/admin") ||
      pathname === "/platform",
  },
  {
    key: "programs",
    label: "Programs",
    href: "/programs",
    module: "programs",
    match: (pathname) =>
      pathname === "/programs" ||
      pathname.startsWith("/programs/") ||
      pathname === "/engagements" ||
      pathname.startsWith("/engagements/") ||
      (pathname.startsWith("/tenant/") && pathname.includes("/programs")),
  },
  {
    key: "source",
    label: "Source",
    href: "/source",
    module: "source",
    match: (pathname) =>
      pathname === "/source" || pathname.startsWith("/source/"),
  },
  {
    key: "intelligence",
    label: "Intelligence",
    href: "/intelligence",
    module: "intelligence",
    match: (pathname) =>
      pathname === "/intelligence" ||
      pathname.startsWith("/intelligence/") ||
      (pathname.startsWith("/tenant/") && pathname.includes("/intelligence")),
  },
  {
    key: "tower",
    label: "Tower",
    href: "/tower",
    module: "tower",
    match: (pathname) =>
      pathname === "/tower" ||
      pathname.startsWith("/tower/") ||
      (pathname.startsWith("/tenant/") && pathname.includes("/tower")),
  },
  {
    key: "learn",
    label: "Learn",
    href: "/learn",
    match: (pathname) =>
      pathname === "/learn" || pathname.startsWith("/learn/"),
  },
];

function getVisibleNavItems(
  user: ReturnType<typeof useUser>["user"],
): CockpitNavItem[] {
  if (!user) return [];
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    null;
  const moduleAccess = resolveModuleAccess({
    role: user.publicMetadata?.role as string | undefined,
    email,
    publicMetadata: user.publicMetadata as
      | Record<string, unknown>
      | null
      | undefined,
  });
  return NAV_ITEMS.filter(
    (item) => !item.module || moduleAccess.modules.includes(item.module),
  );
}

export function AppTopBar({ showProductNav = true }: AppTopBarProps) {
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
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const navItems = showProductNav && signedIn ? getVisibleNavItems(user) : [];

  function handleSignOut() {
    clearActiveClientContext();
    void signOut(() => router.push("/"));
  }

  return (
    <header
      className="app-top-bar"
      data-testid="app-top-bar"
      style={{
        minHeight: 58,
        background: "#FBFAF7",
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        padding: "0 clamp(16px, 3vw, 34px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
        boxShadow: "0 10px 28px rgba(12, 26, 58, 0.045)",
      }}
    >
      <style jsx global>{`
        @media (max-width: 720px) {
          .app-top-bar {
            min-height: 104px !important;
            align-items: flex-start !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            padding: 10px 16px 8px !important;
          }

          .app-top-bar__left {
            flex: 1 1 100% !important;
            width: 100% !important;
            flex-wrap: wrap !important;
            gap: 8px 14px !important;
            padding-right: 190px !important;
          }

          .app-top-bar__nav {
            order: 2 !important;
            flex: 1 1 100% !important;
            width: 100% !important;
            margin-right: -190px !important;
            padding-bottom: 2px !important;
          }

          .app-top-bar__account {
            position: absolute !important;
            right: 16px !important;
            top: 12px !important;
          }

          .app-top-bar__account-name {
            max-width: 92px !important;
          }
        }
      `}</style>
      <div
        className="app-top-bar__left"
        style={{ display: "flex", alignItems: "center", gap: 22, minWidth: 0 }}
      >
        <Link
          href="/home"
          aria-label="AbarVa Home"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: SHELL.INK,
            fontFamily: SHELL.SERIF,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          AbarVa
        </Link>

        {navItems.length > 0 ? (
          <nav
            className="app-top-bar__nav"
            aria-label="Product modules"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-nav-key={item.key}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    minHeight: 38,
                    padding: "0 11px",
                    borderRadius: 0,
                    color: active ? SHELL.INK : SHELL.INK_SOFT,
                    fontFamily: SHELL.SANS,
                    fontSize: 14,
                    fontWeight: active ? 700 : 560,
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 11,
                        right: 11,
                        bottom: 1,
                        height: 2,
                        borderRadius: 999,
                        background: SHELL.INK,
                      }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>

      <div
        className="app-top-bar__account"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        {signedIn ? (
          <>
            <div
              title={displayName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                minWidth: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#E8E2D8",
                  color: SHELL.INK,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SHELL.SANS,
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {initials || "U"}
              </span>
              <span
                className="app-top-bar__account-name"
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  fontWeight: 600,
                  maxWidth: 172,
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
              style={{
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 999,
                background: "#FFFFFF",
                color: SHELL.INK,
                cursor: "pointer",
                fontFamily: SHELL.SANS,
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1,
                padding: "8px 12px",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 999,
              background: "#FFFFFF",
              color: SHELL.INK,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1,
              padding: "8px 12px",
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
