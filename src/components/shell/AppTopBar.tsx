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
// getAtriumProductNavLabel was used to source the 'Strategic Moves'
// label dynamically; H1b inlines 'Moves' per Home Refinement Package
// canonical nav. Re-import if the dynamic label is needed again.
import { AbarVaLogo } from "@/components/abarva/AbarVaLogo";

export interface AppTopBarProps {
  tenantName?: string;
  showLocked?: boolean;
  context?: string;
  timeString?: string;
  showProductNav?: boolean;
}

type CockpitNavItem = {
  key: "home" | ProductModule;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  module?: ProductModule;
};

// H1b (2026-05-07) · Canonical 5-item nav per Home Refinement Package
// NAV_REORGANIZATION.md. Order: Home · Intelligence · Moves · Source ·
// Tower. PR-H1 updated AbarvaNav, but the actual rendered nav on
// /home / /strategic-moves / /tower etc. is AppTopBar — this fixes it.
//
// Removed: 'setup' (folds into Home; /admin/* 301→/home/* via proxy),
// 'learn' (now /home/learn — accessible via Home panel grid), 'product'
// (marketing surface, not a tenant nav item).
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
      pathname.startsWith("/dashboard/") ||
      // Old /admin/* redirects to /home/* via proxy; if anything still
      // bookmarks /admin, surface "Home" as active in the brief moment
      // before the 301 fires.
      pathname.startsWith("/admin"),
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
    key: "programs",
    // Package label is 'Moves' (URL stays /strategic-moves for SEO).
    // getAtriumProductNavLabel('programs') returns 'Strategic Moves';
    // override here for the canonical 5-item nav.
    label: "Moves",
    href: "/strategic-moves",
    module: "programs",
    match: (pathname) =>
      pathname === "/strategic-moves" ||
      pathname.startsWith("/strategic-moves/") ||
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
    key: "tower",
    label: "Tower",
    href: "/tower",
    module: "tower",
    match: (pathname) =>
      pathname === "/tower" ||
      pathname.startsWith("/tower/") ||
      (pathname.startsWith("/tenant/") && pathname.includes("/tower")),
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
        background: "#ffffff",
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
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
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
            grid-template-areas:
              "brand account"
              "nav nav" !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 10px 16px 8px !important;
          }

          .app-top-bar__left {
            display: contents !important;
          }

          .app-top-bar__brand {
            grid-area: brand !important;
          }

          .app-top-bar__nav {
            grid-area: nav !important;
            width: 100% !important;
            padding-bottom: 2px !important;
          }

          .app-top-bar__account {
            grid-area: account !important;
            position: static !important;
          }

          .app-top-bar__account-name {
            display: none !important;
          }
        }

        .app-top-bar__nav {
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
        }

        .app-top-bar__nav::-webkit-scrollbar {
          display: none;
        }

        .app-top-bar__nav-link {
          scroll-snap-align: center;
          outline: none;
          transition:
            color 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .app-top-bar__nav-link:hover {
          color: ${SHELL.INK} !important;
          background: rgba(12, 26, 58, 0.045);
        }

        .app-top-bar__nav-link:focus-visible,
        .app-top-bar__sign-out:focus-visible,
        .app-top-bar__sign-in:focus-visible {
          outline: 2px solid #0b4a91;
          outline-offset: 3px;
          box-shadow: 0 0 0 5px rgba(11, 74, 145, 0.14);
        }

        @media (prefers-reduced-motion: reduce) {
          .app-top-bar__nav-link {
            transition: none;
          }
        }

        @media (max-width: 960px) {
          .app-top-bar {
            gap: 12px !important;
            padding-inline: 18px !important;
          }

          .app-top-bar__left {
            gap: 14px !important;
          }

          .app-top-bar__nav {
            max-width: calc(100vw - 294px);
            mask-image: linear-gradient(
              90deg,
              transparent 0,
              #000 16px,
              #000 calc(100% - 16px),
              transparent 100%
            );
          }

          .app-top-bar__account-name {
            max-width: 112px !important;
          }
        }

        @media (max-width: 720px) {
          .app-top-bar__nav {
            max-width: 100%;
            mask-image: linear-gradient(
              90deg,
              #000 0,
              #000 calc(100% - 22px),
              transparent 100%
            );
          }
        }

        @media (max-width: 430px) {
          .app-top-bar__sign-out-text {
            display: none;
          }

          .app-top-bar__sign-out {
            width: 34px;
            height: 34px;
            padding: 0 !important;
          }

          .app-top-bar__sign-out::before {
            content: "Out";
            font-size: 10px;
            letter-spacing: 0.04em;
          }
        }
      `}</style>
      <div
        className="app-top-bar__left"
        style={{ display: "flex", alignItems: "center", gap: 22, minWidth: 0 }}
      >
        <Link
          className="app-top-bar__brand"
          href="/home"
          aria-label="AbarVa Home"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <AbarVaLogo
            variant="wordmark"
            size="md"
            label="AbarVa"
            style={{ height: 26, width: 'auto' }}
          />
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
                  className="app-top-bar__nav-link"
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
                    WebkitTapHighlightColor: "transparent",
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
                  background: "rgba(12, 26, 58, 0.07)",
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
              className="app-top-bar__sign-out"
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
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
              <span className="app-top-bar__sign-out-text">Sign out</span>
            </button>
          </>
        ) : (
          <Link
            className="app-top-bar__sign-in"
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
