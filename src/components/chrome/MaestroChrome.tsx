"use client";

import { usePathname } from "next/navigation";
import AbarvaNav from "@/components/AbarvaNav";
import { NexusTopNav } from "@/components/navigation/NexusTopNav";

// Shell-native surfaces render AppShell themselves — these routes bypass
// MaestroChrome's own AbarvaNav so it doesn't double-render with the AppRail.
// Entries are startsWith-matched so /admin/connectors also passes through.
const SHELL_SURFACE_PREFIXES = [
  "/admin",
  "/home",
  "/tower",
  "/source",
  "/intelligence",
  "/learn",
  "/strategic-moves",
  "/knowledge-preview",
] as const;

function isShellNativePath(pathname: string): boolean {
  return (
    SHELL_SURFACE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (pathname.startsWith("/tenant/") && pathname.includes("/tower"))
  );
}

export function MaestroChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  // Shell-native surfaces: mount NexusTopNav HERE, once, as part of this
  // persisted layout subtree, instead of inside each page's own AppShell.
  // AppShell (and the page it wraps) is swapped out on every client-side
  // navigation; MaestroChrome is not, because it lives inside the shared
  // (maestro) layout — so the nav (and its Clerk session state) now survives
  // navigation between shell-native routes instead of unmounting and
  // re-mounting with a blank/loading flash on every click.
  if (isShellNativePath(pathname)) {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <NexusTopNav />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  const activePage =
    pathname.startsWith("/admin") || pathname.startsWith("/platform/admin")
      ? "admin"
      : "dashboard";

  return (
    <div
      style={{ minHeight: "100vh", background: "#F7F2EA", color: "#171412" }}
    >
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <nav aria-label="Primary">
        <AbarvaNav activePage={activePage} />
      </nav>
      <main id="main-content">{children}</main>
    </div>
  );
}
