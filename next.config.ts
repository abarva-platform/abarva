import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk'],

  // Product-map · legacy paths redirect to their new homes under the
  // five-item nav. Admin sub-pages (/admin/brief, /admin/outcomes, etc.)
  // still resolve where they are — the consolidation of those sub-pages
  // under /platform/* is a separate refactor (they lack /platform/*
  // counterparts today, so a blanket redirect would break them).
  async redirects() {
    return [
      // Admin: top-level → Platform overview. Sub-pages → /platform/admin/*
      // (the old Engagement Hub surfaces stay reachable there).
      { source: '/admin', destination: '/platform', permanent: true },
      { source: '/admin/:path*', destination: '/platform/admin/:path*', permanent: true },
      { source: '/dashboard', destination: '/home', permanent: true },
      { source: '/dashboard/:path*', destination: '/home/:path*', permanent: true },
      { source: '/data', destination: '/platform/data', permanent: true },
      { source: '/data/:path*', destination: '/platform/data/:path*', permanent: true },
      { source: '/users', destination: '/platform/users', permanent: true },
      { source: '/users/:path*', destination: '/platform/users/:path*', permanent: true },
      // Product-map spec: engagement console lives at /engagements/[id].
      // Keep the /engage/* path alive via 308 for bookmarks + prior links.
      { source: '/engage/:path*', destination: '/engagements/:path*', permanent: true },
      // Wave-2 surface migration. The new Nexus chat-first Programs shell
      // and the Atlas-rail Control Tower live under /preview/* until the
      // canonical routes are fully migrated. Redirect the BASE paths only —
      // sub-routes like /engagements/[id], /tower/projects, /programs/new
      // are still live and handle their own content. Use 307 (not permanent)
      // so we can flip back once the canonical routes are replaced wholesale.
      { source: '/engagements', destination: '/preview/programs', permanent: false },
      { source: '/programs', destination: '/preview/programs', permanent: false },
      { source: '/tower', destination: '/preview/tower', permanent: false },
      { source: '/intelligence', destination: '/preview/intelligence', permanent: false },
      // Legacy-route sweep · every deep path under the old surfaces now
      // redirects to the canonical preview surface. The "engagement"
      // concept is retired wholesale; users never see an engagement URL.
      // Tenant-scoped paths (/tenant/{slug}/...) are untouched — those
      // are the canonical product routes.
      { source: '/engagements/:path*', destination: '/preview/programs', permanent: false },
      { source: '/programs/:path*', destination: '/preview/programs', permanent: false },
      { source: '/sponsor/:path*', destination: '/preview/programs', permanent: false },
      { source: '/intelligence/thread/:path*', destination: '/preview/intelligence', permanent: false },
      // NOTE · /tower/projects, /tower/staff-aug, /tower/tech-stack,
      // /tower/volumetrics, /tower/preview, /tower/onboard/* are legitimate
      // Tower sub-surfaces with their own content. Only the exact /tower
      // root redirects (above); sub-paths stay live.
    ];
  },
};

export default nextConfig;
