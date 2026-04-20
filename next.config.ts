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
      { source: '/admin', destination: '/platform', permanent: true },
      { source: '/dashboard', destination: '/home', permanent: true },
      { source: '/dashboard/:path*', destination: '/home/:path*', permanent: true },
      { source: '/data', destination: '/platform/data', permanent: true },
      { source: '/data/:path*', destination: '/platform/data/:path*', permanent: true },
      { source: '/users', destination: '/platform/users', permanent: true },
      { source: '/users/:path*', destination: '/platform/users/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
