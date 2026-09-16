// Shared nav-item registry for the canonical NEXUS top navigation.
//
// Single source of truth for the canonical product nav: Home,
// Intelligence, Moves, Source Optimize, Source New, Tower. Routes stay stable even when
// labels evolve: the Home command center is still served from /home.

import type { useUser } from "@clerk/nextjs";
import {
  resolveModuleAccess,
  type ProductModule,
} from "@/lib/auth/module-access";

export type CockpitNavItem = {
  key: "home" | "source-new" | ProductModule;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  module?: ProductModule;
};

export const NAV_ITEMS: CockpitNavItem[] = [
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
    label: "Source Optimize",
    href: "/source",
    module: "source",
    match: (pathname) =>
      (pathname === "/source" || pathname.startsWith("/source/")) &&
      pathname !== "/source/new" &&
      !pathname.startsWith("/source/new/") &&
      pathname !== "/source/events" &&
      !pathname.startsWith("/source/events/"),
  },
  {
    key: "source-new",
    label: "Source New",
    href: "/source/new",
    module: "source",
    match: (pathname) =>
      pathname === "/source/new" ||
      pathname.startsWith("/source/new/") ||
      pathname === "/source/events" ||
      pathname.startsWith("/source/events/"),
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
