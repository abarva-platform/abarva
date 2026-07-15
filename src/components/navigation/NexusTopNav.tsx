"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { demoSafeClientText } from "@/lib/client-config";
import { AdminInboxTopNavBadge } from "@/components/shell/AdminInboxTopNavBadge";
import { getVisibleNavItems, type CockpitNavItem } from "@/components/shell/topbar-nav-items";
import styles from "./NexusTopNav.module.css";

export interface NexusTopNavProps {
  /**
   * Retained for AppShell call-site compatibility. Tenant/client names are no
   * longer rendered in the global brand area by design.
   */
  tenantName?: string;
  preserveTenantName?: boolean;
  /** Hide the product nav entirely (used by sign-out / error chrome). */
  showProductNav?: boolean;
  /** @deprecated retained for AppShell call-site compat; unused in NEXUS nav. */
  showLocked?: boolean;
  /** @deprecated retained for AppShell call-site compat; unused in NEXUS nav. */
  context?: string;
  /** @deprecated retained for AppShell call-site compat; unused in NEXUS nav. */
  timeString?: string;
}

const NEXUS_NAV_LOCKUP = "/brand/nexus/abarva-nexus-navbar-dark-clearance.svg";

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

function initialsFor(displayName: string): string {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}

function navLinkClass(active: boolean): string {
  return active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;
}

function NavLinks({
  items,
  pathname,
  mobile = false,
}: {
  items: CockpitNavItem[];
  pathname: string;
  mobile?: boolean;
}) {
  return (
    <>
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <a
            key={`${mobile ? "mobile" : "desktop"}-${item.key}`}
            href={item.href}
            className={navLinkClass(active)}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </>
  );
}

export function NexusTopNav({ showProductNav: showProductNavProp = true }: NexusTopNavProps = {}) {
  const pathname = usePathname() ?? "";
  const { isLoaded, user } = useUser();
  const signOut = useSignOut();
  const signedIn = isLoaded && Boolean(user);
  // NexusTopNav is now mounted once in MaestroChrome's persisted layout
  // subtree (not per-page), so a page can no longer pass showProductNav
  // directly. The Setup landing page is the only current caller that wants
  // product nav hidden, so that one case is handled here by exact route
  // instead — every other /admin/* subpage still wants it shown.
  const showProductNav = showProductNavProp && pathname !== "/admin";
  const navItems = showProductNav && signedIn ? getVisibleNavItems(user) : [];
  const displayName = userDisplayName(user);
  const initials = initialsFor(displayName);

  function handleSignOut() {
    void signOut();
  }

  return (
    <header className={styles.root} data-testid="nexus-top-nav">
      <div className={styles.brandSlot}>
        <a href="/home" className={styles.brandLink} aria-label="AbarVa NEXUS Knowledge">
          <Image
            src={NEXUS_NAV_LOCKUP}
            alt="AbarVa NEXUS"
            width={240}
            height={37}
            className={styles.brandImage}
            priority
          />
        </a>
      </div>

      {navItems.length > 0 ? (
        <nav className={styles.primaryNav} aria-label="Primary" data-testid="nexus-primary-nav">
          <div className={styles.desktopLinks}>
            <NavLinks items={navItems} pathname={pathname} />
          </div>
          <details className={styles.mobileMenu}>
            <summary className={styles.mobileSummary}>Menu</summary>
            <div className={styles.mobilePanel}>
              <NavLinks items={navItems} pathname={pathname} mobile />
            </div>
          </details>
        </nav>
      ) : (
        <span aria-hidden="true" />
      )}

      <div className={styles.actions}>
        {signedIn && <AdminInboxTopNavBadge />}
        {!isLoaded ? (
          <span className={styles.loadingSkeleton} aria-hidden="true" />
        ) : signedIn ? (
          <>
            <div className={styles.userCluster} aria-label={`Signed in as ${displayName}`}>
              <span className={styles.avatar} aria-hidden="true">
                {initials}
              </span>
              <span className={styles.displayName} title={displayName}>
                {displayName}
              </span>
            </div>
            <button type="button" className={styles.signOutButton} onClick={handleSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <Link href="/sign-in" className={styles.authLink}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
