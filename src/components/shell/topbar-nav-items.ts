// Shared nav-item registry for the AppTopBar and its variants
// (AppTopBarBlack / AppTopBarEditorial / AppTopBarTwoBar).
//
// Single source of truth for the canonical 5-item nav: Home,
// Intelligence, Moves, Source, Tower. Each variant pulls items from
// here and just changes presentation.

import type { useUser } from "@clerk/nextjs";
import { resolveModuleAccess, type ProductModule } from "@/lib/auth/module-access";

export type CockpitNavItem = {
  key: "home" | ProductModule;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  module?: ProductModule;
};

export const NAV_ITEMS: CockpitNavItem[] = [
  {
    // CL-1 (2026-05-30) · Top-nav "Home" now lands on the Trust Plane
    // at /admin (the consolidated Setup/Admin surface from Waves 1–3 of
    // the Setup/Admin Trust Plane consolidation). The parallel /home
    // landing was orphaned (rendered the retired 2026-05-08 fixture
    // design) and is being removed. The real /home/<subpage> routes
    // (queue, decision, source, learn, ai-initiatives, configuration,
    // training) are preserved as legitimate surfaces.
    //
    // See docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md §2 (IA — three
    // nav systems coexist).
    key: "home",
    label: "Home",
    href: "/admin",
    match: (pathname) =>
      pathname === "/" ||
      pathname === "/home" ||
      pathname.startsWith("/home/") ||
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
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

export function getVisibleNavItems(
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
