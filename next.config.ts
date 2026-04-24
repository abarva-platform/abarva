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
      // Intelligence preview remains the primary shell while the canonical
      // pattern pages keep filling out. Programs and Tower now resolve
      // through their own route handlers so legacy URLs can redirect into
      // tenant-scoped seeded surfaces without looping through /preview/*.
      { source: '/intelligence', destination: '/preview/intelligence', permanent: false },
      // Legacy sponsor URLs now land on the person profile route instead of
      // dumping users into the programs preview shell.
      { source: '/sponsor/:path*', destination: '/persons/:path*', permanent: false },
      { source: '/intelligence/thread/:path*', destination: '/preview/intelligence', permanent: false },
      // NOTE · /tower/projects, /tower/staff-aug, /tower/tech-stack,
      // /tower/volumetrics, /tower/preview, /tower/onboard/* are legitimate
      // Tower sub-surfaces with their own content and stay live.
    ];
  },
};

export default nextConfig;
